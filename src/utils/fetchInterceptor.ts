/**
 * Fetch API 전역 인터셉터
 * 모든 fetch 호출에 Cookie 기반 JWT 인증을 자동으로 처리합니다.
 */

// 원본 fetch 함수 저장
const originalFetch = window.fetch

// 동시 refresh 방지를 위한 Promise 캐싱
let refreshTokenPromise: Promise<boolean> | null = null

// Refresh Token으로 Access Token 갱신
async function refreshAccessToken(): Promise<boolean> {
  // 이미 refresh 진행 중이면 기존 Promise 재사용
  if (refreshTokenPromise) {
    console.log('[JWT 인증 - Interceptor] 이미 진행 중인 refresh 요청이 있습니다. 대기 중...')
    return refreshTokenPromise
  }
  
  // 새 refresh 요청 시작
  refreshTokenPromise = (async () => {
    try {
      console.log('[JWT 인증] Refresh Token으로 Access Token 갱신 시도...')
      
      // Cookie는 자동으로 전송되므로 별도로 추가할 필요 없음
      const response = await originalFetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie 포함
      })

      console.log('[JWT 인증 - Interceptor] 갱신 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('[JWT 인증 - Interceptor] Token 갱신 실패:', response.status, response.statusText, 'Body:', errorBody)
        
        if (response.status === 401 || response.status === 403) {
          console.error('[JWT 인증 실패 상세 - Interceptor]', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorBody,
            currentCookies: document.cookie
          })
          // 개발 중에는 자동 로그아웃 비활성화
          // alert('⚠️ 로그인 세션이 완전히 만료되었습니다.\n다시 로그인해주세요.')
          // localStorage.clear()
          // window.location.href = '/jobseeker/login'
        }
        
        return false
      }

      const responseBody = await response.text()
      console.log('[JWT 인증 - Interceptor] Access Token 갱신 성공 (Cookie에 저장됨). Response:', responseBody)
      return true
    } catch (error) {
      console.error('[JWT 인증 - Interceptor] 토큰 갱신 중 오류 발생:', error)
      return false
    } finally {
      // refresh 완료 후 Promise 초기화 (다음 refresh 허용)
      refreshTokenPromise = null
    }
  })()
  
  return refreshTokenPromise
}

// 전역 fetch 오버라이드
export function setupFetchInterceptor() {
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // RequestInit가 없으면 기본 객체 생성
    const config: RequestInit = init || {}

    // API 호출인 경우 credentials 설정
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const isApiCall = url.startsWith('/api') || url.includes('/api/')

    if (isApiCall) {
      // Cookie를 자동으로 포함하도록 설정
      config.credentials = 'include'
      console.log('[Fetch Interceptor] Cookie 포함 설정:', url)
    }

    // 원본 fetch 호출
    let response = await originalFetch(input, config)

    // 401 Unauthorized 처리 (login과 refresh는 제외)
    if (response.status === 401 && isApiCall && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login')) {
      console.warn('[Fetch Interceptor] 401 Unauthorized 발생:', url)
      console.log('[Fetch Interceptor] Refresh Token으로 재시도...')

      // Access Token 갱신 시도
      const refreshSuccess = await refreshAccessToken()

      if (refreshSuccess) {
        // 새 토큰으로 재요청 (Cookie가 자동으로 포함됨)
        console.log('[Fetch Interceptor] 새 토큰으로 재시도 중...')
        response = await originalFetch(input, config)
        
        if (response.ok) {
          console.log('[Fetch Interceptor] 재시도 성공')
        } else {
          console.error('[Fetch Interceptor] 재시도도 실패:', response.status)
          // 재시도 실패 시에도 response 반환 (로그아웃하지 않음)
        }
      } else {
        // Refresh Token도 실패하면 로그인 페이지로 리다이렉트
        console.error('[Fetch Interceptor] 세션이 만료되었습니다.')
        alert('⚠️ 세션이 만료되었습니다.\n다시 로그인해주세요.')
        localStorage.clear()
        window.location.href = '/jobseeker/login'
      }
    }

    return response
  }

  console.log('✅ Fetch Interceptor 활성화됨 - Cookie 기반 JWT 인증')
}

// 원본 fetch 복원 (필요한 경우)
export function restoreOriginalFetch() {
  window.fetch = originalFetch
  console.log('✅ 원본 Fetch 복원됨')
}
