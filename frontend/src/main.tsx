import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline } from '@mui/material'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeContextProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { AlertProvider } from './contexts/AlertContext'
import DynamicLocalizationProvider from './components/common/DynamicLocalizationProvider'
import { queryClient } from './lib/queryClient'
import './i18n'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeContextProvider>
        <LanguageProvider>
          <DynamicLocalizationProvider>
            <CssBaseline />
            <AuthProvider>
              <AlertProvider>
                <App />
              </AlertProvider>
            </AuthProvider>
          </DynamicLocalizationProvider>
        </LanguageProvider>
      </ThemeContextProvider>
    </BrowserRouter>
  </QueryClientProvider>,
)
