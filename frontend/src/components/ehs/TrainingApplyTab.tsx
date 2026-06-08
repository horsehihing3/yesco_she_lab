import { useMemo, useState } from 'react'
import { fmtPhone } from '../../utils/phoneFormat'
import ListSearchBar from '../common/ListSearchBar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Typography, Paper, Grid, TextField, Select, MenuItem, FormControl,
  Chip, CircularProgress, Alert, LinearProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Checkbox, FormControlLabel,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { trainingCourseApi, trainingApplicationApi } from '../../api/trainingApi'
import { TrainingCourse } from '../../types/trainingCourse.types'
import { TrainingApplication, TrainingApplicationRequest } from '../../types/trainingApplication.types'
import useCodeMap from '../../hooks/useCodeMap'

// 카드 상단 배너 색상 단일화 (전 분류 동일 단색)
const CARD_BANNER = '#1e3a8a'

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
  PENDING: 'warning', APPROVED: 'primary', COMPLETED: 'success', REJECTED: 'error', CANCELLED: 'default',
}

const TrainingApplyTab: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showWarning } = useAlert()
  const { getLabel: getCategoryLabel } = useCodeMap('TRAINING_CATEGORY')
  const { getLabel: getModeLabel } = useCodeMap('TRAINING_MODE')
  const { getLabel: getAppStatusLabel } = useCodeMap('TRAINING_APPLICATION_STATUS')

  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const applySearch = () => setSearchText(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setModeFilter(''); setMonthFilter(''); setTabFilter('all') }
  const [modeFilter, setModeFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [tabFilter, setTabFilter] = useState<string>('all') // all / mandatory / special / manager / voluntary

  // 신청 모달
  const [applyDialogCourse, setApplyDialogCourse] = useState<TrainingCourse | null>(null)
  const [applyForm, setApplyForm] = useState({
    phone: '', reason: '', meal: '', transport: 'N/A',
    chkLaw: true, chkPrivacy: false,
  })
  const [myAppsOpen, setMyAppsOpen] = useState(false)

  const { data: courseData, isLoading: coursesLoading } = useQuery({
    queryKey: ['trainingCourseListForApply'],
    queryFn: () => trainingCourseApi.list({ isActive: true, size: 200 }),
  })
  const courses: TrainingCourse[] = courseData?.content || []

  const { data: myAppsData } = useQuery({
    queryKey: ['myTrainingApplications', user?.username],
    queryFn: () => trainingApplicationApi.list({ username: user?.username, size: 100 }),
    enabled: !!user?.username,
  })
  const myApps: TrainingApplication[] = myAppsData?.content || []

  // tab → category mapping
  const tabMatch = (c: TrainingCourse) => {
    if (tabFilter === 'all') return true
    if (tabFilter === 'mandatory') return c.legalRequired
    if (tabFilter === 'special') return c.category === 'LEGAL_SPECIAL'
    if (tabFilter === 'manager') return c.category === 'MANAGER'
    if (tabFilter === 'voluntary') return !c.legalRequired
    return true
  }

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase()
    return courses.filter(c =>
      tabMatch(c)
      && (!q || c.courseName.toLowerCase().includes(q) || (c.instructor || '').toLowerCase().includes(q))
      && (!modeFilter || c.mode === modeFilter)
      && (!monthFilter || (c.dateStart && c.dateStart.includes(`-${monthFilter}-`))),
    )
  }, [courses, tabFilter, searchText, modeFilter, monthFilter])

  // KPI
  const kpi = useMemo(() => {
    const mandatory = courses.filter(c => c.legalRequired).length
    const pending = myApps.filter(a => a.status === 'PENDING').length
    const myCompleted = myApps.filter(a => a.status === 'COMPLETED')
    const myHours = myCompleted.reduce((s, a) => {
      const c = courses.find(c => c.id === a.courseId)
      return s + (c?.durationHours ? Number(c.durationHours) : 0)
    }, 0)
    return { mandatory, available: courses.length, pending, hours: myHours }
  }, [courses, myApps])

  const tabCounts = useMemo(() => ({
    all: courses.length,
    mandatory: courses.filter(c => c.legalRequired).length,
    special: courses.filter(c => c.category === 'LEGAL_SPECIAL').length,
    manager: courses.filter(c => c.category === 'MANAGER').length,
    voluntary: courses.filter(c => !c.legalRequired).length,
  }), [courses])

  const myAppliedCourseIds = useMemo(() => new Set(myApps.map(a => a.courseId)), [myApps])

  const createMutation = useMutation({
    mutationFn: (req: TrainingApplicationRequest) => trainingApplicationApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTrainingApplications'] })
      queryClient.invalidateQueries({ queryKey: ['trainingCourseListForApply'] })
      queryClient.invalidateQueries({ queryKey: ['trainingApplicationsAdmin'] })
      setApplyDialogCourse(null)
      showSuccess(t('training.applySubmitted', '교육신청이 제출되었습니다. 승인 후 확정됩니다.'))
    },
    onError: () => showError(t('common.error')),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => trainingApplicationApi.changeStatus(id, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTrainingApplications'] })
      queryClient.invalidateQueries({ queryKey: ['trainingCourseListForApply'] })
    },
  })

  const handleApplyClick = (c: TrainingCourse) => {
    setApplyDialogCourse(c)
    setApplyForm({
      phone: '', reason: '', meal: '', transport: 'N/A',
      chkLaw: true, chkPrivacy: false,
    })
  }

  const handleSubmitApplication = () => {
    if (!applyDialogCourse) return
    if (!applyForm.chkPrivacy) {
      showWarning(t('training.agreePrivacy', '개인정보 수집·이용에 동의해주세요'))
      return
    }
    createMutation.mutate({
      courseId: applyDialogCourse.id,
      applicantPhone: applyForm.phone,
      reason: applyForm.reason,
      mealOption: '',
      transportOption: applyForm.transport || 'N/A',
    })
  }

  const fmtPeriod = (c: TrainingCourse) => {
    if (!c.dateStart) return ''
    if (!c.dateEnd || c.dateStart === c.dateEnd) return c.dateStart
    return `${c.dateStart} ~ ${c.dateEnd}`
  }

  return (
    <Box>
      {/* 상단 액션 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" onClick={() => setMyAppsOpen(true)}>
          {t('training.myApps', '나의 신청내역')} ({myApps.length})
        </Button>
      </Box>

      {/* KPI 4개 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: t('training.kpiMandatory', '법정 의무교육'), value: `${kpi.mandatory}${t('common.itemSuffix', '개')}`, color: '#ef4444' },
          { label: t('training.kpiAvailable', '신청 가능 과정'), value: `${kpi.available}${t('common.itemSuffix', '개')}`, color: '#3b82f6' },
          { label: t('training.kpiPending', '신청 대기중'),     value: `${kpi.pending}${t('common.cntSuffix', '건')}`, color: '#f59e0b' },
          { label: t('training.kpiHours', '올해 이수시간'),      value: `${kpi.hours}h / 16h`, color: '#10b981' },
        ].map((c, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={{ p: 2, borderLeft: 4, borderColor: c.color }}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{c.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: t('common.all', '전체') },
          { key: 'mandatory', label: t('training.tabMandatory', '법정의무') },
          { key: 'special', label: t('training.tabSpecial', '특별교육') },
          { key: 'manager', label: t('training.tabManager', '관리감독자') },
          { key: 'voluntary', label: t('training.tabVoluntary', '자율교육') },
        ].map(tab => (
          <Chip
            key={tab.key}
            label={`${tab.label} ${tabCounts[tab.key as keyof typeof tabCounts]}`}
            color={tabFilter === tab.key ? 'primary' : 'default'}
            variant={tabFilter === tab.key ? 'filled' : 'outlined'}
            onClick={() => setTabFilter(tab.key)}
            clickable
          />
        ))}
      </Box>

      {/* Filter bar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <ListSearchBar
          placeholder={t('training.searchCoursePh', '과정명, 강사명 검색')}
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select displayEmpty value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
            <MenuItem value="">{t('training.allModes', '교육방식 전체')}</MenuItem>
            <MenuItem value="CLASSROOM">{getModeLabel('CLASSROOM')}</MenuItem>
            <MenuItem value="ONLINE">{getModeLabel('ONLINE')}</MenuItem>
            <MenuItem value="HYBRID">{getModeLabel('HYBRID')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <Select displayEmpty value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <MenuItem value="">{t('training.allMonths', '교육월 전체')}</MenuItem>
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
              <MenuItem key={m} value={m}>{Number(m)}{t('common.month', '월')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton size="small" onClick={handleResetSearch}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Course Grid */}
      {coursesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">{t('training.noResults', '검색 결과가 없습니다')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((c) => {
            const total = c.totalSeats || 30
            const curr  = c.currentSeats || 0
            const pct = Math.min(Math.round((curr / total) * 100), 100)
            const seatColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'
            const isApplied = myAppliedCourseIds.has(c.id)
            const myApp = myApps.find(a => a.courseId === c.id)
            const full = pct >= 100 || c.status === 'CLOSED' || c.status === 'ENDED'
            return (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Paper sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ bgcolor: CARD_BANNER, color: '#fff', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip label={getCategoryLabel(c.category || '') || c.category || ''} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', height: 22 }} />
                    {c.lawBasis && (
                      <Chip label={c.lawBasis.split(' ')[0]} size="small" variant="outlined"
                        sx={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', height: 22 }} />
                    )}
                  </Box>
                  <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography fontWeight="bold" sx={{ mb: 0.5, fontSize: '0.95rem', minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.courseName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                      {getModeLabel(c.mode || 'CLASSROOM')} · {c.durationHours ?? 0}h · {c.instructor || ''}
                    </Typography>
                    <Box sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 1, mb: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t('training.period', '교육일정')}</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.78rem' }}>{fmtPeriod(c)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t('training.location', '장소')}</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.78rem' }}>{c.location || ''}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                      <Box sx={{ flex: 1, mr: 1 }}>
                        <Typography variant="caption" color="text.secondary">{curr}/{total}{t('common.persons', '명')}</Typography>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ height: 5, borderRadius: 3, '& .MuiLinearProgress-bar': { backgroundColor: seatColor } }} />
                      </Box>
                      {isApplied
                        ? <Chip label={getAppStatusLabel(myApp!.status) || myApp!.status} color={STATUS_COLOR[myApp!.status]} size="small" />
                        : (
                          <Button variant="contained" size="small" onClick={() => handleApplyClick(c)} disabled={full}>
                            {full ? t('training.full', '마감') : t('training.apply', '신청')}
                          </Button>
                        )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* 신청 모달 */}
      <Dialog open={!!applyDialogCourse} onClose={() => setApplyDialogCourse(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('training.applyForm', '교육신청서 작성')}
          <IconButton size="small" onClick={() => setApplyDialogCourse(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {applyDialogCourse && (
            <>
              <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mb: 2 }}>
                <Typography fontWeight="bold">{applyDialogCourse.courseName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {getCategoryLabel(applyDialogCourse.category || '')} · {applyDialogCourse.durationHours}h · {getModeLabel(applyDialogCourse.mode || 'CLASSROOM')} · {t('training.period', '교육일정')}: {fmtPeriod(applyDialogCourse)}
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold" color="primary" sx={{ display: 'block', mb: 1 }}>
                {t('training.applicantInfo', '신청자 정보')}
              </Typography>
              {/* 공통 form-table 패턴: 좌측 라벨 + 우측 값. 모달 폭에 맞춰 라벨 96px */}
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                {(() => {
                  const labelSx = {
                    width: 96, minWidth: 96, fontWeight: 'bold', bgcolor: 'grey.100',
                    px: 1.5, py: 1, borderRight: 1, borderColor: 'divider',
                    display: 'flex', alignItems: 'center', fontSize: '0.8rem',
                    justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center' as const,
                  }
                  const valSx = { flex: 1, px: 1.5, py: 0.75, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
                  const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
                  const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }
                  const lastRowSx = { display: 'flex', borderColor: 'divider' }
                  return (
                    <>
                      <Box sx={rowSx}>
                        <Box sx={labelSx}>{t('training.applicant', '신청자')}</Box>
                        <Box sx={valBorderSx}>
                          <TextField fullWidth size="small" value={user?.name || ''} InputProps={{ readOnly: true }} />
                        </Box>
                        <Box sx={labelSx}>{t('training.deptName', '부서명')}</Box>
                        <Box sx={valSx}>
                          <TextField fullWidth size="small" value={user?.department || ''} InputProps={{ readOnly: true }} />
                        </Box>
                      </Box>
                      <Box sx={rowSx}>
                        <Box sx={labelSx}>{t('training.phone', '연락처')}</Box>
                        <Box sx={valBorderSx}>
                          <TextField fullWidth size="small" value={applyForm.phone}
                            onChange={(e) => setApplyForm({ ...applyForm, phone: fmtPhone(e.target.value) })} placeholder="010-0000-0000" />
                        </Box>
                        <Box sx={labelSx}>{t('training.transportOption', '교통편')}</Box>
                        <Box sx={valSx}>
                          <FormControl fullWidth size="small">
                            <Select value={applyForm.transport || 'N/A'} onChange={(e) => setApplyForm({ ...applyForm, transport: e.target.value })} displayEmpty>
                              <MenuItem value="N/A">N/A</MenuItem>
                              <MenuItem value="개인 차량">개인 차량</MenuItem>
                              <MenuItem value="대중교통">대중교통</MenuItem>
                              <MenuItem value="회사 셔틀">회사 셔틀</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                      <Box sx={lastRowSx}>
                        <Box sx={labelSx}>{t('training.reason', '신청사유')}</Box>
                        <Box sx={valSx}>
                          <TextField fullWidth size="small" multiline rows={3}
                            value={applyForm.reason} onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })} />
                        </Box>
                      </Box>
                    </>
                  )
                })()}
              </Box>
              <FormControlLabel control={<Checkbox checked={applyForm.chkLaw} onChange={(e) => setApplyForm({ ...applyForm, chkLaw: e.target.checked })} />}
                label={<Typography variant="caption">{t('training.chkLaw', '본 교육은 법정 의무교육임을 확인하였으며 미이수 시 과태료가 부과될 수 있음을 인지합니다.')}</Typography>} />
              <FormControlLabel control={<Checkbox checked={applyForm.chkPrivacy} onChange={(e) => setApplyForm({ ...applyForm, chkPrivacy: e.target.checked })} />}
                label={<Typography variant="caption">{t('training.chkPrivacy', '개인정보 수집·이용에 동의합니다. (교육 이수 관리 목적)')}</Typography>} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setApplyDialogCourse(null)}>{t('common.cancel', '취소')}</Button>
          <Button variant="contained" onClick={handleSubmitApplication}
            disabled={createMutation.isPending || !applyForm.chkLaw || !applyForm.chkPrivacy}>
            {t('training.submit', '신청 제출')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 나의 신청내역 모달 */}
      <Dialog open={myAppsOpen} onClose={() => setMyAppsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('training.myApps', '나의 신청내역')}
          <IconButton size="small" onClick={() => setMyAppsOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {myApps.length === 0 ? (
            <Alert severity="info">{t('training.noMyApps', '신청한 교육이 없습니다')}</Alert>
          ) : (
            myApps.map(a => (
              <Paper key={a.id} sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight="bold" sx={{ fontSize: '0.9rem' }}>{a.courseName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.applicantDept} · {a.courseDate} · {t('training.applyDate', '신청일')} {a.applyDate}
                  </Typography>
                </Box>
                <Chip size="small" label={getAppStatusLabel(a.status) || a.status} color={STATUS_COLOR[a.status]} />
                {(a.status === 'PENDING' || a.status === 'APPROVED') && (
                  <Button size="small" color="error" variant="outlined" onClick={() => cancelMutation.mutate(a.id)}>
                    {t('common.cancel', '취소')}
                  </Button>
                )}
              </Paper>
            ))
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default TrainingApplyTab
