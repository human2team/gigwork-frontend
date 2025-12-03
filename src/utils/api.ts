// API 호출 래퍼 함수 및 에러 처리 유틸리티

/**
 * API 기본 URL 가져오기
 * 환경 변수에서 VITE_API_BASE_URL을 읽거나 기본값 사용
 */
export function getApiBaseUrl(): string {
  const envValue = import.meta.env.VITE_API_BASE_URL
  const baseUrl = (envValue && envValue.trim() !== '') ? envValue.trim() : 'http://localhost:8080'
  return baseUrl
}

/**
 * API URL 생성
 * 절대 URL이면 그대로 반환하고, 상대 URL이면 기본 URL과 결합
 * 개발 환경에서는 프록시를 사용하도록 상대 경로를 반환
 */
export function createApiUrl(path: string): string {
  // 이미 전체 URL이면 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // 개발 환경(MODE === 'development')에서는 프록시 사용을 위해 상대 경로 반환
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
  const useProxy = import.meta.env.VITE_USE_PROXY !== 'false' // 기본값: true (프록시 사용)
  
  if (isDevelopment && useProxy) {
    // 개발 환경: Vite 프록시 사용 (상대 경로)
    return path.startsWith('/') ? path : `/${path}`
  }
  
  // 프로덕션 환경 또는 프록시 미사용: 절대 URL 생성
  const baseUrl = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

export interface ApiError extends Error {
  status?: number
  statusText?: string
  data?: any
}

export class ApiException extends Error implements ApiError {
  status?: number
  statusText?: string
  data?: any

  constructor(message: string, status?: number, statusText?: string, data?: any) {
    super(message)
    this.name = 'ApiException'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

/**
 * API 호출 래퍼 함수
 * 에러 처리 및 타임아웃 지원
 * JWT 인증 자동 처리
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // 환경 변수에서 API URL 가져오기
  const apiUrl = createApiUrl(url)

  // localStorage에서 Access Token 가져오기
  const accessToken = localStorage.getItem('accessToken')
  
  // 기본 헤더 설정
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((options.headers as HeadersInit) || {})
  }
  
  // 토큰이 있으면 Authorization 헤더 추가
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  try {
    const response = await fetch(apiUrl, {
      ...options,
      headers,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // 401 Unauthorized - 토큰 만료 또는 인증 실패
    if (response.status === 401) {
      console.warn('[JWT 인증 오류] 401 Unauthorized 발생:', apiUrl)
      
      // Refresh Token으로 재시도
      const newToken = await refreshAccessToken()
      if (newToken) {
        console.log('[JWT 인증] Refresh Token으로 재시도 성공')
        // 새 토큰으로 재시도
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`
        }
        
        const retryResponse = await fetch(apiUrl, {
          ...options,
          headers: retryHeaders,
          signal: controller.signal
        })
        
        if (retryResponse.ok) {
          const contentType = retryResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            return await retryResponse.json()
          }
          return await retryResponse.text() as unknown as T
        }
      }
      
      // Refresh Token도 실패하면 사용자에게 알림 후 로그아웃
      console.error('[JWT 인증 실패] 세션이 만료되었습니다. 로그인 페이지로 이동합니다.')
      
      // 사용자에게 알림
      alert('⚠️ 세션이 만료되었습니다.\n다시 로그인해주세요.')
      
      // 로그아웃 처리
      localStorage.clear()
      window.location.href = '/jobseeker/login'
      
      throw new ApiException('세션이 만료되었습니다. 다시 로그인해주세요.', 401, 'Unauthorized')
    }

    if (!response.ok) {
      let errorData
      const contentType = response.headers.get('content-type')
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json()
        } else {
          errorData = await response.text()
        }
      } catch (parseError) {
        errorData = `Parse error: ${parseError}`
      }

      throw new ApiException(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText,
        errorData
      )
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return await response.text() as unknown as T
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof ApiException) {
      console.error('[apiCall] ApiException:', error)
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[apiCall] 요청 시간이 초과되었습니다:', url)
        throw new ApiException('요청 시간이 초과되었습니다.', 408, 'Request Timeout')
      }
      console.error('[apiCall] fetch 에러:', error)
      throw new ApiException(error.message, 0, 'Network Error')
    }

    console.error('[apiCall] 알 수 없는 오류:', error)
    throw new ApiException('알 수 없는 오류가 발생했습니다.', 0, 'Unknown Error')
  }
}

/**
 * 에러 메시지를 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    // 백엔드에서 보낸 실제 에러 메시지가 있으면 우선 표시
    if (error.message && error.message.trim() !== '') {
      return error.message
    }
    
    // 메시지가 없으면 상태 코드에 따른 기본 메시지
    if (error.status === 400) return '잘못된 요청입니다.'
    if (error.status === 401) return '인증이 필요합니다.'
    if (error.status === 403) return '권한이 없습니다.'
    if (error.status === 404) return '요청한 리소스를 찾을 수 없습니다.'
    if (error.status === 408) return '요청 시간이 초과되었습니다.'
    if (error.status === 500) return '서버 오류가 발생했습니다.'
    if (error.status === 503) return '서비스를 일시적으로 사용할 수 없습니다.'
    return '오류가 발생했습니다.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * localStorage 작업을 안전하게 처리
 */
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Failed to get item from localStorage (${key}):`, error)
    return defaultValue
  }
}

export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Failed to set item to localStorage (${key}):`, error)
    return false
  }
}

export function safeLocalStorageRemove(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Failed to remove item from localStorage (${key}):`, error)
    return false
  }
}

/**
 * Access Token 갱신 함수
 * Refresh Token을 사용하여 새로운 Access Token 발급
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    console.warn('[JWT 인증] Refresh Token이 없습니다.')
    return null
  }
  
  try {
    console.log('[JWT 인증] Refresh Token으로 Access Token 갱신 시도...')
    const apiUrl = createApiUrl('/api/auth/refresh')
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    })
    
    if (!response.ok) {
      console.error('[JWT 인증] Token 갱신 실패:', response.status, response.statusText)
      
      // 403 Forbidden 또는 401 Unauthorized - Refresh Token도 만료됨
      if (response.status === 401 || response.status === 403) {
        alert('⚠️ 로그인 세션이 완전히 만료되었습니다.\n다시 로그인해주세요.')
      }
      
      return null
    }
    
    const data = await response.json()
    
    console.log('[JWT 인증] Access Token 갱신 성공')
    
    // 새 토큰 저장
    localStorage.setItem('accessToken', data.accessToken)
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    }
    
    return data.accessToken
  } catch (error) {
    console.error('[JWT 인증] 토큰 갱신 중 오류 발생:', error)
    return null
  }
}

