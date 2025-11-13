import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

function PrivacyPolicy() {
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
            <Shield size={30} color="#2196f3" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>
            개인정보처리방침
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            최종 수정일: 2025년 1월 1일
          </p>
        </div>

        <div style={{ lineHeight: '1.8', color: '#333' }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제1조 (개인정보의 처리목적)
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              AI GigWork(이하 "회사"라 함)는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>회원 가입 및 관리</strong>
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 목적</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>AI 기반 일자리 추천 서비스 제공</strong>
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}>구직자의 프로필 정보(자격증, 경력, 신체 데이터 등)를 기반으로 한 맞춤형 일자리 추천</li>
                  <li style={{ marginBottom: '4px' }}>구직자-사업자 매칭 서비스 제공</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>고객 문의 및 불만 처리</strong>
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}>고객 문의사항 및 불만사항 처리, 공지사항 전달</li>
                </ul>
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제2조 (개인정보의 처리 및 보유기간)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>회원 가입 및 관리:</strong> 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)</li>
                  <li style={{ marginBottom: '4px' }}><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년</li>
                  <li style={{ marginBottom: '4px' }}><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년</li>
                  <li style={{ marginBottom: '4px' }}><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년</li>
                </ul>
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제3조 (처리하는 개인정보의 항목)
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              회사는 다음의 개인정보 항목을 처리하고 있습니다.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>구직자 회원</h3>
              <ul style={{ paddingLeft: '24px', fontSize: '16px' }}>
                <li style={{ marginBottom: '4px' }}><strong>필수항목:</strong> 이름, 이메일, 전화번호, 생년월일, 비밀번호</li>
                <li style={{ marginBottom: '4px' }}><strong>선택항목:</strong> 주소, 자격증 정보, 경력 정보, 신체 속성 데이터(근력, 키, 몸무게, 걸음수 등)</li>
              </ul>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>사업자 회원</h3>
              <ul style={{ paddingLeft: '24px', fontSize: '16px' }}>
                <li style={{ marginBottom: '4px' }}><strong>필수항목:</strong> 회사명, 사업자등록번호, 대표자명, 이메일, 전화번호, 회사 주소, 비밀번호</li>
              </ul>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>서비스 이용 과정에서 자동 수집되는 정보</h3>
              <ul style={{ paddingLeft: '24px', fontSize: '16px' }}>
                <li style={{ marginBottom: '4px' }}>IP주소, 쿠키, MAC주소, 서비스 이용 기록, 방문 기록, 불량 이용 기록 등</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제4조 (개인정보의 제3자 제공)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보를 제3자에게 제공할 수 있습니다.
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>제공받는 자:</strong> 매칭된 사업자(구직자의 경우) 또는 매칭된 구직자(사업자의 경우)</li>
                  <li style={{ marginBottom: '4px' }}><strong>제공하는 항목:</strong> 이름, 연락처, 기본 프로필 정보(매칭에 필요한 최소한의 정보)</li>
                  <li style={{ marginBottom: '4px' }}><strong>제공받는 자의 이용목적:</strong> 일자리 매칭 및 채용 업무</li>
                  <li style={{ marginBottom: '4px' }}><strong>보유 및 이용기간:</strong> 매칭 완료 후 1년 또는 회원 탈퇴 시까지</li>
                </ul>
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제5조 (개인정보처리의 위탁)
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
            </p>
            <ul style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>클라우드 서비스 제공업체:</strong> 서버 호스팅 및 데이터 저장
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>이메일 발송 서비스 제공업체:</strong> 이메일 발송 서비스
              </li>
            </ul>
            <p style={{ fontSize: '16px', marginTop: '12px', marginBottom: '12px' }}>
              회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제6조 (정보주체의 권리·의무 및 그 행사방법)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}>개인정보 처리정지 요구권</li>
                  <li style={{ marginBottom: '4px' }}>개인정보 열람요구권</li>
                  <li style={{ marginBottom: '4px' }}>개인정보 정정·삭제요구권</li>
                  <li style={{ marginBottom: '4px' }}>개인정보 처리정지 요구권</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제7조 (개인정보의 파기)
            </h2>
            <ol style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '8px' }}>
                회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
              </li>
              <li style={{ marginBottom: '8px' }}>
                개인정보 파기의 절차 및 방법은 다음과 같습니다.
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>파기절차:</strong> 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                  <li style={{ marginBottom: '4px' }}><strong>파기방법:</strong> 회사는 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>
                </ul>
              </li>
            </ol>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제8조 (개인정보 보호책임자)
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div style={{
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              fontSize: '16px'
            }}>
              <p style={{ marginBottom: '8px' }}><strong>개인정보 보호책임자</strong></p>
              <p style={{ marginBottom: '4px' }}>이름: 홍길동</p>
              <p style={{ marginBottom: '4px' }}>직책: 개인정보보호팀장</p>
              <p style={{ marginBottom: '4px' }}>연락처: privacy@gigwork.com</p>
              <p style={{ marginBottom: '4px' }}>전화: 02-1234-5678</p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              제9조 (개인정보의 안전성 확보조치)
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
            </p>
            <ul style={{ paddingLeft: '24px', fontSize: '16px' }}>
              <li style={{ marginBottom: '4px' }}>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
              <li style={{ marginBottom: '4px' }}>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
              <li style={{ marginBottom: '4px' }}>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#2196f3' }}>
              부칙
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>
              본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.
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
            본 개인정보처리방침에 동의하시겠습니까?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (isPopup) {
                  // 팝업 창인 경우 부모 창에 취소 메시지 전송
                  if (window.opener) {
                    window.opener.postMessage({ type: 'privacy', action: 'cancel' }, '*')
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
                    window.opener.postMessage({ type: 'privacy', action: 'agree' }, '*')
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

export default PrivacyPolicy

