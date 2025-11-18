import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import type { JobseekerProfile } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { User, Award, Briefcase, Activity, Plus, X, Save, Edit2, Trash2, RotateCcw, Bookmark, MapPin, DollarSign, ArrowRight, CheckCircle, ChevronDown, GraduationCap, Mail, Phone, Calendar, Home, Users, Star, MessageSquare } from 'lucide-react'
import { apiCall, getErrorMessage, getApiBaseUrl } from '../utils/api'
import JobseekerProposals from './JobseekerProposals'

type ProfileTab = 'personal' | 'licenses' | 'experience' | 'physical' | 'saved' | 'applied' | 'proposals'

type SavedJob = {
  id: number
  title: string
  company: string
  location: string
  salary: string
  description: string
  type: string
  posted: string
}

type AppliedJob = {
  id: number
  applicationId: number
  title: string
  company: string
  location: string
  salary: string
  description: string
  type: string
  posted: string
  status: string
}

type License = {
  id: number
  name: string
  issueDate: string
  expiryDate: string
}

type Experience = {
  id: number
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
}

function Profile() {
  const { setJobseekerProfile } = useUser();
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal')
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([])
  
  // 시/도 및 구/군 데이터
  const regions: Record<string, string[]> = {
    '전체': ['전체'],
    '서울': ['전체', '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
    '부산': ['전체', '강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
    '대구': ['전체', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
    '인천': ['전체', '강화군', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
    '광주': ['전체', '광산구', '남구', '동구', '북구', '서구'],
    '대전': ['전체', '대덕구', '동구', '서구', '유성구', '중구'],
    '울산': ['전체', '남구', '동구', '북구', '울주군', '중구'],
    '세종': ['전체'],
    '경기': ['전체', '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
    '강원': ['전체', '강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
    '충북': ['전체', '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
    '충남': ['전체', '계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
    '전북': ['전체', '고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'],
    '전남': ['전체', '강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
    '경북': ['전체', '경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'],
    '경남': ['전체', '거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '진해시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
    '제주': ['전체', '서귀포시', '제주시']
  }

  // 구/군별 동 데이터 (JobSearch.tsx와 동일한 데이터 사용)
  const districts: Record<string, string[]> = {
    // 서울 구의 동
    '서울 강남구': ['전체', '역삼동', '개포동', '논현동', '대치동', '도곡동', '삼성동', '세곡동', '수서동', '신사동', '압구정동', '일원동', '청담동'],
    '서울 강동구': ['전체', '강일동', '고덕동', '길동', '둔촌동', '명일동', '상일동', '성내동', '암사동', '천호동'],
    '서울 강북구': ['전체', '미아동', '번동', '수유동', '우이동'],
    '서울 강서구': ['전체', '가양동', '공항동', '등촌동', '방화동', '염창동', '화곡동'],
    '서울 관악구': ['전체', '남현동', '봉천동', '신림동', '은천동', '인헌동', '청룡동', '행운동'],
    '서울 광진구': ['전체', '광장동', '구의동', '군자동', '능동', '자양동', '화양동'],
    '서울 구로구': ['전체', '가리봉동', '개봉동', '고척동', '구로동', '궁동', '신도림동', '오류동', '온수동', '천왕동', '항동'],
    '서울 금천구': ['전체', '가산동', '독산동', '시흥동'],
    '서울 노원구': ['전체', '공릉동', '상계동', '월계동', '중계동', '하계동'],
    '서울 도봉구': ['전체', '도봉동', '방학동', '쌍문동', '창동'],
    '서울 동대문구': ['전체', '답십리동', '용신동', '이문동', '장안동', '전농동', '제기동', '청량리동', '회기동', '휘경동'],
    '서울 동작구': ['전체', '노량진동', '대방동', '사당동', '상도동', '신대방동', '흑석동'],
    '서울 마포구': ['전체', '공덕동', '구수동', '노고산동', '당인동', '대흥동', '도화동', '망원동', '상암동', '상수동', '서강동', '서교동', '성산동', '신수동', '아현동', '연남동', '용강동', '합정동', '현석동'],
    '서울 서대문구': ['전체', '남가좌동', '북가좌동', '냉천동', '대신동', '대현동', '미근동', '봉원동', '북아현동', '신촌동', '연희동', '영천동', '옥천동', '창천동', '천연동', '충현동', '합동', '현저동', '홍은동', '홍제동'],
    '서울 서초구': ['전체', '내곡동', '반포동', '방배동', '서초동', '양재동', '염곡동', '우면동', '원지동', '잠원동'],
    '서울 성동구': ['전체', '금호동', '도선동', '마장동', '사근동', '상왕십리동', '성수동', '송정동', '옥수동', '용신동', '응봉동', '하왕십리동', '행당동', '황학동'],
    '서울 성북구': ['전체', '길음동', '돈암동', '동선동', '동소문동', '보문동', '삼선동', '상월곡동', '석관동', '성북동', '안암동', '장위동', '정릉동', '종암동', '하월곡동'],
    '서울 송파구': ['전체', '가락동', '거여동', '마천동', '문정동', '방이동', '삼전동', '석촌동', '송파동', '신천동', '오금동', '잠실동', '장지동', '풍납동'],
    '서울 양천구': ['전체', '목동', '신월동', '신정동'],
    '서울 영등포구': ['전체', '당산동', '대림동', '도림동', '문래동', '신길동', '양평동', '여의도동', '영등포동', '용산동'],
    '서울 용산구': ['전체', '갈월동', '남영동', '도원동', '동빙고동', '동자동', '문배동', '보광동', '산천동', '서빙고동', '서계동', '신계동', '신창동', '용산동', '원효로동', '이촌동', '이태원동', '주성동', '청파동', '한강로동', '한남동', '효창동', '후암동'],
    '서울 은평구': ['전체', '갈현동', '구산동', '녹번동', '대조동', '불광동', '수색동', '신사동', '역촌동', '응암동', '증산동', '진관동'],
    '서울 종로구': ['전체', '가회동', '견지동', '경운동', '계동', '공평동', '관수동', '관철동', '관훈동', '교남동', '교북동', '구기동', '궁정동', '권농동', '낙원동', '내수동', '내자동', '누하동', '당주동', '도렴동', '돈의동', '동숭동', '명륜동', '묘동', '무악동', '봉익동', '부암동', '사간동', '사직동', '삼청동', '서린동', '세종로', '소격동', '송월동', '송현동', '수송동', '숭인동', '신교동', '신문로', '신영동', '안국동', '연건동', '연지동', '예지동', '와룡동', '운니동', '원남동', '원서동', '이화동', '익선동', '인사동', '인의동', '장사동', '재동', '적선동', '종로동', '중학동', '창신동', '청와대로', '청진동', '체부동', '충신동', '통의동', '통인동', '팔판동', '평동', '평창동', '필운동', '행촌동', '혜화동', '화동', '효자동', '효제동', '훈정동'],
    '서울 중구': ['전체', '광희동', '남대문로', '남산동', '남창동', '남학동', '다동', '만리동', '명동', '무교동', '무학동', '봉래동', '북창동', '산림동', '삼각동', '서소문동', '소공동', '수표동', '수하동', '순화동', '신당동', '쌍림동', '예장동', '오장동', '을지로동', '의주로', '인현동', '입정동', '장교동', '장충동', '저동', '정동', '주교동', '주자동', '중림동', '초동', '충무로', '충무로동', '태평로', '필동', '황학동', '회현동'],
    '서울 중랑구': ['전체', '면목동', '묵동', '망우동', '상봉동', '신내동', '중화동'],
    // 부산 구의 동 (주요 구만)
    '부산 강서구': ['전체', '가락동', '강동동', '녹산동', '대저동', '명지동', '봉림동', '식만동', '신호동', '지사동', '천가동'],
    '부산 해운대구': ['전체', '반송동', '반여동', '송정동', '우동', '재송동', '좌동', '중동'],
    '부산 부산진구': ['전체', '가야동', '개금동', '당감동', '범천동', '범전동', '부암동', '부전동', '양정동', '연지동', '전포동', '초읍동', '초장동'],
    // 대전 구의 동 (주요 구만)
    '대전 유성구': ['전체', '갑동', '관평동', '구암동', '궁동', '노은동', '대정동', '덕명동', '도룡동', '봉명동', '상대동', '성북동', '신성동', '어은동', '원신흥동', '자운동', '장대동', '전민동', '지족동', '하기동', '학하동', '화암동'],
    // 경기도 주요 도시의 동 (주요 시만)
    '경기 성남시': ['전체', '금광동', '단대동', '복정동', '산성동', '수진동', '신촌동', '야탑동', '양지동', '은행동', '이매동', '정자동', '판교동', '하대원동', '하산운동'],
    '경기 수원시': ['전체', '고등동', '곡반정동', '구운동', '권선동', '금곡동', '기산동', '매교동', '매산동', '매탄동', '영동', '영통동', '원천동', '이의동', '인계동', '장안동', '정자동', '조원동', '천천동', '팔달동', '하동', '호매실동'],
    '경기 고양시': ['전체', '고양동', '관산동', '대자동', '덕이동', '마두동', '백석동', '삼송동', '성사동', '식사동', '신원동', '원당동', '주교동', '지축동', '행신동', '행주동', '화정동'],
    '경기 용인시': ['전체', '고림동', '구갈동', '기흥동', '동백동', '마북동', '모현동', '보라동', '상하동', '서천동', '신갈동', '언남동', '영덕동', '죽전동', '지곡동', '포곡동', '해곡동', '호동'],
    // 기타 시/군은 동 데이터가 없으면 동 선택 드롭다운이 표시되지 않음
  }

  // 구/군이 선택되지 않았거나 해당 구의 동 데이터가 없을 때
  const getDistricts = (region: string, district: string): string[] => {
    if (district === '전체') {
      return ['전체']
    }
    const key = `${region} ${district}`
    if (!districts[key]) {
      return ['전체']
    }
    return districts[key] || ['전체']
  }

  // 강점 옵션
  const strengthOptions = [
    '빠른 학습능력', '책임감', '성실함', '적극적인 커뮤니케이션', '시간관리', 
    '팀워크', '문제해결능력', '인내심', '긍정적 마인드', '세심함',
    '리더십', '창의성', '협업능력', '빠른 대응', '정확성',
    '체력', '외국어 능력', '컴퓨터 활용능력', '고객 서비스', '다재다능함'
  ]

  // MBTI 옵션
  const mbtiOptions = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
  ]

  // 초기 개인정보 (초기화 시 사용)
  const initialPersonalInfo = {
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    education: '',
    preferredRegion: '전체',
    preferredDistrict: '전체',
    preferredDong: '전체',
    workDuration: '무관',
    workDays: '무관',
    workTime: '무관',
    strengths: [] as string[],
    mbti: '',
    introduction: '',
    muscleStrength: '중' as '상' | '중' | '하',
    height: 0,
    weight: 0
  }
  
  // 저장된 개인정보 (취소 시 복원용, 저장 시 업데이트됨)
  const [savedPersonalInfo, setSavedPersonalInfo] = useState(initialPersonalInfo)
  
  // 현재 편집 중인 개인정보
  const [personalInfo, setPersonalInfo] = useState(initialPersonalInfo)
  
  // 프로필 로딩 상태
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  
  // 프로필 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        alert('로그인이 필요합니다.')
        navigate('/login/jobseeker')
        return
      }
      setIsLoadingProfile(true)
      try {
        const response = await apiCall<JobseekerProfile>(`/api/jobseeker/profile/${userId}`, { method: 'GET' })
        // muscleStrength enum을 한글로 변환
        // muscleStrength, height, weight 등은 physicalAttributes에서 추출
        let strengthKorean: '상' | '중' | '하' = '중';
        if (response.physicalAttributes?.muscleStrength === '상') strengthKorean = '상';
        else if (response.physicalAttributes?.muscleStrength === '하') strengthKorean = '하';
        const profileData = {
          name: response.name || '',
          email: response.email || '',
          phone: response.phone || '',
          birthDate: response.birthDate || '',
          gender: '',
          address: response.address || '',
          education: response.education || '',
          preferredRegion: response.preferredRegion || '전체',
          preferredDistrict: response.preferredDistrict || '전체',
          preferredDong: response.preferredDong || '전체',
          workDuration: response.workDuration || '무관',
          workDays: response.workDays || '무관',
          workTime: response.workTime || '무관',
          strengths: Array.isArray(response.strengths) ? response.strengths : [],
          mbti: response.mbti || '',
          introduction: response.introduction || '',
          muscleStrength: strengthKorean,
          height: response.physicalAttributes?.height || 0,
          weight: response.physicalAttributes?.weight || 0
        };
        setPersonalInfo(profileData);
        setSavedPersonalInfo(profileData);
        const physicalInfo = {
          strength: strengthKorean,
          height: response.physicalAttributes?.height || 175,
          weight: response.physicalAttributes?.weight || 70
        };
        setPhysicalData(physicalInfo);
        setSavedPhysicalData(physicalInfo);
        // UserContext에 프로필 저장 (id 등 포함)
        setJobseekerProfile(response);
      } catch (error) {
        console.error('프로필 로딩 실패:', error)
        const errorMessage = getErrorMessage(error)
        console.log('userId:', localStorage.getItem('userId'))
        console.log('에러 상세:', error)
        alert(`프로필을 불러오는데 실패했습니다.\n\n상세 오류: ${errorMessage}\n\n백엔드 서버(${getApiBaseUrl()})가 실행 중인지 확인해주세요.`)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadProfile()
  }, [navigate, setJobseekerProfile])

  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showDongDropdown, setShowDongDropdown] = useState(false)
  const [licenses, setLicenses] = useState<License[]>([])
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false)
  const [experience, setExperience] = useState<Experience[]>([])
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false)
  
  // 자격증 로드
  useEffect(() => {
    const loadLicenses = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) return
      
      setIsLoadingLicenses(true)
      try {
        const response = await apiCall<License[]>(`/api/jobseeker/licenses/${userId}`, {
          method: 'GET'
        })
        setLicenses(response)
      } catch (error) {
        console.error('자격증 로딩 실패:', error)
        setLicenses([]) // 에러 발생 시 빈 배열로 초기화
      } finally {
        setIsLoadingLicenses(false)
      }
    }
    
    loadLicenses()
  }, [])
  
  // 경력 로드
  useEffect(() => {
    const loadExperiences = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) return
      
      setIsLoadingExperiences(true)
      try {
        const response = await apiCall<Experience[]>(`/api/jobseeker/experiences/${userId}`, {
          method: 'GET'
        })
        setExperience(response)
      } catch (error) {
        console.error('경력 로딩 실패:', error)
      } finally {
        setIsLoadingExperiences(false)
      }
    }
    
    loadExperiences()
  }, [])
  
  // 자격증 관련 상태
  const [editingLicenseId, setEditingLicenseId] = useState<number | null>(null)
  const [isAddingLicense, setIsAddingLicense] = useState(false)
  const [newLicense, setNewLicense] = useState<Omit<License, 'id'>>({
    name: '',
    issueDate: '',
    expiryDate: ''
  })
  const [editingLicense, setEditingLicense] = useState<Omit<License, 'id'>>({
    name: '',
    issueDate: '',
    expiryDate: ''
  })
  
  // 경력 관련 상태
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null)
  const [isAddingExperience, setIsAddingExperience] = useState(false)
  const [newExperience, setNewExperience] = useState<Omit<Experience, 'id'>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  })
  const [editingExperience, setEditingExperience] = useState<Omit<Experience, 'id'>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  })
  
  // 자격증 추가
  const handleAddLicense = async () => {
    if (!newLicense.name || !newLicense.issueDate || !newLicense.expiryDate) {
      alert('모든 필드를 입력해주세요.')
      return
    }
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      const addedLicense = await apiCall<License>(`/api/jobseeker/licenses/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLicense)
      })
      
      setLicenses([...licenses, addedLicense])
      setNewLicense({ name: '', issueDate: '', expiryDate: '' })
      setIsAddingLicense(false)
      alert('자격증이 추가되었습니다.')
    } catch (error) {
      console.error('자격증 추가 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 자격증 수정 시작
  const handleStartEditLicense = (license: License) => {
    setEditingLicenseId(license.id)
    setEditingLicense({
      name: license.name,
      issueDate: license.issueDate,
      expiryDate: license.expiryDate
    })
  }
  
  // 자격증 수정 저장
  const handleSaveLicense = async (id: number) => {
    if (!editingLicense.name || !editingLicense.issueDate || !editingLicense.expiryDate) {
      alert('모든 필드를 입력해주세요.')
      return
    }
    
    try {
      const updatedLicense = await apiCall<License>(`/api/jobseeker/licenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingLicense)
      })
      
      setLicenses(licenses.map(l => l.id === id ? updatedLicense : l))
      setEditingLicenseId(null)
      setEditingLicense({ name: '', issueDate: '', expiryDate: '' })
      alert('자격증이 수정되었습니다.')
    } catch (error) {
      console.error('자격증 수정 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 자격증 삭제
  const handleDeleteLicense = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }
    
    try {
      await apiCall(`/api/jobseeker/licenses/${id}`, {
        method: 'DELETE'
      })
      
      setLicenses(licenses.filter(l => l.id !== id))
      alert('자격증이 삭제되었습니다.')
    } catch (error) {
      console.error('자격증 삭제 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 경력 추가
  const handleAddExperience = async () => {
    if (!newExperience.company || !newExperience.position || !newExperience.startDate || !newExperience.description) {
      alert('회사명, 직책, 입사년월, 업무 내용은 필수 입력 항목입니다.')
      return
    }
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      const addedExperience = await apiCall<Experience>(`/api/jobseeker/experiences/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newExperience,
          endDate: newExperience.endDate || null
        })
      })
      
      setExperience([...experience, addedExperience])
      setNewExperience({ company: '', position: '', startDate: '', endDate: '', description: '' })
      setIsAddingExperience(false)
      alert('경력이 추가되었습니다.')
    } catch (error) {
      console.error('경력 추가 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 경력 수정 시작
  const handleStartEditExperience = (exp: Experience) => {
    setEditingExperienceId(exp.id)
    setEditingExperience({
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate || '',
      description: exp.description
    })
  }
  
  // 경력 수정 저장
  const handleSaveExperience = async (id: number) => {
    if (!editingExperience.company || !editingExperience.position || !editingExperience.startDate || !editingExperience.description) {
      alert('회사명, 직책, 입사년월, 업무 내용은 필수 입력 항목입니다.')
      return
    }
    
    try {
      const updatedExperience = await apiCall<Experience>(`/api/jobseeker/experiences/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingExperience,
          endDate: editingExperience.endDate || null
        })
      })
      
      setExperience(experience.map(e => e.id === id ? updatedExperience : e))
      setEditingExperienceId(null)
      setEditingExperience({ company: '', position: '', startDate: '', endDate: '', description: '' })
      alert('경력이 수정되었습니다.')
    } catch (error) {
      console.error('경력 수정 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 경력 삭제
  const handleDeleteExperience = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }
    
    try {
      await apiCall(`/api/jobseeker/experiences/${id}`, {
        method: 'DELETE'
      })
      
      setExperience(experience.filter(e => e.id !== id))
      alert('경력이 삭제되었습니다.')
    } catch (error) {
      console.error('경력 삭제 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 강점 선택/해제
  const handleStrengthToggle = (strength: string) => {
    const currentStrengths = personalInfo.strengths
    if (currentStrengths.includes(strength)) {
      setPersonalInfo({
        ...personalInfo,
        strengths: currentStrengths.filter(s => s !== strength)
      })
    } else {
      if (currentStrengths.length >= 3) {
        alert('강점은 최대 3개까지 선택할 수 있습니다.')
        return
      }
      setPersonalInfo({
        ...personalInfo,
        strengths: [...currentStrengths, strength]
      })
    }
  }

  // 개인정보 저장
  const [personalInfoSaved, setPersonalInfoSaved] = useState(false)

  const handleSavePersonalInfo = async () => {
    if (!personalInfo.name || !personalInfo.email || !personalInfo.phone || !personalInfo.birthDate) {
      alert('이름, 이메일, 전화번호, 생년월일은 필수 입력 항목입니다.')
      return
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(personalInfo.email)) {
      alert('올바른 이메일 형식을 입력해주세요.')
      return
    }
    
    // 전화번호 형식 검증 (선택적)
    const phoneRegex = /^[0-9-]+$/
    if (!phoneRegex.test(personalInfo.phone)) {
      alert('올바른 전화번호 형식을 입력해주세요.')
      return
    }

    // 자기소개 검증
    if (personalInfo.introduction && personalInfo.introduction.length < 20) {
      alert('자기소개는 최소 20자 이상 입력해주세요.')
      return
    }
    if (personalInfo.introduction && personalInfo.introduction.length > 1000) {
      alert('자기소개는 최대 1000자까지 입력 가능합니다.')
      return
    }
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      // muscleStrength 매핑
      let muscleStrength: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
      if (physicalData.strength === '상') muscleStrength = 'HIGH'
      else if (physicalData.strength === '하') muscleStrength = 'LOW'
      
      await apiCall(`/api/jobseeker/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: personalInfo.name,
          phone: personalInfo.phone,
          birthDate: personalInfo.birthDate,
          gender: personalInfo.gender,
          address: personalInfo.address,
          education: personalInfo.education,
          preferredRegion: personalInfo.preferredRegion,
          preferredDistrict: personalInfo.preferredDistrict,
          preferredDong: personalInfo.preferredDong,
          workDuration: personalInfo.workDuration,
          workDays: personalInfo.workDays,
          workTime: personalInfo.workTime,
          muscleStrength: muscleStrength,
          height: physicalData.height,
          weight: physicalData.weight,
          strengths: personalInfo.strengths.join(','),
          mbti: personalInfo.mbti,
          introduction: personalInfo.introduction
        })
      })
      
      // 저장된 정보 업데이트
      setSavedPersonalInfo({ ...personalInfo })
      setPersonalInfoSaved(true)
      setTimeout(() => setPersonalInfoSaved(false), 3000)
      
    } catch (error) {
      console.error('개인정보 저장 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 개인정보 취소 (저장된 값으로 복원)
  const handleCancelPersonalInfo = () => {
    if (window.confirm('변경사항을 취소하시겠습니까? 입력한 내용이 저장되지 않습니다.')) {
      setPersonalInfo({ ...savedPersonalInfo })
    }
  }
  
  // 개인정보 초기화
  const handleResetPersonalInfo = () => {
    if (window.confirm('모든 개인정보를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setPersonalInfo({ ...initialPersonalInfo })
    }
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-region-dropdown]')) {
        setShowRegionDropdown(false)
      }
      if (!target.closest('[data-district-dropdown]')) {
        setShowDistrictDropdown(false)
      }
      if (!target.closest('[data-dong-dropdown]')) {
        setShowDongDropdown(false)
      }
    }
    if (showRegionDropdown || showDistrictDropdown || showDongDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showRegionDropdown, showDistrictDropdown, showDongDropdown])
  
  const [physicalData, setPhysicalData] = useState({
    strength: '중' as '상' | '중' | '하',
    height: 175,
    weight: 70
  })

  const [savedPhysicalData, setSavedPhysicalData] = useState({
    strength: '중' as '상' | '중' | '하',
    height: 175,
    weight: 70
  })

  const [isSavingPhysical, setIsSavingPhysical] = useState(false)

  // 신체속성 저장
  const handleSavePhysicalData = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    setIsSavingPhysical(true)
    try {
      // muscleStrength 매핑
      let muscleStrength: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
      if (physicalData.strength === '상') muscleStrength = 'HIGH'
      else if (physicalData.strength === '하') muscleStrength = 'LOW'
      
      await apiCall(`/api/jobseeker/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: personalInfo.name,
          phone: personalInfo.phone,
          birthDate: personalInfo.birthDate,
          gender: personalInfo.gender,
          address: personalInfo.address,
          education: personalInfo.education,
          preferredRegion: personalInfo.preferredRegion,
          preferredDistrict: personalInfo.preferredDistrict,
          preferredDong: personalInfo.preferredDong,
          workDuration: personalInfo.workDuration,
          workDays: personalInfo.workDays,
          workTime: personalInfo.workTime,
          muscleStrength: muscleStrength,
          height: physicalData.height,
          weight: physicalData.weight,
          strengths: personalInfo.strengths.join(','),
          mbti: personalInfo.mbti,
          introduction: personalInfo.introduction
        })
      })
      
      // 저장된 신체 정보 업데이트
      setSavedPhysicalData({ ...physicalData })
      
      alert('✓ 신체 속성이 성공적으로 저장되었습니다!')
    } catch (error) {
      console.error('신체 속성 저장 실패:', error)
      const errorMsg = getErrorMessage(error)
      alert(`❌ 저장 실패\n\n${errorMsg}\n\n백엔드 서버가 실행 중인지 확인해주세요.`)
    } finally {
      setIsSavingPhysical(false)
    }
  }

  // 신체속성 취소
  const handleCancelPhysicalData = () => {
    if (window.confirm('변경사항을 취소하시겠습니까? 입력한 내용이 저장되지 않습니다.')) {
      setPhysicalData({ ...savedPhysicalData })
    }
  }

  // 날짜 차이 계산 함수
  const getDaysAgo = (dateString: string): string => {
    const today = new Date()
    const postedDate = new Date(dateString)
    const diffTime = today.getTime() - postedDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '1일전'
    if (diffDays < 7) return `${diffDays}일전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주전`
    return `${Math.floor(diffDays / 30)}개월전`
  }

  // 저장된 일자리 불러오기 (API 연동)
  useEffect(() => {
    if (activeTab === 'saved') {
      const userId = localStorage.getItem('userId')
      console.log('💾 저장된 일자리 탭 활성화, userId:', userId)
      if (!userId) {
        console.log('❌ userId가 없습니다')
        return
      }

      const fetchSavedJobs = async () => {
        try {
          console.log('🔍 저장된 일자리 불러오기 시작:', `/api/jobseeker/saved-jobs/${userId}`)
          const response = await apiCall(`/api/jobseeker/saved-jobs/${userId}`, { method: 'GET' })
          console.log('📡 저장된 일자리 응답:', response)
          if (Array.isArray(response)) {
            const formattedJobs = response.map((job: any) => ({
              id: job.id,
              title: job.title,
              company: job.company || '',
              location: job.location || '',
              salary: job.salary || '협의',
              description: job.description || '',
              type: job.jobType || '파트타임',
              posted: job.postedDate ? getDaysAgo(job.postedDate) : '최근'
            }))
            console.log('✅ 저장된 일자리 개수:', formattedJobs.length, formattedJobs)
            setSavedJobs(formattedJobs)
          }
        } catch (error) {
          console.error('❌ 저장된 일자리를 불러오는데 실패했습니다:', error)
          // 에러 발생 시 빈 배열로 설정
          setSavedJobs([])
        }
      }

      fetchSavedJobs()
    }
  }, [activeTab])

  // 저장된 일자리 삭제 (API 연동)
  const handleRemoveSavedJob = async (jobId: number) => {
    if (!window.confirm('저장된 일자리를 삭제하시겠습니까?')) return

    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      await apiCall(`/api/jobseeker/saved-jobs/${userId}/${jobId}`, { method: 'DELETE' })
      setSavedJobs(savedJobs.filter(job => job.id !== jobId))
      alert('✓ 저장이 해제되었습니다.')
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      alert(`❌ 삭제 실패\n\n${errorMsg}`)
    }
  }

  // 지원한 일자리 불러오기 (API 연동) - 페이지 로드시 항상 불러오기
  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) return

    const fetchApplications = async () => {
      try {
        const response = await apiCall(`/api/jobseeker/applications/${userId}`, { method: 'GET' })
        if (Array.isArray(response)) {
          const formattedJobs = response.map((app: any) => ({
            id: app.jobId,
            applicationId: app.id, // 지원서 ID (삭제용)
            title: app.jobTitle,
            company: app.company || '',
            location: app.location || '',
            salary: app.salary || '협의',
            description: app.description || '',
            type: app.jobType || '파트타임',
            posted: app.posted || '최근',
            status: app.status || 'PENDING'
          }))
          setAppliedJobs(formattedJobs)
        }
      } catch (error) {
        console.error('지원 내역을 불러오는데 실패했습니다:', error)
        // 에러 발생 시 빈 배열로 설정
        setAppliedJobs([])
      }
    }

    fetchApplications()
  }, []) // activeTab 의존성 제거 - 항상 로드

  // 지원한 일자리 삭제 (API 연동)
  const handleCancelApplication = async (applicationId: number) => {
    if (!window.confirm('지원을 취소하시겠습니까?\n\n취소 후 다시 지원할 수 있습니다.')) return

    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      await apiCall(`/api/jobseeker/applications/${userId}/${applicationId}`, { method: 'DELETE' })
      setAppliedJobs(appliedJobs.filter(job => job.applicationId !== applicationId))
      alert('✓ 지원이 취소되었습니다.')
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      alert(`❌ 지원 취소 실패\n\n${errorMsg}`)
    }
  }

  const tabs = [
    { id: 'personal' as ProfileTab, label: '개인 정보', icon: User },
    { id: 'licenses' as ProfileTab, label: '자격증', icon: Award },
    { id: 'experience' as ProfileTab, label: '경력', icon: Briefcase },
    { id: 'physical' as ProfileTab, label: '신체 속성', icon: Activity },
    { id: 'saved' as ProfileTab, label: '저장된 일자리', icon: Bookmark },
    { id: 'applied' as ProfileTab, label: '지원한 일자리', icon: CheckCircle },
    { id: 'proposals' as ProfileTab, label: '제안받은 일자리', icon: MessageSquare }
  ]

  return (
    <div>
      {/* 저장 성공 토스트 메시지 */}
      {personalInfoSaved && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2196f3',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(33,150,243,0.15)'
        }}>
          개인정보가 저장되었습니다.
        </div>
      )}

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px' }}>프로필</h1>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid #e0e0e0' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #2196f3' : '2px solid transparent',
                backgroundColor: activeTab === tab.id ? '#f5f5f5' : 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'personal' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>개인 정보</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            이름, 연락처 등 기본 개인 정보를 업데이트하세요.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color="#2196f3" />
                이름
              </label>
              <input
                type="text"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%232196f3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={16} color="#4caf50" />
                이메일
              </label>
              <input
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%234caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={16} color="#ff9800" />
                전화번호
              </label>
              <input
                type="tel"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23ff9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="#9c27b0" />
                생년월일
              </label>
              <input
                type="date"
                value={personalInfo.birthDate}
                onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%239c27b0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="#00bcd4" />
                성별
              </label>
              <select
                value={personalInfo.gender}
                onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px 20px, 16px 16px',
                  appearance: 'none',
                  backgroundPosition: '12px center, right 12px center',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%2300bcd4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')`
                }}
              >
                <option value="">선택하세요</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Home size={16} color="#607d8b" />
                주소
              </label>
              <input
                type="text"
                value={personalInfo.address}
                onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23607d8b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
          </div>

          {/* 학력사항 */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={20} />
              학력사항
            </h3>
            <div style={{ maxWidth: '800px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>최종학력</label>
              <select
                value={personalInfo.education}
                onChange={(e) => setPersonalInfo({ ...personalInfo, education: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="">선택하세요</option>
                <option value="초등학교">초등학교</option>
                <option value="중학교">중학교</option>
                <option value="고등학교">고등학교</option>
                <option value="대학(2,3년제)">대학(2,3년제)</option>
                <option value="대학(4년제)">대학(4년제)</option>
                <option value="대학원">대학원</option>
              </select>
            </div>
          </div>

          {/* 희망근무조건 */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="#2196f3" />
              희망근무조건
            </h3>
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>지역선택</h4>
              <div style={{ display: 'flex', gap: '12px', maxWidth: '800px' }}>
                {/* 시/도 선택 */}
                <div style={{ position: 'relative', flex: 1 }} data-region-dropdown>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>시/도</label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowRegionDropdown(!showRegionDropdown)
                      setShowDistrictDropdown(false)
                      setShowDongDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '16px'
                    }}
                  >
                    <span>{personalInfo.preferredRegion}</span>
                    <ChevronDown size={20} color="#666" />
                  </button>
                  {showRegionDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {Object.keys(regions).map((region) => (
                        <button
                          key={region}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPersonalInfo({ 
                              ...personalInfo, 
                              preferredRegion: region,
                              preferredDistrict: '전체',
                              preferredDong: '전체'
                            })
                            setShowRegionDropdown(false)
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            backgroundColor: personalInfo.preferredRegion === region ? '#e3f2fd' : '#ffffff',
                            color: personalInfo.preferredRegion === region ? '#2196f3' : '#333',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (personalInfo.preferredRegion !== region) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (personalInfo.preferredRegion !== region) {
                              e.currentTarget.style.backgroundColor = '#ffffff'
                            }
                          }}
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 구/군 선택 */}
                {personalInfo.preferredRegion !== '전체' && (
                  <div style={{ position: 'relative', flex: 1 }} data-district-dropdown>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>구/군</label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDistrictDropdown(!showDistrictDropdown)
                        setShowRegionDropdown(false)
                        setShowDongDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '16px'
                      }}
                    >
                      <span>{personalInfo.preferredDistrict}</span>
                      <ChevronDown size={20} color="#666" />
                    </button>
                    {showDistrictDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}>
                        {regions[personalInfo.preferredRegion]?.map((district) => (
                          <button
                            key={district}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPersonalInfo({ 
                                ...personalInfo, 
                                preferredDistrict: district,
                                preferredDong: '전체'
                              })
                              setShowDistrictDropdown(false)
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: personalInfo.preferredDistrict === district ? '#e3f2fd' : '#ffffff',
                              color: personalInfo.preferredDistrict === district ? '#2196f3' : '#333',
                              cursor: 'pointer',
                              fontSize: '16px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (personalInfo.preferredDistrict !== district) {
                                e.currentTarget.style.backgroundColor = '#f5f5f5'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (personalInfo.preferredDistrict !== district) {
                                e.currentTarget.style.backgroundColor = '#ffffff'
                              }
                            }}
                          >
                            {district}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 동 선택 */}
                {personalInfo.preferredRegion !== '전체' && 
                 personalInfo.preferredDistrict !== '전체' && 
                 getDistricts(personalInfo.preferredRegion, personalInfo.preferredDistrict).length > 1 && (
                  <div style={{ position: 'relative', flex: 1 }} data-dong-dropdown>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>동</label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDongDropdown(!showDongDropdown)
                        setShowRegionDropdown(false)
                        setShowDistrictDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '16px'
                      }}
                    >
                      <span>{personalInfo.preferredDong}</span>
                      <ChevronDown size={20} color="#666" />
                    </button>
                    {showDongDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}>
                        {getDistricts(personalInfo.preferredRegion, personalInfo.preferredDistrict).map((dong) => (
                          <button
                            key={dong}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPersonalInfo({ 
                                ...personalInfo, 
                                preferredDong: dong
                              })
                              setShowDongDropdown(false)
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: personalInfo.preferredDong === dong ? '#e3f2fd' : '#ffffff',
                              color: personalInfo.preferredDong === dong ? '#2196f3' : '#333',
                              cursor: 'pointer',
                              fontSize: '16px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (personalInfo.preferredDong !== dong) {
                                e.currentTarget.style.backgroundColor = '#f5f5f5'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (personalInfo.preferredDong !== dong) {
                                e.currentTarget.style.backgroundColor = '#ffffff'
                              }
                            }}
                          >
                            {dong}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>

              {/* 근무기간 */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>근무기간</label>
                <select
                  value={personalInfo.workDuration}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, workDuration: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="무관">무관</option>
                  <option value="하루">하루</option>
                  <option value="1일주일이하">1일주일이하</option>
                  <option value="1주일~1개월">1주일~1개월</option>
                  <option value="1개월~3개월">1개월~3개월</option>
                  <option value="3개월~6개월">3개월~6개월</option>
                  <option value="6개월 이상">6개월 이상</option>
                </select>
              </div>

              {/* 근무일시 - 요일 */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>근무일시 (요일)</label>
                <select
                  value={personalInfo.workDays}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, workDays: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="무관">무관</option>
                  <option value="월~일">월~일</option>
                  <option value="월~토">월~토</option>
                  <option value="월~금">월~금</option>
                  <option value="주말(토,일)">주말(토,일)</option>
                </select>
              </div>

              {/* 근무일시 - 시간대 */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>근무일시 (시간대)</label>
                <select
                  value={personalInfo.workTime}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, workTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="무관">무관</option>
                  <option value="오전 파트타임(06:00~12:00)">오전 파트타임(06:00~12:00)</option>
                  <option value="오후 파트타임(12:00~18:00)">오후 파트타임(12:00~18:00)</option>
                  <option value="저녁 파트타임(18:00~24:00)">저녁 파트타임(18:00~24:00)</option>
                  <option value="새벽 파트타임(00:00~06:00)">새벽 파트타임(00:00~06:00)</option>
                  <option value="풀타임(8시간이상)">풀타임(8시간이상)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 나의 강점 */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} color="#ff9800" />
              나의 강점
            </h3>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>나의 강점을 최대 3개까지 선택해주세요. ({personalInfo.strengths.length}/3)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', maxWidth: '800px' }}>
              {strengthOptions.map((strength) => (
                <label
                  key={strength}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: personalInfo.strengths.includes(strength) ? '2px solid #2196f3' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: personalInfo.strengths.includes(strength) ? '#e3f2fd' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!personalInfo.strengths.includes(strength)) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!personalInfo.strengths.includes(strength)) {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={personalInfo.strengths.includes(strength)}
                    onChange={() => handleStrengthToggle(strength)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{strength}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 나의 MBTI */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>나의 MBTI</h3>
            <div style={{ maxWidth: '800px' }}>
              <select
                value={personalInfo.mbti}
                onChange={(e) => setPersonalInfo({ ...personalInfo, mbti: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="">선택하세요</option>
                {mbtiOptions.map((mbti) => (
                  <option key={mbti} value={mbti}>{mbti}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 자기소개 */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="#4caf50" />
              자기소개
            </h3>
            <div style={{ maxWidth: '800px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                자기소개를 입력해 주세요. (최소 20자 필수, 최대 1000자)
              </label>
              <textarea
                value={personalInfo.introduction}
                onChange={(e) => setPersonalInfo({ ...personalInfo, introduction: e.target.value })}
                placeholder="자기소개를 입력해주세요..."
                rows={8}
                maxLength={1000}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '14px', color: '#666' }}>
                <span style={{ color: personalInfo.introduction.length < 20 && personalInfo.introduction.length > 0 ? '#f44336' : '#666' }}>
                  {personalInfo.introduction.length < 20 && personalInfo.introduction.length > 0 
                    ? `최소 20자 이상 입력해주세요. (현재 ${personalInfo.introduction.length}자)`
                    : personalInfo.introduction.length >= 20
                    ? `✓ ${personalInfo.introduction.length}자`
                    : `0자 / 최소 20자`}
                </span>
                <span>{personalInfo.introduction.length} / 1000자</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleResetPersonalInfo}
              style={{
                padding: '12px 24px',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#ff9800',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fff3e0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              <RotateCcw size={16} />
              초기화
            </button>
            <button
              onClick={handleCancelPersonalInfo}
              style={{
                padding: '12px 24px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSavePersonalInfo}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#2196f3',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1976d2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2196f3'
              }}
            >
              저장
            </button>
          </div>
        </div>
      )}

      {activeTab === 'licenses' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>자격증</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {licenses.map((license) => (
              <div key={license.id} style={{
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}>
                {editingLicenseId === license.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        자격증명 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={editingLicense.name}
                        onChange={(e) => setEditingLicense({ ...editingLicense, name: e.target.value })}
                        placeholder="자격증명을 입력하세요"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          발급일 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={editingLicense.issueDate}
                          onChange={(e) => setEditingLicense({ ...editingLicense, issueDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          만료일 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={editingLicense.expiryDate}
                          onChange={(e) => setEditingLicense({ ...editingLicense, expiryDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setEditingLicenseId(null)
                          setEditingLicense({ name: '', issueDate: '', expiryDate: '' })
                        }}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <X size={16} />
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveLicense(license.id)}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#2196f3',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Save size={16} />
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{license.name}</h3>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>발급일: {license.issueDate}</p>
                      <p style={{ color: '#666', fontSize: '14px' }}>만료일: {license.expiryDate}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleStartEditLicense(license)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Edit2 size={14} />
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteLicense(license.id)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #f44336',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#f44336',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isAddingLicense ? (
              <div style={{
                padding: '20px',
                border: '2px dashed #2196f3',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      자격증명 <span style={{ color: '#f44336' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newLicense.name}
                      onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
                      placeholder="자격증명을 입력하세요"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        발급일 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={newLicense.issueDate}
                        onChange={(e) => setNewLicense({ ...newLicense, issueDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        만료일 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={newLicense.expiryDate}
                        onChange={(e) => setNewLicense({ ...newLicense, expiryDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setIsAddingLicense(false)
                        setNewLicense({ name: '', issueDate: '', expiryDate: '' })
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} />
                      취소
                    </button>
                    <button
                      onClick={handleAddLicense}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#2196f3',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Save size={16} />
                      저장
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingLicense(true)}
                style={{
                  padding: '12px 24px',
                  border: '1px dashed #2196f3',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={20} />
                자격증 추가
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'experience' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>경력</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {experience.map((exp) => (
              <div key={exp.id} style={{
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}>
                {editingExperienceId === exp.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          회사명 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={editingExperience.company}
                          onChange={(e) => setEditingExperience({ ...editingExperience, company: e.target.value })}
                          placeholder="회사명을 입력하세요"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          직책 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={editingExperience.position}
                          onChange={(e) => setEditingExperience({ ...editingExperience, position: e.target.value })}
                          placeholder="직책을 입력하세요"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          입사년월 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="month"
                          value={editingExperience.startDate}
                          onChange={(e) => setEditingExperience({ ...editingExperience, startDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          퇴사년월 <span style={{ color: '#999' }}>(선택)</span>
                        </label>
                        <input
                          type="month"
                          value={editingExperience.endDate}
                          onChange={(e) => setEditingExperience({ ...editingExperience, endDate: e.target.value })}
                          placeholder="재직중이면 비워두세요"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        업무 내용 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <textarea
                        value={editingExperience.description}
                        onChange={(e) => setEditingExperience({ ...editingExperience, description: e.target.value })}
                        placeholder="주요 업무 내용을 입력하세요"
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setEditingExperienceId(null)
                          setEditingExperience({ company: '', position: '', startDate: '', endDate: '', description: '' })
                        }}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <X size={16} />
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveExperience(exp.id)}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#2196f3',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Save size={16} />
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {exp.position} - {exp.company}
                      </h3>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                        기간: {exp.startDate} ~ {exp.endDate ? exp.endDate : '재직중'}
                      </p>
                      <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>{exp.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleStartEditExperience(exp)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Edit2 size={14} />
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #f44336',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#f44336',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isAddingExperience ? (
              <div style={{
                padding: '20px',
                border: '2px dashed #2196f3',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        회사명 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        placeholder="회사명을 입력하세요"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        직책 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={newExperience.position}
                        onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                        placeholder="직책을 입력하세요"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        입사년월 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="month"
                        value={newExperience.startDate}
                        onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        퇴사년월 <span style={{ color: '#999' }}>(선택)</span>
                      </label>
                      <input
                        type="month"
                        value={newExperience.endDate}
                        onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                        placeholder="재직중이면 비워두세요"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      업무 내용 <span style={{ color: '#f44336' }}>*</span>
                    </label>
                    <textarea
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                      placeholder="주요 업무 내용을 입력하세요"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setIsAddingExperience(false)
                        setNewExperience({ company: '', position: '', startDate: '', endDate: '', description: '' })
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} />
                      취소
                    </button>
                    <button
                      onClick={handleAddExperience}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#2196f3',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Save size={16} />
                      저장
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingExperience(true)}
                style={{
                  padding: '12px 24px',
                  border: '1px dashed #2196f3',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={20} />
                경력 추가
              </button>
            )}
          </div>
        </div>
      )}

      {/* 신체속성 탭 */}
      {activeTab === 'physical' && (
        <>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>신체 속성</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              근력, 키, 몸무게 등 신체 데이터를 입력하세요. AI 추천 시스템이 이 정보를 활용합니다.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>근력</label>
                <select
                  value={physicalData.strength}
                  onChange={(e) => setPhysicalData({ ...physicalData, strength: e.target.value as '상' | '중' | '하' })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="상">상</option>
                  <option value="중">중</option>
                  <option value="하">하</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>키 (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={physicalData.height}
                  onChange={(e) => setPhysicalData({ ...physicalData, height: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>몸무게 (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={physicalData.weight}
                  onChange={(e) => setPhysicalData({ ...physicalData, weight: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelPhysicalData}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
              >
                취소
              </button>
              <button
                onClick={handleSavePhysicalData}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#2196f3',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1976d2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2196f3'
                }}
              >
                저장
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'saved' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>저장된 일자리</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            관심 있는 일자리를 저장하여 나중에 쉽게 확인할 수 있습니다.
          </p>
          
          {savedJobs.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <Bookmark size={48} color="#999" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>저장된 일자리가 없습니다</p>
              <p style={{ fontSize: '14px', color: '#999' }}>구직 검색 페이지에서 관심 있는 일자리를 저장해보세요.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {savedJobs.map((job) => {
                // 해당 일자리에 지원했는지 확인
                const application = appliedJobs.find(app => app.id === job.id)
                const applicationStatus = application?.status
                
                return (
                  <div
                    key={job.id}
                    style={{
                      padding: '24px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{job.title}</h3>
                          {(applicationStatus === '합격' || applicationStatus === 'ACCEPTED') && (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#4caf50',
                              color: '#ffffff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>✓ 합격</span>
                          )}
                          {(applicationStatus === '대기' || applicationStatus === 'PENDING') && (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#ff9800',
                              color: '#ffffff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>⏳ 심사중</span>
                          )}
                          {(applicationStatus === '불합격' || applicationStatus === 'REJECTED') && (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#f44336',
                              color: '#ffffff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>✕ 불합격</span>
                          )}
                        </div>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>{job.company}</p>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={16} />
                            {job.salary}
                          </span>
                        </div>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>{job.description}</p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#e3f2fd',
                            color: '#2196f3',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>{job.type}</span>
                          <span style={{ color: '#999', fontSize: '12px' }}>{job.posted}</span>
                        </div>
                      </div>
                    </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleRemoveSavedJob(job.id)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #f44336',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        color: '#f44336',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffebee'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }}
                    >
                      <X size={16} />
                      저장 해제
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
                        gap: '4px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1976d2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2196f3'
                      }}
                    >
                      상세보기
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'applied' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>지원한 일자리</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            지원을 완료한 일자리 목록입니다. 지원 상태를 확인하고 관리할 수 있습니다.
          </p>
          {appliedJobs.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <CheckCircle size={48} color="#999" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>지원한 일자리가 없습니다</p>
              <p style={{ fontSize: '14px', color: '#999' }}>추천 채용 페이지에서 일자리에 지원해보세요.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {appliedJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    padding: '24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{job.title}</h3>
                        {(job.status === '합격' || job.status === 'ACCEPTED') && (
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#4caf50',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>✓ 합격</span>
                        )}
                        {(job.status === '대기' || job.status === 'PENDING') && (
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#ff9800',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>⏳ 심사중</span>
                        )}
                        {(job.status === '불합격' || job.status === 'REJECTED') && (
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#f44336',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>✕ 불합격</span>
                        )}
                      </div>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>{job.company}</p>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={16} />
                          {job.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={16} />
                          {job.salary}
                        </span>
                      </div>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>{job.description}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#e3f2fd',
                          color: '#2196f3',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>{job.type}</span>
                        <span style={{ color: '#999', fontSize: '12px' }}>{job.posted}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleCancelApplication((job as any).applicationId || job.id)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #f44336',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        color: '#f44336',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffebee'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }}
                    >
                      <X size={16} />
                      지원 취소
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
                        gap: '4px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1976d2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2196f3'
                      }}
                    >
                      상세보기
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'proposals' && (
        <JobseekerProposals />
      )}

      {/* 상단에 저장 성공 메시지 */}
      {personalInfoSaved && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2196f3',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(33,150,243,0.15)'
        }}>
          개인정보가 저장되었습니다.
        </div>
      )}
    </div>
  )
}

export default Profile

