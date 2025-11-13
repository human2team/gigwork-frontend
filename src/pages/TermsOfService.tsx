import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

function TermsOfService() {
  const navigate = useNavigate()
  const [isPopup, setIsPopup] = useState(false)

  useEffect(() => {
    // 팝업 창인지 확인
    if (window.opener) {
      setIsPopup(true)
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '48px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => {
            if (isPopup) {
              window.close()
            } else {
              navigate(-1)
            }
          }}
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
            marginBottom: '24px'
          }}
        >
          <ArrowLeft size={16} />
          뒤로가기
        </button>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
            <FileText size={30} color="#2196f3" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>
            이용약관
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            최종 수정일: 2025년 1월 1일
          </p>
        </div>

        <div style={{ lineHeight: '1.8', color: '#333' }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제1조 (목적)
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              본 약관은 AI GigWork(이하 "회사"라 함)가 제공하는 AI 기반 개인 맞춤형 단기 파트타임 일자리 추천 서비스(이하 "서비스"라 함)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제2조 (정의)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                "서비스"란 회사가 제공하는 AI 기반 일자리 추천, 구직자-사업자 매칭, 관련 정보 제공 서비스를 의미합니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                "이용자"란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 구직자 및 사업자를 의미합니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                "구직자"란 단기 파트타임 일자리를 찾는 개인을 의미합니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                "사업자"란 일자리를 등록하고 구직자를 모집하는 회사, 개인사업자 등을 의미합니다.
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제3조 (약관의 게시와 개정)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제4조 (회원가입)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                회사는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                  <li style={{ marginBottom: '4px' }}>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li style={{ marginBottom: '4px' }}>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제5조 (서비스의 제공 및 변경)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                회사는 다음과 같은 서비스를 제공합니다.
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}>AI 기반 개인 맞춤형 일자리 추천 서비스</li>
                  <li style={{ marginBottom: '4px' }}>구직자-사업자 매칭 서비스</li>
                  <li style={{ marginBottom: '4px' }}>일자리 검색 및 정보 제공 서비스</li>
                  <li style={{ marginBottom: '4px' }}>기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                회사는 필요한 경우 서비스의 내용을 추가 또는 변경할 수 있습니다.
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제6조 (회원의 의무)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                회원은 다음 행위를 하여서는 안 됩니다.
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}>신청 또는 변경 시 허위내용의 등록</li>
                  <li style={{ marginBottom: '4px' }}>타인의 정보 도용</li>
                  <li style={{ marginBottom: '4px' }}>회사가 게시한 정보의 변경</li>
                  <li style={{ marginBottom: '4px' }}>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li style={{ marginBottom: '4px' }}>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li style={{ marginBottom: '4px' }}>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li style={{ marginBottom: '4px' }}>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위</li>
                </ul>
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제7조 (개인정보의 보호)
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다. 회사는 공개 및 변경에 대한 동의를 받은 경우에만 개인정보를 수집·이용합니다. 자세한 내용은 개인정보처리방침을 참조하시기 바랍니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제8조 (면책조항)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              부칙
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              본 약관은 2025년 1월 1일부터 시행됩니다.
            </p>
          </section>
        </div>

        <div style={{
          marginTop: '48px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            본 약관에 동의하시겠습니까?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (isPopup) {
                  // 팝업 창인 경우 부모 창에 취소 메시지 전송
                  if (window.opener) {
                    window.opener.postMessage({ type: 'terms', action: 'cancel' }, '*')
                    window.close()
                  }
                } else {
                  navigate(-1)
                }
              }}
              style={{
                padding: '10px 24px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              취소
            </button>
            <button
              onClick={() => {
                if (isPopup) {
                  // 팝업 창인 경우 부모 창에 동의 메시지 전송
                  if (window.opener) {
                    window.opener.postMessage({ type: 'terms', action: 'agree' }, '*')
                    window.close()
                  }
                } else {
                  navigate(-1)
                }
              }}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#2196f3',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              동의
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService

