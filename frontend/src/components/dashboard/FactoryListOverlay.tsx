import { useState, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  Collapse,
  Chip,
  Button,
  useTheme,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Factory, Zone, MOCK_ZONES, hasFactoryAlarm } from '../../types/map.types'
import FactoryIcon from '@mui/icons-material/Factory'
import MapIcon from '@mui/icons-material/Map'
import { useTranslation } from 'react-i18next'

interface FactoryListOverlayProps {
  factories: Factory[]
  selectedFactory: Factory | null
  onFactorySelect: (factory: Factory) => void
  onFactoryDoubleClick?: (factory: Factory) => void
  onBackToList: () => void
  isMobile?: boolean
}

const FactoryListOverlay: React.FC<FactoryListOverlayProps> = ({
  factories,
  selectedFactory,
  onFactorySelect,
  onFactoryDoubleClick,
  onBackToList,
  isMobile = false,
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [expanded, setExpanded] = useState(false)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle click with double-click detection
  const handleFactoryItemClick = (factory: Factory) => {
    if (clickTimerRef.current) {
      // Double click detected
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      onFactoryDoubleClick?.(factory)
    } else {
      // Wait for possible second click
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null
        onFactorySelect(factory)
      }, 250)
    }
  }

  // Get zones for selected factory
  const zones: Zone[] = selectedFactory ? MOCK_ZONES[selectedFactory.id] || [] : []

  // Status type keys for translation
  type StatusKey = 'fire' | 'noHelmet' | 'fall' | 'forkliftCollision' | 'workerCollapse' | 'normal'

  // Get factory status tags with theme-aware colors
  const getAccidentTypeStyle = (statusKey: StatusKey) => {
    const styles: Record<StatusKey, { bgcolor: string; color: string }> = {
      'fire': {
        bgcolor: isDark ? 'rgba(244, 67, 54, 0.15)' : '#ffebee',
        color: isDark ? '#ef5350' : '#c62828'
      },
      'noHelmet': {
        bgcolor: isDark ? 'rgba(255, 152, 0, 0.15)' : '#fff3e0',
        color: isDark ? '#ffb74d' : '#e65100'
      },
      'fall': {
        bgcolor: isDark ? 'rgba(244, 67, 54, 0.15)' : '#ffebee',
        color: isDark ? '#ef5350' : '#c62828'
      },
      'forkliftCollision': {
        bgcolor: isDark ? 'rgba(244, 67, 54, 0.15)' : '#ffebee',
        color: isDark ? '#ef5350' : '#c62828'
      },
      'workerCollapse': {
        bgcolor: isDark ? 'rgba(244, 67, 54, 0.15)' : '#ffebee',
        color: isDark ? '#ef5350' : '#c62828'
      },
      'normal': {
        bgcolor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#e8f5e9',
        color: isDark ? '#81c784' : '#2e7d32'
      },
    }
    return styles[statusKey] || styles['normal']
  }

  // Get factory status tags
  const getFactoryStatusTags = (factory: Factory): StatusKey[] => {
    const tags: StatusKey[] = []
    if (factory.fireStatus === 'alarm') tags.push('fire')
    if (factory.ehsStatus === 'alarm') tags.push('noHelmet')
    if (tags.length === 0) tags.push('normal')
    return tags
  }

  return (
    <Paper
      elevation={isDark ? 0 : 3}
      sx={{
        position: 'absolute',
        top: isMobile ? 48 : 10,
        left: isMobile ? 8 : undefined,
        right: isMobile ? undefined : 160,
        width: isMobile ? 'auto' : 320,
        minWidth: isMobile ? 140 : undefined,
        maxWidth: isMobile ? 200 : undefined,
        maxHeight: isMobile ? 'calc(40vh)' : 'calc(100vh - 180px)',
        overflow: 'hidden',
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        zIndex: 800,
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: isMobile ? 1 : 1.5,
          py: isMobile ? 0.75 : 1,
          bgcolor: 'primary.main',
          color: 'white',
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={0.5}>
          <FactoryIcon sx={{ fontSize: isMobile ? '0.9rem' : '1.1rem' }} />
          <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: isMobile ? '0.75rem' : undefined }}>
            {selectedFactory ? selectedFactory.name : (isMobile ? `${t('factory.title')} (${factories.length})` : `${t('factory.list')} (${factories.length})`)}
          </Typography>
        </Box>
        <Box sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </Box>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        <Box sx={{ maxHeight: isMobile ? 'calc(35vh)' : 'calc(100vh - 180px)', overflowY: 'auto' }}>
          {!selectedFactory ? (
            // Factory list view
            factories.map((factory) => (
              <Box
                key={factory.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 0.5 : 1,
                  px: isMobile ? 1 : 1.5,
                  py: isMobile ? 0.75 : 1.25,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  bgcolor: hasFactoryAlarm(factory)
                    ? (isDark ? 'rgba(244, 67, 54, 0.08)' : 'rgba(255, 245, 245, 1)')
                    : 'transparent',
                  borderLeft: hasFactoryAlarm(factory)
                    ? '3px solid #f44336'
                    : '3px solid transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isDark ? 'action.hover' : 'grey.50',
                  },
                }}
                onClick={() => handleFactoryItemClick(factory)}
              >
                <Box flex={1} sx={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-start', justifyContent: isMobile ? 'space-between' : undefined, gap: isMobile ? 1 : 0 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: isMobile ? '0.75rem' : undefined, mb: isMobile ? 0 : 0.5 }}>
                    {factory.name}
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ justifyContent: isMobile ? 'flex-end' : undefined }}>
                    {getFactoryStatusTags(factory).map((statusKey) => {
                      const style = getAccidentTypeStyle(statusKey)
                      return (
                        <Chip
                          key={statusKey}
                          label={t(`status.${statusKey}`)}
                          size="small"
                          sx={{
                            height: isMobile ? 18 : 20,
                            fontSize: isMobile ? '0.6rem' : '0.65rem',
                            fontWeight: 600,
                            bgcolor: style.bgcolor,
                            color: style.color,
                          }}
                        />
                      )
                    })}
                  </Box>
                </Box>
              </Box>
            ))
          ) : (
            // Factory detail view
            <Box p={isMobile ? 1 : 1.5}>
              {/* Factory status tags */}
              <Box mb={isMobile ? 1 : 1.5}>
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {getFactoryStatusTags(selectedFactory).map((statusKey) => {
                    const style = getAccidentTypeStyle(statusKey)
                    return (
                      <Chip
                        key={statusKey}
                        label={t(`status.${statusKey}`)}
                        size="small"
                        sx={{
                          height: isMobile ? 18 : 22,
                          fontSize: isMobile ? '0.6rem' : '0.7rem',
                          fontWeight: 600,
                          bgcolor: style.bgcolor,
                          color: style.color,
                        }}
                      />
                    )
                  })}
                </Box>
              </Box>

              {/* Zone filter - hide on mobile */}
              {!isMobile && (
                <Box mb={1.5}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">
                    {t('factory.zoneFilter')}
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    <Chip
                      label={t('common.all')}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', fontWeight: 600, height: 22 }}
                    />
                    {zones.map((zone) => (
                      <Chip
                        key={zone.id}
                        label={zone.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', fontWeight: 600, height: 22 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Alert list - hide on mobile */}
              {!isMobile && (
                <Box mb={1.5}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">
                    {t('factory.alertList')}
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: isDark ? 'grey.100' : 'grey.50',
                      borderRadius: 1,
                      p: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                      {t('factory.noAlerts')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* View Floor Plan button */}
              <Button
                fullWidth
                size="small"
                variant="contained"
                startIcon={<MapIcon />}
                onClick={() => {
                  if (selectedFactory) {
                    onFactoryDoubleClick?.(selectedFactory)
                  }
                }}
                sx={{ fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.8rem', mb: 1 }}
              >
                {t('factory.viewFloorPlan', '도면 보기')}
              </Button>

              {/* Back button */}
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={onBackToList}
                sx={{ fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.8rem' }}
              >
                {isMobile ? t('common.list') : t('factory.backToList')}
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default FactoryListOverlay
