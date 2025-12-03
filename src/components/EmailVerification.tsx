import { useState, useEffect } from 'react'
import { apiCall, getErrorMessage } from '../utils/api'
import { Mail, CheckCircle } from 'lucide-react'

interface Props {
  email: string
  onVerified: (email: string) => void
}

export default function EmailVerification({ email, onVerified }: Props) {
  const [code, setCode] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(0)

  // 이메일이 변경되면 인증 상태 초기화
  useEffect(() => {
    setIsVerified(false)
    setCode('')
    setMessage('')
    setCountdown(0)
  }, [email])

  // 인증 코드 발송
  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setMessage('유효한 이메일 주소를 입력해주세요.')
      return
    }

    setIsSending(true)
    setMessage('')
    
    try {
      // 1. 먼저 이메일 중복 체크
      const checkResponse = await apiCall<{ exists: boolean; message: string }>(
        `/api/auth/email/check?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      // 2. 이미 존재하는 이메일이면 인증번호 발송 중단
      if (checkResponse.exists) {
        setMessage('이미 존재하는 이메일입니다.')
        setIsSending(false)
        return
      }
      
      // 3. 중복이 아니면 인증번호 발송
      await apiCall<{ success: string; message: string }>('/api/auth/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      setMessage('인증 코드가 발송되었습니다. 이메일을 확인해주세요.')
      setCountdown(180) // 3분 타이머
      setIsVerified(false)
    } catch (error) {
      setMessage(getErrorMessage(error) || '인증 코드 발송에 실패했습니다.')
    } finally {
      setIsSending(false)
    }
  }

  // 인증 코드 검증
  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setMessage('6자리 인증 코드를 입력해주세요.')
      return
    }

    setIsVerifying(true)
    setMessage('')
    
    try {
      const response = await apiCall<{ success: string; message: string }>('/api/auth/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      
      setIsVerified(true)
      setMessage('이메일 인증이 완료되었습니다.')
      onVerified(email)
    } catch (error) {
      setMessage(getErrorMessage(error) || '인증 코드가 일치하지 않거나 만료되었습니다.')
    } finally {
      setIsVerifying(false)
    }
  }

  // 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 인증 완료 상태
  if (isVerified) {
    return (
      <div style={{ 
        marginTop: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: '#4caf50', 
        fontSize: '14px',
        fontWeight: '500'
      }}>
        <CheckCircle size={18} />
        <span>이메일 인증 완료</span>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        type="button"
        onClick={handleSendCode}
        disabled={isSending || countdown > 0 || !email || !email.includes('@')}
        style={{
          padding: '8px 16px',
          backgroundColor: (countdown > 0 || !email || !email.includes('@')) ? '#ccc' : '#2196f3',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: (countdown > 0 || !email || !email.includes('@')) ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: countdown > 0 ? '12px' : '0'
        }}
      >
        <Mail size={16} />
        {isSending ? '발송 중...' : countdown > 0 ? `재발송 (${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')})` : '인증 코드 발송'}
      </button>
      
      {countdown > 0 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6자리 인증 코드"
            maxLength={6}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              textAlign: 'center',
              letterSpacing: '4px',
              fontFamily: 'monospace'
            }}
          />
          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={isVerifying || code.length !== 6}
            style={{
              padding: '10px 20px',
              backgroundColor: code.length === 6 ? '#4caf50' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: code.length === 6 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            {isVerifying ? '인증 중...' : '인증하기'}
          </button>
        </div>
      )}
      
      {message && (
        <div style={{
          marginTop: '8px',
          color: message.includes('완료') ? '#4caf50' : message.includes('발송') ? '#2196f3' : '#f44336',
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}

