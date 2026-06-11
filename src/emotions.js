// Emotional Signature — "실제 고통"의 유형. 디버거는 생각이 아니라 상처의 원인을 먼저 짚는다.
// ruleIds: 파서 트리거 시그니처와의 다리. 같은 사건이라도 "Manager Question"이 아니라
// "인정받지 못한 느낌"으로 번역하기 위한 매핑.
// mother: 분석 없이 먼저 건네는 검증의 말(엄마의 언어). need: 그 감정 뒤의 욕구.
// reframe: Phase 2 번역기에서 "느낌 ≠ 사실"로 바꿀 때 쓰는 느낌 문장.

export const HURTS = [
  {
    id: 'unrecognized',
    label: { ko: '인정받지 못한 느낌', en: 'Feeling unrecognized' },
    need: { ko: '인정', en: 'recognition' },
    ruleIds: ['my-work-challenged', 'approval-need', 'mixed-praise', 'perfectionism-gap'],
    mother: {
      ko: '이번에도 열심히 준비했는데, 칭찬보다 질문이 먼저 와서 마음이 다쳤구나.\n노력한 사람은 누구나 인정받고 싶어. 그건 당연한 거야.',
      en: "You prepared so hard again, and questions came back before any praise — of course that stung.\nAnyone who tries this hard wants to be seen. That's only natural.",
    },
    reframe: { ko: '나는 지금 인정받지 못했다고 느끼고 있다', en: "I'm feeling unrecognized right now" },
  },
  {
    id: 'distrusted',
    label: { ko: '못 믿음받은 느낌', en: 'Feeling distrusted' },
    need: { ko: '신뢰', en: 'trust' },
    ruleIds: ['doubt-check'],
    mother: {
      ko: '설명을 다시 요구받으면, 내 능력을 의심받는 것 같아 서운하지.\n그렇게 느낄 만했어. 너는 충분히 잘하고 있었으니까.',
      en: "When you're asked to explain again, it can feel like your competence is doubted — that's a fair way to feel.\nYou were doing just fine.",
    },
    reframe: { ko: '나는 지금 믿음받지 못한다고 느끼고 있다', en: "I'm feeling distrusted right now" },
  },
  {
    id: 'unfair',
    label: { ko: '억울함 · 부당함', en: 'Feeling it was unfair' },
    need: { ko: '공정함', en: 'fairness' },
    ruleIds: [],
    mother: {
      ko: '남들은 안 하는데 나만 하고 있다는 느낌, 그거 진짜 지치게 해.\n억울한 게 당연해. 너 혼자 너무 많이 짊어지고 있었잖아.',
      en: "Feeling like you're the only one carrying it while others don't — that's exhausting.\nOf course it feels unfair. You've been holding too much alone.",
    },
    reframe: { ko: '나는 지금 부당하다고 느끼고 있다', en: "I'm feeling this was unfair right now" },
  },
  {
    id: 'lonely',
    label: { ko: '외로움 · 고립감', en: 'Feeling alone' },
    need: { ko: '연결', en: 'connection' },
    ruleIds: [],
    mother: {
      ko: '아무도 도와주지 않고 혼자 해결해야 할 때, 많이 외로웠겠다.\n그 자리에 혼자 있는 거, 정말 힘든 일이야.',
      en: "When no one helps and you have to solve it alone, that gets lonely.\nBeing there by yourself is genuinely hard.",
    },
    reframe: { ko: '나는 지금 혼자라고 느끼고 있다', en: "I'm feeling alone right now" },
  },
  {
    id: 'afraid',
    label: { ko: '두려움 · 불안', en: 'Fear · anxiety' },
    need: { ko: '안전', en: 'safety' },
    ruleIds: ['future-doom', 'catastrophizing', 'fortune-telling'],
    mother: {
      ko: '아직 일어나지도 않은 일이 너무 크게 다가와서, 가슴이 조여왔지.\n무서운 거 숨기지 않아도 돼. 그 마음 여기 둬도 괜찮아.',
      en: "Something that hasn't even happened loomed so large it tightened your chest.\nYou don't have to hide the fear. You can set it down here.",
    },
    reframe: { ko: '나는 지금 두렵다고 느끼고 있다', en: "I'm feeling afraid right now" },
  },
  {
    id: 'angry',
    label: { ko: '분노', en: 'Anger' },
    need: { ko: '존중', en: 'respect' },
    ruleIds: [],
    // 분노는 대개 더 부드러운 감정의 겉껍질 — 그걸 살짝 짚어준다.
    mother: {
      ko: '지금 화가 많이 났구나. 그럴 만했어.\n그런데 화 밑에는, 사실 서운함이나 다친 마음이 있을 때가 많아. 그것도 같이 봐줄게.',
      en: "You're really angry right now, and that's fair.\nThough underneath anger there's often hurt or disappointment — let's hold that too.",
    },
    reframe: { ko: '나는 지금 존중받지 못했다고 느끼고 있다', en: "I'm feeling disrespected right now" },
  },
]

export const hurtById = Object.fromEntries(HURTS.map(h => [h.id, h]))

// 파서가 감지한 룰 id로 상처 유형을 추정한다 (Phase 0 자동 제안).
export function suggestHurt(ruleId) {
  if (!ruleId) return null
  return HURTS.find(h => h.ruleIds.includes(ruleId)) || null
}
