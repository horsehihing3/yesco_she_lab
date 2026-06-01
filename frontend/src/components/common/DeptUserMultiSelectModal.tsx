import { useState, useMemo, useEffect, useRef } from 'react'
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
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import BusinessIcon from '@mui/icons-material/Business'
import FolderIcon from '@mui/icons-material/Folder'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse } from '../../types/common.types'
import { UserInfo, CompanyTreeNode } from './UserSelectModal'

interface DeptUserMultiSelectModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (users: UserInfo[]) => void
  title?: string
  initialSelected?: UserInfo[]
}

const fetchCompanyTree = async (): Promise<CompanyTreeNode[]> => {
  const response = await axiosInstance.get<ApiResponse<CompanyTreeNode[]>>('/users/company-tree')
  return response.data.data
}

// 트리에서 USER 노드를 제외한 회사/부서만 추출
const stripUsers = (nodes: CompanyTreeNode[]): CompanyTreeNode[] => {
  return nodes
    .filter(n => n.type !== 'USER')
    .map(n => ({ ...n, children: stripUsers(n.children || []) }))
}

// 노드 ID로 모든 USER 자식 수집 (재귀)
const collectUsers = (node: CompanyTreeNode): UserInfo[] => {
  const users: UserInfo[] = []
  const walk = (n: CompanyTreeNode) => {
    if (n.type === 'USER' && n.userId != null) {
      users.push({
        id: n.userId,
        username: n.username || '',
        email: n.email || '',
        name: n.name || n.label,
        nameEn: n.nameEn,
        nameZh: n.nameZh,
        department: n.department || '',
        company: n.company || '',
        role: '',
      })
    }
    if (n.children) n.children.forEach(walk)
  }
  walk(node)
  return users
}

// 트리에서 nodeId로 노드 찾기
const findNode = (nodes: CompanyTreeNode[], nodeId: string): CompanyTreeNode | null => {
  for (const n of nodes) {
    if (n.nodeId === nodeId) return n
    if (n.children) {
      const found = findNode(n.children, nodeId)
      if (found) return found
    }
  }
  return null
}

// 모든 노드 ID 수집 (확장용)
const collectAllNodeIds = (nodes: CompanyTreeNode[]): string[] => {
  const ids: string[] = []
  const walk = (list: CompanyTreeNode[]) => {
    list.forEach(n => { ids.push(n.nodeId); if (n.children) walk(n.children) })
  }
  walk(nodes)
  return ids
}

const DeptUserMultiSelectModal: React.FC<DeptUserMultiSelectModalProps> = ({ open, onClose, onConfirm, title, initialSelected }) => {
  const { t } = useTranslation()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<UserInfo[]>([])
  const [treeKeyword, setTreeKeyword] = useState('')
  const [userKeyword, setUserKeyword] = useState('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const allowExpansionRef = useRef(false)

  // Initialize selected users from prop when modal opens
  useEffect(() => {
    if (open) {
      setSelectedUsers(initialSelected || [])
    }
  }, [open, initialSelected])

  const { data: rawTree, isLoading } = useQuery({
    queryKey: ['companyTreeFull'],
    queryFn: fetchCompanyTree,
    enabled: open,
  })

  // USER 제외 트리
  const tree = useMemo(() => stripUsers(rawTree || []), [rawTree])

  // 트리 검색 필터
  const filteredTree = useMemo(() => {
    if (!treeKeyword.trim()) return tree
    const lower = treeKeyword.toLowerCase()
    const filterNode = (node: CompanyTreeNode): CompanyTreeNode | null => {
      const filteredChildren = (node.children || []).map(filterNode).filter((c): c is CompanyTreeNode => c !== null)
      if (node.label.toLowerCase().includes(lower) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }
      }
      return null
    }
    return tree.map(filterNode).filter((n): n is CompanyTreeNode => n !== null)
  }, [tree, treeKeyword])

  // 트리 로드 + 검색 모두 전체 펼침
  useEffect(() => {
    if (treeKeyword.trim()) {
      setExpandedItems(collectAllNodeIds(filteredTree))
    } else if (tree.length > 0) {
      setExpandedItems(collectAllNodeIds(tree))
    }
  }, [treeKeyword, filteredTree, tree])

  // 선택된 노드의 사원 목록 (원본 트리에서 찾아서 USER 자식 수집)
  const usersInNode = useMemo(() => {
    if (!selectedNodeId || !rawTree) return []
    const node = findNode(rawTree, selectedNodeId)
    if (!node) return []
    const users = collectUsers(node)
    return users.filter(u => (u.name || '').toLowerCase().includes(userKeyword.toLowerCase()))
  }, [rawTree, selectedNodeId, userKeyword])

  // initialSelected는 호출 측에서 합성 id(음수)로 복원되는 경우가 있어,
  // id만으로 비교하면 실제 트리의 동일 사용자가 중복 추가됨.
  // 이름+부서 복합 키로 동일인 판별.
  const userKey = (u: UserInfo) => `${(u.name || '').trim()}|${(u.department || '').trim()}`

  const isUserSelected = (u: UserInfo) => selectedUsers.some(s => userKey(s) === userKey(u))

  const toggleUser = (u: UserInfo) => {
    setSelectedUsers(prev =>
      prev.some(s => userKey(s) === userKey(u))
        ? prev.filter(s => userKey(s) !== userKey(u))
        : [...prev, u]
    )
  }

  const toggleAllInList = () => {
    const allSelected = usersInNode.every(u => isUserSelected(u))
    if (allSelected) {
      setSelectedUsers(prev => prev.filter(s => !usersInNode.some(u => userKey(u) === userKey(s))))
    } else {
      setSelectedUsers(prev => {
        const newOnes = usersInNode.filter(u => !prev.some(s => userKey(s) === userKey(u)))
        return [...prev, ...newOnes]
      })
    }
  }

  const handleConfirm = () => {
    const seen = new Set<string>()
    const deduped = selectedUsers.filter(u => {
      const k = userKey(u)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    onConfirm(deduped)
    setSelectedUsers([])
    setSelectedNodeId(null)
    setTreeKeyword('')
    setUserKeyword('')
  }

  const handleClose = () => {
    setSelectedUsers([])
    setSelectedNodeId(null)
    setTreeKeyword('')
    setUserKeyword('')
    onClose()
  }

  // 트리 렌더링 (중복 nodeId 제거, 기존 담당자 선택 모달과 동일 스타일)
  const renderedNodeIds = useRef(new Set<string>())
  const renderTreeNode = (node: CompanyTreeNode): React.ReactNode => {
    if (renderedNodeIds.current.has(node.nodeId)) return null
    renderedNodeIds.current.add(node.nodeId)
    return (
      <TreeItem
        key={node.nodeId}
        itemId={node.nodeId}
        slotProps={{
          iconContainer: {
            onMouseDown: () => { allowExpansionRef.current = true },
          },
        }}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 0 }}>
            {node.type === 'COMPANY'
              ? <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
              : <FolderIcon sx={{ fontSize: 16, mr: 0.5, color: 'warning.main' }} />
            }
            <Typography fontWeight="bold" sx={{ fontSize: '1rem' }}>{node.label}</Typography>
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: { width: { xs: '95vw', md: 1000 }, height: { xs: '90vh', md: 650 }, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', py: 1.5 }}>
        <Typography component="span" variant="h6" fontWeight="bold">{title || t('common.selectEmployee', '직원 선택')}</Typography>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
        {/* Left: Company Tree (USER 제외) */}
        <Box sx={{ width: { xs: '100%', md: 340 }, borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: { xs: 220, md: 'auto' } }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              fullWidth
              placeholder={t('common.searchDept', '부서 검색')}
              value={treeKeyword}
              onChange={(e) => setTreeKeyword(e.target.value)}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : filteredTree.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                {t('common.noData', '데이터가 없습니다')}
              </Box>
            ) : (
              <SimpleTreeView
                slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
                expandedItems={expandedItems}
                onExpandedItemsChange={(_, ids) => {
                  // 화살표 클릭 또는 검색어 변경에 의한 프로그래매틱 변경만 허용
                  if (allowExpansionRef.current) {
                    setExpandedItems(ids)
                    allowExpansionRef.current = false
                  }
                }}
                selectedItems={selectedNodeId}
                onSelectedItemsChange={(_, id) => setSelectedNodeId(id as string | null)}
              >
                {renderTree(filteredTree)}
              </SimpleTreeView>
            )}
          </Box>
        </Box>

        {/* Right: User List (multi-select) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: { xs: 250, md: 'auto' } }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              fullWidth
              placeholder={t('common.searchByName', '이름 검색')}
              value={userKeyword}
              onChange={(e) => setUserKeyword(e.target.value)}
              disabled={!selectedNodeId}
            />
            {selectedNodeId && usersInNode.length > 0 && (
              <Button size="small" variant="outlined" onClick={toggleAllInList} sx={{ whiteSpace: 'nowrap' }}>
                {usersInNode.every(u => isUserSelected(u)) ? t('common.deselectAll', '전체 해제') : t('common.selectAll', '전체 선택')}
              </Button>
            )}
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {!selectedNodeId ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <BusinessIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">{t('common.selectDeptFirst', '왼쪽에서 회사/부서를 선택하세요')}</Typography>
              </Box>
            ) : usersInNode.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                {t('common.noData', '데이터가 없습니다')}
              </Box>
            ) : (
              <List dense disablePadding>
                {usersInNode.map(u => (
                  <ListItemButton key={u.id} onClick={() => toggleUser(u)} sx={{ py: 0.75 }}>
                    <Checkbox edge="start" checked={isUserSelected(u)} tabIndex={-1} disableRipple size="small" />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{u.name}</Typography>
                          {u.department && (
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>· {u.department}</Typography>
                          )}
                        </Box>
                      }
                      secondary={u.email || ''}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Selected chips footer */}
      {selectedUsers.length > 0 && (
        <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 0.75, minHeight: 90, maxHeight: 200, overflowY: 'auto' }}>
          {selectedUsers.map(u => (
            <Chip
              key={userKey(u)}
              label={`${u.name}${u.department ? ' (' + u.department + ')' : ''}`}
              size="small"
              onDelete={() => toggleUser(u)}
            />
          ))}
        </Box>
      )}

      <Divider />
      <DialogActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {t('common.selectedCount', '선택됨')}: <strong>{selectedUsers.length}</strong>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose}>{t('common.cancel', '취소')}</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={selectedUsers.length === 0}>
            {t('common.add', '추가')} ({selectedUsers.length})
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default DeptUserMultiSelectModal
