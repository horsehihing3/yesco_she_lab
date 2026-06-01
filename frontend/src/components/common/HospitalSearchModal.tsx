import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'
import DaumPostcodeEmbed from 'react-daum-postcode'
import { useTranslation } from 'react-i18next'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

interface HospitalSearchModalProps {
  open: boolean
  onClose: () => void
  onSelect: (hospital: string) => void
  initialValue?: string
}

const defaultCenter = { lat: 37.5665, lng: 126.978 }

const formLabelSx = {
  width: 100,
  minWidth: 100,
  fontWeight: 'bold',
  bgcolor: 'grey.100',
  px: 2,
  py: 1.5,
  borderRight: 1,
  borderColor: 'grey.300',
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.875rem',
  justifyContent: 'center',
  wordBreak: 'keep-all',
  textAlign: 'center',
}

const formValueSx = {
  flex: 1,
  px: 2,
  py: 1,
  bgcolor: 'background.paper',
}

const HospitalSearchModal = ({ open, onClose, onSelect, initialValue }: HospitalSearchModalProps) => {
  const { t } = useTranslation()
  const [hospitalName, setHospitalName] = useState('')
  const [address, setAddress] = useState('')
  const [showPostcode, setShowPostcode] = useState(false)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null)
  const [mapZoom, setMapZoom] = useState(11)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-hospital',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: 'ko',
  })

  // Parse initial value when modal opens
  useEffect(() => {
    if (open && initialValue) {
      const match = initialValue.match(/^(.+?)\s*\((.+)\)$/)
      if (match) {
        setHospitalName(match[1])
        setAddress(match[2])
        geocodeAddress(match[2])
      } else {
        setHospitalName(initialValue)
        setAddress('')
      }
    } else if (open) {
      setHospitalName('')
      setAddress('')
      setMarkerPos(null)
      setMapCenter(defaultCenter)
      setMapZoom(11)
    }
    setShowPostcode(false)
  }, [open])

  const geocodeAddress = useCallback((addr: string) => {
    if (!isLoaded || !addr) return
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address: addr }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location
        const pos = { lat: loc.lat(), lng: loc.lng() }
        setMapCenter(pos)
        setMarkerPos(pos)
        setMapZoom(16)
      }
    })
  }, [isLoaded])

  const handlePostcodeComplete = (data: { address: string; addressType: string; bname: string; buildingName: string }) => {
    const fullAddress = data.address
    setAddress(fullAddress)
    setShowPostcode(false)
    geocodeAddress(fullAddress)
  }

  const handleConfirm = () => {
    if (!hospitalName.trim()) return
    const result = address ? `${hospitalName.trim()} (${address})` : hospitalName.trim()
    onSelect(result)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t('healthCheckup.hospitalSearch')}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {/* Form Table */}
        <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          {/* Hospital Name Row */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={formLabelSx}>
              {t('healthCheckup.hospitalName')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={formValueSx}>
              <TextField
                fullWidth
                size="small"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder={t('healthCheckup.hospitalName')}
              />
            </Box>
          </Box>
          {/* Address Row */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={formLabelSx}>{t('healthCheckup.selectedAddress')}</Typography>
            <Box sx={{ ...formValueSx, display: 'flex', alignItems: 'center', gap: 1 }}>
              {address ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <LocationOnIcon color="primary" fontSize="small" />
                  <Typography variant="body2" sx={{ flex: 1 }}>{address}</Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1 }} />
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<SearchIcon />}
                onClick={() => setShowPostcode(!showPostcode)}
                sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
              >
                {t('healthCheckup.addressSearch')}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Daum Postcode Embed */}
        {showPostcode && (
          <Box sx={{ mb: 2, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
            <DaumPostcodeEmbed
              onComplete={handlePostcodeComplete}
              style={{ height: 400 }}
              autoClose={false}
            />
          </Box>
        )}

        {/* Google Map */}
        {isLoaded && (
          <Box sx={{ height: 300, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'grey.300' }}>
            <GoogleMap
              center={mapCenter}
              zoom={mapZoom}
              mapContainerStyle={{ width: '100%', height: '100%' }}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              {markerPos && <MarkerF position={markerPos} />}
            </GoogleMap>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!hospitalName.trim()}
        >
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default HospitalSearchModal
