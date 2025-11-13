import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Eye, Briefcase } from 'lucide-react'
import { useJob } from '../contexts/JobContext'

function JobManagement() {
  const navigate = useNavigate()
  const {
    filteredJobs,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteJob,
    fetchJobs
  } = useJob()

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 페이지 진입 시 최신 데이터 로드
  useEffect(() => {
    fetchJobs()
  }, [])

  // 검색/필터 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  // 공고 삭제
  const handleDelete = async (jobId: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await deleteJob(jobId)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '진행중'
      case 'CLOSED':
        return '마감'
      case '진행중':
        return '진행중'
      case '마감':
        return '마감'
      case '대기':
        return '대기'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    const text = getStatusText(status)
    switch (text) {
      case '진행중':
        return '#4caf50'
      case '마감':
        return '#999'
      case '대기':
        return '#ff9800'
      default:
        return '#666'
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>공고 관리</h1>
        <button
          onClick={() => navigate('/employer/jobs/posting')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#2196f3',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          <Plus size={20} />
          공고 등록
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="일자리 제목으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '12px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '16px',
            backgroundColor: '#ffffff'
          }}
        >
          <option>전체 상태</option>
          <option>진행중</option>
          <option>마감</option>
          <option>대기</option>
        </select>
      </div>

      {/* 일자리 목록 */}
      {filteredJobs.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <Briefcase size={48} color="#999" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>등록된 일자리가 없습니다</p>
          <p style={{ fontSize: '14px', color: '#999' }}>공고 등록 버튼을 클릭하여 새로운 일자리를 등록해보세요.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((job) => (
          <div
            key={job.id}
            style={{
              padding: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Briefcase size={20} color="#2196f3" />
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{job.title}</h3>
                  {job.category && (
                    <>
                      <span style={{ color: '#e0e0e0' }}>|</span>
                      <span style={{ 
                        color: '#2196f3', 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {job.category.replace(/\./g, '·')}
                      </span>
                    </>
                  )}
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: getStatusColor(job.status || '대기'),
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {getStatusText(job.status || '대기')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666', marginLeft: '32px', flexWrap: 'wrap' }}>
                  <span>지원자: <strong>{job.applicants}명</strong></span>
                  <span>조회수: <strong>{job.views}</strong></span>
                  <span>등록일: {job.postedDate}</span>
                  <span>마감일: {job.deadline}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#888', marginLeft: '32px', marginTop: '8px' }}>
                  <span>성별: <strong style={{ color: '#666' }}>{job.gender || '무관'}</strong></span>
                  <span>연령: <strong style={{ color: '#666' }}>{job.age || '무관'}</strong></span>
                  <span>학력: <strong style={{ color: '#666' }}>{job.education || '무관'}</strong></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/employer/jobs/${job.id}`)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px'
                  }}
                >
                  <Eye size={16} />
                  보기
                </button>
                <button
                  onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #2196f3',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    color: '#2196f3',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px'
                  }}
                >
                  <Edit size={16} />
                  수정
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #f44336',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    color: '#f44336',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px'
                  }}
                >
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
          </div>

          {/* 페이지네이션 */}
          {filteredJobs.length > itemsPerPage && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '32px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                  color: currentPage === 1 ? '#999' : '#333',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                이전
              </button>
              
              {Array.from({ length: Math.ceil(filteredJobs.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '8px 12px',
                    border: currentPage === page ? 'none' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: currentPage === page ? '#2196f3' : '#ffffff',
                    color: currentPage === page ? '#ffffff' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredJobs.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredJobs.length / itemsPerPage)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: currentPage === Math.ceil(filteredJobs.length / itemsPerPage) ? '#f5f5f5' : '#ffffff',
                  color: currentPage === Math.ceil(filteredJobs.length / itemsPerPage) ? '#999' : '#333',
                  cursor: currentPage === Math.ceil(filteredJobs.length / itemsPerPage) ? 'not-allowed' : 'pointer'
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

export default JobManagement

