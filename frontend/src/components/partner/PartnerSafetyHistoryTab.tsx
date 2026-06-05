import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Button, Alert, TextField, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { partnerSafetyExecutionApi, PartnerSafetyExecution } from '../../api/partnerSafetyExecutionApi'
import { siteSafetyPlanApi } from '../../api/siteSafetyApi'
import { fetchSafetyTemplates } from '../../api/safetyChecklistApi'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'

type SnapshotItem = {
  categoryName: string
  checkItem: string
  legalBasis: string
  checkResult: string
  finding?: string
  actionDeadline?: string
  actionComplete?: boolean
}

const parseSnapshot = (json?: string | null): SnapshotItem[] => {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr as SnapshotItem[] : []
  } catch { return [] }
}

const resultChip = (r: string) => {
  if (r === 'PASS') return <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>○ 적합</Box>
  if (r === 'FAIL') return <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>✕ 부적합</Box>
  if (r === 'NA') return <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>- 해당없음</Box>
  return <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>
}

const fmtDateTime = (v?: string | null) => (v || '').replace('T', ' ').substring(0, 19)

const PartnerSafetyHistoryTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [selected, setSelected] = useState<PartnerSafetyExecution | null>(null)
  const [searchTextInput, setSearchTextInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const applySearch = () => setSearchText(searchTextInput)
  const handleResetSearch = () => { setSearchTextInput(''); setSearchText('') }

  // 새 창(실행 URL) 에서 확인 클릭 시 localStorage 이벤트로 알림 → 조회 목록 즉시 새로고침
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'partnerSafetyExecutionDone') {
        qc.invalidateQueries({ queryKey: ['partnerSafetyExecutionsCompleted'] })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [qc])

  const { data, isLoading } = useQuery({
    queryKey: ['partnerSafetyExecutionsCompleted'],
    queryFn: () => partnerSafetyExecutionApi.findCompleted(),
  })
  const list: PartnerSafetyExecution[] = data || []

  // 계획 정보 (계획번호 / 제목)
  const { data: plansPage } = useQuery({
    queryKey: ['partnerSafetyHistoryPlans'],
    queryFn: () => siteSafetyPlanApi.getAll(0, 500, 'PARTNER'),
    staleTime: 1000 * 60 * 5,
  })
  const planById = new Map<number, { planId?: string; title?: string }>()
  ;(plansPage?.content || []).forEach((p: any) => planById.set(p.id, { planId: p.planId, title: p.title }))

  // 체크리스트 템플릿 이름
  const { data: templates } = useQuery({
    queryKey: ['partnerSafetyHistoryTemplates'],
    queryFn: fetchSafetyTemplates,
    staleTime: 1000 * 60 * 5,
  })
  const getTemplateName = (id?: number | null) => {
    if (!id) return ''
    const tpl = (templates || []).find((t: any) => t.id === id)
    return tpl?.templateName || ''
  }

  // 검색 필터 적용된 목록 — 제목/계획번호/작성자
  const filteredList = useMemo(() => {
    const s = searchText.trim().toLowerCase()
    if (!s) return list
    return list.filter(e => {
      const plan = e.planId ? planById.get(e.planId) : undefined
      return (
        plan?.title?.toLowerCase().includes(s) ||
        plan?.planId?.toLowerCase().includes(s) ||
        e.name?.toLowerCase().includes(s)
      )
    })
  }, [list, planById, searchText])

  const refresh = () => {
    handleResetSearch()
    qc.invalidateQueries({ queryKey: ['partnerSafetyExecutionsCompleted'] })
    qc.invalidateQueries({ queryKey: ['partnerSafetyHistoryPlans'] })
  }

  // ───── 상세 ─────
  if (selected) {
    return (
      <Box sx={{ pb: 4 }}>
        {/* 파라미터 정보 */}
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
          파라미터 정보
        </Typography>
        <FormTable>
          <FormRow>
            <FormLabel>이름</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selected.name}</Typography></FormCell>
            <FormLabel>사업장코드</FormLabel>
            <FormCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selected.companyCode}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>휴대폰번호</FormLabel>
            <FormCell borderRight><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selected.phone || '-'}</Typography></FormCell>
            <FormLabel>호출 시스템</FormLabel>
            <FormCell><Typography variant="body2">{selected.systemCode}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>UID</FormLabel>
            <FormCell borderRight><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selected.systemUid}</Typography></FormCell>
            <FormLabel>호출된 시간</FormLabel>
            <FormCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{fmtDateTime(selected.calledAt)}</Typography></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>완료 시각</FormLabel>
            <FormCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{fmtDateTime(selected.completedAt)}</Typography></FormCell>
          </FormRow>
        </FormTable>

        {/* 체크리스트 — 실행 단위 스냅샷 (마스터 템플릿이 아님) */}
        {(() => {
          const snap = parseSnapshot(selected.checklistData)
          if (snap.length === 0) return null
          // 카테고리별로 그룹화
          const byCategory: Record<string, SnapshotItem[]> = {}
          snap.forEach(it => {
            const k = it.categoryName || '(기타)'
            if (!byCategory[k]) byCategory[k] = []
            byCategory[k].push(it)
          })
          return (
            <>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mt: 3, mb: 2 }}>
                체크리스트
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: 50 }} align="center">No</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>점검 항목</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 120 }} align="center">결과</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(byCategory).map(([catName, items]) => (
                      <React.Fragment key={`cat-${catName}`}>
                        <TableRow sx={{ bgcolor: '#1e293b' }}>
                          <TableCell colSpan={3} sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>{catName}</TableCell>
                        </TableRow>
                        {items.map((it, idx) => (
                          <TableRow key={`${catName}-${idx}`}>
                            <TableCell align="center">{idx + 1}</TableCell>
                            <TableCell sx={{ wordBreak: 'keep-all' }}>{it.checkItem}</TableCell>
                            <TableCell align="center">{resultChip(it.checkResult)}</TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )
        })()}

        {/* 서명 */}
        {selected.signature && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mt: 3, mb: 2 }}>
              서명
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <img src={selected.signature} alt="" style={{ maxHeight: 100 }} />
            </Paper>
          </>
        )}

        {/* 최종 전송 URL — 서명 포함 모든 파라미터 */}
        {(() => {
          const params = new URLSearchParams({
            token: selected.executionToken || '',
            name: selected.name || '',
            companyCode: selected.companyCode || '',
            phone: selected.phone || '',
            systemCode: selected.systemCode || '',
            systemUid: selected.systemUid || '',
            calledAt: selected.calledAt || '',
            completedAt: selected.completedAt || '',
            signature: selected.signature || '',
          })
          const finalUrl = `${window.location.origin}/api/external/partner-safety/submit?${params.toString()}`
          return (
            <>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mt: 3, mb: 2 }}>
                최종 전송 URL
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="body2" sx={{
                  fontFamily: 'monospace', fontSize: '0.72rem',
                  wordBreak: 'break-all', whiteSpace: 'pre-wrap',
                }}>
                  {finalUrl}
                </Typography>
              </Paper>
            </>
          )
        })()}

        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => setSelected(null)}
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.list', '목록')}
          </Button>
        </Box>
      </Box>
    )
  }

  // ───── 목록 ─────
  return (
    <Box>
      {/* 검색 — 데스크탑 */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, mb: 2, alignItems: 'center' }}>
        <ListSearchBar sx={{ width: 320 }} placeholder="제목/계획번호/작성자 검색..." value={searchTextInput} onChange={setSearchTextInput} onSearch={applySearch} />
        <IconButton size="small" onClick={refresh}><RefreshIcon /></IconButton>
      </Box>
      {/* 검색 — 모바일 */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ListSearchBar fullWidth placeholder="제목/계획번호/작성자 검색..." value={searchTextInput} onChange={setSearchTextInput} onSearch={applySearch} />
          <IconButton size="small" onClick={refresh}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1, flexShrink: 0 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell align="center" sx={{ fontWeight: 'bold', width: 60 }}>No</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>계획번호</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>체크리스트</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', width: 140 }}>작성자</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>작성일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>{t('common.loading', '로딩 중...')}</TableCell></TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">완료된 실행이 없습니다.</Typography>
              </TableCell></TableRow>
            ) : (
              filteredList.map((e, idx) => {
                const plan = e.planId ? planById.get(e.planId) : undefined
                return (
                  <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelected(e)}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{plan?.planId || ''}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{plan?.title || ''}</TableCell>
                    <TableCell align="center">{getTemplateName(e.checklistTemplateId)}</TableCell>
                    <TableCell align="center">{e.name}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{(e.completedAt || '').substring(0, 10)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 모바일 카드 */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {isLoading ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>{t('common.loading', '로딩 중...')}</Paper>
        ) : filteredList.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
            <Alert severity="info" sx={{ m: 0 }}>완료된 실행이 없습니다.</Alert>
          </Paper>
        ) : (
          filteredList.map(e => {
            const plan = e.planId ? planById.get(e.planId) : undefined
            return (
              <Paper key={e.id} variant="outlined" sx={{ p: 1.5, cursor: 'pointer' }} onClick={() => setSelected(e)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'primary.main', fontWeight: 700 }}>
                    {plan?.planId || ''}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>{plan?.title || ''}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  체크리스트: {getTemplateName(e.checklistTemplateId)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  작성자: {e.name} · 작성일: {(e.completedAt || '').substring(0, 10)}
                </Typography>
              </Paper>
            )
          })
        )}
      </Box>
    </Box>
  )
}

export default PartnerSafetyHistoryTab
