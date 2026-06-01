import { Box, Paper, Typography, IconButton, List, ListItem, Chip, useTheme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DashboardStatistics, EhsMessageResponse, EhsAlertResponse } from '../../types/dashboard.types'
import { Factory } from '../../types/map.types'

interface EHSStatusPanelProps {
  factory: Factory | null
  statistics: DashboardStatistics | null
  messages: EhsMessageResponse[]
  alerts: EhsAlertResponse[]
  onClose: () => void
  isMobile?: boolean
}

// Status dot colors
const STATUS_COLORS = {
  blue: '#2196f3',
  yellow: '#ff9800',
  green: '#4caf50',
  red: '#f44336',
}

// Category mapping for i18n (DB value -> i18n key)
// Using lowercase keys for case-insensitive matching
const CATEGORY_MAP: Record<string, string> = {
  // Korean
  '안전': 'messageCategories.safety',
  '보건': 'messageCategories.health',
  '환경': 'messageCategories.environment',
  '일반': 'messageCategories.general',
  // English (lowercase for case-insensitive matching)
  'safety': 'messageCategories.safety',
  'health': 'messageCategories.health',
  'environment': 'messageCategories.environment',
  'general': 'messageCategories.general',
  // Chinese
  '安全': 'messageCategories.safety',
  '健康': 'messageCategories.health',
  '环境': 'messageCategories.environment',
  '一般': 'messageCategories.general',
}

// Helper function for case-insensitive category lookup
const getCategoryKey = (category: string | undefined): string => {
  if (!category) return 'messageCategories.general'
  // Try exact match first
  if (CATEGORY_MAP[category]) return CATEGORY_MAP[category]
  // Try lowercase match
  const lowerCategory = category.toLowerCase()
  if (CATEGORY_MAP[lowerCategory]) return CATEGORY_MAP[lowerCategory]
  return 'messageCategories.general'
}

// Helper function to get localized title
const getLocalizedTitle = (
  message: EhsMessageResponse,
  language: string
): string => {
  if (language === 'en' && message.titleEn) return message.titleEn
  if (language === 'zh' && message.titleZh) return message.titleZh
  return message.title // Default to Korean
}

interface StatusRowProps {
  color: keyof typeof STATUS_COLORS
  label: string
  count: number
}

interface StatusRowPropsWithT extends StatusRowProps {
  t: (key: string) => string
  language: string
}

const StatusRow: React.FC<StatusRowPropsWithT> = ({ color, label, count, t, language }) => (
  <Box display="flex" alignItems="center" gap={0.75} py={0.25}>
    <Box
      sx={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        bgcolor: STATUS_COLORS[color],
        flexShrink: 0,
      }}
    />
    <Typography variant="caption" flex={1} color="text.secondary">
      {label}
    </Typography>
    <Typography variant="caption" fontWeight="bold">
      {count}{(language === 'ko' || language === 'zh') ? t('common.cases') : ''}
    </Typography>
  </Box>
)

const EHSStatusPanel: React.FC<EHSStatusPanelProps> = ({
  factory,
  statistics,
  messages,
  alerts,
  onClose,
  isMobile = false,
}) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const safetyWork = statistics?.safetyWork
  const nearMiss = statistics?.nearMiss

  return (
    <Paper
      elevation={isDark ? 0 : 3}
      sx={{
        width: isMobile ? '100%' : 340,
        maxHeight: isMobile ? 'calc(30vh)' : 'calc(50vh - 60px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.5,
          py: 1,
          bgcolor: 'primary.main',
          color: 'white',
          flexShrink: 0,
        }}
      >
        <Box display="flex" alignItems="center" gap={0.75}>
          <WarningAmberIcon sx={{ fontSize: '1.1rem' }} />
          <Typography variant="subtitle2" fontWeight="bold">
            {t('dashboard.ehsStatus')}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white', p: 0.25 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box flex={1} overflow="auto" p={1.5}>
        {/* Selected factory info */}
        {factory && (
          <Box
            sx={{
              bgcolor: isDark ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 243, 224, 1)',
              p: 1,
              borderRadius: 1,
              mb: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: `1px solid ${isDark ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.5)'}`,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {factory.name}
            </Typography>
            <Chip
              label={factory.ehsStatus === 'alarm' ? t('dashboard.warning') : t('status.normal')}
              size="small"
              sx={{
                bgcolor: factory.ehsStatus === 'alarm' ? '#f44336' : '#4caf50',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.65rem',
                height: 20,
              }}
            />
          </Box>
        )}

        {/* Dashboard Status Board */}
        <Box
          sx={{
            bgcolor: isDark ? '#0d1421' : '#f5f5f5',
            borderRadius: 1.5,
            p: 1.5,
            mb: 1.5,
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e0e0e0',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 1,
            }}
          >
            {/* EHS */}
            <Box
              sx={{
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 },
              }}
              onClick={() => navigate('/ehs')}
            >
              <Typography
                sx={{
                  color: isDark ? '#4fc3f7' : '#1976d2',
                  fontWeight: 900,
                  fontSize: '2.6rem',
                  fontFamily: '"Arial Black", "Helvetica Black", sans-serif',
                  textShadow: isDark ? '0 0 10px rgba(79, 195, 247, 0.5)' : '1px 1px 0 rgba(0,0,0,0.1)',
                  WebkitTextStroke: isDark ? '0.5px #4fc3f7' : '0.5px #1976d2',
                  lineHeight: 1.2,
                }}
              >
                {safetyWork?.total || 0}
              </Typography>
              <Typography
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.9)' : '#424242',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  mt: 0.5,
                }}
              >
                EHS
              </Typography>
            </Box>

            {/* 위험성 평가 */}
            <Box
              sx={{
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 },
              }}
              onClick={() => navigate('/risk-assessment')}
            >
              <Typography
                sx={{
                  color: isDark ? '#ffb74d' : '#f57c00',
                  fontWeight: 900,
                  fontSize: '2.6rem',
                  fontFamily: '"Arial Black", "Helvetica Black", sans-serif',
                  textShadow: isDark ? '0 0 10px rgba(255, 183, 77, 0.5)' : '1px 1px 0 rgba(0,0,0,0.1)',
                  WebkitTextStroke: isDark ? '0.5px #ffb74d' : '0.5px #f57c00',
                  lineHeight: 1.2,
                }}
              >
                {statistics?.riskAssessment?.total || 0}
              </Typography>
              <Typography
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.9)' : '#424242',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  mt: 0.5,
                }}
              >
                {t('nav.riskAssessment')}
              </Typography>
            </Box>

            {/* 아차사고 */}
            <Box
              sx={{
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 },
              }}
              onClick={() => navigate('/near-miss')}
            >
              <Typography
                sx={{
                  color: isDark ? '#ef5350' : '#d32f2f',
                  fontWeight: 900,
                  fontSize: '2.6rem',
                  fontFamily: '"Arial Black", "Helvetica Black", sans-serif',
                  textShadow: isDark ? '0 0 10px rgba(239, 83, 80, 0.5)' : '1px 1px 0 rgba(0,0,0,0.1)',
                  WebkitTextStroke: isDark ? '0.5px #ef5350' : '0.5px #d32f2f',
                  lineHeight: 1.2,
                }}
              >
                {nearMiss?.total || 0}
              </Typography>
              <Typography
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.9)' : '#424242',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  mt: 0.5,
                }}
              >
                {t('nav.nearMiss')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Safety Work & Near Miss Grid */}
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={1.5}>
          {/* Safety Work */}
          <Box
            sx={{
              bgcolor: isDark ? 'grey.100' : 'grey.50',
              p: 1.25,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: isDark ? 'action.hover' : 'grey.100',
                borderColor: 'primary.main',
              },
            }}
            onClick={() => navigate('/safety-work')}
          >
            <Typography variant="caption" fontWeight="bold" mb={0.75} display="block">
              {t('nav.safetyWork')}
            </Typography>
            <Box>
              <StatusRow color="blue" label={t('safetyWork.status.draft')} count={safetyWork?.draft || 0} t={t} language={language} />
              <StatusRow color="blue" label={t('safetyWork.status.review')} count={safetyWork?.review || 0} t={t} language={language} />
              <StatusRow color="yellow" label={t('safetyWork.status.approved')} count={safetyWork?.approved || 0} t={t} language={language} />
              <StatusRow color="green" label={t('safetyWork.status.completed')} count={safetyWork?.completed || 0} t={t} language={language} />
              <StatusRow color="red" label={t('safetyWork.status.rejected')} count={safetyWork?.rejected || 0} t={t} language={language} />
            </Box>
          </Box>

          {/* Near Miss */}
          <Box
            sx={{
              bgcolor: isDark ? 'grey.100' : 'grey.50',
              p: 1.25,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: isDark ? 'action.hover' : 'grey.100',
                borderColor: 'primary.main',
              },
            }}
            onClick={() => navigate('/near-miss')}
          >
            <Typography variant="caption" fontWeight="bold" mb={0.75} display="block">
              {t('nav.nearMiss')}
            </Typography>
            <Box>
              <StatusRow color="blue" label={t('safetyWork.status.requested')} count={nearMiss?.pending || 0} t={t} language={language} />
              <StatusRow color="yellow" label={t('safetyWork.status.inProgress')} count={nearMiss?.inProgress || 0} t={t} language={language} />
              <StatusRow color="green" label={t('safetyWork.status.completed')} count={nearMiss?.completed || 0} t={t} language={language} />
              <StatusRow color="red" label={t('safetyWork.status.rejected')} count={nearMiss?.rejected || 0} t={t} language={language} />
            </Box>
          </Box>
        </Box>

        {/* EHS Message */}
        <Box>
          <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">
            EHS Message
          </Typography>
          {messages.length === 0 ? (
            <Typography variant="caption" color="text.secondary" textAlign="center" py={1.5} display="block">
              {t('dashboard.noMessages')}
            </Typography>
          ) : (
            <List dense disablePadding>
              {messages.slice(0, 3).map((message) => (
                <ListItem
                  key={message.id}
                  disablePadding
                  sx={{
                    bgcolor: isDark ? 'grey.100' : 'grey.50',
                    borderRadius: 0.75,
                    mb: 0.5,
                    cursor: 'pointer',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': { bgcolor: isDark ? 'action.hover' : 'grey.100' },
                  }}
                  onClick={() => navigate(`/ehs?tab=2&messageId=${message.id}`)}
                >
                  <Box display="flex" gap={1} p={1} alignItems="flex-start" width="100%">
                    <Chip
                      label={t(getCategoryKey(message.category))}
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '0.6rem',
                        height: 18,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        flex: 1,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getLocalizedTitle(message, language)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Paper>
  )
}

export default EHSStatusPanel
