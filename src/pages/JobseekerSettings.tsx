import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Lock, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import JobseekerProposals from './JobseekerProposals'

function JobseekerSettings() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  
  // 비밀번호 변경 관련 상태
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // 탈퇴 관련 상태
  const [withdrawalPassword, setWithdrawalPassword] = useState('')
  const [withdrawalConfirm, setWithdrawalConfirm] = useState(false)
  const [showWithdrawalPassword, setShowWithdrawalPassword] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 비밀번호 변경 제출
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('모든 필드를 입력해주세요.')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      alert('새 비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
      return
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      alert('현재 비밀번호와 새 비밀번호가 동일합니다.')
      return
    }
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        alert('로그인이 필요합니다.')
        return
      }
      const res = await fetch(`/api/auth/change-password/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        alert(data.message || '비밀번호가 성공적으로 변경되었습니다.')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        alert(data.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (err) {
      alert('비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  // 탈퇴 모달 열기
  const handleOpenWithdrawalModal = () => {
    setShowWithdrawalModal(true)
  }

  // 탈퇴 모달 닫기
  const handleCloseWithdrawalModal = () => {
    setShowWithdrawalModal(false)
    setWithdrawalPassword('')
    setWithdrawalConfirm(false)
  }

  // 탈퇴 처리
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!withdrawalPassword) {
      alert('비밀번호를 입력해주세요.')
      return
    }
    
    if (!withdrawalConfirm) {
      alert('탈퇴 확인을 위해 체크박스를 선택해주세요.')
      return
    }
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        alert('로그인이 필요합니다.')
        return
      }
      const res = await fetch(`/api/auth/account/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: withdrawalPassword })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        alert(data.message || '계정이 탈퇴되었습니다.')
        logout()
        navigate('/')
      } else {
        alert(data.message || '계정 탈퇴에 실패했습니다.')
      }
    } catch (err) {
      alert('계정 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Settings size={32} />
        설정
      </h1>

      {/* 비밀번호 변경 섹션 */}
      <div style={{
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Lock size={24} color="#2196f3" />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>비밀번호 변경</h2>
        </div>

        <form onSubmit={handlePasswordSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              현재 비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="현재 비밀번호를 입력하세요"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showCurrentPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              새 비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="새 비밀번호를 입력하세요 (최소 8자)"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showNewPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              새 비밀번호 확인
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="새 비밀번호를 다시 입력하세요"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirmPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#2196f3',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1976d2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2196f3'
            }}
          >
            비밀번호 변경
          </button>
        </form>
      </div>

      {/* 신체 속성 섹션 */}
      {/* 예시: 실제 신체 속성 UI/컴포넌트가 있다면 여기에 위치 */}
      {/* <PhysicalAttributesSection /> */}


      {/* 저장된 일자리/관심 목록 섹션 */}
      {/* 예시: 실제 저장된 일자리 UI/컴포넌트가 있다면 여기에 위치 */}
      {/* <SavedJobsSection /> */}

      {/* 계정 탈퇴 섹션 */}
      <div style={{
        padding: '24px',
        backgroundColor: '#fff3e0',
        borderRadius: '12px',
        border: '1px solid #ff9800'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertTriangle size={24} color="#ff9800" />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800' }}>계정 탈퇴</h2>
        </div>
        
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          계정을 탈퇴하시면 모든 데이터가 삭제되며 복구할 수 없습니다.
        </p>

        <button
          onClick={handleOpenWithdrawalModal}
          style={{
            padding: '12px 24px',
            border: '1px solid #ff5722',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#ff5722',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffebee'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff'
          }}
        >
          <Trash2 size={18} />
          계정 탈퇴
        </button>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showWithdrawalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <AlertTriangle size={32} color="#ff5722" />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff5722' }}>계정 탈퇴 확인</h2>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '12px' }}>
                계정을 탈퇴하시면 다음 정보가 모두 삭제됩니다:
              </p>
              <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>개인정보 및 프로필</li>
                <li>자격증 및 경력 정보</li>
                <li>신체 속성 데이터</li>
                <li>지원 내역 및 이력서</li>
                <li>저장된 일자리 및 관심 목록</li>
                <li>모든 활동 내역</li>
              </ul>
              <p style={{ fontSize: '14px', color: '#ff5722', fontWeight: 'bold', marginTop: '12px' }}>
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <form onSubmit={handleWithdrawal}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  비밀번호 확인
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showWithdrawalPassword ? 'text' : 'password'}
                    value={withdrawalPassword}
                    onChange={(e) => setWithdrawalPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWithdrawalPassword(!showWithdrawalPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showWithdrawalPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={withdrawalConfirm}
                    onChange={(e) => setWithdrawalConfirm(e.target.checked)}
                    required
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    위 내용을 확인했으며, 계정 탈퇴에 동의합니다.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseWithdrawalModal}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#ff5722',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d84315'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff5722'
                  }}
                >
                  탈퇴하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobseekerSettings

