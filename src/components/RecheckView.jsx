import { isRecheckDue, formatRelative } from '../store.js'
import { useI18n } from '../i18n.jsx'

// Step 4: 24시간이 지난 항목에 "지금도 중요한가?"를 묻고 답을 데이터로 쌓는다.
export default function RecheckView({ store }) {
  const { t } = useI18n()
  const due = store.entries.filter(e => isRecheckDue(e))
  const answered = store.entries.filter(e => e.recheck)

  return (
    <div className="view">
      <section className="card">
        <h2>{t('recheck.title')}</h2>
        {due.length === 0 ? (
          <p className="help">{t('recheck.emptyHelp')}</p>
        ) : (
          <ul className="entry-list">
            {due.map(e => (
              <li key={e.id} className="entry-row recheck-row">
                <div className="entry-main">
                  <span className="entry-fact">{e.fact}</span>
                  <span className="entry-sub">
                    {formatRelative(e.createdAt, t)} · {t('recheck.intensityThen', { n: e.intensity })}
                  </span>
                </div>
                <div className="recheck-buttons">
                  <button className="toggle danger" onClick={() => store.saveRecheck(e.id, true)}>
                    {t('recheck.stillImportant')}
                  </button>
                  <button className="toggle ok" onClick={() => store.saveRecheck(e.id, false)}>
                    {t('recheck.notImportant')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {answered.length > 0 && (
        <section className="card">
          <h2>{t('recheck.historyTitle')}</h2>
          <ul className="entry-list">
            {answered.map(e => (
              <li key={e.id} className="entry-row">
                <div className="entry-main">
                  <span className="entry-fact">{e.fact}</span>
                  <span className="entry-sub">{formatRelative(e.createdAt, t)}</span>
                </div>
                <span className={`status ${e.recheck.stillImportant ? 'important' : 'faded'}`}>
                  {e.recheck.stillImportant ? t('recheck.statusImportant') : t('recheck.statusFaded')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
