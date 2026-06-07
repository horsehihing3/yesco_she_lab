import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Typography, Button, Alert,
  TextField, IconButton, Radio,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { fetchSafetyTemplates, copySafetyTemplate } from '../../api/safetyChecklistApi'
import { useAlert } from '../../contexts/AlertContext'
import { SafetyChecklistTemplate } from '../../types/safetyChecklist.types'
import SafetyChecklistTab from '../ehs/SafetyChecklistTab'
import LoadingOverlay from '../common/LoadingOverlay'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

interface SafetyChecklistWrapperProps {
  categoryType?: string
}

const SafetyChecklistWrapper: React.FC<SafetyChecklistWrapperProps> = ({ categoryType }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showAlert } = useAlert()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [copyTargetId, setCopyTargetId] = useState<number | null>(null)

  const copyMutation = useMutation({
    mutationFn: copySafetyTemplate,
    onSuccess: () => {
      showAlert('success', t('checklist.copySuccess', '복사되었습니다.'))
      queryClient.invalidateQueries({ queryKey: ['safetyTemplates'] })
      setCopyTargetId(null)
    },
    onError: () => showAlert('error', t('common.failed', '실패했습니다.')),
  })
  const handleCopy = () => {
    if (copyTargetId == null) return
    copyMutation.mutate(copyTargetId)
  }

  const { data: templates, isLoading, isFetching } = useQuery({
    queryKey: ['safetyTemplates', categoryType],
    queryFn: fetchSafetyTemplates,
    enabled: selectedId === null,
  })

  const filtered = useMemo(() => {
    if (!templates) return []
    let result = templates
    if (categoryType) {
      // AUDIT 탭은 categoryType 미설정 레거시 항목도 함께 노출 (V162 이후 NULL → AUDIT 일괄 변환 보완)
      if (categoryType === 'AUDIT') {
        result = result.filter((t: any) => t.categoryType === 'AUDIT' || !t.categoryType)
      } else {
        result = result.filter((t: any) => t.categoryType === categoryType)
      }
    }
    if (keyword.trim()) {
      const s = keyword.toLowerCase()
      result = result.filter(t => t.templateName?.toLowerCase().includes(s))
    }
    return result
  }, [templates, keyword, categoryType])

  const handleReset = () => setKeyword('')

  // 협력사(모바일) — 지적사항/조치기한/조치완료/첨부파일 셀이 빠진 단순 OX 체크리스트
  const simpleMode = categoryType === 'CONTRACTOR_MOBILE'

  // ===== Template selected → show SafetyChecklistTab =====
  if (isCreating) {
    return (
      <SafetyChecklistTab
        templateId={0}
        onBack={() => setIsCreating(false)}
        startEditing
        isNew
        categoryType={categoryType}
        simpleMode={simpleMode}
        onCreated={(id) => { setIsCreating(false); setSelectedId(id); queryClient.invalidateQueries({ queryKey: ['safetyTemplates'] }) }}
      />
    )
  }

  if (selectedId !== null) {
    return (
      <SafetyChecklistTab templateId={selectedId} onBack={() => setSelectedId(null)} simpleMode={simpleMode} />
    )
  }

  // ===== Template list =====
  return (
    <Box>
      <LoadingOverlay open={isFetching} message={t('common.loading', '목록을 불러오는 중...')} />
      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('checklist.searchPlaceholder', '제목으로 검색')} value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {categoryType === 'CONTRACTOR' && (
            <Button variant="contained" size="small">{t('common.excelUpload', '엑셀 업로드')}</Button>
          )}
          <Button variant="contained" size="small" startIcon={<ContentCopyIcon />}
            disabled={copyTargetId == null || copyMutation.isPending} onClick={handleCopy}>
            {t('common.copy', '복사')}
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}>{t('common.new')}</Button>
        </Box>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('checklist.searchPlaceholder', '제목으로 검색')} value={keyword}
          onChange={(e) => setKeyword(e.target.value)} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ flex: '1 1 calc(50% - 4px)' }}>{t('common.reset', '초기화')}</Button>
          <Button variant="contained" size="small" startIcon={<ContentCopyIcon />}
            disabled={copyTargetId == null || copyMutation.isPending} onClick={handleCopy}
            sx={{ flex: '1 1 calc(50% - 4px)' }}>
            {t('common.copy', '복사')}
          </Button>
          {categoryType === 'CONTRACTOR' && (
            <Button variant="contained" size="small" sx={{ flex: '1 1 calc(50% - 4px)' }}>{t('common.excelUpload', '엑셀 업로드')}</Button>
          )}
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setIsCreating(true)} sx={{ flex: '1 1 calc(50% - 4px)' }}>{t('common.new')}</Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ minHeight: 200 }} />
      ) : filtered.length === 0 ? (
        <Alert severity="info">{t('common.noData')}</Alert>
      ) : (
        <>
          {/* PC Table */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, width: 48, p: 0 }} align="center"></TableCell>
                  <TableCell sx={{ ...headerCellSx, width: 40 }} align="center">{t('common.no')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('common.title', '제목')}</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: 80 }} align="center">{t('checklist.itemCount', '항목 수')}</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: 120 }} align="center">{t('common.createdAt', '작성일')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((tmpl: SafetyChecklistTemplate, idx: number) => (
                  <TableRow key={tmpl.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedId(tmpl.id)}>
                    <TableCell align="center" sx={{ width: 48, p: 0 }} onClick={(e) => e.stopPropagation()}>
                      <Radio size="small" checked={copyTargetId === tmpl.id}
                        onChange={() => setCopyTargetId(tmpl.id)} value={tmpl.id} name="safety-copy-radio" />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 40 }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">{tmpl.templateName}</Typography>
                    </TableCell>
                    <TableCell align="center">{tmpl.itemCount || 0}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {tmpl.createdAt?.substring(0, 10) || ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {filtered.map((tmpl: SafetyChecklistTemplate) => (
              <Paper key={tmpl.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'grey.300' }} onClick={() => setSelectedId(tmpl.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box onClick={(e) => e.stopPropagation()}>
                    <Radio size="small" checked={copyTargetId === tmpl.id}
                      onChange={() => setCopyTargetId(tmpl.id)} value={tmpl.id} name="safety-copy-radio-mobile" />
                  </Box>
                  <Typography fontWeight="bold" color="primary" sx={{ flex: 1 }}>{tmpl.templateName}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('checklist.itemCount', '항목 수')}: {tmpl.itemCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('common.createdAt', '작성일')}: {tmpl.createdAt?.substring(0, 10) || ''}
                </Typography>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}

export default SafetyChecklistWrapper
