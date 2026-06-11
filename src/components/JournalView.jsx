import { useState } from 'react'
import { analyzeText, ruleById } from '../parser.js'
import { formatRelative } from '../store.js'
import { useI18n } from '../i18n.jsx'
import MindMap from './MindMap.jsx'

// 저널: 여과 없는 자유 기록 → 문장 단위 패턴 lint → 걸린 문장은 캡처 파이프라인으로 보낸다.
export default function JournalView({ store, journals }) {
  const { t, locale } = useI18n()
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [captured, setCaptured] = useState([]) // 캡처로 보낸 문장들
  const [saved, setSaved] = useState(false)

  const analyze = () => {
    if (!text.trim()) return
    setResult(analyzeText(text, store.entries))
    setCaptured([])
    setSaved(false)
  }

  const sendToCapture = (sentence) => {
    if (captured.includes(sentence)) return
    store.addCapture({ fact: sentence, source: t('tab.journal'), intensity: 5 })
    setCaptured(prev => [...prev, sentence])
  }

  const saveJournal = () => {
    if (!result) return
    journals.addJournal({ text: text.trim(), ranking: result.ranking })
    setSaved(true)
  }

  return (
    <div className="view">
      <section className="card">
        <h2>{t('journal.title')}</h2>
        <p className="help">{t('journal.help')}</p>
        <textarea
          rows={6}
          value={text}
          onChange={e => { setText(e.target.value); setResult(null) }}
          placeholder={t('journal.placeholder')}
        />
        <button className="primary" disabled={!text.trim()} onClick={analyze}>
          {t('journal.analyze')}
        </button>
      </section>

      {result && (
        <section className="card">
          <h2>{t('journal.resultTitle')}</h2>
          <p className="help">{t('journal.resultSummary', { matched: result.matchedCount, total: result.totalCount })}</p>

          {result.matchedCount === 0 ? (
            <p className="help">{t('journal.noMatch')}</p>
          ) : (
            <>
              <div className="tag-row journal-ranking">
                {result.ranking.map(({ rule, count, past }) => (
                  <span key={rule.id} className="tag on" title={t('journal.pastCount', { n: past })}>
                    {rule.name[locale]} ×{count}
                  </span>
                ))}
              </div>

              <ul className="entry-list">
                {result.lines.filter(l => l.rules.length > 0).map((l, i) => (
                  <li key={i} className="entry-row">
                    <div className="entry-main">
                      <span className="entry-fact journal-hit">{l.sentence}</span>
                      <span className="entry-sub">
                        {l.rules.map(id => ruleById(id)?.name[locale]).join(' · ')}
                      </span>
                    </div>
                    {captured.includes(l.sentence)
                      ? <span className="status parsed">{t('journal.captured')}</span>
                      : <button className="link" onClick={() => sendToCapture(l.sentence)}>{t('journal.toCapture')}</button>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="capture-actions">
            <button className="primary" disabled={saved} onClick={saveJournal}>
              {saved ? t('journal.saved') : t('journal.save')}
            </button>
          </div>
        </section>
      )}

      {result && result.matchedCount > 0 && (
        <section className="card">
          <h2>{t('journal.mapTitle')}</h2>
          <p className="help">{t('journal.mapHelp')}</p>
          <MindMap
            center={t('journal.mapCenter')}
            branches={result.ranking.map(({ rule, count }) => ({
              id: rule.id,
              label: rule.name[locale],
              count,
              leaves: result.lines.filter(l => l.rules.includes(rule.id)).map(l => l.sentence),
            }))}
          />
        </section>
      )}

      {journals.journals.length > 0 && (
        <section className="card">
          <h2>{t('journal.historyTitle')}</h2>
          <ul className="entry-list">
            {journals.journals.slice(0, 5).map(j => (
              <li key={j.id} className="entry-row">
                <div className="entry-main">
                  <span className="entry-fact journal-snippet">{j.text.slice(0, 80)}{j.text.length > 80 ? '…' : ''}</span>
                  <span className="entry-sub">
                    {formatRelative(j.createdAt, t)}
                    {j.detected.length > 0 && <> · {j.detected.map(d => `${ruleById(d.ruleId)?.name[locale]} ×${d.count}`).join(' · ')}</>}
                  </span>
                </div>
                <button className="link" onClick={() => journals.deleteJournal(j.id)}>{t('journal.delete')}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
