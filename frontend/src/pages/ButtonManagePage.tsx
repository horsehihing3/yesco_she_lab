import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, List, ListItemButton, ListItemText, Collapse, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Tooltip, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormGroup, FormControlLabel, Checkbox,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import EditIcon from '@mui/icons-material/Edit'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import {
  DEFAULT_MENU_DATA, ROLES, Role, MenuEntry, cellKey, buildInitialState,
  ABSTRACT_ROLE_KEYS, GENERAL_ADMIN_ROLE_OPTIONS,
} from '../data/buttonManageData'
import { fetchButtonRules, saveButtonRules, ButtonRuleItem } from '../api/buttonRuleApi'
import { fetchMenuRules } from '../api/menuRuleApi'
import { useAlert } from '../contexts/AlertContext'

// 슈퍼관리자는 UI에서 숨김
const VISIBLE_ROLES = ROLES.filter(r => r.key !== 'superAdmin')

// ── 기존 상태 빌더 함수 (변경 없음) ─────────────────────────────────────────

const gaKey = (menuPath: string) => menuPath

function buildStateFromDb(dbRules: ButtonRuleItem[]): Record<string, boolean> {
  const state = buildInitialState()
  if (!dbRules || dbRules.length === 0) return state
  const ruleMap = new Map(
    dbRules.map(r => [`${r.menuPath}|${r.statusCode}|${r.buttonName}|${r.roleKey}`, r.visible])
  )
  DEFAULT_MENU_DATA.forEach((menu, mi) => {
    menu.statuses.forEach((sg, si) => {
      sg.buttons.forEach((btn, bi) => {
        ROLES.forEach(r => {
          const dbKey = `${menu.menuPath}|${sg.status}|${btn.button}|${r.key}`
          if (ruleMap.has(dbKey)) state[cellKey(mi, si, bi, r.key as Role)] = ruleMap.get(dbKey)!
        })
      })
    })
  })
  return state
}

function buildGaStateFromDb(dbRules: ButtonRuleItem[]): Record<string, string[]> {
  const state: Record<string, string[]> = {}
  dbRules.forEach(r => {
    if (!ABSTRACT_ROLE_KEYS.has(r.roleKey) && r.visible) {
      const key = gaKey(r.menuPath)
      if (!state[key]) state[key] = []
      if (!state[key].includes(r.roleKey)) state[key].push(r.roleKey)
    }
  })
  return state
}

function buildAbstractRulesToSave(cellState: Record<string, boolean>): ButtonRuleItem[] {
  const rules: ButtonRuleItem[] = []
  DEFAULT_MENU_DATA.forEach((menu, mi) => {
    menu.statuses.forEach((sg, si) => {
      sg.buttons.forEach((btn, bi) => {
        ROLES.forEach(r => {
          const k = cellKey(mi, si, bi, r.key as Role)
          const current = r.key === 'superAdmin' ? true : (cellState[k] ?? btn.roles[r.key as Role])
          rules.push({ menuPath: menu.menuPath, statusCode: sg.status, buttonName: btn.button, roleKey: r.key, visible: current })
        })
      })
    })
  })
  return rules
}

function buildGaRulesToSave(gaState: Record<string, string[]>): ButtonRuleItem[] {
  const rules: ButtonRuleItem[] = []
  DEFAULT_MENU_DATA.forEach(menu => {
    const selected = gaState[gaKey(menu.menuPath)] ?? []
    menu.statuses.forEach(sg => {
      sg.buttons.forEach(btn => {
        selected.forEach(roleKey => {
          rules.push({ menuPath: menu.menuPath, statusCode: sg.status, buttonName: btn.button, roleKey, visible: true })
        })
      })
    })
  })
  return rules
}

// ── 트리 타입 & 빌더 ─────────────────────────────────────────────────────────

interface TreeNode {
  id: string
  label: string
  children: TreeNode[]
  menuPaths: string[]
}

function buildMenuTree(menuData: MenuEntry[]): TreeNode {
  const root: TreeNode = { id: '__root__', label: '전체', children: [], menuPaths: menuData.map(m => m.menuPath) }
  for (const menu of menuData) {
    const segs = menu.menuPath.split(' › ')
    let cur = root
    let pathSoFar = ''
    for (const seg of segs) {
      pathSoFar = pathSoFar ? `${pathSoFar}§${seg}` : seg
      let child = cur.children.find(c => c.id === pathSoFar)
      if (!child) {
        child = { id: pathSoFar, label: seg, children: [], menuPaths: [] }
        cur.children.push(child)
      }
      child.menuPaths.push(menu.menuPath)
      cur = child
    }
  }
  return root
}

// ── 트리 아이템 컴포넌트 ─────────────────────────────────────────────────────

interface TreeItemProps {
  node: TreeNode
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  onSelect: (id: string, paths: string[]) => void
  onToggle: (id: string) => void
}

const TreeItem: React.FC<TreeItemProps> = ({ node, depth, selectedId, expandedIds, onSelect, onToggle }) => {
  const isLeaf = node.children.length === 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id

  const handleClick = () => {
    onSelect(node.id, node.menuPaths)
    if (!isLeaf) onToggle(node.id)
  }

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        selected={isSelected}
        dense
        sx={{
          pl: 0.75 + depth * 1.75,
          pr: 1,
          py: 0.3,
          minHeight: 28,
          '&.Mui-selected': { bgcolor: 'primary.50', '& *': { color: 'primary.main' } },
          '&.Mui-selected:hover': { bgcolor: 'primary.100' },
        }}
      >
        {isLeaf
          ? <FiberManualRecordIcon sx={{ fontSize: 5, mr: 0.75, color: isSelected ? 'primary.main' : 'text.disabled', flexShrink: 0 }} />
          : isExpanded
            ? <ExpandLessIcon sx={{ fontSize: 13, mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
            : <ExpandMoreIcon sx={{ fontSize: 13, mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
        }
        <ListItemText
          primary={node.label}
          primaryTypographyProps={{
            sx: {
              fontSize: depth === 0 ? '0.78rem' : '0.73rem',
              fontWeight: isLeaf ? (isSelected ? 700 : 400) : (depth === 0 ? 700 : 600),
              color: isSelected ? 'primary.main' : 'text.primary',
              lineHeight: 1.35,
              wordBreak: 'keep-all',
            }
          }}
        />
      </ListItemButton>
      {!isLeaf && (
        <Collapse in={isExpanded} unmountOnExit>
          <List disablePadding>
            {node.children.map(child => (
              <TreeItem key={child.id} node={child} depth={depth + 1}
                selectedId={selectedId} expandedIds={expandedIds}
                onSelect={onSelect} onToggle={onToggle} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

// ── GA 다이얼로그 타입 ────────────────────────────────────────────────────────
interface GaDialog { menuPath: string }

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const ButtonManagePage: React.FC = () => {
  const { showSuccess, showError } = useAlert()
  const queryClient = useQueryClient()
  const [cellState, setCellState] = useState<Record<string, boolean>>(buildInitialState)
  const [gaState, setGaState] = useState<Record<string, string[]>>({})
  const [gaDialog, setGaDialog] = useState<GaDialog | null>(null)
  const [checkedMenus, setCheckedMenus] = useState<Set<string>>(new Set())

  // ── 트리 상태 ──────────────────────────────────────────────────────────────
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null)
  const [selectedMenuPaths, setSelectedMenuPaths] = useState<string[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const tempTree = buildMenuTree(DEFAULT_MENU_DATA)
    return new Set(tempTree.children.map(n => n.id))
  })

  const handleTreeSelect = (id: string, paths: string[]) => {
    setSelectedTreeId(id)
    setSelectedMenuPaths(paths)
  }
  const handleTreeToggle = (id: string) =>
    setExpandedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  const toggleCell = (key: string) => setCellState(prev => ({ ...prev, [key]: !prev[key] }))
  const toggleMenuCheck = (menuPath: string) =>
    setCheckedMenus(prev => { const next = new Set(prev); next.has(menuPath) ? next.delete(menuPath) : next.add(menuPath); return next })

  const handleGaConfirm = () => {
    if (gaDialog && checkedMenus.size > 0) {
      const selection = gaState[gaKey(gaDialog.menuPath)] ?? []
      setGaState(prev => {
        const next = { ...prev }
        checkedMenus.forEach(mp => { next[gaKey(mp)] = [...selection] })
        return next
      })
    }
    setGaDialog(null)
  }

  // ── 데이터 로드 ────────────────────────────────────────────────────────────
  const { data: dbRules, isLoading } = useQuery({ queryKey: ['buttonRules'], queryFn: fetchButtonRules })
  const { data: menuRules } = useQuery({ queryKey: ['menuRules'], queryFn: fetchMenuRules })

  const sysAdminHiddenMenuKeys = useMemo(() => {
    if (!menuRules) return new Set<string>()
    return new Set(menuRules.filter(r => r.roleKey === 'SYSTEM_ADMIN').map(r => r.menuKey))
  }, [menuRules])

  const visibleMenuData = useMemo(
    () => DEFAULT_MENU_DATA.filter(m => !m.menuKey || !sysAdminHiddenMenuKeys.has(m.menuKey)),
    [sysAdminHiddenMenuKeys]
  )

  // DEFAULT_MENU_DATA 기준 인덱스 유지 (cellKey 일관성)
  const filteredWithIndex = useMemo(() => {
    const base = DEFAULT_MENU_DATA
      .map((menu, mi) => ({ menu, mi }))
      .filter(({ menu }) => !menu.menuKey || !sysAdminHiddenMenuKeys.has(menu.menuKey))
    if (!selectedTreeId) return base
    return base.filter(({ menu }) => selectedMenuPaths.includes(menu.menuPath))
  }, [sysAdminHiddenMenuKeys, selectedTreeId, selectedMenuPaths])

  const menuTree = useMemo(() => buildMenuTree(visibleMenuData), [visibleMenuData])

  useEffect(() => {
    if (dbRules !== undefined) {
      setCellState(buildStateFromDb(dbRules))
      setGaState(buildGaStateFromDb(dbRules))
    }
  }, [dbRules])

  const resetAll = () => {
    if (dbRules) {
      setCellState(buildStateFromDb(dbRules))
      setGaState(buildGaStateFromDb(dbRules))
    } else {
      setCellState(buildInitialState())
      setGaState({})
    }
  }

  const saveMutation = useMutation({
    mutationFn: () => saveButtonRules([
      ...buildAbstractRulesToSave(cellState),
      ...buildGaRulesToSave(gaState),
    ]),
    onSuccess: () => {
      showSuccess('저장되었습니다.')
      setCheckedMenus(new Set())
      queryClient.invalidateQueries({ queryKey: ['buttonRules'] })
    },
    onError: () => showError('저장 중 오류가 발생했습니다.'),
  })

  const savedState = useMemo(() => buildStateFromDb(dbRules ?? []), [dbRules])
  const savedGaState = useMemo(() => buildGaStateFromDb(dbRules ?? []), [dbRules])

  const issueCount = visibleMenuData.flatMap(m => m.statuses.flatMap(s => s.buttons)).filter(b => b.issue).length

  const changedCount = (() => {
    const abstractChanged = Object.keys(cellState).filter(k =>
      !k.endsWith('_superAdmin') && cellState[k] !== savedState[k]
    ).length
    const gaChanged = visibleMenuData.filter(menu => {
      const cur  = JSON.stringify([...(gaState[gaKey(menu.menuPath)] ?? [])].sort())
      const base = JSON.stringify([...(savedGaState[gaKey(menu.menuPath)] ?? [])].sort())
      return cur !== base
    }).length
    return abstractChanged + gaChanged
  })()

  // 단일 메뉴 선택 시 메뉴 컬럼 숨김
  const showMenuCol = filteredWithIndex.length !== 1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── 툴바 ──────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, py: 0.75, display: 'flex', gap: 1.5, alignItems: 'center',
        bgcolor: 'primary.main', color: 'white', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          슈퍼관리자는 항상 모든 권한 &nbsp;|&nbsp; 일반관리자 = 메뉴별 지정 &nbsp;|&nbsp; 셀 클릭으로 수정 후 저장
        </Typography>
        <Box sx={{ flex: 1 }} />
        {issueCount > 0 && (
          <Chip icon={<WarningAmberIcon sx={{ fontSize: '0.85rem !important' }} />}
            label={`이슈 ${issueCount}건`} size="small"
            sx={{ bgcolor: 'warning.main', color: 'white', '& .MuiChip-icon': { color: 'white' } }} />
        )}
        {changedCount > 0 && (
          <Chip label={`${changedCount}개 수정됨`} size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
        )}
        <Button size="small" startIcon={<SaveIcon />} onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.7)', border: '1px solid',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.3)' } }}>
          {saveMutation.isPending ? <CircularProgress size={14} sx={{ color: 'white', mr: 0.5 }} /> : null}
          저장
        </Button>
        {changedCount > 0 && (
          <Button size="small" startIcon={<RestartAltIcon />} onClick={resetAll}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', border: '1px solid',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            초기화
          </Button>
        )}
      </Box>

      {/* ── 본문: 사이드바 + 테이블 ────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── 왼쪽 트리 사이드바 ─────────────────────────────────────────── */}
        <Box sx={{
          width: 230, flexShrink: 0,
          borderRight: 1, borderColor: 'grey.200',
          bgcolor: 'grey.50', overflow: 'auto',
        }}>
          <List dense disablePadding>
            {/* 전체 보기 */}
            <ListItemButton
              selected={!selectedTreeId}
              onClick={() => { setSelectedTreeId(null); setSelectedMenuPaths([]) }}
              sx={{ py: 0.6, px: 1.5,
                '&.Mui-selected': { bgcolor: 'primary.50' },
                '&.Mui-selected:hover': { bgcolor: 'primary.100' },
              }}
            >
              <ListItemText primary="전체 보기"
                primaryTypographyProps={{ sx: {
                  fontWeight: 700, fontSize: '0.8rem',
                  color: !selectedTreeId ? 'primary.main' : 'text.primary',
                }}} />
            </ListItemButton>
            <Divider />

            {menuTree.children.map(child => (
              <TreeItem key={child.id} node={child} depth={0}
                selectedId={selectedTreeId} expandedIds={expandedIds}
                onSelect={handleTreeSelect} onToggle={handleTreeToggle} />
            ))}
          </List>
        </Box>

        {/* ── 오른쪽 패널 ────────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* 범례 */}
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
              * 코드 기본값 기준 — DB에 저장된 값이 있으면 우선 적용
            </Typography>
          </Box>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {/* 테이블 */}
          {!isLoading && (
            <TableContainer component={Paper} elevation={0} sx={{ flex: 1, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: 'grey.100', fontWeight: 'bold', fontSize: '0.75rem', whiteSpace: 'nowrap', py: 0.75 } }}>
                    {showMenuCol && <TableCell sx={{ minWidth: 170 }}>메뉴</TableCell>}
                    <TableCell sx={{ minWidth: 114 }}>상태</TableCell>
                    <TableCell sx={{ minWidth: 133 }}>버튼</TableCell>
                    {VISIBLE_ROLES.map(r => (
                      <Tooltip key={r.key} title={r.desc} arrow>
                        <TableCell align="center" sx={{ minWidth: 65 }}>{r.label}</TableCell>
                      </Tooltip>
                    ))}
                    <Tooltip title="☐ 체크 후 지정 버튼 클릭 → 체크된 모든 메뉴에 일괄 적용" arrow>
                      <TableCell align="center" sx={{ minWidth: 110 }}>일반관리자</TableCell>
                    </Tooltip>
                    <TableCell sx={{ minWidth: 180 }}>일반관리자 권한</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>비고 / 이슈</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredWithIndex.map(({ menu, mi }) => {
                    const totalRows = menu.statuses.reduce((acc, sg) => acc + Math.max(sg.buttons.length, 1), 0)
                    let menuPrinted = false
                    const gaSelected = gaState[gaKey(menu.menuPath)] ?? []
                    const gaChanged  = gaSelected.length > 0

                    return menu.statuses.map((sg, si) => {
                      const noButtons  = sg.buttons.length === 0
                      const sgRowSpan  = Math.max(sg.buttons.length, 1)

                      if (noButtons) {
                        const showMenu = !menuPrinted
                        if (showMenu) menuPrinted = true
                        return (
                          <TableRow key={`${mi}-${si}-empty`}
                            sx={{ bgcolor: 'grey.50', '& td': { borderColor: 'grey.200', py: 0.5 } }}>
                            {showMenu && showMenuCol && (
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
                            <TableCell colSpan={VISIBLE_ROLES.length + 1}
                              sx={{ color: 'text.disabled', fontSize: '0.75rem', fontStyle: 'italic' }}>
                              버튼 없음{sg.statusNote ? ` — ${sg.statusNote}` : ''}
                            </TableCell>
                            {showMenu && (
                              <TableCell rowSpan={totalRows} align="center"
                                sx={{ verticalAlign: 'middle', borderLeft: 1, borderColor: 'grey.200', px: 0.5 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
                                  <Tooltip title="체크 후 일반관리자 지정 시 일괄 적용" arrow>
                                    <Checkbox size="small" checked={checkedMenus.has(menu.menuPath)}
                                      onChange={() => toggleMenuCheck(menu.menuPath)} sx={{ p: 0.25 }} />
                                  </Tooltip>
                                  <GaCell selected={gaSelected} changed={gaChanged}
                                    onClick={() => setGaDialog({ menuPath: menu.menuPath })} />
                                </Box>
                              </TableCell>
                            )}
                            {showMenu && (
                              <TableCell rowSpan={totalRows}
                                sx={{ verticalAlign: 'top', pt: 1, borderLeft: 1, borderColor: 'grey.200', px: 1 }}>
                                <GaRolesCell selected={gaSelected} />
                              </TableCell>
                            )}
                            <TableCell />
                          </TableRow>
                        )
                      }

                      return sg.buttons.map((btn, bi) => {
                        const showMenu   = !menuPrinted && bi === 0
                        const showStatus = bi === 0
                        if (showMenu) menuPrinted = true

                        const rowBg    = btn.issue ? 'warning.lighter' : 'inherit'
                        const rowHover = btn.issue ? 'warning.light'   : 'action.hover'

                        return (
                          <TableRow key={`${mi}-${si}-${bi}`}
                            sx={{ bgcolor: rowBg, '&:hover': { bgcolor: rowHover }, '& td': { borderColor: 'grey.200', py: 0.4 } }}>

                            {showMenu && showMenuCol && (
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

                            {VISIBLE_ROLES.map(r => {
                              const k       = cellKey(mi, si, bi, r.key as Role)
                              const visible = cellState[k] ?? btn.roles[r.key as Role]
                              const changed = visible !== savedState[k]
                              return (
                                <TableCell key={r.key} align="center"
                                  sx={{ px: 0.5, py: 0.4, cursor: 'pointer' }}
                                  onClick={() => toggleCell(k)}>
                                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                    {visible
                                      ? <CheckCircleIcon fontSize="small" sx={{ color: btn.issue ? 'warning.main' : 'success.main' }} />
                                      : <CancelIcon fontSize="small" sx={{ color: 'grey.300' }} />
                                    }
                                    {changed && (
                                      <Box sx={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6,
                                        borderRadius: '50%', bgcolor: 'secondary.main' }} />
                                    )}
                                  </Box>
                                </TableCell>
                              )
                            })}

                            {showMenu && (
                              <TableCell rowSpan={totalRows} align="center"
                                sx={{ verticalAlign: 'middle', borderLeft: 1, borderColor: 'grey.200', px: 0.5 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
                                  <Tooltip title="체크 후 일반관리자 지정 시 일괄 적용" arrow>
                                    <Checkbox size="small" checked={checkedMenus.has(menu.menuPath)}
                                      onChange={() => toggleMenuCheck(menu.menuPath)} sx={{ p: 0.25 }} />
                                  </Tooltip>
                                  <GaCell selected={gaSelected} changed={gaChanged}
                                    onClick={() => setGaDialog({ menuPath: menu.menuPath })} />
                                </Box>
                              </TableCell>
                            )}
                            {showMenu && (
                              <TableCell rowSpan={totalRows}
                                sx={{ verticalAlign: 'top', pt: 1, borderLeft: 1, borderColor: 'grey.200', px: 1 }}>
                                <GaRolesCell selected={gaSelected} />
                              </TableCell>
                            )}

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
          )}
        </Box>
      </Box>

      {/* ── 일반관리자 지정 다이얼로그 ────────────────────────────────────── */}
      <Dialog open={!!gaDialog} onClose={() => setGaDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1, fontSize: '0.95rem' }}>일반관리자 권한 지정</DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {gaDialog && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                <b>{gaDialog.menuPath.split(' › ').pop()}</b> 메뉴의 모든 버튼에 적용
              </Typography>
              {checkedMenus.size > 0 && (
                <Typography variant="caption"
                  sx={{ display: 'block', mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                  ✓ 체크된 {checkedMenus.size}개 메뉴에 동일하게 일괄 적용됩니다
                </Typography>
              )}
              <FormGroup sx={{ gap: 0 }}>
                {GENERAL_ADMIN_ROLE_OPTIONS.map(opt => {
                  const checked = (gaState[gaKey(gaDialog.menuPath)] ?? []).includes(opt.key)
                  return (
                    <FormControlLabel key={opt.key}
                      control={
                        <Checkbox size="small" checked={checked} sx={{ py: 0.3 }}
                          onChange={e => {
                            setGaState(prev => {
                              const cur = prev[gaKey(gaDialog.menuPath)] ?? []
                              return {
                                ...prev,
                                [gaKey(gaDialog.menuPath)]: e.target.checked
                                  ? [...cur, opt.key]
                                  : cur.filter(k => k !== opt.key),
                              }
                            })
                          }} />
                      }
                      label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{opt.label}</Typography>}
                    />
                  )
                })}
              </FormGroup>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button size="small" color="inherit"
            onClick={() => { if (gaDialog) setGaState(prev => ({ ...prev, [gaKey(gaDialog.menuPath)]: [] })) }}>
            전체 해제
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="contained" onClick={handleGaConfirm}>확인</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function GaRolesCell({ selected }: { selected: string[] }) {
  if (selected.length === 0) return <Typography variant="caption" color="text.disabled">-</Typography>
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
      {selected.map(key => {
        const label = GENERAL_ADMIN_ROLE_OPTIONS.find(o => o.key === key)?.label ?? key
        return (
          <Chip key={key} label={label} size="small"
            sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'info.50', color: 'info.dark' }} />
        )
      })}
    </Box>
  )
}

function GaCell({ selected, changed, onClick }: { selected: string[]; changed: boolean; onClick: () => void }) {
  return (
    <Chip
      icon={<EditIcon sx={{ fontSize: '0.7rem !important' }} />}
      label={selected.length > 0 ? `${selected.length}개` : '지정'}
      size="small"
      onClick={onClick}
      sx={{
        fontSize: '0.62rem', height: 20, cursor: 'pointer',
        bgcolor: selected.length > 0 ? 'info.100' : 'grey.100',
        border: changed ? '1px solid' : 'none',
        borderColor: 'secondary.main',
        '&:hover': { bgcolor: selected.length > 0 ? 'info.200' : 'grey.200' },
      }}
    />
  )
}

export default ButtonManagePage
