import { useNavigate } from 'react-router-dom'
import { Briefcase, User, ArrowRight } from 'lucide-react'

function Home() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center',
        marginBottom: '48px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#2196f3',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '20px'
          }}>AI</div>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#2196f3' }}>GigWork</h1>
        </div>
        <p style={{ fontSize: '20px', color: '#666', marginBottom: '8px' }}>
          AI 기반 개인 맞춤형 단기 파트타임 일자리 추천 시스템
        </p>
        <p style={{ fontSize: '16px', color: '#999' }}>
          사업자와 구직자를 연결하는 스마트 플랫폼
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '800px'
      }}>
        {/* 구직자 카드 */}
        <div
          onClick={() => navigate('/login/jobseeker')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '40px',
            border: '2px solid #e0e0e0',
            cursor: 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#2196f3'
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(33,150,243,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e0e0e0'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#e3f2fd',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <User size={40} color="#2196f3" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
            구직자
          </h2>
          <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
            AI 기반 맞춤형 일자리 추천을 받고<br />
            최적의 단기 파트타임 일자리를 찾아보세요
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#2196f3',
            fontWeight: '600'
          }}>
            <span>로그인하기</span>
            <ArrowRight size={20} />
          </div>
        </div>

        {/* 사업자 카드 */}
        <div
          onClick={() => navigate('/login/employer')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '40px',
            border: '2px solid #e0e0e0',
            cursor: 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#2196f3'
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(33,150,243,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e0e0e0'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#e3f2fd',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <Briefcase size={40} color="#2196f3" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
            사업자
          </h2>
          <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
            인재를 찾고 일자리를 등록하여<br />
            최적의 구직자를 매칭받으세요
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#2196f3',
            fontWeight: '600'
          }}>
            <span>로그인하기</span>
            <ArrowRight size={20} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '48px', textAlign: 'center' }}>
        <p style={{ color: '#999', fontSize: '14px' }}>
          계정이 없으신가요?{' '}
          <span style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate('/signup/jobseeker')
              }}
              style={{ color: '#2196f3', textDecoration: 'none', fontSize: '14px' }}
            >
              구직자 회원가입
            </a>
            <span style={{ color: '#999' }}>|</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate('/signup/employer')
              }}
              style={{ color: '#2196f3', textDecoration: 'none', fontSize: '14px' }}
            >
              사업자 회원가입
            </a>
          </span>
        </p>
      </div>
    </div>
  )
}

export default Home

