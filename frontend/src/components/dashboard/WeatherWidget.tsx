import { useState, useEffect, useMemo } from 'react'
import { Box, Typography, Paper, CircularProgress, IconButton, Tooltip, useTheme } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import CloudIcon from '@mui/icons-material/Cloud'
import GrainIcon from '@mui/icons-material/Grain'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import ThunderstormIcon from '@mui/icons-material/Thunderstorm'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AirIcon from '@mui/icons-material/Air'
import CompressIcon from '@mui/icons-material/Compress'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from 'react-i18next'

interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: string
  skyCondition: string // 맑음, 구름많음, 흐림
  precipitationType: string // 없음, 비, 비/눈, 눈, 소나기
  precipitation: string // 강수량
  location: string
  updatedAt: string
}

interface WeatherWidgetProps {
  isMobile?: boolean
  onClose?: () => void
}

// 기상청 API 격자 좌표 (서울 기준)
const DEFAULT_NX = 60
const DEFAULT_NY = 127

// 강수 형태 코드 (기상청 API)
const PTY_CODES: { [key: string]: string } = {
  '0': 'none', // 없음
  '1': 'rain', // 비
  '2': 'rainSnow', // 비/눈
  '3': 'snow', // 눈
  '4': 'shower', // 소나기
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ isMobile = false, onClose }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'

  // Theme-aware colors
  const colors = useMemo(() => ({
    background: isDarkMode ? 'rgba(30, 30, 35, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    cardBg: isDarkMode ? 'rgba(55, 55, 65, 0.8)' : 'rgba(240, 245, 250, 0.9)',
    accent: '#29B6F6',
    textPrimary: isDarkMode ? '#FFFFFF' : '#1a1a2e',
    textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    textMuted: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    shadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
  }), [isDarkMode])

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 기상청 API base_time 계산 (매 정시 발표, 40분 이후 조회 가능)
  const getBaseTime = () => {
    const now = new Date()
    let hours = now.getHours()
    const minutes = now.getMinutes()

    // 정시 발표, 40분 이후 조회 가능하므로 40분 이전이면 이전 시간 데이터 사용
    if (minutes < 40) {
      hours = hours - 1
      if (hours < 0) {
        hours = 23
        now.setDate(now.getDate() - 1)
      }
    }

    const baseDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const baseTime = `${String(hours).padStart(2, '0')}00`

    return { baseDate, baseTime }
  }

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)

    try {
      const { baseDate, baseTime } = getBaseTime()
      const serviceKey = import.meta.env.VITE_KMA_API_KEY

      if (!serviceKey) {
        throw new Error('API key not configured')
      }

      // 기상청 API 직접 호출 (CORS 허용됨)
      const url = new URL('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst')
      url.searchParams.append('serviceKey', decodeURIComponent(serviceKey))
      url.searchParams.append('numOfRows', '10')
      url.searchParams.append('pageNo', '1')
      url.searchParams.append('dataType', 'JSON')
      url.searchParams.append('base_date', baseDate)
      url.searchParams.append('base_time', baseTime)
      url.searchParams.append('nx', DEFAULT_NX.toString())
      url.searchParams.append('ny', DEFAULT_NY.toString())

      console.log('Weather API Request:', url.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      console.log('Weather API Response:', data)

      if (data.response?.header?.resultCode === '00') {
        const items = data.response.body.items.item
        const weatherData: Partial<WeatherData> = {
          location: t('weather.defaultLocation'),
          updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        }

        items.forEach((item: { category: string; obsrValue: string }) => {
          switch (item.category) {
            case 'T1H': // 기온
              weatherData.temperature = parseFloat(item.obsrValue)
              weatherData.feelsLike = parseFloat(item.obsrValue)
              break
            case 'REH': // 습도
              weatherData.humidity = parseInt(item.obsrValue)
              break
            case 'WSD': // 풍속
              weatherData.windSpeed = parseFloat(item.obsrValue)
              break
            case 'VEC': // 풍향
              weatherData.windDirection = getWindDirection(parseInt(item.obsrValue))
              break
            case 'PTY': // 강수형태
              weatherData.precipitationType = PTY_CODES[item.obsrValue] || 'none'
              break
            case 'RN1': // 1시간 강수량
              weatherData.precipitation = item.obsrValue
              break
          }
        })

        // 하늘 상태는 강수 형태로 판단
        if (weatherData.precipitationType === 'none') {
          weatherData.skyCondition = 'clear'
        } else {
          weatherData.skyCondition = 'cloudy'
        }

        setWeather(weatherData as WeatherData)
      } else {
        console.error('API Error:', data.response?.header?.resultMsg)
        throw new Error(data.response?.header?.resultMsg || 'API Error')
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError(t('weather.fetchError'))
      // Fallback to mock data
      const mockWeather: WeatherData = {
        temperature: -3,
        feelsLike: -6,
        humidity: 53,
        windSpeed: 5.1,
        windDirection: 'NW',
        skyCondition: 'clear',
        precipitationType: 'none',
        precipitation: '0',
        location: t('weather.defaultLocation'),
        updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      }
      setWeather(mockWeather)
    } finally {
      setLoading(false)
    }
  }

  // 풍향 변환
  const getWindDirection = (degree: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degree / 22.5) % 16
    return directions[index]
  }

  // 날씨 아이콘 반환
  const getWeatherIcon = (size: number = 48) => {
    if (!weather) return <WbSunnyIcon sx={{ fontSize: size, color: '#FFD54F' }} />

    const { precipitationType, skyCondition } = weather

    switch (precipitationType) {
      case 'rain':
      case 'shower':
        return <GrainIcon sx={{ fontSize: size, color: colors.accent }} />
      case 'snow':
        return <AcUnitIcon sx={{ fontSize: size, color: '#B3E5FC' }} />
      case 'rainSnow':
        return <ThunderstormIcon sx={{ fontSize: size, color: colors.accent }} />
    }

    switch (skyCondition) {
      case 'clear':
        return <WbSunnyIcon sx={{ fontSize: size, color: '#FFD54F' }} />
      case 'partlyCloudy':
        return <CloudIcon sx={{ fontSize: size, color: colors.accent }} />
      case 'cloudy':
        return <CloudIcon sx={{ fontSize: size, color: '#90A4AE' }} />
      default:
        return <WbSunnyIcon sx={{ fontSize: size, color: '#FFD54F' }} />
    }
  }

  // 날씨 상태 텍스트
  const getWeatherText = () => {
    if (!weather) return ''

    const { precipitationType, skyCondition } = weather

    if (precipitationType !== 'none') {
      return t(`weather.precipitation.${precipitationType}`)
    }

    return t(`weather.sky.${skyCondition}`)
  }

  useEffect(() => {
    fetchWeather()
    // 30분마다 자동 갱신
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Info card component
  const InfoCard = ({ icon, value, unit, label }: { icon: React.ReactNode; value: number | string; unit?: string; label: string }) => (
    <Box
      sx={{
        bgcolor: colors.cardBg,
        borderRadius: 1.5,
        p: 1,
        minWidth: isMobile ? 60 : 70,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      {icon}
      <Typography variant="body2" fontWeight="bold" sx={{ color: colors.textPrimary }}>
        {value}
        {unit && <Typography component="span" variant="caption" sx={{ color: colors.textSecondary }}>{unit}</Typography>}
      </Typography>
      <Typography variant="caption" sx={{ color: colors.textMuted, fontSize: '0.65rem' }}>
        {label}
      </Typography>
    </Box>
  )

  if (loading && !weather) {
    return (
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: colors.background,
          backdropFilter: 'blur(12px)',
          minWidth: isMobile ? 160 : 220,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: isMobile ? 100 : 140,
          border: `1px solid ${colors.border}`,
        }}
      >
        <CircularProgress size={24} sx={{ color: colors.accent }} />
      </Paper>
    )
  }

  return (
    <Paper
      sx={{
        p: isMobile ? 1.5 : 2,
        borderRadius: 3,
        bgcolor: colors.background,
        backdropFilter: 'blur(12px)',
        minWidth: isMobile ? 160 : 220,
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
            {weather?.location}
          </Typography>
          {/* Mobile: Refresh button next to title */}
          {isMobile && (
            <Tooltip title={t('weather.refresh')}>
              <IconButton
                size="small"
                onClick={fetchWeather}
                disabled={loading}
                sx={{
                  color: colors.textSecondary,
                  '&:hover': { color: colors.accent },
                  p: 0.25,
                }}
              >
                <RefreshIcon sx={{ fontSize: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {/* PC: Refresh button at right */}
        {!isMobile && (
          <Tooltip title={t('weather.refresh')}>
            <IconButton
              size="small"
              onClick={fetchWeather}
              disabled={loading}
              sx={{
                color: colors.textSecondary,
                '&:hover': { color: colors.accent },
              }}
            >
              <RefreshIcon sx={{ fontSize: 16, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        )}
        {/* Mobile: Close button at right */}
        {isMobile && onClose && (
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: colors.textSecondary,
              '&:hover': { color: colors.accent },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* Main Weather Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {getWeatherIcon(isMobile ? 42 : 52)}
        <Box>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            fontWeight="bold"
            sx={{ color: colors.textPrimary, lineHeight: 1 }}
          >
            {weather?.temperature}°
          </Typography>
          <Typography variant="caption" sx={{ color: colors.accent, fontWeight: 500 }}>
            {getWeatherText()}
          </Typography>
        </Box>
      </Box>

      {/* Weather Info Cards */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        <InfoCard
          icon={<WaterDropIcon sx={{ fontSize: 18, color: colors.accent }} />}
          value={weather?.humidity || 0}
          unit="%"
          label={t('weather.humidity')}
        />
        <InfoCard
          icon={<AirIcon sx={{ fontSize: 18, color: colors.accent }} />}
          value={weather?.windSpeed || 0}
          unit="m/s"
          label={t('weather.wind')}
        />
        {!isMobile && (
          <InfoCard
            icon={<CompressIcon sx={{ fontSize: 18, color: colors.accent }} />}
            value={weather?.feelsLike || 0}
            unit="°"
            label={t('weather.feelsLike')}
          />
        )}
      </Box>

      {/* Updated Time */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1.5,
          textAlign: 'right',
          fontSize: '0.6rem',
          color: colors.textMuted,
        }}
      >
        {t('weather.updated')}: {weather?.updatedAt}
      </Typography>

      {/* CSS for spinning animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Paper>
  )
}

export default WeatherWidget
