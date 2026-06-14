import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todayStr, weekFromTodayStr } from '../../utils/dateDefaults'
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip,
  RadioGroup,
  Radio,
  FormControlLabel,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isWithinInterval,
} from 'date-fns'
import { ko, enUS, zhCN } from 'date-fns/locale'
import DatePickerField from '../common/DatePickerField'
import { useAlert } from '../../contexts/AlertContext'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse } from '../../types/common.types'
import { EhsPlan, EhsPlanRequest } from '../../types/ehsPlan.types'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useCodeMap } from '../../hooks/useCodeMap'
import LoadingOverlay from '../common/LoadingOverlay'
import DevTestFillButton from '../common/DevTestFillButton'

const PLAN_COLORS = ['#2A9D8F', '#E76F51', '#264653', '#E9C46A', '#F4A261', '#6A4C93', '#1982C4', '#FF595E']

interface RecipientChip {
  name: string
  nameEn?: string
  nameZh?: string
  email: string
}

const serializeRecipients = (chips: RecipientChip[]): string => {
  return chips.map((c) => {
    const names = [c.name || '', c.nameEn || '', c.nameZh || ''].join('|')
    return `${names} <${c.email}>`
  }).join('; ')
}

const parseRecipients = (str: string): RecipientChip[] => {
  if (!str) return []
  return str.split(';').map((s) => s.trim()).filter(Boolean).map((entry) => {
    const match = entry.match(/^(.+?)\s*<(.+)>$/)
    if (match) {
      const [, namesStr, email] = match
      const names = namesStr.split('|')
      return { name: names[0] || '', nameEn: names[1] || '', nameZh: names[2] || '', email }
    }
    return { name: '', email: entry }
  })
}

const fetchPlansByDateRange = async (startDate: string, endDate: string): Promise<EhsPlan[]> => {
  const response = await axiosInstance.get<ApiResponse<EhsPlan[]>>('/plans/date-range', {
    params: { startDate, endDate },
  })
  return response.data.data
}

const EhsPlanTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()
  const { showConfirm, showSuccess } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 커뮤니케이션 › EHS Plan'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const canNew = canSee(MENU, 'LIST', 'New', myRoles)
  const getDetailRoles = (plan: { authorEmail?: string | null }): string[] => [
    ...myRoles,
    ...(plan.authorEmail && user?.email && plan.authorEmail === user.email ? ['writer'] : []),
  ]
  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('PLAN_CATEGORY')

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<EhsPlan | null>(null)
  const [viewPlan, setViewPlan] = useState<EhsPlan | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))

  const getDateFnsLocale = () => {
    if (i18n.language === 'zh') return zhCN
    if (i18n.language === 'ko') return ko
    return enUS
  }

  // Calendar range
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const startDateStr = format(calendarStart, 'yyyy-MM-dd')
  const endDateStr = format(calendarEnd, 'yyyy-MM-dd')

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['ehsPlans', startDateStr, endDateStr],
    queryFn: () => fetchPlansByDateRange(startDateStr, endDateStr),
  })

  // PC/모바일 레이아웃 동시 마운트 시 react-hook-form 중복 등록으로 입력값 유실 → 한 레이아웃만 마운트
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })

  const { handleSubmit, reset, control, setValue, getValues, formState: { errors } } = useForm<EhsPlanRequest>()
  const [userSelectModalOpen, setUserSelectModalOpen] = useState(false)
  const [recipientChips, setRecipientChips] = useState<RecipientChip[]>([])
  const [recipientInput, setRecipientInput] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: EhsPlanRequest) => axiosInstance.post('/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehsPlans'] })
      handleCloseDialog()
      showSuccess(t('ehsPlan.registered'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EhsPlanRequest }) =>
      axiosInstance.put(`/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehsPlans'] })
      handleCloseDialog()
      showSuccess(t('ehsPlan.modified'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehsPlans'] })
      setViewPlan(null)
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const handleToday = () => setCurrentMonth(new Date())

  const getRecipientLabel = (chip: RecipientChip): string => {
    const lang = i18n.language
    let displayName = chip.name
    if (lang === 'en' && chip.nameEn) displayName = chip.nameEn
    else if (lang === 'zh' && chip.nameZh) displayName = chip.nameZh
    return displayName ? `${displayName} <${chip.email}>` : chip.email
  }

  const handleOpenDialog = (plan?: EhsPlan) => {
    if (plan) {
      setEditingPlan(plan)
      reset({
        title: plan.title,
        planCategory: plan.planCategory || 'schedule',
        planDate: plan.planDate,
        planEndDate: plan.planEndDate,
        planDetail: plan.planDetail,
      })
      setRecipientChips(parseRecipients(plan.recipients || ''))
    } else {
      setEditingPlan(null)
      reset({ planCategory: 'schedule', planDate: todayStr(), planEndDate: weekFromTodayStr() })
      setRecipientChips([])
    }
    setRecipientInput('')
    setDialogOpen(true)
  }

  // DEV ONLY — 비어있는 항목을 EHS Plan 더미데이터로 채움 (입력값·날짜·수신자 보존)
  const fillTestData = () => {
    const v = getValues()
    if (!v.title) setValue('title', '월간 안전보건 합동점검')
    if (!v.planDetail) setValue('planDetail', '각 사업장 순회 합동 안전보건 점검 및 지적사항 개선 확인 (테스트 데이터)')
    if (!v.planCategory) setValue('planCategory', 'schedule')
    if (!v.planDate) setValue('planDate', todayStr())
    if (!v.planEndDate) setValue('planEndDate', weekFromTodayStr())
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingPlan(null)
    reset({ planCategory: 'schedule' })
    setRecipientChips([])
    setRecipientInput('')
  }

  const handleCancelDialog = () => {
    if (editingPlan) {
      // 수정 모드에서 취소 → 상세 모달로 복귀
      const plan = editingPlan
      handleCloseDialog()
      setViewPlan(plan)
    } else {
      handleCloseDialog()
    }
  }

  const onSubmit = (formData: EhsPlanRequest) => {
    // Flush any remaining input as a chip
    let finalChips = [...recipientChips]
    if (recipientInput.trim()) {
      const newEmails = recipientInput.split(/[;,]/).map((e) => e.trim()).filter(Boolean)
      const newChips = newEmails.map((email) => ({ name: '', email }))
      const existingEmails = new Set(finalChips.map((c) => c.email))
      newChips.forEach((c) => { if (!existingEmails.has(c.email)) finalChips.push(c) })
    }
    const submitData = { ...formData, recipients: finalChips.length > 0 ? serializeRecipients(finalChips) : undefined }
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const addRecipientChips = (input: string) => {
    const newEmails = input.split(/[;,]/).map((e) => e.trim()).filter(Boolean)
    if (newEmails.length > 0) {
      setRecipientChips((prev) => {
        const existingEmails = new Set(prev.map((c) => c.email))
        const newChips = newEmails.filter((e) => !existingEmails.has(e)).map((email) => ({ name: '', email }))
        return [...prev, ...newChips]
      })
    }
  }

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ';' || e.key === ',') {
      e.preventDefault()
      if (recipientInput.trim()) {
        addRecipientChips(recipientInput)
        setRecipientInput('')
      }
    } else if (e.key === 'Backspace' && !recipientInput && recipientChips.length > 0) {
      setRecipientChips((prev) => prev.slice(0, -1))
    }
  }

  const handleRemoveRecipient = (email: string) => {
    setRecipientChips((prev) => prev.filter((c) => c.email !== email))
  }

  const handleUserSelectConfirm = (users: UserInfo[]) => {
    const newChips: RecipientChip[] = users
      .filter((u) => u.email)
      .map((u) => ({ name: u.name || '', nameEn: u.nameEn || '', nameZh: u.nameZh || '', email: u.email }))
    setRecipientChips((prev) => {
      const existingEmails = new Set(prev.map((c) => c.email))
      return [...prev, ...newChips.filter((c) => !existingEmails.has(c.email))]
    })
    setUserSelectModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(t('ehsPlan.deletePlan'))
    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  // Get plans for a specific day
  const getPlansForDay = useMemo(() => {
    return (day: Date) => {
      return plans.filter((plan) => {
        if (!plan.planDate) return false
        const planStart = parseISO(plan.planDate.split('T')[0])
        const planEnd = plan.planEndDate ? parseISO(plan.planEndDate.split('T')[0]) : planStart
        return isWithinInterval(day, { start: planStart, end: planEnd })
      })
    }
  }, [plans])

  const getPlanColor = (index: number) => PLAN_COLORS[index % PLAN_COLORS.length]

  const weekDays = useMemo(() => {
    const locale = getDateFnsLocale()
    const days = []
    const weekStart = startOfWeek(new Date(2024, 0, 7), { weekStartsOn: 0 })
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      days.push(format(d, 'EEE', { locale }))
    }
    return days
  }, [i18n.language])

  const mobileWeekDays = useMemo(() => {
    const lang = i18n.language
    if (lang === 'en') return ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    if (lang === 'zh') return ['日', '一', '二', '三', '四', '五', '六']
    return ['일', '월', '화', '수', '목', '금', '토']
  }, [i18n.language])

  const selectedDatePlans = useMemo(() => getPlansForDay(selectedDate), [selectedDate, getPlansForDay])

  const today = new Date()

  return (
    <Box>
      <LoadingOverlay open={isProcessing} message="처리 중..." />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold" sx={{ minWidth: { xs: 'auto', md: 160 }, textAlign: 'center' }}>
            {format(currentMonth, 'yyyy MMMM', { locale: getDateFnsLocale() })}
          </Typography>
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
          <Button variant="outlined" size="small" onClick={handleToday} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
            {t('ehsPlan.today')}
          </Button>
        </Box>
        {canNew && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ width: { xs: '100%', md: 'auto' } }}>
            New
          </Button>
        )}
      </Box>

      {/* Calendar */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* PC Calendar */}
          <Paper variant="outlined" sx={{ overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
            {/* Weekday Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: 1, borderColor: 'divider' }}>
              {weekDays.map((day, idx) => (
                <Box
                  key={idx}
                  sx={{
                    py: 1,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    bgcolor: 'grey.100',
                    borderRight: idx < 6 ? 1 : 0,
                    borderColor: 'divider',
                    color: idx === 0 ? 'error.main' : idx === 6 ? 'primary.main' : 'text.primary',
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>

            {/* Calendar Grid */}
            {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => (
              <Box
                key={weekIdx}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  borderBottom: weekIdx < Math.ceil(calendarDays.length / 7) - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                  const dayPlans = getPlansForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, today)

                  return (
                    <Box
                      key={dayIdx}
                      sx={{
                        minHeight: 100,
                        p: 0.5,
                        borderRight: dayIdx < 6 ? 1 : 0,
                        borderColor: 'divider',
                        bgcolor: isToday ? 'action.selected' : isCurrentMonth ? 'background.paper' : 'grey.50',
                        cursor: 'default',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isToday ? 'bold' : 'normal',
                          color: !isCurrentMonth
                            ? 'text.disabled'
                            : dayIdx === 0
                            ? 'error.main'
                            : dayIdx === 6
                            ? 'primary.main'
                            : 'text.primary',
                          mb: 0.5,
                          px: 0.5,
                          ...(isToday && {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }),
                        }}
                      >
                        {format(day, 'd')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {dayPlans.slice(0, 3).map((plan) => (
                          <Tooltip key={plan.id} title={plan.title} arrow>
                            <Box
                              onClick={() => setViewPlan(plan)}
                              sx={{
                                bgcolor: getPlanColor(plans.indexOf(plan)),
                                color: '#fff',
                                fontSize: '0.65rem',
                                px: 0.5,
                                py: 0.15,
                                borderRadius: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 },
                              }}
                            >
                              {plan.title}
                            </Box>
                          </Tooltip>
                        ))}
                        {dayPlans.length > 3 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', pl: 0.5 }}>
                            +{dayPlans.length - 3}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            ))}
          </Paper>

          {/* Mobile Mini Calendar */}
          <Paper variant="outlined" sx={{ display: { xs: 'block', md: 'none' }, overflow: 'hidden', borderRadius: 2 }}>
            <Box sx={{ px: 1.5, pt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                {mobileWeekDays.map((d, i) => (
                  <Typography key={i} variant="caption" sx={{ textAlign: 'center', fontWeight: 600, color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : 'text.secondary', py: 0.3 }}>
                    {d}
                  </Typography>
                ))}
                {calendarDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, today)
                  const isSelected = isSameDay(day, selectedDate)
                  const dayPlans = getPlansForDay(day)
                  const hasPlan = dayPlans.length > 0
                  const dayOfWeek = day.getDay()

                  return (
                    <Box
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      sx={{
                        textAlign: 'center',
                        py: 0.3,
                        cursor: 'pointer',
                        borderRadius: 1,
                        position: 'relative',
                        backgroundColor: isSelected ? 'primary.light' : isToday ? 'action.selected' : 'transparent',
                        '&:hover': { backgroundColor: isSelected ? undefined : 'action.hover' },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: isToday ? 700 : 400,
                          color: isSelected ? 'primary.contrastText' : !isCurrentMonth ? 'text.disabled' : dayOfWeek === 0 ? '#EF4444' : dayOfWeek === 6 ? '#3B82F6' : 'text.primary',
                        }}
                      >
                        {format(day, 'd')}
                      </Typography>
                      {hasPlan && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '2px', mt: '-2px', mb: '1px' }}>
                          {dayPlans.slice(0, 3).map((plan, idx) => (
                            <Box key={idx} sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: getPlanColor(plans.indexOf(plan)) }} />
                          ))}
                        </Box>
                      )}
                      {!hasPlan && <Box sx={{ height: 6 }} />}
                    </Box>
                  )
                })}
              </Box>
            </Box>

            {/* Selected Date Plan List */}
            <Box sx={{ borderTop: 1, borderColor: 'divider', px: 1.5, py: 1, minHeight: 60 }}>
              <Typography variant="caption" fontWeight={600} sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                {format(selectedDate, 'MM/dd (EEE)', { locale: getDateFnsLocale() })}
              </Typography>
              {selectedDatePlans.length === 0 ? (
                <Typography variant="caption" color="text.disabled">
                  {t('ehsPlan.noPlans')}
                </Typography>
              ) : (
                selectedDatePlans.map((plan, idx) => (
                  <Box
                    key={plan.id}
                    onClick={() => setViewPlan(plan)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, py: 0.7, px: 0.5,
                      cursor: 'pointer',
                      borderBottom: idx < selectedDatePlans.length - 1 ? 1 : 0,
                      borderColor: 'grey.200',
                      '&:hover': { backgroundColor: 'action.hover' },
                      borderRadius: 0.5,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: getPlanColor(plans.indexOf(plan)) }} />
                    <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {plan.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.65rem' }}>
                      {getCategoryLabel(plan.planCategory ?? '')}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {editingPlan ? t('ehsPlan.editPlan') : t('ehsPlan.addPlan')}
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {/* PC Layout */}
            {isDesktop && (
            <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mt: 2 }}>
              {/* Row 1: Category (Radio) */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('ehsPlan.category')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 0.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                  <Controller
                    name="planCategory"
                    control={control}
                    defaultValue="schedule"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <RadioGroup row {...field}>
                        {categoryCodes.map((item) => (
                          <FormControlLabel key={item.code} value={item.code} control={<Radio size="small" />} label={<Typography variant="body2">{getCategoryLabel(item.code)}</Typography>} />
                        ))}
                      </RadioGroup>
                    )}
                  />
                </Box>
              </Box>

              {/* Row 2: 시작일 | 종료일 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('ehsPlan.startDate')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                  <Controller
                    name="planDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DatePickerField value={field.value} onChange={field.onChange} size="small" error={!!errors.planDate} />
                    )}
                  />
                </Box>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('ehsPlan.endDate')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="planEndDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DatePickerField value={field.value} onChange={field.onChange} size="small" error={!!errors.planEndDate} />
                    )}
                  />
                </Box>
              </Box>

              {/* Row 3: 일정명 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('ehsPlan.planName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller name="title" control={control} rules={{ required: true }} render={({ field }) => (
                    <TextField fullWidth size="small" {...field} value={field.value || ''} error={!!errors.title} />
                  )} />
                </Box>
              </Box>

              {/* Row 4: 일정상세 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('ehsPlan.planDetail')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller name="planDetail" control={control} rules={{ required: true }} render={({ field }) => (
                    <TextField fullWidth size="small" multiline rows={4} {...field} value={field.value || ''} error={!!errors.planDetail} />
                  )} />
                </Box>
              </Box>

              {/* Row 5: 수신자 */}
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('ehsPlan.recipients')}
                </Typography>
                <Box sx={{ flex: 1, px: 1, py: 0.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 0.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                      minHeight: 36,
                      cursor: 'text',
                      '&:focus-within': { borderColor: 'primary.main', borderWidth: 2, px: '7px', py: '3px' },
                    }}
                    onClick={() => document.getElementById('recipient-input')?.focus()}
                  >
                    {recipientChips.map((chip) => (
                      <Chip key={chip.email} label={getRecipientLabel(chip)} size="small" onDelete={() => handleRemoveRecipient(chip.email)} />
                    ))}
                    <input
                      id="recipient-input"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={handleRecipientKeyDown}
                      onBlur={() => { if (recipientInput.trim()) { addRecipientChips(recipientInput); setRecipientInput('') } }}
                      placeholder={recipientChips.length === 0 ? 'user@hankook.com' : ''}
                      style={{ border: 'none', outline: 'none', flex: 1, minWidth: 120, fontSize: '0.875rem', background: 'transparent', padding: '2px 0', color: 'inherit' }}
                    />
                  </Box>
                  <Button type="button" variant="outlined" size="small" onClick={() => setUserSelectModalOpen(true)} sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }} startIcon={<SearchIcon />}>
                    {t('ehsPlan.find')}
                  </Button>
                </Box>
              </Box>
            </Box>
            )}

            {/* Mobile Layout */}
            {!isDesktop && (
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.category')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
                <Controller
                  name="planCategory"
                  control={control}
                  defaultValue="schedule"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <RadioGroup row {...field}>
                      {categoryCodes.map((item) => (
                        <FormControlLabel key={item.code} value={item.code} control={<Radio size="small" />} label={<Typography variant="body2">{getCategoryLabel(item.code)}</Typography>} />
                      ))}
                    </RadioGroup>
                  )}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.startDate')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
                <Controller name="planDate" control={control} rules={{ required: true }} render={({ field }) => <DatePickerField value={field.value} onChange={field.onChange} size="small" error={!!errors.planDate} />} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.endDate')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
                <Controller name="planEndDate" control={control} rules={{ required: true }} render={({ field }) => <DatePickerField value={field.value} onChange={field.onChange} size="small" error={!!errors.planEndDate} />} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.planName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
                <Controller name="title" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField fullWidth size="small" {...field} value={field.value || ''} error={!!errors.title} />
                )} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.planDetail')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
                <Controller name="planDetail" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField fullWidth size="small" multiline rows={4} {...field} value={field.value || ''} error={!!errors.planDetail} />
                )} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">{t('ehsPlan.recipients')}</Typography>
                  <Button type="button" variant="outlined" size="small" onClick={() => setUserSelectModalOpen(true)} sx={{ minWidth: 'auto', py: 0, px: 1, fontSize: '0.75rem' }} startIcon={<SearchIcon sx={{ fontSize: '0.875rem !important' }} />}>
                    {t('ehsPlan.find')}
                  </Button>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 0.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    minHeight: 36,
                    cursor: 'text',
                    '&:focus-within': { borderColor: 'primary.main', borderWidth: 2, px: '7px', py: '3px' },
                  }}
                  onClick={() => document.getElementById('recipient-input-mobile')?.focus()}
                >
                  {recipientChips.map((chip) => (
                    <Chip key={chip.email} label={getRecipientLabel(chip)} size="small" onDelete={() => handleRemoveRecipient(chip.email)} sx={{ maxWidth: '100%' }} />
                  ))}
                  <input
                    id="recipient-input-mobile"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={handleRecipientKeyDown}
                    onBlur={() => { if (recipientInput.trim()) { addRecipientChips(recipientInput); setRecipientInput('') } }}
                    placeholder={recipientChips.length === 0 ? 'user@hankook.com' : ''}
                    style={{ border: 'none', outline: 'none', flex: 1, minWidth: 120, fontSize: '0.875rem', background: 'transparent', padding: '2px 0', color: 'inherit' }}
                  />
                </Box>
              </Box>
            </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
            {!editingPlan && <DevTestFillButton onFill={fillTestData} />}
            <Button type="button" variant="outlined" onClick={handleCancelDialog}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={isProcessing}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewPlan} onClose={() => setViewPlan(null)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          {viewPlan?.title}
          <IconButton size="small" onClick={() => setViewPlan(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* PC Layout */}
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mt: 2, display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t('ehsPlan.category')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, fontSize: '0.875rem' }}>
                {viewPlan?.planCategory ? getCategoryLabel(viewPlan.planCategory) : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t('ehsPlan.startDate')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, fontSize: '0.875rem', borderRight: 1, borderColor: 'divider' }}>
                {viewPlan?.planDate ? viewPlan.planDate.split('T')[0] : ''}
              </Typography>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t('ehsPlan.endDate')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, fontSize: '0.875rem' }}>
                {viewPlan?.planEndDate ? viewPlan.planEndDate.split('T')[0] : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t('ehsPlan.planName')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, fontSize: '0.875rem' }}>
                {viewPlan?.title || ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 2 }}>
                {t('ehsPlan.planDetail')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {viewPlan?.planDetail || ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t('ehsPlan.recipients')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                {viewPlan?.recipients
                  ? parseRecipients(viewPlan.recipients).map((chip) => (
                      <Chip key={chip.email} label={getRecipientLabel(chip)} size="small" variant="outlined" />
                    ))
                  : null}
              </Box>
            </Box>
          </Box>

          {/* Mobile Layout */}
          <Paper sx={{ display: { xs: 'block', md: 'none' }, p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.category')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewPlan?.planCategory ? getCategoryLabel(viewPlan.planCategory) : ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.startDate')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewPlan?.planDate ? viewPlan.planDate.split('T')[0] : ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.endDate')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewPlan?.planEndDate ? viewPlan.planEndDate.split('T')[0] : ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.planName')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewPlan?.title || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.planDetail')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{viewPlan?.planDetail || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ehsPlan.recipients')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {viewPlan?.recipients
                    ? parseRecipients(viewPlan.recipients).map((chip) => (
                        <Chip key={chip.email} label={getRecipientLabel(chip)} size="small" variant="outlined" />
                      ))
                    : null}
                </Box>
              </Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', '& > :not(style) ~ :not(style)': { ml: { xs: 0 } }, gap: 1 }}>
          {viewPlan && canSee(MENU, 'DETAIL', '수정', getDetailRoles(viewPlan)) && (
            <Button variant="contained" color="primary" onClick={() => { setViewPlan(null); handleOpenDialog(viewPlan) }} sx={{ flex: { xs: 1, md: 0 }, minWidth: { xs: 0 } }}>{t('common.edit')}</Button>
          )}
          {viewPlan && canSee(MENU, 'DETAIL', '삭제', getDetailRoles(viewPlan)) && (
            <Button variant="contained" color="error" onClick={() => handleDelete(viewPlan.id)} sx={{ flex: { xs: 1, md: 0 }, minWidth: { xs: 0 } }}>{t('common.delete')}</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* UserSelectModal */}
      <UserSelectModal
        open={userSelectModalOpen}
        onClose={() => setUserSelectModalOpen(false)}
        selectedUsers={[]}
        onConfirm={handleUserSelectConfirm}
        useCompanyTree
        emailSuffix="@hankook.com"
      />

    </Box>
  )
}

export default EhsPlanTab
