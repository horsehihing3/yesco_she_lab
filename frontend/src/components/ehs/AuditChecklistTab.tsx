import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import ListSearchBar from '../common/ListSearchBar'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField,
  Chip, Pagination, CircularProgress, Alert, IconButton,
  ToggleButtonGroup, ToggleButton, Checkbox,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import GridOnIcon from '@mui/icons-material/GridOn'
import ListAltIcon from '@mui/icons-material/ListAlt'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'

registerAllModules()
import { useAlert } from '../../contexts/AlertContext'
import { useThemeMode } from '../../context/ThemeContext'
import { auditChecklistApi } from '../../api/auditApi'
import {
  AuditChecklistTemplate, AuditChecklistTemplateRequest,
  AuditChecklistItemRequest,
} from '../../types/audit.types'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const emptyForm: AuditChecklistTemplateRequest = {
  templateName: '', auditType: 'INTERNAL', description: '', content: '', items: [],
  inspectionDate: '', inspectionLocation: '', inspectionDept: '', personInCharge: '',
  inspector: '', reviewer: '', inspectionType: '', inspectionCount: '', overallResult: '', totalScore: '',
}

const AuditChecklistTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { getLabel: getAuditTypeLabel } = useCodeMap('AUDIT_TYPE')
  const { isDarkMode } = useThemeMode()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<AuditChecklistTemplate | null>(null)
  const [form, setForm] = useState<AuditChecklistTemplateRequest>({ ...emptyForm })
  const [formItems, setFormItems] = useState<AuditChecklistItemRequest[]>([])
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const pageSize = 10
  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setPage(0) }
  const [editorMode, setEditorMode] = useState<'spreadsheet' | 'items'>('spreadsheet')

  const handleAddItem = () => { setFormItems([...formItems, { section: '', itemText: '', legalRef: '', isCritical: false, sortOrder: formItems.length + 1 }]) }
  const handleRemoveItem = (idx: number) => { setFormItems(formItems.filter((_, i) => i !== idx)) }
  const handleItemChange = (idx: number, field: keyof AuditChecklistItemRequest, value: string | boolean | number) => {
    setFormItems(formItems.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  // ──── Handsontable ────
  const hotRef = useRef<any>(null)
  const [hotData, setHotData] = useState<string[][]>([['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']])
  const [hotMerge, setHotMerge] = useState<Array<{ row: number; col: number; rowspan: number; colspan: number }>>([])

  const parseContentToHot = (content: string) => {
    if (!content) return { data: null, merge: [], cellAligns: [] as Array<{ row: number; col: number; className: string }> }
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const table = doc.querySelector('table')
    if (!table) return { data: null, merge: [], cellAligns: [] as Array<{ row: number; col: number; className: string }> }
    const rows: string[][] = []
    const merge: Array<{ row: number; col: number; rowspan: number; colspan: number }> = []
    const cellAligns: Array<{ row: number; col: number; className: string }> = []
    let ri = 0
    table.querySelectorAll('tr').forEach(tr => {
      const cells: string[] = []
      let ci = 0
      tr.querySelectorAll('td, th').forEach(td => {
        const el = td as HTMLElement
        cells.push(el.textContent?.trim() || '')
        const colspan = parseInt(el.getAttribute('colspan') || '1')
        const rowspan = parseInt(el.getAttribute('rowspan') || '1')
        if (colspan > 1 || rowspan > 1) {
          merge.push({ row: ri, col: ci, rowspan, colspan })
        }
        // 정렬 정보 추출
        const style = el.getAttribute('style') || ''
        const alignMatch = style.match(/text-align:\s*(left|center|right|justify)/i)
        const vAlignMatch = style.match(/vertical-align:\s*(top|middle|bottom)/i)
        const classes: string[] = []
        if (alignMatch) classes.push('ht' + alignMatch[1].charAt(0).toUpperCase() + alignMatch[1].slice(1))
        if (vAlignMatch) classes.push('ht' + vAlignMatch[1].charAt(0).toUpperCase() + vAlignMatch[1].slice(1))
        if (classes.length > 0) cellAligns.push({ row: ri, col: ci, className: classes.join(' ') })
        for (let c = 1; c < colspan; c++) cells.push('')
        ci += colspan
      })
      rows.push(cells)
      ri++
    })
    return { data: rows.length > 0 ? rows : null, merge, cellAligns }
  }

  // 뷰/모드 전환 시 데이터 로드
  const pendingAligns = useRef<Array<{ row: number; col: number; className: string }>>([])
  useEffect(() => {
    if ((viewMode === 'create' || viewMode === 'edit') && editorMode === 'spreadsheet') {
      const { data: parsed, merge, cellAligns } = parseContentToHot(form.content || '')
      setHotData(parsed || [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']])
      setHotMerge(merge)
      pendingAligns.current = cellAligns
      // Handsontable 렌더 후 정렬 적용
      setTimeout(() => {
        const hot = hotRef.current?.hotInstance
        if (hot && pendingAligns.current.length > 0) {
          pendingAligns.current.forEach(({ row, col, className }) => {
            hot.setCellMeta(row, col, 'className', className)
          })
          hot.render()
          pendingAligns.current = []
        }
      }, 300)
    }
  }, [viewMode, editorMode])

  const getHotContent = (): string => {
    const hot = hotRef.current?.hotInstance
    if (!hot) return form.content || ''
    const data = hot.getData() as string[][]
    const mergePlugin = hot.getPlugin('mergeCells')
    const merges = mergePlugin?.mergedCellsCollection?.mergedCells || []
    const skipCells = new Set<string>()
    const mergeMap: Record<string, { colspan: number; rowspan: number }> = {}
    merges.forEach((m: any) => {
      mergeMap[`${m.row},${m.col}`] = { colspan: m.colspan, rowspan: m.rowspan }
      for (let r = m.row; r < m.row + m.rowspan; r++) {
        for (let c = m.col; c < m.col + m.colspan; c++) {
          if (r !== m.row || c !== m.col) skipCells.add(`${r},${c}`)
        }
      }
    })
    return '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">' +
      data.filter((row: string[]) => row.some(c => c?.trim())).map((row: string[], ri: number) =>
        '<tr>' + row.map((cell: string, ci: number) => {
          if (skipCells.has(`${ri},${ci}`)) return ''
          const merge = mergeMap[`${ri},${ci}`]
          const colspanAttr = merge && merge.colspan > 1 ? ` colspan="${merge.colspan}"` : ''
          const rowspanAttr = merge && merge.rowspan > 1 ? ` rowspan="${merge.rowspan}"` : ''
          // 셀 className에서 정렬 읽기
          const cellClassName = (hot.getCellMeta(ri, ci)?.className || '') as string
          let alignStyle = ''
          if (cellClassName.includes('htCenter')) alignStyle += 'text-align:center;'
          else if (cellClassName.includes('htRight')) alignStyle += 'text-align:right;'
          else if (cellClassName.includes('htJustify')) alignStyle += 'text-align:justify;'
          if (cellClassName.includes('htMiddle')) alignStyle += 'vertical-align:middle;'
          else if (cellClassName.includes('htBottom')) alignStyle += 'vertical-align:bottom;'
          return `<td style="padding:6px 10px;border:1px solid #ccc;${alignStyle}"${colspanAttr}${rowspanAttr}>${cell || ''}</td>`
        }).join('') + '</tr>'
      ).join('') + '</table>'
  }


  const { data, isLoading } = useQuery({
    queryKey: ['auditChecklistTemplates', page],
    queryFn: () => auditChecklistApi.getTemplates(page, pageSize),
    enabled: viewMode === 'list',
  })

  const createMutation = useMutation({
    mutationFn: (req: AuditChecklistTemplateRequest) => auditChecklistApi.createTemplate(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditChecklistTemplates'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: AuditChecklistTemplateRequest }) => auditChecklistApi.updateTemplate(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditChecklistTemplates'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => auditChecklistApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditChecklistTemplates'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ ...emptyForm }); setFormItems([]) }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm }); setFormItems([]); setViewMode('create') }
  const handleOpenDetail = async (item: AuditChecklistTemplate) => {
    try {
      const detail = await auditChecklistApi.getTemplateById(item.id)
      setSelectedItem(detail)
      setViewMode('detail')
    } catch {
      setSelectedItem(item)
      setViewMode('detail')
    }
  }
  const handleOpenEdit = async (item?: AuditChecklistTemplate) => {
    let target = item || selectedItem
    if (!target) return
    if (!target.items) {
      try { target = await auditChecklistApi.getTemplateById(target.id) } catch { /* use existing */ }
    }
    setSelectedItem(target)
    setForm({
      templateName: target.templateName || target.title || '', auditType: target.auditType,
      description: target.description, content: target.content || '',
      inspectionDate: target.inspectionDate || '', inspectionLocation: target.inspectionLocation || '',
      inspectionDept: target.inspectionDept || '', personInCharge: target.personInCharge || '',
      inspector: target.inspector || '', reviewer: target.reviewer || '',
      inspectionType: target.inspectionType || '', inspectionCount: target.inspectionCount || '',
      overallResult: target.overallResult || '', totalScore: target.totalScore || '',
    })
    const items = target.items?.map((i) => ({
      section: i.section, itemText: i.itemText, legalRef: i.legalRef || '', isCritical: i.isCritical, sortOrder: i.sortOrder,
    })) || []
    setFormItems(items)
    setEditorMode(target.content ? 'spreadsheet' : items.length > 0 ? 'items' : 'spreadsheet')
    setViewMode('edit')
  }
  const handleSave = () => {
    let req: any
    if (editorMode === 'spreadsheet') {
      const content = getHotContent()
      req = { ...form, content, title: form.templateName, items: [] }
    } else {
      req = { ...form, content: '', title: form.templateName, items: formItems.map((item, idx) => ({ ...item, sortOrder: idx + 1 })) }
    }
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req })
    else createMutation.mutate(req)
  }
  const handleDelete = async (item: AuditChecklistTemplate) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  let items = data?.content || []
  const totalPages = data?.totalPages || 0
  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) => (i.templateName || i.title || '').toLowerCase().includes(s) || i.templateId?.toLowerCase().includes(s))
  }

  // Group items by section for detail view
  const groupBySection = (templateItems: AuditChecklistTemplate['items']) => {
    const map: Record<string, typeof templateItems> = {}
    templateItems?.forEach((item) => {
      if (!map[item.section]) map[item.section] = []
      map[item.section].push(item)
    })
    return map
  }

  // ──────────────────── LIST VIEW ────────────────────
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* PC Search */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('audit.searchPlaceholder')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 200 }} />
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
        </Box>
        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('audit.searchPlaceholder')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>New</Button>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" stickyHeader sx={{ minWidth: 800, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>{t('audit.templateId')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.templateName')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.auditType')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.itemCount')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.description')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.templateId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.templateName || item.title}</Typography></TableCell>
                        <TableCell>{getAuditTypeLabel(item.auditType)}</TableCell>
                        <TableCell>{item.items?.length || 0}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: item.description ? 'left' : 'center' }}>{item.description || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((item) => (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                  <Typography fontWeight="bold">{item.templateName || item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getAuditTypeLabel(item.auditType)} | {item.items?.length || 0} {t('audit.items')}
                  </Typography>
                </Paper>
              ))}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  // ──────────────────── DETAIL VIEW ────────────────���───
  if (viewMode === 'detail' && selectedItem) {
    const grouped = groupBySection(selectedItem.items || [])
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          {/* 콘텐츠(HTML) 또는 항목 표시 */}
          {selectedItem.content ? (
            <>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('audit.checklistContent', '체크리스트 내용')}</Typography>
              <Box
                dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                sx={{
                  '& table': { borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' },
                  '& td, & th': { border: '1px solid #ddd', padding: '6px 10px', verticalAlign: 'middle', backgroundColor: 'transparent !important', backgroundImage: 'none !important' },
                  overflowX: 'auto',
                }}
              />
            </>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('audit.checklistItems')} ({selectedItem.items?.length || 0})</Typography>
              {Object.entries(grouped).map(([section, sectionItems]) => (
                <Box key={section} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 0.75, borderRadius: 0.5, mb: 1 }}>
                    {section}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={headerCellSx} align="center">{t('common.no', '번호')}</TableCell>
                          <TableCell sx={headerCellSx}>{t('audit.itemText')}</TableCell>
                          <TableCell sx={headerCellSx}>{t('audit.legalRef')}</TableCell>
                          <TableCell sx={headerCellSx} align="center">{t('audit.isCritical')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sectionItems.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell align="center">{idx + 1}</TableCell>
                            <TableCell>{item.itemText}</TableCell>
                            <TableCell>{item.legalRef || ''}</TableCell>
                            <TableCell align="center">
                              {item.isCritical ? <Chip label={t('audit.critical')} color="error" size="small" /> : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
            </>
          )}
        </Paper>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          <Button variant="contained" onClick={() => handleOpenEdit()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
        </Box>
      </Box>
    )
  }

  // ──────────────────── CREATE / EDIT VIEW ────────────────────
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* 체크리스트 입력 */}
        <Paper sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ pl: 1 }}>
              {t('audit.checklistContent', '체크리스트 내용')}
            </Typography>
            <ToggleButtonGroup
              value={editorMode}
              exclusive
              size="small"
              onChange={(_, v) => { if (v) setEditorMode(v) }}
            >
              <ToggleButton value="spreadsheet"><GridOnIcon fontSize="small" sx={{ mr: 0.5 }} />{t('audit.spreadsheetMode', '스프레드시트')}</ToggleButton>
              <ToggleButton value="items"><ListAltIcon fontSize="small" sx={{ mr: 0.5 }} />{t('audit.itemsMode', '항목 입력')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {editorMode === 'spreadsheet' ? (
            <>
              <Box sx={{ px: 2, pt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  엑셀에서 복사(Ctrl+C) → 셀 클릭 → 붙여넣기(Ctrl+V) | 우클릭으로 행·열 추가/삭제/병합
                </Typography>
              </Box>
              <Box sx={{ p: 2, '& .ht_master .htCore td': isDarkMode ? { backgroundColor: '#1e1e1e', color: '#e0e0e0', borderColor: '#444' } : {} }}>
                <HotTable
                  ref={hotRef}
                  data={hotData}
                  mergeCells={hotMerge.length > 0 ? hotMerge : true}
                  rowHeaders={true}
                  colHeaders={true}
                  width="100%"
                  height={450}
                  stretchH="all"
                  manualColumnResize={true}
                  manualRowResize={true}
                  contextMenu={{
                    items: {
                      row_above: { name: t('spreadsheet.insertRowBefore', '위에 행 추가') },
                      row_below: { name: t('spreadsheet.insertRowAfter', '아래에 행 추가') },
                      remove_row: { name: t('spreadsheet.deleteRow', '행 삭제') },
                      sp1: { name: '---------' },
                      col_left: { name: t('spreadsheet.insertColBefore', '왼쪽에 열 추가') },
                      col_right: { name: t('spreadsheet.insertColAfter', '오른쪽에 열 추가') },
                      remove_col: { name: t('spreadsheet.deleteCol', '열 삭제') },
                      sp2: { name: '---------' },
                      mergeCells: { name: t('spreadsheet.mergeCells', '셀 병합') },
                      alignment: { name: t('spreadsheet.alignment', '정렬') },
                    }
                  }}
                  autoWrapRow={true}
                  autoWrapCol={true}
                  outsideClickDeselects={false}
                  className={isDarkMode ? 'ht-theme-main-dark' : 'ht-theme-main'}
                  licenseKey="non-commercial-and-evaluation"
                />
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5 }}>
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleAddItem}>{t('audit.addItem', '항목 추가')}</Button>
              </Box>
              {formItems.length === 0 ? (
                <Alert severity="info" sx={{ m: 2 }}>{t('audit.noItems', '항목이 없습니다.')}</Alert>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 800, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300', py: 0.75 }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headerCellSx} align="center" width={50}>{t('common.no', '번호')}</TableCell>
                        <TableCell sx={headerCellSx} width={140}>{t('audit.section', '구분')}</TableCell>
                        <TableCell sx={headerCellSx}>{t('audit.itemText', '점검 항목')}</TableCell>
                        <TableCell sx={headerCellSx} width={160}>{t('audit.legalRef', '법적 근거')}</TableCell>
                        <TableCell sx={headerCellSx} align="center" width={60}>{t('audit.isCritical', '중요')}</TableCell>
                        <TableCell sx={headerCellSx} align="center" width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell align="center">{idx + 1}</TableCell>
                          <TableCell><TextField size="small" fullWidth value={item.section} onChange={(e) => handleItemChange(idx, 'section', e.target.value)} /></TableCell>
                          <TableCell><TextField size="small" fullWidth value={item.itemText} onChange={(e) => handleItemChange(idx, 'itemText', e.target.value)} /></TableCell>
                          <TableCell><TextField size="small" fullWidth value={item.legalRef || ''} onChange={(e) => handleItemChange(idx, 'legalRef', e.target.value)} /></TableCell>
                          <TableCell align="center"><Checkbox size="small" checked={item.isCritical || false} onChange={(e) => handleItemChange(idx, 'isCritical', e.target.checked)} /></TableCell>
                          <TableCell align="center"><IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => { if (selectedItem) { setViewMode('detail') } else { handleBackToList() } }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.templateName} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  return null
}

export default AuditChecklistTab
