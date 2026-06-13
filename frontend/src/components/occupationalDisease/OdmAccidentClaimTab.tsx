import { useState, useEffect } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, Pagination,
  IconButton, CircularProgress, Alert, Chip, Select, MenuItem,
  FormControl, Checkbox,
} from '@mui/material'
import type { Theme } from '@mui/material/styles'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { accidentClaimApi } from '../../api/accidentClaimApi'
import { AccidentClaim, AccidentClaimRequest, AccidentClaimDoc } from '../../types/accidentClaim.types'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import useCodeMap from '../../hooks/useCodeMap'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse } from '../../types/common.types'
import DevTestFillButton from '../common/DevTestFillButton'

interface DocFile {
  id: number
  fileName: string
  fileSize: number
}

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

// ===== Constants =====
const STATUS_COLORS: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  REVIEWING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  COMPLETED: 'success',
}

const labelSx = {
  width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string),
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valSxBorder = { ...valSx, borderRight: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string) }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string) }

const sectionHeaderSx = {
  bgcolor: 'primary.main', color: 'white', py: 1, px: 2, fontWeight: 'bold', mb: 0,
}

const formatPhone = (value: string): string => {
  const nums = value.replace(/[^0-9]/g, '').slice(0, 11)
  let formatted = nums
  if (nums.length > 7) formatted = nums.slice(0, 3) + '-' + nums.slice(3, 7) + '-' + nums.slice(7)
  else if (nums.length > 3) formatted = nums.slice(0, 3) + '-' + nums.slice(3)
  return formatted
}

const MENU = '보건 관리 › 직업병 관리 › 산재신청'

const OdmAccidentClaimTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showWarning, showSuccess, showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isSystemAdmin(user)
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('CLAIM_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<AccidentClaim | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const emptyForm: AccidentClaimRequest = {
    workerName: '', workerSsn: '', workerPhone: '', workerAddress: '',
    workerJobType: '', workerJoinDate: '', workerDept: '',
    companyName: '', companyRepName: '', companyBizNo: '', companyAddress: '',
    companyPhone: '', companyIndustry: '', companyWorkersCount: undefined,
    diseaseName: '', diseaseCode: '', onsetDate: '', diagnosisDate: '',
    exposurePeriod: '', exposureFactor: '', workHistory: '',
    hospitalName: '', hospitalDept: '', treatmentStartDate: '', treatmentEndDate: '',
    treatmentType: '',
    applicantName: '', applicantRelation: '', applyDate: '', notes: '',
  }
  const [formData, setFormData] = useState<AccidentClaimRequest>(emptyForm)

  // ===== Queries =====
  const { data, isLoading } = useQuery({
    queryKey: ['accidentClaims', page, statusFilter],
    queryFn: () =>
      statusFilter
        ? accidentClaimApi.getByStatus(statusFilter, page, rowsPerPage)
        : accidentClaimApi.getAll(page, rowsPerPage),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['accidentClaimDetail', selectedItem?.id],
    queryFn: () => accidentClaimApi.getById(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const { data: docs, isLoading: docsLoading } = useQuery({
    queryKey: ['accidentClaimDocs', selectedItem?.id],
    queryFn: () => accidentClaimApi.getDocs(selectedItem!.id),
    enabled: !!selectedItem?.id && viewMode === 'detail',
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: accidentClaimApi.create,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['accidentClaims'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccidentClaimRequest }) =>
      accidentClaimApi.update(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['accidentClaims'] })
      queryClient.invalidateQueries({ queryKey: ['accidentClaimDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: accidentClaimApi.delete,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['accidentClaims'] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      handleBackToList()
    },
  })

  const submitMutation = useMutation({
    mutationFn: (id: number) => accidentClaimApi.updateStatus(id, 'SUBMITTED'),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['accidentClaims'] })
      queryClient.invalidateQueries({ queryKey: ['accidentClaimDetail'] })
      await showSuccess(t('odmAccidentClaimTab.msg1', '제출되었습니다'))
      handleBackToList()
    },
  })

  // 서류별 파일 관리
  const [docFiles, setDocFiles] = useState<Record<number, DocFile[]>>({})

  const loadDocFiles = async (docId: number, docType: string, claimId: string) => {
    try {
      const res = await axiosInstance.get<ApiResponse<DocFile[]>>(`/files/by-entity/CLAIM_DOC_${docType}/${claimId}_${docId}`)
      setDocFiles(prev => ({ ...prev, [docId]: res.data.data || [] }))
    } catch { setDocFiles(prev => ({ ...prev, [docId]: [] })) }
  }

  const loadAllDocFiles = async (docsList: AccidentClaimDoc[], claimId: string) => {
    // 병렬 호출 — 직렬 await 루프는 12개 doc 기준 십수초 지연을 유발
    await Promise.all(docsList.map(doc => loadDocFiles(doc.id, doc.docType, claimId)))
  }

  // ⚠️ deps 에 docs 자체를 넣으면 토글 등으로 docs 참조가 바뀔 때마다 N개의 파일 API 가 재호출됨.
  //     토글은 is_submitted 만 바꾸지 doc 목록·첨부 파일과는 무관하므로, claim 선택이 바뀔 때 + doc 수가 바뀔 때만 발화.
  useEffect(() => {
    if (docs && docs.length > 0 && selectedItem) {
      loadAllDocFiles(docs, selectedItem.claimId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id, docs?.length])

  const handleFileUpload = async (docId: number, docType: string, files: FileList) => {
    if (!selectedItem) return
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('entityType', `CLAIM_DOC_${docType}`)
      fd.append('entityId', `${selectedItem.claimId}_${docId}`)
      await axiosInstance.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    await loadDocFiles(docId, docType, selectedItem.claimId)
    showSuccess(t('odmAccidentClaimTab.msg2', '파일이 업로드되었습니다'))
  }

  const handleFileDelete = async (fileId: number, docId: number, docType: string) => {
    if (!selectedItem) return
    await axiosInstance.delete(`/files/${fileId}`)
    await loadDocFiles(docId, docType, selectedItem.claimId)
  }

  const toggleDocMutation = useMutation({
    mutationFn: accidentClaimApi.toggleDocSubmitted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidentClaimDocs'] })
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || submitMutation.isPending

  // ===== Handlers =====
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setFormData({ ...emptyForm })
  }

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setStatusFilter('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (item: AccidentClaim) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ ...emptyForm, workerJoinDate: todayStr(), onsetDate: todayStr(), diagnosisDate: todayStr(), applyDate: todayStr() })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      workerName: detail.workerName || '',
      workerSsn: detail.workerSsn || '',
      workerPhone: detail.workerPhone || '',
      workerAddress: detail.workerAddress || '',
      workerJobType: detail.workerJobType || '',
      workerJoinDate: detail.workerJoinDate || '',
      workerDept: detail.workerDept || '',
      companyName: detail.companyName || '',
      companyRepName: detail.companyRepName || '',
      companyBizNo: detail.companyBizNo || '',
      companyAddress: detail.companyAddress || '',
      companyPhone: detail.companyPhone || '',
      companyIndustry: detail.companyIndustry || '',
      companyWorkersCount: detail.companyWorkersCount,
      diseaseName: detail.diseaseName || '',
      diseaseCode: detail.diseaseCode || '',
      onsetDate: detail.onsetDate || '',
      diagnosisDate: detail.diagnosisDate || '',
      exposurePeriod: detail.exposurePeriod || '',
      exposureFactor: detail.exposureFactor || '',
      workHistory: detail.workHistory || '',
      hospitalName: detail.hospitalName || '',
      hospitalDept: detail.hospitalDept || '',
      treatmentStartDate: detail.treatmentStartDate || '',
      treatmentEndDate: detail.treatmentEndDate || '',
      treatmentType: detail.treatmentType || '',
      applicantName: detail.applicantName || '',
      applicantRelation: detail.applicantRelation || '',
      applyDate: detail.applyDate || '',
      notes: detail.notes || '',
    })
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage', '삭제하시겠습니까?')}\n${t('common.deleteWarning', '이 작업은 되돌릴 수 없습니다.')}`,
      { title: t('common.delete', '삭제') }
    )
    if (confirmed) {
      deleteMutation.mutate(selectedItem.id)
    }
  }

  const handleSubmitClaim = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(t('odmAccidentClaimTab.msg3', '신청서를 제출하시겠습니까?'))
    if (confirmed) {
      submitMutation.mutate(selectedItem.id)
    }
  }

  // DEV ONLY — 비어있는 항목을 산재 신청 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    const today = new Date().toISOString().slice(0, 10)
    setFormData(prev => ({
      ...prev,
      workerName: prev.workerName || '홍길동',
      workerSsn: prev.workerSsn || '850101-1234567',
      workerPhone: prev.workerPhone || '010-1234-5678',
      workerAddress: prev.workerAddress || '서울특별시 중구 세종대로 100',
      workerJobType: prev.workerJobType || '용접공',
      workerJoinDate: prev.workerJoinDate || today,
      workerDept: prev.workerDept || '생산1팀',
      companyName: prev.companyName || '예스코',
      companyRepName: prev.companyRepName || '김대표',
      companyBizNo: prev.companyBizNo || '123-45-67890',
      companyAddress: prev.companyAddress || '서울특별시 중구 세종대로 100',
      companyPhone: prev.companyPhone || '02-1234-5678',
      companyIndustry: prev.companyIndustry || '도시가스 공급업',
      companyWorkersCount: prev.companyWorkersCount ?? 250,
      diseaseName: prev.diseaseName || '소음성 난청',
      diseaseCode: prev.diseaseCode || 'H83.3',
      onsetDate: prev.onsetDate || today,
      diagnosisDate: prev.diagnosisDate || today,
      exposurePeriod: prev.exposurePeriod || '10년 6개월',
      exposureFactor: prev.exposureFactor || '85dB 이상 소음',
      workHistory: prev.workHistory || '2015년 입사 후 용접·절단 공정에서 지속 근무 (테스트 데이터)',
      hospitalName: prev.hospitalName || '근로복지공단 서울병원',
      hospitalDept: prev.hospitalDept || '이비인후과',
      treatmentStartDate: prev.treatmentStartDate || today,
      treatmentEndDate: prev.treatmentEndDate || today,
      treatmentType: prev.treatmentType || '통원치료',
      applicantName: prev.applicantName || '홍길동',
      applicantRelation: prev.applicantRelation || '본인',
      applyDate: prev.applyDate || today,
      notes: prev.notes || '직업성 난청 요양급여 신청 (테스트 데이터)',
    }))
  }

  const handleSave = async () => {
    if (!formData.workerName) {
      showWarning(t('odmAccidentClaimTab.msg4', '근로자명은 필수입니다'))
      return
    }
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return

    if (viewMode === 'create') {
      createMutation.mutate({ ...formData, status: 'DRAFT' })
    } else if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData })
    }
  }

  const handlePhoneChange = (field: 'workerPhone' | 'companyPhone') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: formatPhone(e.target.value) })
  }

  const items = data?.content || []
  const filteredItems = searchQuery
    ? items.filter(i =>
        (i.workerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.diseaseName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items
  const totalPages = data?.totalPages || 0

  // ===== Helper: Section Header =====
  const SectionHeader = ({ title }: { title: string }) => (
    <Typography sx={sectionHeaderSx}>{title}</Typography>
  )

  // ===== Helper: Read-only row =====
  const DetailRow = ({ items: rowItems, isLast }: { items: { label: string; value: React.ReactNode }[]; isLast?: boolean }) => (
    <Box sx={isLast ? { display: 'flex', borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string) } : rowSx}>
      {rowItems.map((item, idx) => (
        <Box key={idx} sx={{ display: 'contents' }}>
          <Box sx={labelSx}>{item.label}</Box>
          <Box sx={idx < rowItems.length - 1 ? valSxBorder : valSx}>
            <Typography variant="body2">{item.value || ''}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )

  // ===== RENDER: List =====
  if (viewMode === 'list') {
    return (
      <Box>
        {/* Toolbar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
              displayEmpty
            >
              <MenuItem value="">{t('common.all', '전체')}</MenuItem>
              {statusCodes.map(c => (
                <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ListSearchBar
            placeholder="근로자명/직업병명 검색"
            value={searchText}
            onChange={setSearchText}
            onSearch={handleSearch}
            sx={{ minWidth: 200 }}
          />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new', '신규')}
          </Button>
          )}
        </Box>
        {/* Toolbar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
                displayEmpty
              >
                <MenuItem value="">{t('common.all', '전체')}</MenuItem>
                {statusCodes.map(c => (
                  <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <ListSearchBar
              placeholder="근로자명/직업병명 검색"
              value={searchText}
              onChange={setSearchText}
              onSearch={handleSearch}
              sx={{ flex: 1 }}
            />
            <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new', '신규')}
          </Button>
          )}
        </Box>

        {/* Desktop Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <>
            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {filteredItems.map((item) => (
                <Paper
                  key={item.id}
                  sx={{ p: 2, mb: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => handleRowClick(item)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{item.claimId}</Typography>
                    <Chip
                      label={getStatusLabel(item.status) || item.status}
                      color={STATUS_COLORS[item.status] || 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2">{item.workerName || ''}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.diseaseName || ''}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.applyDate || ''}</Typography>
                </Paper>
              ))}
            </Box>

            {/* Desktop Table View */}
            <TableContainer sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), borderRadius: 1, overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('common.no', 'No')}</TableCell>
                    <TableCell sx={hSx} align="center">신청번호</TableCell>
                    <TableCell sx={hSx} align="center">근로자명</TableCell>
                    <TableCell sx={hSx} align="center">직업병명</TableCell>
                    <TableCell sx={hSx} align="center">신청일</TableCell>
                    <TableCell sx={hSx} align="center">상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center">{item.claimId}</TableCell>
                      <TableCell align="center">{item.workerName || ''}</TableCell>
                      <TableCell align="center">{item.diseaseName || ''}</TableCell>
                      <TableCell align="center">{item.applyDate || ''}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(item.status) || item.status}
                          color={STATUS_COLORS[item.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, p) => setPage(p - 1)}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  // ===== RENDER: Detail =====
  if (viewMode === 'detail') {
    if (detailLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    const d = detail
    if (!d) return <Alert severity="error">{t('common.noData', '데이터가 없습니다')}</Alert>

    const mobileSections: { title: string; fields: [string, React.ReactNode][] }[] = [
      {
        title: '1. 재해근로자 인적사항',
        fields: [
          ['근로자명', d.workerName],
          ['주민등록번호', d.workerSsn],
          ['전화번호', d.workerPhone],
          ['주소', d.workerAddress],
          ['직종', d.workerJobType],
          ['입사일', d.workerJoinDate],
          ['소속부서', d.workerDept],
        ],
      },
      {
        title: '2. 사업장 사항',
        fields: [
          ['사업장명', d.companyName],
          ['대표자', d.companyRepName],
          ['사업자번호', d.companyBizNo],
          ['전화번호', d.companyPhone],
          ['주소', d.companyAddress],
          ['업종', d.companyIndustry],
          ['근로자수', d.companyWorkersCount != null ? `${d.companyWorkersCount}명` : null],
        ],
      },
      {
        title: '3. 직업병 관련',
        fields: [
          ['직업병명', d.diseaseName],
          ['질병코드', d.diseaseCode],
          ['발병일', d.onsetDate],
          ['진단일', d.diagnosisDate],
          ['유해인자 노출기간', d.exposurePeriod],
          ['유해인자', d.exposureFactor],
          ['직업력', d.workHistory],
        ],
      },
      {
        title: '4. 요양급여 신청',
        fields: [
          ['의료기관명', d.hospitalName],
          ['진료과', d.hospitalDept],
          ['치료시작일', d.treatmentStartDate],
          ['치료종료일', d.treatmentEndDate],
          ['치료유형', d.treatmentType],
          ['신청인', d.applicantName],
          ['관계', d.applicantRelation],
          ['신청일', d.applyDate],
          ['상태', d.status ? (getStatusLabel(d.status) || d.status) : null],
          ['비고', d.notes],
        ],
      },
    ]

    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          {/* Section 1: 재해근로자 인적사항 */}
          <SectionHeader title="1. 재해근로자 인적사항" />
          <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
            <DetailRow items={[
              { label: t('tab.근로자명', '근로자명'), value: d.workerName },
              { label: t('tab.주민등록번호', '주민등록번호'), value: d.workerSsn },
            ]} />
            <DetailRow items={[
              { label: t('tab.전화번호', '전화번호'), value: d.workerPhone },
              { label: t('tab.주소', '주소'), value: d.workerAddress },
            ]} />
            <DetailRow items={[
              { label: t('tab.직종', '직종'), value: d.workerJobType },
              { label: t('tab.입사일', '입사일'), value: d.workerJoinDate },
            ]} />
            <DetailRow items={[
              { label: t('tab.소속부서', '소속부서'), value: d.workerDept },
            ]} isLast />
          </Box>

          {/* Section 2: 사업장 사항 */}
          <SectionHeader title="2. 사업장 사항" />
          <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
            <DetailRow items={[
              { label: t('tab.사업장명', '사업장명'), value: d.companyName },
              { label: t('tab.대표자', '대표자'), value: d.companyRepName },
            ]} />
            <DetailRow items={[
              { label: t('tab.사업자번호', '사업자번호'), value: d.companyBizNo },
              { label: t('tab.전화번호', '전화번호'), value: d.companyPhone },
            ]} />
            <DetailRow items={[
              { label: t('tab.주소', '주소'), value: d.companyAddress },
              { label: t('tab.업종', '업종'), value: d.companyIndustry },
            ]} />
            <DetailRow items={[
              { label: t('tab.근로자수', '근로자수'), value: d.companyWorkersCount != null ? `${d.companyWorkersCount}명` : undefined },
            ]} isLast />
          </Box>

          {/* Section 3: 직업병 관련 */}
          <SectionHeader title="3. 직업병 관련" />
          <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
            <DetailRow items={[
              { label: t('tab.직업병명', '직업병명'), value: d.diseaseName },
              { label: t('tab.질병코드', '질병코드'), value: d.diseaseCode },
            ]} />
            <DetailRow items={[
              { label: t('tab.발병일', '발병일'), value: d.onsetDate },
              { label: t('tab.진단일', '진단일'), value: d.diagnosisDate },
            ]} />
            <DetailRow items={[
              { label: t('tab.유해인자노출기간', '유해인자 노출기간'), value: d.exposurePeriod },
              { label: t('tab.유해인자', '유해인자'), value: d.exposureFactor },
            ]} />
            <Box sx={{ display: 'flex', borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string) }}>
              <Box sx={labelSx}>직업력</Box>
              <Box sx={valSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{d.workHistory || ''}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Section 4: 요양급여 신청 */}
          <SectionHeader title="4. 요양급여 신청" />
          <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
            <DetailRow items={[
              { label: t('tab.의료기관명', '의료기관명'), value: d.hospitalName },
              { label: t('tab.진료과', '진료과'), value: d.hospitalDept },
            ]} />
            <DetailRow items={[
              { label: t('tab.치료시작일', '치료시작일'), value: d.treatmentStartDate },
              { label: t('tab.치료종료일', '치료종료일'), value: d.treatmentEndDate },
            ]} />
            <DetailRow items={[
              { label: t('tab.치료유형', '치료유형'), value: d.treatmentType },
            ]} />
            <DetailRow items={[
              { label: t('tab.신청인', '신청인'), value: d.applicantName },
              { label: t('tab.관계', '관계'), value: d.applicantRelation },
            ]} />
            <DetailRow items={[
              { label: t('tab.신청일', '신청일'), value: d.applyDate },
              { label: t('tab.상태', '상태'), value: d.status ? <Chip label={getStatusLabel(d.status) || d.status} color={STATUS_COLORS[d.status] || 'default'} size="small" /> : undefined },
            ]} />
            <Box sx={{ display: 'flex', borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string) }}>
              <Box sx={labelSx}>비고</Box>
              <Box sx={valSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{d.notes || ''}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
          {mobileSections.map((section, sIdx) => (
            <Box key={sIdx} sx={{ mb: 3 }}>
              <SectionHeader title={section.title} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {section.fields.filter(([, v]) => v).map(([label, value], i) => (
                  <Box key={i}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                    <Typography variant="body2" component="div" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Section 5: 첨부서류 목록 */}
        <SectionHeader title="5. 첨부서류 목록" />
        <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
          {docsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : !docs || docs.length === 0 ? (
            <Alert severity="info" sx={{ m: 1 }}>첨부서류 정보가 없습니다</Alert>
          ) : (
            <>
              {/* PC Table */}
              <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={hSx} align="center">No</TableCell>
                      <TableCell sx={hSx}>서류명</TableCell>
                      <TableCell sx={hSx} align="center">필수여부</TableCell>
                      <TableCell sx={hSx} align="center">제출여부</TableCell>
                      <TableCell sx={hSx}>첨부파일</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {docs.map((doc, idx) => (
                      <TableRow key={doc.id}>
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell>{doc.docName}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={doc.isRequired ? '필수' : '선택'}
                            color={doc.isRequired ? 'error' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={doc.isSubmitted}
                            icon={<RadioButtonUncheckedIcon />}
                            checkedIcon={<CheckCircleIcon />}
                            onChange={() => toggleDocMutation.mutate(doc.id)}
                            disabled={toggleDocMutation.isPending || d.status !== 'DRAFT'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {(docFiles[doc.id] || []).map(f => (
                              <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ flex: 1 }}>{f.fileName}</Typography>
                                <IconButton size="small" href={`/api/files/${f.id}`} target="_blank"><DownloadIcon sx={{ fontSize: 16 }} /></IconButton>
                                {d.status === 'DRAFT' && <IconButton size="small" color="error" onClick={() => handleFileDelete(f.id, doc.id, doc.docType)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>}
                              </Box>
                            ))}
                            {d.status === 'DRAFT' && (
                              <Button size="small" variant="outlined" component="label" startIcon={<AttachFileIcon />} sx={{ alignSelf: 'flex-start', mt: 0.5 }}>
                                파일 첨부
                                <input type="file" hidden multiple onChange={(e) => { if (e.target.files) handleFileUpload(doc.id, doc.docType, e.target.files); e.target.value = '' }} />
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Mobile */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, p: 1 }}>
                {docs.map((doc, idx) => (
                  <Paper key={doc.id} sx={{ p: 1.5 }} variant="outlined">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>{idx + 1}. {doc.docName}</Typography>
                      <Chip
                        label={doc.isRequired ? '필수' : '선택'}
                        color={doc.isRequired ? 'error' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="caption">제출여부:</Typography>
                      <Checkbox
                        size="small"
                        checked={doc.isSubmitted}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleIcon />}
                        onChange={() => toggleDocMutation.mutate(doc.id)}
                        disabled={toggleDocMutation.isPending || d.status !== 'DRAFT'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {(docFiles[doc.id] || []).map(f => (
                        <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ flex: 1 }}>{f.fileName}</Typography>
                          <IconButton size="small" href={`/api/files/${f.id}`} target="_blank"><DownloadIcon sx={{ fontSize: 16 }} /></IconButton>
                          {d.status === 'DRAFT' && <IconButton size="small" color="error" onClick={() => handleFileDelete(f.id, doc.id, doc.docType)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>}
                        </Box>
                      ))}
                      {d.status === 'DRAFT' && (
                        <Button size="small" variant="outlined" component="label" startIcon={<AttachFileIcon />} sx={{ alignSelf: 'flex-start', mt: 0.5 }}>
                          파일 첨부
                          <input type="file" hidden multiple onChange={(e) => { if (e.target.files) handleFileUpload(doc.id, doc.docType, e.target.files); e.target.value = '' }} />
                        </Button>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.backToList', '목록')}</Button>
          {d.status === 'DRAFT' && (
            <>
              {canSee(MENU, 'DRAFT', '수정', myRoles) && (
                <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.edit', '수정')}</Button>
              )}
              {canSee(MENU, 'DRAFT', '제출', myRoles) && (
                <Button variant="contained" color="info" onClick={handleSubmitClaim} sx={{ flex: { xs: 1, sm: 'none' } }}>제출</Button>
              )}
              {canSee(MENU, 'DRAFT', '삭제', myRoles) && (
                <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.delete', '삭제')}</Button>
              )}
            </>
          )}
        </Box>
      </Box>
    )
  }

  // ===== RENDER: Create / Edit =====
  const FormRow = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
    <Box sx={isLast ? { display: 'flex', borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string) } : rowSx}>{children}</Box>
  )

  const FormField = ({ label, children, isLast }: { label: string; children: React.ReactNode; isLast?: boolean }) => (
    <>
      <Box sx={labelSx}>{label}</Box>
      <Box sx={isLast ? valSx : valSxBorder}>{children}</Box>
    </>
  )

  const formSections: { title: string; fields: { label: string; node: React.ReactNode }[] }[] = [
    {
      title: '1. 재해근로자 인적사항',
      fields: [
        { label: t('tab.근로자명', '근로자명'), node: <TextField size="small" fullWidth value={formData.workerName || ''} onChange={(e) => setFormData({ ...formData, workerName: e.target.value })} /> },
        { label: t('tab.주민등록번호', '주민등록번호'), node: <TextField size="small" fullWidth value={formData.workerSsn || ''} onChange={(e) => setFormData({ ...formData, workerSsn: e.target.value })} /> },
        { label: t('tab.전화번호', '전화번호'), node: <TextField size="small" fullWidth value={formData.workerPhone || ''} onChange={handlePhoneChange('workerPhone')} placeholder="010-0000-0000" /> },
        { label: t('tab.주소', '주소'), node: <TextField size="small" fullWidth value={formData.workerAddress || ''} onChange={(e) => setFormData({ ...formData, workerAddress: e.target.value })} /> },
        { label: t('tab.직종', '직종'), node: <TextField size="small" fullWidth value={formData.workerJobType || ''} onChange={(e) => setFormData({ ...formData, workerJobType: e.target.value })} /> },
        { label: t('tab.입사일', '입사일'), node: <DatePickerField value={formData.workerJoinDate || ''} onChange={(v) => setFormData({ ...formData, workerJoinDate: v })} /> },
        { label: t('tab.소속부서', '소속부서'), node: <TextField size="small" fullWidth value={formData.workerDept || ''} onChange={(e) => setFormData({ ...formData, workerDept: e.target.value })} /> },
      ],
    },
    {
      title: '2. 사업장 사항',
      fields: [
        { label: t('tab.사업장명', '사업장명'), node: <TextField size="small" fullWidth value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} /> },
        { label: t('tab.대표자', '대표자'), node: <TextField size="small" fullWidth value={formData.companyRepName || ''} onChange={(e) => setFormData({ ...formData, companyRepName: e.target.value })} /> },
        { label: t('tab.사업자번호', '사업자번호'), node: <TextField size="small" fullWidth value={formData.companyBizNo || ''} onChange={(e) => setFormData({ ...formData, companyBizNo: e.target.value })} /> },
        { label: t('tab.전화번호', '전화번호'), node: <TextField size="small" fullWidth value={formData.companyPhone || ''} onChange={handlePhoneChange('companyPhone')} placeholder="02-0000-0000" /> },
        { label: t('tab.주소', '주소'), node: <TextField size="small" fullWidth value={formData.companyAddress || ''} onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })} /> },
        { label: t('tab.업종', '업종'), node: <TextField size="small" fullWidth value={formData.companyIndustry || ''} onChange={(e) => setFormData({ ...formData, companyIndustry: e.target.value })} /> },
        { label: t('tab.근로자수', '근로자수'), node: <NumberField size="small" fullWidth value={formData.companyWorkersCount ?? undefined} onChange={(v) => setFormData({ ...formData, companyWorkersCount: v ? Number(v) : undefined })} /> },
      ],
    },
    {
      title: '3. 직업병 관련',
      fields: [
        { label: t('tab.직업병명', '직업병명'), node: <TextField size="small" fullWidth value={formData.diseaseName || ''} onChange={(e) => setFormData({ ...formData, diseaseName: e.target.value })} /> },
        { label: t('tab.질병코드', '질병코드'), node: <TextField size="small" fullWidth value={formData.diseaseCode || ''} onChange={(e) => setFormData({ ...formData, diseaseCode: e.target.value })} /> },
        { label: t('tab.발병일', '발병일'), node: <DatePickerField value={formData.onsetDate || ''} onChange={(v) => setFormData({ ...formData, onsetDate: v })} /> },
        { label: t('tab.진단일', '진단일'), node: <DatePickerField value={formData.diagnosisDate || ''} onChange={(v) => setFormData({ ...formData, diagnosisDate: v })} /> },
        { label: t('tab.유해인자노출기간', '유해인자 노출기간'), node: <TextField size="small" fullWidth value={formData.exposurePeriod || ''} onChange={(e) => setFormData({ ...formData, exposurePeriod: e.target.value })} /> },
        { label: t('tab.유해인자', '유해인자'), node: <TextField size="small" fullWidth value={formData.exposureFactor || ''} onChange={(e) => setFormData({ ...formData, exposureFactor: e.target.value })} /> },
        { label: t('tab.직업력', '직업력'), node: <TextField size="small" fullWidth multiline rows={3} value={formData.workHistory || ''} onChange={(e) => setFormData({ ...formData, workHistory: e.target.value })} /> },
      ],
    },
    {
      title: '4. 요양급여 신청',
      fields: [
        { label: t('tab.의료기관명', '의료기관명'), node: <TextField size="small" fullWidth value={formData.hospitalName || ''} onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })} /> },
        { label: t('tab.진료과', '진료과'), node: <TextField size="small" fullWidth value={formData.hospitalDept || ''} onChange={(e) => setFormData({ ...formData, hospitalDept: e.target.value })} /> },
        { label: t('tab.치료시작일', '치료시작일'), node: <DatePickerField value={formData.treatmentStartDate || ''} onChange={(v) => setFormData({ ...formData, treatmentStartDate: v })} /> },
        { label: t('tab.치료종료일', '치료종료일'), node: <DatePickerField value={formData.treatmentEndDate || ''} onChange={(v) => setFormData({ ...formData, treatmentEndDate: v })} /> },
        { label: t('tab.치료유형', '치료유형'), node: <TextField size="small" fullWidth value={formData.treatmentType || ''} onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })} /> },
        { label: t('tab.신청인', '신청인'), node: <TextField size="small" fullWidth value={formData.applicantName || ''} onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })} /> },
        { label: t('tab.관계', '관계'), node: <TextField size="small" fullWidth value={formData.applicantRelation || ''} onChange={(e) => setFormData({ ...formData, applicantRelation: e.target.value })} /> },
        { label: t('tab.신청일', '신청일'), node: <DatePickerField value={formData.applyDate || ''} onChange={(v) => setFormData({ ...formData, applyDate: v })} /> },
        { label: t('tab.비고', '비고'), node: <TextField size="small" fullWidth multiline rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /> },
      ],
    },
  ]

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />

      {/* PC */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        {/* Section 1: 재해근로자 인적사항 */}
        <SectionHeader title="1. 재해근로자 인적사항" />
        <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label1', '근로자명')}>
              <TextField size="small" fullWidth value={formData.workerName || ''} onChange={(e) => setFormData({ ...formData, workerName: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label2', '주민등록번호')} isLast>
              <TextField size="small" fullWidth value={formData.workerSsn || ''} onChange={(e) => setFormData({ ...formData, workerSsn: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label3', '전화번호')}>
              <TextField size="small" fullWidth value={formData.workerPhone || ''} onChange={handlePhoneChange('workerPhone')} placeholder="010-0000-0000" />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label4', '주소')} isLast>
              <TextField size="small" fullWidth value={formData.workerAddress || ''} onChange={(e) => setFormData({ ...formData, workerAddress: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label5', '직종')}>
              <TextField size="small" fullWidth value={formData.workerJobType || ''} onChange={(e) => setFormData({ ...formData, workerJobType: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label6', '입사일')} isLast>
              <DatePickerField value={formData.workerJoinDate || ''} onChange={(v) => setFormData({ ...formData, workerJoinDate: v })} />
            </FormField>
          </FormRow>
          <FormRow isLast>
            <FormField label={t('odmAccidentClaimTab.label7', '소속부서')} isLast>
              <TextField size="small" fullWidth value={formData.workerDept || ''} onChange={(e) => setFormData({ ...formData, workerDept: e.target.value })} />
            </FormField>
          </FormRow>
        </Box>

        {/* Section 2: 사업장 사항 */}
        <SectionHeader title="2. 사업장 사항" />
        <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label8', '사업장명')}>
              <TextField size="small" fullWidth value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label9', '대표자')} isLast>
              <TextField size="small" fullWidth value={formData.companyRepName || ''} onChange={(e) => setFormData({ ...formData, companyRepName: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label10', '사업자번호')}>
              <TextField size="small" fullWidth value={formData.companyBizNo || ''} onChange={(e) => setFormData({ ...formData, companyBizNo: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label11', '전화번호')} isLast>
              <TextField size="small" fullWidth value={formData.companyPhone || ''} onChange={handlePhoneChange('companyPhone')} placeholder="02-0000-0000" />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label12', '주소')}>
              <TextField size="small" fullWidth value={formData.companyAddress || ''} onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label13', '업종')} isLast>
              <TextField size="small" fullWidth value={formData.companyIndustry || ''} onChange={(e) => setFormData({ ...formData, companyIndustry: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow isLast>
            <FormField label={t('odmAccidentClaimTab.label14', '근로자수')} isLast>
              <NumberField size="small" fullWidth value={formData.companyWorkersCount ?? null} onChange={(v) => setFormData({ ...formData, companyWorkersCount: v ?? undefined })} />
            </FormField>
          </FormRow>
        </Box>

        {/* Section 3: 직업병 관련 */}
        <SectionHeader title="3. 직업병 관련" />
        <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label15', '직업병명')}>
              <TextField size="small" fullWidth value={formData.diseaseName || ''} onChange={(e) => setFormData({ ...formData, diseaseName: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label16', '질병코드')} isLast>
              <TextField size="small" fullWidth value={formData.diseaseCode || ''} onChange={(e) => setFormData({ ...formData, diseaseCode: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label17', '발병일')}>
              <DatePickerField value={formData.onsetDate || ''} onChange={(v) => setFormData({ ...formData, onsetDate: v })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label18', '진단일')} isLast>
              <DatePickerField value={formData.diagnosisDate || ''} onChange={(v) => setFormData({ ...formData, diagnosisDate: v })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label19', '유해인자 노출기간')}>
              <TextField size="small" fullWidth value={formData.exposurePeriod || ''} onChange={(e) => setFormData({ ...formData, exposurePeriod: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label20', '유해인자')} isLast>
              <TextField size="small" fullWidth value={formData.exposureFactor || ''} onChange={(e) => setFormData({ ...formData, exposureFactor: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow isLast>
            <FormField label={t('odmAccidentClaimTab.label21', '직업력')} isLast>
              <TextField size="small" fullWidth multiline rows={3} value={formData.workHistory || ''} onChange={(e) => setFormData({ ...formData, workHistory: e.target.value })} />
            </FormField>
          </FormRow>
        </Box>

        {/* Section 4: 요양급여 신청 */}
        <SectionHeader title="4. 요양급여 신청" />
        <Box sx={{ border: 1, borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : (theme.palette.divider as string), overflow: 'hidden', mb: 3 }}>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label22', '의료기관명')}>
              <TextField size="small" fullWidth value={formData.hospitalName || ''} onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label23', '진료과')} isLast>
              <TextField size="small" fullWidth value={formData.hospitalDept || ''} onChange={(e) => setFormData({ ...formData, hospitalDept: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label24', '치료시작일')}>
              <DatePickerField value={formData.treatmentStartDate || ''} onChange={(v) => setFormData({ ...formData, treatmentStartDate: v })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label25', '치료종료일')} isLast>
              <DatePickerField value={formData.treatmentEndDate || ''} onChange={(v) => setFormData({ ...formData, treatmentEndDate: v })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label26', '치료유형')}>
              <TextField size="small" fullWidth value={formData.treatmentType || ''} onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label27', '신청인')} isLast>
              <TextField size="small" fullWidth value={formData.applicantName || ''} onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label={t('odmAccidentClaimTab.label28', '관계')}>
              <TextField size="small" fullWidth value={formData.applicantRelation || ''} onChange={(e) => setFormData({ ...formData, applicantRelation: e.target.value })} />
            </FormField>
            <FormField label={t('odmAccidentClaimTab.label29', '신청일')} isLast>
              <DatePickerField value={formData.applyDate || ''} onChange={(v) => setFormData({ ...formData, applyDate: v })} />
            </FormField>
          </FormRow>
          <FormRow isLast>
            <FormField label={t('odmAccidentClaimTab.label30', '비고')} isLast>
              <TextField size="small" fullWidth multiline rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </FormField>
          </FormRow>
        </Box>
      </Box>

      {/* Mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {formSections.map((section, sIdx) => (
          <Box key={sIdx} sx={{ mb: 3 }}>
            <SectionHeader title={section.title} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {section.fields.map((f, i) => (
                <Box key={i}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{f.label}</Typography>
                  {f.node}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Buttons */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.cancel', '취소')}
        </Button>
        {canSee(MENU, 'DRAFT', '저장', myRoles) && (
        <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.save', '저장')}
        </Button>
        )}
      </Box>
    </Box>
  )
}

export default OdmAccidentClaimTab
