import { Box, Typography } from '@mui/material'

interface HtmlContentProps {
  content: string | undefined | null
  fallback?: string
}

/**
 * HTML 콘텐츠를 렌더링하는 컴포넌트
 * - RichTextEditor에서 저장된 HTML을 그대로 렌더링
 * - 줄바꿈(\n)은 <br>로 변환
 */
const HtmlContent: React.FC<HtmlContentProps> = ({ content, fallback = '내용 없음' }) => {
  if (!content) {
    return (
      <Typography color="text.secondary">{fallback}</Typography>
    )
  }

  // 줄바꿈을 <br>로 변환 (HTML이 아닌 일반 텍스트인 경우 대비)
  const processedContent = content.replace(/\n/g, '<br />')

  return (
    <Box
      sx={{
        fontSize: '14px',
        lineHeight: 1.6,
        '& p': {
          margin: 0,
          marginBottom: '0.5em',
          minHeight: '1.4em', // 빈 줄도 높이 유지
        },
        '& p:last-child': {
          marginBottom: 0,
        },
        '& ul, & ol': {
          paddingLeft: '1.5em',
          margin: '0.5em 0',
        },
        '& a': {
          color: 'primary.main',
          textDecoration: 'underline',
        },
      }}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

export default HtmlContent
