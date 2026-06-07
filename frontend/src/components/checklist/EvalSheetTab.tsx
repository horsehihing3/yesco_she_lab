import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import ListSearchBar from '../common/ListSearchBar'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, CircularProgress, Stack, Chip, Tooltip,
  TextField, Alert, Radio,
} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useAlert } from '../../contexts/AlertContext'
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import { evalSheetApi, EvalSheetItem } from '../../api/evalSheetApi'
import { FileMetadata } from '../../types/file.types'

type ViewMode = 'list' | 'detail'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

interface DraftItem {
  id?: number
  sortOrder: number
  category: string
  evalItem: string
  evalContent: string
  maxScore: number
  _isNew?: boolean
}

const EvalSheetTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => setKeyword(keywordInput)
  const handleResetSearch = () => { setKeywordInput(''); setKeyword('') }
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingUploads, setPendingUploads] = useState<Record<number, File[]>>({})
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([])
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [removedIds, setRemovedIds] = useState<number[]>([])
  const [metaDraft, setMetaDraft] = useState<{ title: string; description: string }>({ title: '', description: '' })
  // multi-instance — list 의 라디오 선택, detail 진입시 보고 있는 평가표
  const [copyTargetId, setCopyTargetId] = useState<number | null>(null)
  const [selectedMetaId, setSelectedMetaId] = useState<number | null>(null)

  // 평가표(meta) 전체 목록 — 최신 생성순
  const { data: metas = [], isLoading: isLoadingMetas } = useQuery({
    queryKey: ['evalSheetMetas'],
    queryFn: () => evalSheetApi.listMetas(),
  })

  const { data: items, isLoading } = useQuery({
    queryKey: ['evalSheetItems', selectedMetaId],
    queryFn: () => evalSheetApi.getAll(selectedMetaId || undefined),
    enabled: viewMode === 'detail' && selectedMetaId != null,
  })

  // 선택된 평가표의 meta 정보
  const meta = useMemo(() => {
    if (selectedMetaId == null) return undefined
    return metas.find(m => m.id === selectedMetaId)
  }, [metas, selectedMetaId])

  const { data: attachmentsMap, isFetching: isFetchingAttachments } = useQuery({
    queryKey: ['evalSheetAttachments', items?.map(i => i.id).join(',')],
    queryFn: async () => {
      if (!items) return {} as Record<number, FileMetadata[]>
      const entries = await Promise.all(items.map(async (it) => {
        const list = await evalSheetApi.listAttachments(it.id)
        return [it.id, list] as const
      }))
      return Object.fromEntries(entries) as Record<number, FileMetadata[]>
    },
    enabled: !!items && items.length > 0 && viewMode === 'detail',
  })

  useEffect(() => {
    if (items && !isEditing) {
      setDrafts(items.map(i => ({
        id: i.id,
        sortOrder: i.sortOrder,
        category: i.category,
        evalItem: i.evalItem,
        evalContent: i.evalContent,
        maxScore: Number(i.maxScore),
      })))
      setRemovedIds([])
    }
  }, [items, isEditing])

  useEffect(() => {
    if (meta && !isEditing) {
      setMetaDraft({ title: meta.title || '', description: meta.description || '' })
    }
  }, [meta, isEditing])

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // 편집 모드: 저장 버튼 클릭 시까지 보류. 조회 모드: 즉시 업로드.
  const handleAddFiles = async (item: EvalSheetItem, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    if (isEditing) {
      const files = Array.from(fileList)
      setPendingUploads(prev => ({ ...prev, [item.id]: [...(prev[item.id] || []), ...files] }))
      return
    }
    try {
      for (const file of Array.from(fileList)) {
        await evalSheetApi.uploadAttachment(item.id, file)
      }
      queryClient.invalidateQueries({ queryKey: ['evalSheetAttachments'] })
      showSuccess(t('common.saved'))
    } catch { showError(t('common.error')) }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (isEditing) {
      setPendingDeletes(prev => prev.includes(fileId) ? prev : [...prev, fileId])
      return
    }
    try {
      await evalSheetApi.deleteAttachment(fileId)
      queryClient.invalidateQueries({ queryKey: ['evalSheetAttachments'] })
    } catch { showError(t('common.error')) }
  }

  const removePendingUpload = (itemId: number, fileIdx: number) => {
    setPendingUploads(prev => {
      const arr = (prev[itemId] || []).filter((_, i) => i !== fileIdx)
      const next = { ...prev }
      if (arr.length === 0) delete next[itemId]
      else next[itemId] = arr
      return next
    })
  }

  const undoPendingDelete = (fileId: number) => {
    setPendingDeletes(prev => prev.filter(id => id !== fileId))
  }

  const computeCategoryMeta = (rows: { category: string; maxScore: number | string }[]) => {
    const spans: Record<number, number> = {}
    const sums: Record<number, number> = {}
    let i = 0
    while (i < rows.length) {
      let j = i + 1
      let sum = Number(rows[i].maxScore)
      while (j < rows.length && rows[j].category === rows[i].category) {
        sum += Number(rows[j].maxScore)
        j++
      }
      spans[i] = j - i
      sums[i] = sum
      i = j
    }
    return { spans, sums }
  }

  const handleNew = () => {
    setSelectedMetaId(null)   // 신규 평가표 — 저장 시 backend 가 새 meta 생성
    setDrafts([])
    setRemovedIds([])
    setMetaDraft({ title: t('evalSheet.evalTitle', '수급업체 평가표'), description: '' })
    setIsCreating(true)
    setIsEditing(true)
    setViewMode('detail')
  }

  // 평가표 복사 — 백엔드에서 meta + 항목까지 일괄 복제
  const handleCopy = async () => {
    if (copyTargetId == null) return
    try {
      await evalSheetApi.copyMeta(copyTargetId)
      queryClient.invalidateQueries({ queryKey: ['evalSheetMetas'] })
      setCopyTargetId(null)
      showSuccess(t('common.saved', '복사되었습니다.'))
    } catch { showError(t('common.error', '실패했습니다.')) }
  }

  const handleDeleteMeta = async (id: number) => {
    if (!(await showConfirm(t('common.confirmDelete', '정말 삭제하시겠습니까?')))) return
    try {
      await evalSheetApi.deleteMeta(id)
      queryClient.invalidateQueries({ queryKey: ['evalSheetMetas'] })
      showSuccess(t('common.deleted', '삭제되었습니다'))
    } catch { showError(t('common.error')) }
  }

  const handleEdit = () => {
    setIsCreating(false)
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (items) {
      setDrafts(items.map(i => ({
        id: i.id,
        sortOrder: i.sortOrder,
        category: i.category,
        evalItem: i.evalItem,
        evalContent: i.evalContent,
        maxScore: Number(i.maxScore),
      })))
    }
    if (meta) setMetaDraft({ title: meta.title || '', description: meta.description || '' })
    setRemovedIds([])
    setPendingUploads({})
    setPendingDeletes([])
    setIsEditing(false)
    if (isCreating) {
      setIsCreating(false)
      setViewMode('list')
    }
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const saved = await evalSheetApi.saveAll({
        meta: {
          id: selectedMetaId == null ? undefined : selectedMetaId,
          title: metaDraft.title,
          description: metaDraft.description,
        },
        items: drafts.map(d => ({
          id: d.id,
          category: d.category,
          evalItem: d.evalItem,
          evalContent: d.evalContent,
          maxScore: d.maxScore,
        })),
        removedIds,
      })
      // 신규 등록 후 selectedMetaId 갱신 — 후속 첨부파일/편집이 새 meta 와 연결
      if (selectedMetaId == null && saved.meta?.id) {
        setSelectedMetaId(saved.meta.id)
      }
      // 보류된 첨부파일 처리
      for (const fileId of pendingDeletes) {
        try { await evalSheetApi.deleteAttachment(fileId) } catch { /* skip */ }
      }
      for (const [itemIdStr, files] of Object.entries(pendingUploads)) {
        const itemId = Number(itemIdStr)
        for (const file of files) {
          try { await evalSheetApi.uploadAttachment(itemId, file) } catch { /* skip */ }
        }
      }
      setPendingUploads({})
      setPendingDeletes([])
      queryClient.invalidateQueries({ queryKey: ['evalSheetMetas'] })
      queryClient.invalidateQueries({ queryKey: ['evalSheetItems'] })
      queryClient.invalidateQueries({ queryKey: ['evalSheetAttachments'] })
      showSuccess(t('common.saved'))
      setIsEditing(false)
      setIsCreating(false)
    } catch {
      showError(t('common.error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAll = async () => {
    if (selectedMetaId == null) return
    const ok = await showConfirm(t('common.confirmDelete', '정말 삭제하시겠습니까?'))
    if (!ok) return
    try {
      await evalSheetApi.deleteMeta(selectedMetaId)
      queryClient.invalidateQueries({ queryKey: ['evalSheetMetas'] })
      queryClient.invalidateQueries({ queryKey: ['evalSheetItems'] })
      showSuccess(t('common.deleted', '삭제되었습니다'))
      setIsEditing(false)
      setSelectedMetaId(null)
      setViewMode('list')
    } catch { showError(t('common.error')) }
  }

  const updateDraft = (idx: number, patch: Partial<DraftItem>) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d))
  }

  const addDraftRow = () => {
    setDrafts(prev => [...prev, {
      sortOrder: prev.length + 1,
      category: '',
      evalItem: '',
      evalContent: '',
      maxScore: 0,
      _isNew: true,
    }])
  }

  const removeDraftRow = (idx: number) => {
    setDrafts(prev => {
      const removed = prev[idx]
      if (removed.id) setRemovedIds(rids => [...rids, removed.id!])
      return prev.filter((_, i) => i !== idx)
    })
  }

  // 전체 평가표(meta) 목록 — 최신 생성순 + 검색어 필터
  const listRows = useMemo(() => {
    let rows = metas.map(m => ({
      id: m.id,
      title: m.title || t('evalSheet.evalTitle', '수급업체 평가표'),
      createdAt: m.createdAt,
    }))
    if (keyword.trim()) {
      const k = keyword.toLowerCase()
      rows = rows.filter(r => r.title.toLowerCase().includes(k))
    }
    return rows
  }, [metas, keyword, t])

  if (isLoadingMetas) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  // ==================== LIST VIEW ====================
  if (viewMode === 'list') {
    return (
      <Box>
        {/* Search - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('checklist.searchPlaceholder', '제목으로 검색')}
              value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} sx={{ minWidth: 250 }} />
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<ContentCopyIcon />}
              disabled={copyTargetId == null} onClick={handleCopy}>
              {t('common.copy', '복사')}
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNew}>
              {t('common.new', '신규')}
            </Button>
          </Box>
        </Box>
        {/* Search - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('checklist.searchPlaceholder', '제목으로 검색')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleResetSearch} sx={{ flex: '1 1 calc(50% - 4px)' }}>
              {t('common.reset', '초기화')}
            </Button>
            <Button variant="contained" size="small" startIcon={<ContentCopyIcon />}
              disabled={copyTargetId == null} onClick={handleCopy}
              sx={{ flex: '1 1 calc(50% - 4px)' }}>
              {t('common.copy', '복사')}
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNew} sx={{ flex: '1 1 calc(50% - 4px)' }}>
              {t('common.new', '신규')}
            </Button>
          </Box>
        </Box>

        {listRows.length === 0 ? (
          <Alert severity="info">{t('common.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headerCellSx, width: 48, p: 0 }} align="center"></TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 40 }} align="center">{t('common.no', 'No')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('common.title', '제목')}</TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 120 }} align="center">{t('common.createdAt', '작성일')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listRows.map((row, idx) => (
                    <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}
                      onClick={() => { setSelectedMetaId(row.id); setIsEditing(false); setIsCreating(false); setViewMode('detail') }}>
                      <TableCell align="center" sx={{ width: 48, p: 0 }} onClick={(e) => e.stopPropagation()}>
                        <Radio size="small" checked={copyTargetId === row.id}
                          onChange={() => setCopyTargetId(row.id)} value={row.id} name="eval-sheet-copy-radio" />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>{idx + 1}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600} color="primary">{row.title}</Typography></TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {row.createdAt?.substring(0, 10) || ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {listRows.map((row) => (
                <Paper key={row.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'grey.300' }}
                  onClick={() => { setSelectedMetaId(row.id); setIsEditing(false); setIsCreating(false); setViewMode('detail') }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Radio size="small" checked={copyTargetId === row.id}
                        onChange={() => setCopyTargetId(row.id)} value={row.id} name="eval-sheet-copy-radio-mobile" />
                    </Box>
                    <Typography fontWeight="bold" color="primary" sx={{ flex: 1 }}>{row.title}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('common.createdAt', '작성일')}: {row.createdAt?.substring(0, 10) || ''}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Box>
    )
  }

  // ==================== DETAIL VIEW ====================
  const { spans: viewSpans, sums: viewSums } = computeCategoryMeta(items || [])
  const editSums = (() => {
    const sums: Record<string, number> = {}
    drafts.forEach(d => {
      const key = (d.category || '').trim()
      sums[key] = (sums[key] || 0) + Number(d.maxScore || 0)
    })
    return sums
  })()

  const labelCellSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center' } as const

  return (
    <Box>
      {/* 체크리스트 정보 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('checklist.checklistInfo', '체크리스트 정보')}</Typography>
        <Paper sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
          {/* 제목 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Box sx={labelCellSx}>{t('common.title', '제목')}</Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              {isEditing ? (
                <TextField size="small" fullWidth value={metaDraft.title}
                  onChange={e => setMetaDraft({ ...metaDraft, title: e.target.value })}
                  placeholder={t('checklist.titlePlaceholder', '체크리스트 제목을 입력하세요')} />
              ) : (
                <Typography variant="body2" color="text.primary">
                  {meta?.title || ''}
                </Typography>
              )}
            </Box>
          </Box>
          {/* 설명 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Box sx={labelCellSx}>{t('common.description', '설명')}</Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              {isEditing ? (
                <TextField size="small" fullWidth value={metaDraft.description}
                  onChange={e => setMetaDraft({ ...metaDraft, description: e.target.value })}
                  placeholder={t('checklist.descPlaceholder', '설명을 입력하세요')} />
              ) : (
                <Typography variant="body2" color="text.primary">{meta?.description || ''}</Typography>
              )}
            </Box>
          </Box>
          {/* 작성일자 */}
          <Box sx={{ display: 'flex' }}>
            <Box sx={labelCellSx}>{t('common.createdAt', '작성일자')}</Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                {(meta?.createdAt || items?.[0]?.createdAt)?.substring(0, 10) || ''}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* 평가표 */}
      <TableContainer component={Paper} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: 'divider' }, '& td:last-child, & th:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: 180 }}>{t('evalSheet.category', '구분')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: 160 }}>{t('evalSheet.evalItem', '평가항목')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>{t('evalSheet.evalContent', '평가내용')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: isEditing ? 140 : 70 }}>{t('evalSheet.maxScore', '배점')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: 90 }}>{t('evalSheet.score', '평가점수')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: 180 }}>{t('evalSheet.attachment', '첨부파일')}</TableCell>
              {isEditing && (
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: 50 }} />
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* === 편집 모드 === */}
            {isEditing && drafts.map((d, idx) => {
              const catKey = (d.category || '').trim()
              const sum = editSums[catKey] || 0
              return (
                <TableRow key={d.id ?? `new-${idx}`}>
                  <TableCell sx={{ verticalAlign: 'middle', bgcolor: 'grey.50', wordBreak: 'keep-all', px: 1 }}>
                    <TextField
                      size="small" fullWidth value={d.category}
                      placeholder={t('evalSheet.category', '구분')}
                      onChange={e => updateDraft(idx, { category: e.target.value })}
                    />
                    {catKey !== '' && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                        ({sum})
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'middle' }}>
                    <TextField size="small" fullWidth value={d.evalItem}
                      onChange={e => updateDraft(idx, { evalItem: e.target.value })} />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'middle' }}>
                    <TextField size="small" fullWidth value={d.evalContent}
                      onChange={e => updateDraft(idx, { evalContent: e.target.value })} />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'middle' }}>
                    <NumberField
                      size="small"
                      min={0}
                      step={1}
                      value={d.maxScore}
                      onChange={v => updateDraft(idx, { maxScore: v ?? 0 })}
                    />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'middle' }} />
                  <TableCell sx={{ verticalAlign: 'middle' }}>
                    {d.id ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ alignItems: 'center' }}>
                        {((attachmentsMap || {})[d.id] || []).map(f => {
                          const markedDelete = pendingDeletes.includes(f.id)
                          return (
                            <Chip
                              key={f.id}
                              size="small"
                              icon={<AttachFileIcon fontSize="small" />}
                              label={
                                <Tooltip title={f.originalFilename}>
                                  <Box component="span" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle', textDecoration: markedDelete ? 'line-through' : 'none' }}>
                                    {f.originalFilename}
                                  </Box>
                                </Tooltip>
                              }
                              onClick={() => markedDelete ? undoPendingDelete(f.id) : window.open(`/api/files/${f.id}`, '_blank')}
                              deleteIcon={<CloseIcon fontSize="small" />}
                              onDelete={markedDelete ? undefined : () => handleDeleteFile(f.id)}
                              color={markedDelete ? 'default' : undefined}
                              variant={markedDelete ? 'outlined' : 'filled'}
                            />
                          )
                        })}
                        {(pendingUploads[d.id] || []).map((file, fIdx) => (
                          <Chip
                            key={`pending-${fIdx}`}
                            size="small"
                            icon={<AttachFileIcon fontSize="small" />}
                            label={
                              <Tooltip title={file.name}>
                                <Box component="span" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }}>
                                  {file.name}
                                </Box>
                              </Tooltip>
                            }
                            color="info"
                            variant="outlined"
                            deleteIcon={<CloseIcon fontSize="small" />}
                            onDelete={() => removePendingUpload(d.id!, fIdx)}
                          />
                        ))}
                        <input
                          ref={el => { fileInputRefs.current[d.id!] = el }}
                          type="file"
                          multiple
                          hidden
                          onChange={e => {
                            handleAddFiles({ id: d.id! } as EvalSheetItem, e.target.files)
                            if (e.target) e.target.value = ''
                          }}
                        />
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<AttachFileIcon fontSize="small" />}
                          onClick={() => fileInputRefs.current[d.id!]?.click()}
                        >
                          {t('evalSheet.addFile', '파일추가')}
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {t('evalSheet.saveFirstForAttachment', '저장 후 첨부 가능')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <IconButton size="small" color="error" onClick={() => removeDraftRow(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
            {isEditing && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'left', py: 1 }}>
                  <Button size="small" startIcon={<AddIcon />} onClick={addDraftRow}>
                    {t('common.addRow', '행 추가')}
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {/* === 조회 모드 === */}
            {!isEditing && (items || []).map((item, idx) => {
              const span = viewSpans[idx]
              const showCategoryCell = span !== undefined
              const files = (attachmentsMap || {})[item.id] || []
              return (
                <TableRow key={item.id}>
                  {showCategoryCell && (
                    <TableCell
                      rowSpan={span}
                      sx={{
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        fontWeight: 600,
                        bgcolor: 'grey.50',
                        wordBreak: 'keep-all',
                        whiteSpace: 'pre-line',
                        px: 1.5,
                      }}
                    >
                      {item.category}
                      {'\n'}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 400 }}>
                        ({viewSums[idx]})
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell sx={{ verticalAlign: 'middle' }}>{item.evalItem}</TableCell>
                  <TableCell sx={{ verticalAlign: 'middle', fontSize: '0.85rem' }}>{item.evalContent}</TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 600 }}>{Number(item.maxScore)}</TableCell>
                  <TableCell sx={{ verticalAlign: 'middle' }} />
                  <TableCell sx={{ verticalAlign: 'middle' }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ alignItems: 'center' }}>
                      {files.map(f => (
                        <Chip
                          key={f.id}
                          size="small"
                          icon={<AttachFileIcon fontSize="small" />}
                          label={
                            <Tooltip title={f.originalFilename}>
                              <Box component="span" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }}>
                                {f.originalFilename}
                              </Box>
                            </Tooltip>
                          }
                          onClick={() => window.open(`/api/files/${f.id}`, '_blank')}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 하단 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1 }}>
        {isEditing ? (
          <>
            <Button variant="outlined" onClick={handleCancel} disabled={isSaving} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel', '취소')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save', '저장')}</Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={() => setViewMode('list')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list', '목록')}</Button>
            <Button variant="contained" color="primary" onClick={handleEdit} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit', '수정')}</Button>
            <Button variant="contained" color="error" onClick={handleDeleteAll} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete', '삭제')}</Button>
          </>
        )}
      </Box>

      <LoadingOverlay open={isSaving} message={t('common.saving', '저장 중...')} />
      <LoadingOverlay open={!isSaving && !isEditing && isFetchingAttachments} message={t('common.loading', '불러오는 중...')} />
    </Box>
  )
}

export default EvalSheetTab
