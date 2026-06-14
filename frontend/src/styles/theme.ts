import { createTheme, Theme } from '@mui/material/styles'

// Light Mode Color Palette
const lightColors = {
  primary: '#2563eb',      // blue-600
  primaryHover: '#1d4ed8', // blue-700
  primaryLight: '#3b82f6', // blue-500
  background: '#f8fafc',   // slate-50
  sidebar: '#1e293b',      // slate-800
  sidebarBrand: '#0f172a', // slate-900
  surface: '#ffffff',
  textPrimary: '#1f2937',  // gray-800
  textSecondary: '#6b7280', // gray-500
  border: '#e5e7eb',       // gray-200
  success: '#16a34a',      // green-600
  warning: '#f97316',      // orange-500
  danger: '#ef4444',       // red-500
  tableHeader: '#f9fafb',  // gray-50
  tableHover: '#eff6ff',   // blue-50
}

// Dark Mode Color Palette (shadcn inspired)
const darkColors = {
  primary: '#3b82f6',      // blue-500
  primaryHover: '#2563eb', // blue-600
  primaryLight: '#60a5fa', // blue-400
  background: '#09090b',   // zinc-950
  sidebar: '#18181b',      // zinc-900
  sidebarBrand: '#09090b', // zinc-950
  surface: '#18181b',      // zinc-900
  textPrimary: '#fafafa',  // zinc-50
  textSecondary: '#a1a1aa', // zinc-400
  border: '#3f3f46',       // zinc-700 (slightly lighter for visibility)
  success: '#22c55e',      // green-500
  warning: '#f97316',      // orange-500
  danger: '#ef4444',       // red-500
  tableHeader: '#27272a',  // zinc-800
  tableHover: '#1e3a5f',   // dark blue
}

// YESCO Mode Color Palette
// 분석: lsyesco.com — 깊은 네이비 + 흰색 + 붉은색 강조 (LS 그룹 CI)
// - 네이비 #0F2147 / 짙은 네이비 #0A1733 (사이드바, 헤더)
// - LS Red #E60012 (브랜드 강조, 사이드바 active/hover, 강조 라벨)
// - 라이트한 본문 배경 (#fafafa) + 흰색 카드
// - 텍스트: 진한 네이비/회색
const yescoColors = {
  primary: '#0F4C81',         // 네이비 블루 (강조) — LS Red 대체
  primaryHover: '#093561',
  primaryLight: '#1f6dac',
  background: '#fafafa',
  sidebar: '#0F2147',         // 깊은 네이비
  sidebarBrand: '#0A1733',    // 더 깊은 네이비
  surface: '#ffffff',
  textPrimary: '#1a2332',     // 짙은 네이비-블랙
  textSecondary: '#5b6478',
  border: '#0F2147',          // 진한 네이비 — 모든 border/divider 통일
  success: '#16a34a',
  warning: '#f97316',
  danger: '#dc2626',
  tableHeader: '#0F2147',     // 진한 네이비 헤더
  tableHover: '#eef4fb',      // 옅은 블루 톤
}

const fontFamily = [
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',')

const createBaseTheme = (colors: typeof lightColors, mode: 'light' | 'dark', variant: 'light' | 'dark' | 'yesco' = mode): Theme => {
  const isYesco = variant === 'yesco'
  const yescoNavy = '#0F2147'
  const yescoRed = '#E60012'
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: colors.primaryLight,
        dark: colors.primaryHover,
      },
      secondary: {
        main: colors.textSecondary,
        light: mode === 'light' ? '#9ca3af' : '#71717a',
        dark: mode === 'light' ? '#4b5563' : '#52525b',
      },
      error: {
        main: colors.danger,
      },
      warning: {
        main: colors.warning,
      },
      success: {
        main: colors.success,
      },
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
      },
      divider: colors.border,
      grey: {
        50: mode === 'light' ? '#fafafa' : '#27272a',
        100: mode === 'light' ? '#f5f5f5' : '#3f3f46',
        200: mode === 'light' ? '#f3f4f6' : '#52525b',
        300: mode === 'light' ? '#e5e7eb' : '#71717a',
        400: mode === 'light' ? '#d1d5db' : '#a1a1aa',
        500: mode === 'light' ? '#9ca3af' : '#a1a1aa',
        600: mode === 'light' ? '#6b7280' : '#a1a1aa',
        700: mode === 'light' ? '#4b5563' : '#d4d4d8',
        800: mode === 'light' ? '#374151' : '#e4e4e7',
        900: mode === 'light' ? '#1f2937' : '#f4f4f5',
      },
      action: {
        hover: mode === 'light' ? '#f3f4f6' : '#27272a',
        selected: mode === 'light' ? '#e5e7eb' : '#3f3f46',
        disabledBackground: mode === 'light' ? '#f5f5f5' : '#27272a',
      },
    },
    typography: {
      fontFamily,
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 700,
      },
      body2: {
        fontSize: '0.875rem',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            // YESCO: 본문 배경에 옅은 네이비-블루 톤
            ...(isYesco && {
              backgroundColor: '#f4f6fb',
            }),
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: 10,
              height: 10,
            },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
              background: mode === 'light' ? 'rgba(241, 245, 249, 0.5)' : 'rgba(39, 39, 42, 0.3)',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              background: mode === 'light' ? 'rgba(156, 163, 175, 0.5)' : 'rgba(113, 113, 122, 0.6)',
              borderRadius: 10,
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              background: mode === 'light' ? 'rgba(107, 114, 128, 0.7)' : 'rgba(161, 161, 170, 0.8)',
            },
            '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
              background: 'transparent',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: mode === 'light'
              ? 'rgba(156, 163, 175, 0.5) rgba(241, 245, 249, 0.5)'
              : 'rgba(113, 113, 122, 0.6) rgba(39, 39, 42, 0.3)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
          },
          contained: {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            '&:hover': {
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
          },
          containedPrimary: {
            backgroundColor: colors.primary,
            '&:hover': {
              backgroundColor: colors.primaryHover,
            },
          },
          outlined: {
            borderColor: colors.border,
            color: colors.textSecondary,
            '&:hover': {
              backgroundColor: mode === 'light' ? '#f9fafb' : '#27272a',
              borderColor: colors.border,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            backgroundColor: mode === 'light' ? colors.surface : colors.sidebarBrand,
            // YESCO: 라이트와 공통 어두운 AppBar + 하단 LS Red 강조선 (브랜드 표식)
            ...(isYesco && {
              borderBottom: `3px solid ${yescoRed}`,
            }),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundImage: 'none',
            ...(mode === 'dark' && {
              border: `1px solid ${colors.border}`,
            }),
            // YESCO: 카드/페이퍼 좌측에 옅은 네이비 라인 (브랜드 강조)
            ...(isYesco && {
              boxShadow: '0 1px 3px rgba(15,33,71,0.08), 0 1px 2px rgba(15,33,71,0.05)',
            }),
          },
          outlined: {
            borderColor: colors.border,
            ...(isYesco && {
              borderColor: yescoNavy,
              // 좌측 색띠 카드 (inline `borderColor: card.color` 패턴) 의 위·우·아래 면을 yesco navy 로 덮어씀.
              // 좌측은 inline 의 `borderLeftColor` 또는 4 면 shorthand 가 적용되어 카드 색 유지
              borderTopColor: `${yescoNavy} !important`,
              borderRightColor: `${yescoNavy} !important`,
              borderBottomColor: `${yescoNavy} !important`,
            }),
            // 내부 TableContainer 가 모서리에서 살짝 튀어나오는 현상 방지 — Paper 둥근 모서리에 맞춰 자식 잘림
            '&:has(.MuiTableContainer-root)': {
              overflow: 'hidden',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: colors.surface,
            ...(mode === 'dark' && {
              border: `1px solid ${colors.border}`,
            }),
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
            // 부모가 Paper variant="outlined" 인 경우 — 이중 외곽선 방지를 위해 자체 border 제거
            '.MuiPaper-outlined &': {
              border: 'none',
              borderRadius: 0,
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: colors.tableHeader,
            // YESCO: 진한 네이비 헤더 + 흰 글씨 + 하단 LS Red 강조선 + 셀 사이 흰 톤 경계
            // inline sx 의 `border: '1px solid'` shorthand 가 덮어쓰는 케이스를 막기 위해 reset 후 단방향만 적용
            ...(isYesco && {
              backgroundColor: `${yescoNavy} !important`,
              '& .MuiTableCell-head': {
                color: '#ffffff !important',
                backgroundColor: `${yescoNavy} !important`,
                border: 'none !important',
                borderRight: `1px solid rgba(255,255,255,0.35) !important`,
                // 빨간 강조선 — 단순 borderBottom 으로 단일선. 본문 row 와 인접해도 같은 두께라 자연스러움
                borderBottom: `1px solid ${yescoRed} !important`,
              },
              // 1단 그룹 헤더 (colSpan만 있고 자식 헤더가 아래에 있는 셀) → 아래 sub 헤더와 자연스럽게 연결 (흰 톤)
              '& tr:not(:last-child) .MuiTableCell-head:not([rowspan])': {
                borderBottom: `1px solid rgba(255,255,255,0.35) !important`,
              },
              // 헤더 마지막 행의 마지막 셀만 우측 경계 제거 — rowSpan 셀이 :last-child 매치되는 케이스 방지
              '& tr:last-child .MuiTableCell-head:last-child': {
                borderRight: 'none !important',
              },
            }),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${colors.border}`,
            borderBottomColor: mode === 'dark' ? 'rgba(255,255,255,0.25)' : undefined,
            '&:last-child': {
              borderRight: 'none',
            },
          },
          head: {
            backgroundColor: colors.tableHeader,
            color: colors.textSecondary,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'center',
            borderBottom: `1px solid ${colors.border}`,
          },
          body: {
            fontSize: '0.875rem',
            borderBottom: `1px solid ${colors.border}`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: `${colors.tableHover} !important`,
            },
            '&.Mui-selected': {
              backgroundColor: colors.tableHover,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 6,
          },
          colorSuccess: {
            backgroundColor: mode === 'light' ? '#dcfce7' : '#14532d',
            color: colors.success,
          },
          colorWarning: {
            backgroundColor: mode === 'light' ? '#ffedd5' : '#7c2d12',
            color: colors.warning,
          },
          colorError: {
            backgroundColor: mode === 'light' ? '#fee2e2' : '#7f1d1d',
            color: colors.danger,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
          input: {
            fontSize: '0.875rem',
            '&::placeholder': {
              fontSize: '0.875rem',
              color: mode === 'light' ? '#9ca3af' : '#71717a',
              opacity: 1,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.border,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#9ca3af' : '#52525b',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary,
            },
          },
          input: {
            fontSize: '0.875rem',
            '&::placeholder': {
              fontSize: '0.875rem',
              color: mode === 'light' ? '#9ca3af' : '#71717a',
              opacity: 1,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
            },
            '& .MuiInputBase-inputMultiline::placeholder': {
              color: mode === 'light' ? '#9ca3af' : '#71717a',
              opacity: 1,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontSize: '0.875rem',
          },
          select: {
            fontSize: '0.875rem',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            ...(mode === 'dark' && {
              border: `1px solid ${colors.border}`,
            }),
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            '@media (min-width: 900px)': {
              borderBottom: `4px solid ${isYesco ? yescoNavy : colors.primary}`,
            },
            '@media (max-width: 899.95px)': {
              borderBottom: `1px solid ${colors.border}`,
            },
            // 페이지 전환 시 indicator/scroll 버튼 layout 계산 동안의 깜빡임 방지
            '& .MuiTabs-scrollButtons.Mui-disabled': {
              opacity: 0,
              width: 0,
            },
          },
          indicator: {
            backgroundColor: colors.primary,
            // 초기 마운트 시 indicator가 0에서 슬라이드하며 보이는 깜빡임 제거
            transition: 'none',
            '@media (min-width: 900px)': {
              display: 'none',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            // 선택 상태 배경/색 전환 애니메이션 제거 → 마운트 시 깜빡임 방지
            transition: 'none',
            '&.Mui-selected': {
              color: isYesco ? yescoNavy : colors.primary,
              '@media (min-width: 900px)': {
                backgroundColor: isYesco ? yescoNavy : colors.primary,
                color: '#ffffff',
                borderRadius: '6px 6px 0 0',
                // YESCO: 선택 탭 상단 붉은 강조선
                ...(isYesco && {
                  borderTop: `3px solid ${yescoRed}`,
                  borderRadius: '4px 4px 0 0',
                }),
              },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            ...(mode === 'dark' && {
              border: `1px solid ${colors.border}`,
            }),
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: colors.border,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'light' ? '#1f2937' : '#fafafa',
            color: mode === 'light' ? '#ffffff' : '#18181b',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: 6,
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
          },
          arrow: {
            color: mode === 'light' ? '#1f2937' : '#fafafa',
          },
        },
      },
    },
  })
  ;(theme as any).isYesco = isYesco
  return theme
}

export const createLightTheme = (): Theme => createBaseTheme(lightColors, 'light', 'light')
export const createDarkTheme  = (): Theme => createBaseTheme(darkColors,  'dark',  'dark')
export const createYescoTheme = (): Theme => createBaseTheme(yescoColors, 'light', 'yesco')

// Default export for backward compatibility
export default createLightTheme()
