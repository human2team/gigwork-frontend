
import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiCall, getErrorMessage } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';

interface Proposal {
  id: number;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    // optional: backend may provide
    salaryType?: string;
    status?: string;
    deadline?: string;
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
  // jobId -> application status (e.g., PENDING, ACCEPTED)
  const [applicationsByJobId, setApplicationsByJobId] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  const isJobClosed = (status?: string, deadline?: string): boolean => {
    if (status && String(status).toUpperCase() === 'CLOSED') return true;
    if (!deadline) return false;
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

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

  // 내가 이미 지원한 공고 목록 동기화
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`/api/jobseeker/applications/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          const map: Record<number, string> = {};
          for (const app of data) {
            const jid = Number(app.jobId ?? app.job_id ?? app.job?.id);
            const st = String(app.status ?? '').toUpperCase();
            if (Number.isFinite(jid)) map[jid] = st || 'PENDING';
          }
          setApplicationsByJobId(map);
        }
      } catch {}
    })();
  }, []);

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
    if (s === 'SENT' || s === 'PENDING') return '제안';
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

  const formatSalaryLabel = (salary?: any, salaryType?: any): string => {
    const raw = String(salary ?? '').replace(/\$\s+/g, '$').trim();
    const t = String(salaryType ?? '').toUpperCase();
    const hasKoreanLabel = /시급|일급|월급|연봉/.test(raw);

    const detectByType = (): string | '' => {
      if (!t) return '';
      if (t.includes('HOURLY') || t.includes('HOUR') || t.includes('시급')) return '시급';
      if (t.includes('DAILY') || t.includes('DAY') || t.includes('일급')) return '일급';
      if (t.includes('MONTH') || t.includes('MONTHLY') || t.includes('월급')) return '월급';
      if (t.includes('YEAR') || t.includes('ANNUAL') || t.includes('연봉')) return '연봉';
      return '';
    };

    const detectHeuristic = (): string | '' => {
      const num = parseInt(String(raw).replace(/[^0-9]/g, '') || '0', 10);
      if (!Number.isFinite(num) || num <= 0) return '';
      if (num >= 1_000_000) return '월급';
      if (num >= 100_000) return '일급';
      return '시급';
    };

    const label = detectByType() || (hasKoreanLabel ? '' : detectHeuristic());
    return label ? `${label} ${raw || '협의'}` : (raw || '협의');
  };

  const handleCancelProposal = async (proposalId: number) => {
    if (!window.confirm('이 제안을 거절하시겠습니까?')) return;
    const proposal = proposals.find(p => p.id === proposalId);
    const jobId = proposal?.job?.id;
    const employerId = proposal?.employer?.id;
    const jobseekerId = jobseekerProfile?.id;
    try {
      // 1) 우선: 서버에 공식 거절 API 시도 (알림 포함 기대)
      let ok = false;
      try {
        const res = await fetch('/api/proposals/decline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `proposalId=${encodeURIComponent(String(proposalId))}` +
                (employerId ? `&employerId=${encodeURIComponent(String(employerId))}` : '') +
                (jobseekerId ? `&jobseekerId=${encodeURIComponent(String(jobseekerId))}` : '') +
                (jobId ? `&jobId=${encodeURIComponent(String(jobId))}` : '')
        });
        ok = res.ok;
      } catch {}
      // 2) 실패 시: 제안 삭제 엔드포인트 시도
      if (!ok) {
        try {
          const res = await fetch(`/api/proposals/${proposalId}`, { method: 'DELETE' });
          ok = res.ok;
        } catch {}
      }
      // 3) 또 실패 시: 쿼리 파라미터 방식으로 취소 시도 (고용주 화면과 동일 패턴)
      if (!ok && jobId && employerId && jobseekerId) {
        try {
          const res = await fetch(`/api/proposals?jobId=${jobId}&jobseekerId=${jobseekerId}&employerId=${employerId}`, { method: 'DELETE' });
          ok = res.ok;
        } catch {}
      }
      // 4) 알림 전송 (best-effort)
      try {
        await fetch('/api/proposals/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'DECLINED',
            proposalId,
            employerId,
            jobseekerId,
            jobId
          })
        });
      } catch {}
      if (ok) {
        setProposals(prev => prev.filter(p => p.id !== proposalId));
        alert('제안을 거절했습니다.');
      } else {
        alert('제안 거절 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  return (
    <div style={{ marginTop: 32, position: 'relative' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>제안 목록</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        사업자가 보낸 채용 제안 목록입니다. 제안을 확인하여 수락하거나 거절할 수 있습니다.
      </p>
      {loading && <div>로딩 중...</div>}
      {error && <div style={{ color: 'red' }}>에러: {error}</div>}
      {!loading && !error && proposals.length === 0 && (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <CheckCircle size={48} color="#999" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>제안받은 일자리가 없습니다</p>
          <p style={{ fontSize: '14px', color: '#999' }}>사업자가 보낸 채용 제안이 여기에 표시됩니다.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {proposals.map((proposal) => {
          const jobId = proposal.job?.id;
          const appStatus = jobId ? applicationsByJobId[jobId] : undefined;
          const mergedStatus =
            appStatus === 'ACCEPTED'
              ? 'ACCEPTED'
              : appStatus === 'REJECTED'
              ? 'REJECTED'
              : proposal.status;
          const statusColor = getStatusColor(mergedStatus);
          const closed = isJobClosed((proposal.job as any)?.status, (proposal.job as any)?.deadline);
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
                  <h3
                    onClick={() => { if (jobId) navigate(`/jobseeker/job/${jobId}`) }}
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      margin: 0,
                      marginBottom: 8,
                      cursor: jobId ? 'pointer' : 'default'
                    }}
                  >
                    {proposal.job?.title || '공고명 없음'}
                  </h3>
                  <div style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
                    {proposal.job?.company || proposal.employer?.companyName || '회사명 없음'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {jobId && applicationsByJobId[jobId] && (
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#e3f2fd',
                      color: '#2196f3',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      지원완료
                    </span>
                  )}
                  {closed && (
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#ffebee',
                      color: '#d32f2f',
                      border: '1px solid #ffcdd2',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      마감
                    </span>
                  )}
                  <div
                    title={`상태: ${getStatusLabel(mergedStatus)}`}
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
                    {getStatusLabel(mergedStatus)}
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
                    {formatSalaryLabel(proposal.job.salary, (proposal.job as any).salaryType)}
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
                  ✕ 제안 거절
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
                    지원하기
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
