import { useState, useMemo } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { SxProps, Theme, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

interface DatePickerFieldProps {
  label?: string
  value: string | null | undefined
  onChange: (value: string) => void
  fullWidth?: boolean
  size?: 'small' | 'medium'
  placeholder?: string
  margin?: 'none' | 'dense' | 'normal'
  sx?: SxProps<Theme>
  error?: boolean
  minDate?: string | null
  maxDate?: string | null
  disabled?: boolean
  /** 상세/조회 모드 — DatePicker 대신 plain Typography 로 렌더 */
  readOnly?: boolean
}

const DatePickerField = ({
  label = '',
  value,
  onChange,
  fullWidth = true,
  size = 'small',
  placeholder,
  margin = 'none',
  sx,
  error = false,
  minDate,
  maxDate,
  disabled = false,
  readOnly = false,
}: DatePickerFieldProps) => {
  // readOnly: 상세 모드용 Typography 렌더
  if (readOnly) {
    return (
      <Typography variant="body2" sx={{ fontFamily: 'monospace', ...sx }}>
        {value || '-'}
      </Typography>
    )
  }
  const { t } = useTranslation()
  const defaultPlaceholder = placeholder || t('common.selectDate')
  const [open, setOpen] = useState(false)

  // Get toolbar format based on current language
  const toolbarFormat = useMemo(() => {
    const lang = i18n.language
    switch (lang) {
      case 'en':
        return 'MMMM d' // February 10
      case 'zh':
        return 'M月d日' // 2月10日
      default:
        return 'M월 d일' // 2월 10일
    }
  }, [i18n.language])

  const handleChange = (newValue: Date | null) => {
    if (newValue && !isNaN(newValue.getTime())) {
      const year = newValue.getFullYear()
      const month = String(newValue.getMonth() + 1).padStart(2, '0')
      const day = String(newValue.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange('')
    }
  }

  const dateValue = value ? new Date(value) : null

  return (
    <DatePicker
      label={label}
      value={dateValue}
      disabled={disabled}
      minDate={minDate ? new Date(minDate) : undefined}
      maxDate={maxDate ? new Date(maxDate) : undefined}
      open={disabled ? false : open}
      onOpen={() => !disabled && setOpen(true)}
      onClose={() => setOpen(false)}
      onChange={handleChange}
      slotProps={{
        textField: {
          fullWidth: sx ? false : fullWidth,
          size,
          margin,
          error,
          placeholder: defaultPlaceholder,
          InputLabelProps: { shrink: true },
          onClick: () => !disabled && setOpen(true),
          sx: {
            '& input': {
              cursor: 'pointer',
            },
            '& .MuiInputBase-input:not(:focus)::placeholder': {
              opacity: 1,
            },
            ...sx as object,
          },
        },
        field: { clearable: true },
        openPickerButton: {
          onClick: () => setOpen(true),
        },
        toolbar: {
          toolbarFormat,
        },
      }}
      format="yyyy-MM-dd"
    />
  )
}

export default DatePickerField
