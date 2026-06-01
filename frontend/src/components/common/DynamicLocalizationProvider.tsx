import { ReactNode, useMemo } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ko, enUS, zhCN } from 'date-fns/locale'
import { useLanguage } from '../../context/LanguageContext'

interface DynamicLocalizationProviderProps {
  children: ReactNode
}

// Custom locale text for each language
const localeTextMap = {
  ko: {
    // Toolbar
    datePickerToolbarTitle: '날짜 선택',
    // Calendar navigation
    previousMonth: '이전 달',
    nextMonth: '다음 달',
    // View switching
    openPreviousView: '이전 보기 열기',
    openNextView: '다음 보기 열기',
    // Calendar labels
    calendarWeekNumberHeaderLabel: '주 번호',
    calendarWeekNumberHeaderText: '#',
    calendarWeekNumberAriaLabelText: (weekNumber: number) => `${weekNumber}주`,
    calendarWeekNumberText: (weekNumber: number) => `${weekNumber}`,
    // Actions
    okButtonLabel: '확인',
    cancelButtonLabel: '취소',
    clearButtonLabel: '지우기',
    todayButtonLabel: '오늘',
    // Field placeholders
    fieldYearPlaceholder: (params: { digitAmount: number }) => '년'.repeat(params.digitAmount),
    fieldMonthPlaceholder: () => '월',
    fieldDayPlaceholder: () => '일',
  },
  en: {
    datePickerToolbarTitle: 'Select date',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    openPreviousView: 'Open previous view',
    openNextView: 'Open next view',
    calendarWeekNumberHeaderLabel: 'Week number',
    calendarWeekNumberHeaderText: '#',
    calendarWeekNumberAriaLabelText: (weekNumber: number) => `Week ${weekNumber}`,
    calendarWeekNumberText: (weekNumber: number) => `${weekNumber}`,
    okButtonLabel: 'OK',
    cancelButtonLabel: 'Cancel',
    clearButtonLabel: 'Clear',
    todayButtonLabel: 'Today',
    fieldYearPlaceholder: (params: { digitAmount: number }) => 'Y'.repeat(params.digitAmount),
    fieldMonthPlaceholder: () => 'MM',
    fieldDayPlaceholder: () => 'DD',
  },
  zh: {
    datePickerToolbarTitle: '选择日期',
    previousMonth: '上个月',
    nextMonth: '下个月',
    openPreviousView: '打开上一个视图',
    openNextView: '打开下一个视图',
    calendarWeekNumberHeaderLabel: '周数',
    calendarWeekNumberHeaderText: '#',
    calendarWeekNumberAriaLabelText: (weekNumber: number) => `第${weekNumber}周`,
    calendarWeekNumberText: (weekNumber: number) => `${weekNumber}`,
    okButtonLabel: '确定',
    cancelButtonLabel: '取消',
    clearButtonLabel: '清除',
    todayButtonLabel: '今天',
    fieldYearPlaceholder: (params: { digitAmount: number }) => '年'.repeat(params.digitAmount),
    fieldMonthPlaceholder: () => '月',
    fieldDayPlaceholder: () => '日',
  },
}

const DynamicLocalizationProvider = ({ children }: DynamicLocalizationProviderProps) => {
  const { language } = useLanguage()

  const locale = useMemo(() => {
    switch (language) {
      case 'en':
        return enUS
      case 'zh':
        return zhCN
      default:
        return ko
    }
  }, [language])

  const localeText = useMemo(() => {
    return localeTextMap[language] || localeTextMap.ko
  }, [language])

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={locale}
      localeText={localeText}
    >
      {children}
    </LocalizationProvider>
  )
}

export default DynamicLocalizationProvider
