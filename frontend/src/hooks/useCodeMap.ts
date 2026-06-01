import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchCodesByGroupCode } from '../api/codeManageApi'
import { CodeDetail } from '../types/codeManage.types'

/**
 * 그룹코드로 코드 목록을 조회하고 code -> codeName 매핑을 반환하는 훅
 * 현재 언어 설정에 따라 해당 언어의 코드명을 반환
 *
 * @example
 * const { codeMap, codeList, getLabel } = useCodeMap('PPE_TYPE')
 * // 한국어: getLabel('RESPIRATORY') => '호흡보호구'
 * // 영어: getLabel('RESPIRATORY') => 'Respiratory Protection'
 * // 중국어: getLabel('RESPIRATORY') => '呼吸防护'
 */
export const useCodeMap = (groupCode: string) => {
  const { i18n } = useTranslation()
  const currentLang = i18n.language // 'ko', 'en', 'zh'

  const { data: codeList = [], isLoading } = useQuery({
    queryKey: ['codeMap', groupCode],
    queryFn: () => fetchCodesByGroupCode(groupCode),
    staleTime: 30 * 1000, // 30초 캐시
    enabled: !!groupCode,
  })

  const getLocalizedName = (item: CodeDetail): string => {
    if (currentLang === 'en' && item.codeNameEn) return item.codeNameEn
    if (currentLang === 'zh' && item.codeNameZh) return item.codeNameZh
    return item.codeNameKo || item.code
  }

  const codeMap: Record<string, string> = {}
  codeList.forEach((item: CodeDetail) => {
    codeMap[item.code] = getLocalizedName(item)
  })

  const getLabel = (code: string): string => codeMap[code] || code

  return { codeMap, codeList, getLabel, getLocalizedName, isLoading }
}

export default useCodeMap
