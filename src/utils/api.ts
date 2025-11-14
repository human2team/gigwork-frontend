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

  try {
    const response = await fetch(apiUrl, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

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
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiException('요청 시간이 초과되었습니다.', 408, 'Request Timeout')
      }
      throw new ApiException(error.message, 0, 'Network Error')
    }

    throw new ApiException('알 수 없는 오류가 발생했습니다.', 0, 'Unknown Error')
  }
}

/**
 * 에러 메시지를 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    if (error.status === 400) return '잘못된 요청입니다.'
    if (error.status === 401) return '인증이 필요합니다.'
    if (error.status === 403) return '권한이 없습니다.'
    if (error.status === 404) return '요청한 리소스를 찾을 수 없습니다.'
    if (error.status === 408) return '요청 시간이 초과되었습니다.'
    if (error.status === 500) return '서버 오류가 발생했습니다.'
    if (error.status === 503) return '서비스를 일시적으로 사용할 수 없습니다.'
    return error.message || '오류가 발생했습니다.'
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

