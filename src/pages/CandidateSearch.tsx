import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, MapPin, Briefcase, Award, MessageSquare } from 'lucide-react'

function CandidateSearch() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('전체')
  const [licenseFilter, setLicenseFilter] = useState('전체')
  const [minSuitability, setMinSuitability] = useState(0)
  const [candidates, setCandidates] = useState<any[]>([])
  const [proposedIds, setProposedIds] = useState<number[]>(() => {
    const stored = localStorage.getItem('proposedIds');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    // API 호출로 후보자 목록을 불러옴
    const fetchCandidates = async () => {
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        if (locationFilter !== '전체') params.append('location', locationFilter)
        if (licenseFilter !== '전체') params.append('license', licenseFilter)
        if (minSuitability > 0) params.append('minSuitability', String(minSuitability))
        const response = await fetch(`/api/candidates?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setCandidates(data)
        } else {
          setCandidates([])
        }
      } catch (e) {
        setCandidates([])
      }
    }
    fetchCandidates()
    // 이미 제안한 후보자 목록 불러오기 (로그인된 employerId 필요)
    const fetchProposed = async () => {
      const employerId = localStorage.getItem('userId');
      if (!employerId) return;
      try {
        const res = await fetch(`/api/proposals/employer/${employerId}/jobseekers`);
        if (res.ok) {
          const data = await res.json();
          setProposedIds((prev) => {
            const ids = data.map((p: any) => p.jobseekerId);
            localStorage.setItem('proposedIds', JSON.stringify(ids));
            return ids;
          });
        }
      } catch {}
    };
    fetchProposed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, locationFilter, licenseFilter, minSuitability])

  const getSuitabilityColor = (score: number) => {
    if (score >= 85) return '#4caf50'
    if (score >= 75) return '#ff9800'
    return '#f44336'
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.experience?.some((exp: string) => exp.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesLocation = locationFilter === '전체' || candidate.location?.includes(locationFilter)
    const matchesLicense = licenseFilter === '전체' || candidate.licenses?.some((license: string) => license.includes(licenseFilter))
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

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={() => {
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
              {proposedIds.includes(candidate.id) ? (
                <button
                  onClick={async () => {
                    if (!window.confirm(`${candidate.name}님에게 보낸 제안을 취소하시겠습니까?`)) return;
                    try {
                      const employerId = localStorage.getItem('userId');
                      const jobId = candidate.recommendedJobId || 1;
                      const jobseekerId = candidate.id;
                      const res = await fetch(`/api/proposals?jobId=${jobId}&jobseekerId=${jobseekerId}&employerId=${employerId}`, {
                        method: 'DELETE'
                      });
                      if (res.ok) {
                        setProposedIds(prev => {
                          const updated = prev.filter(id => id !== candidate.id);
                          localStorage.setItem('proposedIds', JSON.stringify(updated));
                          return updated;
                        });
                        alert('채용 제안이 취소되었습니다.');
                      } else {
                        const data = await res.json().catch(() => ({}));
                        alert(data.error || '채용 제안 취소에 실패했습니다.');
                      }
                    } catch (e) {
                      alert('채용 제안 취소에 실패했습니다.');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#bdbdbd',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    opacity: 1
                  }}
                >
                  <MessageSquare size={16} />
                  제안 취소
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (!window.confirm(`${candidate.name}님에게 채용 제안을 보내시겠습니까?`)) return;
                    try {
                      const employerId = localStorage.getItem('userId');
                      const jobId = candidate.recommendedJobId || 1;
                      const jobseekerId = candidate.id;
                      const res = await fetch('/api/proposals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `jobId=${jobId}&jobseekerId=${jobseekerId}&employerId=${employerId}`
                      });
                      if (res.ok) {
                        setProposedIds(prev => {
                          const updated = [...prev, candidate.id];
                          localStorage.setItem('proposedIds', JSON.stringify(updated));
                          return updated;
                        });
                        alert('채용 제안이 성공적으로 전송되었습니다.');
                      } else {
                        const data = await res.json().catch(() => ({}));
                        alert(data.error || '채용 제안 전송에 실패했습니다.');
                      }
                    } catch (e) {
                      alert('채용 제안 전송에 실패했습니다.');
                    }
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
                    gap: '4px',
                    opacity: 1
                  }}
                >
                  <MessageSquare size={16} />
                  제안하기
                </button>
              )}
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

