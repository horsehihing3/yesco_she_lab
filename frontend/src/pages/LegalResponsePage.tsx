import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, useIsFetching } from '@tanstack/react-query'
import {
  Box, Paper, Typography, Button, TextField, IconButton, Tabs, Tab, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Select, MenuItem, FormControl, Link as MuiLink, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SyncIcon from '@mui/icons-material/Sync'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../contexts/AlertContext'
import { legalResponseApi } from '../api/legalResponseApi'
import { LegalSearchItem, LegalRegistry, LegalRevisionLog } from '../types/legalResponse.types'
import StatCard from '../components/legalCompliance/StatCard'
import LoadingOverlay from '../components/common/LoadingOverlay'
import ListSearchBar from '../components/common/ListSearchBar'
import AuditPlanTab from '../components/ehs/AuditPlanTab'
import AuditExecutionTab from '../components/ehs/AuditExecutionTab'
import FlowChartButton from '../components/common/FlowChartButton'

const CATEGORIES = ['안전', '보건', '환경', '화학물질', '소방']

const dividerColor = (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : theme.palette.divider
const headerSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const STATUS_CHIP: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' }> = {
  PENDING:    { label: '검토대기', color: 'warning' },
  IN_REVIEW:  { label: '검토중',   color: 'info' },
  DONE:       { label: '완료',     color: 'success' },
  NEED_ACTION:{ label: '조치필요', color: 'error' },
  NO_IMPACT:  { label: '영향없음', color: 'default' },
}

const IMPACT_CHIP: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' }> = {
  HIGH: { label: '높음', color: 'error' },
  MID:  { label: '중간', color: 'warning' },
  LOW:  { label: '낮음', color: 'success' },
}

const LegalResponsePage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [tab, setTab] = useState(0)

  // ===== KPI =====
  const { data: kpi } = useQuery({
    queryKey: ['legalKpi'],
    queryFn: () => legalResponseApi.getKpi(),
  })

  // ===== Tab 0: 외부 검색 =====
  const SEARCH_PAGE_SIZE = 30
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchPage, setSearchPage] = useState(1)
  // 검색어 변경 시 1페이지로
  useEffect(() => { setSearchPage(1) }, [searchKeyword])
  const { data: searchData, isFetching: searchFetching } = useQuery({
    queryKey: ['legalExternalSearch', searchKeyword, searchPage],
    queryFn: () => legalResponseApi.searchExternal(searchKeyword, searchPage, SEARCH_PAGE_SIZE),
    enabled: !!searchKeyword,
  })
  const searchTotalPages = searchData ? Math.max(1, Math.ceil(searchData.totalCount / SEARCH_PAGE_SIZE)) : 1

  // ===== Tab 1: 등록 법령 =====
  const [regCategory, setRegCategory] = useState('')
  const [regKeywordInput, setRegKeywordInput] = useState('')
  const [regKeyword, setRegKeyword] = useState('')
  const applyRegSearch = () => { setRegKeyword(regKeywordInput); setRegPage(1) }
  const { data: registry = [], isFetching: regFetching } = useQuery({
    queryKey: ['legalRegistry', regCategory, regKeyword],
    queryFn: () => legalResponseApi.listRegistry(regCategory || undefined, regKeyword || undefined),
  })

  // 등록 법령 클라이언트 사이드 페이징
  const REG_PAGE_SIZE = 20
  const [regPage, setRegPage] = useState(1)
  useEffect(() => { setRegPage(1) }, [regCategory, regKeyword])
  const regTotalPages = Math.max(1, Math.ceil(registry.length / REG_PAGE_SIZE))
  const regPaged = registry.slice((regPage - 1) * REG_PAGE_SIZE, regPage * REG_PAGE_SIZE)

  const createMut = useMutation({
    mutationFn: (r: LegalRegistry) => legalResponseApi.createRegistry(r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalRegistry'] })
      qc.invalidateQueries({ queryKey: ['legalRegistryAll'] })
      qc.invalidateQueries({ queryKey: ['legalKpi'] })
      showSuccess('등록되었습니다.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || '등록에 실패했습니다.'
      showError(msg)
    },
  })

  // 이미 등록된 법령 ID 셋 — 검색 결과에서 [등록] 버튼 비활성화용
  const { data: allRegistry = [] } = useQuery({
    queryKey: ['legalRegistryAll'],
    queryFn: () => legalResponseApi.listRegistry(),
  })
  const registeredLawIds = new Set(allRegistry.map(r => r.lawId).filter(Boolean) as string[])

  // 등록 법령별 미완료 개정 카운트
  const { data: regRevCounts = {} } = useQuery({
    queryKey: ['legalRegistryRevCounts'],
    queryFn: () => legalResponseApi.registryRevisionCounts(),
  })

  // 등록 법령 일괄 개정 확인
  const checkRegMut = useMutation({
    mutationFn: () => legalResponseApi.checkRegistryRevisions(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['legalRegistryRevCounts'] })
      qc.invalidateQueries({ queryKey: ['legalRevisions'] })
      qc.invalidateQueries({ queryKey: ['legalKpi'] })
      const msg = data.inserted > 0
        ? `${data.checked}건 확인 — 신규 개정 ${data.inserted}건 등록 (개정 모니터링 탭 확인)`
        : `${data.checked}건 확인 — 신규 개정 없음`
      showSuccess(msg)
    },
    onError: () => showError('개정 확인에 실패했습니다.'),
  })

  const deleteRegMut = useMutation({
    mutationFn: (id: number) => legalResponseApi.deleteRegistry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalRegistry'] })
      qc.invalidateQueries({ queryKey: ['legalRegistryAll'] })
      qc.invalidateQueries({ queryKey: ['legalKpi'] })
      showSuccess('삭제되었습니다.')
    },
  })

  // 등록 법령 부분 수정 (분야 변경 등) — useMutation 으로 로딩 상태 표시
  const updateRegMut = useMutation({
    mutationFn: ({ id, r }: { id: number; r: LegalRegistry }) => legalResponseApi.updateRegistry(id, r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalRegistry'] })
      qc.invalidateQueries({ queryKey: ['legalRegistryAll'] })
      showSuccess('수정되었습니다.')
    },
    onError: () => showError('수정에 실패했습니다.'),
  })

  const handleRegisterFromSearch = (item: LegalSearchItem) => {
    createMut.mutate({
      lawId: item.lawId,
      lawName: item.lawName,
      lawType: item.lawType,
      competentOrg: item.competentOrg,
      promulgationNo: item.promulgationNo,
      promulgationDt: item.promulgationDt,
      enforceDt: item.enforceDt,
      status: 'ACTIVE',
      detailLink: item.detailLink,
    })
  }

  const handleDeleteRegistry = async (id: number) => {
    if (await showConfirm('이 법령을 등록 목록에서 삭제하시겠습니까?')) {
      deleteRegMut.mutate(id)
    }
  }

  // ===== Tab 2: 개정 모니터링 =====
  const [revStatus, setRevStatus] = useState('')
  const [revKeywordInput, setRevKeywordInput] = useState('')
  const [revKeyword, setRevKeyword] = useState('')
  const applyRevSearch = () => { setRevKeyword(revKeywordInput); setRevPage(1) }
  const { data: revisions = [], isFetching: revFetching } = useQuery({
    queryKey: ['legalRevisions', revStatus, revKeyword],
    queryFn: () => legalResponseApi.listRevisions(revStatus || undefined, revKeyword || undefined),
  })

  // 클라이언트 사이드 페이징
  const REV_PAGE_SIZE = 20
  const [revPage, setRevPage] = useState(1)
  const revTotalPages = Math.max(1, Math.ceil(revisions.length / REV_PAGE_SIZE))
  // status/keyword 변경 시 1페이지로
  useEffect(() => { setRevPage(1) }, [revStatus, revKeyword])
  const revPaged = revisions.slice((revPage - 1) * REV_PAGE_SIZE, revPage * REV_PAGE_SIZE)

  // 필터 (개정 모니터링 화이트리스트)
  const { data: filter } = useQuery({
    queryKey: ['legalFilter'],
    queryFn: () => legalResponseApi.getFilter(),
  })
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [filterDraft, setFilterDraft] = useState('')
  const openFilterDialog = () => { setFilterDraft(filter?.allowedLaws || ''); setFilterDialogOpen(true) }
  const updateFilterMut = useMutation({
    mutationFn: (laws: string) => legalResponseApi.updateFilter(laws),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalFilter'] })
      qc.invalidateQueries({ queryKey: ['legalRevisions'] })
      qc.invalidateQueries({ queryKey: ['legalKpi'] })
      setFilterDialogOpen(false)
      showSuccess('필터가 저장되었습니다.')
    },
    onError: () => showError('필터 저장 실패'),
  })

  const [syncPages, setSyncPages] = useState(1) // 1=100건, 2=200건, 5=500건, 10=1000건
  const syncMut = useMutation({
    mutationFn: () => legalResponseApi.syncRecent(100, syncPages),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['legalRevisions'] })
      qc.invalidateQueries({ queryKey: ['legalKpi'] })
      showSuccess(`${data?.fetched ?? 0}건 조회 — 신규 ${data?.inserted ?? 0}건 등록`)
    },
    onError: () => showError('법제처 API 호출에 실패했습니다.'),
  })

  const updateRevMut = useMutation({
    mutationFn: ({ id, r }: { id: number; r: LegalRevisionLog }) => legalResponseApi.updateRevision(id, r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalRevisions'] })
      qc.invalidateQueries({ queryKey: ['legalKpi'] })
      showSuccess('수정되었습니다.')
    },
  })

  // 법규 대응 계획/실시 탭 — 목록/상세/체크리스트 등 관련 쿼리 fetch 감지
  const auditFetching = useIsFetching({
    predicate: (q) => {
      const k = q.queryKey?.[0] as string | undefined
      if (!k) return false
      return (
        k === 'safetyTemplate' || k === 'safetyTemplateDetail' ||  // 체크리스트 템플릿
        k === 'auditPlans' || k === 'auditPlanForExec' ||           // 계획 목록/상세
        k === 'auditExec' || k === 'auditExecStatus' ||             // 실시 목록
        k === 'auditExecFindings' || k === 'auditLogs'              // 실시 부가
      )
    },
  })
  const isLoading = searchFetching || regFetching || revFetching
    || syncMut.isPending || updateRegMut.isPending || checkRegMut.isPending
    || updateRevMut.isPending
    || createMut.isPending || deleteRegMut.isPending
    || ((tab === 3 || tab === 4) && auditFetching > 0)

  return (
    <Box sx={{ pb: 4 }}>
      <LoadingOverlay open={isLoading} message="로딩 중..." />

      {/* Tabs */}
      <Box sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: { xs: '0.78rem', md: '0.875rem' } } }}>
          <Tab label="법령 검색" />
          <Tab label="등록 법령 관리" />
          <Tab label="개정 모니터링" />
          <Tab label="법규 대응 계획" />
          <Tab label="법규 대응 실시" />
        </Tabs>
      </Box>

      {/* KPI */}
      <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={6} sm={4} md={2.4}><StatCard value={kpi?.totalLaws ?? 0} label="등록 법령" sub="총 관리 법령" /></Grid>
        <Grid item xs={6} sm={4} md={2.4}><StatCard value={kpi?.pending ?? 0} label="검토 대기" sub="신규 개정사항" /></Grid>
        <Grid item xs={6} sm={4} md={2.4}><StatCard value={kpi?.inReview ?? 0} label="검토 중" sub="진행 중" /></Grid>
        <Grid item xs={6} sm={6} md={2.4}><StatCard value={kpi?.done ?? 0} label="완료" sub="조치 완료" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard value={kpi?.needAction ?? 0} label="조치 필요" sub="사내 대응 필요" /></Grid>
      </Grid>

      {/* TAB 0: 법령 검색 */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
            <FlowChartButton flowKey="legalResponse" />
          </Box>
          {/* PC 검색 */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <ListSearchBar
              placeholder="법령명 검색 (예: 산업안전보건법)"
              value={searchInput}
              onChange={setSearchInput}
              onSearch={() => setSearchKeyword(searchInput)}
              sx={{ minWidth: 320 }}
            />
            <Typography variant="caption" color="text.secondary">
              법제처 국가법령정보센터 OpenAPI 실시간 조회 — 결과 행에서 [등록] 클릭 시 사내 관리 목록에 추가
            </Typography>
          </Box>
          {/* Mobile 검색 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
            <ListSearchBar fullWidth
              placeholder="법령명 검색 (예: 산업안전보건법)"
              value={searchInput}
              onChange={setSearchInput}
              onSearch={() => setSearchKeyword(searchInput)}
            />
          </Box>

          {/* PC 테이블 — 검색 후에만 표시 */}
          {searchKeyword && (
          <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small" sx={{
                '& .MuiTableCell-root': { borderRight: (theme: any) => `1px solid ${dividerColor(theme)}` },
                '& .MuiTableCell-root:last-child': { borderRight: 'none' },
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerSx}>법령명</TableCell>
                    <TableCell sx={headerSx} align="center" width={100}>유형</TableCell>
                    <TableCell sx={headerSx} align="center" width={140}>소관부처</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>공포일자</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>시행일자</TableCell>
                    <TableCell sx={headerSx} align="center" width={100}>구분</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(searchData?.items || []).length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                      검색 결과가 없습니다.
                    </TableCell></TableRow>
                  ) : (searchData?.items || []).map((it, i) => (
                    <TableRow key={`${it.lawId}-${i}`} hover>
                      <TableCell>
                        {it.detailLink ? (
                          <MuiLink href={it.detailLink} target="_blank" rel="noopener" underline="hover">
                            {it.lawName} <OpenInNewIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                          </MuiLink>
                        ) : it.lawName}
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{it.lawType || '-'}</TableCell>
                      <TableCell align="center">{it.competentOrg || '-'}</TableCell>
                      <TableCell align="center">{it.promulgationDt || '-'}</TableCell>
                      <TableCell align="center">{it.enforceDt || '-'}</TableCell>
                      <TableCell align="center">
                        {it.revisionType && <Chip label={it.revisionType} size="small" />}
                      </TableCell>
                      <TableCell align="center">
                        {it.lawId && registeredLawIds.has(it.lawId) ? (
                          <Chip label="등록됨" size="small" color="success" />
                        ) : (
                          <Button size="small" variant="outlined" startIcon={<AddIcon />}
                                  disabled={createMut.isPending}
                                  onClick={() => handleRegisterFromSearch(it)}>
                            등록
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          )}

          {/* Mobile 카드 — 검색 후에만 표시 */}
          {searchKeyword && (
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {(searchData?.items || []).length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>검색 결과가 없습니다.</Paper>
            ) : (searchData?.items || []).map((it, i) => (
              <Paper key={`${it.lawId}-${i}`} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {it.detailLink ? (
                      <MuiLink href={it.detailLink} target="_blank" rel="noopener" underline="hover" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                        {it.lawName} <OpenInNewIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                      </MuiLink>
                    ) : <Typography variant="body2" fontWeight="bold">{it.lawName}</Typography>}
                  </Box>
                  {it.lawId && registeredLawIds.has(it.lawId) ? (
                    <Chip label="등록됨" size="small" color="success" />
                  ) : (
                    <Button size="small" variant="outlined" startIcon={<AddIcon />}
                      disabled={createMut.isPending}
                      onClick={() => handleRegisterFromSearch(it)}>등록</Button>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                  {it.lawType && <Chip label={it.lawType} size="small" variant="outlined" />}
                  {it.revisionType && <Chip label={it.revisionType} size="small" />}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {it.competentOrg || ''} · 공포 {it.promulgationDt || '-'} · 시행 {it.enforceDt || '-'}
                </Typography>
              </Paper>
            ))}
          </Box>
          )}

          {searchData && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              전체 {searchData.totalCount?.toLocaleString() ?? 0}건 중 {((searchPage - 1) * SEARCH_PAGE_SIZE + 1).toLocaleString()}~{Math.min(searchPage * SEARCH_PAGE_SIZE, searchData.totalCount).toLocaleString()}건 표시
            </Typography>
          )}
          {searchTotalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination count={searchTotalPages} page={searchPage} onChange={(_, v) => setSearchPage(v)} color="primary" />
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1: 등록 법령 관리 */}
      {tab === 1 && (
        <Box>
          {/* PC 검색/필터 */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={regCategory} displayEmpty onChange={(e) => setRegCategory(e.target.value)}>
                <MenuItem value="">전체 분야</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <ListSearchBar
              placeholder="법령명/소관부처"
              value={regKeywordInput}
              onChange={setRegKeywordInput}
              onSearch={applyRegSearch}
              sx={{ minWidth: 280 }}
            />
            <IconButton onClick={() => { setRegKeywordInput(''); setRegKeyword(''); qc.invalidateQueries({ queryKey: ['legalRegistry'] }) }}><RefreshIcon /></IconButton>
            <Button variant="contained" startIcon={<SyncIcon />} sx={{ ml: 'auto' }}
              disabled={checkRegMut.isPending || registry.length === 0}
              onClick={() => checkRegMut.mutate()}>
              개정 확인
            </Button>
          </Box>
          {/* Mobile 검색/필터 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
            <FormControl size="small" fullWidth>
              <Select value={regCategory} displayEmpty onChange={(e) => setRegCategory(e.target.value)}>
                <MenuItem value="">전체 분야</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <ListSearchBar fullWidth
              placeholder="법령명/소관부처"
              value={regKeywordInput}
              onChange={setRegKeywordInput}
              onSearch={applyRegSearch}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />}
                onClick={() => { setRegKeywordInput(''); setRegKeyword(''); qc.invalidateQueries({ queryKey: ['legalRegistry'] }) }}
                sx={{ flex: 1 }}>초기화</Button>
              <Button variant="contained" size="small" startIcon={<SyncIcon />}
                disabled={checkRegMut.isPending || registry.length === 0}
                onClick={() => checkRegMut.mutate()}
                sx={{ flex: 1 }}>개정 확인</Button>
            </Box>
          </Box>

          {/* PC 테이블 */}
          <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small" sx={{
                '& .MuiTableCell-root': { borderRight: (theme: any) => `1px solid ${dividerColor(theme)}` },
                '& .MuiTableCell-root:last-child': { borderRight: 'none' },
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerSx}>법령명</TableCell>
                    <TableCell sx={headerSx} align="center" width={100}>유형</TableCell>
                    <TableCell sx={headerSx} align="center" width={110}>분야</TableCell>
                    <TableCell sx={headerSx} align="center" width={140}>소관부처</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>시행일자</TableCell>
                    <TableCell sx={headerSx} align="center" width={110}>개정 상태</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>등록일</TableCell>
                    <TableCell sx={headerSx} align="center" width={80}>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registry.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                      등록된 법령이 없습니다. [법령 검색] 탭에서 추가하세요.
                    </TableCell></TableRow>
                  ) : regPaged.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        {r.detailLink ? (
                          <MuiLink href={r.detailLink} target="_blank" rel="noopener" underline="hover">
                            {r.lawName} <OpenInNewIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                          </MuiLink>
                        ) : r.lawName}
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{r.lawType || '-'}</TableCell>
                      <TableCell align="center">
                        <CategorySelect value={r.category || ''}
                          onChange={(v) => updateRegMut.mutate({ id: r.id!, r: { ...r, category: v } })} />
                      </TableCell>
                      <TableCell align="center" sx={{ wordBreak: 'keep-all' }}>{r.competentOrg || '-'}</TableCell>
                      <TableCell align="center">{r.enforceDt || '-'}</TableCell>
                      <TableCell align="center">
                        {(() => {
                          const cnt = r.lawId ? (regRevCounts[r.lawId] || 0) : 0
                          if (cnt > 0) return (
                            <Chip label={`개정 ${cnt}건`} size="small" color="error"
                                  onClick={() => { setRevKeyword(''); setRevKeywordInput(r.lawName); setRevStatus(''); setTab(2); setRevKeyword(r.lawName) }}
                                  sx={{ cursor: 'pointer' }} />
                          )
                          return <Chip label="최신" size="small" color="success" variant="outlined" />
                        })()}
                      </TableCell>
                      <TableCell align="center">{r.createdAt?.substring(0, 10) || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleDeleteRegistry(r.id!)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Mobile 카드 */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {registry.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
                등록된 법령이 없습니다. [법령 검색] 탭에서 추가하세요.
              </Paper>
            ) : regPaged.map(r => {
              const cnt = r.lawId ? (regRevCounts[r.lawId] || 0) : 0
              return (
                <Paper key={r.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {r.detailLink ? (
                        <MuiLink href={r.detailLink} target="_blank" rel="noopener" underline="hover" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                          {r.lawName} <OpenInNewIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                        </MuiLink>
                      ) : <Typography variant="body2" fontWeight="bold">{r.lawName}</Typography>}
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleDeleteRegistry(r.id!)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
                    {r.lawType && <Chip label={r.lawType} size="small" variant="outlined" />}
                    {cnt > 0 ? (
                      <Chip label={`개정 ${cnt}건`} size="small" color="error"
                            onClick={() => { setRevKeywordInput(r.lawName); setRevStatus(''); setTab(2); setRevKeyword(r.lawName) }}
                            sx={{ cursor: 'pointer' }} />
                    ) : (
                      <Chip label="최신" size="small" color="success" variant="outlined" />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">분야:</Typography>
                    <CategorySelect value={r.category || ''}
                      onChange={(v) => updateRegMut.mutate({ id: r.id!, r: { ...r, category: v } })} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {r.competentOrg || ''} · 시행 {r.enforceDt || '-'} · 등록 {r.createdAt?.substring(0, 10) || '-'}
                  </Typography>
                </Paper>
              )
            })}
          </Box>

          {/* 페이지네이션 */}
          {regTotalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination count={regTotalPages} page={regPage} onChange={(_, v) => setRegPage(v)} color="primary" />
            </Box>
          )}
        </Box>
      )}

      {/* TAB 2: 개정 모니터링 */}
      {tab === 2 && (
        <Box>
          {/* PC 검색/필터 */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={revStatus} displayEmpty onChange={(e) => setRevStatus(e.target.value)}>
                <MenuItem value="">전체 상태</MenuItem>
                {Object.entries(STATUS_CHIP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            <ListSearchBar
              placeholder="법령명/요약 검색"
              value={revKeywordInput}
              onChange={setRevKeywordInput}
              onSearch={applyRevSearch}
              sx={{ minWidth: 280 }}
            />
            <IconButton onClick={() => { setRevKeywordInput(''); setRevKeyword(''); qc.invalidateQueries({ queryKey: ['legalRevisions'] }) }}><RefreshIcon /></IconButton>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select value={syncPages} onChange={(e) => setSyncPages(Number(e.target.value))}>
                  <MenuItem value={1}>100건</MenuItem>
                  <MenuItem value={2}>200건</MenuItem>
                  <MenuItem value={5}>500건</MenuItem>
                  <MenuItem value={10}>1000건</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={openFilterDialog}>법령 필터</Button>
              <Button variant="contained" startIcon={<SyncIcon />}
                disabled={syncMut.isPending} onClick={() => syncMut.mutate()}>
                법제처 API 동기화
              </Button>
            </Box>
          </Box>
          {/* Mobile 검색/필터 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
            <FormControl size="small" fullWidth>
              <Select value={revStatus} displayEmpty onChange={(e) => setRevStatus(e.target.value)}>
                <MenuItem value="">전체 상태</MenuItem>
                {Object.entries(STATUS_CHIP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            <ListSearchBar fullWidth
              placeholder="법령명/요약 검색"
              value={revKeywordInput}
              onChange={setRevKeywordInput}
              onSearch={applyRevSearch}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />}
                onClick={() => { setRevKeywordInput(''); setRevKeyword(''); qc.invalidateQueries({ queryKey: ['legalRevisions'] }) }}
                sx={{ flex: 1 }}>초기화</Button>
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select value={syncPages} onChange={(e) => setSyncPages(Number(e.target.value))}>
                  <MenuItem value={1}>100건</MenuItem>
                  <MenuItem value={2}>200건</MenuItem>
                  <MenuItem value={5}>500건</MenuItem>
                  <MenuItem value={10}>1000건</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" size="small" startIcon={<SyncIcon />}
                disabled={syncMut.isPending} onClick={() => syncMut.mutate()}
                sx={{ flex: 1.5 }}>동기화</Button>
            </Box>
          </Box>

          {/* PC 테이블 */}
          <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small" sx={{
                '& .MuiTableCell-root': { borderRight: (theme: any) => `1px solid ${dividerColor(theme)}` },
                '& .MuiTableCell-root:last-child': { borderRight: 'none' },
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerSx}>법령명</TableCell>
                    <TableCell sx={headerSx} align="center" width={100}>개정유형</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>공포일</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>시행일</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>영향도</TableCell>
                    <TableCell sx={headerSx} align="center" width={120}>검토상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revisions.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                      개정 이력이 없습니다. [법제처 API 동기화]를 눌러 최신 개정사항을 가져오세요.
                    </TableCell></TableRow>
                  ) : revPaged.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        {r.detailLink ? (
                          <MuiLink href={r.detailLink} target="_blank" rel="noopener" underline="hover">
                            {r.lawName} <OpenInNewIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                          </MuiLink>
                        ) : r.lawName}
                      </TableCell>
                      <TableCell align="center">{r.revisionType || '-'}</TableCell>
                      <TableCell align="center">{r.revisionDt || '-'}</TableCell>
                      <TableCell align="center">{r.enforceDt || '-'}</TableCell>
                      <TableCell align="center">
                        <FormControl size="small" sx={{ minWidth: 90 }}>
                          <Select value={r.impactLevel || 'MID'}
                            onChange={(e) => updateRevMut.mutate({ id: r.id!, r: { ...r, impactLevel: e.target.value } })}>
                            {Object.entries(IMPACT_CHIP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select value={r.reviewStatus || 'PENDING'}
                            onChange={(e) => updateRevMut.mutate({ id: r.id!, r: { ...r, reviewStatus: e.target.value } })}>
                            {Object.entries(STATUS_CHIP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Mobile 카드 */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {revisions.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
                개정 이력이 없습니다. [동기화]를 눌러 최신 개정사항을 가져오세요.
              </Paper>
            ) : revPaged.map(r => (
              <Paper key={r.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                {r.detailLink ? (
                  <MuiLink href={r.detailLink} target="_blank" rel="noopener" underline="hover" sx={{ fontSize: '0.875rem', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    {r.lawName} <OpenInNewIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                  </MuiLink>
                ) : <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>{r.lawName}</Typography>}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
                  {r.revisionType && <Chip label={r.revisionType} size="small" variant="outlined" />}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  공포 {r.revisionDt || '-'} · 시행 {r.enforceDt || '-'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select value={r.impactLevel || 'MID'}
                      onChange={(e) => updateRevMut.mutate({ id: r.id!, r: { ...r, impactLevel: e.target.value } })}>
                      {Object.entries(IMPACT_CHIP).map(([k, v]) => <MenuItem key={k} value={k}>영향: {v.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ flex: 1.2 }}>
                    <Select value={r.reviewStatus || 'PENDING'}
                      onChange={(e) => updateRevMut.mutate({ id: r.id!, r: { ...r, reviewStatus: e.target.value } })}>
                      {Object.entries(STATUS_CHIP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* 페이지네이션 */}
          {revTotalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination count={revTotalPages} page={revPage} onChange={(_, v) => setRevPage(v)} color="primary" />
            </Box>
          )}
        </Box>
      )}

      {/* TAB 3: 법규 대응 계획 */}
      {tab === 3 && <AuditPlanTab variant="legal-compliance" />}

      {/* TAB 4: 법규 대응 실시 */}
      {tab === 4 && <AuditExecutionTab variant="legal-compliance" />}

      {/* 법령 필터 편집 Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>법령 필터 설정</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            한 줄에 법령명 키워드 하나씩 입력하세요. 법령명에 키워드가 <b>포함</b>되면 매칭됩니다. (예: 산업안전보건법 → 산업안전보건법 시행령/시행규칙도 매칭)
          </Typography>
          <TextField
            multiline
            fullWidth
            minRows={12}
            maxRows={20}
            value={filterDraft}
            onChange={(e) => setFilterDraft(e.target.value)}
            placeholder="산업안전보건법&#10;중대재해처벌법&#10;..."
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>취소</Button>
          <Button variant="contained" disabled={updateFilterMut.isPending}
            onClick={() => updateFilterMut.mutate(filterDraft)}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// 별도 헬퍼 — 분야 셀렉트
const CategorySelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <FormControl size="small" sx={{ minWidth: 90 }}>
    <Select value={value} displayEmpty onChange={(e) => onChange(e.target.value)}>
      <MenuItem value="">-</MenuItem>
      {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
    </Select>
  </FormControl>
)

export default LegalResponsePage
