
import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiCall, getErrorMessage } from '../utils/api';
import ProposalDetail from './ProposalDetail';

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


  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);

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

  return (
    <div style={{ marginTop: 32, position: 'relative' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: 16 }}>제안받은 일자리</h2>
      {loading && <div>로딩 중...</div>}
      {error && <div style={{ color: 'red' }}>에러: {error}</div>}
      {!loading && proposals.length === 0 && <div>아직 받은 제안이 없습니다.</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {proposals.map((proposal) => (
          <li
            key={proposal.id}
            style={{ marginBottom: 20, padding: 16, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fafafa', cursor: 'pointer' }}
            onClick={() => setSelectedProposalId(proposal.id)}
          >
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>{proposal.job?.title || '공고명 없음'}</div>
            <div style={{ color: '#666', marginBottom: 4 }}>{proposal.job?.company || proposal.employer?.companyName || '회사명 없음'}</div>
            <div style={{ color: '#888', fontSize: 14 }}>{proposal.job?.location || ''} {proposal.job?.salary ? `· ${proposal.job.salary}` : ''}</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              상태: <span style={{ color: proposal.status === 'SENT' ? '#2196f3' : '#666' }}>{proposal.status}</span>
              <span style={{ marginLeft: 16, color: '#aaa' }}>{new Date(proposal.createdAt).toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
      {selectedProposalId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ProposalDetail proposalId={selectedProposalId} onClose={() => setSelectedProposalId(null)} />
        </div>
      )}
    </div>
  );
}
