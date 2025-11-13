import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'

const recommendedJobs = [
  {
    id: 101,
    title: '주말 카페 바리스타',
    suitability: 92,
    location: '서울 강남구',
    wage: '시급 12,000원',
    description: '주말 근무 가능한 바리스타를 모집합니다. 커피에 대한 열정과 친절한 서비스 마인드가 필요합니다.'
  },
  {
    id: 102,
    title: '데이터 입력 보조',
    suitability: 88,
    location: '경기 성남시 분당구',
    wage: '시급 11,500원',
    description: '정확하고 빠른 데이터 입력을 담당합니다. 재택근무 가능하며 유연한 근무 시간입니다.'
  },
  {
    id: 103,
    title: '온라인 쇼핑몰 상품 포장',
    suitability: 88,
    location: '인천 연수구',
    wage: '시급 11,000원',
    description: '온라인 주문 상품의 포장 및 배송 준비 업무입니다. 체력이 필요한 업무입니다.'
  },
  {
    id: 104,
    title: '어학원 학습 보조',
    suitability: 85,
    location: '서울 서초구',
    wage: '시급 13,000원',
    description: '어학원 학생들의 학습을 보조하고 관리하는 업무입니다. 교육 관련 경험이 우대됩니다.'
  },
  {
    id: 105,
    title: '이벤트 행사 스태프',
    suitability: 75,
    location: '서울 송파구',
    wage: '시급 10,500원',
    description: '각종 이벤트 및 행사 현장에서 스태프 업무를 담당합니다. 주말 근무가 많습니다.'
  },
  {
    id: 106,
    title: '주말 마트 진열',
    suitability: 68,
    location: '경기 고양시 일산서구',
    wage: '시급 10,800원',
    description: '주말 마트 상품 진열 및 정리 업무입니다. 신체 활동이 필요한 업무입니다.'
  },
  {
    id: 107,
    title: '사진 촬영 보조',
    suitability: 80,
    location: '서울 마포구',
    wage: '시급 12,500원',
    description: '사진 촬영 현장에서 장비 운반 및 촬영 보조 업무를 담당합니다.'
  }
]

function Recommendations() {
  const navigate = useNavigate()
  const [minSuitability, setMinSuitability] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(['서비스', '물류', 'IT', '사무'])
  const [savedJobIds, setSavedJobIds] = useState<number[]>([])

  // localStorage에서 지원한 일자리 ID 목록 불러오기 (UI 표시용)
  useEffect(() => {
    const applied = localStorage.getItem('appliedJobs')
    if (applied) {
      setSavedJobIds(JSON.parse(applied))
    }
  }, [])

  // 지원하기 버튼 클릭 시 지원한 일자리로 저장
  const handleApply = (jobId: number) => {
    const applied = localStorage.getItem('appliedJobs')
    let updatedAppliedJobs: number[]
    
    if (applied) {
      const ids = JSON.parse(applied) as number[]
      if (ids.includes(jobId)) {
        alert('이미 지원한 일자리입니다.')
        return
      }
      updatedAppliedJobs = [...ids, jobId]
    } else {
      updatedAppliedJobs = [jobId]
    }
    
    setSavedJobIds(updatedAppliedJobs) // UI 업데이트용 (이미 지원한 것 표시)
    localStorage.setItem('appliedJobs', JSON.stringify(updatedAppliedJobs))
    alert('지원이 완료되었습니다. 마이페이지의 "지원한 일자리"에서 확인할 수 있습니다.')
  }

  const getSuitabilityColor = (score: number) => {
    if (score >= 85) return '#4caf50'
    if (score >= 75) return '#ff9800'
    return '#ff5722'
  }

  const filteredJobs = recommendedJobs.filter(job => job.suitability >= minSuitability)

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>AI 추천 직업</h1>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '16px' }}>
        당신의 프로필과 선호도에 맞춰 AI가 엄선한 단기 아르바이트를 확인하세요.
      </p>

      <div style={{
        marginBottom: '24px',
        padding: '16px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          <span>필터 및 정렬</span>
          {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showFilters && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                최소 적합성 점수: {minSuitability}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minSuitability}
                onChange={(e) => setMinSuitability(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                직업 유형
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['서비스', '물류', '엔터테인먼트', 'IT', '교육', '마케팅', '사무', '운전', '육아', '이벤트', '뷰티', '기타'].map((type) => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={selectedJobTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobTypes([...selectedJobTypes, type])
                        } else {
                          setSelectedJobTypes(selectedJobTypes.filter(t => t !== type))
                        }
                      }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', flex: 1 }}>{job.title}</h3>
              <div style={{
                padding: '4px 12px',
                backgroundColor: getSuitabilityColor(job.suitability),
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                적합성 {job.suitability}%
              </div>
            </div>

            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px', flex: 1 }}>
              {job.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666' }}>
                <MapPin size={16} />
                {job.location}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666' }}>
                <DollarSign size={16} />
                {job.wage}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={() => navigate(`/jobseeker/job/${job.id}`)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #2196f3',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                상세 보기
              </button>
              <button
                onClick={() => handleApply(job.id)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: savedJobIds.includes(job.id) ? '#4caf50' : '#2196f3',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s'
                }}
              >
                {savedJobIds.includes(job.id) ? '지원 완료' : '지원하기'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Recommendations

