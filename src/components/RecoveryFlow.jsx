import { useState } from 'react'
import { HURTS, hurtById, suggestHurt } from '../emotions.js'
import { suggest } from '../parser.js'
import { formatRelative } from '../store.js'
import { useI18n } from '../i18n.jsx'

// 마음 먼저: 감정 → 공감 → 안정 → 관점 이동 → 분석.
// 강도 높은 캡처는 분석으로 바로 들어가지 않고 이 흐름을 먼저 통과한다.
// onAnalyze: 이제 사실을 보자(기존 분석 에디터로). onClose: 분석 없이 닫기.
export default function RecoveryFlow({ entry, store, profile, onAnalyze, onClose }) {
  const { t, locale } = useI18n()
  const [step, setStep] = useState('detect')
  const [hurtId, setHurtId] = useState(entry.hurt || null)
  const [stuck, setStuck] = useState('')      // Phase 2: 머릿속에 박힌 문장
  const [sonAnswer, setSonAnswer] = useState('')
  const [futureAnswer, setFutureAnswer] = useState('')

  const name = t('recovery.name')
  const hurt = hurtId ? hurtById[hurtId] : null

  // Phase 0 자동 제안: 파서 룰 → 상처 유형
  const matched = suggest(entry.fact, [], entry.id)
  const suggested = suggestHurt(matched?.rule?.id)

  const pickHurt = (id) => {
    setHurtId(id)
    store.setHurt(entry.id, id)
    setStep('mother')
  }

  const FactBanner = () => (
    <section className="card fact-banner soft">
      <span className="label">{t('recovery.event')}</span>
      <p className="fact-text">{entry.fact}</p>
    </section>
  )

  // ── Phase 0: 상태 감지 ──
  if (step === 'detect') {
    return (
      <div className="view recovery">
        <FactBanner />
        <section className="card">
          <h2>{t('recovery.detectTitle')}</h2>
          <p className="help">{t('recovery.detectHelp')}</p>
          <div className="hurt-grid">
            {HURTS.map(h => (
              <button
                key={h.id}
                className={`hurt-chip ${suggested?.id === h.id ? 'suggested' : ''}`}
                onClick={() => pickHurt(h.id)}
              >
                {h.label[locale]}
                {suggested?.id === h.id && <span className="hurt-hint">{t('recovery.suggested')}</span>}
              </button>
            ))}
          </div>
          <button className="link soft-skip" onClick={onClose}>{t('recovery.skipAll')}</button>
        </section>
      </div>
    )
  }

  // ── Phase 1: Mother Mode (분석 금지) ──
  if (step === 'mother') {
    return (
      <div className="view recovery">
        <section className="card mother-card">
          <p className="mother-name">{name}.</p>
          <p className="mother-line">{hurt.mother[locale]}</p>
          <div className="breathing"><span className="breath-dot" /></div>
          <div className="mother-actions">
            <button className="primary soft" onClick={() => setStep('translate')}>
              {t('recovery.motherCalm')}
            </button>
            <button className="link" onClick={onClose}>{t('recovery.motherStay')}</button>
          </div>
        </section>
      </div>
    )
  }

  // ── Phase 2: 번역기 (느낌 ≠ 사실) ──
  if (step === 'translate') {
    return (
      <div className="view recovery">
        <section className="card">
          <h2>{t('recovery.translateTitle')}</h2>
          <p className="help">{t('recovery.translateHelp')}</p>
          <input
            type="text"
            value={stuck}
            onChange={e => setStuck(e.target.value)}
            placeholder={t('recovery.translatePlaceholder')}
          />
          {(stuck.trim() || hurt) && (
            <div className="translate-box">
              {stuck.trim() && (
                <p className="translate-from"><span className="t-label">{t('recovery.storedAs')}</span>{stuck.trim()}</p>
              )}
              <p className="translate-to">
                <span className="t-label">{t('recovery.translatedAs')}</span>
                {hurt.reframe[locale]}
              </p>
              <p className="feeling-note">{t('recovery.feelingNotFact')}</p>
            </div>
          )}
          <button className="primary soft" onClick={() => setStep('perspective')}>
            {t('recovery.translateNext')}
          </button>
        </section>
      </div>
    )
  }

  // ── Phase 3+4: 관점 이동 (아들 / 미래 노아) ──
  if (step === 'perspective') {
    return (
      <div className="view recovery">
        <section className="card">
          <h2>{t('recovery.perspectiveTitle')}</h2>
          <p className="q-prompt">{t('recovery.qSon', { name })}</p>
          <textarea rows={2} value={sonAnswer} onChange={e => setSonAnswer(e.target.value)} placeholder={t('recovery.qOptional')} />
          <p className="q-prompt">{t('recovery.qFuture', { name })}</p>
          <textarea rows={2} value={futureAnswer} onChange={e => setFutureAnswer(e.target.value)} placeholder={t('recovery.qOptional')} />
          <button className="primary soft" onClick={() => setStep('next')}>
            {t('recovery.perspectiveNext')}
          </button>
        </section>
      </div>
    )
  }

  // ── Phase 5 / Recovery 분기 ── (Personal Memory에서 실제 회복 스위치 + 과거의 나 메시지)
  if (step === 'rest') {
    const anchors = profile?.profile?.anchors || []
    const messages = profile?.profile?.selfMessages || []
    const pastMsg = messages.length ? messages[Math.floor(Math.random() * messages.length)] : null
    return (
      <div className="view recovery">
        <section className="card rest-card">
          <p className="rest-body">{t('recovery.restLead')}</p>
          {anchors.length > 0 && (
            <div className="anchor-chips center">
              {anchors.map((a, i) => <span key={i} className="anchor-chip soft">{a}</span>)}
            </div>
          )}
          {pastMsg && (
            <div className="past-self">
              <span className="past-self-label">{t('recovery.pastSelf', { when: formatRelative(pastMsg.createdAt, t), name })}</span>
              <p className="past-self-text">“{pastMsg.text}”</p>
            </div>
          )}
          <p className="rest-closing">{t('recovery.restClosing', { name })}</p>
          <button className="primary soft" onClick={onClose}>{t('recovery.restClose')}</button>
        </section>
      </div>
    )
  }

  // step === 'next'
  return (
    <div className="view recovery">
      <section className="card">
        <h2>{t('recovery.nextTitle')}</h2>
        {hurt && (
          <p className="real-pain">
            {t('recovery.realPain')}<strong>{hurt.label[locale]}</strong>
          </p>
        )}
        <div className="next-actions">
          <button className="primary" onClick={onAnalyze}>{t('recovery.goAnalyze')}</button>
          <button className="toggle" onClick={() => setStep('rest')}>{t('recovery.goRest')}</button>
          <button className="link" onClick={onClose}>{t('recovery.justClose')}</button>
        </div>
      </section>
    </div>
  )
}
