import { useEffect, useState } from 'react';
import { apiCall, getErrorMessage } from '../utils/api';
import { useNavigate } from 'react-router-dom';

interface Proposal {
  id: number;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    description?: string;
  };
  employer: {
    id: number;
    companyName: string;
  };
  status: string;
  createdAt: string;
}

export default function ProposalDetail({ proposalId, onClose }: { proposalId: number, onClose: () => void }) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiCall<Proposal>(`/api/proposals/${proposalId}`)
      .then(setProposal)
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [proposalId]);

  const handleApply = async () => {
    if (!proposal) return;
    try {
      await apiCall(`/api/jobseeker/apply`, {
        method: 'POST',
        body: JSON.stringify({ jobId: proposal.job.id }),
        headers: { 'Content-Type': 'application/json' }
      });
      alert('지원이 완료되었습니다!');
      onClose();
      navigate('/profile?tab=applied');
    } catch (e) {
      alert('지원에 실패했습니다.');
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div style={{ color: 'red' }}>에러: {error}</div>;
  if (!proposal) return null;

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', maxWidth: 500 }}>
      <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
      <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{proposal.job.title}</h2>
      <div style={{ color: '#666', marginBottom: 4 }}>{proposal.job.company || proposal.employer.companyName}</div>
      <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>{proposal.job.location} {proposal.job.salary ? `· ${proposal.job.salary}` : ''}</div>
      <div style={{ marginBottom: 16 }}>{proposal.job.description}</div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: '#2196f3', fontWeight: 500 }}>상태: {proposal.status}</span>
        <span style={{ marginLeft: 16, color: '#aaa' }}>{new Date(proposal.createdAt).toLocaleString()}</span>
      </div>
      <button onClick={handleApply} style={{ padding: '10px 24px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer' }}>
        지원하기
      </button>
    </div>
  );
}
