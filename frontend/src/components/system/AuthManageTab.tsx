import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Paper,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  Chip,
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import { useThemeMode } from '../../context/ThemeContext'
import { useAlert } from '../../contexts/AlertContext'

const AUTH_METHODS = [
  {
    value: 'SYSTEM',
    labelKey: 'authManage.systemLogin',
    descKey: 'authManage.systemLoginDesc',
    icon: <LockIcon sx={{ fontSize: 28 }} />,
    color: '#1976d2',
  },
  {
    value: 'MICROSOFT_ENTRA',
    labelKey: 'authManage.microsoftEntra',
    descKey: 'authManage.microsoftEntraDesc',
    icon: (
      <svg width="28" height="28" viewBox="0 0 23 23">
        <rect x="1" y="1" width="10" height="10" fill="#f25022" />
        <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
        <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
        <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
      </svg>
    ),
    color: '#00a4ef',
  },
  {
    value: 'GOOGLE',
    labelKey: 'authManage.googleAuth',
    descKey: 'authManage.googleAuthDesc',
    icon: (
      <svg width="28" height="28" viewBox="0 0 48 48">
        <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
        <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
        <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
        <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
      </svg>
    ),
    color: '#4285F4',
  },
  {
    value: 'SNS',
    labelKey: 'authManage.snsAuth',
    descKey: 'authManage.snsAuthDesc',
    icon: (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#FEE500" />
          <path d="M12 6.5c-3.59 0-6.5 2.2-6.5 4.92 0 1.74 1.16 3.27 2.91 4.14l-.74 2.73c-.06.22.19.4.38.28l3.27-2.16c.22.02.44.03.68.03 3.59 0 6.5-2.2 6.5-4.92S15.59 6.5 12 6.5z" fill="#3C1E1E" />
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#03C75A" />
          <path d="M8 7h2.8l3.2 4.8V7H16v10h-2.8L10 12.2V17H8V7z" fill="white" />
        </svg>
      </Box>
    ),
    color: '#FEE500',
    subOptions: [
      {
        value: 'KAKAO',
        labelKey: 'authManage.kakao',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#FEE500" />
            <path d="M12 6.5c-3.59 0-6.5 2.2-6.5 4.92 0 1.74 1.16 3.27 2.91 4.14l-.74 2.73c-.06.22.19.4.38.28l3.27-2.16c.22.02.44.03.68.03 3.59 0 6.5-2.2 6.5-4.92S15.59 6.5 12 6.5z" fill="#3C1E1E" />
          </svg>
        ),
      },
      {
        value: 'NAVER',
        labelKey: 'authManage.naver',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <rect width="24" height="24" rx="4" fill="#03C75A" />
            <path d="M8 7h2.8l3.2 4.8V7H16v10h-2.8L10 12.2V17H8V7z" fill="white" />
          </svg>
        ),
      },
    ],
  },
]

const AuthManageTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const { showSuccess } = useAlert()
  const [selectedMethod, setSelectedMethod] = useState('SYSTEM')
  const [selectedSnsProvider, setSelectedSnsProvider] = useState('KAKAO')

  const paperBg = isDarkMode ? '#18181b' : 'background.paper'

  const handleSave = () => {
    // TODO: 백엔드 연동
    showSuccess(t('authManage.saved'))
  }

  return (
    <Box>
      <Paper sx={{ p: 3, bgcolor: paperBg }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('authManage.title')}
          </Typography>
          <Chip
            label={t('authManage.currentMethod', {
              method: selectedMethod === 'SNS'
                ? `${t('authManage.snsAuth')} - ${t(AUTH_METHODS.find((m) => m.value === 'SNS')?.subOptions?.find((s) => s.value === selectedSnsProvider)?.labelKey || '')}`
                : t(AUTH_METHODS.find((m) => m.value === selectedMethod)?.labelKey || ''),
            })}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('authManage.description')}
        </Typography>

        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <RadioGroup
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {AUTH_METHODS.map((method) => {
                const isSelected = selectedMethod === method.value
                return (
                  <Paper
                    key={method.value}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      cursor: 'pointer',
                      border: 2,
                      borderColor: isSelected ? 'primary.main' : (isDarkMode ? '#333' : '#e0e0e0'),
                      bgcolor: isSelected
                        ? (isDarkMode ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)')
                        : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: isSelected ? 'primary.main' : 'grey.500',
                      },
                    }}
                    onClick={() => setSelectedMethod(method.value)}
                  >
                    <FormControlLabel
                      value={method.value}
                      control={<Radio />}
                      sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1, width: '100%' }}>
                          <Box sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 2,
                            bgcolor: isDarkMode ? '#27272a' : '#f5f5f5',
                            flexShrink: 0,
                          }}>
                            {method.icon}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {t(method.labelKey)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t(method.descKey)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    {/* SNS 하위 옵션 */}
                    {method.subOptions && isSelected && (
                      <Box sx={{ ml: 7, mt: 2, display: 'flex', gap: 1.5 }}>
                        {method.subOptions.map((sub) => {
                          const isSubSelected = selectedSnsProvider === sub.value
                          return (
                            <Paper
                              key={sub.value}
                              variant="outlined"
                              sx={{
                                px: 2.5,
                                py: 1.5,
                                cursor: 'pointer',
                                border: 2,
                                borderColor: isSubSelected ? 'primary.main' : (isDarkMode ? '#333' : '#e0e0e0'),
                                bgcolor: isSubSelected
                                  ? (isDarkMode ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.06)')
                                  : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: isSubSelected ? 'primary.main' : 'grey.500' },
                              }}
                              onClick={(e) => { e.stopPropagation(); setSelectedSnsProvider(sub.value) }}
                            >
                              <Radio
                                checked={isSubSelected}
                                size="small"
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => setSelectedSnsProvider(sub.value)}
                              />
                              {sub.icon}
                              <Typography variant="body2" fontWeight={isSubSelected ? 'bold' : 'normal'}>
                                {t(sub.labelKey)}
                              </Typography>
                            </Paper>
                          )
                        })}
                      </Box>
                    )}
                  </Paper>
                )
              })}
            </Box>
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mt: 3 }}>
          <Button variant="contained" onClick={handleSave} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('common.save')}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default AuthManageTab
