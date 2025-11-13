import { theme } from './theme'

// 테마 export
export { theme }

// 스타일 유틸리티 함수들

/**
 * 간격 값을 가져옵니다
 */
export const spacing = (key: keyof typeof theme.spacing): string => {
  return theme.spacing[key]
}

/**
 * 색상 값을 가져옵니다
 */
export const color = (path: string): string => {
  const keys = path.split('.')
  let value: any = theme.colors
  
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) {
      console.warn(`Color path "${path}" not found in theme`)
      return '#000000'
    }
  }
  
  return value
}

/**
 * Border radius 값을 가져옵니다
 */
export const borderRadius = (key: keyof typeof theme.borderRadius): string => {
  return theme.borderRadius[key]
}

/**
 * 그림자 값을 가져옵니다
 */
export const shadow = (key: keyof typeof theme.shadows): string => {
  return theme.shadows[key]
}

/**
 * 폰트 크기를 가져옵니다
 */
export const fontSize = (key: keyof typeof theme.typography.fontSize): string => {
  return theme.typography.fontSize[key]
}

/**
 * 적합도 점수에 따른 색상 반환
 */
export const getSuitabilityColor = (score: number): string => {
  if (score >= 85) return theme.colors.suitability.high
  if (score >= 75) return theme.colors.suitability.medium
  return theme.colors.suitability.low
}

/**
 * 지원 상태에 따른 색상 반환
 */
export const getStatusColor = (status: '대기' | '합격' | '불합격' | string): string => {
  switch (status) {
    case '합격':
      return theme.colors.applicationStatus.accepted
    case '불합격':
      return theme.colors.applicationStatus.rejected
    case '대기':
      return theme.colors.applicationStatus.pending
    default:
      return theme.colors.text.tertiary
  }
}

/**
 * 인라인 스타일 객체 생성 헬퍼
 */
export const createStyles = <T extends Record<string, React.CSSProperties>>(
  styles: T
): T => {
  return styles
}

/**
 * 조건부 스타일 적용
 */
export const conditionalStyle = (
  condition: boolean,
  trueStyle: React.CSSProperties,
  falseStyle: React.CSSProperties = {}
): React.CSSProperties => {
  return condition ? trueStyle : falseStyle
}

/**
 * 스타일 병합
 */
export const mergeStyles = (
  ...styles: (React.CSSProperties | undefined)[]
): React.CSSProperties => {
  return Object.assign({}, ...styles.filter(Boolean))
}

