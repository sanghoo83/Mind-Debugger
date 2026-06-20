import { useState } from 'react'
import { decompose, suggest, matchReframes } from '../parser.js'
import { distortionById } from '../distortions.js'
import { formatRelative } from '../store.js'
import { useI18n } from '../i18n.jsx'

// Mind Parser 핵심 화면: 입력 한 줄을 즉시 [사실]↔[해석]으로 분해.
// 신뢰도가 라우팅 — 깨끗하면 분해를 앞세우고, 애매하면 대안 해석이 받친다.
// 격앙된 시야를 붙잡도록 "추측 N%"를 큰 펀치로 띄운다.

// decompose의 kind → 평범한 "지금 하고 있는 동작" 한 줄 (전문용어 금지)
const KIND_PLAIN = {
  'mind-reading': { ko: '상대 속마음을 안다고 단정하는 중', en: 'assuming you know their mind' },
  'personalization': { ko: '나와 무관할 수 있는 걸 내 탓으로', en: 'pinning it on yourself' },
  'fortune-telling': { ko: '아직 안 온 미래를 확정하는 중', en: 'calling a future that hasn’t happened' },
  'catastrophizing': { ko: '최악으로 부풀리는 중', en: 'inflating to the worst case' },
  'overgeneralization': { ko: '한 번을 "항상/원래"로 확장', en: 'stretching once into "always"' },
  'certainty': { ko: '근거 없이 단정하는 중', en: 'declaring it as certain without evidence' },
  'labeling': { ko: '자신에게 낙인을 찍는 중', en: 'slapping a label on yourself' },
}
const plainKind = (k, locale) => KIND_PLAIN[k]?.[locale] ?? distortionById[k]?.hint[locale] ?? k

export default function InstantParse({ entry, store, onManual, onDone }) {
  const { t, locale } = useI18n()
  const [fb, setFb] = useState(entry.parseFeedback?.feedback ?? null)

  const d = decompose(entry.fact)
  const suggestion = suggest(entry.fact, store.entries, entry.id)
  // 노아 전용 리프레임 라이브러리 우선 — 매칭되면 본인이 정리해둔 해석을 띄운다.
  const libReframes = matchReframes(entry.fact)
  const fromLib = libReframes.length > 0
  const alts = fromLib
    ? libReframes.map(r => r.reframe)
    : suggestion ? suggestion.rule.alternatives[locale] : t('instant.genericAlts')
  const leadAlts = d.confidence === 'vague' || d.confidence === 'allStory'

  const giveFeedback = (val) => {
    setFb(val)
    store.setParseFeedback(entry.id, {
      feedback: val,
      input: entry.fact,
      storyPct: d.storyPct,
      confidence: d.confidence,
      factText: d.factText,
      interpText: d.interpText,
      kinds: d.kinds,
    })
  }

  const saveAndClose = () => {
    const tags = d.kinds.filter(k => distortionById[k])
    store.saveParse(entry.id, {
      assumptions: d.interpText ? [{ id: crypto.randomUUID(), text: d.interpText, tags }] : [],
      alternatives: alts,
      missingInfo: [],
      evidenceScore: null,
      controllable: '',
      action: null,
    })
    onDone()
  }

  return (
    <div className="view">
      <button className="link back" onClick={onDone}>{t('parse.back')}</button>

      <section className="card parse-card">
        {/* ── 펀치: 신뢰도가 헤드라인을 고른다 ── */}
        {d.storyPct != null && d.confidence !== 'vague' && d.confidence !== 'allFact' && (
          <div className="punch">
            <div className="punch-line">
              <span className="punch-num">{t('instant.guessPct', { n: d.storyPct })}</span>
              <span className="punch-fact">{t('instant.factPct', { n: 100 - d.storyPct })}</span>
            </div>
            <div className="ratio-bar"><div className="ratio-fill" style={{ width: `${d.storyPct}%` }} /></div>
          </div>
        )}
        {d.confidence === 'vague' && <div className="punch soft">{t('instant.vaguePunch')}</div>}
        {d.confidence === 'allFact' && <div className="punch ok">{t('instant.cleanPunch')}</div>}

        {/* 원문 */}
        <p className="parse-input">"{entry.fact}"</p>

        {/* 분해 (vague면 생략하고 대안으로) */}
        {!leadAlts && d.factText && (
          <p className="parse-fact"><span className="pin">📌 {t('instant.factIs')}</span>{d.factText}</p>
        )}
        {!leadAlts && d.interpText && (
          <div className="parse-interp">
            <p><span className="pin warn">💭 {t('instant.youAdded')}</span>{d.interpText}</p>
            {d.kinds.length > 0 && (
              <p className="parse-kinds">{d.kinds.map(k => plainKind(k, locale)).join(' · ')}</p>
            )}
          </div>
        )}
        {d.confidence === 'allStory' && (
          <p className="help allstory-hint">{t('instant.allStoryHint')}</p>
        )}

        {/* 대안 — 항상, vague/allStory면 주연 */}
        <div className={`parse-alts ${leadAlts ? 'lead' : ''}`}>
          <span className="alts-label">🔄 {fromLib ? t('instant.altsLibLabel') : t('instant.altsLabel')}</span>
          <ul>{alts.map(a => <li key={a}>{a}</li>)}</ul>
        </div>

        {/* 피드백 = 라벨 데이터 */}
        <div className="parse-feedback">
          <span className="fb-q">{t('instant.fbQ')}</span>
          <button className={`fb-btn ${fb === 'good' ? 'on' : ''}`} onClick={() => giveFeedback('good')}>👍 {t('instant.fbGood')}</button>
          <button className={`fb-btn ${fb === 'off' ? 'on' : ''}`} onClick={() => giveFeedback('off')}>✏️ {t('instant.fbOff')}</button>
        </div>

        <div className="parse-actions">
          <button className="primary" onClick={saveAndClose}>{t('instant.done')}</button>
          <button className="link" onClick={onManual}>{t('instant.goManual')}</button>
        </div>

        <p className="parse-creed">{t('instant.creed')}</p>

        <span className="entry-sub parse-meta">
          {entry.source && <span className="source-chip">{entry.source}</span>}
          {formatRelative(entry.createdAt, t)} · {t('parse.capturedIntensity', { n: entry.intensity })}
        </span>
      </section>
    </div>
  )
}
