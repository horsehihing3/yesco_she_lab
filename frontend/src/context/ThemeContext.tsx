import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { createLightTheme, createDarkTheme, createYescoTheme } from '../styles/theme'

export type ThemeMode = 'light' | 'dark' | 'yesco'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
  isDarkMode: boolean
  isYescoMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useThemeMode = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider')
  }
  return context
}

interface ThemeContextProviderProps {
  children: ReactNode
}

const MODE_CYCLE: ThemeMode[] = ['yesco', 'dark', 'light']

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode')
    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'yesco') return savedMode
    return 'yesco'
  })

  useEffect(() => {
    localStorage.setItem('themeMode', mode)
    // Apply data-theme attribute to body for CSS scrollbar styling
    document.body.setAttribute('data-theme', mode)
  }, [mode])

  const toggleTheme = () => {
    setModeState((prev) => {
      const idx = MODE_CYCLE.indexOf(prev)
      return MODE_CYCLE[(idx + 1) % MODE_CYCLE.length]
    })
  }

  const setMode = (m: ThemeMode) => setModeState(m)

  const theme = useMemo(() => {
    if (mode === 'dark')  return createDarkTheme()
    if (mode === 'yesco') return createYescoTheme()
    return createLightTheme()
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      setMode,
      isDarkMode: mode === 'dark',
      isYescoMode: mode === 'yesco',
    }),
    [mode]
  )

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
