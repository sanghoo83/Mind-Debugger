// 표준 인지 왜곡(cognitive distortion) 분류 — Step 2에서 추측에 태그로 붙인다.
// label/hint는 로케일별로 제공한다.
export const DISTORTIONS = [
  {
    id: 'mind-reading',
    label: { ko: '독심술', en: 'Mind reading' },
    hint: {
      ko: '상대의 마음을 안다고 단정 ("나를 싫어한다")',
      en: 'Assuming you know what others think ("they hate me")',
    },
  },
  {
    id: 'fortune-telling',
    label: { ko: '예언', en: 'Fortune telling' },
    hint: {
      ko: '나쁜 결과를 확정된 미래처럼 예측',
      en: 'Predicting a bad outcome as if it were certain',
    },
  },
  {
    id: 'catastrophizing',
    label: { ko: '파국화', en: 'Catastrophizing' },
    hint: {
      ko: '최악의 시나리오로 확대 해석',
      en: 'Blowing things up to the worst-case scenario',
    },
  },
  {
    id: 'personalization',
    label: { ko: '개인화', en: 'Personalization' },
    hint: {
      ko: '나와 무관할 수 있는 일을 내 탓으로 귀속',
      en: 'Taking the blame for things that may not be about you',
    },
  },
  {
    id: 'black-white',
    label: { ko: '흑백논리', en: 'All-or-nothing' },
    hint: {
      ko: '전부 아니면 전무로 판단',
      en: 'Judging in all-or-nothing terms',
    },
  },
  {
    id: 'overgeneralization',
    label: { ko: '과잉일반화', en: 'Overgeneralization' },
    hint: {
      ko: '한 번의 일을 "항상/절대"로 확장',
      en: 'Turning a single event into "always/never"',
    },
  },
  {
    id: 'mental-filter',
    label: { ko: '부정 필터', en: 'Negative filter' },
    hint: {
      ko: '부정적인 부분만 골라서 봄',
      en: 'Picking out only the negative parts',
    },
  },
  {
    id: 'emotional-reasoning',
    label: { ko: '감정적 추론', en: 'Emotional reasoning' },
    hint: {
      ko: '"불안하니까 사실일 것이다"',
      en: '"I feel anxious, so it must be true"',
    },
  },
  {
    id: 'should',
    label: { ko: '당위 진술', en: 'Should statements' },
    hint: {
      ko: '"~해야만 한다"로 자신/타인을 압박',
      en: 'Pressuring yourself or others with "musts"',
    },
  },
  {
    id: 'labeling',
    label: { ko: '낙인찍기', en: 'Labeling' },
    hint: {
      ko: '"나는 무능하다" 식의 단정적 낙인',
      en: 'Sweeping labels like "I\'m incompetent"',
    },
  },
  {
    id: 'comparison',
    label: { ko: '비교', en: 'Comparison' },
    hint: {
      ko: '타인의 하이라이트와 내 과정을 비교',
      en: "Comparing others' highlights to your own process",
    },
  },
  {
    id: 'rumination',
    label: { ko: '반추', en: 'Rumination' },
    hint: {
      ko: '이미 끝난 과거를 반복 재생',
      en: 'Replaying a finished past on loop',
    },
  },
  {
    id: 'perfectionism',
    label: { ko: '완벽주의', en: 'Perfectionism' },
    hint: {
      ko: '완성된 95%가 아니라 빈 5%만 봄',
      en: 'Seeing the missing 5%, not the done 95%',
    },
  },
  {
    id: 'approval-seeking',
    label: { ko: '인정 욕구', en: 'Approval seeking' },
    hint: {
      ko: '외부 인정으로 내 가치를 판정',
      en: 'Judging your worth by external approval',
    },
  },
]

export const distortionById = Object.fromEntries(DISTORTIONS.map(d => [d.id, d]))
