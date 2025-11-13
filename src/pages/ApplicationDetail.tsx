import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Award, Briefcase, Activity, CheckCircle, XCircle, Clock, GraduationCap } from 'lucide-react'
import { useApplication } from '../contexts/ApplicationContext'

type License = {
  id: number
  name: string
  issueDate: string
  expiryDate: string
}

type Experience = {
  id: number
  company: string
  position: string
  duration: string
  description: string
}

type ApplicationDetailTab = 'personal' | 'licenses' | 'experience' | 'physical'

// 더미 데이터 (실제로는 localStorage나 API에서 가져와야 함)
const mockApplicantData: Record<number, any> = {
  1: {
    id: 1,
    applicantName: '김민수',
    jobTitle: '데이터 입력 전문가',
    email: 'minsu.kim@example.com',
    phone: '010-1234-5678',
    appliedDate: '2025-01-15',
    status: '대기',
    suitability: 92,
    personalInfo: {
      name: '김민수',
      email: 'minsu.kim@example.com',
      phone: '010-1234-5678',
      birthDate: '1990-03-15',
      address: '서울시 강남구 테헤란로 456',
      education: '대학(4년제)',
      preferredRegion: '서울',
      preferredDistrict: '강남구',
      preferredDong: '역삼동',
      workDuration: '1개월~3개월',
      workDays: '월~금',
      workTime: '오후 파트타임(12:00~18:00)',
      strengths: ['빠른 학습능력', '책임감', '성실함'],
      mbti: 'ISTJ',
      introduction: '안녕하세요. 데이터 입력 업무에 대한 경험이 풍부하며, 빠른 타이핑 속도와 정확성을 자랑합니다. 꼼꼼하고 책임감 있는 자세로 업무에 임하겠습니다.'
    },
    licenses: [
      { id: 1, name: '운전면허증', issueDate: '2015-03-20', expiryDate: '2025-03-20' },
      { id: 2, name: '컴퓨터활용능력 1급', issueDate: '2018-06-15', expiryDate: '-' }
    ],
    experience: [
      { id: 1, company: '데이터 솔루션즈', position: '데이터 입력원', duration: '2년', description: '대량의 데이터 입력 및 검수 업무 담당' }
    ],
    physical: {
      height: '175cm',
      weight: '70kg',
      muscleStrength: '중'
    }
  },
  2: {
    id: 2,
    applicantName: '이영희',
    jobTitle: '데이터 입력 전문가',
    email: 'younghee.lee@example.com',
    phone: '010-2345-6789',
    appliedDate: '2025-01-14',
    status: '합격',
    suitability: 88,
    personalInfo: {
      name: '이영희',
      email: 'younghee.lee@example.com',
      phone: '010-2345-6789',
      birthDate: '1992-07-22',
      address: '서울시 서초구 서초대로 789',
      education: '대학(4년제)',
      preferredRegion: '서울',
      preferredDistrict: '서초구',
      preferredDong: '서초동',
      workDuration: '3개월~6개월',
      workDays: '월~금',
      workTime: '풀타임(8시간이상)',
      strengths: ['적극적인 커뮤니케이션', '팀워크', '문제해결능력'],
      mbti: 'ENFP',
      introduction: '커뮤니케이션 능력이 뛰어나고 팀워크를 중시합니다. 다양한 프로젝트 경험을 바탕으로 빠르게 적응하고 기여할 수 있습니다.'
    },
    licenses: [
      { id: 1, name: '운전면허증', issueDate: '2016-05-10', expiryDate: '2026-05-10' }
    ],
    experience: [
      { id: 1, company: 'ABC 기업', position: '사무직', duration: '1년 6개월', description: '문서 관리 및 데이터 정리 업무' }
    ],
    physical: {
      height: '162cm',
      weight: '55kg',
      muscleStrength: '중'
    }
  },
  3: {
    id: 3,
    applicantName: '박준호',
    jobTitle: '소셜 미디어 관리자',
    email: 'junho.park@example.com',
    phone: '010-3456-7890',
    appliedDate: '2025-01-13',
    status: '불합격',
    suitability: 65,
    personalInfo: {
      name: '박준호',
      email: 'junho.park@example.com',
      phone: '010-3456-7890',
      birthDate: '1988-11-30',
      address: '부산시 해운대구 해운대해변로 123',
      education: '대학(4년제)',
      preferredRegion: '부산',
      preferredDistrict: '해운대구',
      preferredDong: '우동',
      workDuration: '6개월 이상',
      workDays: '월~일',
      workTime: '풀타임(8시간이상)',
      strengths: ['창의성', '빠른 대응', '컴퓨터 활용능력'],
      mbti: 'ENTP',
      introduction: '소셜 미디어 마케팅에 대한 열정이 있으며, 다양한 플랫폼 운영 경험이 있습니다.'
    },
    licenses: [],
    experience: [
      { id: 1, company: '마케팅 에이전시', position: '소셜 미디어 매니저', duration: '3년', description: '인스타그램, 페이스북 등 SNS 운영 및 콘텐츠 제작' }
    ],
    physical: {
      height: '180cm',
      weight: '75kg',
      muscleStrength: '상'
    }
  },
  4: {
    id: 4,
    applicantName: '정수진',
    jobTitle: '카페 바리스타',
    email: 'sujin.jung@example.com',
    phone: '010-4567-8901',
    appliedDate: '2025-01-16',
    status: '대기',
    suitability: 85,
    personalInfo: {
      name: '정수진',
      email: 'sujin.jung@example.com',
      phone: '010-4567-8901',
      birthDate: '1995-09-08',
      address: '대전시 유성구 대학로 456',
      education: '대학(2,3년제)',
      preferredRegion: '대전',
      preferredDistrict: '유성구',
      preferredDong: '노은동',
      workDuration: '1개월~3개월',
      workDays: '월~일',
      workTime: '오후 파트타임(12:00~18:00)',
      strengths: ['고객 서비스', '세심함', '빠른 학습능력'],
      mbti: 'ISFJ',
      introduction: '카페 바리스타 경험이 있으며, 고객 서비스를 중시합니다. 친절하고 세심한 서비스로 고객 만족도를 높이겠습니다.'
    },
    licenses: [
      { id: 1, name: '바리스타 자격증', issueDate: '2020-08-20', expiryDate: '-' }
    ],
    experience: [
      { id: 1, company: '스타벅스', position: '바리스타', duration: '1년', description: '커피 제조 및 고객 서비스' }
    ],
    physical: {
      height: '165cm',
      weight: '52kg',
      muscleStrength: '하'
    }
  }
}

function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getApplication, updateApplicationStatus: updateStatus } = useApplication()
  const [activeTab, setActiveTab] = useState<ApplicationDetailTab>('personal')
  const [applicant, setApplicant] = useState<any>(null)

  useEffect(() => {
    // ApplicationContext에서 데이터 가져오기
    const applicationId = Number(id)
    const data = getApplication(applicationId)
    console.log('📋 Application detail loaded:', data)
    if (data) {
      setApplicant(data)
    }
  }, [id, getApplication])

  const getStatusColor = (status: string) => {
    switch (status) {
      case '합격':
        return '#4caf50'
      case '불합격':
        return '#f44336'
      case '대기':
        return '#ff9800'
      default:
        return '#666'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '합격':
        return <CheckCircle size={16} />
      case '불합격':
        return <XCircle size={16} />
      case '대기':
        return <Clock size={16} />
      default:
        return null
    }
  }

  const getSuitabilityColor = (score: number) => {
    if (score >= 85) return '#4caf50'
    if (score >= 75) return '#ff9800'
    return '#f44336'
  }

  const handleStatusChange = (newStatus: '대기' | '합격' | '불합격') => {
    if (window.confirm(`지원자 상태를 "${newStatus}"로 변경하시겠습니까?`)) {
      const applicationId = Number(id)
      updateStatus(applicationId, newStatus)
      console.log(`Application ${id} status changed to ${newStatus}`)
      alert(`지원자 상태가 "${newStatus}"로 변경되었습니다.`)
      // 로컬 상태 업데이트
      if (applicant) {
        setApplicant({ ...applicant, status: newStatus })
      }
    }
  }

  if (!applicant) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>지원자를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/employer/applications')}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            border: '1px solid #2196f3',
            borderRadius: '6px',
            backgroundColor: '#2196f3',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          지원자 관리로 돌아가기
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'personal' as ApplicationDetailTab, label: '개인정보', icon: User },
    { id: 'licenses' as ApplicationDetailTab, label: '자격증', icon: Award },
    { id: 'experience' as ApplicationDetailTab, label: '경력', icon: Briefcase },
    { id: 'physical' as ApplicationDetailTab, label: '신체속성', icon: Activity }
  ]

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/employer/applications')}
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
            color: '#666'
          }}
        >
          <ArrowLeft size={18} />
          목록으로
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            {applicant.applicantName} 지원자 상세
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#666' }}>
            <span>지원 일자리: {applicant.jobTitle}</span>
            <span>지원일: {applicant.appliedDate}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: getStatusColor(applicant.status),
            color: '#ffffff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {getStatusIcon(applicant.status)}
            {applicant.status}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 12px',
            backgroundColor: getSuitabilityColor(applicant.suitability),
            color: '#ffffff',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            적합도: {applicant.suitability}%
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #2196f3' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? '#2196f3' : '#666',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-2px'
              }}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 탭 컨텐츠 */}
      <div style={{
        padding: '32px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {/* 개인정보 탭 */}
        {activeTab === 'personal' && applicant.personalInfo && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>개인정보</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>이름</label>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{applicant.personalInfo.name}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>이메일</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="#666" />
                  {applicant.personalInfo.email}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>전화번호</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="#666" />
                  {applicant.personalInfo.phone}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>생년월일</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#666" />
                  {applicant.personalInfo.birthDate}
                </div>
              </div>
              {applicant.personalInfo.gender && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>성별</label>
                  <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} color="#666" />
                    {applicant.personalInfo.gender}
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>주소</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="#666" />
                  {applicant.personalInfo.address}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>학력</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={16} color="#666" />
                  {applicant.personalInfo.education}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>희망 근무 조건</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>희망 지역</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    {applicant.personalInfo.preferredRegion} {applicant.personalInfo.preferredDistrict} {applicant.personalInfo.preferredDong}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>근무 기간</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{applicant.personalInfo.workDuration}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>근무 일시</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{applicant.personalInfo.workDays}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>근무 시간</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{applicant.personalInfo.workTime}</div>
                </div>
              </div>
            </div>

            {/* 백엔드에서 제공하지 않는 선택적 필드들 */}
            {applicant.personalInfo.strengths && applicant.personalInfo.strengths.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>나의 강점</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {applicant.personalInfo.strengths.map((strength: string, index: number) => (
                    <span
                      key={index}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e3f2fd',
                        color: '#2196f3',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {applicant.personalInfo.mbti && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>MBTI</label>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{applicant.personalInfo.mbti}</div>
              </div>
            )}

            {applicant.personalInfo.introduction && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>자기소개</label>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                  minHeight: '100px'
                }}>
                  {applicant.personalInfo.introduction}
                </div>
              </div>
            )}
            
            {/* 개인정보 탭에만 합격/불합격 처리 버튼 표시 */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #e0e0e0',
              justifyContent: 'flex-end'
            }}>
              {applicant.status !== '합격' && (
                <button
                  onClick={() => handleStatusChange('합격')}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #4caf50',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    color: '#4caf50',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  합격 처리
                </button>
              )}
              {applicant.status !== '불합격' && (
                <button
                  onClick={() => handleStatusChange('불합격')}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #f44336',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    color: '#f44336',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  불합격 처리
                </button>
              )}
            </div>
          </div>
        )}

        {/* 자격증 탭 */}
        {activeTab === 'licenses' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>자격증</h2>
            {applicant.licenses && applicant.licenses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applicant.licenses.map((license: License) => (
                  <div
                    key={license.id}
                    style={{
                      padding: '20px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                          {license.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666' }}>
                          <div>
                            <span style={{ fontWeight: '500' }}>발급일:</span> {license.issueDate || '-'}
                          </div>
                          <div>
                            <span style={{ fontWeight: '500' }}>만료일:</span> {license.expiryDate || '-'}
                          </div>
                        </div>
                      </div>
                      <Award size={24} color="#2196f3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                등록된 자격증이 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 경력 탭 */}
        {activeTab === 'experience' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>경력</h2>
            {applicant.experiences && applicant.experiences.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applicant.experiences.map((exp: any) => (
                  <div
                    key={exp.id}
                    style={{
                      padding: '20px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {exp.company}
                        </h3>
                        <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                          {exp.position} · {exp.startDate} ~ {exp.endDate || '재직중'}
                        </p>
                        {exp.description && (
                          <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                      <Briefcase size={24} color="#2196f3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                등록된 경력이 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 신체속성 탭 */}
        {activeTab === 'physical' && applicant.physicalAttributes && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>신체속성</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>키</label>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{applicant.physicalAttributes.height}cm</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>몸무게</label>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{applicant.physicalAttributes.weight}kg</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>근력</label>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{applicant.physicalAttributes.muscleStrength}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationDetail

