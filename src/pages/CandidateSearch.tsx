import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, MapPin, Briefcase, Award, MessageSquare, Star } from 'lucide-react'

const candidates = [
  {
    id: 1,
    name: '김민수',
    age: 28,
    location: '서울, 강남구',
    licenses: ['운전면허증', '포크레인 면허'],
    experience: ['물류직원 - 2년', '창고 관리 - 1년'],
    suitability: 95,
    skills: ['물류', '창고 관리', '포크레인 운전'],
    available: true
  },
  {
    id: 2,
    name: '이영희',
    age: 25,
    location: '서울, 서초구',
    licenses: ['운전면허증'],
    experience: ['데이터 입력 - 1년', '사무직 - 6개월'],
    suitability: 88,
    skills: ['데이터 입력', '엑셀', '워드'],
    available: true
  },
  {
    id: 3,
    name: '박준호',
    age: 30,
    location: '경기, 성남시',
    licenses: ['운전면허증'],
    experience: ['마케팅 - 3년', '소셜 미디어 관리 - 2년'],
    suitability: 82,
    skills: ['마케팅', 'SNS 관리', '콘텐츠 제작'],
    available: false
  },
  {
    id: 4,
    name: '정수진',
    age: 24,
    location: '서울, 마포구',
    licenses: ['바리스타 자격증'],
    experience: ['카페 바리스타 - 2년'],
    suitability: 90,
    skills: ['바리스타', '고객 서비스', 'POS 시스템'],
    available: true
  },
  {
    id: 5,
    name: '최동현',
    age: 27,
    location: '인천, 연수구',
    licenses: ['운전면허증'],
    experience: ['포장 작업 - 3년', '물류 배송 - 1년'],
    suitability: 85,
    skills: ['포장', '배송', '물류'],
    available: true
  }
]

function CandidateSearch() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('전체')
  const [licenseFilter, setLicenseFilter] = useState('전체')
  const [minSuitability, setMinSuitability] = useState(0)

  const getSuitabilityColor = (score: number) => {
    if (score >= 85) return '#4caf50'
    if (score >= 75) return '#ff9800'
    return '#f44336'
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         candidate.experience.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesLocation = locationFilter === '전체' || candidate.location.includes(locationFilter)
    const matchesLicense = licenseFilter === '전체' || candidate.licenses.some(license => license.includes(licenseFilter))
    const matchesSuitability = candidate.suitability >= minSuitability
    return matchesSearch && matchesLocation && matchesLicense && matchesSuitability
  })

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px' }}>인재 검색</h1>

      {/* 검색 및 필터 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 경력, 기술로 검색..."
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: '#ffffff'
            }}
          >
            <option>전체</option>
            <option>서울</option>
            <option>경기</option>
            <option>인천</option>
            <option>부산</option>
          </select>
          <select
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: '#ffffff'
            }}
          >
            <option>전체</option>
            <option>운전면허증</option>
            <option>포크레인 면허</option>
            <option>바리스타 자격증</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>최소 적합도:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minSuitability}
              onChange={(e) => setMinSuitability(parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', minWidth: '40px' }}>{minSuitability}%</span>
          </div>
        </div>
      </div>

      {/* 검색 결과 통계 */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        fontSize: '16px',
        color: '#666'
      }}>
        총 <strong style={{ color: '#2196f3' }}>{filteredCandidates.length}</strong>명의 인재를 찾았습니다.
      </div>

      {/* 인재 목록 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        {filteredCandidates.map((candidate) => (
          <div
            key={candidate.id}
            style={{
              padding: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={28} color="#2196f3" />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {candidate.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>{candidate.age}세</p>
                </div>
              </div>
              <div style={{
                padding: '6px 12px',
                backgroundColor: getSuitabilityColor(candidate.suitability),
                color: '#ffffff',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                적합도 {candidate.suitability}%
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                <MapPin size={16} />
                {candidate.location}
              </div>
              <div style={{
                padding: '4px 8px',
                backgroundColor: candidate.available ? '#e8f5e9' : '#ffebee',
                color: candidate.available ? '#4caf50' : '#f44336',
                borderRadius: '12px',
                fontSize: '12px',
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                {candidate.available ? '✓ 구직 가능' : '✗ 구직 불가'}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                <Award size={16} color="#2196f3" />
                자격증
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {candidate.licenses.map((license, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#e3f2fd',
                      color: '#2196f3',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  >
                    {license}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                <Briefcase size={16} color="#2196f3" />
                경력
              </div>
              <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                {candidate.experience.map((exp, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{exp}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>보유 기술</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {candidate.skills.map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={() => {
                  // 프로필 상세 보기
                  navigate(`/employer/candidates/${candidate.id}`)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #2196f3',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                상세 보기
              </button>
              <button
                onClick={() => {
                  // 채용 제안
                  alert(`${candidate.name}님에게 채용 제안을 보내시겠습니까?`)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#2196f3',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <MessageSquare size={16} />
                제안하기
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ fontSize: '16px', color: '#666' }}>조건에 맞는 인재를 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  )
}

export default CandidateSearch

