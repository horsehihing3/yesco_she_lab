import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
  Typography, CircularProgress, IconButton,
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
import { CompanyTreeNode } from './UserSelectModal'

interface DepartmentSelectModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (department: string) => void
  title?: string
  initialDepartment?: string
}

const fetchCompanyTree = async (): Promise<CompanyTreeNode[]> => {
  const response = await axiosInstance.get<ApiResponse<CompanyTreeNode[]>>('/users/company-tree')
  return response.data.data
}

// USER 노드 제외 — 회사·부서만 남김
const stripUsers = (nodes: CompanyTreeNode[]): CompanyTreeNode[] => {
  return nodes
    .filter(n => n.type !== 'USER')
    .map(n => ({ ...n, children: stripUsers(n.children || []) }))
}

const collectAllNodeIds = (nodes: CompanyTreeNode[]): string[] => {
  const ids: string[] = []
  const walk = (list: CompanyTreeNode[]) => {
    list.forEach(n => { ids.push(n.nodeId); if (n.children) walk(n.children) })
  }
  walk(nodes)
  return ids
}

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

const DepartmentSelectModal: React.FC<DepartmentSelectModalProps> = ({ open, onClose, onConfirm, title, initialDepartment }) => {
  const { t } = useTranslation()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const { data: rawTree, isLoading } = useQuery({
    queryKey: ['companyTreeFull'],
    queryFn: fetchCompanyTree,
    enabled: open,
  })

  const tree = useMemo(() => stripUsers(rawTree || []), [rawTree])

  // 이전에 선택된 부서명이 있으면 해당 노드 선택
  useEffect(() => {
    if (!open) return
    setSelectedNodeId(null)
    if (!initialDepartment || !rawTree) return
    const matchByLabel = (nodes: CompanyTreeNode[]): CompanyTreeNode | null => {
      for (const n of nodes) {
        if (n.type === 'GROUP' && n.label === initialDepartment) return n
        if (n.children) {
          const f = matchByLabel(n.children)
          if (f) return f
        }
      }
      return null
    }
    const found = matchByLabel(tree)
    if (found) setSelectedNodeId(found.nodeId)
  }, [open, initialDepartment, rawTree, tree])

  const filteredTree = useMemo(() => {
    if (!keyword.trim()) return tree
    const lower = keyword.toLowerCase()
    const filterNode = (node: CompanyTreeNode): CompanyTreeNode | null => {
      const filteredChildren = (node.children || []).map(filterNode).filter((c): c is CompanyTreeNode => c !== null)
      if (node.label.toLowerCase().includes(lower) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }
      }
      return null
    }
    return tree.map(filterNode).filter((n): n is CompanyTreeNode => n !== null)
  }, [tree, keyword])

  useEffect(() => {
    if (keyword.trim()) {
      setExpandedItems(collectAllNodeIds(filteredTree))
    } else if (tree.length > 0) {
      setExpandedItems(collectAllNodeIds(tree))
    }
  }, [keyword, filteredTree, tree])

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !rawTree) return null
    return findNode(rawTree, selectedNodeId)
  }, [rawTree, selectedNodeId])

  const canConfirm = !!selectedNode && selectedNode.type === 'GROUP'

  const handleConfirm = () => {
    if (!canConfirm || !selectedNode) return
    onConfirm(selectedNode.label)
    setSelectedNodeId(null)
    setKeyword('')
  }

  const handleClose = () => {
    setSelectedNodeId(null)
    setKeyword('')
    onClose()
  }

  const renderedNodeIds = useRef(new Set<string>())
  const renderTreeNode = (node: CompanyTreeNode): React.ReactNode => {
    if (renderedNodeIds.current.has(node.nodeId)) return null
    renderedNodeIds.current.add(node.nodeId)
    return (
      <TreeItem
        key={node.nodeId}
        itemId={node.nodeId}
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
      PaperProps={{ sx: { width: { xs: '95vw', md: 520 }, height: { xs: '85vh', md: 600 }, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', py: 1.5 }}>
        <Typography component="span" variant="h6" fontWeight="bold">{title || t('common.selectDepartment', '부서 선택')}</Typography>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            size="small" fullWidth
            placeholder={t('common.searchDept', '부서 검색')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
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
              onExpandedItemsChange={(_, ids) => setExpandedItems(ids)}
              selectedItems={selectedNodeId}
              onSelectedItemsChange={(_, id) => setSelectedNodeId(id as string | null)}
            >
              {renderTree(filteredTree)}
            </SimpleTreeView>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 1.5 }}>
        <Box sx={{ flex: 1, fontSize: '0.85rem', color: 'text.secondary', pl: 1 }}>
          {selectedNode?.type === 'GROUP'
            ? `${t('common.selected', '선택됨')}: ${selectedNode.label}`
            : t('common.selectDeptFirst', '부서를 선택하세요')}
        </Box>
        <Button onClick={handleClose} variant="outlined">{t('common.cancel', '취소')}</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!canConfirm}>{t('common.confirm', '확인')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DepartmentSelectModal
