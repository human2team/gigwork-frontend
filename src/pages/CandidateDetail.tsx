import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall, getErrorMessage } from '../utils/api';
import { MapPin, Mail, Phone, GraduationCap, Briefcase } from 'lucide-react';

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
  licenses: License[];
  experiences: Experience[];
  // 필요한 필드 추가
}

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600">← 목록으로</button>
      <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
      <div className="flex items-center gap-2 mb-2">
        <Mail size={16} /> {profile.email}
        <Phone size={16} className="ml-4" /> {profile.phone}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={16} /> {profile.region} {profile.address}
      </div>
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap size={16} /> {profile.education}
      </div>
      <section className="mb-6">
        <h3 className="font-semibold mb-1">자격증</h3>
        {profile.licenses && profile.licenses.length > 0 ? (
          <ul className="list-disc ml-6">
            {profile.licenses.map(lic => (
              <li key={lic.id}>
                {lic.name} (취득: {lic.issueDate}{lic.expiryDate ? `, 만료: ${lic.expiryDate}` : ''})
              </li>
            ))}
          </ul>
        ) : (
          <div>등록된 자격증이 없습니다.</div>
        )}
      </section>
      <section>
        <h3 className="font-semibold mb-1">경력</h3>
        {profile.experiences && profile.experiences.length > 0 ? (
          <ul className="list-disc ml-6">
            {profile.experiences.map(exp => (
              <li key={exp.id}>
                <Briefcase size={14} className="inline mr-1" />
                {exp.company} - {exp.position} ({exp.startDate} ~ {exp.endDate})<br />
                <span className="text-sm text-gray-600">{exp.description}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div>등록된 경력이 없습니다.</div>
        )}
      </section>
    </div>
  );
}
