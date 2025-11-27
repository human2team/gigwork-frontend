import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { apiCall, getErrorMessage, createApiUrl } from '../utils/api'

function JobseekerLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { setJobseekerProfile } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    try {
      // 로그인은 401 처리가 특수하므로 apiCall 대신 직접 fetch 사용
      const res = await fetch(createApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        // 400/401은 사용자 친화 메시지
        if (res.status === 400 || res.status === 401) {
          alert('이메일주소/비밀번호가 잘못되었습니다.\n다시 시도하거나 회원이 아닐경우 회원가입 창으로 이동하시길 바랍니다.')
          return
        }
        const data = await res.json().catch(() => ({}))
        alert(data.message || `로그인 실패 (HTTP ${res.status})`)
        return
      }
      const response = await res.json() as {
        userId: number
        email: string
        userType: string
        message: string
        accessToken: string
        refreshToken: string
      }
      
      // 로그인 성공 처리 (구직자 전용 가드)
      if (response.userType !== 'JOBSEEKER') {
        alert('구직자 계정이 아닙니다.')
        return
      }
      
      // JWT 토큰과 사용자 정보를 localStorage에 저장
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      localStorage.setItem('userId', response.userId.toString())
      localStorage.setItem('userEmail', response.email)
      localStorage.setItem('userType', response.userType)
      
      // 구직자 전체 프로필 가져오기 및 저장
      try {
        const profileResponse = await apiCall<any>(`/api/jobseeker/profile/${response.userId}`, {
          method: 'GET'
        })
        localStorage.setItem('jobseekerProfile', JSON.stringify(profileResponse))
        localStorage.setItem('userName', profileResponse.name)
        setJobseekerProfile(profileResponse)
      } catch (profileError) {
        console.error('프로필 로딩 실패:', profileError)
        // 프로필 로딩 실패해도 로그인은 진행
      }
      
      // Context 로그인 상태 업데이트
      login('jobseeker')
      
      // 페이지 이동
      navigate('/jobseeker/search')
    } catch (error) {
      console.error('로그인 실패:', error)
      alert(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #2196f3',
        borderRadius: '8px',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
        position: 'relative'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#666'
          }}
        >
          <ArrowLeft size={16} />
          뒤로가기
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#e3f2fd',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <User size={30} color="#2196f3" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>
            구직자 로그인
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            이메일 주소와 비밀번호를 사용하여 로그인하세요
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            login('jobseeker')
            navigate('/jobseeker/search')
          }}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>G</span>
          Google로 계속하기
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px', color: '#999' }}>
          또는
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              이메일 주소
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isSubmitting ? '#90caf9' : '#2196f3',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <a href="#" style={{ color: '#2196f3', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            비밀번호를 잊으셨나요?
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              navigate('/signup/jobseeker')
            }}
            style={{ color: '#2196f3', textDecoration: 'none', fontSize: '14px' }}
          >
            계정이 없으신가요? 회원가입
          </a>
        </div>
      </div>
    </div>
  )
}

export default JobseekerLogin

