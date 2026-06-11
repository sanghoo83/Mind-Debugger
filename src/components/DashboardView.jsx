import { useMemo, useRef } from 'react'
import { distortionById } from '../distortions.js'
import { formatRelative, exportData, importDataFile } from '../store.js'
import { buildSeedEntries } from '../seed.js'
import { useI18n } from '../i18n.jsx'
import MindMap from './MindMap.jsx'
import Sparkline from './Sparkline.jsx'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// 데이터 백업/복원 + 예제 라이브러리 로드 — localStorage 휘발성에 대한 보험.
function DataSection({ store }) {
  const { t } = useI18n()
  const fileRef = useRef(null)

  const onImport = (e) => {
    const file = e.target.files?.[0]
    if (file) importDataFile(file).catch(() => alert(t('dash.importError')))
    e.target.value = ''
  }

  return (
    <section className="card data-section">
      <h2>{t('dash.dataTitle')}</h2>
      <div className="action-toggle">
        <button className="toggle" onClick={exportData}>{t('dash.export')}</button>
        <button className="toggle" onClick={() => fileRef.current?.click()}>{t('dash.import')}</button>
        {store.entries.length === 0 && (
          <button className="toggle" onClick={() => store.importEntries(buildSeedEntries())}>
            {t('dash.loadExamples')}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImport} />
    </section>
  )
}

// 트래킹의 핵심: "내 데이터"가 보여주는 패턴 — 왜곡 빈도, 24시간 생존율, 열린 액션.
export default function DashboardView({ store }) {
  const { t, locale } = useI18n()
  const { entries } = store

  const stats = useMemo(() => {
    const rechecked = entries.filter(e => e.recheck)
    const notImportant = rechecked.filter(e => !e.recheck.stillImportant)

    const tagCounts = {}
    for (const e of entries) {
      for (const a of e.assumptions || []) {
        for (const tg of a.tags) tagCounts[tg] = (tagCounts[tg] || 0) + 1
      }
    }
    const tagRanking = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
    const maxTag = tagRanking.length ? tagRanking[0][1] : 0

    const openActions = entries.filter(e => e.action?.needed && !e.action.done)

    // 누적 맵: 최근 7일 캡처의 왜곡 태그를 가지로, 강도 높은 사실을 잎으로 집계.
    // 시간축: 이번 주(0~7일) vs 지난주(7~14일) 태그별 빈도 비교 → 가지가 굵어지는/얇아지는 추세.
    const now = Date.now()
    const ageOf = e => now - new Date(e.createdAt).getTime()
    const recent = entries.filter(e => ageOf(e) < WEEK_MS)
    const prior = entries.filter(e => ageOf(e) >= WEEK_MS && ageOf(e) < 2 * WEEK_MS)

    const tagFreq = list => {
      const m = {}
      for (const e of list) {
        for (const tg of new Set((e.assumptions || []).flatMap(a => a.tags))) {
          m[tg] = (m[tg] || 0) + 1
        }
      }
      return m
    }
    const priorFreq = tagFreq(prior)
    const hasPriorData = prior.length > 0

    const byTag = {}
    for (const e of recent) {
      for (const tg of new Set((e.assumptions || []).flatMap(a => a.tags))) {
        if (!byTag[tg]) byTag[tg] = { count: 0, facts: [] }
        byTag[tg].count++
        byTag[tg].facts.push({ fact: e.fact, intensity: e.intensity })
      }
    }
    const mapBranches = Object.entries(byTag)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([id, d]) => ({
        id,
        tagId: id,
        count: d.count,
        delta: hasPriorData ? d.count - (priorFreq[id] || 0) : null,
        leaves: d.facts.sort((a, b) => b.intensity - a.intensity).slice(0, 2).map(f => f.fact),
      }))

    // 주별 스파크라인: 최근 8주 태그별 주간 빈도 궤적 (인덱스 0=가장 오래된 주, 끝=이번 주).
    const WEEKS = 8
    const weekly = {}
    for (const e of entries) {
      const wkIdx = Math.floor(ageOf(e) / WEEK_MS)
      if (wkIdx < 0 || wkIdx >= WEEKS) continue
      const slot = (WEEKS - 1) - wkIdx
      for (const tg of new Set((e.assumptions || []).flatMap(a => a.tags))) {
        if (!weekly[tg]) weekly[tg] = new Array(WEEKS).fill(0)
        weekly[tg][slot]++
      }
    }
    const hasMultiWeek = entries.some(e => ageOf(e) >= WEEK_MS)
    const sparklines = Object.entries(weekly)
      .map(([id, series]) => ({
        id, tagId: id, series,
        current: series[WEEKS - 1],
        total: series.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)

    // 가장 빠르게 굵어진/얇아진 가지 헤드라인
    let trend = null
    if (hasPriorData) {
      const grown = [...mapBranches].filter(b => b.delta > 0).sort((a, b) => b.delta - a.delta)[0]
      const shrunk = [...mapBranches].filter(b => b.delta < 0).sort((a, b) => a.delta - b.delta)[0]
      trend = { grown, shrunk }
    }

    return {
      mapBranches,
      trend,
      hasPriorData,
      sparklines,
      hasMultiWeek,
      total: entries.length,
      parsed: entries.filter(e => e.parsedAt).length,
      recheckedCount: rechecked.length,
      fadeRate: rechecked.length ? Math.round((notImportant.length / rechecked.length) * 100) : null,
      tagRanking,
      maxTag,
      openActions,
    }
  }, [entries])

  if (stats.total === 0) {
    return (
      <div className="view">
        <div className="empty">
          <p>{t('dash.emptyTitle')}</p>
          <p className="help">{t('dash.emptyHelp')}</p>
        </div>
        <DataSection store={store} />
      </div>
    )
  }

  return (
    <div className="view">
      <section className="stat-grid">
        <div className="card stat">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">{t('dash.totalCaptures')}</span>
        </div>
        <div className="card stat">
          <span className="stat-num">{stats.parsed}</span>
          <span className="stat-label">{t('dash.parsed')}</span>
        </div>
        <div className="card stat highlight">
          <span className="stat-num">{stats.fadeRate === null ? '—' : `${stats.fadeRate}%`}</span>
          <span className="stat-label">
            {t('dash.fadeRateLabel')}
            {stats.recheckedCount > 0 && t('dash.fadeRateBasis', { n: stats.recheckedCount })}
          </span>
        </div>
      </section>

      {stats.fadeRate !== null && stats.fadeRate >= 50 && (
        <p className="insight">{t('dash.insight', { pct: stats.fadeRate })}</p>
      )}

      <section className="card">
        <h2>{t('dash.distortionsTitle')}</h2>
        {stats.tagRanking.length === 0 ? (
          <p className="help">{t('dash.distortionsHelp')}</p>
        ) : (
          <ul className="bar-list">
            {stats.tagRanking.map(([tagId, count]) => (
              <li key={tagId}>
                <span className="bar-label">{distortionById[tagId]?.label[locale] ?? tagId}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(count / stats.maxTag) * 100}%` }} />
                </div>
                <span className="bar-count">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {stats.mapBranches.length > 0 && (
        <section className="card">
          <h2>{t('dash.mapTitle')}</h2>
          <p className="help">{t('dash.mapHelp')}</p>

          {!stats.hasPriorData ? (
            <p className="help trend-note">{t('dash.trendPending')}</p>
          ) : (
            <div className="trend-headlines">
              {stats.trend.grown && (
                <p className="trend-line up">
                  {t('dash.trendGrown', {
                    name: distortionById[stats.trend.grown.tagId]?.label[locale] ?? stats.trend.grown.tagId,
                    n: stats.trend.grown.delta,
                  })}
                </p>
              )}
              {stats.trend.shrunk && (
                <p className="trend-line down">
                  {t('dash.trendShrunk', {
                    name: distortionById[stats.trend.shrunk.tagId]?.label[locale] ?? stats.trend.shrunk.tagId,
                    n: Math.abs(stats.trend.shrunk.delta),
                  })}
                </p>
              )}
            </div>
          )}

          <MindMap
            center={t('dash.mapCenter')}
            branches={stats.mapBranches.map(b => ({
              ...b,
              label: distortionById[b.tagId]?.label[locale] ?? b.tagId,
            }))}
          />
        </section>
      )}

      {stats.hasMultiWeek && stats.sparklines.length > 0 && (
        <section className="card">
          <h2>{t('dash.trendTitle')}</h2>
          <p className="help">{t('dash.trendAxis')}</p>
          <ul className="spark-list">
            {stats.sparklines.map(s => (
              <li key={s.id}>
                <span className="spark-label">{distortionById[s.tagId]?.label[locale] ?? s.tagId}</span>
                <Sparkline series={s.series} />
                <span className="spark-count">{s.current}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DataSection store={store} />

      {stats.openActions.length > 0 && (
        <section className="card">
          <h2>{t('dash.openActions')}</h2>
          <ul className="entry-list">
            {stats.openActions.map(e => (
              <li key={e.id} className="entry-row">
                <div className="entry-main">
                  <span className="entry-fact">{e.action.note || t('dash.noActionNote')}</span>
                  <span className="entry-sub">{e.fact} · {formatRelative(e.createdAt, t)}</span>
                </div>
                <button className="link" onClick={() => store.toggleActionDone(e.id)}>{t('dash.done')}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
