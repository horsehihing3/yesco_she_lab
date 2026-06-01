import { IconButton, InputAdornment, TextField, SxProps, Theme, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { useState, useEffect } from 'react'

interface NumberFieldProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  label?: string
  placeholder?: string
  size?: 'small' | 'medium'
  fullWidth?: boolean
  disabled?: boolean
  /** 상세/조회 모드 — input 박스 대신 plain Typography 로 렌더 */
  readOnly?: boolean
  required?: boolean
  error?: boolean
  helperText?: string
  hideButtons?: boolean
  /** 1000 단위 콤마 자동 표시. 기본 true. 연도 등에서 끄려면 false. */
  thousandSeparator?: boolean
  sx?: SxProps<Theme>
}

const formatWithComma = (n: number): string => {
  // 음수도 처리: 절대값 격삼위 콤마 + 부호
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  return sign + abs.toLocaleString('en-US')
}

const NumberField = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  placeholder,
  size = 'small',
  fullWidth = true,
  disabled = false,
  readOnly = false,
  required = false,
  error = false,
  helperText,
  hideButtons = false,
  thousandSeparator = true,
  sx,
}: NumberFieldProps) => {
  const precision = step.toString().includes('.') ? step.toString().split('.')[1].length : 0

  // ===== readOnly: Typography 렌더 (상세 모드) =====
  if (readOnly) {
    const display = value == null
      ? '-'
      : (thousandSeparator && precision === 0
          ? formatWithComma(value)
          : (thousandSeparator
              ? (() => {
                  const sign = value < 0 ? '-' : ''
                  const abs = Math.abs(value)
                  const intPart = Math.floor(abs).toLocaleString('en-US')
                  const decFixed = (abs % 1).toFixed(precision).slice(2).replace(/0+$/, '')
                  return sign + intPart + (decFixed ? `.${decFixed}` : '')
                })()
              : String(value)))
    return (
      <Typography variant="body2" sx={{ fontWeight: 600, ...sx }}>{display}</Typography>
    )
  }

  const clamp = (v: number) => {
    let result = v
    if (min !== undefined) result = Math.max(min, result)
    if (max !== undefined) result = Math.min(max, result)
    return parseFloat(result.toFixed(precision))
  }

  const handleStep = (direction: 1 | -1) => {
    const current = value ?? (min ?? 0)
    onChange(clamp(parseFloat((current + direction * step).toFixed(precision))))
  }

  // ===== thousand separator path =====
  // 표시값과 raw value 분리: 사용자 타이핑 중 콤마가 들어와도 숫자만 추출해서 onChange 호출
  const formatForDisplay = (n: number): string => {
    if (!thousandSeparator) return String(n)
    if (precision === 0) return formatWithComma(n)
    const sign = n < 0 ? '-' : ''
    const abs = Math.abs(n)
    const intPart = Math.floor(abs).toLocaleString('en-US')
    const decFixed = (abs % 1).toFixed(precision).slice(2)
    const trimmed = decFixed.replace(/0+$/, '')
    return sign + intPart + (trimmed ? `.${trimmed}` : '')
  }

  const [displayValue, setDisplayValue] = useState<string>(() =>
    value == null ? '' : formatForDisplay(value)
  )

  useEffect(() => {
    if (value == null) {
      setDisplayValue('')
    } else {
      // 사용자 타이핑 중 "12.", "12.50" 같이 현재 표시값이 같은 숫자를 의미하면 덮어쓰지 않음
      const currentParsed = displayValue === '' || displayValue === '-' ? null : parseFloat(displayValue.replace(/,/g, ''))
      if (currentParsed === value) return
      setDisplayValue(formatForDisplay(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, thousandSeparator, precision])

  if (thousandSeparator) {
    const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw === '' || raw === '-') {
        setDisplayValue(raw)
        onChange(null)
        return
      }
      // precision > 0 이면 소수점도 허용
      const allowChars = precision > 0 ? /[^0-9.\-]/g : /[^0-9\-]/g
      const stripped = raw.replace(allowChars, '')
      // 부호는 맨 앞 한 번만
      let cleaned = stripped.startsWith('-')
        ? '-' + stripped.slice(1).replace(/-/g, '')
        : stripped.replace(/-/g, '')
      // 소수점은 한 번만, 정수부 콤마 + 소수부 raw 유지
      if (precision > 0) {
        const firstDot = cleaned.indexOf('.')
        if (firstDot !== -1) {
          cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
        }
      }
      if (cleaned === '' || cleaned === '-') {
        setDisplayValue(cleaned)
        onChange(null)
        return
      }
      if (precision > 0) {
        // 사용자가 "12.", "12.5" 같이 입력 중일 때 displayValue 는 raw 유지
        const parsed = parseFloat(cleaned)
        if (isNaN(parsed)) return
        const [intPart, decPart] = cleaned.split('.')
        const intNum = parseInt(intPart === '-' ? '0' : intPart || '0', 10)
        const sign = intPart.startsWith('-') ? '-' : ''
        const intDisplay = sign + Math.abs(intNum).toLocaleString('en-US')
        const decDisplay = decPart !== undefined ? `.${decPart.slice(0, precision)}` : ''
        setDisplayValue(intDisplay + decDisplay)
        onChange(parsed)
      } else {
        const parsed = parseInt(cleaned, 10)
        if (isNaN(parsed)) return
        setDisplayValue(formatWithComma(parsed))
        onChange(parsed)
      }
    }

    const handleBlurText = () => {
      if (value !== null && value !== undefined) {
        const clamped = clamp(value)
        if (precision > 0) {
          // 표시: 정수부 콤마 + 소수부 그대로 (필요 시 표시값 정리)
          const sign = clamped < 0 ? '-' : ''
          const abs = Math.abs(clamped)
          const intPart = Math.floor(abs).toLocaleString('en-US')
          const decPart = (abs % 1).toFixed(precision).slice(2) // "0.50" → "50"
          // 소수부가 전부 0 이면 생략
          const trimmed = decPart.replace(/0+$/, '')
          setDisplayValue(sign + intPart + (trimmed ? `.${trimmed}` : ''))
        } else {
          setDisplayValue(formatWithComma(clamped))
        }
        if (clamped !== value) onChange(clamped)
      }
    }

    const atMin = min !== undefined && (value ?? min) <= min
    const atMax = max !== undefined && (value ?? 0) >= max

    return (
      <TextField
        type="text"
        label={label}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChangeText}
        onBlur={handleBlurText}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        required={required}
        error={error}
        helperText={helperText}
        sx={sx as object}
        inputProps={{
          inputMode: precision > 0 ? 'decimal' : 'numeric',
          pattern: precision > 0 ? '[0-9,.\\-]*' : '[0-9,\\-]*',
        }}
        InputProps={hideButtons ? {} : {
          endAdornment: (
            <InputAdornment position="end" sx={{ gap: 0.25, mr: -0.5 }}>
              <IconButton size="small" onClick={() => handleStep(-1)} disabled={disabled || atMin}
                tabIndex={-1}
                sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <RemoveIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton size="small" onClick={() => handleStep(1)} disabled={disabled || atMax}
                tabIndex={-1}
                sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <AddIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    )
  }

  // ===== legacy numeric input path (thousandSeparator=false) =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '' || raw === '-') {
      onChange(null)
      return
    }
    const allow = precision > 0 ? /[^0-9.\-]/g : /[^0-9\-]/g
    const cleaned = raw.replace(allow, '')
    if (cleaned !== raw) return
    if (precision === 0 && cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0-')) return
    const parsed = precision > 0 ? parseFloat(cleaned) : parseInt(cleaned, 10)
    if (!isNaN(parsed)) onChange(parsed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'e' || e.key === 'E') e.preventDefault()
    if (e.key === '.' && precision === 0) e.preventDefault()
  }

  const handleBlur = () => {
    if (value !== null && value !== undefined) onChange(clamp(value))
  }

  const atMin2 = min !== undefined && (value ?? min) <= min
  const atMax2 = max !== undefined && (value ?? 0) >= max

  return (
    <TextField
      type="number"
      label={label}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      required={required}
      error={error}
      helperText={helperText}
      sx={{
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
          WebkitAppearance: 'none',
          margin: 0,
        },
        '& input[type=number]': { MozAppearance: 'textfield' },
        ...sx as object,
      }}
      inputProps={{ step, min, max }}
      InputProps={hideButtons ? {} : {
        endAdornment: (
          <InputAdornment position="end" sx={{ gap: 0.25, mr: -0.5 }}>
            <IconButton size="small" onClick={() => handleStep(-1)} disabled={disabled || atMin2}
              tabIndex={-1}
              sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              <RemoveIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" onClick={() => handleStep(1)} disabled={disabled || atMax2}
              tabIndex={-1}
              sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              <AddIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}

export default NumberField
