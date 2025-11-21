import { useEffect, useState } from 'react';
import { apiCall, getErrorMessage } from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, DollarSign, Info, Clock, ClipboardList, UserCheck, AlarmClock, BookOpen, FileText, Image as ImageIcon } from 'lucide-react';

interface Proposal {
  id: number;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    salary?: string;
    salaryType?: string;
    description?: string;
    category?: string;
    postedDate?: string;
    deadline?: string;
    startTime?: string;
    endTime?: string;
    qualifications?: string[] | string;
    requirements?: string[] | string;
    otherRequirement?: string;
    workingDays?: string[] | string;
    gender?: string;
    age?: string;
    education?: string;
    views?: number;
    applicants?: number;
    images?: string[] | string;
    imageUrls?: string[] | string;
    thumbnails?: string[] | string;
    image?: string;
    bannerImage?: string;
  };
  employer: {
    id: number;
    companyName: string;
  };
  status: string;
  createdAt: string;
}

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);

  const toStringArray = (value?: string[] | string): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(v => typeof v === 'string' && v.trim().length > 0);
    if (typeof value === 'string') {
      if (value.includes(',')) {
        return value.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
      }
      return [value];
    }
    return [];
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiCall<Proposal>(`/api/proposals/${id}`)
      .then(setProposal)
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  // 지원 여부 확인
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!proposal) return;
      const userId = localStorage.getItem('userId');
      const userType = localStorage.getItem('userType');
      if (!userId || userType?.toUpperCase() !== 'JOBSEEKER') return;
      try {
        const res = await fetch(`/api/jobseeker/applications/${userId}/check/${proposal.job.id}`);
        if (res.ok) {
          const data = await res.json();
          setHasApplied(!!data.applied);
          if (data.applied) {
            const listRes = await fetch(`/api/jobseeker/applications/${userId}`);
            if (listRes.ok) {
              const applications = await listRes.json();
              const current = applications.find((app: any) => app.jobId === proposal.job.id);
              if (current) setApplicationId(current.id);
            }
          } else {
            setApplicationId(null);
          }
        }
      } catch {
        // 무시: 상태 표시만 실패해도 치명적이지 않음
      }
    };
    checkApplicationStatus();
  }, [proposal?.job.id]);

  const handleApply = async () => {
    if (!proposal || applying) return;
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    if (!userId) {
      alert('로그인이 필요합니다.');
      navigate('/login/jobseeker');
      return;
    }
    if (userType?.toUpperCase() !== 'JOBSEEKER') {
      alert('구직자 계정으로만 지원할 수 있습니다.');
      return;
    }
    setApplying(true);

    // 낙관적 업데이트: 즉시 UI 반영
    const prevHasApplied = hasApplied;
    const prevApplicants = proposal.job.applicants || 0;
    setHasApplied(true);
    setProposal(p => p ? ({ 
      ...p, 
      job: { ...p.job, applicants: prevApplicants + 1 } 
    }) : p);

    try {
      await apiCall(`/api/jobseeker/applications/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ jobId: proposal.job.id }),
        headers: { 'Content-Type': 'application/json' }
      });
      alert('지원이 완료되었습니다!');
      try {
        window.dispatchEvent(new CustomEvent('application:changed', {
          detail: { jobId: proposal.job.id, action: 'applied' }
        } as any));
      } catch {}
      // 방금 만든 지원서 ID 조회
      try {
        const listRes = await fetch(`/api/jobseeker/applications/${userId}`);
        if (listRes.ok) {
          const applications = await listRes.json();
          const current = applications.find((app: any) => app.jobId === proposal.job.id);
          if (current) setApplicationId(current.id);
        }
      } catch {}
    } catch (e) {
      // 실패 시 원복
      setHasApplied(prevHasApplied);
      setProposal(p => p ? ({ 
        ...p, 
        job: { ...p.job, applicants: prevApplicants } 
      }) : p);
      alert(getErrorMessage(e) || '지원에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async () => {
    if (!proposal || !hasApplied || !applicationId || applying) return;
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('로그인이 필요합니다.');
      navigate('/login/jobseeker');
      return;
    }
    if (!window.confirm('지원을 취소하시겠습니까? 취소 후 다시 지원할 수 있습니다.')) return;
    setApplying(true);

    // 낙관적 업데이트: 즉시 UI 반영
    const prevHasApplied = hasApplied;
    const prevApplicants = proposal.job.applicants || 0;
    setHasApplied(false);
    setProposal(p => p ? ({ 
      ...p, 
      job: { ...p.job, applicants: Math.max(0, prevApplicants - 1) } 
    }) : p);

    try {
      await apiCall(`/api/jobseeker/applications/${userId}/${applicationId}`, {
        method: 'DELETE'
      });
      alert('지원이 취소되었습니다.');
      setApplicationId(null);
      try {
        window.dispatchEvent(new CustomEvent('application:changed', {
          detail: { jobId: proposal.job.id, action: 'cancelled' }
        } as any));
      } catch {}
    } catch (e) {
      // 실패 시 원복
      setHasApplied(prevHasApplied);
      setProposal(p => p ? ({ 
        ...p, 
        job: { ...p.job, applicants: prevApplicants } 
      }) : p);
      alert(getErrorMessage(e) || '지원 취소에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#d32f2f' }}>에러: {error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          뒤로가기
        </button>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>제안을 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate(-1)}
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
          뒤로가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <ArrowLeft size={18} />
          뒤로
        </button>
      </div>

      <div style={{
        padding: '32px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>{proposal.job.title}</h1>

        {(() => {
          const images: string[] = Array.from(new Set([
            ...toStringArray(proposal.job.images),
            ...toStringArray(proposal.job.imageUrls),
            ...toStringArray(proposal.job.thumbnails),
            ...toStringArray(proposal.job.image),
            ...toStringArray(proposal.job.bannerImage)
          ]));
          return images.length > 0 ? (
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={20} style={{ color: '#2196f3' }} /> 이미지
              </h2>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                {images.map((src, idx) => (
                  <img
                    key={`${src}-${idx}`}
                    src={src}
                    alt={`proposal-image-${idx + 1}`}
                    style={{ width: 240, height: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #e0e0e0', backgroundColor: '#f7f7f7', flex: '0 0 auto' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
            </section>
          ) : null;
        })()}

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{proposal.job.company || proposal.employer.companyName}</h2>
          {proposal.job.category && (
            <>
              <span style={{ color: '#e0e0e0' }}>|</span>
              <span style={{ 
                color: '#2196f3', 
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {proposal.job.category.replace(/\./g, '·')}
              </span>
            </>
          )}
          </div>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', color: '#666', fontSize: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} />
              {proposal.job.location || '지역 미정'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} />
              제안 일시: {new Date(proposal.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={24} style={{ color: '#2196f3' }} /> 직무 설명
          </h2>
          <p style={{ color: '#666', lineHeight: '1.8', fontSize: '16px', whiteSpace: 'pre-wrap' }}>{proposal.job.description || '설명이 없습니다.'}</p>
        </section>

      {Array.isArray(proposal.job.qualifications) && proposal.job.qualifications.length > 0 && proposal.job.qualifications[0] && (
        <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={24} style={{ color: '#2196f3' }} /> 자격 요건
          </h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Array.isArray(proposal.job.qualifications) && proposal.job.qualifications.map((qual: string, index: number) => (
              qual && qual.trim() && (
                <li key={index} style={{ 
                  padding: '8px 0', 
                  color: '#666', 
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}>
                  <span style={{ color: '#2196f3', marginTop: '6px' }}>•</span>
                  <span>{qual}</span>
                </li>
              )
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={24} style={{ color: '#2196f3' }} /> 지원 자격
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>성별</p>
            <p style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{proposal.job.gender || '무관'}</p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>연령</p>
            <p style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{proposal.job.age || '무관'}</p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>학력</p>
            <p style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{proposal.job.education || '무관'}</p>
          </div>
        </div>
      </section>

      {(Array.isArray(proposal.job.workingDays) && proposal.job.workingDays.length > 0) || proposal.job.startTime || proposal.job.endTime || proposal.job.salary || proposal.job.deadline ? (
        <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlarmClock size={24} style={{ color: '#2196f3' }} /> 근무 조건
          </h2>
          {Array.isArray(proposal.job.workingDays) && proposal.job.workingDays.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '8px' }}>
                <strong>근무 날짜:</strong> {proposal.job.workingDays.length}일
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Array.isArray(proposal.job.workingDays) && proposal.job.workingDays.map((day: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#e3f2fd',
                      color: '#2196f3',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}
          {proposal.job.startTime && proposal.job.endTime && (
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '8px' }}>
              <strong>근무 시간:</strong> {proposal.job.startTime} ~ {proposal.job.endTime}
            </p>
          )}
          {proposal.job.salary && (
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} />
              {proposal.job.salaryType ? `${proposal.job.salaryType} ${proposal.job.salary}` : proposal.job.salary}
            </p>
          )}
          {proposal.job.deadline && (
            <p style={{ color: '#666', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} />
              지원 마감일: {proposal.job.deadline}
            </p>
          )}
        </section>
      ) : null}

      {Array.isArray(proposal.job.requirements) && proposal.job.requirements.length > 0 && (
        <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={24} style={{ color: '#2196f3' }} /> 필요 준비물/능력
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Array.isArray(proposal.job.requirements) && proposal.job.requirements.map((req: string, index: number) => (
              <span
                key={index}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {req}
              </span>
            ))}
            {proposal.job.otherRequirement && (
              <span
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                기타: {proposal.job.otherRequirement}
              </span>
            )}
          </div>
        </section>
      )}

        <section style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} style={{ color: '#2196f3' }} /> 제안 정보
          </h2>
          <button
            onClick={hasApplied ? handleCancel : handleApply}
            disabled={applying}
            style={{
              padding: '10px 24px',
              border: hasApplied ? '2px solid #f44336' : '1px solid #2196f3',
              borderRadius: '6px',
              backgroundColor: hasApplied ? '#ffffff' : '#2196f3',
              color: hasApplied ? '#f44336' : '#ffffff',
              cursor: applying ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 500,
              opacity: applying ? 0.7 : 1
            }}
          >
            {applying ? (hasApplied ? '취소 중...' : '지원 중...') : (hasApplied ? '지원 취소' : '지원하기')}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>상태</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#2196f3',
                color: '#ffffff',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {proposal.status}
              </span>
            </p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>지원자 수</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{(typeof proposal.job.applicants === 'number' ? proposal.job.applicants : 0)}명</p>
          </div>
          {typeof proposal.job.views === 'number' && (
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>조회수</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>{proposal.job.views}</p>
            </div>
          )}
          {proposal.job.postedDate && (
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>등록일</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>{proposal.job.postedDate}</p>
            </div>
          )}
          {proposal.job.deadline && (
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>마감일</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>{proposal.job.deadline}</p>
            </div>
          )}
        </div>
        </section>
      </div>
    </div>
  );
}
