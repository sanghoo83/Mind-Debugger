import { useEffect, useState } from 'react'

const STORAGE_KEY = 'mind-debugger.entries.v1'
const RECHECK_DELAY_MS = 24 * 60 * 60 * 1000

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useEntries() {
  const [entries, setEntries] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const addCapture = ({ fact, source, intensity }) => {
    const entry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      fact,
      source: source || '',
      intensity,
      assumptions: [],
      alternatives: [],
      action: null,
      parsedAt: null,
      recheck: null,
    }
    setEntries(prev => [entry, ...prev])
    return entry.id
  }

  const saveParse = (id, { assumptions, alternatives, missingInfo, action, evidenceScore, controllable }) => {
    setEntries(prev => prev.map(e =>
      e.id === id
        ? { ...e, assumptions, alternatives, missingInfo, action, evidenceScore, controllable, parsedAt: new Date().toISOString() }
        : e
    ))
  }

  // 상처 유형(Emotional Signature) — 감정 단계에서 먼저 이름 붙인 "실제 고통".
  const setHurt = (id, hurt) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, hurt } : e)))
  }

  const saveRecheck = (id, stillImportant) => {
    setEntries(prev => prev.map(e =>
      e.id === id
        ? { ...e, recheck: { answeredAt: new Date().toISOString(), stillImportant } }
        : e
    ))
  }

  const toggleActionDone = (id) => {
    setEntries(prev => prev.map(e =>
      e.id === id && e.action
        ? { ...e, action: { ...e.action, done: !e.action.done } }
        : e
    ))
  }

  const deleteEntry = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // 예제/백업 불러오기 — 기존 데이터에 합친다.
  const importEntries = (list) => {
    setEntries(prev => [...list, ...prev].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ))
  }

  return { entries, addCapture, saveParse, setHurt, saveRecheck, toggleActionDone, deleteEntry, importEntries }
}

// 전체 데이터(JSON) 내보내기 — 파일 다운로드.
export function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    entries: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
    journals: JSON.parse(localStorage.getItem('mind-debugger.journals.v1') || '[]'),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mind-debugger-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 내보낸 JSON 파일 가져오기 — localStorage에 쓰고 새로고침으로 재수화.
export function importDataFile(file) {
  return file.text().then(text => {
    const data = JSON.parse(text)
    if (!Array.isArray(data.entries)) throw new Error('invalid backup file')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries))
    if (Array.isArray(data.journals)) {
      localStorage.setItem('mind-debugger.journals.v1', JSON.stringify(data.journals))
    }
    window.location.reload()
  })
}

const JOURNAL_KEY = 'mind-debugger.journals.v1'

// 저널: 여과 없는 자유 기록 + 분석 결과를 함께 보관한다.
export function useJournals() {
  const [journals, setJournals] = useState(() => {
    try {
      const raw = localStorage.getItem(JOURNAL_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journals))
  }, [journals])

  const addJournal = ({ text, ranking }) => {
    const journal = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      text,
      // 분석 시점의 룰별 감지 결과 (rule id + count)
      detected: ranking.map(r => ({ ruleId: r.rule.id, count: r.count })),
    }
    setJournals(prev => [journal, ...prev])
  }

  const deleteJournal = (id) => {
    setJournals(prev => prev.filter(j => j.id !== id))
  }

  return { journals, addJournal, deleteJournal }
}

const PROFILE_KEY = 'mind-debugger.profile.v1'

// Personal Memory Layer — 앱이 사용자를 "아는" 층. 생성이 아니라 기억.
// patterns: 내가 무너지는/중심 잡는 패턴(정확한 자화상). anchors: 나를 회복시키는 것.
// selfMessages: 맑은 날의 내가 흔들리는 날의 나에게 남기는 말.
const PROFILE_SEED = {
  patterns: [
    '인정받지 못했다고 느낄 때 무너진다',
    '혼자 짐을 짊어질 때 무너진다',
    '불공정함에 민감하다',
    '성장 욕구가 강하다',
    '가족 이야기가 나오면 중심을 잡는다',
    '공부와 프로젝트가 회복 수단이다',
  ],
  anchors: ['Python 30분', '아이 사진 보기', '프로젝트 한 걸음', '잠깐 산책'],
  selfMessages: [],
}

export function useProfile() {
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      return raw ? { ...PROFILE_SEED, ...JSON.parse(raw) } : PROFILE_SEED
    } catch {
      return PROFILE_SEED
    }
  })

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

  const addToList = (key, text) => {
    const v = text.trim()
    if (!v) return
    setProfile(p => ({ ...p, [key]: [...p[key], v] }))
  }
  const removeFromList = (key, idx) => {
    setProfile(p => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }))
  }

  const addPattern = (t) => addToList('patterns', t)
  const removePattern = (i) => removeFromList('patterns', i)
  const addAnchor = (t) => addToList('anchors', t)
  const removeAnchor = (i) => removeFromList('anchors', i)

  const addSelfMessage = (text) => {
    const v = text.trim()
    if (!v) return
    setProfile(p => ({
      ...p,
      selfMessages: [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), text: v }, ...p.selfMessages],
    }))
  }
  const removeSelfMessage = (id) => {
    setProfile(p => ({ ...p, selfMessages: p.selfMessages.filter(m => m.id !== id) }))
  }

  return { profile, addPattern, removePattern, addAnchor, removeAnchor, addSelfMessage, removeSelfMessage }
}

export function isRecheckDue(entry, now = Date.now()) {
  return !entry.recheck && now - new Date(entry.createdAt).getTime() >= RECHECK_DELAY_MS
}

// t는 i18n의 번역 함수 — 시간 문자열도 로케일을 따른다.
export function formatRelative(iso, t, now = Date.now()) {
  const diffMin = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return t('time.justNow')
  if (diffMin < 60) return t('time.minutesAgo', { n: diffMin })
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return t('time.hoursAgo', { n: diffHr })
  const diffDay = Math.floor(diffHr / 24)
  return t('time.daysAgo', { n: diffDay })
}
