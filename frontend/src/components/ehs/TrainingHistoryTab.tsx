import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Typography, Paper, Grid, TextField, Select, MenuItem, FormControl,
  Chip, CircularProgress, Alert, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useTranslation } from 'react-i18next'
import { trainingApplicationApi, trainingCourseApi } from '../../api/trainingApi'
import { TrainingApplication } from '../../types/trainingApplication.types'
import { TrainingCourse } from '../../types/trainingCourse.types'
import useCodeMap from '../../hooks/useCodeMap'
import { useAuth } from '../../context/AuthContext'

const TrainingHistoryTab: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { getLabel: getCategoryLabel } = useCodeMap('TRAINING_CATEGORY')

  const [yearFilter, setYearFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [searchText, setSearchText] = useState('')

  // 본인이 들었던 모든 교육 (수료 완료) — username 으로 본인 데이터만 조회
  const { data: histData, isLoading } = useQuery({
    queryKey: ['trainingHistory', user?.username],
    queryFn: () => trainingApplicationApi.list({ status: 'COMPLETED', username: user?.username, size: 500 }),
    enabled: !!user?.username,
  })
  const histAll: TrainingApplication[] = histData?.content || []

  const { data: courseData } = useQuery({
    queryKey: ['trainingCourseListForHistory'],
    queryFn: () => trainingCourseApi.list({ size: 200 }),
  })
  const courses: TrainingCourse[] = courseData?.content || []
  const courseMap = useMemo(() => {
    const m = new Map<number, TrainingCourse>()
    courses.forEach(c => m.set(c.id, c))
    return m
  }, [courses])

  const items = useMemo(() => {
    const q = searchText.toLowerCase()
    return histAll.filter(h => {
      const c = courseMap.get(h.courseId)
      if (yearFilter && (!h.completionDate || !h.completionDate.startsWith(yearFilter))) return false
      if (catFilter && c?.category !== catFilter) return false
      if (q && !h.courseName.toLowerCase().includes(q)) return false
      return true
    })
  }, [histAll, courseMap, yearFilter, catFilter, searchText])

  const thisYear = new Date().getFullYear().toString()
  const stats = useMemo(() => {
    const totalThisYear = histAll.filter(h => h.completionDate?.startsWith(thisYear))
    const totalHours = totalThisYear.reduce((s, h) => {
      const c = courseMap.get(h.courseId)
      return s + (c?.durationHours ? Number(c.durationHours) : 0)
    }, 0)
    const legalDone = totalThisYear.filter(h => courseMap.get(h.courseId)?.legalRequired).length
    const legalRequired = courses.filter(c => c.legalRequired).length || 1
    const legalRate = Math.round((legalDone / legalRequired) * 100)
    const expSoon = histAll.filter(h => {
      const c = courseMap.get(h.courseId)
      if (!c?.cycle || !h.completionDate) return false
      // 단순 휴리스틱: ANNUAL = 1년, SEMI_ANNUAL = 6개월
      const days = c.cycle === 'ANNUAL' ? 365 : c.cycle === 'SEMI_ANNUAL' ? 180 : c.cycle === 'QUARTERLY' ? 90 : 0
      if (!days) return false
      const completed = new Date(h.completionDate)
      const expires = new Date(completed.getTime() + days * 24 * 3600 * 1000)
      const now = new Date()
      const diff = (expires.getTime() - now.getTime()) / (24 * 3600 * 1000)
      return diff > 0 && diff <= 30
    }).length
    return { total: histAll.length, hours: totalHours, legalRate, expSoon }
  }, [histAll, courseMap, courses, thisYear])

  return (
    <Box>
      {/* KPI */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: t('training.histTotal', '총 이수 교육'), value: `${stats.total}${t('common.cntSuffix', '건')}`, color: '#10b981' },
          { label: t('training.histHours', '이수 시간 (올해)'), value: `${stats.hours}h`, color: '#3b82f6' },
          { label: t('training.histLegalRate', '법정 이수율'), value: `${stats.legalRate}%`, color: '#8b5cf6' },
          { label: t('training.histExpire', '만료 임박 (30일)'), value: `${stats.expSoon}${t('common.cntSuffix', '건')}`, color: '#f59e0b' },
        ].map((c, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={{ p: 2, borderLeft: 4, borderColor: c.color }}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{c.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('training.searchHistPh', '교육과정명 검색')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <Select displayEmpty value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <MenuItem value="">{t('common.allYears', '전체 연도')}</MenuItem>
            {[Number(thisYear), Number(thisYear) - 1, Number(thisYear) - 2].map(y => (
              <MenuItem key={y} value={String(y)}>{y}{t('common.year', '년')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select displayEmpty value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <MenuItem value="">{t('common.allCategory', '전체 유형')}</MenuItem>
            <MenuItem value="LEGAL_GENERAL">{getCategoryLabel('LEGAL_GENERAL')}</MenuItem>
            <MenuItem value="LEGAL_SPECIAL">{getCategoryLabel('LEGAL_SPECIAL')}</MenuItem>
            <MenuItem value="MANAGER">{getCategoryLabel('MANAGER')}</MenuItem>
            <MenuItem value="NEW_HIRE">{getCategoryLabel('NEW_HIRE')}</MenuItem>
            <MenuItem value="OTHER">{getCategoryLabel('OTHER')}</MenuItem>
          </Select>
        </FormControl>
        <IconButton size="small" onClick={() => { setSearchText(''); setYearFilter(''); setCatFilter('') }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* History list (table) */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info">{t('training.noHistory', '교육 이수 이력이 없습니다')}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 60 }}>{t('common.no', 'No')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('training.courseName', '교육과정')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>{t('training.category', '분류')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>{t('common.name', '성명')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 140 }}>{t('common.department', '부서')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>{t('training.hours', '시간')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>{t('training.completionDate', '수료일')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 200 }}>{t('training.lawBasis', '근거 법령')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((h, idx) => {
                const c = courseMap.get(h.courseId)
                return (
                  <TableRow key={h.id} hover>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{h.courseName}</TableCell>
                    <TableCell align="center">
                      {c?.category
                        ? <Chip size="small" label={getCategoryLabel(c.category)} variant="outlined" />
                        : ''}
                    </TableCell>
                    <TableCell align="center">{h.applicantName}</TableCell>
                    <TableCell align="center">{h.applicantDept || ''}</TableCell>
                    <TableCell align="center">{c?.durationHours ?? 0}h</TableCell>
                    <TableCell align="center">{h.completionDate || ''}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{c?.lawBasis || ''}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default TrainingHistoryTab
