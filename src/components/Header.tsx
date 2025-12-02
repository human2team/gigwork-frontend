import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { apiCall } from '../utils/api'
import { useUser } from '../contexts/UserContext'

function Header() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const [userName, setUserName] = useState('')
  const { jobseekerProfile } = useUser()

  // 사용자 이름 가져오기
  useEffect(() => {
    const fetchUserName = async () => {
      // localStorage에서 userName이 있으면 사용
      const savedUserName = localStorage.getItem('userName')
      if (savedUserName) {
        setUserName(savedUserName)
        return
      }

      const userId = localStorage.getItem('userId')
      const userType = localStorage.getItem('userType')
      if (!userId) return
      
      try {
        // userType에 따라 다른 API 호출
        if (userType === 'JOBSEEKER') {
          const response = await apiCall<{
            name: string
          }>(`/api/jobseeker/profile/${userId}`, {
            method: 'GET'
          })
          setUserName(response.name)
          localStorage.setItem('userName', response.name)
        } else if (userType === 'EMPLOYER') {
          // 사업자는 localStorage의 userName 사용 (로그인 시 저장됨)
          const savedName = localStorage.getItem('userName')
          if (savedName) {
            setUserName(savedName)
          }
        }
      } catch (error) {
        console.error('사용자 이름 로딩 실패:', error)
      }
    }
    
    if (isAuthenticated) {
      fetchUserName()
    }
  }, [isAuthenticated])

  // jobseekerProfile이 변경되면 헤더 이름을 즉시 동기화
  useEffect(() => {
    try {
      if (jobseekerProfile && jobseekerProfile.name) {
        setUserName(jobseekerProfile.name)
        localStorage.setItem('userName', jobseekerProfile.name)
      }
    } catch (e) {
      // ignore
    }
  }, [jobseekerProfile])

  const handleLogout = () => {
    logout()
    setUserName('')
    localStorage.removeItem('userName')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userType')
    navigate('/')
  }

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0'
    }}>
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#2196f3',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>AI</div>
        <span style={{ fontWeight: 'bold', color: '#2196f3', fontSize: '18px' }}>GigWork</span>
      </div>
      
      {isAuthenticated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {userName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              color: '#2196f3',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <User size={16} />
              <span>{userName}님</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#666',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
              e.currentTarget.style.borderColor = '#2196f3'
              e.currentTarget.style.color = '#2196f3'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.borderColor = '#e0e0e0'
              e.currentTarget.style.color = '#666'
            }}
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      )}
    </header>
  )
}

export default Header

