import { formatDateTime } from '../utils/dateDefaults'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress,
} from '@mui/material'
import ListSearchBar from '../components/common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { incidentResponseApi } from '../api/incidentResponseApi'
import type { IncidentResponse } from '../types/incidentResponse.types'
import StatCard from '../components/legalCompliance/StatCard'
import { FormTable, FormRow, FormLabel, FormCell } from '../components/common/FormTable'
import DevTestFillButton from '../components/common/DevTestFillButton'
import FlowChartButton from '../components/common/FlowChartButton'
import { useAlert } from '../contexts/AlertContext'

const TYPE_OPTIONS: Array<[string, string]> = [
  ['FIRE', '화재'],
  ['EXPLOSION', '폭발'],
  ['GAS_LEAK', '가스 누출'],
  ['CHEM_LEAK', '화학물질 누출'],
  ['NAT_DISASTER', '자연재해 (태풍·호우)'],
  ['HEAT_WAVE', '폭염'],
  ['COLD_WAVE', '한파'],
  ['EARTHQUAKE', '지진'],
  ['POWER_OUT', '정전'],
  ['CASUALTY', '인명사고'],
]
const STATUS_OPTIONS: Array<[string, string]> = [
  ['ISSUED', '발령'],
  ['RESPONDING', '대응중'],
  ['CLOSED', '종료'],
]
const SEVERITY_OPTIONS: Array<[string, string]> = [
  ['MINOR', '경미'],
  ['MODERATE', '보통'],
  ['SEVERE', '중대'],
]

const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPE_OPTIONS)
const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS_OPTIONS)
const SEVERITY_LABEL: Record<string, string> = Object.fromEntries(SEVERITY_OPTIONS)

const TYPE_COLOR: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default' | 'primary'> = {
  FIRE: 'error', EXPLOSION: 'error', GAS_LEAK: 'warning', CHEM_LEAK: 'warning',
  NAT_DISASTER: 'info', HEAT_WAVE: 'warning', COLD_WAVE: 'info',
  EARTHQUAKE: 'warning', POWER_OUT: 'warning', CASUALTY: 'error',
}
const STATUS_COLOR: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  ISSUED: 'warning', RESPONDING: 'info', CLOSED: 'success',
}
const SEVERITY_COLOR: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  MINOR: 'default', MODERATE: 'warning', SEVERE: 'error',
}

const emptyForm: Partial<IncidentResponse> = {
  incidentType: 'FIRE', status: 'ISSUED', severity: 'MODERATE', isDrill: false,
}

const toLocalInputValue = (iso?: string) => {
  if (!iso) return ''
  return formatDateTime(iso).replace(' ', 'T')
}

const fmtDateTime = (s?: string) => {
  if (!s) return '-'
  return s.replace('T', ' ').substring(0, 16)
}

const IncidentResponsePage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['incidentResponseList'],
    queryFn: incidentResponseApi.list,
  })
  const { data: stats } = useQuery({
    queryKey: ['incidentResponseStats'],
    queryFn: incidentResponseApi.stats,
  })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // 'list' = 목록 / 'detail' = 상세 / 'form' = 등록·수정
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'form'>('list')
  const [editing, setEditing] = useState<IncidentResponse | null>(null)
  const [viewing, setViewing] = useState<IncidentResponse | null>(null)
  const [form, setForm] = useState<Partial<IncidentResponse>>(emptyForm)
  const [reportedAtOpen, setReportedAtOpen] = useState(false)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['incidentResponseList'] })
    qc.invalidateQueries({ queryKey: ['incidentResponseStats'] })
  }

  const backToList = () => { setViewMode('list'); setEditing(null); setViewing(null) }

  const createM = useMutation({
    mutationFn: incidentResponseApi.create,
    onSuccess: () => { invalidate(); backToList(); showSuccess(t('incidentResponsePage.msg1', '등록되었습니다')) },
    onError: () => showError(t('incidentResponsePage.msg2', '등록에 실패했습니다')),
  })
  const updateM = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<IncidentResponse> }) => incidentResponseApi.update(id, e),
    onSuccess: () => { invalidate(); backToList(); showSuccess(t('incidentResponsePage.msg3', '수정되었습니다')) },
    onError: () => showError(t('incidentResponsePage.msg4', '수정에 실패했습니다')),
  })
  const deleteM = useMutation({
    mutationFn: incidentResponseApi.remove,
    onSuccess: () => { invalidate(); backToList(); showSuccess(t('incidentResponsePage.msg5', '삭제되었습니다')) },
    onError: () => showError(t('incidentResponsePage.msg6', '삭제에 실패했습니다')),
  })

  const filtered = useMemo(() => {
    return list.filter((i) => {
      if (filterType !== 'all' && i.incidentType !== filterType) return false
      if (filterStatus !== 'all' && i.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${i.title} ${i.location} ${i.responseId}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [list, filterType, filterStatus, search])

  const openCreate = () => {
    setEditing(null)
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setForm({ ...emptyForm, reportedAt: now.toISOString().slice(0, 16) })
    setViewMode('form')
  }

  const openEdit = (item: IncidentResponse) => {
    setEditing(item)
    setForm({
      ...item,
      reportedAt: toLocalInputValue(item.reportedAt),
    })
    setViewMode('form')
  }

  // DEV ONLY — 비어있는 항목을 비상대응 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    title: prev.title || '공정동 화재 발생에 따른 비상 대응',
    incidentType: prev.incidentType || 'FIRE',
    status: prev.status || 'ISSUED',
    location: prev.location || '공정동 2층 배관실',
    severity: prev.severity || 'SEVERE',
    reporter: prev.reporter || '안전관리팀 정차장',
    description: prev.description || '배관 용접작업 중 불티가 인근 가연물에 착화되어 화재 발생, 초기 대응 진행 (테스트 데이터)',
    actionTaken: prev.actionTaken || '작업 즉시 중지, 인근 작업자 대피, 소화기 초기 진압 후 119 신고 완료',
    casualtyInfo: prev.casualtyInfo || '경상 1명 (연기 흡입)',
  }))

  const handleSave = async () => {
    if (!form.title || !form.location || !form.reportedAt) {
      showError(t('incidentResponsePage.msg7', '필수 항목(제목·발생장소·보고일시)을 입력해주세요'))
      return
    }
    const payload: Partial<IncidentResponse> = {
      ...form,
      reportedAt: form.reportedAt ? form.reportedAt.replace(' ', 'T') : undefined,
    }
    if (editing) updateM.mutate({ id: editing.id, e: payload })
    else createM.mutate(payload)
  }

  const handleDelete = async () => {
    if (!editing) return
    if (!(await showConfirm(t('incidentResponsePage.msg8', '이 사고 대응 기록을 삭제하시겠습니까?')))) return
    deleteM.mutate(editing.id)
  }

  const handleRowClick = (item: IncidentResponse) => {
    setViewing(item)
    setViewMode('detail')
  }

  const handleEditFromDetail = () => {
    if (!viewing) return
    openEdit(viewing)
  }

  // ============== FORM VIEW (등록·수정) ==============
  if (viewMode === 'form') {
    return (
      <Box>
        <FormTable>
          <FormRow>
            <FormLabel required>제목</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 태풍 접근에 따른 비상 대비" />
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>비상 유형</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.incidentType || ''}
                SelectProps={{ displayEmpty: true }}
                onChange={(e) => setForm({ ...form, incidentType: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {TYPE_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel required>상태</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.status || ''}
                SelectProps={{ displayEmpty: true }}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {STATUS_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>발생 장소</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="예: 공정동 2층 배관실" />
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>보고 일시</FormLabel>
            <FormCell borderRight>
              <DateTimePicker
                value={form.reportedAt ? new Date(form.reportedAt) : null}
                open={reportedAtOpen}
                onOpen={() => setReportedAtOpen(true)}
                onClose={() => setReportedAtOpen(false)}
                onChange={(v) => {
                  if (v && !isNaN(v.getTime())) {
                    const y = v.getFullYear()
                    const m = String(v.getMonth() + 1).padStart(2, '0')
                    const d = String(v.getDate()).padStart(2, '0')
                    const hh = String(v.getHours()).padStart(2, '0')
                    const mm = String(v.getMinutes()).padStart(2, '0')
                    setForm({ ...form, reportedAt: `${y}-${m}-${d}T${hh}:${mm}` })
                  } else {
                    setForm({ ...form, reportedAt: '' })
                  }
                }}
                ampm={false}
                format="yyyy-MM-dd HH:mm"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputLabelProps: { shrink: true },
                    onClick: () => setReportedAtOpen(true),
                    sx: { '& input': { cursor: 'pointer' } },
                  },
                  field: { clearable: true } as any,
                  openPickerButton: { onClick: () => setReportedAtOpen(true) },
                }}
              />
            </FormCell>
            <FormLabel>구분</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.isDrill ? 'true' : 'false'}
                SelectProps={{ displayEmpty: true }}
                onChange={(e) => setForm({ ...form, isDrill: e.target.value === 'true' })}>
                <MenuItem value="false">실제 사고</MenuItem>
                <MenuItem value="true">훈련</MenuItem>
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>심각도</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.severity || 'MODERATE'}
                SelectProps={{ displayEmpty: true }}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {SEVERITY_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>보고자·담당자</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" value={form.reporter || ''}
                onChange={(e) => setForm({ ...form, reporter: e.target.value })}
                placeholder="예: 안전관리팀 정차장" />
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>사고 경위·내용</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" multiline minRows={3}
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="발생 경위·대응 내용을 기록하세요" />
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>대응 조치</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" multiline minRows={3}
                value={form.actionTaken || ''}
                onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                placeholder="실시한 대응 조치 (작업중지·대피·119신고 등)" />
            </FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>인명·재산 피해</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" value={form.casualtyInfo || ''}
                onChange={(e) => setForm({ ...form, casualtyInfo: e.target.value })}
                placeholder="없음 / 경상 1명 / 사망 1명 등" />
            </FormCell>
          </FormRow>
        </FormTable>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          {editing && (
            <Button color="error" variant="outlined" onClick={handleDelete}
              sx={{ flex: { xs: 1, md: 'none' } }}>삭제</Button>
          )}
          <Button variant="outlined" onClick={backToList}
            sx={{ flex: { xs: 1, md: 'none' } }}>취소</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={createM.isPending || updateM.isPending}
            sx={{ flex: { xs: 1, md: 'none' } }}>저장</Button>
        </Box>
      </Box>
    )
  }

  // ============== DETAIL VIEW ==============
  if (viewMode === 'detail' && viewing) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">{viewing.title}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
              {viewing.responseId}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip size="small" label={STATUS_LABEL[viewing.status] || viewing.status} color={STATUS_COLOR[viewing.status] || 'default'} />
          {viewing.isDrill && <Chip size="small" label={t('incidentResponsePage.label1', '훈련')} color="secondary" />}
          {viewing.severity && (
            <Chip size="small" label={SEVERITY_LABEL[viewing.severity] || viewing.severity}
              color={SEVERITY_COLOR[viewing.severity] || 'default'} variant="outlined" />
          )}
        </Stack>
        <FormTable>
          <FormRow>
            <FormLabel>비상 유형</FormLabel>
            <FormCell borderRight>{TYPE_LABEL[viewing.incidentType] || viewing.incidentType}</FormCell>
            <FormLabel>발생 장소</FormLabel>
            <FormCell>{viewing.location}</FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>보고 일시</FormLabel>
            <FormCell borderRight sx={{ fontFamily: 'monospace' }}>{fmtDateTime(viewing.reportedAt)}</FormCell>
            <FormLabel>보고자</FormLabel>
            <FormCell>{viewing.reporter || '-'}</FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>사고 경위</FormLabel>
            <FormCell sx={{ whiteSpace: 'pre-wrap' }}>{viewing.description || '-'}</FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>대응 조치</FormLabel>
            <FormCell sx={{ whiteSpace: 'pre-wrap' }}>{viewing.actionTaken || '-'}</FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>인명·재산</FormLabel>
            <FormCell>{viewing.casualtyInfo || '-'}</FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={backToList}
            sx={{ flex: { xs: '1 1 calc(33% - 4px)', md: 'none' } }}>목록</Button>
          <Button variant="contained" onClick={handleEditFromDetail}
            sx={{ flex: { xs: '1 1 calc(33% - 4px)', md: 'none' } }}>수정</Button>
          <Button variant="contained" color="error" onClick={async () => {
            if (await showConfirm(t('incidentResponsePage.msg9', '이 사고 대응 기록을 삭제하시겠습니까?'))) deleteM.mutate(viewing.id)
          }} sx={{ flex: { xs: '1 1 calc(33% - 4px)', md: 'none' } }}>삭제</Button>
        </Box>
      </Box>
    )
  }

  // ============== LIST VIEW ==============
  return (
    <Box>
      {/* KPI 5장 */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.issued ?? 0}     label={t('incidentResponsePage.label2', '발령 중')} sub="긴급 대응" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.responding ?? 0} label={t('incidentResponsePage.label3', '대응 중')} sub="진행 중" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={stats?.closed ?? 0}     label={t('incidentResponsePage.label4', '종료')} sub="완료" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={stats?.drill ?? 0}      label={t('incidentResponsePage.label5', '훈련')} sub="훈련 건수" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.total ?? 0}      label={t('incidentResponsePage.label6', '전체')} sub="누적" /></Grid>
      </Grid>

      {/* ─── 데스크탑(md+) 헤더 ─── */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, mb: 2, alignItems: 'center' }}>
        <ListSearchBar sx={{ width: 320 }} placeholder="제목·발생장소·번호 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <TextField select size="small" sx={{ width: 160 }}
          SelectProps={{ displayEmpty: true }}
          value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <MenuItem value="all">비상 유형 전체</MenuItem>
          {TYPE_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ width: 140 }}
          SelectProps={{ displayEmpty: true }}
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <MenuItem value="all">상태 전체</MenuItem>
          {STATUS_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </TextField>
        <IconButton size="small" onClick={invalidate}><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <FlowChartButton flowKey="incident" />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Box>

      {/* ─── 모바일(xs/sm) 헤더 ─── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" fullWidth placeholder="제목·발생장소·번호 검색"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <IconButton size="small" onClick={invalidate}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1, flexShrink: 0 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
        <TextField select size="small" fullWidth
          SelectProps={{ displayEmpty: true }}
          value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <MenuItem value="all">비상 유형 전체</MenuItem>
          {TYPE_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </TextField>
        <TextField select size="small" fullWidth
          SelectProps={{ displayEmpty: true }}
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <MenuItem value="all">상태 전체</MenuItem>
          {STATUS_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </TextField>
        <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={openCreate}>New</Button>
      </Box>

      {/* 목록 테이블 */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 140 }}>대응번호</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 130 }}>비상 유형</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 200 }}>발생 장소</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>심각도</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>상태</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 140 }}>보고 일시</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                      검색 결과가 없습니다
                    </TableCell>
                  </TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                      {item.responseId}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {item.isDrill && (
                        <Chip size="small" label={t('incidentResponsePage.label7', '훈련')} color="secondary" sx={{ mr: 1, height: 20, fontSize: '0.7rem' }} />
                      )}
                      {item.title}
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={TYPE_LABEL[item.incidentType] || item.incidentType} color={TYPE_COLOR[item.incidentType] || 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{item.location}</TableCell>
                    <TableCell align="center">
                      {item.severity && (
                        <Chip size="small" label={SEVERITY_LABEL[item.severity] || item.severity} color={SEVERITY_COLOR[item.severity] || 'default'} variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={STATUS_LABEL[item.status] || item.status} color={STATUS_COLOR[item.status] || 'default'} />
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                      {fmtDateTime(item.reportedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

    </Box>
  )
}

export default IncidentResponsePage
