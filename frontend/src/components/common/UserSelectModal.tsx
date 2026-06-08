import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  Checkbox,
  Radio,
  CircularProgress,
  Chip,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import FolderIcon from '@mui/icons-material/Folder'
import BusinessIcon from '@mui/icons-material/Business'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse } from '../../types/common.types'

export interface UserInfo {
  id: number
  username: string
  email: string
  name: string
  nameEn?: string
  nameZh?: string
  department: string
  company: string
  role: string
  phone?: string
}

export interface CompanyTreeNode {
  nodeId: string
  type: 'COMPANY' | 'GROUP' | 'USER'
  label: string
  userId?: number
  username?: string
  email?: string
  name?: string
  nameEn?: string
  nameZh?: string
  department?: string
  company?: string
  phone?: string
  children: CompanyTreeNode[]
}

interface UserSelectModalProps {
  open: boolean
  onClose: () => void
  selectedUsers: UserInfo[]
  onConfirm: (users: UserInfo[]) => void
  title?: string
  singleSelect?: boolean
  useCompanyTree?: boolean
  emailSuffix?: string
  confirmLabel?: string
  showFooterRecipients?: boolean
}

const fetchUsersGroupedByDepartment = async (): Promise<Record<string, UserInfo[]>> => {
  const response = await axiosInstance.get<ApiResponse<Record<string, UserInfo[]>>>('/users/grouped-by-department')
  return response.data.data
}

const fetchCompanyTree = async (): Promise<CompanyTreeNode[]> => {
  const response = await axiosInstance.get<ApiResponse<CompanyTreeNode[]>>('/users/company-tree')
  return response.data.data
}

// USER 노드 제거 — 회사·부서만 남김
const stripUsers = (nodes: CompanyTreeNode[]): CompanyTreeNode[] =>
  nodes.filter(n => n.type !== 'USER').map(n => ({ ...n, children: stripUsers(n.children || []) }))

// 트리에서 nodeId 찾기
const findNode = (nodes: CompanyTreeNode[], nodeId: string): CompanyTreeNode | null => {
  for (const n of nodes) {
    if (n.nodeId === nodeId) return n
    if (n.children) {
      const f = findNode(n.children, nodeId)
      if (f) return f
    }
  }
  return null
}

// 노드 하위의 모든 USER 자식 수집 (재귀)
const collectUsersUnder = (node: CompanyTreeNode, emailSuffix?: string): UserInfo[] => {
  const out: UserInfo[] = []
  const walk = (n: CompanyTreeNode) => {
    if (n.type === 'USER' && n.userId != null) {
      const displayEmail = emailSuffix && n.username ? n.username + emailSuffix : (n.email || '')
      out.push({
        id: n.userId,
        username: n.username || '',
        email: displayEmail,
        name: n.name || n.label,
        nameEn: n.nameEn,
        nameZh: n.nameZh,
        department: n.department || '',
        company: n.company || '',
        role: '',
        phone: n.phone,
      })
    }
    if (n.children) n.children.forEach(walk)
  }
  walk(node)
  return out
}

// 트리에서 모든 노드 ID
const collectAllNodeIds = (nodes: CompanyTreeNode[]): string[] => {
  const ids: string[] = []
  const walk = (list: CompanyTreeNode[]) => {
    list.forEach(n => { ids.push(n.nodeId); if (n.children) walk(n.children) })
  }
  walk(nodes)
  return ids
}

// 트리 검색 (label 매칭 + 부모 경로 유지)
const filterDeptTree = (nodes: CompanyTreeNode[], query: string): CompanyTreeNode[] => {
  const lower = query.toLowerCase()
  const filterNode = (node: CompanyTreeNode): CompanyTreeNode | null => {
    const filteredChildren = (node.children || []).map(filterNode).filter((c): c is CompanyTreeNode => c !== null)
    if (node.label.toLowerCase().includes(lower) || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren }
    }
    return null
  }
  return nodes.map(filterNode).filter((n): n is CompanyTreeNode => n !== null)
}

const UserSelectModal = ({
  open,
  onClose,
  selectedUsers,
  onConfirm,
  title,
  singleSelect = false,
  useCompanyTree = false,
  emailSuffix,
  confirmLabel,
  showFooterRecipients = false,
}: UserSelectModalProps) => {
  const { t, i18n } = useTranslation()

  const [tempSelected, setTempSelected] = useState<UserInfo[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [deptKeyword, setDeptKeyword] = useState('')
  const [userKeyword, setUserKeyword] = useState('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const allowExpansionRef = useRef(false)

  const getLocalizedName = useCallback((name?: string, nameEn?: string, nameZh?: string) => {
    const lang = i18n.language
    if (lang === 'en' && nameEn) return nameEn
    if (lang === 'zh' && nameZh) return nameZh
    return name || ''
  }, [i18n.language])

  const getDisplayEmail = useCallback((username?: string, email?: string) => {
    if (emailSuffix && username) return username + emailSuffix
    return email || ''
  }, [emailSuffix])

  // ── Data sources ──
  const { data: groupedUsers, isLoading: isLoadingGrouped } = useQuery({
    queryKey: ['usersGroupedByDepartment'],
    queryFn: fetchUsersGroupedByDepartment,
    enabled: open && !useCompanyTree,
  })

  const { data: rawTree, isLoading: isLoadingTree } = useQuery({
    queryKey: ['companyTreeFull'],
    queryFn: fetchCompanyTree,
    enabled: open && useCompanyTree,
  })

  const isLoading = useCompanyTree ? isLoadingTree : isLoadingGrouped

  // grouped 모드: 부서명 → 합성 트리 (1depth 만)
  const fakeTreeFromGrouped = useMemo<CompanyTreeNode[]>(() => {
    if (!groupedUsers) return []
    return Object.keys(groupedUsers).map(dept => ({
      nodeId: 'dept-' + dept,
      type: 'GROUP' as const,
      label: dept,
      children: [],
    }))
  }, [groupedUsers])

  // 좌측에 보일 부서 트리 (USER 제외)
  const deptTree = useMemo<CompanyTreeNode[]>(() => {
    if (useCompanyTree) return stripUsers(rawTree || [])
    return fakeTreeFromGrouped
  }, [useCompanyTree, rawTree, fakeTreeFromGrouped])

  // 이름 검색이 활성 시 좌측 트리는 그대로 둠 (사용자가 부서를 클릭할 필요 없이 우측에 전체결과)
  const filteredDeptTree = useMemo(() => deptTree, [deptTree])

  // 조직 전체에서 모든 사원 평탄화 (이름 검색용)
  const allUsersFlat = useMemo<UserInfo[]>(() => {
    if (useCompanyTree && rawTree) {
      const acc: UserInfo[] = []
      const walk = (nodes: CompanyTreeNode[]) => {
        nodes.forEach(n => {
          if (n.type === 'USER' && n.userId != null) {
            acc.push({
              id: n.userId,
              username: n.username || '',
              email: n.email || (emailSuffix && n.username ? n.username + emailSuffix : ''),
              name: n.name || n.label || '',
              nameEn: n.nameEn, nameZh: n.nameZh,
              department: n.department || '',
              company: n.company || '',
              role: '',
              phone: n.phone,
            })
          }
          if (n.children?.length) walk(n.children)
        })
      }
      walk(rawTree)
      // dedupe by id
      const seen = new Set<number>()
      return acc.filter(u => seen.has(u.id) ? false : (seen.add(u.id), true))
    }
    if (groupedUsers) {
      return Object.values(groupedUsers).flat()
    }
    return []
  }, [useCompanyTree, rawTree, groupedUsers, emailSuffix])

  // 모달 오픈 시 초기화
  useEffect(() => {
    if (open) {
      setTempSelected([...selectedUsers])
      setDeptKeyword('')
      setUserKeyword('')
      setSelectedNodeId(null)
    }
  }, [open, selectedUsers])

  // 부서 트리 자동 펼침 (검색어 변경 / 데이터 로드 시)
  useEffect(() => {
    if (!open) return
    if (deptKeyword.trim()) {
      setExpandedItems(collectAllNodeIds(filteredDeptTree))
    } else if (deptTree.length > 0) {
      setExpandedItems(collectAllNodeIds(deptTree))
    }
  }, [open, deptKeyword, filteredDeptTree, deptTree])

  // 우측에 보일 사원 목록
  // 이름 검색(deptKeyword) 이 있으면 조직 전체에서 이름 매칭 사용자 평탄화 표시
  // 검색어 없으면 좌측에서 선택한 부서의 사원만 표시
  const usersInPane = useMemo<UserInfo[]>(() => {
    const kw = deptKeyword.trim().toLowerCase()
    if (kw) {
      return allUsersFlat.filter(u =>
        (u.name || '').toLowerCase().includes(kw) ||
        (u.nameEn || '').toLowerCase().includes(kw) ||
        (u.nameZh || '').toLowerCase().includes(kw) ||
        (u.department || '').toLowerCase().includes(kw)
      )
    }
    if (!selectedNodeId) return []
    let baseList: UserInfo[] = []
    if (useCompanyTree) {
      const node = rawTree ? findNode(rawTree, selectedNodeId) : null
      if (node) baseList = collectUsersUnder(node, emailSuffix)
    } else {
      const deptName = selectedNodeId.startsWith('dept-') ? selectedNodeId.substring(5) : selectedNodeId
      baseList = (groupedUsers && groupedUsers[deptName]) || []
    }
    return baseList
  }, [useCompanyTree, rawTree, groupedUsers, selectedNodeId, deptKeyword, allUsersFlat, emailSuffix])

  const isUserSelected = (u: UserInfo) => tempSelected.some(s => s.id === u.id)

  const handleUserToggle = (u: UserInfo) => {
    if (singleSelect) {
      setTempSelected([u])
      return
    }
    setTempSelected(prev => prev.some(s => s.id === u.id) ? prev.filter(s => s.id !== u.id) : [...prev, u])
  }

  const handleToggleAll = () => {
    if (singleSelect) return
    const allSelected = usersInPane.length > 0 && usersInPane.every(u => isUserSelected(u))
    if (allSelected) {
      setTempSelected(prev => prev.filter(s => !usersInPane.some(u => u.id === s.id)))
    } else {
      setTempSelected(prev => {
        const additions = usersInPane.filter(u => !prev.some(s => s.id === u.id))
        return [...prev, ...additions]
      })
    }
  }

  const handleRemoveUser = (id: number) => {
    setTempSelected(prev => prev.filter(s => s.id !== id))
  }

  const handleConfirm = () => {
    onConfirm(tempSelected)
    onClose()
  }

  // 부서 트리 렌더링 (중복 nodeId 방지)
  const renderedNodeIds = useRef(new Set<string>())
  const renderTreeNode = (node: CompanyTreeNode): React.ReactNode => {
    if (renderedNodeIds.current.has(node.nodeId)) return null
    renderedNodeIds.current.add(node.nodeId)
    return (
      <TreeItem
        key={node.nodeId}
        itemId={node.nodeId}
        slotProps={{
          iconContainer: { onMouseDown: () => { allowExpansionRef.current = true } },
        }}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 0 }}>
            {node.type === 'COMPANY'
              ? <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
              : <FolderIcon sx={{ fontSize: 16, mr: 0.5, color: 'warning.main' }} />}
            <Typography fontWeight="bold" sx={{ fontSize: '0.95rem' }}>{node.label}</Typography>
          </Box>
        }
      >
        {node.children && node.children.length > 0 && node.children.map(c => renderTreeNode(c))}
      </TreeItem>
    )
  }
  const renderTree = (nodes: CompanyTreeNode[]) => {
    renderedNodeIds.current.clear()
    return nodes.map(n => renderTreeNode(n))
  }

  const allInPaneSelected = usersInPane.length > 0 && usersInPane.every(u => isUserSelected(u))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: { width: { xs: '95vw', md: 920 }, height: { xs: '92vh', md: 720 }, maxHeight: '92vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', py: 1.5 }}>
        <Typography component="span" variant="h6" fontWeight="bold">
          {title || t('common.selectEmployee', '담당자 지정')}
          {singleSelect && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({t('common.singleSelect', '단일 선택')})
            </Typography>
          )}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
        {/* Left: Department Tree */}
        <Box sx={{ width: { xs: '100%', md: 320 }, borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: { xs: 200, md: 'auto' } }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              fullWidth
              placeholder={t('common.searchByNameOrg', '이름으로 검색 (조직 전체)')}
              value={deptKeyword}
              onChange={(e) => setDeptKeyword(e.target.value)}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : filteredDeptTree.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                {t('common.noData', '데이터가 없습니다')}
              </Box>
            ) : (
              <SimpleTreeView
                slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
                expandedItems={expandedItems}
                onExpandedItemsChange={(_, ids) => {
                  if (allowExpansionRef.current) {
                    setExpandedItems(ids)
                    allowExpansionRef.current = false
                  }
                }}
                selectedItems={selectedNodeId}
                onSelectedItemsChange={(_, id) => setSelectedNodeId(id as string | null)}
              >
                {renderTree(filteredDeptTree)}
              </SimpleTreeView>
            )}
          </Box>
        </Box>

        {/* Right: User list */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: { xs: 250, md: 'auto' } }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center', minHeight: 56 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {deptKeyword.trim()
                ? t('common.searchResult', '검색 결과') + ` (${usersInPane.length})`
                : selectedNodeId
                  ? `${usersInPane.length} ${t('common.persons', '명')}`
                  : t('common.selectDeptOrSearch', '좌측에서 부서를 선택하거나 이름을 검색하세요')}
            </Typography>
            {!singleSelect && usersInPane.length > 0 && (
              <Button size="small" variant="outlined" onClick={handleToggleAll} sx={{ whiteSpace: 'nowrap' }}>
                {allInPaneSelected ? t('common.deselectAll', '전체 해제') : t('common.selectAll', '전체 선택')}
              </Button>
            )}
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {!selectedNodeId && !deptKeyword.trim() ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <BusinessIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">{t('common.selectDeptOrSearchHint', '왼쪽에서 부서를 선택하거나 이름을 검색하세요')}</Typography>
              </Box>
            ) : usersInPane.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                {t('common.noData', '데이터가 없습니다')}
              </Box>
            ) : (
              <List dense disablePadding>
                {usersInPane.map(u => (
                  <ListItemButton key={u.id} onClick={() => handleUserToggle(u)} sx={{ py: 0.75 }}>
                    {singleSelect ? (
                      <Radio edge="start" checked={isUserSelected(u)} tabIndex={-1} disableRipple size="small" />
                    ) : (
                      <Checkbox edge="start" checked={isUserSelected(u)} tabIndex={-1} disableRipple size="small" />
                    )}
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                            {getLocalizedName(u.name, u.nameEn, u.nameZh)}
                          </Typography>
                          {u.department && (
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>· {u.department}</Typography>
                          )}
                        </Box>
                      }
                      secondary={getDisplayEmail(u.username, u.email)}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Selected chips footer (multi-select 또는 showFooterRecipients) */}
      {(showFooterRecipients || !singleSelect) && tempSelected.length > 0 && (
        <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 0.75, minHeight: 80, maxHeight: 220, overflowY: 'auto', bgcolor: 'grey.50' }}>
          {tempSelected.map(u => (
            <Chip
              key={u.id}
              size="small"
              label={`${getLocalizedName(u.name, u.nameEn, u.nameZh)}${u.department ? ' (' + u.department + ')' : ''}`}
              onDelete={() => handleRemoveUser(u.id)}
            />
          ))}
        </Box>
      )}

      <Divider />
      <DialogActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {t('common.selectedCount', '선택됨')}: <strong>{tempSelected.length}</strong>
          {singleSelect && <Typography component="span" variant="caption" sx={{ ml: 1 }}>(max 1)</Typography>}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>{t('common.cancel', '취소')}</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={tempSelected.length === 0}>
            {confirmLabel || t('common.confirm', '확인')}{!singleSelect && ` (${tempSelected.length})`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default UserSelectModal
