import { useMemo, useState } from 'react'
import { useEntries, useJournals, useProfile, isRecheckDue } from './store.js'
import { useI18n } from './i18n.jsx'
import CaptureView from './components/CaptureView.jsx'
import JournalView from './components/JournalView.jsx'
import ParseView from './components/ParseView.jsx'
import RecheckView from './components/RecheckView.jsx'
import DashboardView from './components/DashboardView.jsx'
import MyAllyView from './components/MyAllyView.jsx'

const TABS = [
  { id: 'capture', icon: '⚡' },
  { id: 'journal', icon: '📝' },
  { id: 'parse', icon: '🔍' },
  { id: 'recheck', icon: '⏳' },
  { id: 'dashboard', icon: '📊' },
  { id: 'ally', icon: '💚' },
]

export default function App() {
  const store = useEntries()
  const journals = useJournals()
  const profile = useProfile()
  const { t, locale, setLocale } = useI18n()
  const [tab, setTab] = useState('capture')

  const counts = useMemo(() => ({
    parse: store.entries.filter(e => !e.parsedAt).length,
    recheck: store.entries.filter(e => isRecheckDue(e)).length,
  }), [store.entries])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>
            <span className="logo-mark">{'{'}</span> Mind Debugger <span className="logo-mark">{'}'}</span>
          </h1>
          <div className="lang-switch">
            <button
              className={`lang ${locale === 'ko' ? 'on' : ''}`}
              onClick={() => setLocale('ko')}
            >
              한국어
            </button>
            <button
              className={`lang ${locale === 'en' ? 'on' : ''}`}
              onClick={() => setLocale('en')}
            >
              EN
            </button>
          </div>
        </div>
        <p className="tagline">{t('app.tagline')}</p>
      </header>

      <nav className="tabs">
        {TABS.map(tb => (
          <button
            key={tb.id}
            className={`tab ${tab === tb.id ? 'active' : ''}`}
            onClick={() => setTab(tb.id)}
          >
            <span className="tab-icon">{tb.icon}</span>
            {t(`tab.${tb.id}`)}
            {tb.id === 'parse' && counts.parse > 0 && <span className="badge">{counts.parse}</span>}
            {tb.id === 'recheck' && counts.recheck > 0 && <span className="badge badge-warn">{counts.recheck}</span>}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'capture' && <CaptureView store={store} profile={profile} onGoParse={() => setTab('parse')} onGoAlly={() => setTab('ally')} />}
        {tab === 'journal' && <JournalView store={store} journals={journals} />}
        {tab === 'parse' && <ParseView store={store} profile={profile} />}
        {tab === 'recheck' && <RecheckView store={store} />}
        {tab === 'dashboard' && <DashboardView store={store} />}
        {tab === 'ally' && <MyAllyView profile={profile} />}
      </main>
    </div>
  )
}
