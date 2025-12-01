
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall, getErrorMessage } from '../utils/api';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Award, Briefcase, Activity, GraduationCap } from 'lucide-react';

interface License {
  id: number;
  name: string;
  issueDate: string;
  expiryDate: string;
}
interface Experience {
  id: number;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}
interface CandidateProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  education: string;
  introduction?: string;
  age?: number;
  gender?: string;
  preferredRegion?: string;
  preferredDistrict?: string;
  preferredDong?: string;
  workDuration?: string;
  workDays?: string;
  workTime?: string;
  strengths?: string[];
  mbti?: string;
  desiredCategories?: string[];
  licenses: License[];
  experiences: Experience[];
  height?: number;
  weight?: number;
  muscleStrength?: string;
}

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'licenses' | 'experience' | 'physical'>('personal');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiCall<CandidateProfile>(`/api/candidates/${id}`)
      .then(setProfile)
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;
  if (!profile) return <div>지원자 정보를 찾을 수 없습니다.</div>;

  const tabs = [
    { id: 'personal', label: '개인정보', icon: User },
    { id: 'licenses', label: '자격증', icon: Award },
    { id: 'experience', label: '경력', icon: Briefcase },
    { id: 'physical', label: '신체속성', icon: Activity },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', color: '#666'
          }}
        >
          <ArrowLeft size={18} /> 목록으로
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{profile.name} 지원자 상세</h1>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e0e0e0' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px', border: 'none', borderBottom: activeTab === tab.id ? '3px solid #2196f3' : '3px solid transparent', backgroundColor: 'transparent', color: activeTab === tab.id ? '#2196f3' : '#666', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === tab.id ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-2px'
              }}
            >
              <Icon size={20} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 컨텐츠 */}
      <div style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        {/* 개인정보 */}
        {activeTab === 'personal' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>개인정보</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>이름</label>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{profile.name}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>이메일</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="#666" />
                  {profile.email}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>전화번호</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="#666" />
                  {profile.phone}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>성별</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="#666" />
                  {profile.gender || '-'}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>주소</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="#666" />
                  {profile.address && profile.region && profile.address.startsWith(profile.region)
                    ? profile.address
                    : [profile.region, profile.address].filter(Boolean).join(' ')
                  }
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>학력</label>
                <div style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={16} color="#666" />
                  {profile.education}
                </div>
              </div>
              {profile.age && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>나이</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{profile.age}세</div>
                </div>
              )}
            </div>

            {/* 희망 근무 조건 */}
            <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>희망 근무 조건</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>희망 지역</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    {profile.preferredRegion || '-'} {profile.preferredDistrict || ''} {profile.preferredDong || ''}
                  </div>
                </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>희망 업직종</label>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {Array.isArray(profile.desiredCategories) && profile.desiredCategories.length > 0
                    ? (() => {
                        const shown = profile.desiredCategories.slice(0, 3);
                        const rest = profile.desiredCategories.length - shown.length;
                        return shown.join(', ') + (rest > 0 ? ` 외 ${rest}개` : '');
                      })()
                    : '-'}
                </div>
              </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>근무 기간</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{profile.workDuration || '-'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>근무 일시</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{profile.workDays || '-'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>근무 시간</label>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{profile.workTime || '-'}</div>
                </div>
              </div>
            </div>

            {/* 나의 강점 */}
            {profile.strengths && profile.strengths.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>나의 강점</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.strengths.map((strength: string, index: number) => (
                    <span
                      key={index}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e3f2fd',
                        color: '#2196f3',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MBTI */}
            {profile.mbti && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>MBTI</label>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{profile.mbti}</div>
              </div>
            )}

            {/* 자기소개 */}
            {profile.introduction && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>자기소개</label>
                <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap', minHeight: '100px' }}>
                  {profile.introduction}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 자격증 */}
        {activeTab === 'licenses' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>자격증</h2>
            {profile.licenses && profile.licenses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {profile.licenses.map((license) => (
                  <div key={license.id} style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>{license.name}</h3>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666' }}>
                          <div><span style={{ fontWeight: '500' }}>발급일:</span> {license.issueDate || '-'}</div>
                          <div><span style={{ fontWeight: '500' }}>만료일:</span> {license.expiryDate || '-'}</div>
                        </div>
                      </div>
                      <Award size={24} color="#2196f3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>등록된 자격증이 없습니다.</div>
            )}
          </div>
        )}

        {/* 경력 */}
        {activeTab === 'experience' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>경력</h2>
            {profile.experiences && profile.experiences.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {profile.experiences.map((exp) => (
                  <div key={exp.id} style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{exp.company}</h3>
                        <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>{exp.position} · {exp.startDate} ~ {exp.endDate || '재직중'}</p>
                        {exp.description && (<p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>{exp.description}</p>)}
                      </div>
                      <Briefcase size={24} color="#2196f3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>등록된 경력이 없습니다.</div>
            )}
          </div>
        )}

        {/* 신체속성 */}
        {activeTab === 'physical' && (profile.height || profile.weight || profile.muscleStrength) && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>신체속성</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>키</label>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{profile.height ? `${profile.height}cm` : '-'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>몸무게</label>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{profile.weight ? `${profile.weight}kg` : '-'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>근력</label>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{profile.muscleStrength || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
