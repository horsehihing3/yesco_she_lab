import { useMemo, useRef, useState } from 'react'
import { isEhsManager } from '../../utils/auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import ListSearchBar from '../common/ListSearchBar'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, CircularProgress, TextField, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { healthCheckupRecordApi, HealthCheckupRecord } from '../../api/healthCheckupRecordApi'
import LoadingOverlay from '../common/LoadingOverlay'

const MENU = '보건 관리 › 건강 검진 관리 › 사후관리'

const HealthCheckupRecordTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isEhsManager(user)
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }

  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => setKeyword(keywordInput)
  const handleResetSearch = () => { setKeywordInput(''); setKeyword('') }
  const [uploading, setUploading] = useState(false)
  const [yearlyOpen, setYearlyOpen] = useState(false)
  const [yearlyRecords, setYearlyRecords] = useState<HealthCheckupRecord[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<HealthCheckupRecord | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['healthCheckupRecords'],
    queryFn: () => healthCheckupRecordApi.getAll(),
  })

  const filtered = useMemo(() => {
    if (!keyword.trim()) return records
    const q = keyword.toLowerCase()
    return records.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.department || '').toLowerCase().includes(q),
    )
  }, [records, keyword])

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showError(t('healthCheckupRecord.onlyPdf', 'PDF 파일만 업로드 가능합니다.'))
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      await healthCheckupRecordApi.uploadPdf(file)
      queryClient.invalidateQueries({ queryKey: ['healthCheckupRecords'] })
      showSuccess(t('healthCheckupRecord.uploaded', 'PDF가 분석되어 등록되었습니다.'))
    } catch (err: any) {
      showError(err?.response?.data?.message || t('common.error'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (record: HealthCheckupRecord) => {
    const ok = await showConfirm(t('common.confirmDelete'))
    if (!ok) return
    try {
      await healthCheckupRecordApi.delete(record.id)
      queryClient.invalidateQueries({ queryKey: ['healthCheckupRecords'] })
      showSuccess(t('common.deleted', '삭제되었습니다'))
    } catch { showError(t('common.error')) }
  }

  const handleNameDoubleClick = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation()
    if (!name) return
    try {
      const list = await healthCheckupRecordApi.getByName(name)
      setYearlyRecords(list)
      setYearlyOpen(true)
    } catch { showError(t('common.error')) }
  }

  const openDetail = (r: HealthCheckupRecord) => {
    setDetailRecord(r)
    setDetailOpen(true)
  }

  const gradeColor = (grade?: string | null): 'default' | 'success' | 'warning' | 'error' => {
    if (!grade) return 'default'
    if (grade.includes('정상')) return 'success'
    if (grade.includes('전단계') || grade.includes('장애')) return 'warning'
    if (grade.includes('의심') || grade.includes('유질환')) return 'error'
    return 'default'
  }

  // 모든 셀 줄바꿈 금지 (가로 스크롤로 처리)
  const headerSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const, textAlign: 'center' as const }
  const cellSx = { whiteSpace: 'nowrap' as const }

  return (
    <Box>
      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={handleFileChange} />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <ListSearchBar
          placeholder={t('healthCheckupRecord.searchPlaceholder', '성명, 부서명 입력')}
          value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} sx={{ minWidth: 280 }}
        />
        <IconButton size="small" onClick={handleResetSearch}><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        {canSee(MENU, 'LIST', 'PDF 업로드', myRoles) && (
          <Button variant="contained" onClick={handleUploadClick} disabled={uploading}>
            {t('healthCheckupRecord.uploadPdf', 'PDF 업로드')}
          </Button>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        {t('healthCheckupRecord.uploadHint', 'PDF 파일을 업로드하면 검진 결과지의 수치가 자동으로 추출되어 하단 표에 등록됩니다. 성명을 클릭하면 과거 비교를 볼 수 있습니다.')}
      </Alert>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">{t('common.noData')}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflowX: 'auto' }}>
          <Table size="small" sx={{ borderCollapse: 'collapse', '& td, & th': { borderRight: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ ...headerSx, width: 50 }} rowSpan={2}>No</TableCell>
                <TableCell sx={{ ...headerSx, width: 100 }} rowSpan={2}>{t('healthCheckupRecord.examPeriod', '검진시기')}</TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 220 }} rowSpan={2}>{t('healthCheckupRecord.hospital', '병원명')}</TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 140 }} rowSpan={2}>{t('healthCheckupRecord.department', '부서명')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 90 }} rowSpan={2}>{t('healthCheckupRecord.name', '성명')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 60 }} rowSpan={2}>{t('healthCheckupRecord.age', '연령')}</TableCell>
                <TableCell sx={headerSx} colSpan={3}>{t('healthCheckupRecord.hypertension', '고혈압')}</TableCell>
                <TableCell sx={headerSx} colSpan={3}>{t('healthCheckupRecord.diabetes', '당뇨병')}</TableCell>
                <TableCell sx={headerSx} colSpan={6}>{t('healthCheckupRecord.dyslipidemia', '이상지질혈증')}</TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 200, borderLeft: '1px solid', borderColor: 'divider' }} rowSpan={2}>{t('healthCheckupRecord.followUp', '사후관리소견')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 90 }} rowSpan={2}>{t('healthCheckupRecord.workFitness', '업무적합')}</TableCell>
                <TableCell sx={{ ...headerSx, minWidth: 140 }} rowSpan={2}>{t('healthCheckupRecord.remark', '비고')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 70 }} rowSpan={2}>{t('healthCheckupRecord.pdf', 'PDF')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 60 }} rowSpan={2}>{t('common.delete', '삭제')}</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ ...headerSx, width: 110 }}>{t('healthCheckupRecord.grade', '건강구분')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 80 }}>{t('healthCheckupRecord.med', '약복용')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 90 }}>BP</TableCell>
                <TableCell sx={{ ...headerSx, width: 130 }}>{t('healthCheckupRecord.grade', '건강구분')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 80 }}>{t('healthCheckupRecord.med', '약복용')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 70 }}>BST</TableCell>
                <TableCell sx={{ ...headerSx, width: 130 }}>{t('healthCheckupRecord.grade', '건강구분')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 80 }}>{t('healthCheckupRecord.med', '약복용')}</TableCell>
                <TableCell sx={{ ...headerSx, width: 70 }}>T.C</TableCell>
                <TableCell sx={{ ...headerSx, width: 70 }}>TG</TableCell>
                <TableCell sx={{ ...headerSx, width: 70 }}>LDL</TableCell>
                <TableCell sx={{ ...headerSx, width: 70, borderRight: '1px solid', borderColor: 'divider' }}>HDL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r, idx) => (
                <TableRow key={r.id} hover>
                  <TableCell align="center" sx={cellSx}>{idx + 1}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.examDate || r.examPeriod || ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.hospitalName || ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.department || ''}</TableCell>
                  <TableCell align="center" sx={{ ...cellSx, fontWeight: 600, color: 'primary.main', cursor: r.name ? 'pointer' : 'default' }}
                    onClick={(e) => r.name && handleNameDoubleClick(e, r.name)}>
                    {r.name || ''}
                  </TableCell>
                  <TableCell align="center" sx={cellSx}>{r.age ?? ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>
                    {r.bpGrade ? <Chip size="small" label={r.bpGrade} color={gradeColor(r.bpGrade)} /> : ''}
                  </TableCell>
                  <TableCell align="center" sx={cellSx}>{r.bpMed || ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.bpSystolic && r.bpDiastolic ? `${r.bpSystolic}/${r.bpDiastolic}` : ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>
                    {r.dmGrade ? <Chip size="small" label={r.dmGrade} color={gradeColor(r.dmGrade)} /> : ''}
                  </TableCell>
                  <TableCell align="center" sx={cellSx}>{r.dmMed || ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.bst ?? ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>
                    {r.lipidGrade ? <Chip size="small" label={r.lipidGrade} color={gradeColor(r.lipidGrade)} /> : ''}
                  </TableCell>
                  <TableCell align="center" sx={cellSx}>{r.lipidMed || ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.tc ?? ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.tg ?? ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.ldl ?? ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{r.hdl ?? ''}</TableCell>
                  {/* 사후관리소견 — 클릭 시 상세 모달 */}
                  <TableCell
                    sx={{
                      cursor: 'pointer',
                      color: 'primary.main',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 280,
                    }}
                    onClick={() => openDetail(r)}
                  >
                    {r.followUp ? r.followUp.replace(/\n/g, ' ') : t('healthCheckupRecord.viewDetail', '상세 보기')}
                  </TableCell>
                  <TableCell align="center" sx={cellSx}>{r.workFitness || ''}</TableCell>
                  <TableCell sx={{ ...cellSx, fontSize: '0.8rem', textAlign: r.remark ? 'left' : 'center' }}>{r.remark || ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>
                    {r.pdfFileId && (
                      <IconButton size="small" color="primary" onClick={() => window.open(`/api/files/${r.pdfFileId}`, '_blank')}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={cellSx}>
                    {canSee(MENU, 'DETAIL', '삭제', getRoles(r)) && (
                      <IconButton size="small" color="error" onClick={() => handleDelete(r)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 상세 모달 */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight="bold">
            {t('healthCheckupRecord.detailTitle', '건강검진 상세')}
          </Typography>
          <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {!detailRecord ? null : (
            <TableContainer>
              <Table size="small" sx={{ '& td, & th': { border: '1px solid', borderColor: 'divider' } }}>
                <TableBody>
                  {([
                    [t('healthCheckupRecord.examDate', '검진일'), detailRecord.examDate, false],
                    [t('healthCheckupRecord.hospital', '병원명'), detailRecord.hospitalName, false],
                    [t('healthCheckupRecord.department', '부서명'), detailRecord.department, false],
                    [t('healthCheckupRecord.name', '성명'), detailRecord.name, false],
                    [t('healthCheckupRecord.age', '연령'), detailRecord.age?.toString(), false],
                    ['고혈압 건강구분', detailRecord.bpGrade, false],
                    ['고혈압 약복용', detailRecord.bpMed, false],
                    ['고혈압 BP', detailRecord.bpSystolic && detailRecord.bpDiastolic ? `${detailRecord.bpSystolic}/${detailRecord.bpDiastolic} mmHg` : null, false],
                    ['당뇨 건강구분', detailRecord.dmGrade, false],
                    ['당뇨 약복용', detailRecord.dmMed, false],
                    ['BST (공복혈당)', detailRecord.bst != null ? `${detailRecord.bst} mg/dL` : null, false],
                    ['이상지질 건강구분', detailRecord.lipidGrade, false],
                    ['이상지질 약복용', detailRecord.lipidMed, false],
                    ['T.C (총콜레스테롤)', detailRecord.tc != null ? `${detailRecord.tc} mg/dL` : null, false],
                    ['TG (중성지방)', detailRecord.tg != null ? `${detailRecord.tg} mg/dL` : null, false],
                    ['LDL', detailRecord.ldl != null ? `${detailRecord.ldl} mg/dL` : null, false],
                    ['HDL', detailRecord.hdl != null ? `${detailRecord.hdl} mg/dL` : null, false],
                    [t('healthCheckupRecord.followUp', '사후관리소견'), detailRecord.followUp, true],
                    [t('healthCheckupRecord.workFitness', '업무적합'), detailRecord.workFitness, false],
                    [t('healthCheckupRecord.remark', '비고'), detailRecord.remark, true],
                  ] as const).map(([label, value, leftAlign], idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', width: 180, whiteSpace: 'nowrap' }}>{label}</TableCell>
                      <TableCell align={leftAlign && value ? 'left' : 'center'} sx={{ whiteSpace: 'pre-wrap' }}>
                        {value || ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDetailOpen(false)}>{t('common.close', '닫기')}</Button>
        </DialogActions>
      </Dialog>

      {/* 과거 비교 모달 */}
      <Dialog open={yearlyOpen} onClose={() => setYearlyOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight="bold">
            {t('healthCheckupRecord.yearlyTitle', '임직원 건강검진 비교/조회')}
          </Typography>
          <IconButton size="small" onClick={() => setYearlyOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {yearlyRecords.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>{t('common.noData')}</Typography>
          ) : (
            <TableContainer>
              <Table size="small" sx={{ '& td, & th': { border: '1px solid', borderColor: 'divider' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={headerSx}>{t('healthCheckupRecord.item', '항목')}</TableCell>
                    {yearlyRecords.map(r => (
                      <TableCell key={r.id} sx={headerSx}>{r.examDate || ''}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {([
                    ['병원명', (r: HealthCheckupRecord) => r.hospitalName, false],
                    ['연령', (r: HealthCheckupRecord) => r.age, false],
                    ['고혈압 (수축/이완)', (r: HealthCheckupRecord) => r.bpSystolic && r.bpDiastolic ? `${r.bpSystolic}/${r.bpDiastolic}` : null, false],
                    ['고혈압 약복용', (r: HealthCheckupRecord) => r.bpMed, false],
                    ['고혈압 건강구분', (r: HealthCheckupRecord) => r.bpGrade, false],
                    ['BST (공복혈당)', (r: HealthCheckupRecord) => r.bst, false],
                    ['당뇨 약복용', (r: HealthCheckupRecord) => r.dmMed, false],
                    ['당뇨 건강구분', (r: HealthCheckupRecord) => r.dmGrade, false],
                    ['T.C', (r: HealthCheckupRecord) => r.tc, false],
                    ['TG', (r: HealthCheckupRecord) => r.tg, false],
                    ['LDL', (r: HealthCheckupRecord) => r.ldl, false],
                    ['HDL', (r: HealthCheckupRecord) => r.hdl, false],
                    ['이상지질 약복용', (r: HealthCheckupRecord) => r.lipidMed, false],
                    ['이상지질 건강구분', (r: HealthCheckupRecord) => r.lipidGrade, false],
                    ['사후관리소견', (r: HealthCheckupRecord) => r.followUp, true],
                  ] as const).map(([label, getter, leftAlign], idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50', whiteSpace: 'nowrap' }}>{label}</TableCell>
                      {yearlyRecords.map(r => {
                        const v = getter(r)
                        const isEmpty = v == null || v === ''
                        return (
                          <TableCell key={r.id} align={leftAlign && !isEmpty ? 'left' : 'center'} sx={{ fontSize: '0.85rem', whiteSpace: leftAlign ? 'pre-wrap' : 'normal' }}>
                            {isEmpty ? '' : String(v)}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setYearlyOpen(false)}>{t('common.close', '닫기')}</Button>
        </DialogActions>
      </Dialog>

      <LoadingOverlay open={uploading} message={t('healthCheckupRecord.parsing', 'PDF 분석 중...')} />
    </Box>
  )
}

export default HealthCheckupRecordTab
