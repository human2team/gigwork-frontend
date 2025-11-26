/**
 * Fetch API 전역 인터셉터
 * 모든 fetch 호출에 자동으로 JWT 토큰을 추가하고 401 에러를 처리합니다.
 */

// 원본 fetch 함수 저장
const originalFetch = window.fetch

// Refresh Token으로 Access Token 갱신
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    console.warn('[JWT 인증] Refresh Token이 없습니다.')
    return null
  }

  try {
    console.log('[JWT 인증] Refresh Token으로 Access Token 갱신 시도...')
    
    // 원본 fetch를 사용하여 무한 루프 방지
    const response = await originalFetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      console.error('[JWT 인증] Token 갱신 실패:', response.status, response.statusText)
      
      if (response.status === 401 || response.status === 403) {
        alert('⚠️ 로그인 세션이 완전히 만료되었습니다.\n다시 로그인해주세요.')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/jobseeker/login'
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

// 전역 fetch 오버라이드
export function setupFetchInterceptor() {
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // RequestInit가 없으면 기본 객체 생성
    const config: RequestInit = init || {}
    const headers = new Headers(config.headers || {})

    // API 호출인 경우에만 토큰 추가 (외부 API는 제외)
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const isApiCall = url.startsWith('/api') || url.includes('/api/')

    if (isApiCall) {
      // Access Token이 있으면 헤더에 추가
      const accessToken = localStorage.getItem('accessToken')
      if (accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessToken}`)
        console.log('[Fetch Interceptor] JWT 토큰 자동 추가:', url)
      }
    }

    // 헤더 설정 업데이트
    config.headers = headers

    // 원본 fetch 호출
    let response = await originalFetch(input, config)

    // 401 Unauthorized 처리
    if (response.status === 401 && isApiCall && url !== '/api/auth/refresh') {
      console.warn('[Fetch Interceptor] 401 Unauthorized 발생:', url)
      console.log('[Fetch Interceptor] Refresh Token으로 재시도...')

      // Access Token 갱신 시도
      const newAccessToken = await refreshAccessToken()

      if (newAccessToken) {
        // 새 토큰으로 재요청
        headers.set('Authorization', `Bearer ${newAccessToken}`)
        config.headers = headers
        
        console.log('[Fetch Interceptor] 새 토큰으로 재시도 중...')
        response = await originalFetch(input, config)
        
        if (response.ok) {
          console.log('[Fetch Interceptor] 재시도 성공')
        }
      } else {
        // Refresh Token도 실패하면 로그인 페이지로 리다이렉트
        console.error('[Fetch Interceptor] 세션이 만료되었습니다.')
        alert('⚠️ 세션이 만료되었습니다.\n다시 로그인해주세요.')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/jobseeker/login'
      }
    }

    return response
  }

  console.log('✅ Fetch Interceptor 활성화됨 - 모든 fetch 호출에 JWT 토큰이 자동으로 추가됩니다.')
}

// 원본 fetch 복원 (필요한 경우)
export function restoreOriginalFetch() {
  window.fetch = originalFetch
  console.log('✅ 원본 Fetch 복원됨')
}
