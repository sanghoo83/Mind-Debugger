import { useMemo, useState } from 'react'
import { DISTORTIONS, distortionById } from '../distortions.js'
import { formatRelative } from '../store.js'
import { suggest, debugReport, estimateEvidence } from '../parser.js'
import { hurtById } from '../emotions.js'
import { useI18n } from '../i18n.jsx'
import RecoveryFlow from './RecoveryFlow.jsx'
import InstantParse from './InstantParse.jsx'

const HOT_THRESHOLD = 7 // 이 강도 이상이면 분석 전에 마음 먼저(Recovery)를 거친다.

// Step 2~3, 5: 캡처된 사실에서 추측을 분리하고, 대안 해석을 적고, 액션 여부를 결정한다.
export default function ParseView({ store, profile }) {
  const { t } = useI18n()
  const inbox = store.entries.filter(e => !e.parsedAt)
  const [activeId, setActiveId] = useState(null)

  // 인박스가 아닌 전체에서 찾는다 — 저장 직후(파싱됨) 리포트가 떠 있는 동안에도
  // 에디터가 언마운트되지 않아야 하기 때문.
  const active = store.entries.find(e => e.id === activeId)

  if (active) {
    return <ParseEditor key={active.id} entry={active} store={store} profile={profile} onDone={() => setActiveId(null)} />
  }

  if (inbox.length === 0) {
    return (
      <div className="view">
        <div className="empty">
          <p>{t('parse.emptyTitle')}</p>
          <p className="help">{t('parse.emptyHelp')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="view">
      <section className="card">
        <h2>{t('parse.inboxTitle')} <span className="count">{inbox.length}</span></h2>
          <p className="help">{t('parse.inboxHelp')}</p>
          <ul className="entry-list">
            {inbox.map(e => (
              <li key={e.id} className="entry-row clickable" onClick={() => setActiveId(e.id)}>
                <div className="entry-main">
                  <span className="entry-fact">{e.fact}</span>
                  <span className="entry-sub">
                    {e.source && <span className="source-chip">{e.source}</span>}
                    {formatRelative(e.createdAt, t)} · {t('capture.intensityShort', { n: e.intensity })}
                  </span>
                </div>
                <span className="link">{t('parse.parseLink')}</span>
              </li>
            ))}
          </ul>
      </section>
    </div>
  )
}

// 파싱 직후 출력되는 점수 카드 — 감정의 세기와 증거의 세기를 나란히 보여준다.
function ReportCard({ report, fact, onClose }) {
  const { t, locale } = useI18n()
  const verdict = report.action?.needed && report.action.note
    ? t('report.verdictAction', { note: report.action.note })
    : report.evidence <= 3 && report.tags.length > 0
      ? t('report.verdictDrop')
      : t('report.verdictLetGo')

  return (
    <div className="view">
      <section className="card report-card">
        <p className="report-title">{t('report.title')}</p>
        <p className="report-fact">{fact}</p>

        <div className="meter-row">
          <span className="meter-label">{t('report.intensity')}</span>
          <div className="meter-track">
            <div className="meter-fill warn" style={{ width: `${report.intensity * 10}%` }} />
          </div>
          <span className="meter-num">{report.intensity}/10</span>
        </div>
        <div className="meter-row">
          <span className="meter-label">{t('report.evidence')}</span>
          <div className="meter-track">
            <div className="meter-fill" style={{ width: `${report.evidence * 10}%` }} />
          </div>
          <span className="meter-num">{report.evidence}/10</span>
        </div>

        <p className="report-line">
          {t('report.counts', { a: report.assumptionCount, q: report.questionCount })}
          {report.evidence !== report.parserEstimate && <> · {t('report.parserEst', { n: report.parserEstimate })}</>}
        </p>

        {report.controllable && (
          <p className="report-line report-control">{t('report.control', { text: report.controllable })}</p>
        )}

        <p className="report-line">
          {report.tags.length === 0
            ? t('report.noneDetected')
            : <>{t('report.detected')}: {report.tags.map(tg => (
                <span key={tg} className="report-tag">{distortionById[tg]?.label[locale] ?? tg}</span>
              ))}</>}
        </p>

        {report.gap > 0 && (
          <p className={`report-line ${report.gap >= 4 ? 'report-gap-high' : ''}`}>
            {t('report.gap', { i: report.intensity, e: report.evidence, g: report.gap })}
          </p>
        )}

        <p className="report-verdict">{verdict}</p>

        {/* 증거는 바닥인데 감정만 높을 때 — 상상 속 문제 경고 */}
        {report.evidence <= 3 && report.gap >= 5 ? (
          <div className="report-warning">
            <p className="warning-head">{t('report.warningHead')}</p>
            <p className="warning-body">{t('report.warningBody')}</p>
            <button className="primary warning-yes" onClick={onClose}>{t('report.warningYes')}</button>
          </div>
        ) : (
          <button className="primary" onClick={onClose}>{t('report.close')}</button>
        )}
      </section>
    </div>
  )
}

function ParseEditor({ entry, store, profile, onDone }) {
  const { t, locale } = useI18n()
  const [assumptions, setAssumptions] = useState([{ id: crypto.randomUUID(), text: '', tags: [] }])
  const [alternatives, setAlternatives] = useState([''])
  const [missingInfo, setMissingInfo] = useState([''])
  const [evidenceScore, setEvidenceScore] = useState(null) // null = 아직 직접 안 매김 → 파서 추정 사용
  const [controllable, setControllable] = useState('')
  const [actionNeeded, setActionNeeded] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [report, setReport] = useState(null)
  // 뜨거운 캡처는 공감 단계를 먼저 통과한다. 식은 캡처는 바로 분석.
  const [recovered, setRecovered] = useState(entry.intensity < HOT_THRESHOLD)
  // 기본 = 즉시 분해(InstantParse). 'manual' = 직접 뜯어보는 깊은 폼.
  const [mode, setMode] = useState('instant')

  const liveEstimate = estimateEvidence({
    assumptions: assumptions.filter(a => a.text.trim()),
    alternatives: alternatives.filter(v => v.trim()),
    missingInfo: missingInfo.filter(v => v.trim()),
  })

  const suggestion = useMemo(
    () => suggest(entry.fact, store.entries, entry.id),
    [entry.fact, entry.id, store.entries]
  )

  const updateAssumption = (id, patch) => {
    setAssumptions(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)))
  }

  const toggleTag = (id, tagId) => {
    setAssumptions(prev => prev.map(a => {
      if (a.id !== id) return a
      const tags = a.tags.includes(tagId) ? a.tags.filter(tg => tg !== tagId) : [...a.tags, tagId]
      return { ...a, tags }
    }))
  }

  // 제안 채택: 첫 빈 칸이 있으면 거기를 채우고, 없으면 새 항목으로 추가한다.
  const fillOrAppend = (setList, value) => {
    setList(prev => {
      if (prev.includes(value)) return prev
      const emptyIdx = prev.findIndex(v => !v.trim())
      if (emptyIdx >= 0) return prev.map((v, i) => (i === emptyIdx ? value : v))
      return [...prev, value]
    })
  }

  const adoptTrap = (trap) => {
    const text = trap.text[locale]
    setAssumptions(prev => {
      if (prev.some(a => a.text === text)) return prev
      const item = { id: crypto.randomUUID(), text, tags: trap.tags }
      const emptyIdx = prev.findIndex(a => !a.text.trim())
      if (emptyIdx >= 0) return prev.map((a, i) => (i === emptyIdx ? { ...a, ...item, id: a.id } : a))
      return [...prev, item]
    })
  }

  const questionToAction = (q) => {
    setActionNeeded(true)
    setActionNote(prev => (prev.trim() ? `${prev} / ${q}` : q))
  }

  const save = () => {
    const parsed = {
      assumptions: assumptions.filter(a => a.text.trim()).map(a => ({ ...a, text: a.text.trim() })),
      alternatives: alternatives.map(v => v.trim()).filter(Boolean),
      missingInfo: missingInfo.map(v => v.trim()).filter(Boolean),
      evidenceScore: evidenceScore ?? liveEstimate,
      controllable: controllable.trim(),
      action: actionNeeded === null
        ? null
        : { needed: actionNeeded, note: actionNote.trim(), done: false },
    }
    store.saveParse(entry.id, parsed)
    setReport(debugReport({ intensity: entry.intensity, ...parsed }))
  }

  const canSave = assumptions.some(a => a.text.trim()) || actionNeeded !== null

  if (!recovered) {
    return (
      <RecoveryFlow
        entry={entry}
        store={store}
        profile={profile}
        onAnalyze={() => setRecovered(true)}
        onClose={onDone}
      />
    )
  }

  if (mode === 'instant' && !report) {
    return (
      <InstantParse
        entry={entry}
        store={store}
        onManual={() => setMode('manual')}
        onDone={onDone}
      />
    )
  }

  if (report) {
    return <ReportCard report={report} fact={entry.fact} onClose={onDone} />
  }

  const hurt = entry.hurt ? hurtById[entry.hurt] : null

  return (
    <div className="view">
      <button className="link back" onClick={onDone}>{t('parse.back')}</button>

      <section className="card fact-banner">
        <span className="label">FACT</span>
        <p className="fact-text">{entry.fact}</p>
        {hurt && (
          <p className="real-pain inline">{t('recovery.realPain')}<strong>{hurt.label[locale]}</strong></p>
        )}
        <span className="entry-sub">
          {entry.source && <span className="source-chip">{entry.source}</span>}
          {formatRelative(entry.createdAt, t)} · {t('parse.capturedIntensity', { n: entry.intensity })}
        </span>
      </section>

      {suggestion && (
        <section className="card suggest-card">
          <h2>
            {t('parse.suggestTitle')}
            <span className="count">{suggestion.rule.name[locale]}</span>
          </h2>
          {suggestion.pastCount > 0 && (
            <p className="help">
              {t('parse.suggestHistory', { n: suggestion.pastCount, avg: suggestion.avgIntensity })}
              {suggestion.fadedPct !== null && (
                <> · {t('parse.suggestFaded', { m: suggestion.recheckedCount, pct: suggestion.fadedPct })}</>
              )}
            </p>
          )}
          <div className="suggest-row">
            <span className="suggest-label">{t('parse.suggestTraps')}</span>
            <div className="tag-row">
              {suggestion.rule.traps.map(trap => (
                <button key={trap.text[locale]} type="button" className="tag suggest-trap" onClick={() => adoptTrap(trap)}>
                  ⚠ {trap.text[locale]}
                </button>
              ))}
            </div>
          </div>
          <div className="suggest-row">
            <span className="suggest-label">{t('parse.suggestAlts')}</span>
            <div className="tag-row">
              {suggestion.rule.alternatives[locale].map(alt => (
                <button key={alt} type="button" className="tag" onClick={() => fillOrAppend(setAlternatives, alt)}>
                  + {alt}
                </button>
              ))}
            </div>
          </div>
          <div className="suggest-row">
            <span className="suggest-label">{t('parse.suggestQuestions')}</span>
            <div className="tag-row">
              {suggestion.rule.questions[locale].map(q => (
                <button key={q} type="button" className="tag" onClick={() => fillOrAppend(setMissingInfo, q)}>
                  ? {q}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <h2>{t('parse.step2Title')}</h2>
        <p className="help">{t('parse.step2Help')}</p>
        {assumptions.map((a, i) => (
          <div key={a.id} className="assumption-block">
            <input
              type="text"
              value={a.text}
              onChange={e => updateAssumption(a.id, { text: e.target.value })}
              placeholder={i === 0 ? t('parse.assumptionPlaceholder') : t('parse.assumptionMore')}
            />
            {a.text.trim() && (
              <div className="tag-row">
                {DISTORTIONS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    title={d.hint[locale]}
                    className={`tag ${a.tags.includes(d.id) ? 'on' : ''}`}
                    onClick={() => toggleTag(a.id, d.id)}
                  >
                    {d.label[locale]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          className="link"
          onClick={() => setAssumptions(prev => [...prev, { id: crypto.randomUUID(), text: '', tags: [] }])}
        >
          {t('parse.addAssumption')}
        </button>
      </section>

      <section className="card">
        <h2>{t('parse.step25Title')}</h2>
        <p className="help">{t('parse.step25Help')}</p>
        {missingInfo.map((q, i) => (
          <div key={i} className="question-row">
            <input
              type="text"
              value={q}
              onChange={e => setMissingInfo(prev => prev.map((v, j) => (j === i ? e.target.value : v)))}
              placeholder={i === 0 ? t('parse.questionPlaceholder') : t('parse.questionMore')}
            />
            {q.trim() && (
              <button type="button" className="link" onClick={() => questionToAction(q.trim())}>
                {t('parse.toAction')}
              </button>
            )}
          </div>
        ))}
        <button className="link" onClick={() => setMissingInfo(prev => [...prev, ''])}>
          {t('parse.addQuestion')}
        </button>
      </section>

      <section className="card">
        <h2>{t('parse.step3Title')}</h2>
        <p className="help">{t('parse.step3Help')}</p>
        {alternatives.map((alt, i) => (
          <input
            key={i}
            type="text"
            value={alt}
            onChange={e => setAlternatives(prev => prev.map((v, j) => (j === i ? e.target.value : v)))}
            placeholder={i === 0 ? t('parse.altPlaceholder') : t('parse.altMore')}
          />
        ))}
        <button className="link" onClick={() => setAlternatives(prev => [...prev, ''])}>
          {t('parse.addAlt')}
        </button>
      </section>

      <section className="card">
        <h2>{t('parse.evidenceTitle')}</h2>
        <p className="help">{t('parse.evidenceHelp')}</p>
        <label className="intensity evidence-row">
          {t('parse.evidenceLabel')} <strong>{evidenceScore ?? liveEstimate}</strong>
          <input
            type="range"
            min="0"
            max="10"
            value={evidenceScore ?? liveEstimate}
            onChange={e => setEvidenceScore(Number(e.target.value))}
          />
          <span className="evidence-hint">{t('parse.evidenceHint', { n: liveEstimate })}</span>
        </label>
      </section>

      <section className="card">
        <h2>{t('parse.controlTitle')}</h2>
        <p className="help">{t('parse.controlHelp')}</p>
        <input
          type="text"
          value={controllable}
          onChange={e => setControllable(e.target.value)}
          placeholder={t('parse.controlPlaceholder')}
        />
      </section>

      <section className="card">
        <h2>{t('parse.step5Title')}</h2>
        <p className="help">{t('parse.step5Help')}</p>
        <div className="action-toggle">
          <button
            className={`toggle ${actionNeeded === true ? 'on' : ''}`}
            onClick={() => setActionNeeded(true)}
          >
            {t('parse.actionNeeded')}
          </button>
          <button
            className={`toggle ${actionNeeded === false ? 'on' : ''}`}
            onClick={() => setActionNeeded(false)}
          >
            {t('parse.actionNotNeeded')}
          </button>
        </div>
        {actionNeeded && (
          <input
            type="text"
            value={actionNote}
            onChange={e => setActionNote(e.target.value)}
            placeholder={t('parse.actionPlaceholder')}
          />
        )}
      </section>

      <div className="parse-footer">
        <p className="help">{t('parse.step4Note')}</p>
        <button className="primary" disabled={!canSave} onClick={save}>
          {t('parse.finish')}
        </button>
      </div>
    </div>
  )
}
