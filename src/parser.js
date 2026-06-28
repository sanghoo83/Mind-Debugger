// 노아 최적화 파서 — 실제 캡처 21건에서 추출한 6개 트리거 시그니처.
// 캡처 텍스트를 룰에 매칭해 흔한 함정/대안/확인 질문을 제안하고,
// 같은 패턴의 과거 기록(강도, 24h 재확인 결과)을 증거로 보여준다.
// 우선순위 순서: 위에 있을수록 먼저 매칭된다.

const RULES = [
  {
    id: 'my-work-challenged',
    name: { ko: '내 작업물 필요성 질문', en: 'My work being questioned' },
    test: f => /already have|existing (code|tool|solution)|do we (really )?need|why (don'?t|not).{0,12}(use|existing)|기존 (코드|툴)|이미 (있|만든)/i.test(f),
    traps: [
      {
        text: { ko: '내 노력을 무시한다 / 괜히 만들었나', en: "They're dismissing my effort / did I waste my time" },
        tags: ['mind-reading', 'personalization'],
      },
    ],
    alternatives: {
      ko: ['필요성·비용에 대한 정당한 질문일 수 있음 — 데이터로 답 가능', '제안자는 비용 비교 없이 가볍게 말했을 수 있음'],
      en: ['Could be a legitimate cost/necessity question — answerable with data', 'They may have said it casually, without comparing costs'],
    },
    questions: {
      ko: ['기존 솔루션이 실제 요구사항을 충족하는가?', '유지보수 비용과 ROI 비교는?'],
      en: ['Does the existing solution actually meet the requirements?', 'What about maintenance cost and ROI comparison?'],
    },
  },
  {
    id: 'doubt-check',
    name: { ko: '재검토/확인 요청', en: 'Review/verification request' },
    test: f => /review|once more|walk me through|double.?check|go over|concerns? about|검토|다시 (한 ?번|보)/i.test(f),
    traps: [
      {
        text: { ko: '나를 못 믿는다 / 감시한다', en: "They don't trust me / they're monitoring me" },
        tags: ['mind-reading'],
      },
    ],
    alternatives: {
      ko: ['관례적 확인 절차일 수 있음', '비판이 아니라 이해를 위한 요청일 수 있음'],
      en: ['Could be a routine verification step', 'Could be a request to understand, not to criticize'],
    },
    questions: {
      ko: ['구체적으로 어떤 부분이 우려인가?', '절차상 요청인가, 품질 우려인가?'],
      en: ['Which part exactly is the concern?', 'Is this procedural, or a quality concern?'],
    },
  },
  {
    id: 'mixed-praise',
    name: { ko: '칭찬 + but', en: 'Praise + but' },
    test: f => /\b(but|however|though)\b|overall|좋(은|다).{0,8}(하지만|근데)|전반적/i.test(f),
    traps: [
      {
        text: { ko: '결국 부정 평가다 / 인정 안 한다', en: "It's a negative review in the end / no recognition" },
        tags: ['mental-filter'],
      },
    ],
    alternatives: {
      ko: ['긍정 평가가 명시적으로 먼저 나왔음 — 둘 다 사실일 수 있음'],
      en: ['The positive part was stated explicitly first — both can be true'],
    },
    questions: {
      ko: ['개선 포인트의 구체적인 기대치는?'],
      en: ['What is the concrete expectation for the improvement point?'],
    },
  },
  {
    id: 'delayed-decision',
    name: { ko: '보류/연기 시그널', en: 'Deferral signal' },
    test: f => /later|revisit|take a look|offline|follow.?up|next (time|week)|나중에|보류|다음에/i.test(f),
    traps: [
      {
        text: { ko: '기각이다 / 안 하겠다는 거다', en: "It's rejected / they won't do it" },
        tags: ['fortune-telling'],
      },
    ],
    alternatives: {
      ko: ['정말 나중에 다룰 수도 있음 — 아직 결정된 것 없음', '시간 부족이나 우선순위 문제일 수 있음'],
      en: ['It might genuinely come back later — nothing is decided yet', 'Could be a time or priority issue'],
    },
    questions: {
      ko: ['구체적인 후속 일정을 제안해보면?', '우선순위가 어디쯤인지?'],
      en: ['What if I propose a concrete follow-up date?', 'Where does this sit in the priorities?'],
    },
  },
  {
    id: 'personal-observation',
    name: { ko: '개인 관찰 코멘트', en: 'Personal observation' },
    test: f => /you seem|you'?ve been|lately|these days|요즘|바빠 ?보|스트레스/i.test(f),
    traps: [
      {
        text: { ko: '내가 부정적으로 보인다 / 내 잘못이다', en: "I look bad to them / it's my fault" },
        tags: ['personalization', 'mind-reading'],
      },
    ],
    alternatives: {
      ko: ['걱정이나 관심의 표현일 수 있음 — 단순 관찰일 수도'],
      en: ['Could be concern or care — or just an observation'],
    },
    questions: {
      ko: ['불만인지 걱정인지 직접 물어보면?'],
      en: ['What if I just ask whether it was a complaint or concern?'],
    },
  },
  // ── 자기 대화(self-talk)형 시그니처 ──
  // 타인의 메시지가 아니라 내 머릿속 해석이 캡처에 섞여 들어온 경우를 잡는다.
  {
    id: 'future-doom',
    name: { ko: '미래 확정 선고', en: 'Future doom verdict' },
    test: f => /망하면|망했|끝났|끝날|늦었|큰일|어쩌지/i.test(f),
    traps: [
      {
        text: { ko: '아직 일어나지 않은 미래를 확정하는 중', en: 'Declaring a future that has not happened yet' },
        tags: ['fortune-telling', 'catastrophizing'],
      },
    ],
    alternatives: {
      ko: ['그 미래가 일어난다는 증거는 현재 0%', '최악 시나리오는 여러 가능성 중 하나일 뿐'],
      en: ['Evidence that this future happens: currently 0%', 'The worst case is just one of many possibilities'],
    },
    questions: {
      ko: ['지금 내가 통제 가능한 것은 무엇인가?'],
      en: ['What can I actually control right now?'],
    },
  },
  {
    id: 'comparison-trap',
    name: { ko: '비교 모드', en: 'Comparison mode' },
    test: f => /승진|뒤쳐|뒤처|한참 멀|나는 (뭘|뭐 했)|난 대체|남의|다른 사람.{0,12}(잘|좋)/i.test(f),
    traps: [
      {
        text: { ko: '남의 결과와 나를 비교 중', en: "Comparing myself to someone else's results" },
        tags: ['comparison'],
      },
    ],
    alternatives: {
      ko: ['타인의 하이라이트 vs 내 전체 과정 — 불공정한 비교', '남의 성장과 내 성장은 독립된 트랙'],
      en: ["Their highlight reel vs my full process — an unfair comparison", "Their growth and mine are independent tracks"],
    },
    questions: {
      ko: ['내 성장은 무엇으로 측정하는가?'],
      en: ['What do I actually measure my growth by?'],
    },
  },
  {
    id: 'self-blame',
    name: { ko: '자기비난 귀속', en: 'Self-blame attribution' },
    test: f => /내가 .{0,12}(부족|잘못|망쳤|문제|게을|아닌가)|내 탓|나 때문|나를 안 좋아/i.test(f),
    traps: [
      {
        text: { ko: '외부 사건을 내 탓으로 귀속 중', en: 'Attributing an external event to myself' },
        tags: ['personalization'],
      },
    ],
    alternatives: {
      ko: ['나와 무관한 원인(컨디션, 상황, 발달 단계 등)일 수 있음'],
      en: ['The cause may have nothing to do with me (mood, situation, developmental stage, etc.)'],
    },
    questions: {
      ko: ['내 영향이라는 실제 증거는 무엇인가?'],
      en: ['What is the actual evidence that I caused this?'],
    },
  },
  {
    id: 'perfectionism-gap',
    name: { ko: '완벽주의 갭', en: 'Perfectionism gap' },
    test: f => /아직 멀|완벽하|95%|밖에 못|고작/i.test(f),
    traps: [
      {
        text: { ko: '완성된 부분이 아니라 남은 부분만 보는 중', en: 'Looking only at what remains, not what is done' },
        tags: ['perfectionism', 'mental-filter'],
      },
    ],
    alternatives: {
      ko: ['이미 완성된 부분이 대부분', "완료 기준이 없으면 영원히 '아직 멀었음'"],
      en: ['Most of it is already done', "Without a definition of done, it's forever 'not there yet'"],
    },
    questions: {
      ko: ['애초에 완료 기준은 무엇이었나?'],
      en: ['What was the definition of done in the first place?'],
    },
  },
  {
    id: 'approval-need',
    name: { ko: '인정 의존', en: 'Approval dependence' },
    test: f => /칭찬|인정(받|이 없|도 없)|반응이? 없|아무도 (관심|말|반응)/i.test(f),
    traps: [
      {
        text: { ko: '외부 인정으로 일의 가치를 판정 중', en: "Judging the work's value by external approval" },
        tags: ['approval-seeking', 'emotional-reasoning'],
      },
    ],
    alternatives: {
      ko: ['피드백 부재 ≠ 부정 평가', '가치는 반응 수와 독립적일 수 있음'],
      en: ['Absence of feedback ≠ negative feedback', 'Value can be independent of reaction count'],
    },
    questions: {
      ko: ['내가 정한 이 일의 가치 기준은 무엇인가?'],
      en: ['What is my own measure of this work\'s value?'],
    },
  },
  {
    id: 'always-never',
    name: { ko: '항상/원래 확장', en: 'Always/never expansion' },
    test: f => /나는 왜|왜 (항상|이렇|늘)|항상 (이|그)|원래 이런|또 (무너|이래)/i.test(f),
    traps: [
      {
        text: { ko: "단일 사건을 '항상/원래'로 확장 중", en: "Expanding a single event into 'always/never'" },
        tags: ['overgeneralization', 'rumination'],
      },
    ],
    alternatives: {
      ko: ['표본은 오늘 하루, 이번 한 번뿐', '반례가 분명히 존재함'],
      en: ['The sample is one day, one event', 'Counterexamples clearly exist'],
    },
    questions: {
      ko: ['반례를 3개 들 수 있는가?'],
      en: ['Can I list three counterexamples?'],
    },
  },
  {
    id: 'ambiguous-short',
    name: { ko: '모호한 단답', en: 'Ambiguous short reply' },
    test: f => {
      const m = f.match(/"([^"]+)"/)
      const quote = m ? m[1] : f
      return quote.trim().split(/\s+/).length <= 4
    },
    traps: [
      {
        text: { ko: '정보 공백을 부정적 추측으로 채우는 중', en: 'Filling the information vacuum with negative guesses' },
        tags: ['mind-reading', 'fortune-telling'],
      },
    ],
    alternatives: {
      ko: ['판단할 근거 자체가 없음 — 긍정도 부정도 아님'],
      en: ["There is no evidence to judge — it's neither positive nor negative"],
    },
    questions: {
      ko: ['후속 질문 하나로 확인 가능한 것은?'],
      en: ['What could one follow-up question confirm?'],
    },
  },
]

// 파서의 증거 추정치 (Core Q3의 기본값):
// 대안 해석 1개당 -2, 미확인 질문 1개당 -1, 감지된 왜곡 1종당 -1 (1~10 클램프).
// 대안이 많고 확인 안 된 게 많을수록 그 추측의 증거는 약하다는 논리.
export function estimateEvidence({ assumptions, alternatives, missingInfo }) {
  const tags = new Set(assumptions.flatMap(a => a.tags))
  return Math.max(1, Math.min(10,
    10 - 2 * alternatives.length - missingInfo.length - tags.size
  ))
}

// 파싱 완료 시점의 디버그 리포트.
// evidenceScore(사용자가 직접 매긴 Core Q3 점수)가 있으면 그것을 쓰고,
// 없으면(구버전 데이터) 파서 추정치로 대체한다.
export function debugReport({ intensity, assumptions, alternatives, missingInfo, action, evidenceScore, controllable }) {
  const tags = [...new Set(assumptions.flatMap(a => a.tags))]
  const parserEstimate = estimateEvidence({ assumptions, alternatives, missingInfo })
  const evidence = evidenceScore ?? parserEstimate
  return {
    intensity,
    evidence,
    parserEstimate,
    assumptionCount: assumptions.length,
    questionCount: missingInfo.length,
    tags,
    gap: intensity - evidence,
    action,
    controllable: controllable || '',
  }
}

// 저널 텍스트를 문장 단위로 쪼개 모든 룰에 대해 다중 매칭한다 (suggest와 달리 첫 매칭에서 멈추지 않음).
// 반환: 문장별 매칭 목록 + 룰별 집계.
export function analyzeText(text, entries = []) {
  const sentences = text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length >= 2)

  const lines = sentences.map(sentence => ({
    sentence,
    rules: RULES.filter(r => r.id !== 'ambiguous-short' && r.test(sentence)).map(r => r.id),
  }))

  const counts = {}
  for (const l of lines) for (const id of l.rules) counts[id] = (counts[id] || 0) + 1

  const ranking = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const rule = RULES.find(r => r.id === id)
      const past = entries.filter(e => rule.test(e.fact)).length
      return { rule, count, past }
    })

  return {
    lines,
    ranking,
    matchedCount: lines.filter(l => l.rules.length > 0).length,
    totalCount: lines.length,
  }
}

export function ruleById(id) {
  return RULES.find(r => r.id === id)
}

// ── 분해 엔진(Mind Parser 핵심) ──
// 입력 한 줄을 [관찰된 사실] vs [네가 더한 해석]으로 가른다.
// 한국어 마커 기반. 완벽하진 않으므로 "신뢰도"를 함께 내보내, 깨끗하게 못 가르면
// UI가 대안 해석 쪽으로 갈아타도록 한다(대안 = 분해의 안전망).

// 관찰 신호: 외부에서 검증 가능한 사건 (남이/세상이 무엇을 했다)
const OBSERVE_RE = /(말했|말함|얘기했|했다|했음|안\s?했|못\s?받|없었|없다|물었|물어봤|보냈|답장|읽씹|읽었|공유했|왔다|왔음|봤다|봤음|들었|줬다|적었|썼다|초대|메일|문자|카톡|슬랙|회의|침묵|하더라|했다고|라고\s?(하|했|함)|다고\s?(하|했|함)|그러더|얘기하더|말하더)/

// 추측 신호: 마음·동기·미래를 단정하는 절 (관찰이 아니라 추론)
const INTERP_MARKERS = [
  // 메타 해석: "~라는 뜻/소리/거다" = 명시적으로 의미를 단정하는 신호 (가장 강력)
  { re: /(뜻이[다야지]|소리[다네야지]|라는\s?거[다야지]|란\s?거[다야]|는\s?거지|는\s?뜻)/, kind: 'mind-reading' },
  { re: /(무시|싫어|미워|못\s?믿|의심|감시|비꼬|우습게|호구|깔보|관심\s?(이|도)?\s?없|비난|부정한|지루|소홀|별로라|안\s?좋아|깎아내리|낮춰|낮게\s?보|베낀|베꼈|대충\s?했|시험하|떠보|마지못해|숨기려|숨긴|막으려|막는다|통제하|압박하|압박감|압박받|독촉|몰아가|몰아붙|떠넘기|무시당)/, kind: 'mind-reading' },
  { re: /(의도적|일부러|날\s?향|나\s?때문|내\s?탓|왜\s?나만|나\s?혼자|이용당|뺏|빼앗|실망시켰|내가\s?(부족|잘못|망쳤|게을|소홀|이상|복잡|못해|못한))/, kind: 'personalization' },
  { re: /(끝났|망했|늦었|큰일|좆됐|안\s?될|못\s?할|거야|거다|것이다|할\s?거|죽었|죽은|글렀|거절|기각|안\s?하겠|가망\s?없)/, kind: 'fortune-telling' },
  { re: /(정치|공격|당한다|당할|음모|뒤통수|찍혔|찍힌|밉보|뒷담|버림받|손절|시작이[다야]|큰\s?병|큰\s?문제|칼\s?꽂|이해\s?못|함정|배제|배척|차별)/, kind: 'catastrophizing' },
  { re: /(항상|언제나|맨날|매번|원래|평생|하나도|전혀|또다시|또\s|매사)/, kind: 'overgeneralization' },
  { re: /(분명|틀림없|확실히|뻔|봐도|100%|틀렸|틀린)/, kind: 'certainty' },
  { re: /(나는?\s?(부족|무능|안\s?돼|재능\s?(이|가)?\s?없|쓸모|이상|모자)|나\s?같은|내가\s?잘못|가치\s?(이|가)?\s?없|감각\s?(이|가)?\s?없|체질\s?아니|경쟁력\s?(이|가)?\s?없|쓸모\s?(가)?\s?없|소용\s?(이)?\s?없|실패자|난\s?실패)/, kind: 'labeling' },
  { re: /(인정받지\s?못|인정\s?못\s?받|인정\s?안\s?(해|받)|아무도\s?(안|알아)|가치\s?없는\s?(일|프로젝트))/, kind: 'approval-seeking' },
  { re: /(뒤쳐|뒤처|한참\s?멀|뒤떨어|남들?\s?(은|는|보다))/, kind: 'comparison' },
  { re: /(아직\s?멀|아직\s?한참|아직도\s?멀|95%)/, kind: 'perfectionism' },
  { re: /(아닌가|게을러졌나|망쳤나|못했나|소홀했나|뺏겼|실망시켰나)/, kind: 'personalization' },
]
const QUOTE_RE = /["“”'']([^"“”'']{1,})["“”'']/

// 절 단위로 쪼갠다: 화살표·접속·종결·줄바꿈 기준.
function splitClauses(text) {
  return text
    .split(/→|->|\n+|(?<=[.!?…])\s+|\s*(?:그래서|그러니까|그니까|때문에|그래도|근데)\s+/)
    .map(s => s.replace(/[.!?…]+$/, '').trim()) // 절 끝 문장부호 제거(합칠 때 겹침 방지)
    .filter(Boolean)
}

export function decompose(text) {
  const clauses = splitClauses(text)
  const facts = []
  const interps = []
  const kinds = new Set()
  let obsWeight = 0
  let interpWeight = 0

  for (const c of clauses) {
    const hasQuote = QUOTE_RE.test(c)
    let obs = (hasQuote ? 2 : 0) + (OBSERVE_RE.test(c) ? 1 : 0)
    let intp = 0
    for (const m of INTERP_MARKERS) {
      if (m.re.test(c)) { intp += 1; kinds.add(m.kind) }
    }
    obsWeight += obs
    interpWeight += intp
    if (intp > obs) interps.push(c)
    else if (obs > 0) facts.push(c)
    else facts.push(c) // 마커 없는 절은 일단 사실 쪽(중립)
  }

  // 추측 비율은 절(clause) 수 기반 — 마커 가중치보다 직관적이고 안정적.
  const totalClauses = facts.length + interps.length
  const storyPct = totalClauses > 0 ? Math.round((interps.length / totalClauses) * 100) : null

  // 신뢰도/유형 판정
  let confidence
  if (obsWeight === 0 && interpWeight === 0) confidence = 'vague'   // 마커 0개 → 대안 주도
  else if (facts.length > 0 && interps.length > 0) confidence = 'clean'  // 둘 다 → 분해 주도
  else if (interps.length > 0) confidence = 'allStory'             // 결론만 적음
  else confidence = 'allFact'                                       // 깨끗한 사실

  return {
    factText: facts.join('. '),
    interpText: interps.join('. '),
    storyPct,
    confidence,
    kinds: [...kinds],
    hasFact: obsWeight > 0,
    hasInterp: interpWeight > 0,
  }
}

// ── 리프레임 라이브러리 매칭 ──
// 입력을 노아 전용 리프레임 500개와 대조해, 노아 본인의 균형 잡힌 해석을 띄운다.
// 정밀도 우선: 틀린 리프레임을 띄우느니 안 띄운다.
import { REFRAMES } from './reframes.js'

const normTxt = s => (s || '').replace(/["“”''.,!?]/g, '').toLowerCase()
const tokenize = s => normTxt(s).split(/\s+/).filter(w => w.length >= 2)
const bigrams = s => {
  const t = normTxt(s).replace(/\s/g, '')
  const g = []
  for (let i = 0; i < t.length - 1; i++) g.push(t.slice(i, i + 2))
  return g
}

export function matchReframes(input, limit = 2) {
  const ni = normTxt(input)
  if (ni.length < 2) return []
  const itokens = new Set(tokenize(input))
  const ibigrams = new Set(bigrams(input))

  const scored = REFRAMES.map(r => {
    const nt = normTxt(r.trigger)
    let score = 0
    // 강한 신호: 트리거(따옴표 제거) 내용이 입력에 통째로 들어있음 (인용 케이스)
    if (nt.length >= 4 && (ni.includes(nt) || nt.includes(ni))) score += 6
    // 문자 bigram 비율 — 조사/어미 변형을 넘어 내용 일치를 본다 (한국어 핵심)
    const tbi = bigrams(r.trigger)
    if (tbi.length >= 3) {
      const shared = tbi.filter(b => ibigrams.has(b)).length
      const ratio = shared / tbi.length
      if (ratio >= 0.6) score += 6           // 트리거 대부분이 입력에 들어있음
      else score += shared                    // 부분 겹침
    }
    // 토큰 겹침(보조)
    const rtokens = new Set([...tokenize(r.trigger), ...tokenize(r.misread)])
    let overlap = 0
    for (const t of itokens) if (rtokens.has(t)) overlap++
    score += overlap * 2
    return { r, score }
  }).filter(x => x.score >= 6).sort((a, b) => b.score - a.score)

  const seen = new Set()
  const res = []
  for (const { r } of scored) {
    if (seen.has(r.reframe)) continue
    seen.add(r.reframe)
    res.push(r)
    if (res.length >= limit) break
  }
  return res
}

// fact에 매칭되는 최우선 룰 + 같은 룰에 걸린 과거 기록 통계를 반환한다.
export function suggest(fact, entries, currentId) {
  const rule = RULES.find(r => r.test(fact))
  if (!rule) return null

  const past = entries.filter(e => e.id !== currentId && rule.test(e.fact))
  const rechecked = past.filter(e => e.recheck)
  const faded = rechecked.filter(e => !e.recheck.stillImportant)
  const avgIntensity = past.length
    ? Math.round((past.reduce((s, e) => s + e.intensity, 0) / past.length) * 10) / 10
    : null

  return {
    rule,
    pastCount: past.length,
    avgIntensity,
    recheckedCount: rechecked.length,
    fadedPct: rechecked.length ? Math.round((faded.length / rechecked.length) * 100) : null,
  }
}
