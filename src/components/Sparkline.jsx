// 작은 주별 추세선. series = 주간 빈도 배열(왼쪽=오래된 주, 오른쪽=이번 주).
// 끝점 색으로 최근 방향을 표시한다(↑빨강=악화, ↓청록=개선).

// W는 실제 컬럼 폭(약 260px)에 맞춰 가로 stretch를 최소화 → 끝점 원이 타원으로 찌그러지지 않게.
const W = 260
const H = 34
const PAD = 5

export default function Sparkline({ series }) {
  const n = series.length
  if (n === 0) return null
  const max = Math.max(...series, 1)
  const innerW = W - PAD * 2
  const innerH = H - PAD * 2

  const pts = series.map((v, i) => {
    const x = n === 1 ? W / 2 : PAD + (i / (n - 1)) * innerW
    const y = PAD + innerH - (v / max) * innerH
    return [x, y]
  })

  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`

  const last = series[n - 1]
  const prev = n >= 2 ? series[n - 2] : last
  const endColor = last > prev ? '#f87171' : last < prev ? '#5eead4' : 'var(--text-dim)'
  const [ex, ey] = pts[n - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" role="img" preserveAspectRatio="none">
      <polygon points={area} className="sparkline-area" />
      <polyline points={line} className="sparkline-line" />
      <circle cx={ex} cy={ey} r="2.8" fill={endColor} />
    </svg>
  )
}
