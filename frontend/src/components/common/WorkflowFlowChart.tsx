import { Box } from '@mui/material'

/**
 * 데이터 기반 표준 순서도(flowchart) 렌더러.
 * steps 배열을 위→아래로 배치하고, 판단(decision) 노드의 반려 분기는 우측 루프로 그린다.
 * 도형/색상은 표준 순서도 규칙(터미네이터·프로세스·판단·입출력)을 따른다.
 *
 * 흐름 정의는 `flowSpecs.ts` 의 FLOW_SPECS 레지스트리에 둔다.
 */

export type ShapeKind = 'terminator' | 'process' | 'decision' | 'io'

export interface FlowNode {
  kind: ShapeKind
  label: string          // \n 으로 줄바꿈
  /** 판단 노드 전용 — 반려(아니오) 시 되돌아갈 노드의 index */
  rejectTo?: number
  /** 판단 노드의 통과(예) 라벨. 기본 '예' */
  yesLabel?: string
  /** 반려(아니오) 라벨. 기본 '아니오 · 반려' */
  noLabel?: string
}

const C = {
  terminator: { fill: '#f6c2cb', stroke: '#d17a8a' },
  process: { fill: '#ffe08a', stroke: '#e0a92e' },
  decision: { fill: '#f8b274', stroke: '#e08a36' },
  io: { fill: '#b6d0ee', stroke: '#5e8fc7' },
  line: '#555',
  text: '#2b2b2b',
  reject: '#c0392b',
}

// 도형별 반치수 (세로 half-height / 가로 half-width)
const HALF_H: Record<ShapeKind, number> = { terminator: 26, process: 27, decision: 42, io: 27 }
const HALF_W: Record<ShapeKind, number> = { terminator: 58, process: 75, decision: 79, io: 80 }

const X = 210            // 메인 컬럼 중심
const TOP = 40           // 첫 노드 중심 y
const GAP = 94           // 노드 중심 간격

const fontStyle: React.CSSProperties = { fontFamily: 'inherit', fontSize: 13, fill: C.text }

const Label = ({ x, y, text }: { x: number; y: number; text: string }) => {
  const lines = text.split('\n')
  const lh = 15
  const startY = y - ((lines.length - 1) * lh) / 2
  return (
    <text x={x} y={startY} textAnchor="middle" dominantBaseline="middle" style={fontStyle}>
      {lines.map((ln, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>{ln}</tspan>)}
    </text>
  )
}

const Node = ({ node, y }: { node: FlowNode; y: number }) => {
  const c = C[node.kind]
  if (node.kind === 'terminator') {
    return <g><ellipse cx={X} cy={y} rx={58} ry={26} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} /><Label x={X} y={y} text={node.label} /></g>
  }
  if (node.kind === 'decision') {
    const w = 158, h = 84
    return <g><polygon points={`${X},${y - h / 2} ${X + w / 2},${y} ${X},${y + h / 2} ${X - w / 2},${y}`} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} /><Label x={X} y={y} text={node.label} /></g>
  }
  if (node.kind === 'io') {
    const w = 160, h = 54, sk = 18
    return <g><polygon points={`${X - w / 2 + sk},${y - h / 2} ${X + w / 2},${y - h / 2} ${X + w / 2 - sk},${y + h / 2} ${X - w / 2},${y + h / 2}`} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} /><Label x={X} y={y} text={node.label} /></g>
  }
  // process
  const w = 150, h = 54
  return <g><rect x={X - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} /><Label x={X} y={y} text={node.label} /></g>
}

const EdgeLabel = ({ x, y, text, color = C.text }: { x: number; y: number; text: string; color?: string }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{ ...fontStyle, fontSize: 12, fill: color, fontWeight: 600 }}>{text}</text>
)

const WorkflowFlowChart: React.FC<{ steps: FlowNode[] }> = ({ steps }) => {
  const yOf = (i: number) => TOP + i * GAP
  const height = TOP + (steps.length - 1) * GAP + 50

  // 반려 루프 — 겹치지 않도록 루프마다 우측 컬럼 x 를 증가
  let loopIdx = 0

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Box component="svg" viewBox={`0 0 600 ${height}`} sx={{ width: '100%', maxWidth: 560, height: 'auto' }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="wfArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,3 L0,6 Z" fill={C.line} />
          </marker>
        </defs>

        {/* 연결선 (노드 뒤에 깔림) */}
        {steps.map((node, i) => {
          if (i === steps.length - 1) return null
          const y1 = yOf(i) + HALF_H[node.kind]
          const y2 = yOf(i + 1) - HALF_H[steps[i + 1].kind]
          const isDecision = node.kind === 'decision'
          return (
            <g key={`edge-${i}`}>
              <line x1={X} y1={y1} x2={X} y2={y2} stroke={C.line} strokeWidth={1.5} markerEnd="url(#wfArrow)" />
              {isDecision && <EdgeLabel x={X + 16} y={(y1 + y2) / 2} text={node.yesLabel || '예'} />}
            </g>
          )
        })}

        {/* 반려 루프 */}
        {steps.map((node, i) => {
          if (node.kind !== 'decision' || node.rejectTo === undefined) return null
          const rx = 440 + loopIdx * 44
          loopIdx += 1
          const fromY = yOf(i)
          const target = steps[node.rejectTo]
          const toY = yOf(node.rejectTo)
          const toX = X + HALF_W[target.kind]
          return (
            <g key={`loop-${i}`}>
              <path d={`M${X + 79},${fromY} H${rx} V${toY} H${toX}`} fill="none" stroke={C.line} strokeWidth={1.5} markerEnd="url(#wfArrow)" />
              <EdgeLabel x={(X + 79 + rx) / 2} y={fromY - 10} text={node.noLabel || '아니오 · 반려'} color={C.reject} />
            </g>
          )
        })}

        {/* 노드 */}
        {steps.map((node, i) => <Node key={`node-${i}`} node={node} y={yOf(i)} />)}
      </Box>
    </Box>
  )
}

export default WorkflowFlowChart
