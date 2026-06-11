// 패턴 중심 radial 마인드맵 (재사용 컴포넌트).
// center = 가운데 라벨, branches = [{ id, label, count, leaves: [문장] }].
// 저널 1건 분석에도, 전체 누적 집계에도 같은 렌더러를 쓴다.
// 워드클라우드(단어 빈도) 대신 패턴을 1차 구조로 두는 게 이 앱의 신호 구조와 맞다.

const PALETTE = ['#5eead4', '#fbbf24', '#f87171', '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fb923c', '#38bdf8', '#c084fc']

const W = 720
const H = 520
const CX = W / 2
const CY = H / 2
const R_PATTERN = 128 // 패턴 가지 반경
const R_LEAF = 212    // 잎 반경

const truncate = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s)
const anchorFor = (cos) => (cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle')
const dxFor = (cos) => (cos > 0.25 ? 8 : cos < -0.25 ? -8 : 0)

export default function MindMap({ center, branches }) {
  if (!branches || branches.length === 0) return null

  const n = branches.length
  const maxCount = Math.max(...branches.map(b => b.count))

  const nodes = branches.map((b, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / n
    const px = CX + R_PATTERN * Math.cos(angle)
    const py = CY + R_PATTERN * Math.sin(angle)

    const leaves = b.leaves || []
    const m = leaves.length
    const span = Math.min((2 * Math.PI) / n, 1.1) * 0.85
    const leafNodes = leaves.map((sentence, j) => {
      const a = m > 1 ? angle + (j - (m - 1) / 2) * (span / (m - 1)) : angle
      return {
        sentence,
        x: CX + R_LEAF * Math.cos(a),
        y: CY + R_LEAF * Math.sin(a),
        cos: Math.cos(a),
      }
    })

    return {
      ...b,
      color: PALETTE[i % PALETTE.length],
      x: px, y: py, cos: Math.cos(angle),
      // 빈도에 비례해 가지 굵기/크기 — 누적 맵에서 "굵어지는 가지"가 보이도록
      r: 15 + (b.count / maxCount) * 16,
      leaves: leafNodes,
    }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mindmap" role="img">
      {nodes.map(node => (
        <g key={`edge-${node.id}`}>
          <line
            x1={CX} y1={CY} x2={node.x} y2={node.y}
            stroke={node.color} strokeWidth={1.5 + (node.count / maxCount) * 3} opacity="0.5"
          />
          {node.leaves.map((lf, j) => (
            <line key={j} x1={node.x} y1={node.y} x2={lf.x} y2={lf.y} stroke={node.color} strokeWidth="1" opacity="0.22" />
          ))}
        </g>
      ))}

      {nodes.map(node =>
        node.leaves.map((lf, j) => (
          <g key={`leaf-${node.id}-${j}`}>
            <circle cx={lf.x} cy={lf.y} r="3" fill={node.color} opacity="0.7" />
            <text
              x={lf.x + dxFor(lf.cos)} y={lf.y}
              textAnchor={anchorFor(lf.cos)} dominantBaseline="middle"
              className="mindmap-leaf-label"
            >
              {truncate(lf.sentence, 13)}
            </text>
          </g>
        ))
      )}

      {nodes.map(node => (
        <g key={`node-${node.id}`}>
          <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} />
          <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central" className="mindmap-count">
            {node.count}
          </text>
          <text
            x={node.x + dxFor(node.cos) * 1.5} y={node.y + node.r + 13}
            textAnchor={anchorFor(node.cos)} className="mindmap-pattern-label"
            fill={node.color}
          >
            {node.label}
          </text>
          {/* 시간축 배지: 지난주 대비 증감 (↑ 늘어남=빨강, ↓ 줄어듦=청록) */}
          {node.delta != null && node.delta !== 0 && (
            <text
              x={node.x} y={node.y - node.r - 6}
              textAnchor="middle" className="mindmap-delta"
              fill={node.delta > 0 ? '#f87171' : '#5eead4'}
            >
              {node.delta > 0 ? `▲${node.delta}` : `▼${Math.abs(node.delta)}`}
            </text>
          )}
        </g>
      ))}

      <circle cx={CX} cy={CY} r="42" className="mindmap-center-bg" />
      <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" className="mindmap-center-label">
        {center}
      </text>
    </svg>
  )
}
