import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  CircularProgress, Typography, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { partnerEvalApi, partnerStatsApi } from '../../api/partnerApi'
import { contractorRegistrationApi } from '../../api/contractorRegistrationApi'
import type { PartnerEval } from '../../types/partner.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useAlert } from '../../contexts/AlertContext'
import { fmtPhone } from '../../utils/phoneFormat'

const INDUSTRIES = ['건설·설비', '전기·계장', '화학·원료', '청소·용역', '운반·물류']
const STATUSES = ['완료', '재평가', '예정']

// 협력업체 등록 마스터의 bizType → 평가의 INDUSTRIES 매핑
const mapBizTypeToIndustry = (bizType?: string | null): string | undefined => {
  if (!bizType) return undefined
  if (bizType.includes('건설') || bizType.includes('기계') || bizType.includes('설비')) return '건설·설비'
  if (bizType.includes('전기') || bizType.includes('통신')) return '전기·계장'
  if (bizType.includes('화학') || bizType.includes('환경')) return '화학·원료'
  if (bizType.includes('청소') || bizType.includes('위생')) return '청소·용역'
  if (bizType.includes('운반') || bizType.includes('물류')) return '운반·물류'
  return undefined
}

const totalScore = (e: Partial<PartnerEval>) =>
  (e.scoreSafety || 0) + (e.scoreHealth || 0) + (e.scoreEnv || 0) + (e.scoreMgmt || 0)

const grade = (total: number) => total >= 90 ? 'A' : total >= 75 ? 'B' : total >= 60 ? 'C' : 'D'
const gradeColor = (g: string): 'success' | 'info' | 'warning' | 'error' =>
  g === 'A' ? 'success' : g === 'B' ? 'info' : g === 'C' ? 'warning' : 'error'

const statusColor = (s?: string): 'success' | 'error' | 'default' =>
  s === '완료' ? 'success' : s === '재평가' ? 'error' : 'default'

const emptyForm: Partial<PartnerEval> = {
  industry: '건설·설비', status: '완료',
  scoreSafety: 0, scoreHealth: 0, scoreEnv: 0, scoreMgmt: 0, accidentCount: 0,
}

type Mode = 'list' | 'view' | 'edit' | 'create'

const PartnerEvalTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['partnerEvals'], queryFn: partnerEvalApi.list })
  const { data: stats } = useQuery({ queryKey: ['partnerStats'], queryFn: partnerStatsApi.get })
  // 등록된 협력업체 (셀렉트 박스 후보) — APPROVED 만
  const { data: registrationsPage } = useQuery({
    queryKey: ['contractorRegistrations', 'forEval'],
    queryFn: () => contractorRegistrationApi.search({ regStatus: 'APPROVED', size: 200 }),
  })
  const registrations = registrationsPage?.content || []

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearchInput(''); setSearch('') }
  const [gradeFilter, setGradeFilter] = useState('')

  const [mode, setMode] = useState<Mode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<PartnerEval>>(emptyForm)
  const [pickerOpen, setPickerOpen] = useState(false)

  const selected = useMemo(
    () => (selectedId != null ? items.find(i => i.id === selectedId) ?? null : null),
    [items, selectedId],
  )

  const onPicked = (users: UserInfo[]) => {
    if (users[0]) setForm(f => ({ ...f, mgrName: users[0].name }))
    setPickerOpen(false)
  }

  const createMut = useMutation({
    mutationFn: partnerEvalApi.create,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['partnerEvals'] })
      qc.invalidateQueries({ queryKey: ['partnerStats'] })
      setSelectedId(created.id)
      setMode('view')
    },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<PartnerEval> }) => partnerEvalApi.update(id, e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partnerEvals'] })
      qc.invalidateQueries({ queryKey: ['partnerStats'] })
      setMode('view')
    },
  })
  const deleteMut = useMutation({
    mutationFn: partnerEvalApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partnerEvals'] })
      qc.invalidateQueries({ queryKey: ['partnerStats'] })
      setSelectedId(null)
      setMode('list')
    },
  })

  const filtered = useMemo(() => items.filter(e => {
    if (gradeFilter && e.status !== '예정' && grade(totalScore(e)) !== gradeFilter) return false
    if (search && !e.companyName.includes(search) && !(e.mgrName || '').includes(search) && !(e.industry || '').includes(search)) return false
    return true
  }), [items, gradeFilter, search])

  const dGrade = items.filter(e => e.status !== '예정' && grade(totalScore(e)) === 'D')

  // ====== Handlers ======
  const handleRowClick = (e: PartnerEval) => { setSelectedId(e.id); setMode('view') }
  const handleNewClick = () => { setForm({ ...emptyForm, evalDate: todayStr(), nextEvalDate: todayStr() }); setMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setMode('edit') } }
  const handleBackToList = () => { setSelectedId(null); setMode('list') }
  const handleSubmit = () => {
    if (mode === 'edit' && selectedId != null) updateMut.mutate({ id: selectedId, e: form })
    else if (mode === 'create') createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (selected && await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(selected.id)
  }

  // ====== DETAIL / EDIT / CREATE PAGE ======
  if (mode !== 'list') {
    const isReadonly = mode === 'view'
    const title = mode === 'create' ? '협력업체 평가 등록' : (mode === 'edit' ? '협력업체 평가 수정' : '협력업체 평가 상세')
    const total = totalScore(form)
    const g = form.status === '예정' ? null : grade(total)

    return (
      <Box sx={{ pb: { xs: 4, md: 0 } }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{title}</Typography>

        <FormTable>
          <FormRow>
            <FormLabel required>업체명</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected?.companyName || '-'}</Typography>
              ) : (
                <TextField select fullWidth size="small"
                  value={(form as any).contractorRegistrationId ?? ''}
                  SelectProps={{ displayEmpty: true }}
                  onChange={e => {
                    const regId = e.target.value === '' ? null : Number(e.target.value)
                    const reg = registrations.find(r => r.id === regId)
                    if (reg) {
                      setForm(f => ({
                        ...f,
                        contractorRegistrationId: reg.id,
                        companyName: reg.companyName,
                        industry: mapBizTypeToIndustry(reg.bizType) || f.industry,
                        partnerMgr: reg.safetyMgrName || f.partnerMgr,
                        contact: reg.safetyMgrTel || reg.tel || f.contact,
                      } as any))
                    } else {
                      setForm(f => ({ ...f, contractorRegistrationId: null } as any))
                    }
                  }}>
                  <MenuItem value="">선택</MenuItem>
                  {registrations.map(r => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.companyName} <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem', ml: 1 }}>· {r.bizType || '-'} · {r.regNo}</Typography>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>업종</FormLabel>
            <FormCell borderRight sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2">{selected?.industry || '-'}</Typography>
              ) : (
                <TextField select fullWidth size="small"
                  value={form.industry || ''}
                  onChange={e => setForm({ ...form, industry: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </TextField>
              )}
            </FormCell>
            <FormLabel>평가일</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selected?.evalDate || '-'}</Typography>
              ) : (
                <DatePickerField value={form.evalDate || null}
                  onChange={d => setForm({ ...form, evalDate: d || undefined })} />
              )}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>당사 담당자</FormLabel>
            <FormCell borderRight sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2">{selected?.mgrName || '-'}</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={form.mgrName || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              )}
            </FormCell>
            <FormLabel>협력업체 담당자</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2">{selected?.partnerMgr || '-'}</Typography>
              ) : (
                <TextField fullWidth size="small"
                  value={form.partnerMgr || ''}
                  onChange={e => setForm({ ...form, partnerMgr: e.target.value })} />
              )}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>연락처</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selected?.contact || '-'}</Typography>
              ) : (
                <TextField fullWidth size="small"
                  value={form.contact || ''}
                  onChange={e => setForm({ ...form, contact: fmtPhone(e.target.value) })} />
              )}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>안전 (40)</FormLabel>
            <FormCell borderRight sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected?.scoreSafety ?? 0} <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>/ 40</Typography></Typography>
              ) : (
                <NumberField fullWidth size="small"
                  value={form.scoreSafety ?? null}
                  onChange={v => setForm({ ...form, scoreSafety: v ?? 0 })} min={0} max={40} />
              )}
            </FormCell>
            <FormLabel>보건 (30)</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected?.scoreHealth ?? 0} <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>/ 30</Typography></Typography>
              ) : (
                <NumberField fullWidth size="small"
                  value={form.scoreHealth ?? null}
                  onChange={v => setForm({ ...form, scoreHealth: v ?? 0 })} min={0} max={30} />
              )}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>환경 (20)</FormLabel>
            <FormCell borderRight sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected?.scoreEnv ?? 0} <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>/ 20</Typography></Typography>
              ) : (
                <NumberField fullWidth size="small"
                  value={form.scoreEnv ?? null}
                  onChange={v => setForm({ ...form, scoreEnv: v ?? 0 })} min={0} max={20} />
              )}
            </FormCell>
            <FormLabel>관리 (10)</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected?.scoreMgmt ?? 0} <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>/ 10</Typography></Typography>
              ) : (
                <NumberField fullWidth size="small"
                  value={form.scoreMgmt ?? null}
                  onChange={v => setForm({ ...form, scoreMgmt: v ?? 0 })} min={0} max={10} />
              )}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>총점 / 등급</FormLabel>
            <FormCell borderRight sx={{ display: 'flex', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 700 }}>
                  {isReadonly ? totalScore(selected || {}) : total}점
                </Typography>
                {(isReadonly ? (selected?.status !== '예정' ? grade(totalScore(selected || {})) : null) : g)
                  && <Chip size="small"
                    label={isReadonly ? grade(totalScore(selected || {})) : g!}
                    color={gradeColor(isReadonly ? grade(totalScore(selected || {})) : g!)} />}
              </Stack>
            </FormCell>
            <FormLabel>상태</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Chip size="small" label={selected?.status || '-'} color={statusColor(selected?.status)} />
              ) : (
                <TextField select fullWidth size="small"
                  value={form.status || '완료'}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              )}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>최근 1년 사고</FormLabel>
            <FormCell borderRight sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontWeight: 600, color: (selected?.accidentCount || 0) > 0 ? 'error.main' : 'inherit' }}>{selected?.accidentCount ?? 0}건</Typography>
              ) : (
                <NumberField fullWidth size="small"
                  value={form.accidentCount ?? null}
                  onChange={v => setForm({ ...form, accidentCount: v ?? 0 })} min={0} />
              )}
            </FormCell>
            <FormLabel>다음 평가 예정일</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selected?.nextEvalDate || '-'}</Typography>
              ) : (
                <DatePickerField value={form.nextEvalDate || null}
                  onChange={d => setForm({ ...form, nextEvalDate: d || undefined })} />
              )}
            </FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>평가 의견</FormLabel>
            <FormCell sx={isReadonly ? { display: 'flex', alignItems: 'center' } : undefined}>
              {isReadonly ? (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected?.opinion || '-'}</Typography>
              ) : (
                <TextField fullWidth size="small" multiline minRows={2}
                  value={form.opinion || ''}
                  onChange={e => setForm({ ...form, opinion: e.target.value })} />
              )}
            </FormCell>
          </FormRow>
        </FormTable>

        {/* 하단 버튼 — 목록/취소 + 모드별 액션 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
          {mode === 'edit' ? (
            <Button variant="outlined" onClick={() => setMode('view')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          ) : (
            <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          )}
          {mode === 'view' && (
            <>
              <Button variant="contained" color="primary" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
              <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
            </>
          )}
          {mode === 'edit' && (
            <Button variant="contained" onClick={handleSubmit} disabled={!form.companyName} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
          {mode === 'create' && (
            <Button variant="contained" onClick={handleSubmit} disabled={!form.companyName} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>

        <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="담당자 선택 (조직도)" />
      </Box>
    )
  }

  // ====== LIST PAGE ======
  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2}><StatCard color="blue"   value={stats?.evalTotal ?? 0}        label="등록 협력업체" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="green"  value={stats?.evalACount ?? 0}       label="우수 (A등급)" sub="90점 이상" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="blue"   value={stats?.evalBCount ?? 0}       label="양호 (B등급)" sub="75~89점" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="yellow" value={stats?.evalCCount ?? 0}       label="개선 (C등급)" sub="60~74점" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={stats?.evalDCount ?? 0}       label="불량 (D등급)" sub="60점 미만" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="purple" value={stats?.evalPlannedCount ?? 0} label="평가 예정" sub="이번 분기" /></Grid>
      </Grid>

      {dGrade.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>D등급 협력업체 {dGrade.length}개사 — 계약 제한 및 개선계획서 제출 요구</strong>
          {' · '}
          {dGrade.map(e => `${e.companyName}(${totalScore(e)}점)`).join(' · ')}
        </Alert>
      )}

      {/* ─── 데스크탑 헤더 ─── */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, mb: 2, alignItems: 'center' }}>
        <ListSearchBar sx={{ width: 320 }} placeholder="업체명/담당자/업종 검색..." value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <TextField select size="small" sx={{ width: 130 }} label="등급" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {['A', 'B', 'C', 'D'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNewClick} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Box>

      {/* ─── 모바일 헤더 ─── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder="업체명/담당자/업종 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <TextField select size="small" fullWidth label="등급" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {['A', 'B', 'C', 'D'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
        <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleNewClick}>New</Button>
      </Box>

      {isLoading ? (
        <Paper variant="outlined" sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Paper>
      ) : (
        <>
          {/* ─── 데스크탑(md+) : 13컬럼 테이블 ─── */}
          <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>업체명</TableCell><TableCell align="center">업종</TableCell>
                  <TableCell align="center">담당자</TableCell><TableCell align="center">평가일</TableCell>
                  <TableCell align="right">안전(40)</TableCell><TableCell align="right">보건(30)</TableCell>
                  <TableCell align="right">환경(20)</TableCell><TableCell align="right">관리(10)</TableCell>
                  <TableCell align="right">총점</TableCell><TableCell align="center">등급</TableCell>
                  <TableCell align="center">사고</TableCell><TableCell align="center">다음평가</TableCell>
                  <TableCell align="center">상태</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.map(e => {
                    const total = totalScore(e)
                    const g = e.status === '예정' ? null : grade(total)
                    return (
                      <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(e)}>
                        <TableCell sx={{ fontWeight: 700 }}>{e.companyName}</TableCell>
                        <TableCell align="center"><Chip size="small" label={e.industry || '-'} variant="outlined" /></TableCell>
                        <TableCell align="center">{e.mgrName || '-'}</TableCell>
                        <TableCell align="center">{e.evalDate || '-'}</TableCell>
                        <TableCell align="right">{e.scoreSafety ?? 0}</TableCell>
                        <TableCell align="right">{e.scoreHealth ?? 0}</TableCell>
                        <TableCell align="right">{e.scoreEnv ?? 0}</TableCell>
                        <TableCell align="right">{e.scoreMgmt ?? 0}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{total}</TableCell>
                        <TableCell align="center">{g ? <Chip size="small" label={g} color={gradeColor(g)} /> : '-'}</TableCell>
                        <TableCell align="center">{e.accidentCount || 0}</TableCell>
                        <TableCell align="center">{e.nextEvalDate || '-'}</TableCell>
                        <TableCell align="center"><Chip size="small" label={e.status} color={statusColor(e.status)} /></TableCell>
                      </TableRow>
                    )
                  })}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={13} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 평가가 없습니다</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* ─── 모바일(xs/sm) : 카드 ─── */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
            {filtered.length === 0 && (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled', fontSize: '0.875rem' }}>
                등록된 평가가 없습니다
              </Paper>
            )}
            {filtered.map(e => {
              const total = totalScore(e)
              const g = e.status === '예정' ? null : grade(total)
              return (
                <Paper key={e.id} variant="outlined" onClick={() => handleRowClick(e)}
                  sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  {/* 1행: 업체명 + 등급칩 + 상태칩 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.companyName}
                    </Typography>
                    {g && <Chip size="small" label={g} color={gradeColor(g)} sx={{ fontWeight: 700, minWidth: 32 }} />}
                    <Chip size="small" label={e.status} color={statusColor(e.status)} variant="outlined" />
                  </Box>
                  {/* 2행: 업종 + 담당자 + 평가일 */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 0.75, alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {e.industry && <Chip size="small" label={e.industry} variant="outlined" sx={{ height: 20 }} />}
                    {e.mgrName && <Typography sx={{ fontSize: 'inherit' }}>· {e.mgrName}</Typography>}
                    {e.evalDate && <Typography sx={{ fontSize: 'inherit' }}>· {e.evalDate}</Typography>}
                  </Box>
                  {/* 3행: 4개 점수 2x2 + 총점 */}
                  <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
                      {[
                        ['안전', e.scoreSafety ?? 0, 40],
                        ['보건', e.scoreHealth ?? 0, 30],
                        ['환경', e.scoreEnv ?? 0, 20],
                        ['관리', e.scoreMgmt ?? 0, 10],
                      ].map(([label, val, max]) => (
                        <Box key={label as string} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 28 }}>{label}</Typography>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{val}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>/ {max}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: '0.8rem', color: 'primary.main', fontWeight: 700 }}>총점</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'primary.main' }}>
                        {total}<Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500 }}> / 100</Typography>
                      </Typography>
                    </Box>
                  </Box>
                  {/* 4행: 사고 / 다음평가 */}
                  {((e.accidentCount || 0) > 0 || e.nextEvalDate) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, fontSize: '0.7rem', color: 'text.secondary' }}>
                      <Typography sx={{ fontSize: 'inherit' }}>최근 사고: <Typography component="span" sx={{ fontWeight: 700, fontSize: 'inherit', color: (e.accidentCount || 0) > 0 ? 'error.main' : 'text.primary' }}>{e.accidentCount || 0}건</Typography></Typography>
                      {e.nextEvalDate && <Typography sx={{ fontSize: 'inherit' }}>다음 평가: <Typography component="span" sx={{ fontWeight: 700, fontSize: 'inherit', color: 'text.primary' }}>{e.nextEvalDate}</Typography></Typography>}
                    </Box>
                  )}
                </Paper>
              )
            })}
          </Box>
        </>
      )}
    </Box>
  )
}

export default PartnerEvalTab
