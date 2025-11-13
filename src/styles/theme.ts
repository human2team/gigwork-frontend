// 테마 시스템 - 디자인 토큰 정의

export const theme = {
  // 색상 팔레트
  colors: {
    // Primary
    primary: '#2196f3',
    primaryDark: '#1976d2',
    primaryLight: '#64b5f6',
    
    // Secondary
    secondary: '#ff9800',
    secondaryDark: '#f57c00',
    secondaryLight: '#ffb74d',
    
    // 상태 색상
    success: '#4caf50',
    successDark: '#388e3c',
    error: '#f44336',
    errorDark: '#d32f2f',
    warning: '#ff9800',
    warningDark: '#f57c00',
    info: '#2196f3',
    infoDark: '#1976d2',
    
    // 중성 색상
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f9f9f9',
    
    // 텍스트 색상
    text: {
      primary: '#333333',
      secondary: '#666666',
      tertiary: '#999999',
      disabled: '#cccccc',
      inverse: '#ffffff'
    },
    
    // 테두리 색상
    border: {
      default: '#e0e0e0',
      light: '#f0f0f0',
      dark: '#cccccc'
    },
    
    // 오버레이
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // 적합도 점수 색상
    suitability: {
      high: '#4caf50',    // 85 이상
      medium: '#ff9800',  // 75-84
      low: '#f44336'      // 75 미만
    },
    
    // 지원 상태 색상
    applicationStatus: {
      pending: '#ff9800',
      accepted: '#4caf50',
      rejected: '#f44336'
    }
  },
  
  // 타이포그래피
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '28px',
      '4xl': '32px',
      '5xl': '48px'
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8
    }
  },
  
  // 간격 시스템 (8px 기준)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px'
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px'
  },
  
  // 그림자
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.05)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    xl: '0 4px 20px rgba(0, 0, 0, 0.2)'
  },
  
  // 전환 효과
  transitions: {
    fast: '0.15s',
    normal: '0.2s',
    slow: '0.3s'
  },
  
  // Z-index 레이어
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070
  },
  
  // 반응형 브레이크포인트
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
} as const

// 타입 정의
export type Theme = typeof theme
export type ColorKey = keyof typeof theme.colors
export type SpacingKey = keyof typeof theme.spacing
export type BorderRadiusKey = keyof typeof theme.borderRadius

