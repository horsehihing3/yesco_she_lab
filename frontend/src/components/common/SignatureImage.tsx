import React from 'react'
import { useTheme } from '@mui/material'

interface SignatureImageProps {
  src: string
  alt?: string
  style?: React.CSSProperties
  maxHeight?: number | string
  maxWidth?: number | string
}

/**
 * 서명 이미지 표시용 공통 컴포넌트.
 * 서명은 항상 "투명 배경 + 검정 펜"으로 저장되므로,
 * 다크 테마에서는 CSS filter:invert(1) 로 흰색 펜처럼 보이게 합니다.
 * → 어떤 테마에서 저장했든, 어떤 테마에서 조회하든 자연스럽게 표시됩니다.
 */
const SignatureImage: React.FC<SignatureImageProps> = ({ src, alt = 'signature', style, maxHeight, maxWidth }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  return (
    <img
      src={src}
      alt={alt}
      style={{
        maxHeight,
        maxWidth,
        filter: isDark ? 'invert(1)' : 'none',
        ...style,
      }}
    />
  )
}

export default SignatureImage
