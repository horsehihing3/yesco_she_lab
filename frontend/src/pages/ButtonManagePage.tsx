import { useState } from 'react'
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Tooltip, Button, AppBar, Toolbar,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { DEFAULT_MENU_DATA, ROLES, Role, cellKey, buildInitialState } from '../data/buttonManageData'

const ButtonManagePage: React.FC = () => {
  const [cellState, setCellState] = useState<Record<string, boolean>>(buildInitialState)

  const toggleCell = (key: string) => setCellState(prev => ({ ...prev, [key]: !prev[key] }))
  const resetAll   = () => setCellState(buildInitialState())

  const issueCount   = DEFAULT_MENU_DATA.flatMap(m => m.statuses.flatMap(s => s.buttons)).filter(b => b.issue).length
  const changedCount = (() => {
    const init = buildInitialState()
    return Object.keys(cellState).filter(k => cellState[k] !== init[k]).length
  })()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      {/* ── 상단 바 ─────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
            버튼 노출 조건 관리
          </Typography>

          {issueCount > 0 && (
            <Chip icon={<WarningAmberIcon sx={{ fontSize: '0.85rem !important' }} />}
              label={`이슈 ${issueCount}건`} size="small"
              sx={{ bgcolor: 'warning.main', color: 'white', '& .MuiChip-icon': { color: 'white' } }} />
          )}
          {changedCount > 0 && (
            <Chip label={`${changedCount}개 수정됨`} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          )}
          {changedCount > 0 && (
            <Button size="small" startIcon={<RestartAltIcon />} onClick={resetAll}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', border: '1px solid',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              초기화
            </Button>
          )}

          <Typography variant="caption" sx={{ opacity: 0.7, ml: 1 }}>
            관리자 = SYSTEM_ADMIN / EHS_ADMIN / AUDIT_ADMIN &nbsp;|&nbsp; 셀 클릭으로 수정 가능
          </Typography>
        </Toolbar>
      </AppBar>

      {/* ── 범례 ────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, py: 0.6, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'grey.200',
        display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
          <Typography variant="caption">노출</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: 'warning.main' }} />
          <Typography variant="caption">노출 (이슈)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CancelIcon sx={{ fontSize: 14, color: 'grey.300' }} />
          <Typography variant="caption">숨김</Typography>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
          * 코드 분석 기반 — 실제 동작과 차이 발견 시 셀 클릭으로 직접 수정 (새로고침 시 초기화)
        </Typography>
      </Box>

      {/* ── 테이블 ──────────────────────────────────────────────────────── */}
      <TableContainer component={Paper} elevation={0} sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'grey.100', fontWeight: 'bold', fontSize: '0.75rem', whiteSpace: 'nowrap', py: 0.75 } }}>
              <TableCell sx={{ minWidth: 230 }}>메뉴</TableCell>
              <TableCell sx={{ minWidth: 120 }}>상태</TableCell>
              <TableCell sx={{ minWidth: 140 }}>버튼</TableCell>
              {ROLES.map(r => (
                <Tooltip key={r.key} title={r.desc} arrow>
                  <TableCell align="center" sx={{ minWidth: 68 }}>{r.label}</TableCell>
                </Tooltip>
              ))}
              <TableCell sx={{ minWidth: 200 }}>비고 / 이슈</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {DEFAULT_MENU_DATA.map((menu, mi) => {
              const totalRows = menu.statuses.reduce((acc, sg) => acc + Math.max(sg.buttons.length, 1), 0)
              let menuPrinted = false

              return menu.statuses.map((sg, si) => {
                const noButtons = sg.buttons.length === 0
                const sgRowSpan = Math.max(sg.buttons.length, 1)

                if (noButtons) {
                  const showMenu = !menuPrinted
                  if (showMenu) menuPrinted = true
                  return (
                    <TableRow key={`${mi}-${si}-empty`}
                      sx={{ bgcolor: 'grey.50', '& td': { borderColor: 'grey.200', py: 0.5 } }}>
                      {showMenu && (
                        <TableCell rowSpan={totalRows} sx={{
                          verticalAlign: 'top', pt: 1.5, borderRight: 1, borderColor: 'grey.300',
                          fontSize: '0.78rem', wordBreak: 'keep-all',
                        }}>
                          {menu.menuPath.split(' › ').map((seg, i, arr) =>
                            i < arr.length - 1
                              ? <Typography key={i} component="span" variant="caption" color="text.secondary">{seg} › </Typography>
                              : <Typography key={i} component="span" variant="body2" fontWeight="bold">{seg}</Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell sx={{ verticalAlign: 'middle', textAlign: 'center', borderRight: 1, borderColor: 'grey.300' }}>
                        <Chip label={sg.statusLabel} color={sg.statusColor} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </TableCell>
                      <TableCell colSpan={ROLES.length + 2}
                        sx={{ color: 'text.disabled', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        버튼 없음{sg.statusNote ? ` — ${sg.statusNote}` : ''}
                      </TableCell>
                    </TableRow>
                  )
                }

                return sg.buttons.map((btn, bi) => {
                  const showMenu   = !menuPrinted && bi === 0
                  const showStatus = bi === 0
                  if (showMenu) menuPrinted = true

                  return (
                    <TableRow key={`${mi}-${si}-${bi}`}
                      sx={{ bgcolor: btn.issue ? 'warning.lighter' : 'inherit',
                        '&:hover': { bgcolor: btn.issue ? 'warning.light' : 'action.hover' },
                        '& td': { borderColor: 'grey.200', py: 0.4 } }}>

                      {showMenu && (
                        <TableCell rowSpan={totalRows} sx={{
                          verticalAlign: 'top', pt: 1.5, borderRight: 1, borderColor: 'grey.300',
                          fontSize: '0.78rem', wordBreak: 'keep-all',
                        }}>
                          {menu.menuPath.split(' › ').map((seg, i, arr) =>
                            i < arr.length - 1
                              ? <Typography key={i} component="span" variant="caption" color="text.secondary">{seg} › </Typography>
                              : <Typography key={i} component="span" variant="body2" fontWeight="bold">{seg}</Typography>
                          )}
                        </TableCell>
                      )}

                      {showStatus && (
                        <TableCell rowSpan={sgRowSpan} sx={{
                          verticalAlign: 'middle', textAlign: 'center',
                          borderRight: 1, borderColor: 'grey.300',
                        }}>
                          <Chip label={sg.statusLabel} color={sg.statusColor} size="small"
                            sx={{ fontSize: '0.65rem', height: 20 }} />
                          {sg.statusNote && (
                            <Typography variant="caption" color="text.disabled" display="block"
                              sx={{ mt: 0.5, fontSize: '0.6rem', lineHeight: 1.2, whiteSpace: 'normal',
                                wordBreak: 'keep-all', px: 0.5 }}>
                              {sg.statusNote}
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'grey.300' }}>
                        {btn.button}
                      </TableCell>

                      {ROLES.map(r => {
                        const key     = cellKey(mi, si, bi, r.key as Role)
                        const visible = cellState[key] ?? btn.roles[r.key as Role]
                        const changed = visible !== btn.roles[r.key as Role]
                        return (
                          <TableCell key={r.key} align="center"
                            sx={{ px: 0.5, py: 0.4, cursor: 'pointer' }}
                            onClick={() => toggleCell(key)}>
                            <Tooltip title={`클릭하여 ${visible ? '숨김' : '노출'}으로 변경${changed ? ' (수정됨)' : ''}`} arrow>
                              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                {visible
                                  ? <CheckCircleIcon fontSize="small"
                                      sx={{ color: btn.issue ? 'warning.main' : 'success.main' }} />
                                  : <CancelIcon fontSize="small" sx={{ color: 'grey.300' }} />
                                }
                                {changed && (
                                  <Box sx={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6,
                                    borderRadius: '50%', bgcolor: 'secondary.main' }} />
                                )}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        )
                      })}

                      <TableCell sx={{ fontSize: '0.7rem', color: 'warning.dark' }}>
                        {btn.issue && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                            <WarningAmberIcon sx={{ fontSize: 13, mt: 0.2, flexShrink: 0, color: 'warning.main' }} />
                            <span>{btn.issue}</span>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              })
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ButtonManagePage
