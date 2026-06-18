import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../contexts/AlertContext'
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Button,
  Divider,
  Avatar,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
} from '@mui/material'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import FolderIcon from '@mui/icons-material/Folder'
import BusinessIcon from '@mui/icons-material/Business'
import { ApprovalLineItem } from '../types/approval.types'
import { fetchApprovalLines, saveAllApprovalLines } from '../api/approvalApi'
import { userApi } from '../api/userApi'
import { CompanyTreeNode } from '../components/common/UserSelectModal'
import useCodeMap from '../hooks/useCodeMap'
import FlowChartButton from '../components/common/FlowChartButton'

const collectAllNodeIds = (nodes: CompanyTreeNode[]): string[] => {
  const ids: string[] = []
  const walk = (list: CompanyTreeNode[]) => {
    list.forEach((n) => {
      ids.push(n.nodeId)
      if (n.children?.length) walk(n.children)
    })
  }
  walk(nodes)
  return ids
}

const filterDeptTree = (nodes: CompanyTreeNode[], query: string): CompanyTreeNode[] => {
  const q = query.toLowerCase()
  const nodeMatchesQuery = (node: CompanyTreeNode): boolean => {
    if (node.label?.toLowerCase().includes(q)) return true
    if (node.name?.toLowerCase().includes(q)) return true
    if (node.nameEn?.toLowerCase().includes(q)) return true
    if (node.username?.toLowerCase().includes(q)) return true
    return false
  }
  const subtreeHasMatch = (node: CompanyTreeNode): boolean => {
    if (nodeMatchesQuery(node)) return true
    return node.children.some(subtreeHasMatch)
  }
  const filterNode = (node: CompanyTreeNode): CompanyTreeNode | null => {
    if (node.type === 'USER') return null
    if (nodeMatchesQuery(node)) return node
    if (node.children.some((child) => child.type === 'USER' && nodeMatchesQuery(child))) return node
    const filteredChildren = node.children
      .map(filterNode)
      .filter((child): child is CompanyTreeNode => child !== null)
    if (filteredChildren.length > 0) return { ...node, children: filteredChildren }
    return null
  }
  return nodes.map(filterNode).filter((n): n is CompanyTreeNode => n !== null)
}

const findNodeById = (nodes: CompanyTreeNode[], id: string): CompanyTreeNode | null => {
  for (const node of nodes) {
    if (node.nodeId === id) return node
    const found = findNodeById(node.children, id)
    if (found) return found
  }
  return null
}

const collectUsersFromNode = (node: CompanyTreeNode): CompanyTreeNode[] => {
  if (node.type === 'USER') return [node]
  return node.children.flatMap(collectUsersFromNode)
}

const ApprovalLinePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showWarning } = useAlert()

  // ----- Code Maps -----
  const { codeList: approvalItemList } = useCodeMap('APPROVAL_ITEM')

  // ----- State -----
  const [deptSearch, setDeptSearch] = useState('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<string>('')
  const [localLines, setLocalLines] = useState<ApprovalLineItem[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedDeptNodeId, setSelectedDeptNodeId] = useState<string | null>(null)
  const [, setUserSearchQuery] = useState('')

  // ----- Company Tree Query -----
  const { data: companyTree, isLoading: isLoadingTree } = useQuery({
    queryKey: ['companyTree'],
    queryFn: userApi.getCompanyTree,
  })

  useEffect(() => {
    if (companyTree && expandedItems.length === 0) {
      setExpandedItems(collectAllNodeIds(companyTree))
    }
  }, [companyTree])

  useEffect(() => {
    if (approvalItemList.length > 0 && !selectedApprovalItem) {
      setSelectedApprovalItem(approvalItemList[0].code)
    }
  }, [approvalItemList, selectedApprovalItem])

  // ----- Approval Lines Query -----
  const { data: approvalLinesData, isLoading: isLoadingLines } = useQuery({
    queryKey: ['approvalLines', selectedApprovalItem, selectedDeptNodeId],
    queryFn: () => fetchApprovalLines(selectedApprovalItem, selectedDeptNodeId!),
    enabled: !!selectedDeptNodeId && !!selectedApprovalItem,
  })

  useEffect(() => {
    setLocalLines(approvalLinesData || [])
    setHasChanges(false)
  }, [approvalLinesData])

  // ----- Mutation -----
  const saveLinesMutation = useMutation({
    mutationFn: (lines: ApprovalLineItem[]) =>
      saveAllApprovalLines(
        selectedApprovalItem,
        selectedDeptNodeId!,
        lines.map((l) => ({
          approvalItemCode: selectedApprovalItem,
          deptCode: selectedDeptNodeId!,
          lineOrder: l.lineOrder,
          approverName: l.approverName,
          approverPosition: l.approverPosition,
          approverEmail: l.approverEmail,
          approverPhone: l.approverPhone,
          approverDept: l.approverDept,
          hasFinalAuthority: l.hasFinalAuthority,
        }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalLines', selectedApprovalItem, selectedDeptNodeId] })
      setHasChanges(false)
      showSuccess(t('approval.saveSuccess'))
    },
  })

  // ----- Tree Helpers -----
  const filteredCompanyTree = (() => {
    if (!companyTree) return []
    if (!deptSearch.trim()) return companyTree
    return filterDeptTree(companyTree, deptSearch)
  })()

  const selectedDeptNode = selectedDeptNodeId && companyTree
    ? findNodeById(companyTree, selectedDeptNodeId)
    : null

  const deptUsers = selectedDeptNode ? collectUsersFromNode(selectedDeptNode) : []

  const renderedNodeIds = { current: new Set<string>() }
  const renderTreeNode = (node: CompanyTreeNode) => {
    if (node.type === 'USER') return null
    if (renderedNodeIds.current.has(node.nodeId)) return null
    renderedNodeIds.current.add(node.nodeId)
    const isSelected = selectedDeptNodeId === node.nodeId
    const groupChildren = node.children.filter((c) => c.type !== 'USER')
    const userCount = collectUsersFromNode(node).length
    return (
      <TreeItem
        key={node.nodeId}
        itemId={node.nodeId}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 0.5,
              cursor: 'pointer',
              borderRadius: 1,
              bgcolor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
            }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDeptNodeId(node.nodeId)
              setUserSearchQuery('')
            }}
          >
            {node.type === 'COMPANY' ? (
              <BusinessIcon sx={{ fontSize: 18, mr: 0.5, color: 'primary.main' }} />
            ) : (
              <FolderIcon sx={{ fontSize: 18, mr: 0.5, color: 'warning.main' }} />
            )}
            <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'} sx={{ flex: 1 }}>
              {node.label}
            </Typography>
            <Chip label={userCount} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
          </Box>
        }
      >
        {groupChildren.map(renderTreeNode)}
      </TreeItem>
    )
  }

  // ----- Handlers -----
  function getDisplayName(node: CompanyTreeNode) {
    if (i18n.language === 'en' && node.nameEn) return node.nameEn
    if (i18n.language === 'zh' && node.nameZh) return node.nameZh
    return node.name || node.label
  }

  const getDisplayEmail = (node: CompanyTreeNode) => {
    if (node.username) return `${node.username}@hankook.com`
    return node.email || ''
  }

  const handleAddUserToLine = (userNode: CompanyTreeNode) => {
    const email = getDisplayEmail(userNode)
    const isDuplicate = localLines.some((l) => l.approverEmail === email)
    if (isDuplicate) {
      showWarning(`${t('approval.duplicateApprover')}: ${getDisplayName(userNode)}`)
      return
    }
    const newOrder = localLines.length + 1
    const newItem: ApprovalLineItem = {
      id: Date.now() + newOrder,
      approvalItemCode: selectedApprovalItem,
      deptCode: selectedDeptNodeId || '',
      lineOrder: newOrder,
      approverName: getDisplayName(userNode),
      approverPosition: '',
      approverEmail: email,
      approverDept: userNode.department || selectedDeptNode?.label || '',
      hasFinalAuthority: false,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setLocalLines((prev) => [...prev, newItem])
    setHasChanges(true)
  }

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return
    const srcIdx = result.source.index
    const destIdx = result.destination.index
    if (srcIdx === destIdx) return
    setLocalLines((prev) => {
      const updated = [...prev]
      const [moved] = updated.splice(srcIdx, 1)
      updated.splice(destIdx, 0, moved)
      return updated.map((item, idx) => ({ ...item, lineOrder: idx + 1 }))
    })
    setHasChanges(true)
  }, [])

  const handleDeleteLine = (lineId: number) => {
    setLocalLines((prev) =>
      prev
        .filter((item) => item.id !== lineId)
        .map((item, idx) => ({ ...item, lineOrder: idx + 1 }))
    )
    setHasChanges(true)
  }

  const handleToggleFinalAuthority = (lineId: number) => {
    setLocalLines((prev) =>
      prev.map((item) =>
        item.id === lineId ? { ...item, hasFinalAuthority: !item.hasFinalAuthority } : item
      )
    )
    setHasChanges(true)
  }

  const handleSaveLines = () => {
    if (!selectedDeptNodeId) return
    saveLinesMutation.mutate(localLines)
  }

  const handleCancelChanges = () => {
    if (approvalLinesData) {
      setLocalLines(approvalLinesData)
    } else {
      setLocalLines([])
    }
    setHasChanges(false)
  }

  return (
    <Box sx={{ overflow: 'hidden', height: { md: 'calc(100vh - 160px)' } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 }, height: '100%' }}>
        {/* Left Panel: Department Tree */}
        <Paper
          variant="outlined"
          sx={{
            width: { xs: '100%', md: '25%' },
            minWidth: { md: 220 },
            maxHeight: { xs: 250, md: 'none' },
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
            {t('approval.orgChart')}
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder={t('approval.deptSearch')}
            value={deptSearch}
            onChange={(e) => setDeptSearch(e.target.value)}
            sx={{ mb: 1.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {isLoadingTree ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={20} />
              </Box>
            ) : filteredCompanyTree.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {t('approval.noData')}
              </Typography>
            ) : (
              <SimpleTreeView
                expandedItems={expandedItems}
                onExpandedItemsChange={(_, itemIds) => setExpandedItems(itemIds)}
                slots={{
                  expandIcon: ChevronRightIcon,
                  collapseIcon: ExpandMoreIcon,
                }}
              >
                {(() => { renderedNodeIds.current = new Set<string>(); return filteredCompanyTree.map(renderTreeNode) })()}
              </SimpleTreeView>
            )}
          </Box>
        </Paper>

        {/* Right Panel: Approval Line */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
          {/* Title & Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('approval.approvalLine')}
              {selectedDeptNode && (
                <Chip label={selectedDeptNode.label} color="primary" size="small" sx={{ ml: 1, fontWeight: 'bold' }} />
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <FlowChartButton flowKey="approvalLine" />
              {hasChanges && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveLines}
                    disabled={saveLinesMutation.isPending}
                  >
                    {t('approval.save')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancelChanges}
                  >
                    {t('approval.cancel')}
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Content: Members (left) + Approval Line Cards (right) */}
          {!selectedDeptNode ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Typography color="text.secondary">{t('approval.selectDeptFirst', '좌측에서 부서를 선택하세요')}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flex: 1, overflow: 'hidden' }}>
              {/* Members List */}
              <Box sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: { xs: 250, md: '100%' }, overflow: 'hidden' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  {deptUsers.length}{t('approval.people', '명')}
                </Typography>
                <Box sx={{ overflowY: 'auto', flex: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {deptUsers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      {selectedDeptNodeId ? t('approval.noMembers', '소속 직원이 없습니다') : t('approval.selectDeptFirst', '부서를 선택하세요')}
                    </Typography>
                  ) : (
                    <List dense disablePadding>
                      {deptUsers.map((user) => {
                        const isAlreadyAdded = localLines.some((l) => l.approverEmail === getDisplayEmail(user))
                        return (
                          <ListItemButton
                            key={user.nodeId}
                            onClick={() => handleAddUserToLine(user)}
                            disabled={isAlreadyAdded}
                            sx={{
                              borderRadius: 0,
                              borderBottom: 1,
                              borderColor: 'divider',
                              opacity: isAlreadyAdded ? 0.5 : 1,
                            }}
                          >
                            <ListItemAvatar sx={{ minWidth: 40 }}>
                              <Avatar
                                sx={{
                                  width: 30,
                                  height: 30,
                                  fontSize: 13,
                                  bgcolor: isAlreadyAdded ? 'grey.400' : 'primary.main',
                                  color: 'primary.contrastText',
                                }}
                              >
                                {getDisplayName(user).charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="bold" noWrap>
                                  {getDisplayName(user)}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {getDisplayEmail(user)}
                                  {isAlreadyAdded && ` (${t('approval.alreadyAdded')})`}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        )
                      })}
                    </List>
                  )}
                </Box>
              </Box>

              {/* Approval Line Cards */}
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {isLoadingLines ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : localLines.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <Typography color="text.secondary">{t('approval.noLine')}</Typography>
                  </Box>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="approval-lines">
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                        >
                          {localLines.map((line, index) => (
                            <Draggable key={line.id} draggableId={String(line.id)} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  variant="outlined"
                                  sx={{
                                    ...(snapshot.isDragging && {
                                      boxShadow: 4,
                                      bgcolor: 'background.paper',
                                    }),
                                  }}
                                >
                                  <CardContent sx={{ py: 1.5, px: { xs: 1, md: 2 }, '&:last-child': { pb: 1.5 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                                      <Box {...provided.dragHandleProps} sx={{ display: 'flex', alignItems: 'center' }}>
                                        <DragIndicatorIcon fontSize="small" sx={{ color: 'grey.400', cursor: 'grab' }} />
                                      </Box>
                                      <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                        sx={{
                                          bgcolor: 'primary.main',
                                          color: 'primary.contrastText',
                                          borderRadius: '50%',
                                          width: 28,
                                          height: 28,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {line.lineOrder}
                                      </Typography>
                                      <Avatar
                                        sx={{
                                          width: 36,
                                          height: 36,
                                          bgcolor: 'primary.main',
                                          color: 'primary.contrastText',
                                          fontSize: 14,
                                          fontWeight: 'bold',
                                          flexShrink: 0,
                                          display: { xs: 'none', sm: 'flex' },
                                        }}
                                      >
                                        {line.approverName ? line.approverName.charAt(0) : '?'}
                                      </Avatar>
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" fontWeight="bold" noWrap>
                                          {line.approverName || ''}
                                          {line.approverEmail && (
                                            <Box component="span" sx={{ ml: 1, fontWeight: 'normal', color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>
                                              {line.approverEmail}
                                            </Box>
                                          )}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          {line.approverPosition && `${line.approverPosition} | `}
                                          {line.approverDept}
                                        </Typography>
                                      </Box>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            size="small"
                                            checked={line.hasFinalAuthority}
                                            onChange={() => handleToggleFinalAuthority(line.id)}
                                          />
                                        }
                                        label={
                                          <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'inline' } }}>{t('approval.finalAuthority')}</Typography>
                                        }
                                        sx={{ mr: 0, flexShrink: 0 }}
                                      />
                                      <IconButton size="small" color="error" onClick={() => handleDeleteLine(line.id)}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  )
}

export default ApprovalLinePage
