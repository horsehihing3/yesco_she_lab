import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  Chip,
  Button,
  useTheme,
  Modal,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import AssessmentIcon from '@mui/icons-material/Assessment'
import VideocamIcon from '@mui/icons-material/Videocam'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import WarningIcon from '@mui/icons-material/Warning'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import AirIcon from '@mui/icons-material/Air'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useTranslation } from 'react-i18next'
import {
  CCTVCamera,
  EventType,
  EVENT_TYPE_INFO,
  MOCK_CAMERAS,
  MOCK_ANALYSIS_RESULTS,
} from '../../types/map.types'

// Event type icon mapping
const getEventIcon = (eventType: EventType, size: 'small' | 'inherit' = 'small') => {
  const iconProps = { fontSize: size as any, sx: { fontSize: size === 'small' ? '0.9rem' : 'inherit' } }
  switch (eventType) {
    case 'fire': return <LocalFireDepartmentIcon {...iconProps} />
    case 'helmet': return <HealthAndSafetyIcon {...iconProps} />
    case 'fall': return <WarningIcon {...iconProps} />
    case 'forklift': return <LocalShippingIcon {...iconProps} />
    case 'collapse': return <PersonOffIcon {...iconProps} />
    case 'gas_leak': return <AirIcon {...iconProps} />
    case 'normal': return <CheckCircleIcon {...iconProps} />
    default: return <WarningIcon {...iconProps} />
  }
}

interface CCTVAnalysisPanelProps {
  onClose: () => void
  factoryId?: string | null
  isMobile?: boolean
}

type TabType = 'all' | 'cctv'
type FilterType = 'all' | EventType

// Event type to video mapping
const EVENT_VIDEOS: Record<EventType, string> = {
  fire: '/videos/video1.mp4',
  helmet: '/videos/video2.mp4',
  fall: '/videos/video3.mp4',
  forklift: '/videos/video4.mp4',
  collapse: '/videos/video5.mp4',
  gas_leak: '/videos/video6.mp4',
  normal: '/videos/video1.mp4',
}

const getVideoByEventType = (eventType: EventType) => EVENT_VIDEOS[eventType] || '/videos/video1.mp4'

const CCTVAnalysisPanel: React.FC<CCTVAnalysisPanelProps> = ({ onClose, factoryId, isMobile = false }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedCamera, setSelectedCamera] = useState<CCTVCamera | null>(null)
  const [eventFilter, setEventFilter] = useState<FilterType>('all')
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')

  // Open video modal with event-specific video
  const handlePlayVideo = (e: React.MouseEvent, eventType: EventType) => {
    e.stopPropagation()
    e.preventDefault()
    const videoUrl = getVideoByEventType(eventType)
    console.log('Play video clicked, Event:', eventType, 'URL:', videoUrl)
    setCurrentVideoUrl(videoUrl)
    setVideoModalOpen(true)
  }

  // Close video modal
  const handleCloseVideo = () => {
    setVideoModalOpen(false)
    setCurrentVideoUrl('')
  }

  // Filter cameras by factory if factoryId is provided
  const cameras = factoryId
    ? MOCK_CAMERAS.filter((c) => c.factoryId === factoryId)
    : MOCK_CAMERAS

  // Get analysis results, filtered by factory if provided
  const analysisResults = factoryId
    ? MOCK_ANALYSIS_RESULTS.filter((r) => {
        const camera = MOCK_CAMERAS.find((c) => c.id === r.cameraId)
        return camera?.factoryId === factoryId
      })
    : MOCK_ANALYSIS_RESULTS

  // Filter results by event type
  const filteredResults =
    eventFilter === 'all'
      ? analysisResults
      : analysisResults.filter((r) => r.eventType === eventFilter)

  // Get results for selected camera
  const cameraResults = selectedCamera
    ? filteredResults.filter((r) => r.cameraId === selectedCamera.id)
    : []

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 60) return t('cctv.minutesAgo', { count: diffMin })
    if (diffMin < 1440) return t('cctv.hoursAgo', { count: Math.floor(diffMin / 60) })
    return date.toISOString().substring(0, 10)
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#f44336'
      case 'high':
        return '#ff5722'
      case 'medium':
        return '#ff9800'
      case 'low':
        return '#4caf50'
      default:
        return '#9e9e9e'
    }
  }

  // Fixed event filter rows (English has 3 rows due to longer text)
  const ROW1: (FilterType)[] = ['all', 'fire', 'helmet', 'fall']
  const ROW2: EventType[] = language === 'en' ? ['forklift', 'collapse'] : ['forklift', 'collapse', 'gas_leak']
  const ROW3: EventType[] = language === 'en' ? ['gas_leak'] : []

  // Render event type filter chips
  const renderEventFilters = () => (
    <Box sx={{ mb: 1.5 }}>
      {/* Row 1 */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
        {ROW1.map((type) => {
          if (type === 'all') {
            const isSelected = eventFilter === 'all'
            return (
              <Chip
                key="all"
                label={t('common.all')}
                size="small"
                clickable
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={() => setEventFilter('all')}
                sx={{
                  fontSize: '0.7rem',
                  height: 24,
                  transition: 'all 0.2s',
                  ...(isSelected && {
                    bgcolor: 'primary.main',
                    color: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '2px solid',
                    borderColor: 'primary.dark',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }),
                }}
              />
            )
          }
          const info = EVENT_TYPE_INFO[type]
          const isSelected = eventFilter === type
          return (
            <Chip
              key={type}
              icon={getEventIcon(type)}
              label={t(info.labelKey)}
              size="small"
              clickable
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => setEventFilter(type)}
              sx={{
                fontSize: '0.7rem',
                height: 24,
                transition: 'all 0.2s',
                '& .MuiChip-icon': { fontSize: '0.85rem', ml: 0.5 },
                ...(isSelected && {
                  bgcolor: info.color,
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  border: '2px solid',
                  borderColor: info.color,
                  '& .MuiChip-icon': { color: 'white', fontSize: '0.85rem', ml: 0.5 },
                  '&:hover': { bgcolor: info.color, opacity: 0.9 },
                }),
              }}
            />
          )
        })}
      </Box>
      {/* Row 2 */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: ROW3.length > 0 ? 0.5 : 0 }}>
        {ROW2.map((type) => {
          const info = EVENT_TYPE_INFO[type]
          const isSelected = eventFilter === type
          return (
            <Chip
              key={type}
              icon={getEventIcon(type)}
              label={t(info.labelKey)}
              size="small"
              clickable
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => setEventFilter(type)}
              sx={{
                fontSize: '0.7rem',
                height: 24,
                transition: 'all 0.2s',
                '& .MuiChip-icon': { fontSize: '0.85rem', ml: 0.5 },
                ...(isSelected && {
                  bgcolor: info.color,
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  border: '2px solid',
                  borderColor: info.color,
                  '& .MuiChip-icon': { color: 'white', fontSize: '0.85rem', ml: 0.5 },
                  '&:hover': { bgcolor: info.color, opacity: 0.9 },
                }),
              }}
            />
          )
        })}
      </Box>
      {/* Row 3 (English only) */}
      {ROW3.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {ROW3.map((type) => {
            const info = EVENT_TYPE_INFO[type]
            const isSelected = eventFilter === type
            return (
              <Chip
                key={type}
                icon={getEventIcon(type)}
                label={t(info.labelKey)}
                size="small"
                clickable
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={() => setEventFilter(type)}
                sx={{
                  fontSize: '0.7rem',
                  height: 24,
                  transition: 'all 0.2s',
                  '& .MuiChip-icon': { fontSize: '0.85rem', ml: 0.5 },
                  ...(isSelected && {
                    bgcolor: info.color,
                    color: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '2px solid',
                    borderColor: info.color,
                    '& .MuiChip-icon': { color: 'white', fontSize: '0.85rem', ml: 0.5 },
                    '&:hover': { bgcolor: info.color, opacity: 0.9 },
                  }),
                }}
              />
            )
          })}
        </Box>
      )}
    </Box>
  )

  // Render camera detail view
  const renderCameraDetail = () => (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => setSelectedCamera(null)}
        size="small"
        sx={{ mb: 1.5 }}
      >
        {t('common.backToList')}
      </Button>

      <Box
        sx={{
          mb: 1.5,
          p: 1.5,
          bgcolor: isDark ? '#27272a' : 'grey.50',
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {selectedCamera?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {selectedCamera?.factoryName} - {selectedCamera?.zoneName}
        </Typography>
        <Chip
          label={selectedCamera?.status === 'active' ? t('common.active') : t('common.inactive')}
          size="small"
          color={selectedCamera?.status === 'active' ? 'success' : 'default'}
          sx={{ mt: 0.5, ml: 1 }}
        />
      </Box>

      <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">
        {t('cctv.analysisResults', { count: cameraResults.length })}
      </Typography>

      {cameraResults.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          {t('cctv.noAnalysisResults')}
        </Typography>
      ) : (
        <List disablePadding>
          {cameraResults.map((result) => {
            const eventInfo = EVENT_TYPE_INFO[result.eventType]
            return (
              <ListItem
                key={result.id}
                disablePadding
                sx={{
                  mb: 0.75,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <ListItemButton sx={{ p: 1.25 }} onClick={(e) => handlePlayVideo(e, result.eventType)}>
                  <Box sx={{ width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Chip
                        icon={getEventIcon(result.eventType)}
                        label={t(eventInfo.labelKey)}
                        size="small"
                        sx={{
                          bgcolor: eventInfo.color,
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 22,
                          '& .MuiChip-icon': { color: 'white', fontSize: '0.85rem', ml: 0.5 },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(result.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontSize="0.8rem" sx={{ mt: 0.5 }}>
                      {result.metadata?.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                        {t('cctv.confidence', { value: Math.round(result.confidence * 100) })}
                      </Typography>
                      <PlayCircleIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      )}
    </Box>
  )

  // Render event list view
  const renderEventList = () => (
    <Box>
      {renderEventFilters()}

      <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">
        {t('cctv.recentEvents', { count: filteredResults.length })}
      </Typography>

      {filteredResults.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          {t('cctv.noEvents')}
        </Typography>
      ) : (
        <List disablePadding sx={{ maxHeight: isMobile ? 'calc(20vh)' : 'calc(100vh - 380px)', overflowY: 'auto' }}>
          {filteredResults.map((result) => {
            const eventInfo = EVENT_TYPE_INFO[result.eventType]
            return (
              <ListItem
                key={result.id}
                disablePadding
                sx={{
                  mb: 0.75,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  borderLeft: `3px solid ${getSeverityColor(result.severity)}`,
                  overflow: 'hidden',
                }}
              >
                <ListItemButton
                  sx={{ p: 1.25 }}
                  onClick={(e) => handlePlayVideo(e, result.eventType)}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Chip
                        icon={getEventIcon(result.eventType)}
                        label={t(eventInfo.labelKey)}
                        size="small"
                        sx={{
                          bgcolor: eventInfo.color,
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 22,
                          '& .MuiChip-icon': { color: 'white', fontSize: '0.85rem', ml: 0.5 },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                        {formatTime(result.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium" fontSize="0.8rem" sx={{ mt: 0.25 }}>
                      {result.metadata?.factoryName} - {result.metadata?.zoneName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ mt: 0.25 }}>
                      {result.metadata?.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <VideocamIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                          {result.metadata?.cameraName} | {t('cctv.confidence', { value: Math.round(result.confidence * 100) })}
                        </Typography>
                      </Box>
                      <PlayCircleIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      )}
    </Box>
  )

  // Render camera list view (for CCTV tab)
  const renderCameraList = () => (
    <Box>
      <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">
        {t('cctv.cameras', { count: cameras.length })}
      </Typography>

      <List disablePadding sx={{ maxHeight: isMobile ? 'calc(20vh)' : 'calc(100vh - 320px)', overflowY: 'auto' }}>
        {cameras.map((camera) => {
          const cameraEventCount = analysisResults.filter((r) => r.cameraId === camera.id).length
          return (
            <ListItem
              key={camera.id}
              disablePadding
              sx={{
                mb: 0.75,
                border: `1px solid ${camera.fireDetected ? theme.palette.error.main : theme.palette.divider}`,
                borderRadius: 1,
                bgcolor: camera.fireDetected ? (isDark ? 'rgba(244, 67, 54, 0.1)' : 'error.50') : 'transparent',
              }}
            >
              <ListItemButton sx={{ p: 1.25 }} onClick={() => setSelectedCamera(camera)}>
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <VideocamIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                      <Typography variant="subtitle2" fontWeight="bold" fontSize="0.85rem">
                        {camera.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={camera.status === 'active' ? t('common.active') : t('common.inactive')}
                      size="small"
                      color={camera.status === 'active' ? 'success' : 'default'}
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" mt={0.25} display="block">
                    {camera.factoryName} - {camera.zoneName}
                  </Typography>
                  {camera.fireDetected && (
                    <Chip
                      icon={<LocalFireDepartmentIcon sx={{ fontSize: '0.85rem !important' }} />}
                      label={t('cctv.fireDetected')}
                      size="small"
                      color="error"
                      sx={{ mt: 0.5, fontSize: '0.65rem', height: 20, '& .MuiChip-icon': { ml: 0.5 } }}
                    />
                  )}
                  {cameraEventCount > 0 && !camera.fireDetected && (
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                      {t('cctv.recentEvents', { count: cameraEventCount })}
                    </Typography>
                  )}
                </Box>
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )

  return (
    <>
    <Paper
      elevation={isDark ? 0 : 3}
      sx={{
        width: isMobile ? '100%' : 340,
        maxHeight: isMobile ? 'calc(30vh)' : 'calc(50vh - 60px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: isMobile ? 1.5 : 0,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? '#18181b' : 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box display="flex" alignItems="center" gap={0.75}>
          <AssessmentIcon sx={{ fontSize: '1.1rem' }} />
          <Typography variant="subtitle2" fontWeight="bold">
            {t('cctv.eventAnalysis')}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white', p: 0.25 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tabs */}
      {!selectedCamera && (
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            bgcolor: isDark ? '#09090b' : 'grey.50',
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
              fontSize: '0.8rem',
              fontWeight: 'bold',
              borderRadius: 0,
              color: isDark ? '#71717a' : 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                borderRadius: 0,
                bgcolor: isDark ? '#27272a' : 'rgba(25,118,210,0.06)',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 0,
              bgcolor: 'primary.main',
            },
          }}
        >
          <Tab label={t('common.all')} value="all" />
          <Tab icon={<VideocamIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="CCTV" value="cctv" sx={{ minHeight: 36, '& .MuiTab-iconWrapper': { mr: 0.5 } }} />
        </Tabs>
      )}

      {/* Content */}
      <Box sx={{ p: 1.5, overflowY: 'auto', flex: 1 }}>
        {selectedCamera ? (
          renderCameraDetail()
        ) : activeTab === 'all' ? (
          renderEventList()
        ) : (
          renderCameraList()
        )}
      </Box>

    </Paper>

    {/* Video Modal - Outside Paper for proper z-index */}
    <Modal
      open={videoModalOpen}
      onClose={handleCloseVideo}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: isMobile ? '95vw' : '80vw',
          maxWidth: 1200,
          maxHeight: '90vh',
          bgcolor: 'black',
          borderRadius: 2,
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Close button */}
        <IconButton
          onClick={handleCloseVideo}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 10,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Video player */}
        {currentVideoUrl && (
          <video
            src={currentVideoUrl}
            controls
            autoPlay
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '90vh',
              display: 'block',
            }}
          />
        )}
      </Box>
    </Modal>
  </>
  )
}

export default CCTVAnalysisPanel
