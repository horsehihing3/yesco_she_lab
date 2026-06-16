import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Grid, Chip,
} from '@mui/material'

// HTML 샘플과 동일한 노드 정의 (Node 3 — U300 R-201 냉각라인)
type NodeType = 'valve' | 'reactor' | 'psv' | 'inst' | 'pump' | 'vessel'

interface PidNode {
  id: string
  label: string
  type: NodeType
  x: number    // % left
  y: number    // % top
  w: number    // px width
  h: number    // px height
  color: string
  bg: string
  info: Record<string, string>
}

const NODES: PidNode[] = [
  { id: 'FCV',    label: 'FCV-101',  type: 'valve',   x: 10, y: 38, w: 80, h: 36, color: '#4F8EF7', bg: 'rgba(79,142,247,.12)',
    info: { '형식': '공압식 제어밸브', '관경': 'DN80', '설계압력': '12 barg', '상태': '정상 운전', '제어루프': 'FIC-101' } },
  { id: 'R201',   label: 'R-201',    type: 'reactor', x: 33, y: 20, w: 100, h: 58, color: '#F5A623', bg: 'rgba(245,166,35,.10)',
    info: { '형식': '교반형 반응기(CSTR)', '설계압력': '15 barg', '설계온도': '250°C', '재질': 'SUS316L', '용량': '5 m³', 'PSM': '대상' } },
  { id: 'PSV101', label: 'PSV-101',  type: 'psv',     x: 60, y: 5,  w: 78, h: 32, color: '#F25757', bg: 'rgba(242,87,87,.10)',
    info: { '형식': '스프링식', '설정압력': '12 barg', '설치위치': 'R-201 상부', '다음교정': '2026-12-01' } },
  { id: 'TI201',  label: 'TI-201',   type: 'inst',    x: 74, y: 30, w: 70, h: 30, color: '#A78BFA', bg: 'rgba(167,139,250,.10)',
    info: { '유형': '열전대(TC)', '측정범위': '0~300°C', '고온경보': '230°C', '상태': '정상' } },
  { id: 'P102',   label: 'P-102A',   type: 'pump',    x: 7,  y: 68, w: 80, h: 34, color: '#22D07A', bg: 'rgba(34,208,122,.08)',
    info: { '용량': '120 m³/h', '양정': '80 m', '출력': '75 kW', '상태': '운전 중' } },
  { id: 'FI101',  label: 'FI-101',   type: 'inst',    x: 20, y: 47, w: 68, h: 30, color: '#22D3EE', bg: 'rgba(34,211,238,.08)',
    info: { '유형': '전자식', '범위': '0~200 m³/h', '저유량경보': '20 m³/h' } },
  { id: 'V305',   label: 'V-305',    type: 'vessel',  x: 60, y: 68, w: 80, h: 34, color: '#FB923C', bg: 'rgba(251,146,60,.08)',
    info: { '형식': '수직형', '설계압력': '10 barg', '재질': 'SUS304', '법정검사': '유효' } },
]

const PsmPidTab: React.FC = () => {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string>('R201')
  const selected = NODES.find(n => n.id === selectedId)

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>P&amp;ID 뷰어</Typography>

      <Grid container spacing={2}>
        {/* P&ID 캔버스 */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ position: 'relative', height: { xs: 320, md: 460 }, overflow: 'hidden', bgcolor: 'grey.50' }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <marker id="psm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#9CA3AF" />
                </marker>
              </defs>
              {/* 연결선 (퍼센트 좌표 기반 근사) */}
              <line x1="15%" y1="84%" x2="18%" y2="64%" stroke="#9CA3AF" strokeWidth={2} markerEnd="url(#psm-arrow)" />
              <line x1="24%" y1="63%" x2="36%" y2="50%" stroke="#9CA3AF" strokeWidth={2} markerEnd="url(#psm-arrow)" />
              <line x1="18%" y1="55%" x2="36%" y2="46%" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5,3" />
              <line x1="62%" y1="43%" x2="62%" y2="20%" stroke="#9CA3AF" strokeWidth={2} markerEnd="url(#psm-arrow)" />
              <line x1="72%" y1="43%" x2="77%" y2="37%" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5,3" />
              <line x1="66%" y1="64%" x2="64%" y2="72%" stroke="#9CA3AF" strokeWidth={2} markerEnd="url(#psm-arrow)" />
              <text x="14%" y="72%" fontSize="11" fill="#6B7280" fontFamily="monospace">CW 공급</text>
              <text x="62%" y="16%" fontSize="11" fill="#6B7280" fontFamily="monospace">대기 방출</text>
            </svg>

            {NODES.map(n => (
              <Box key={n.id}
                onClick={() => setSelectedId(n.id)}
                sx={{
                  position: 'absolute',
                  left: `${n.x}%`, top: `${n.y}%`,
                  width: n.w, height: n.h,
                  border: '2px solid', borderColor: n.color,
                  bgcolor: selectedId === n.id ? n.color : n.bg,
                  color: selectedId === n.id ? '#fff' : n.color,
                  borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', userSelect: 'none', transition: 'transform .15s',
                  '&:hover': { transform: 'scale(1.04)' },
                }}>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>{n.label}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* 선택된 설비 정보 + 설비 목록 */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: selected?.color }}>
              {selected?.info.name || selected?.label}
            </Typography>
            {selected && Object.entries(selected.info).filter(([k]) => k !== 'name').map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: 1, borderColor: 'grey.200' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{k}</Typography>
                <Typography variant="caption" fontFamily="monospace">{v}</Typography>
              </Box>
            ))}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>{t('psmPidTab.section1', '설비 목록')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {NODES.map(n => (
                <Chip key={n.id}
                  label={`${n.label} · ${n.type}`}
                  size="small"
                  onClick={() => setSelectedId(n.id)}
                  sx={{
                    justifyContent: 'flex-start',
                    bgcolor: selectedId === n.id ? n.bg : 'transparent',
                    borderColor: selectedId === n.id ? n.color : 'grey.300',
                    color: selectedId === n.id ? n.color : 'text.secondary',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PsmPidTab
