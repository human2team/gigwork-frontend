
import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiCall, getErrorMessage } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, ArrowRight } from 'lucide-react';

interface Proposal {
  id: number;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
  };
  employer: {
    id: number;
    companyName: string;
  };
  status: string;
  createdAt: string;
}

export default function JobseekerProposals() {
  const { jobseekerProfile } = useUser();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!jobseekerProfile?.id) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    apiCall<Proposal[]>(`/api/proposals/jobseeker/${jobseekerProfile.id}`)
      .then(setProposals)
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [jobseekerProfile?.id]);

  const getStatusColor = (status?: string) => {
    if (!status) return '#9e9e9e';
    const s = status.toUpperCase();
    if (s === 'ACCEPTED') return '#4caf50';
    if (s === 'REJECTED') return '#f44336';
    if (s === 'SENT' || s === 'PENDING') return '#ff9800';
    return '#9e9e9e';
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'UNKNOWN';
    const s = status.toUpperCase();
    if (s === 'ACCEPTED') return '합격';
    if (s === 'REJECTED') return '불합격';
    if (s === 'SENT' || s === 'PENDING') return '심사중';
    return status;
  };

  const getTimeAgo = (iso?: string) => {
    if (!iso) return '';
    const today = new Date();
    const d = new Date(iso);
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return '오늘';
    if (diff === 1) return '1일 전';
    if (diff < 7) return `${diff}일 전`;
    if (diff < 30) return `${Math.floor(diff / 7)}주 전`;
    return `${Math.floor(diff / 30)}개월 전`;
  };

  const handleCancelProposal = async (proposalId: number) => {
    if (!window.confirm('이 제안을 취소하시겠습니까?')) return;
    try {
      await apiCall(`/api/proposals/${proposalId}`, { method: 'DELETE' });
      setProposals(prev => prev.filter(p => p.id !== proposalId));
      alert('제안이 취소되었습니다.');
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  return (
    <div style={{ marginTop: 32, position: 'relative' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: 16 }}>제안받은 일자리</h2>
      {loading && <div>로딩 중...</div>}
      {error && <div style={{ color: 'red' }}>에러: {error}</div>}
      {!loading && !error && proposals.length === 0 && <div>아직 받은 제안이 없습니다.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {proposals.map((proposal) => {
          const jobId = proposal.job?.id;
          const statusColor = getStatusColor(proposal.status);
          return (
            <div
              key={proposal.id}
              style={{
                padding: 24,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 'bold', margin: 0, marginBottom: 8 }}>
                    {proposal.job?.title || '공고명 없음'}
                  </h3>
                  <div style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
                    {proposal.job?.company || proposal.employer?.companyName || '회사명 없음'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    title={`상태: ${getStatusLabel(proposal.status)}`}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: statusColor,
                      color: '#ffffff',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getStatusLabel(proposal.status)}
                  </div>
                </div>
              </div>

              <p style={{ 
                color: '#666', 
                fontSize: 14, 
                marginBottom: 16, 
                lineHeight: '1.6',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {proposal.job?.title}에 관심이 있으신가요? 상세 페이지에서 더 확인해보세요.
              </p>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 14, color: '#666', flexWrap: 'wrap' }}>
                {proposal.job?.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={16} />
                    {proposal.job.location}
                  </span>
                )}
                {proposal.job?.salary && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={16} />
                    {proposal.job.salary}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#e3f2fd',
                  color: '#2196f3',
                  borderRadius: 4,
                  fontSize: 12
                }}>파트타임</span>
                <span style={{ color: '#999', fontSize: 12 }}>{getTimeAgo(proposal.createdAt)}</span>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => handleCancelProposal(proposal.id)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #f44336',
                    borderRadius: 6,
                    backgroundColor: '#ffffff',
                    color: '#f44336',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffebee'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff'; }}
                >
                  ✕ 지원 취소
                </button>
                {jobId && (
                  <button
                    onClick={() => navigate(`/jobseeker/job/${jobId}`)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: 6,
                      backgroundColor: '#2196f3',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    상세보기
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
