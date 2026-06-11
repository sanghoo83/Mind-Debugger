import { useState } from 'react'
import { formatRelative } from '../store.js'
import { useI18n } from '../i18n.jsx'

// 내 편: Personal Memory Layer. 앱이 나를 "아는" 곳.
// 정확한 자화상(패턴) + 회복 스위치(anchors) + 미래의 나 메시지.
// 목표는 생산성이 아니라 "내가 나의 편이 되는 것".
export default function MyAllyView({ profile }) {
  const { t } = useI18n()
  const p = profile.profile

  const [msg, setMsg] = useState('')
  const [newPattern, setNewPattern] = useState('')
  const [newAnchor, setNewAnchor] = useState('')

  const sendMsg = () => {
    profile.addSelfMessage(msg)
    setMsg('')
  }

  return (
    <div className="view ally">
      <section className="card ally-banner">
        <p className="ally-creed">{t('ally.creed')}</p>
      </section>

      <section className="card">
        <h2>{t('ally.msgTitle')}</h2>
        <p className="help">{t('ally.msgHelp')}</p>
        <textarea
          rows={2}
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder={t('ally.msgPlaceholder')}
        />
        <button className="primary soft" disabled={!msg.trim()} onClick={sendMsg}>
          {t('ally.msgSave')}
        </button>

        {p.selfMessages.length > 0 && (
          <ul className="self-msg-list">
            {p.selfMessages.map(m => (
              <li key={m.id} className="self-msg">
                <p className="self-msg-text">“{m.text}”</p>
                <span className="self-msg-meta">
                  {t('ally.msgFrom', { when: formatRelative(m.createdAt, t) })}
                  <button className="link" onClick={() => profile.removeSelfMessage(m.id)}>{t('ally.remove')}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>{t('ally.patternsTitle')}</h2>
        <p className="help">{t('ally.patternsHelp')}</p>
        <ul className="memory-list">
          {p.patterns.map((pt, i) => (
            <li key={i} className="memory-row">
              <span>{pt}</span>
              <button className="link" onClick={() => profile.removePattern(i)}>{t('ally.remove')}</button>
            </li>
          ))}
        </ul>
        <div className="memory-add">
          <input
            type="text"
            value={newPattern}
            onChange={e => setNewPattern(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { profile.addPattern(newPattern); setNewPattern('') } }}
            placeholder={t('ally.patternsPlaceholder')}
          />
          <button className="link" onClick={() => { profile.addPattern(newPattern); setNewPattern('') }}>
            {t('ally.add')}
          </button>
        </div>
      </section>

      <section className="card">
        <h2>{t('ally.anchorsTitle')}</h2>
        <p className="help">{t('ally.anchorsHelp')}</p>
        <div className="anchor-chips">
          {p.anchors.map((a, i) => (
            <span key={i} className="anchor-chip">
              {a}
              <button className="anchor-x" onClick={() => profile.removeAnchor(i)}>×</button>
            </span>
          ))}
        </div>
        <div className="memory-add">
          <input
            type="text"
            value={newAnchor}
            onChange={e => setNewAnchor(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { profile.addAnchor(newAnchor); setNewAnchor('') } }}
            placeholder={t('ally.anchorsPlaceholder')}
          />
          <button className="link" onClick={() => { profile.addAnchor(newAnchor); setNewAnchor('') }}>
            {t('ally.add')}
          </button>
        </div>
      </section>
    </div>
  )
}
