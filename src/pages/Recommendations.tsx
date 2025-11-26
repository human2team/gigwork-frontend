import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react'
import { apiCall, getErrorMessage } from '../utils/api'

type RecommendedJob = {
  id: number
  title: string
  category?: string
  company: string
  location: string
  salary: string
  salaryType?: string
  description: string
  suitability: number
  status?: string
  deadline?: string
}

function Recommendations() {
  const navigate = useNavigate()
  // 화면 비표시(임시 비활성화): 라우팅되면 즉시 홈으로 이동하고 아무 것도 렌더링하지 않음
  const HIDE_PAGE = true
  useEffect(() => {
    if (HIDE_PAGE) {
      navigate('/')
    }
  }, [navigate])
  if (HIDE_PAGE) {
    return null
  }
  const [minSuitability, setMinSuitability] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([])
  const [savedJobIds, setSavedJobIds] = useState<number[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'suitability' | 'salary' | 'recent'>('suitability')
  const [currentPage, setCurrentPage] = useState(1)
  const PER_PAGE = 10
  
  // 백엔드에 등록된 직업 카테고리 (JobPosting.tsx와 동일)
  const jobCategories = [
    '기획.전략',
    '마케팅.홍보.조사',
    '회계.세무.재무',
    '인사.노무.HRD',
    '총무.법무.사무',
    'IT개발.데이터',
    '디자인',
    '영업.판매.무역',
    '고객상담.TM',
    '구매.자재.물류',
    '상품기획.MD',
    '운전.운송.배송',
    '서비스',
    '생산',
    '건설.건축',
    '의료',
    '연구.R&D',
    '교육',
    '미디어.문화.스포츠',
    '금융.보험',
    '공공.복지'
  ]

  // 백엔드에서 추천 공고 불러오기
  useEffect(() => {
    const fetchRecommendations = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        alert('로그인이 필요합니다.')
        navigate('/login/jobseeker')
        return
      }

      try {
        // 백엔드 추천 API 호출 (실제 적합도 계산)
        const response = await fetch(`/api/jobseeker/recommendations/${userId}`)
        
        if (response.ok) {
          const recommendations: RecommendedJob[] = await response.json()
          console.log('✅ 추천 공고 로드:', recommendations)
          
          // 백엔드에서 이미 적합도 계산 및 정렬된 상태로 받아옴
          setRecommendedJobs(recommendations)
        } else {
          throw new Error('추천 공고를 불러올 수 없습니다.')
        }
      } catch (error) {
        console.error('추천 공고 로딩 실패:', error)
        alert(`추천 공고를 불러오는데 실패했습니다.\n\n${getErrorMessage(error)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [navigate])

  // localStorage에서 저장된 일자리 ID 목록 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('savedJobs')
    if (saved) {
      setSavedJobIds(JSON.parse(saved))
    }
  }, [])

  // 필터/정렬 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [minSuitability, selectedJobTypes, sortBy, recommendedJobs])

  // 일자리 저장/저장 해제
  const handleSaveJob = async (jobId: number) => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      navigate('/login/jobseeker')
      return
    }

    try {
      if (savedJobIds.includes(jobId)) {
        // 이미 저장된 경우 제거
        await apiCall(`/api/jobseeker/saved-jobs/${userId}/${jobId}`, { method: 'DELETE' })
        const updatedSavedJobs = savedJobIds.filter(id => id !== jobId)
        setSavedJobIds(updatedSavedJobs)
        localStorage.setItem('savedJobs', JSON.stringify(updatedSavedJobs))
        alert('저장이 해제되었습니다.')
      } else {
        // 저장
        await apiCall(`/api/jobseeker/saved-jobs/${userId}/${jobId}`, { method: 'POST' })
        const updatedSavedJobs = [...savedJobIds, jobId]
        setSavedJobIds(updatedSavedJobs)
        localStorage.setItem('savedJobs', JSON.stringify(updatedSavedJobs))
        alert('일자리가 저장되었습니다.')
      }
    } catch (error) {
      console.error('저장 처리 실패:', error)
      alert('저장 처리에 실패했습니다.')
    }
  }

  const getSuitabilityColor = (score: number) => {
    if (score >= 85) return '#4caf50'
    if (score >= 75) return '#ff9800'
    return '#ff5722'
  }

  const getSuitabilityLabel = (score: number) => {
    if (score >= 85) return '매우 적합'
    if (score >= 75) return '적합'
    if (score >= 60) return '보통'
    return '낮음'
  }

  const getSuitabilityDescription = (score: number) => {
    if (score >= 85) return '자격증, 경력, 신체 조건이 이 직무에 매우 적합합니다.'
    if (score >= 75) return '대부분의 요구사항을 충족하며 적합한 직무입니다.'
    if (score >= 60) return '일부 요구사항을 충족하는 직무입니다.'
    return '일부 요구사항이 부족할 수 있습니다.'
  }

  const resetFilters = () => {
    setMinSuitability(50)
    setSelectedJobTypes([])
  }

  // 필터링: 적합도 + 카테고리
  const filteredJobs = recommendedJobs.filter(job => {
    // 적합도 필터
    if (job.suitability < minSuitability) return false
    
    // 카테고리 필터 (선택된 항목이 있을 경우만)
    if (selectedJobTypes.length > 0) {
      // job.category가 선택된 카테고리 중 하나와 일치하는지 확인
      const jobCategory = (job as any).category || ''
      if (!selectedJobTypes.includes(jobCategory)) return false
    }
    
    return true
  })

  // 정렬
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'suitability') {
      return b.suitability - a.suitability
    } else if (sortBy === 'salary') {
      // 급여 숫자만 추출하여 비교
      const getSalaryNum = (salary: string) => {
        const match = salary.match(/\d+/)
        return match ? parseInt(match[0]) : 0
      }
      return getSalaryNum(b.salary) - getSalaryNum(a.salary)
    } else {
      // recent - id가 클수록 최신
      return b.id - a.id
    }
  })

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / PER_PAGE))
  const currentSafePage = Math.min(currentPage, totalPages)
  const startIndex = (currentSafePage - 1) * PER_PAGE
  const pageJobs = sortedJobs.slice(startIndex, startIndex + PER_PAGE)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>추천 공고를 불러오는 중...</div>
        </div>
      </div>
    )
  }

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>필터 설정</h3>
              <button
                onClick={resetFilters}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
              >
                초기화
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                정렬 기준
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSortBy('suitability')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: sortBy === 'suitability' ? '2px solid #2196f3' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: sortBy === 'suitability' ? '#e3f2fd' : '#ffffff',
                    color: sortBy === 'suitability' ? '#2196f3' : '#666',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: sortBy === 'suitability' ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  적합도순
                </button>
                <button
                  onClick={() => setSortBy('salary')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: sortBy === 'salary' ? '2px solid #2196f3' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: sortBy === 'salary' ? '#e3f2fd' : '#ffffff',
                    color: sortBy === 'salary' ? '#2196f3' : '#666',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: sortBy === 'salary' ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  급여순
                </button>
                <button
                  onClick={() => setSortBy('recent')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: sortBy === 'recent' ? '2px solid #2196f3' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: sortBy === 'recent' ? '#e3f2fd' : '#ffffff',
                    color: sortBy === 'recent' ? '#2196f3' : '#666',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: sortBy === 'recent' ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  최신순
                </button>
              </div>
            </div>

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
                직업 카테고리
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                {jobCategories.map((category) => (
                  <label key={category} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '13px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedJobTypes.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobTypes([...selectedJobTypes, category])
                        } else {
                          setSelectedJobTypes(selectedJobTypes.filter(t => t !== category))
                        }
                      }}
                      style={{ 
                        flexShrink: 0,
                        margin: 0
                      }}
                    />
                    <span style={{ 
                      lineHeight: '1.5',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {category.split('.').map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && <span style={{ margin: '0 1px' }}>·</span>}
                        </span>
                      ))}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>
          총 <strong style={{ color: '#2196f3', fontSize: '18px' }}>{sortedJobs.length}</strong>개의 추천 공고
          {selectedJobTypes.length > 0 && (
            <span style={{ marginLeft: '12px', fontSize: '14px' }}>
              (카테고리: {selectedJobTypes.map(t => t.split('.').join('·')).join(', ')})
            </span>
          )}
        </div>
        <div style={{ fontSize: '14px', color: '#999' }}>
          {sortBy === 'suitability' && '적합도순 정렬'}
          {sortBy === 'salary' && '급여순 정렬'}
          {sortBy === 'recent' && '최신순 정렬'}
        </div>
      </div>

      {sortedJobs.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>
            필터 조건에 맞는 추천 공고가 없습니다.
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            필터를 조정하거나 다시 시도해보세요.
          </p>
        </div>
      ) : (
        <>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {pageJobs.map((job) => {
            // 마감 조건: status가 'CLOSED'이거나, deadline이 있고 오늘 날짜보다 이전이면 마감
            let isClosed = false;
            let debugMsg = '';
            if (job.status && job.status.toUpperCase() === 'CLOSED') {
              isClosed = true;
              debugMsg = 'status CLOSED';
            } else if (job.deadline) {
              const deadlineDate = new Date(job.deadline);
              const now = new Date();
              deadlineDate.setHours(0,0,0,0);
              now.setHours(0,0,0,0);
              if (deadlineDate < now) {
                isClosed = true;
                debugMsg = 'deadline passed';
              }
            }
            // 디버깅용 로그
            console.log('[마감디버그]', job.id, job.status, job.deadline, 'isClosed:', isClosed, debugMsg);
            return (
                <div
                  key={job.id}
                  style={{
                    padding: '24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{job.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{job.company}</p>
                        {job.category && (
                          <>
                            <span style={{ color: '#e0e0e0' }}>|</span>
                            <span style={{ 
                              color: '#2196f3', 
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              {job.category.split('.').map((part, i, arr) => (
                                <span key={i}>
                                  {part}
                                  {i < arr.length - 1 && <span style={{ margin: '0 1px' }}>·</span>}
                                </span>
                              ))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isClosed && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#ffebee',
                          color: '#d32f2f',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginRight: 4,
                          letterSpacing: '1px',
                          display: 'inline-block'
                        }}>마감</span>
                      )}
                      <div 
                        title={getSuitabilityDescription(job.suitability)}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: getSuitabilityColor(job.suitability),
                          color: '#ffffff',
                          borderRadius: '16px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          cursor: 'help',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {getSuitabilityLabel(job.suitability)} {job.suitability}%
                      </div>
                    </div>
                  </div>

              <div style={{
                padding: '10px 12px',
                backgroundColor: '#f0f7ff',
                borderLeft: `4px solid ${getSuitabilityColor(job.suitability)}`,
                borderRadius: '4px',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  💡 {getSuitabilityDescription(job.suitability)}
                </div>
              </div>

              <p style={{ 
                color: '#666', 
                fontSize: '14px', 
                marginBottom: '16px', 
                lineHeight: '1.6',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {job.description}
              </p>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '14px', color: '#666', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} />
                  {job.location}
                </span>
                {!isClosed && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} />
                    {job.salaryType} {job.salary}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <button
                  onClick={() => handleSaveJob(job.id)}
                  style={{
                    padding: '8px 16px',
                    border: savedJobIds.includes(job.id) ? '1px solid #2196f3' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: savedJobIds.includes(job.id) ? '#e3f2fd' : '#ffffff',
                    color: savedJobIds.includes(job.id) ? '#2196f3' : '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  {savedJobIds.includes(job.id) ? (
                    <>
                      <BookmarkCheck size={16} />
                      저장됨
                    </>
                  ) : (
                    <>
                      <Bookmark size={16} />
                      저장
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate(`/jobseeker/job/${job.id}`)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#2196f3',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  상세보기
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* 페이지네이션 */}
      {sortedJobs.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentSafePage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: currentSafePage === 1 ? '#f5f5f5' : '#ffffff',
              color: '#333',
              cursor: currentSafePage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            이전
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {currentSafePage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentSafePage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: currentSafePage === totalPages ? '#f5f5f5' : '#ffffff',
              color: '#333',
              cursor: currentSafePage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            다음
          </button>
        </div>
      )}
      </>
    )}
  </div>
)
}

export default Recommendations

