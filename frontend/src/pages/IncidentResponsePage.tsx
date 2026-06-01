import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { incidentResponseApi } from '../api/incidentResponseApi'
import type { IncidentResponse } from '../types/incidentResponse.types'
import StatCard from '../components/legalCompliance/StatCard'
import { FormTable, FormRow, FormLabel, FormCell } from '../components/common/FormTable'
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
  return iso.replace('T', ' ').substring(0, 16).replace(' ', 'T')
}

const fmtDateTime = (s?: string) => {
  if (!s) return '-'
  return s.replace('T', ' ').substring(0, 16)
}

const IncidentResponsePage: React.FC = () => {
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

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [openForm, setOpenForm] = useState(false)
  const [openDetail, setOpenDetail] = useState(false)
  const [editing, setEditing] = useState<IncidentResponse | null>(null)
  const [viewing, setViewing] = useState<IncidentResponse | null>(null)
  const [form, setForm] = useState<Partial<IncidentResponse>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['incidentResponseList'] })
    qc.invalidateQueries({ queryKey: ['incidentResponseStats'] })
  }

  const createM = useMutation({
    mutationFn: incidentResponseApi.create,
    onSuccess: () => { invalidate(); setOpenForm(false); showSuccess('등록되었습니다') },
    onError: () => showError('등록에 실패했습니다'),
  })
  const updateM = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<IncidentResponse> }) => incidentResponseApi.update(id, e),
    onSuccess: () => { invalidate(); setOpenForm(false); showSuccess('수정되었습니다') },
    onError: () => showError('수정에 실패했습니다'),
  })
  const deleteM = useMutation({
    mutationFn: incidentResponseApi.remove,
    onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') },
    onError: () => showError('삭제에 실패했습니다'),
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
    setOpenForm(true)
  }

  const openEdit = (item: IncidentResponse) => {
    setEditing(item)
    setForm({
      ...item,
      reportedAt: toLocalInputValue(item.reportedAt),
    })
    setOpenForm(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.location || !form.reportedAt) {
      showError('필수 항목(제목·발생장소·보고일시)을 입력해주세요')
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
    if (!(await showConfirm('이 사고 대응 기록을 삭제하시겠습니까?'))) return
    deleteM.mutate(editing.id)
    setOpenForm(false)
  }

  const handleRowClick = (item: IncidentResponse) => {
    setViewing(item)
    setOpenDetail(true)
  }

  const handleEditFromDetail = () => {
    if (!viewing) return
    setOpenDetail(false)
    setTimeout(() => openEdit(viewing), 100)
  }

  return (
    <Box>
      {/* KPI 5장 */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.issued ?? 0}     label="발령 중" sub="긴급 대응" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.responding ?? 0} label="대응 중" sub="진행 중" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={stats?.closed ?? 0}     label="종료" sub="완료" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={stats?.drill ?? 0}      label="훈련" sub="훈련 건수" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.total ?? 0}      label="전체" sub="누적" /></Grid>
      </Grid>

      {/* 검색·필터 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
          <TextField
            size="small" placeholder="제목·발생장소·번호 검색"
            value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <TextField select size="small" label="비상 유형"
            value={filterType} onChange={(e) => setFilterType(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">전체</MenuItem>
            {TYPE_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="상태"
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">전체</MenuItem>
            {STATUS_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>
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
                        <Chip size="small" label="훈련" color="secondary" sx={{ mr: 1, height: 20, fontSize: '0.7rem' }} />
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
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }} onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" onClick={() => openEdit(item)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => {
                        if (await showConfirm('이 항목을 삭제하시겠습니까?')) deleteM.mutate(item.id)
                      }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* New 버튼 우하단 — 모바일에서는 풀폭 */}
      <Stack direction="row" justifyContent={{ xs: 'stretch', md: 'flex-end' }} sx={{ mb: 1 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ width: { xs: '100%', md: 'auto' } }}>
          신규 등록
        </Button>
      </Stack>

      {/* ===== 등록·수정 Dialog ===== */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? `사고 대응 수정 — ${editing.responseId}` : '신규 사고 대응'}</DialogTitle>
        <DialogContent dividers>
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
                  onChange={(e) => setForm({ ...form, incidentType: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {TYPE_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel required>상태</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.status || ''}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
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
                <TextField type="datetime-local" fullWidth size="small"
                  value={form.reportedAt ? form.reportedAt.substring(0, 16) : ''}
                  onChange={(e) => setForm({ ...form, reportedAt: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </FormCell>
              <FormLabel>구분</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.isDrill ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, isDrill: e.target.value === 'true' })}>
                  <MenuItem value="">선택</MenuItem>
                  <MenuItem value="false">실제 사고</MenuItem>
                  <MenuItem value="true">훈련</MenuItem>
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>심각도</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.severity || 'MODERATE'}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
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
        </DialogContent>
        <DialogActions>
          {editing && <Button color="error" onClick={handleDelete}>삭제</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpenForm(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={createM.isPending || updateM.isPending}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== 상세 Dialog ===== */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewing?.title}
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontFamily: 'monospace' }}>
            {viewing?.responseId}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {viewing && (
            <>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip size="small" label={STATUS_LABEL[viewing.status] || viewing.status} color={STATUS_COLOR[viewing.status] || 'default'} />
                {viewing.isDrill && <Chip size="small" label="훈련" color="secondary" />}
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>닫기</Button>
          <Button variant="contained" onClick={handleEditFromDetail}>수정</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default IncidentResponsePage
