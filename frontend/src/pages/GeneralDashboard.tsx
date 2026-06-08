import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, Typography, Select, MenuItem, IconButton, Chip, Tooltip as MuiTooltip, Button,
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label, LabelList,
  AreaChart, Area, CartesianGrid, XAxis,
  BarChart, Bar, YAxis, Legend,
} from 'recharts'
import { useThemeMode } from '../context/ThemeContext'
import axiosInstance from '../api/axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { EhsMessageResponse, EhsAlertResponse } from '../types/dashboard.types'
import { useCodeMap } from '../hooks/useCodeMap'
import {
  startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, parseISO, addMonths, subMonths,
} from 'date-fns'
import { ko, enUS, zhCN } from 'date-fns/locale'
import { EhsPlan as EhsPlanType } from '../types/ehsPlan.types'
import UserSelectModal from '../components/common/UserSelectModal'
import type { UserInfo } from '../components/common/UserSelectModal'
import EhsBudgetOverview from '../components/ehs/ehsBudget/EhsBudgetOverview'
import SafetyGoalProgressTable from '../components/planKpiGoal/SafetyGoalProgressTable'
import WeatherWidget from '../components/dashboard/WeatherWidget'

// shadcn/ui v4 chart colors (Tailwind v4 blue palette)
const COLORS = {
  chart1: '#93C5FD',
  chart2: '#3B82F6',
  chart3: '#2563EB',
  chart4: '#1D4ED8',
  chart5: '#1E40AF',
}

// shadcn v4 ChartTooltipContent - 다크/라이트 모드 대응
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShadcnTooltip = ({ active, payload, label, hideLabel }: { active?: boolean; payload?: any[]; label?: string | number; hideLabel?: boolean }) => {
  const { isDarkMode } = useThemeMode()
  if (!active || !payload?.length) return null

  const bg = isDarkMode ? '#0a0a0a' : '#ffffff'
  const fg = isDarkMode ? '#fafafa' : '#0a0a0a'
  const mutedFg = isDarkMode ? '#a1a1a1' : '#737373'
  const borderColor = isDarkMode ? 'rgba(63,63,70,0.5)' : 'rgba(229,229,229,0.5)'

  return (
    <div style={{
      minWidth: '8rem',
      display: 'grid',
      alignItems: 'start',
      gap: 6,
      borderRadius: 8,
      border: `1px solid ${borderColor}`,
      backgroundColor: bg,
      padding: '6px 10px',
      fontSize: 12,
      lineHeight: '16px',
      color: fg,
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    }}>
      {label && !hideLabel && (
        <div style={{ fontWeight: 500, color: fg }}>{label}</div>
      )}
      {payload.map((entry, index) => (
        <div key={index} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10,
            height: 10,
            flexShrink: 0,
            borderRadius: 2,
            border: `1px solid ${borderColor}`,
            backgroundColor: entry.payload?.fill || entry.color,
          }} />
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            {!hideLabel && (
              <span style={{ color: mutedFg }}>
                {entry.name || entry.payload?.label || entry.payload?.browser || entry.payload?.month}
              </span>
            )}
            <span style={{
              color: fg,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// 차트 데이터 생성 (다국어 지원)
const useChartData = () => {
  const { t } = useTranslation()
  return [
    { label: t('generalDashboard.slip'), value: 45, fill: '#EF4444' },
    { label: t('generalDashboard.stairAccident'), value: 30, fill: '#F59E0B' },
    { label: t('generalDashboard.unidentified'), value: 15, fill: '#10B981' },
    { label: t('generalDashboard.virus'), value: 5, fill: '#3B82F6' },
    { label: t('generalDashboard.fire'), value: 5, fill: '#8B5CF6' },
  ]
}

const useBarDeptData = () => {
  const { t } = useTranslation()
  return [
    { label: t('generalDashboard.assemblyTeam'), value: 12, fill: '#EF4444' },
    { label: t('generalDashboard.designTeam'), value: 9, fill: '#F59E0B' },
    { label: t('generalDashboard.fireTeam'), value: 7, fill: '#10B981' },
    { label: t('generalDashboard.qualityTeam'), value: 5, fill: '#3B82F6' },
    { label: t('generalDashboard.logisticsTeam'), value: 3, fill: '#8B5CF6' },
  ]
}

// Area Chart - Stacked 데이터 (12개월)
const areaDataFull = [
  { month: 'January', accident: 3, nearMiss: 5, safetyWork: 12 },
  { month: 'February', accident: 2, nearMiss: 8, safetyWork: 15 },
  { month: 'March', accident: 4, nearMiss: 6, safetyWork: 10 },
  { month: 'April', accident: 1, nearMiss: 9, safetyWork: 18 },
  { month: 'May', accident: 3, nearMiss: 7, safetyWork: 14 },
  { month: 'June', accident: 2, nearMiss: 4, safetyWork: 16 },
  { month: 'July', accident: 5, nearMiss: 10, safetyWork: 13 },
  { month: 'August', accident: 1, nearMiss: 3, safetyWork: 11 },
  { month: 'September', accident: 4, nearMiss: 8, safetyWork: 17 },
  { month: 'October', accident: 2, nearMiss: 6, safetyWork: 19 },
  { month: 'November', accident: 3, nearMiss: 5, safetyWork: 14 },
  { month: 'December', accident: 1, nearMiss: 7, safetyWork: 16 },
]

const getAreaData = (period: string) => {
  if (period === '3m') return areaDataFull.slice(-3)
  if (period === '6m') return areaDataFull.slice(-6)
  return areaDataFull
}

// shadcn Card 스타일 래퍼
const ChartCard: React.FC<{
  title: string
  description?: string
  footer?: string
  children: React.ReactNode
}> = ({ title, description, footer, children }) => (
  <Paper
    variant="outlined"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: 420,
      borderRadius: 2,
      overflow: 'hidden',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 2.5, px: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1 }}>
          {description}
        </Typography>
      )}
    </Box>
    <Box sx={{ flex: 1, px: 2, py: 1 }}>
      {children}
    </Box>
    {footer !== undefined && (
      <Box sx={{ textAlign: 'center', pb: 2, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
          <Typography variant="body2" fontWeight={500}>
            Trending up by 5.2% this month
          </Typography>
          <TrendingUpIcon sx={{ fontSize: 16 }} />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {footer}
        </Typography>
      </Box>
    )}
  </Paper>
)

// Radial Chart - Text (shadcn 원본 동일 - PieChart 기반)
// 4개 카드의 숫자는 실제 DB count 로 연결 (totalElements 기반)
const fetchTotalElements = async (url: string): Promise<number> => {
  try {
    const res = await axiosInstance.get<ApiResponse<PageResponse<unknown>>>(url, { params: { page: 0, size: 1 } })
    return res.data.data?.totalElements ?? 0
  } catch {
    return 0
  }
}

const useRadialCards = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: accidentCount = 0 } = useQuery({
    queryKey: ['dashboard-count', 'near-miss', 'ACCIDENT'],
    queryFn: () => fetchTotalElements('/near-miss/type/ACCIDENT'),
  })
  const { data: nearMissCount = 0 } = useQuery({
    queryKey: ['dashboard-count', 'near-miss', 'NEAR_MISS'],
    queryFn: () => fetchTotalElements('/near-miss/type/NEAR_MISS'),
  })
  const { data: safetyWorkCount = 0 } = useQuery({
    queryKey: ['dashboard-count', 'safety-works'],
    queryFn: () => fetchTotalElements('/safety-works'),
  })
  const { data: documentCount = 0 } = useQuery({
    queryKey: ['dashboard-count', 'safety-education'],
    queryFn: () => fetchTotalElements('/safety-education'),
  })

  // ratio: 값에 비례하여 0~360 도 호 길이 (최대 100 기준, 100 이상이면 한 바퀴)
  const arc = (v: number) => Math.min(360, Math.round((v / 100) * 360))

  return [
    { title: t('generalDashboard.accidentCount'), value: accidentCount, ratio: arc(accidentCount), color: '#EF4444', onTitleClick: () => navigate('/near-miss?incidentType=ACCIDENT') },
    { title: t('generalDashboard.nearMissCount'), value: nearMissCount, ratio: arc(nearMissCount), color: '#F59E0B', onTitleClick: () => navigate('/near-miss?incidentType=NEAR_MISS') },
    { title: t('generalDashboard.safetyWorkCount'), value: safetyWorkCount, ratio: arc(safetyWorkCount), color: '#10B981', onTitleClick: () => navigate('/safety-work') },
    { title: t('generalDashboard.documentCount'), value: documentCount, ratio: arc(documentCount), color: '#3B82F6', onTitleClick: () => navigate('/ehs?tab=0') },
  ]
}

const RadialTextCard: React.FC<{
  title: string
  value: number
  ratio: number // 0~360 arc 각도
  color: string
  onTitleClick?: () => void
}> = ({ title, value, ratio, color, onTitleClick }) => {
  const { isDarkMode } = useThemeMode()
  const fg = isDarkMode ? '#fafafa' : '#0a0a0a'
  const mutedBg = isDarkMode ? '#27272a' : '#f5f5f5'

  const arcData = [{ value: ratio }, { value: 360 - ratio }]

  return (
    <Paper
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}
    >
      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 250, aspectRatio: '1/1', mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* 풀 원형 트랙 (회색 배경 링) */}
            <Pie
              data={[{ value: 1 }]}
              dataKey="value"
              innerRadius={80}
              outerRadius={110}
              fill={mutedBg}
              stroke="none"
              isAnimationActive={false}
            />
            {/* 값 arc: 250도 파란색 + 110도 투명 */}
            <Pie
              data={arcData}
              dataKey="value"
              innerRadius={80}
              outerRadius={110}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              cornerRadius={10}
            >
              <Cell fill={color} />
              <Cell fill="transparent" />
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} style={{ fontSize: 60, fontWeight: 700, fill: fg }}>
                          {value.toLocaleString()}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ textAlign: 'center', pt: 0.5, pb: 2.5, px: 2 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          onClick={onTitleClick}
          sx={onTitleClick ? { cursor: 'pointer', '&:hover': { textDecoration: 'underline' } } : undefined}
        >
          {title}
        </Typography>
      </Box>
    </Paper>
  )
}

// Area Chart - Stacked (with period tabs/select)
const AreaStacked = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const periodOptions = [
    { value: '3m', label: t('generalDashboard.period3m') },
    { value: '6m', label: t('generalDashboard.period6m') },
    { value: '1y', label: t('generalDashboard.period1y') },
  ]
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'
  const gridColor = isDarkMode ? 'rgba(63,63,70,0.3)' : 'rgba(229,229,229,0.5)'
  const tabBg = isDarkMode ? '#27272a' : '#f4f4f5'
  const tabActiveBg = isDarkMode ? '#09090b' : '#ffffff'
  const tabColor = isDarkMode ? '#a1a1a1' : '#71717a'
  const tabActiveColor = isDarkMode ? '#fafafa' : '#09090b'
  const [period, setPeriod] = useState('3m')

  return (
    <Paper
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column', height: 420, borderRadius: 2, overflow: 'hidden' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pt: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
            {t('generalDashboard.trendAnalysis')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1 }}>
            {t('generalDashboard.periodStatus', { period: period === '3m' ? t('generalDashboard.recent3Months') : period === '6m' ? t('generalDashboard.recent6Months') : t('generalDashboard.recent1Year') })}
          </Typography>
        </Box>

        {/* PC: shadcn 스타일 탭 */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            gap: '2px',
            p: '3px',
            borderRadius: '8px',
            backgroundColor: tabBg,
          }}
        >
          {periodOptions.map((opt) => (
            <Box
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s',
                backgroundColor: period === opt.value ? tabActiveBg : 'transparent',
                color: period === opt.value ? tabActiveColor : tabColor,
                boxShadow: period === opt.value ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                '&:hover': {
                  color: tabActiveColor,
                },
              }}
            >
              {opt.label}
            </Box>
          ))}
        </Box>

        {/* 모바일: Select 드롭다운 */}
        <Select
          size="small"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          sx={{
            display: { xs: 'flex', md: 'none' },
            height: 32,
            fontSize: '0.8rem',
            borderRadius: '8px',
            minWidth: 100,
          }}
         displayEmpty>
          <MenuItem value="" disabled>선택하세요</MenuItem>
          {periodOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>{opt.label}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ flex: 1, px: 2, py: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={getAreaData(period)} margin={{ left: -4, right: 12, top: 12 }}>
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
              tick={{ fill: tickColor, fontSize: 12 }}
            />
            <Tooltip content={<ShadcnTooltip />} />
            <Area
              dataKey="safetyWork"
              name={t('generalDashboard.safetyWork')}
              type="natural"
              fill="#10B981"
              fillOpacity={0.4}
              stroke="#10B981"
              stackId="a"
            />
            <Area
              dataKey="nearMiss"
              name={t('generalDashboard.nearMiss')}
              type="natural"
              fill="#F59E0B"
              fillOpacity={0.4}
              stroke="#F59E0B"
              stackId="a"
            />
            <Area
              dataKey="accident"
              name={t('generalDashboard.accident')}
              type="natural"
              fill="#EF4444"
              fillOpacity={0.4}
              stroke="#EF4444"
              stackId="a"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

// Pie Chart - Label List
const PieLabelList = () => {
  const { t } = useTranslation()
  const chartData = useChartData()
  return (
    <ChartCard title={t('generalDashboard.typeStats')} description={t('generalDashboard.frequentAccident')}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ShadcnTooltip />} />
          <Pie data={chartData} dataKey="value" nameKey="label" stroke="none" animationDuration={400}>
            <LabelList dataKey="label" stroke="none" fontSize={11} fill="#fff" fontWeight={600} style={{ pointerEvents: 'none' }} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Bar Chart - 사고 부서 상위 5개팀
const BarMixed = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'
  const barDeptData = useBarDeptData()

  return (
    <ChartCard title={t('generalDashboard.accidentDept')} description={t('generalDashboard.top5Teams')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barDeptData} layout="vertical" margin={{ left: 16, right: 12 }}>
          <YAxis
            dataKey="label"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fill: tickColor, fontSize: 12 }}
          />
          <XAxis dataKey="value" type="number" hide />
          <Tooltip content={<ShadcnTooltip />} cursor={false} />
          <Bar dataKey="value" radius={5}>
            {barDeptData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

const PLAN_DOT_COLORS = ['#2A9D8F', '#E76F51', '#264653', '#E9C46A', '#F4A261', '#6A4C93', '#1982C4', '#FF595E']

// 안전 목표 통계 표 — 클릭 이동 비활성 (통계 전용 표시)
const GoalProgressTable = () => {
  return <SafetyGoalProgressTable />
}

// 팀별 위험성평가 - 개선전/개선후 세로 막대 차트
const TeamRiskAssessmentChart = () => {
  const { isDarkMode } = useThemeMode()
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'

  const data = [
    { team: '경영지원팀', before: 72, after: 35 },
    { team: 'CS팀', before: 65, after: 28 },
    { team: '영업관리', before: 80, after: 40 },
    { team: '안전팀', before: 88, after: 32 },
    { team: '공사안전팀', before: 92, after: 45 },
    { team: '배관팀', before: 78, after: 38 },
    { team: '안전기술팀', before: 70, after: 30 },
    { team: '노경지원팀', before: 60, after: 25 },
  ]

  return (
    <ChartCard title="팀별 위험성평가" description="개선전 / 개선후">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 30 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={isDarkMode ? '#27272a' : '#e5e7eb'} />
          <XAxis
            dataKey="team"
            tickLine={false}
            axisLine={false}
            tick={{ fill: tickColor, fontSize: 11 }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: tickColor, fontSize: 11 }}
          />
          <Tooltip content={<ShadcnTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="before" name="개선전" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="after" name="개선후" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 지역별 안전 체크율 세로 막대 차트
const RegionSafetyCheckChart = () => {
  const { isDarkMode } = useThemeMode()
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'

  // 90 ~ 100 범위 랜덤 값 (마운트 시 1회 생성)
  const data = useMemo(() => {
    const rand = () => 90 + Math.floor(Math.random() * 11) // 90~100
    return [
      { region: '구리', rate: rand(), fill: '#3b82f6' },
      { region: '남양주', rate: rand(), fill: '#8b5cf6' },
      { region: '포천', rate: rand(), fill: '#06b6d4' },
      { region: '가평', rate: rand(), fill: '#10b981' },
      { region: '양평', rate: rand(), fill: '#f59e0b' },
    ]
  }, [])

  return (
    <ChartCard title="지역별 안전 체크율" description="안전체크 현황">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 12, left: 0, bottom: 10 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={isDarkMode ? '#27272a' : '#e5e7eb'} />
          <XAxis
            dataKey="region"
            tickLine={false}
            axisLine={false}
            tick={{ fill: tickColor, fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: tickColor, fontSize: 11 }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ShadcnTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="rate" name="체크율" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
            <LabelList dataKey="rate" position="top" formatter={((v: unknown) => `${v}%`) as never} style={{ fill: tickColor, fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// EHS Message 컴포넌트
const EhsMessage = () => {
  const { isDarkMode } = useThemeMode()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { codeList } = useCodeMap('MESSAGE_CATEGORY')
  const borderColor = isDarkMode ? '#27272a' : '#e5e7eb'
  const hoverBg = isDarkMode ? '#1a1a2e' : '#f9fafb'
  const [messages, setMessages] = useState<EhsMessageResponse[]>([])

  // codeNameKo 기준으로 코드 매칭 (DB category 값이 한국어)
  const getCategoryInfo = (category: string) => {
    const found = codeList.find(c => c.codeNameKo === category)
    if (!found) return { label: category, color: '#8B5CF6' }
    const lang = i18n.language
    const label = lang === 'en' && found.codeNameEn ? found.codeNameEn
      : lang === 'zh' && found.codeNameZh ? found.codeNameZh
      : found.codeNameKo || category
    return { label, color: found.codeValue || '#8B5CF6' }
  }

  useEffect(() => {
    axiosInstance.get<ApiResponse<PageResponse<EhsMessageResponse>>>('/messages', {
      params: { page: 0, size: 6, sort: 'createdAt,desc' },
    }).then(res => {
      setMessages(res.data.data.content)
    }).catch(() => {})
  }, [i18n.language])

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: 380, borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 2.5, px: 3, pb: 1.5 }}>
        <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>{t('generalDashboard.ehsMessage')}</Typography>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {messages.map((msg, idx) => (
          <Box
            key={msg.id}
            onClick={() => navigate(`/ehs/communication?tab=3&messageId=${msg.id}`)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2,
              borderBottom: idx < messages.length - 1 ? `1px solid ${borderColor}` : 'none',
              cursor: 'pointer',
              '&:hover': { backgroundColor: hoverBg },
              transition: 'background-color 0.15s',
            }}
          >
            {msg.category && (() => {
              const cat = getCategoryInfo(msg.category)
              return (
                <Chip
                  label={cat.label}
                  size="small"
                  sx={{
                    backgroundColor: cat.color,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 22,
                    minWidth: 42,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              )
            })()}
            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {msg.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              {format(new Date(msg.createdAt), 'yyyy.MM.dd')}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

// EHS Alert 컴포넌트
const EhsAlert = () => {
  const { isDarkMode } = useThemeMode()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const borderColor = isDarkMode ? '#27272a' : '#e5e7eb'
  const hoverBg = isDarkMode ? '#1a1a2e' : '#f9fafb'
  const [alerts, setAlerts] = useState<EhsAlertResponse[]>([])

  useEffect(() => {
    axiosInstance.get<ApiResponse<PageResponse<EhsAlertResponse>>>('/alerts', {
      params: { page: 0, size: 6, sort: 'createdAt,desc' },
    }).then(res => {
      setAlerts(res.data.data.content)
    }).catch(() => {})
  }, [i18n.language])

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: 380, borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 2.5, px: 3, pb: 1.5 }}>
        <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>{t('generalDashboard.ehsAlert')}</Typography>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {alerts.map((alert, idx) => (
          <Box
            key={alert.id}
            onClick={() => navigate(`/ehs/communication?tab=4&alertId=${alert.id}`)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2,
              borderBottom: idx < alerts.length - 1 ? `1px solid ${borderColor}` : 'none',
              cursor: 'pointer',
              '&:hover': { backgroundColor: hoverBg },
              transition: 'background-color 0.15s',
            }}
          >
            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {alert.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              {format(new Date(alert.createdAt), 'yyyy.MM.dd')}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

// EHS Plan 컴포넌트 (미니 캘린더 + 실제 API 연동)
const EhsPlanDashboard = () => {
  const { t, i18n } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const navigate = useNavigate()
  const borderColor = isDarkMode ? '#27272a' : '#e5e7eb'
  const hoverBg = isDarkMode ? '#1a1a2e' : '#f9fafb'
  const todayBg = isDarkMode ? '#1e3a5f' : '#dbeafe'

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(startOfDay(new Date()))
  const [plans, setPlans] = useState<EhsPlanType[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  const getDateFnsLocale = () => {
    if (i18n.language === 'zh') return zhCN
    if (i18n.language === 'en') return enUS
    return ko
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = useMemo(() => {
    const lang = i18n.language
    if (lang === 'en') return ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    if (lang === 'zh') return ['日', '一', '二', '三', '四', '五', '六']
    return ['일', '월', '화', '수', '목', '금', '토']
  }, [i18n.language])

  useEffect(() => {
    const startDateStr = format(calendarStart, 'yyyy-MM-dd')
    const endDateStr = format(calendarEnd, 'yyyy-MM-dd')
    axiosInstance.get<ApiResponse<EhsPlanType[]>>('/plans/date-range', {
      params: { startDate: startDateStr, endDate: endDateStr },
    }).then(res => {
      setPlans(res.data.data)
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, i18n.language])

  const toggleCheck = (id: number) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleEmailSend = (users: UserInfo[]) => {
    const checkedPlans = selectedPlans.filter(p => checkedIds.has(p.id))
    const recipientEmails = users.map(u => u.email).join(',')
    const subject = `[EHS Plan] ${format(currentMonth, 'yyyy.MM')}`
    const body = checkedPlans.length > 0
      ? checkedPlans.map(p => `- ${p.title}`).join('\n')
      : selectedPlans.map(p => `- ${p.title}`).join('\n')
    window.location.href = `mailto:${recipientEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const getPlansForDate = (date: Date) => {
    return plans.filter((plan) => {
      const planStart = plan.planDate ? parseISO(plan.planDate) : null
      const planEnd = plan.planEndDate ? parseISO(plan.planEndDate) : planStart
      if (!planStart) return false
      return date >= planStart && date <= (planEnd || planStart)
    })
  }

  const selectedPlans = selectedDate ? getPlansForDate(selectedDate) : []
  const today = new Date()

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: 380, borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, px: 3, pb: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>{t('generalDashboard.ehsPlan')}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeftIcon fontSize="small" /></IconButton>
          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 80, textAlign: 'center' }}>
            {format(currentMonth, 'yyyy/MM')}
          </Typography>
          <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRightIcon fontSize="small" /></IconButton>
        </Box>
      </Box>

      {/* Mini Calendar Grid */}
      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
          {weekDays.map((d, i) => (
            <Typography key={i} variant="caption" sx={{ textAlign: 'center', fontWeight: 600, color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : 'text.secondary', py: 0.3 }}>
              {d}
            </Typography>
          ))}
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, today)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const dayPlans = getPlansForDate(day)
            const hasPlan = dayPlans.length > 0
            const dayOfWeek = day.getDay()

            return (
              <Box
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                sx={{
                  textAlign: 'center',
                  py: 0.2,
                  cursor: 'pointer',
                  borderRadius: 1,
                  position: 'relative',
                  backgroundColor: isSelected ? (isDarkMode ? '#1e40af' : '#bfdbfe') : isToday ? todayBg : 'transparent',
                  '&:hover': { backgroundColor: isSelected ? undefined : hoverBg },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: isToday ? 700 : 400,
                    color: !isCurrentMonth ? 'text.disabled' : dayOfWeek === 0 ? '#EF4444' : dayOfWeek === 6 ? '#3B82F6' : 'text.primary',
                  }}
                >
                  {format(day, 'd')}
                </Typography>
                {hasPlan && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: '2px', mt: '-1px', mb: '1px' }}>
                    {dayPlans.slice(0, 3).map((_, idx) => (
                      <Box key={idx} sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: PLAN_DOT_COLORS[idx % PLAN_DOT_COLORS.length] }} />
                    ))}
                  </Box>
                )}
                {!hasPlan && <Box sx={{ height: 5 }} />}
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Selected Date Plans */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1, mt: 0.5, borderTop: `1px solid ${borderColor}` }}>
        {selectedDate && (
          <Typography variant="caption" fontWeight={600} sx={{ px: 1.5, pt: 0.5, display: 'block', color: 'text.secondary' }}>
            {format(selectedDate, 'MM/dd (EEE)', { locale: getDateFnsLocale() })}
          </Typography>
        )}
        {selectedPlans.length === 0 ? (
          <Typography variant="caption" color="text.disabled" sx={{ px: 1.5, py: 1, display: 'block' }}>
            {t('ehsPlan.noPlans')}
          </Typography>
        ) : (
          selectedPlans.map((plan, idx) => {
            const isChecked = checkedIds.has(plan.id)
            return (
              <Box
                key={plan.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.7,
                  cursor: 'pointer',
                  borderBottom: idx < selectedPlans.length - 1 ? `1px solid ${borderColor}` : 'none',
                  '&:hover': { backgroundColor: hoverBg },
                  transition: 'background-color 0.15s',
                }}
              >
                <Box
                  onClick={(e) => { e.stopPropagation(); toggleCheck(plan.id) }}
                  sx={{
                    width: 16, height: 16, borderRadius: 0.5, flexShrink: 0,
                    border: `1.5px solid ${isChecked ? '#2563eb' : borderColor}`,
                    bgcolor: isChecked ? '#2563eb' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {isChecked && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Box>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: PLAN_DOT_COLORS[idx % PLAN_DOT_COLORS.length] }} />
                <MuiTooltip title={plan.title} placement="top">
                  <Typography
                    variant="caption"
                    onClick={() => navigate('/ehs?tab=1')}
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, cursor: 'pointer' }}
                  >
                    {plan.title}
                  </Typography>
                </MuiTooltip>
              </Box>
            )
          })
        )}
      </Box>

      {/* Email Share Button */}
      <Box sx={{ px: 3, pb: 1.5, pt: 0.5, textAlign: 'right' }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => setEmailModalOpen(true)}
          disabled={checkedIds.size === 0}
          sx={{ textTransform: 'none', fontSize: '0.75rem', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#616161' } }}
        >
          {t('generalDashboard.shareViaEmail')}
        </Button>
      </Box>

      {/* Recipient Select Modal */}
      <UserSelectModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        selectedUsers={[]}
        onConfirm={handleEmailSend}
        useCompanyTree
        emailSuffix="@hankook.com"
        confirmLabel={t('generalDashboard.send')}
        showFooterRecipients
      />
    </Paper>
  )
}

const GeneralDashboard: React.FC = () => {
  const { t } = useTranslation()
  const radialCards = useRadialCards()

  return (
    <Box sx={{ p: 0, position: 'relative' }}>
      {/* 날씨/온도 위젯 — 지도형 대시보드와 동일하게 플로팅(우측 하단 고정) */}
      <Box
        sx={{
          position: 'fixed',
          right: { xs: 8, md: 24 },
          bottom: { xs: 16, md: 32 },
          zIndex: 1200,
        }}
      >
        <WeatherWidget isMobile={false} />
      </Box>

      {/* EHS 예산 개요 - 분기별 집행 현황 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
          {t('generalDashboard.budgetExecution', '예산 및 집행')}
        </Typography>
        <EhsBudgetOverview showYearSelector={false} showCategoryStats={false} />
      </Box>

      {/* 목표 추진 현황 표 (팀별 위험성평가 상단) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
          {t('generalDashboard.safetyGoal', '안전 목표')}
        </Typography>
        <GoalProgressTable />
      </Box>

      {/* 팀별 위험성평가 + 지역별 안전 체크율 (4월 현황 상단) */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
        <Box sx={{ flex: { xs: '1 1 auto', md: '1 1 0' }, width: '100%', minWidth: 0 }}><TeamRiskAssessmentChart /></Box>
        <Box sx={{ flex: { xs: '1 1 auto', md: '1 1 0' }, width: '100%', minWidth: 0 }}><RegionSafetyCheckChart /></Box>
      </Box>

      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {t('generalDashboard.currentMonthStatus', { month: new Date().getMonth() + 1 })}
      </Typography>

      {/* Radial Chart - Text 상단 4개 */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        {radialCards.map((card, idx) => (
          <Box key={idx} sx={{ flex: '1 1 0', minWidth: 220 }}>
            <RadialTextCard {...card} />
          </Box>
        ))}
      </Box>

      {/* 두번째줄: Area Stacked + Pie Label List + Bar Mixed */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '2 1 0', minWidth: { xs: 'auto', md: 400 } }}><AreaStacked /></Box>
        <Box sx={{ flex: '1 1 0', minWidth: 250 }}><PieLabelList /></Box>
        <Box sx={{ flex: '1.5 1 0', minWidth: 300 }}><BarMixed /></Box>
      </Box>

      {/* 세번째줄: EHS Message + EHS Alert + EHS Plan */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 0', minWidth: 280 }}><EhsMessage /></Box>
        <Box sx={{ flex: '1 1 0', minWidth: 280 }}><EhsAlert /></Box>
        <Box sx={{ flex: '1 1 0', minWidth: 280 }}><EhsPlanDashboard /></Box>
      </Box>
    </Box>
  )
}

export default GeneralDashboard
