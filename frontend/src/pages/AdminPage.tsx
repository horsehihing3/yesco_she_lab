import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  Pagination,
  IconButton,
  Card,
  CardContent,
  Grid,
  Divider,
  useTheme,
} from '@mui/material'
import ListSearchBar from '../components/common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import AssignmentIcon from '@mui/icons-material/Assignment'
import WarningIcon from '@mui/icons-material/Warning'
import MessageIcon from '@mui/icons-material/Message'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import axiosInstance from '../api/axiosInstance'
import { User } from '../types/user.types'
import { ApiResponse, PageResponse } from '../types/common.types'
import { DashboardStatistics } from '../types/dashboard.types'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

// 간단한 도넛 차트 컴포넌트
interface DonutChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  title?: string
  unit?: string
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size = 150, title, unit = '' }) => {
  const theme = useTheme()
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0

  const createArc = (startAngle: number, endAngle: number, color: string) => {
    const radius = size / 2 - 10
    const innerRadius = radius * 0.6
    const centerX = size / 2
    const centerY = size / 2

    const startRadians = ((startAngle - 90) * Math.PI) / 180
    const endRadians = ((endAngle - 90) * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startRadians)
    const y1 = centerY + radius * Math.sin(startRadians)
    const x2 = centerX + radius * Math.cos(endRadians)
    const y2 = centerY + radius * Math.sin(endRadians)

    const x3 = centerX + innerRadius * Math.cos(endRadians)
    const y3 = centerY + innerRadius * Math.sin(endRadians)
    const x4 = centerX + innerRadius * Math.cos(startRadians)
    const y4 = centerY + innerRadius * Math.sin(startRadians)

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && (
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <svg width={size} height={size}>
        {data.map((item, index) => {
          if (item.value === 0) return null
          const angle = (item.value / total) * 360
          const path = createArc(currentAngle, currentAngle + angle, item.color)
          const result = <path key={index} d={path} fill={item.color} />
          currentAngle += angle
          return result
        })}
        <text x={size / 2} y={size / 2 - 5} textAnchor="middle" fontSize="20" fontWeight="bold" fill={theme.palette.text.primary}>
          {total}
        </text>
        <text x={size / 2} y={size / 2 + 15} textAnchor="middle" fontSize="12" fill={theme.palette.text.secondary}>
          {unit}
        </text>
      </svg>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 1 }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
            <Typography variant="caption">
              {item.label}: {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const fetchUsers = async (page: number, size: number): Promise<PageResponse<User>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<User>>>('/users/paged', {
    params: { page, size, sort: 'name,asc' },
  })
  return response.data.data
}

const fetchStatistics = async (): Promise<DashboardStatistics> => {
  const response = await axiosInstance.get<ApiResponse<DashboardStatistics>>('/dashboard/statistics')
  return response.data.data
}

// 연도/분기 옵션 (동적)
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const quarterKeys = ['all', 'q1', 'q2', 'q3', 'q4'] as const

const AdminPage: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [tabValue, setTabValue] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const applySearch = () => setSearchText(searchInput)
  const [page, setPage] = useState(0)
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedQuarter, setSelectedQuarter] = useState('all')
  const rowsPerPage = 10

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['adminUsers', page],
    queryFn: () => fetchUsers(page, rowsPerPage),
    enabled: tabValue === 0,
  })

  const { data: statistics } = useQuery({
    queryKey: ['adminStatistics'],
    queryFn: fetchStatistics,
  })

  // 차트 데이터 생성
  const safetyWorkChartData = useMemo(() => {
    const sw = statistics?.safetyWork
    if (!sw) return [
      { label: t('admin.chartLabels.approved'), value: 0, color: '#4caf50' },
      { label: t('admin.chartLabels.inProgress'), value: 0, color: '#2196f3' },
      { label: t('admin.chartLabels.pending'), value: 0, color: '#ff9800' },
      { label: t('admin.chartLabels.rejected'), value: 0, color: '#f44336' },
    ]
    return [
      { label: t('admin.chartLabels.approved'), value: sw.completed, color: '#4caf50' },
      { label: t('admin.chartLabels.inProgress'), value: sw.approved, color: '#2196f3' },
      { label: t('admin.chartLabels.pending'), value: sw.draft + sw.review + sw.reviewCompleted, color: '#ff9800' },
      { label: t('admin.chartLabels.rejected'), value: sw.rejected, color: '#f44336' },
    ]
  }, [statistics?.safetyWork, t])

  const nearMissChartData = useMemo(() => {
    const nm = statistics?.nearMiss
    if (!nm) return [
      { label: t('admin.chartLabels.completed'), value: 0, color: '#4caf50' },
      { label: t('admin.chartLabels.processing'), value: 0, color: '#2196f3' },
      { label: t('admin.chartLabels.pending'), value: 0, color: '#ff9800' },
      { label: t('admin.chartLabels.rejected'), value: 0, color: '#f44336' },
    ]
    return [
      { label: t('admin.chartLabels.completed'), value: nm.completed, color: '#4caf50' },
      { label: t('admin.chartLabels.processing'), value: nm.inProgress, color: '#2196f3' },
      { label: t('admin.chartLabels.pending'), value: nm.pending + nm.approvalRequest, color: '#ff9800' },
      { label: t('admin.chartLabels.rejected'), value: nm.rejected, color: '#f44336' },
    ]
  }, [statistics?.nearMiss, t])

  const riskAssessmentChartData = useMemo(() => {
    const ra = statistics?.riskAssessment
    if (!ra) return [
      { label: t('common.approve'), value: 0, color: '#4caf50' },
      { label: t('admin.chartLabels.submitted'), value: 0, color: '#2196f3' },
      { label: t('admin.chartLabels.writing'), value: 0, color: '#ff9800' },
      { label: t('admin.chartLabels.rejected'), value: 0, color: '#f44336' },
    ]
    return [
      { label: t('common.approve'), value: ra.approved, color: '#4caf50' },
      { label: t('admin.chartLabels.submitted'), value: ra.submitted + ra.approvalRequest, color: '#2196f3' },
      { label: t('admin.chartLabels.writing'), value: ra.draft, color: '#ff9800' },
      { label: t('admin.chartLabels.rejected'), value: ra.rejected, color: '#f44336' },
    ]
  }, [statistics?.riskAssessment, t])

  // EHS Message는 별도 API가 필요하므로 임시로 총 건수 기반 생성
  const ehsMessageData = useMemo(() => {
    // TODO: 실제 열람 통계 API 연동 시 교체
    const total = 100 // 기본값
    return [
      { label: t('admin.chartLabels.viewed'), value: Math.round(total * 0.75), color: '#4caf50' },
      { label: t('admin.chartLabels.notViewed'), value: Math.round(total * 0.25), color: '#9e9e9e' },
    ]
  }, [t])

  const handleReset = () => {
    setSearchInput(''); setSearchText('')
    setPage(0)
  }

  const users = usersData?.content || []
  const filteredUsers = searchText
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          u.department?.toLowerCase().includes(searchText.toLowerCase())
      )
    : users
  const totalPages = usersData?.totalPages || 0

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {t('admin.title')}
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('admin.allUsers')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {usersData?.totalElements || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('safetyWork.title')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {statistics?.safetyWork?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('nearMiss.title')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {statistics?.nearMiss?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('riskAssessment.title')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {statistics?.riskAssessment?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Box>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label={t('admin.userManagement')} />
            <Tab label={t('admin.ehsStatus')} />
            <Tab label={t('admin.systemInfo')} />
          </Tabs>
        </Box>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <ListSearchBar
              placeholder={t('admin.searchPlaceholder')}
              value={searchInput}
              onChange={setSearchInput}
              onSearch={applySearch}
              sx={{ width: 300 }}
            />
            <IconButton onClick={handleReset} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>

          {usersLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : usersError ? (
            <Alert severity="error">{t('admin.loadUsersFailed')}</Alert>
          ) : (
            <>
              {/* PC Table */}
              <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }}>{t('common.name')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }}>{t('emergency.email')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }}>{t('emergency.department')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }}>{t('emergency.position')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">
                        {t('common.status')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">{t('admin.noUsers')}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{user.name}</TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{user.email}</TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{user.department || ''}</TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{user.position || ''}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={user.active ? t('common.active') : t('common.inactive')}
                              color={user.active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile Cards */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
                {filteredUsers.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">{t('admin.noUsers')}</Typography>
                  </Paper>
                ) : (
                  filteredUsers.map((user) => (
                    <Paper key={user.id} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        <Typography fontWeight="bold" color="primary" sx={{ flex: 1 }}>{user.name}</Typography>
                        <Chip
                          label={user.active ? t('common.active') : t('common.inactive')}
                          color={user.active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{user.email}</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('emergency.department')}</Typography>
                          <Typography variant="body2">{user.department || ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('emergency.position')}</Typography>
                          <Typography variant="body2">{user.position || ''}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))
                )}
              </Box>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, newPage) => setPage(newPage - 1)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </TabPanel>

        {/* EHS Status Tab - Charts */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">{t('admin.ehsStatistics')}</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={selectedYear}
                  onChange={(e: SelectChangeEvent<number>) => setSelectedYear(e.target.value as number)}
                 displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}{t('admin.year')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={selectedQuarter}
                  onChange={(e: SelectChangeEvent) => setSelectedQuarter(e.target.value)}
                 displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {quarterKeys.map((q) => (
                    <MenuItem key={q} value={q}>
                      {t(`admin.quarters.${q}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={4}>
            {/* Leadership Message 현황 */}
            <Grid item xs={12} md={6} lg={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MessageIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      {t('ehsMessage.title')}
                    </Typography>
                  </Box>
                  <DonutChart data={ehsMessageData} title={t('admin.viewStatus')} unit={t('common.cases')} />
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('admin.viewRate')}{' '}
                      <Typography component="span" fontWeight="bold" color="primary.main">
                        {Math.round(
                          (ehsMessageData[0].value /
                            ehsMessageData.reduce((s, d) => s + d.value, 0)) *
                            100
                        )}
                        %
                      </Typography>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 아차사고 현황 */}
            <Grid item xs={12} md={6} lg={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon sx={{ color: 'warning.main', mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      {t('nearMiss.title')}
                    </Typography>
                  </Box>
                  <DonutChart data={nearMissChartData} title={t('admin.processStatus')} unit={t('common.cases')} />
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('admin.completionRate')}{' '}
                      <Typography component="span" fontWeight="bold" color="success.main">
                        {Math.round(
                          (nearMissChartData[0].value / nearMissChartData.reduce((s, d) => s + d.value, 0)) *
                            100
                        )}
                        %
                      </Typography>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 위험성평가 현황 */}
            <Grid item xs={12} md={6} lg={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ color: 'error.main', mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      {t('riskAssessment.title')}
                    </Typography>
                  </Box>
                  <DonutChart data={riskAssessmentChartData} title={t('admin.riskDistribution')} unit={t('common.cases')} />
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('admin.highRiskRate')}{' '}
                      <Typography component="span" fontWeight="bold" color="error.main">
                        {Math.round(
                          (riskAssessmentChartData[2].value /
                            riskAssessmentChartData.reduce((s, d) => s + d.value, 0)) *
                            100
                        )}
                        %
                      </Typography>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 안전작업 현황 */}
            <Grid item xs={12} md={6} lg={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AssignmentIcon sx={{ color: 'info.main', mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      {t('safetyWork.title')}
                    </Typography>
                  </Box>
                  <DonutChart data={safetyWorkChartData} title={t('admin.approvalStatus')} unit={t('common.cases')} />
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('admin.approvalRate')}{' '}
                      <Typography component="span" fontWeight="bold" color="success.main">
                        {Math.round(
                          (safetyWorkChartData[0].value / safetyWorkChartData.reduce((s, d) => s + d.value, 0)) *
                            100
                        )}
                        %
                      </Typography>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 상세 통계 테이블 */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            {t('admin.monthlyStatus')}
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }}>{t('admin.division')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }} align="center">
                    {t('admin.months.jan')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }} align="center">
                    {t('admin.months.feb')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }} align="center">
                    {t('admin.months.mar')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }} align="center">
                    {t('admin.months.apr')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }} align="center">
                    {t('admin.months.may')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }} align="center">
                    {t('admin.months.jun')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    {t('admin.total')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{t('nearMiss.title')}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>12</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>15</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>8</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>14</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>18</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>13</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    80
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{t('riskAssessment.title')}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>5</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>8</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>12</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>6</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>10</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>9</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    50
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{t('safetyWork.title')}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>22</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>28</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>18</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>25</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>32</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>27</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    152
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* System Info Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('admin.safetyWorkStatus')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('common.all')}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {statistics?.safetyWork?.total || 0}{t('common.cases')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('admin.nearMissStatus')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('common.all')}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {statistics?.nearMiss?.total || 0}{t('common.cases')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('admin.riskAssessmentStatus')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('common.all')}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {statistics?.riskAssessment?.total || 0}{t('common.cases')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('admin.systemInfo')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('admin.version')}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        1.0.0
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('admin.environment')}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        Production
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default AdminPage
