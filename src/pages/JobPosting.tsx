import { Briefcase, MapPin, FileText, User, Calendar, Award, ClipboardList, CheckCircle, Layers, X, ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JobPosting() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    company: '',
    location: '',
    description: '',
    qualifications: [''],
    requirements: [] as string[],
    otherRequirement: '',
    workingDays: [] as string[],
    startTime: '',
    endTime: '',
    salary: '',
    salaryType: '시급',
    deadline: '',
    gender: '무관',
    age: '무관',
    education: '무관'
  })

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('서울')
  const [selectedDistrict, setSelectedDistrict] = useState('전체')
  const [selectedDong, setSelectedDong] = useState('전체')

  const jobCategories = [
    '기획.전략',
    '마케팅.홍보.조사',
    '회계.세무.재무',
    '인사.노무.HRD',
    '총무.법무.사무',
    'IT개발.데이터',
    '디자인',
    '영업.판매.무역',
    '고객상담.TM',
    '구매.자재.물류',
    '상품기획.MD',
    '운전.운송.배송',
    '서비스',
    '생산',
    '건설.건축',
    '의료',
    '연구.R&D',
    '교육',
    '미디어.문화.스포츠',
    '금융.보험',
    '공공.복지'
  ]

  // 시/도 및 구/군 데이터
  const regions: Record<string, string[]> = {
    '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
    '부산': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
    '대구': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
    '인천': ['강화군', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
    '광주': ['광산구', '남구', '동구', '북구', '서구'],
    '대전': ['대덕구', '동구', '서구', '유성구', '중구'],
    '울산': ['남구', '동구', '북구', '울주군', '중구'],
    '세종': ['세종시'],
    '경기': ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
    '강원': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
    '충북': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
    '충남': ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
    '전북': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'],
    '전남': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
    '경북': ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'],
    '경남': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '진해시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
    '제주': ['서귀포시', '제주시']
  }

  // 구/군별 동 데이터 (주요 구만 포함)
  const districts: Record<string, string[]> = {
    '서울 강남구': ['역삼동', '개포동', '논현동', '대치동', '도곡동', '삼성동', '세곡동', '수서동', '신사동', '압구정동', '일원동', '청담동'],
    '서울 송파구': ['가락동', '거여동', '마천동', '문정동', '방이동', '삼전동', '석촌동', '송파동', '신천동', '오금동', '잠실동', '장지동', '풍납동'],
    '서울 강서구': ['가양동', '공항동', '등촌동', '방화동', '염창동', '화곡동'],
    '경기 성남시': ['금광동', '단대동', '복정동', '산성동', '수진동', '신촌동', '야탑동', '양지동', '은행동', '이매동', '정자동', '판교동', '하대원동', '하산운동'],
    '경기 수원시': ['고등동', '곡반정동', '구운동', '권선동', '금곡동', '기산동', '매교동', '매산동', '매탄동', '영동', '영통동', '원천동', '이의동', '인계동', '장안동', '정자동', '조원동', '천천동', '팔달동', '하동', '호매실동']
  }

  const getDistricts = (region: string, district: string): string[] => {
    const key = `${region} ${district}`
    return districts[key] || []
  }

  const requirementOptions = [
    '통장사본',
    '신분증',
    '영어',
    '일본어',
    '중국어',
    '운전면허증',
    '원활한 커뮤니케이션',
    '무거운 짐 운반',
    '기타(직접입력)'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleArrayChange = (index: number, value: string, field: 'qualifications') => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({
      ...formData,
      [field]: newArray
    })
  }

  const addArrayItem = (field: 'qualifications') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    })
  }

  const removeArrayItem = (index: number, field: 'qualifications') => {
    const newArray = formData[field].filter((_, i) => i !== index)
    setFormData({
      ...formData,
      [field]: newArray.length > 0 ? newArray : ['']
    })
  }

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    // 빈 칸 추가 (첫 주 시작 전)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const toggleWorkingDay = (date: Date) => {
    const dateStr = formatDate(date)
    if (formData.workingDays.includes(dateStr)) {
      setFormData({
        ...formData,
        workingDays: formData.workingDays.filter(d => d !== dateStr)
      })
    } else {
      setFormData({
        ...formData,
        workingDays: [...formData.workingDays, dateStr].sort()
      })
    }
  }

  const isSelected = (date: Date) => {
    return formData.workingDays.includes(formatDate(date))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // 지역 변경 핸들러
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    setSelectedDistrict('')
    setSelectedDong('')
    setFormData({
      ...formData,
      location: region
    })
  }

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district)
    setSelectedDong('')
    const location = `${selectedRegion} ${district}`
    setFormData({
      ...formData,
      location: location
    })
  }

  const handleDongChange = (dong: string) => {
    setSelectedDong(dong)
    const location = `${selectedRegion} ${selectedDistrict} ${dong}`
    setFormData({
      ...formData,
      location: location
    })
  }

  const handleRequirementChange = (requirement: string) => {
    if (requirement === '건너뛰기') {
      // 건너뛰기를 선택하면 모든 선택 해제
      setFormData({
        ...formData,
        requirements: [],
        otherRequirement: ''
      })
      return
    }

    const isOther = requirement === '기타(직접입력)'
    const currentRequirements = formData.requirements.filter(r => r !== '기타(직접입력)')
    
    if (formData.requirements.includes(requirement)) {
      // 이미 선택된 항목이면 제거
      setFormData({
        ...formData,
        requirements: currentRequirements.filter(r => r !== requirement),
        otherRequirement: isOther ? '' : formData.otherRequirement
      })
    } else {
      // 최대 5개까지 선택 가능
      if (currentRequirements.length >= 5 && !isOther) {
        alert('최대 5개까지 선택할 수 있습니다.')
        return
      }
      
      if (isOther) {
        setFormData({
          ...formData,
          requirements: [...currentRequirements, requirement],
          otherRequirement: ''
        })
      } else {
        // 다른 항목을 선택하면 건너뛰기는 자동으로 해제됨 (이미 빈 배열이므로)
        setFormData({
          ...formData,
          requirements: [...currentRequirements, requirement]
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!formData.title || !formData.category || !formData.company || !formData.location || !formData.description) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    
    // 근무 날짜 검증
    if (formData.workingDays.length === 0) {
      alert('근무 날짜를 최소 1일 이상 선택해주세요.')
      setShowCalendar(true)
      return
    }
    
    // 근무 시간 검증
    if (!formData.startTime || !formData.endTime) {
      alert('시작 시간과 종료 시간을 모두 입력해주세요.')
      return
    }
    
    if (formData.startTime >= formData.endTime) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }
    
    try {
      const employerId = localStorage.getItem('userId')
      if (!employerId) {
        alert('로그인이 필요합니다.')
        navigate('/login/employer')
        return
      }

      // 백엔드 API 호출
      const response = await fetch(`/api/employer/jobs/${employerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          company: formData.company,
          location: formData.location,
          description: formData.description,
          qualifications: formData.qualifications.filter(q => q.trim() !== ''),
          requirements: formData.requirements,
          otherRequirement: formData.otherRequirement,
          workingDays: formData.workingDays,
          startTime: formData.startTime,
          endTime: formData.endTime,
          salary: formData.salary,
          salaryType: formData.salaryType,
          deadline: formData.deadline || null,
          gender: formData.gender,
          age: formData.age,
          education: formData.education
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('일자리 공고가 등록되었습니다!')
        navigate('/employer/jobs')
      } else {
        alert(data.message || '공고 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('공고 등록 에러:', error)
      alert('공고 등록 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/employer/jobs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#666'
          }}
        >
          <ArrowLeft size={16} />
          뒤로가기
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList size={28} style={{ color: '#2196f3' }} />
          일자리 공고 등록
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} style={{ color: '#4caf50' }} />
            기본 정보
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                직무 제목 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 데이터 입력 전문가"
                required
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                직업 선택(카테고리) <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">직업 카테고리를 선택하세요</option>
                {jobCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/\./g, '·')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                회사명 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="회사명을 입력하세요"
                required
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                위치 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {/* 시/도 선택 */}
                <select
                  value={selectedRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">시/도 선택</option>
                  {Object.keys(regions).map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>

                {/* 구/군 선택 */}
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!selectedRegion}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: selectedRegion ? '#fff' : '#f5f5f5',
                    cursor: selectedRegion ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">구/군 선택</option>
                  {selectedRegion && regions[selectedRegion]?.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>

                {/* 동 선택 (선택사항) */}
                <select
                  value={selectedDong}
                  onChange={(e) => handleDongChange(e.target.value)}
                  disabled={!selectedDistrict || getDistricts(selectedRegion, selectedDistrict).length === 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: selectedDistrict && getDistricts(selectedRegion, selectedDistrict).length > 0 ? '#fff' : '#f5f5f5',
                    cursor: selectedDistrict && getDistricts(selectedRegion, selectedDistrict).length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">동 선택 (선택사항)</option>
                  {selectedDistrict && getDistricts(selectedRegion, selectedDistrict).map((dong) => (
                    <option key={dong} value={dong}>{dong}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </section>

        {/* 직무 설명 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: '#ff9800' }} />
            직무 설명
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              직무 설명 <span style={{ color: '#f44336' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="회사 소개 및 직무에 대한 상세한 설명을 입력하세요"
              required
              rows={6}
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
          </div>
        </section>

        {/* 필요 자격 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} style={{ color: '#9c27b0' }} />
            필요 자격
          </h2>
          
          {formData.qualifications.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange(index, e.target.value, 'qualifications')}
                placeholder="필요 자격을 입력하세요"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              {formData.qualifications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, 'qualifications')}
                  style={{
                    padding: '12px',
                    border: '1px solid #f44336',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    color: '#f44336',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => addArrayItem('qualifications')}
            style={{
              padding: '8px 16px',
              border: '1px dashed #2196f3',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#2196f3',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + 항목 추가
          </button>
        </section>

        {/* 지원 자격 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} style={{ color: '#00bcd4' }} />
            지원 자격
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                성별 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="무관">무관</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                연령 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="무관">무관</option>
                <option value="20대">20대</option>
                <option value="30대">30대</option>
                <option value="40대">40대</option>
                <option value="50대">50대</option>
                <option value="60대 이상">60대 이상</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                학력 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="무관">무관</option>
                <option value="고졸">고졸</option>
                <option value="대졸">대졸</option>
                <option value="석사">석사</option>
                <option value="박사">박사</option>
              </select>
            </div>
            <div>
              {/* 추가 자격 조건 영역 */}
            </div>
          </div>
        </section>

        {/* 구직자 준비물/능력 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} style={{ color: '#ff9800' }} />
            구직자가 준비해야 할 준비물이나 능력이 있다면 선택해주세요! (최대 5개)
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            필요 없다면 "건너뛰기"를 선택하세요.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {requirementOptions.map((option) => (
              <label
                key={option}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  border: formData.requirements.includes(option) ? '2px solid #2196f3' : '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: formData.requirements.includes(option) ? '#e3f2fd' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!formData.requirements.includes(option)) {
                    e.currentTarget.style.borderColor = '#2196f3'
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!formData.requirements.includes(option)) {
                    e.currentTarget.style.borderColor = '#e0e0e0'
                    e.currentTarget.style.backgroundColor = '#ffffff'
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.requirements.includes(option)}
                  onChange={() => handleRequirementChange(option)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', userSelect: 'none' }}>{option}</span>
              </label>
            ))}
            
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: formData.requirements.length === 0 ? '2px solid #4caf50' : '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: formData.requirements.length === 0 ? '#e8f5e9' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (formData.requirements.length > 0) {
                  e.currentTarget.style.borderColor = '#4caf50'
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                if (formData.requirements.length > 0) {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }
              }}
            >
              <input
                type="checkbox"
                checked={formData.requirements.length === 0}
                onChange={() => handleRequirementChange('건너뛰기')}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '14px', userSelect: 'none', color: '#4caf50', fontWeight: '500' }}>건너뛰기</span>
            </label>
          </div>

          {formData.requirements.includes('기타(직접입력)') && (
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                기타 내용 입력
              </label>
              <input
                type="text"
                value={formData.otherRequirement}
                onChange={(e) => setFormData({ ...formData, otherRequirement: e.target.value })}
                placeholder="기타 준비물이나 능력을 입력하세요"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          )}

          {formData.requirements.length > 0 && formData.requirements.length <= 5 && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
              선택된 항목: {formData.requirements.length}개 / 5개
            </p>
          )}
        </section>

        {/* 근무 시간 설정 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>근무 시간 설정</h2>
          
          {/* 근무 날짜 선택 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              근무 날짜 선택 <span style={{ color: '#f44336' }}>*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '16px',
                textAlign: 'left',
                marginBottom: '12px'
              }}
            >
              {formData.workingDays.length > 0 
                ? `${formData.workingDays.length}일 선택됨 (클릭하여 수정)`
                : '근무 날짜를 선택하세요'}
            </button>

            {showCalendar && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                padding: '20px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={prevMonth}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    ←
                  </button>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </h3>
                  <button
                    type="button"
                    onClick={nextMonth}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    →
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                  {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                    <div key={day} style={{
                      textAlign: 'center',
                      padding: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: day === '일' ? '#f44336' : day === '토' ? '#2196f3' : '#333'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    if (!date) {
                      return <div key={index} style={{ padding: '8px' }} />
                    }
                    const selected = isSelected(date)
                    const today = isToday(date)
                    const past = isPast(date)
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => !past && toggleWorkingDay(date)}
                        disabled={past}
                        style={{
                          padding: '8px',
                          border: selected ? '2px solid #2196f3' : '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: selected ? '#e3f2fd' : past ? '#f5f5f5' : '#ffffff',
                          cursor: past ? 'not-allowed' : 'pointer',
                          color: past ? '#999' : selected ? '#2196f3' : '#333',
                          fontSize: '14px',
                          fontWeight: today ? 'bold' : 'normal',
                          position: 'relative'
                        }}
                      >
                        {date.getDate()}
                        {today && (
                          <span style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#2196f3',
                            borderRadius: '50%'
                          }} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {formData.workingDays.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>선택된 날짜:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {formData.workingDays.map((dateStr) => {
                        const date = new Date(dateStr)
                        return (
                          <span
                            key={dateStr}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#e3f2fd',
                              color: '#2196f3',
                              borderRadius: '20px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {date.getMonth() + 1}/{date.getDate()}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  workingDays: formData.workingDays.filter(d => d !== dateStr)
                                })
                              }}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#2196f3',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 근무 시간 설정 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                시작 시간 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                종료 시간 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
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
        </section>

        {/* 급여 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>급여</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                급여 유형 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="salaryType"
                value={formData.salaryType}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="시급">시급</option>
                <option value="일급">일급</option>
                <option value="주급">주급</option>
                <option value="월급">월급</option>
                <option value="연봉">연봉</option>
                <option value="협의">협의</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                급여 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="예: 35,000원 - 45,000원 (경력에 따라 협의)"
                required
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
        </section>

        {/* 마감일 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>마감일</h2>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              지원 마감일
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
        </section>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button
            type="button"
            onClick={() => navigate('/employer/jobs')}
            style={{
              padding: '12px 24px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <X size={20} />
            취소
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#2196f3',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={20} />
            공고 등록
          </button>
        </div>
      </form>
    </div>
  )
}

export default JobPosting

