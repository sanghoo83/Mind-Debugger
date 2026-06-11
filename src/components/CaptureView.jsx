import { useState } from 'react'
import { formatRelative } from '../store.js'
import { useI18n } from '../i18n.jsx'

// Step 1: 마찰 최소화가 목표 — 사실 한 줄 + (선택) 출처/감정 강도만 받고 끝낸다.
// 첫 화면(Emotional First Aid): "먼저 네 편이 되어줄게" + 과거의 나 메시지.
export default function CaptureView({ store, profile, onGoParse, onGoAlly }) {
  const { t } = useI18n()
  const [fact, setFact] = useState('')
  const [source, setSource] = useState('')
  const [intensity, setIntensity] = useState(5)
  const [saved, setSaved] = useState(false)

  const messages = profile?.profile?.selfMessages || []
  const pastMsg = messages.length ? messages[0] : null

  const submit = (e) => {
    e.preventDefault()
    if (!fact.trim()) return
    store.addCapture({ fact: fact.trim(), source: source.trim(), intensity })
    setFact('')
    setSource('')
    setIntensity(5)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const recent = store.entries.slice(0, 8)

  return (
    <div className="view">
      <button className="ally-creed-line" onClick={onGoAlly}>{t('ally.creed')}</button>

      {pastMsg && (
        <section className="card past-self capture-past">
          <span className="past-self-label">{t('recovery.pastSelf', { when: formatRelative(pastMsg.createdAt, t), name: t('recovery.name') })}</span>
          <p className="past-self-text">“{pastMsg.text}”</p>
        </section>
      )}

      <section className="card capture-card">
        <h2>{t('capture.title')}</h2>
        <p className="help">{t('capture.help')}</p>
        <form onSubmit={submit}>
          <textarea
            autoFocus
            value={fact}
            onChange={e => setFact(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e)
            }}
            placeholder={t('capture.factPlaceholder')}
            rows={3}
          />
          <div className="capture-meta">
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder={t('capture.sourcePlaceholder')}
            />
            <label className="intensity">
              {t('capture.intensityLabel')} <strong>{intensity}</strong>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="capture-actions">
            <button type="submit" className="primary" disabled={!fact.trim()}>
              {t('capture.submit')}
            </button>
            {saved && <span className="saved-flash">{t('capture.saved')}</span>}
          </div>
        </form>
      </section>

      {recent.length > 0 && (
        <section className="card">
          <h2>{t('capture.recent')}</h2>
          <ul className="entry-list">
            {recent.map(e => (
              <li key={e.id} className="entry-row">
                <div className="entry-main">
                  <span className="entry-fact">{e.fact}</span>
                  <span className="entry-sub">
                    {e.source && <span className="source-chip">{e.source}</span>}
                    {formatRelative(e.createdAt, t)} · {t('capture.intensityShort', { n: e.intensity })}
                  </span>
                </div>
                {e.parsedAt
                  ? <span className="status parsed">{t('capture.parsed')}</span>
                  : <button className="link" onClick={onGoParse}>{t('capture.parseLink')}</button>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
