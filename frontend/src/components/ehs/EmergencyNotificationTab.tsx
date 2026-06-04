import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import SmsIcon from '@mui/icons-material/Sms'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'

interface NotificationHistory {
  id: number
  title: string
  content: string
  sentAt: string
  type: 'email' | 'sms' | 'both'
  recipientCount: number
  status: 'success' | 'partial' | 'failed'
}

// Mock data for notification history
const MOCK_HISTORY: NotificationHistory[] = [
  { id: 1, title: '긴급: 화재 대피 훈련 안내', content: '금일 14:00 전체 화재 대피 훈련이 실시됩니다.', sentAt: '2024-01-15T10:30:00', type: 'both', recipientCount: 45, status: 'success' },
  { id: 2, title: '안전 점검 일정 변경 알림', content: '1월 20일 예정된 안전 점검이 1월 22일로 변경되었습니다.', sentAt: '2024-01-14T15:20:00', type: 'email', recipientCount: 30, status: 'success' },
  { id: 3, title: '긴급: 가스 누출 경보', content: 'B동 2층에서 가스 누출이 감지되었습니다. 즉시 대피하세요.', sentAt: '2024-01-13T09:45:00', type: 'sms', recipientCount: 100, status: 'partial' },
  { id: 4, title: '안전모 착용 의무화 안내', content: '공장 내 모든 구역에서 안전모 착용이 의무화됩니다.', sentAt: '2024-01-12T11:00:00', type: 'both', recipientCount: 80, status: 'success' },
  { id: 5, title: '월간 안전 교육 일정', content: '1월 월간 안전 교육이 25일 오후 2시에 진행됩니다.', sentAt: '2024-01-10T14:30:00', type: 'email', recipientCount: 50, status: 'success' },
]

type TabType = 'send' | 'history'

const EmergencyNotificationTab: React.FC = () => {
  const { t } = useTranslation()
  const { showWarning, showSuccess } = useAlert()

  const [activeTab, setActiveTab] = useState<TabType>('send')

  // Send form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [sendSms, setSendSms] = useState(true)
  const [selectedRecipients, setSelectedRecipients] = useState<UserInfo[]>([])
  const [isSending, setIsSending] = useState(false)
  const [userSelectModalOpen, setUserSelectModalOpen] = useState(false)

  // History state
  const [historyPage, setHistoryPage] = useState(0)
  const [historySearchInput, setHistorySearchInput] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const applyHistorySearch = () => setHistorySearch(historySearchInput)
  const handleHistoryResetSearch = () => { setHistorySearchInput(''); setHistorySearch('') }

  // Dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [historyDetailDialog, setHistoryDetailDialog] = useState<NotificationHistory | null>(null)

  const rowsPerPage = 10

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabType) => {
    setActiveTab(newValue)
  }

  const handleSend = () => {
    if (!title.trim()) {
      showWarning(t('common.enterTitle'))
      return
    }
    if (!content.trim()) {
      showWarning(t('common.enterContent'))
      return
    }
    if (!sendEmail && !sendSms) {
      showWarning(t('emergency.selectMethod'))
      return
    }
    if (selectedRecipients.length === 0) {
      showWarning(t('emergency.selectRecipient'))
      return
    }
    setConfirmDialogOpen(true)
  }

  const handleConfirmSend = async () => {
    setIsSending(true)
    setConfirmDialogOpen(false)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSending(false)
    showSuccess(t('emergency.sendSuccess', { count: selectedRecipients.length }))

    // Reset form
    setTitle('')
    setContent('')
    setSelectedRecipients([])
  }

  const handleUserSelectConfirm = (users: UserInfo[]) => {
    setSelectedRecipients(users)
  }

  const handleRemoveRecipient = (userId: number) => {
    setSelectedRecipients(selectedRecipients.filter(u => u.id !== userId))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const getStatusChip = (status: NotificationHistory['status']) => {
    switch (status) {
      case 'success':
        return <Chip label={t('common.success')} size="small" color="success" />
      case 'partial':
        return <Chip label={t('common.partialSuccess')} size="small" color="warning" />
      case 'failed':
        return <Chip label={t('common.failed')} size="small" color="error" />
    }
  }

  const getTypeLabel = (type: NotificationHistory['type']) => {
    switch (type) {
      case 'email':
        return <Chip icon={<EmailIcon />} label={t('emergency.email')} size="small" variant="outlined" />
      case 'sms':
        return <Chip icon={<SmsIcon />} label={t('emergency.sms')} size="small" variant="outlined" />
      case 'both':
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip icon={<EmailIcon />} label={t('emergency.email')} size="small" variant="outlined" />
            <Chip icon={<SmsIcon />} label={t('emergency.sms')} size="small" variant="outlined" />
          </Box>
        )
    }
  }

  const filteredHistory = MOCK_HISTORY.filter(h =>
    h.title.toLowerCase().includes(historySearch.toLowerCase())
  )

  // ===== Render Functions =====

  const renderSendTab = () => (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* PC용 테이블 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
          {/* 발송 방법 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('emergency.sendingMethod')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} size="small" />}
                label={<Typography sx={{ fontSize: '0.8rem' }}>{t('emergency.email')}</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} size="small" />}
                label={<Typography sx={{ fontSize: '0.8rem' }}>{t('emergency.sms')}</Typography>}
              />
            </Box>
          </Box>

          {/* 제목 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.title')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('emergency.enterTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Box>
          </Box>

          {/* 내용 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontSize: '0.875rem', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('emergency.content')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder={t('emergency.enterContent')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </Box>
          </Box>

          {/* 수신자 */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontSize: '0.875rem', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('emergency.recipient')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setUserSelectModalOpen(true)}
                >
                  {t('emergency.selectRecipient')}
                </Button>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  {t('emergency.selectedRecipients')} <strong style={{ marginLeft: 4 }}>{selectedRecipients.length}</strong>
                </Typography>
                {selectedRecipients.length > 0 && (
                  <Button size="small" color="error" onClick={() => setSelectedRecipients([])}>
                    {t('common.deselectAll')}
                  </Button>
                )}
              </Box>
              {selectedRecipients.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1, border: 1, borderColor: 'grey.300', borderRadius: 1, maxHeight: 150, overflowY: 'auto' }}>
                  {selectedRecipients.map((user) => (
                    <Chip
                      key={user.id}
                      label={`${user.name} (${user.department || ''})`}
                      size="small"
                      onDelete={() => handleRemoveRecipient(user.id)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* 모바일용 레이아웃 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emergency.sendingMethod')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, px: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} size="small" />}
                label={<Typography sx={{ fontSize: '0.8rem' }}>{t('emergency.email')}</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} size="small" />}
                label={<Typography sx={{ fontSize: '0.8rem' }}>{t('emergency.sms')}</Typography>}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('common.title')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={t('emergency.enterTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Box>

          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emergency.content')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder={t('emergency.enterContent')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Box>

          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emergency.recipient')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => setUserSelectModalOpen(true)}
              >
                {t('emergency.selectRecipient')}
              </Button>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                {t('emergency.selectedRecipients')}: <strong style={{ marginLeft: 4 }}>{selectedRecipients.length}</strong>
              </Typography>
            </Box>
            {selectedRecipients.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1, border: 1, borderColor: 'grey.300', borderRadius: 1, maxHeight: 120, overflowY: 'auto' }}>
                {selectedRecipients.map((user) => (
                  <Chip
                    key={user.id}
                    label={user.name}
                    size="small"
                    onDelete={() => handleRemoveRecipient(user.id)}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* 발송 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : undefined}
            onClick={handleSend}
            disabled={isSending}
            sx={{ minWidth: 150 }}
          >
            {isSending ? t('common.sending') : t('emergency.sendEmergency')}
          </Button>
        </Box>
    </Box>
  )

  const renderHistoryTab = () => (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Search */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <ListSearchBar
          placeholder={t('common.searchByTitle')}
          value={historySearchInput}
          onChange={setHistorySearchInput}
          onSearch={applyHistorySearch}
          sx={{ width: { xs: '100%', md: 300 } }}
        />
        <IconButton onClick={handleHistoryResetSearch} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('common.title')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 180 }} align="center">{t('emergency.sendDateTime')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 150 }} align="center">{t('emergency.sendingMethod')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">{t('emergency.recipient')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">{t('common.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('emergency.noSendingHistory')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.slice(historyPage * rowsPerPage, (historyPage + 1) * rowsPerPage).map((history) => (
                <TableRow
                  key={history.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setHistoryDetailDialog(history)}
                >
                  <TableCell align="center">{history.title}</TableCell>
                  <TableCell align="center">{formatDate(history.sentAt)}</TableCell>
                  <TableCell align="center">{getTypeLabel(history.type)}</TableCell>
                  <TableCell align="center">{history.recipientCount}명</TableCell>
                  <TableCell align="center">{getStatusChip(history.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {filteredHistory.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('emergency.noSendingHistory')}</Typography>
          </Paper>
        ) : (
          filteredHistory.slice(historyPage * rowsPerPage, (historyPage + 1) * rowsPerPage).map((history) => (
            <Paper
              key={history.id}
              sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'grey.300' }}
              onClick={() => setHistoryDetailDialog(history)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography fontWeight="bold">{history.title}</Typography>
                {getStatusChip(history.status)}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('emergency.sendDateTime')}</Typography>
                  <Typography variant="body2">{formatDate(history.sentAt)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('emergency.sendingMethod')}</Typography>
                  {getTypeLabel(history.type)}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('emergency.recipient')}</Typography>
                  <Typography variant="body2">{history.recipientCount}</Typography>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.ceil(filteredHistory.length / rowsPerPage) || 1}
          page={historyPage + 1}
          onChange={(_, newPage) => setHistoryPage(newPage - 1)}
          color="primary"
        />
      </Box>
    </Box>
  )

  return (
    <Box>
      <Box>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label={t('emergency.sendEmergency')} value="send" />
          <Tab label={t('emergency.sendingHistory')} value="history" />
        </Tabs>
      </Box>

      {activeTab === 'send' && renderSendTab()}
      {activeTab === 'history' && renderHistoryTab()}

      {/* Confirm Send Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'grey.300' }}>{t('emergency.confirmSendTitle')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ mb: 2 }}>{t('emergency.confirmSendMessage')}</Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
            <Typography variant="body2"><strong>{t('common.title')}:</strong> {title}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>{t('emergency.sendingMethod')}:</strong> {[sendEmail && t('emergency.email'), sendSms && t('emergency.sms')].filter(Boolean).join(', ')}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>{t('emergency.recipient')}:</strong> {selectedRecipients.length}</Typography>
          </Box>
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {t('emergency.cannotCancel')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 1, p: 2 }}>
          <Button variant="outlined" onClick={() => setConfirmDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleConfirmSend}>
            {t('emergency.sendConfirmation')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Detail Dialog */}
      <Dialog open={!!historyDetailDialog} onClose={() => setHistoryDetailDialog(null)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'grey.300' }}>{t('emergency.sendingDetails')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {historyDetailDialog && (
            <>
              {/* PC용 폼 테이블 레이아웃 */}
              <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mt: 2 }}>
                {/* 제목 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
                  <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('common.title')}
                  </Typography>
                  <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                    {historyDetailDialog.title}
                  </Typography>
                </Box>
                {/* 내용 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
                  <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('emergency.content')}
                  </Typography>
                  <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', minHeight: 80 }}>
                    {historyDetailDialog.content}
                  </Typography>
                </Box>
                {/* 발송일시 | 발송방법 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
                  <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('emergency.sendDateTime')}
                  </Typography>
                  <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'grey.300', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                    {formatDate(historyDetailDialog.sentAt)}
                  </Typography>
                  <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('emergency.sendingMethod')}
                  </Typography>
                  <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                    {getTypeLabel(historyDetailDialog.type)}
                  </Box>
                </Box>
                {/* 수신자 수 | 상태 */}
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('emergency.recipientCount')}
                  </Typography>
                  <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'grey.300', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                    {historyDetailDialog.recipientCount}
                  </Typography>
                  <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('common.status')}
                  </Typography>
                  <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                    {getStatusChip(historyDetailDialog.status)}
                  </Box>
                </Box>
              </Box>

              {/* 모바일용 레이아웃 */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
                  <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{historyDetailDialog.title}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emergency.content')}</Typography>
                  <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{historyDetailDialog.content}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emergency.sendDateTime')}</Typography>
                  <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatDate(historyDetailDialog.sentAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emergency.sendingMethod')}</Typography>
                  <Box sx={{ px: 1.5, py: 0.5 }}>{getTypeLabel(historyDetailDialog.type)}</Box>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emergency.recipientCount')}</Typography>
                  <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{historyDetailDialog.recipientCount}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.status')}</Typography>
                  <Box sx={{ px: 1.5, py: 0.5 }}>{getStatusChip(historyDetailDialog.status)}</Box>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setHistoryDetailDialog(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* User Select Modal */}
      <UserSelectModal
        open={userSelectModalOpen}
        onClose={() => setUserSelectModalOpen(false)}
        selectedUsers={selectedRecipients}
        onConfirm={handleUserSelectConfirm}
        title={t('emergency.selectRecipient')}
        useCompanyTree
      />
    </Box>
  )
}

export default EmergencyNotificationTab
