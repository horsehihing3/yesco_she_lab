import { useState } from 'react'
import { Box, Paper, Typography, IconButton, Button, useMediaQuery, useTheme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import FullscreenIcon from '@mui/icons-material/Fullscreen'

interface FloorPlanOverlayProps {
  factoryName: string
  onClose: () => void
  markerPosition?: { x: number; y: number }
  initialExpanded?: boolean
}

const FLOORS = [5, 4, 3, 2, 1]

const FloorPlanOverlay: React.FC<FloorPlanOverlayProps> = ({ factoryName, onClose, markerPosition, initialExpanded = true }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [fullViewFloor, setFullViewFloor] = useState<number | null>(null)

  // Only select floor, don't toggle (X button closes)
  const handleFloorClick = (floor: number) => {
    setSelectedFloor(floor)
  }

  return (
    <>
      {/* Floor Selector Buttons - Next to marker (PC) / Left edge below marker (Mobile) */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          left: isMobile ? 8 : (markerPosition ? markerPosition.x + 40 : 400),
          top: isMobile ? (markerPosition ? markerPosition.y + 10 : 50) : (markerPosition ? markerPosition.y - 100 : 100),
          bottom: 'auto',
          zIndex: 1000,
          borderRadius: 2,
          overflow: 'hidden',
          minWidth: isMobile ? 50 : 60,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            px: isMobile ? 0.75 : 1,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.5,
          }}
        >
          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: isMobile ? '0.65rem' : undefined }}>
            층별
          </Typography>
          <Box display="flex" alignItems="center" gap={0.25}>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ color: 'white', p: 0 }}
            >
              {isExpanded ? <KeyboardArrowUpIcon sx={{ fontSize: isMobile ? '1rem' : undefined }} /> : <KeyboardArrowDownIcon sx={{ fontSize: isMobile ? '1rem' : undefined }} />}
            </IconButton>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: 'white', p: 0 }}
            >
              <CloseIcon sx={{ fontSize: isMobile ? '1rem' : '1.1rem' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Floor buttons */}
        {isExpanded && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {FLOORS.map((floor) => (
              <Box
                key={floor}
                onClick={() => handleFloorClick(floor)}
                sx={{
                  px: isMobile ? 1 : 1.5,
                  py: isMobile ? 0.5 : 0.75,
                  cursor: 'pointer',
                  textAlign: 'center',
                  bgcolor: selectedFloor === floor ? 'primary.main' : 'background.paper',
                  color: selectedFloor === floor ? 'white' : 'text.primary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: selectedFloor === floor ? 'primary.dark' : 'action.hover',
                  },
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                <Typography variant="body2" fontWeight={selectedFloor === floor ? 'bold' : 'normal'} sx={{ fontSize: isMobile ? '0.75rem' : undefined }}>
                  {floor}F
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Stacked Floor Plans - only show when floor is selected */}
      {selectedFloor !== null && (
      <Box
        sx={{
          position: 'absolute',
          left: isMobile ? 90 : (markerPosition ? markerPosition.x + 140 : 500),
          top: isMobile ? (markerPosition ? markerPosition.y - 60 : 0) : (markerPosition ? markerPosition.y - 250 : 100),
          bottom: 'auto',
          transition: 'top 0.3s ease',
          width: isMobile ? 200 : 300,
          perspective: '1000px',
          perspectiveOrigin: 'center bottom',
          zIndex: 999,
        }}
      >
        {/* Cards Container */}
        <Box
          sx={{
            position: 'relative',
            transformStyle: 'preserve-3d',
          }}
        >
          <Box
            sx={{
              width: '100%',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            {/* Floor card content */}
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {/* Floor label */}
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="caption" fontWeight="bold">
                  {factoryName} - {selectedFloor}F
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<FullscreenIcon sx={{ fontSize: 14 }} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      setFullViewFloor(selectedFloor)
                    }}
                    sx={{
                      color: 'white',
                      fontSize: '0.65rem',
                      minWidth: 'auto',
                      py: 0,
                      px: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                      },
                    }}
                  >
                    크게보기
                  </Button>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFloor(null)
                    }}
                    sx={{ color: 'white', p: 0 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Floor plan image */}
              <Box
                component="img"
                src={`/floor-plans/${selectedFloor}.png`}
                alt={`${selectedFloor}층 도면`}
                sx={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
      )}

      {/* Full View Modal */}
      {fullViewFloor && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setFullViewFloor(null)}
        >
          {/* Header */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              right: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h5" color="white" fontWeight="bold">
              {factoryName} - {fullViewFloor}층 도면
            </Typography>
            <IconButton
              onClick={() => setFullViewFloor(null)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Full size image */}
          <Box
            component="img"
            src={`/floor-plans/${fullViewFloor}.png`}
            alt={`${fullViewFloor}층 도면`}
            onClick={(e) => e.stopPropagation()}
            sx={{
              maxWidth: '95%',
              maxHeight: '85%',
              objectFit: 'contain',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          />

          {/* Floor selector at bottom */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              display: 'flex',
              gap: 1,
            }}
          >
            {FLOORS.map((floor) => (
              <Box
                key={floor}
                onClick={(e) => {
                  e.stopPropagation()
                  setFullViewFloor(floor)
                }}
                sx={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: fullViewFloor === floor ? 'primary.main' : 'rgba(255,255,255,0.9)',
                  color: fullViewFloor === floor ? 'white' : 'text.primary',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {floor}F
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  )
}

export default FloorPlanOverlay
