import { TextField, TextFieldProps, Typography, FormControl, FormControlProps, SxProps, Theme } from '@mui/material'
import { Children, isValidElement, ReactNode } from 'react'

type Props = TextFieldProps & {
  /** true: input 박스 대신 plain Typography 로 렌더 (상세/조회용) */
  readOnly?: boolean
  /** readOnly 모드일 때 빈 값 대체 텍스트 (기본 '-') */
  emptyText?: string
  /** readOnly Typography 의 sx 오버라이드 */
  readSx?: SxProps<Theme>
}

/**
 * TextField + readOnly 통합 컴포넌트.
 * readOnly={true} 면 disabled input 대신 Typography 로 값을 표시.
 * select 모드면 selected option 의 라벨(children) 을 자동 표시.
 */
const ReadTextField = ({ readOnly, value, select, children, multiline, emptyText = '-', readSx, ...rest }: Props) => {
  if (readOnly) {
    let display: ReactNode = value as ReactNode
    // select 모드: 선택된 MenuItem 의 children(라벨)로 변환
    if (select && children !== undefined) {
      Children.forEach(children, (child) => {
        if (isValidElement(child)) {
          const props = child.props as { value?: unknown; children?: ReactNode }
          // eslint-disable-next-line eqeqeq
          if (props.value == value) {
            display = props.children ?? (value as ReactNode)
          }
        }
      })
    }
    const isEmpty = display === null || display === undefined || display === ''
    return (
      <Typography variant="body2" sx={{
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
        wordBreak: 'break-word',
        ...readSx,
      }}>
        {isEmpty ? emptyText : display}
      </Typography>
    )
  }
  return (
    <TextField value={value} select={select} multiline={multiline} {...rest}>
      {children}
    </TextField>
  )
}

type FCProps = FormControlProps & {
  /** true: 자식(Select 등)을 그대로 렌더하지 않고 빈 박스로 처리 (Select 의 자식인 MenuItem 라벨은 표시 못함 — 가급적 ReadTextField select 사용 권장) */
  readOnly?: boolean
}

/** 일부 페이지가 FormControl + Select 패턴을 쓰는 경우용 wrapper. readOnly 면 Typography 로 fallback. */
const ReadFormControl = ({ readOnly, children, ...rest }: FCProps) => {
  if (readOnly) {
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {/* FormControl 내부의 Select 값을 직접 추출하기 어려우니, 페이지에서 ReadTextField select 로 전환을 권장 */}
        {children as ReactNode}
      </Typography>
    )
  }
  return <FormControl {...rest}>{children}</FormControl>
}

export default ReadTextField
export { ReadFormControl }
