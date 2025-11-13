import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, DollarSign, Bookmark, ArrowRight, BookmarkCheck, ChevronDown } from 'lucide-react'
import { apiCall } from '../utils/api'

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

// 구/군별 동 데이터 (주요 구만 포함)
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
  // 부산 구의 동
  '부산 강서구': ['전체', '가락동', '강동동', '녹산동', '대저동', '명지동', '봉림동', '식만동', '신호동', '지사동', '천가동'],
  '부산 금정구': ['전체', '구서동', '금사동', '남산동', '노포동', '두구동', '부곡동', '서동', '선동', '오륜동', '장전동', '청룡동', '회동동'],
  '부산 남구': ['전체', '감만동', '대연동', '문현동', '용당동', '용호동', '우암동', '이기동'],
  '부산 동구': ['전체', '범일동', '수정동', '초량동'],
  '부산 동래구': ['전체', '낙민동', '명륜동', '명장동', '미남동', '사직동', '수안동', '안락동', '온천동', '칠산동', '복천동', '명장동'],
  '부산 부산진구': ['전체', '가야동', '개금동', '당감동', '범천동', '범전동', '부암동', '부전동', '양정동', '연지동', '전포동', '초읍동', '초장동'],
  '부산 북구': ['전체', '구포동', '금곡동', '덕천동', '만덕동', '화명동'],
  '부산 사상구': ['전체', '감전동', '괘법동', '덕포동', '모라동', '삼락동', '엄궁동', '주례동', '학장동'],
  '부산 사하구': ['전체', '감천동', '괴정동', '다대동', '당리동', '구평동', '신평동', '장림동', '하단동'],
  '부산 서구': ['전체', '남부민동', '동대신동', '부용동', '서대신동', '아미동', '암남동', '초장동', '충무동', '토성동'],
  '부산 수영구': ['전체', '광안동', '남천동', '망미동', '민락동', '수영동', '재송동'],
  '부산 연제구': ['전체', '거제동', '연산동'],
  '부산 영도구': ['전체', '남항동', '대교동', '대평동', '동삼동', '봉래동', '신선동', '영선동', '청학동', '태종동'],
  '부산 중구': ['전체', '광복동', '남포동', '대청동', '동광동', '보수동', '부평동', '영주동', '중앙동', '창선동'],
  '부산 해운대구': ['전체', '반송동', '반여동', '송정동', '우동', '재송동', '좌동', '중동'],
  // 대구 구의 동
  '대구 남구': ['전체', '대명동', '봉덕동', '이천동', '용산동', '월성동'],
  '대구 달서구': ['전체', '감삼동', '대곡동', '도원동', '본동', '상인동', '성당동', '용산동', '월성동', '이곡동', '장기동', '죽전동', '진천동', '호산동'],
  '대구 동구': ['전체', '각산동', '검사동', '괴전동', '능성동', '도동', '봉무동', '불로동', '사복동', '신기동', '신무동', '신서동', '용계동', '율하동', '입석동', '지저동', '진인동', '해안동', '효목동'],
  '대구 북구': ['전체', '검단동', '고성동', '관음동', '구암동', '국우동', '노원동', '대신동', '동변동', '동호동', '매천동', '복현동', '사수동', '산격동', '서변동', '연경동', '읍내동', '조야동', '칠성동', '태전동', '팔달동', '학정동', '황오동'],
  '대구 서구': ['전체', '내당동', '비산동', '상중이동', '원대동', '이현동', '중리동', '평리동', '하중이동'],
  '대구 수성구': ['전체', '고모동', '노변동', '대흥동', '동대구동', '만촌동', '범어동', '사월동', '삼덕동', '상동', '수성동', '시지동', '신매동', '욱수동', '지산동', '황금동'],
  '대구 중구': ['전체', '계산동', '교동', '남산동', '대신동', '대안동', '덕산동', '동문동', '동성로', '동인동', '삼덕동', '서문로', '서성로', '수동', '수창동', '시장북로', '완전동', '용덕동', '인교동', '장관동', '전동', '종로', '중앙대로', '태평로', '포정동', '하서동', '향촌동', '화전동'],
  // 인천 구의 동
  '인천 계양구': ['전체', '계산동', '귤현동', '동양동', '박촌동', '병방동', '상야동', '서운동', '용종동', '임학동', '작전동', '효성동'],
  '인천 미추홀구': ['전체', '관교동', '도화동', '문학동', '용현동', '주안동', '학익동'],
  '인천 남동구': ['전체', '간석동', '고잔동', '구월동', '논현동', '도림동', '만수동', '서창동', '수산동', '장수동', '청천동'],
  '인천 동구': ['전체', '금곡동', '만석동', '송림동', '송현동', '용동', '창영동', '화수동', '화평동'],
  '인천 부평구': ['전체', '갈산동', '구산동', '부개동', '부평동', '산곡동', '십정동', '일신동', '청천동'],
  '인천 서구': ['전체', '가정동', '가좌동', '검단동', '경서동', '공촌동', '금곡동', '당하동', '마전동', '백석동', '불로동', '석남동', '시천동', '신현동', '원당동', '원창동', '연희동', '오류동', '왕길동', '용현동', '이동', '인현동', '청라동', '평동', '학익동', '환곡동'],
  '인천 연수구': ['전체', '동춘동', '송도동', '연수동', '옥련동', '인천동', '청학동'],
  '인천 중구': ['전체', '경동', '관동', '내동', '남동', '답동', '덕교동', '도원동', '무의동', '북성동', '북인천동', '사동', '선린동', '송월동', '신생동', '신포동', '용동', '운남동', '운북동', '운서동', '율목동', '을왕동', '인현동', '전동', '중산동', '중앙동', '항동', '해안동', '행동', '홍예동'],
  // 광주 구의 동
  '광주 광산구': ['전체', '도산동', '도호동', '동림동', '본량동', '비아동', '산정동', '선동', '수완동', '신가동', '신창동', '신촌동', '어룡동', '오산동', '용동', '용봉동', '우산동', '운남동', '월곡동', '월계동', '임곡동', '장덕동', '지산동', '첨단동', '평동', '하남동', '하산동', '황룡동'],
  '광주 남구': ['전체', '구동', '노대동', '대지동', '덕남동', '방림동', '봉선동', '사동', '서동', '송하동', '양림동', '월산동', '이장동', '주월동', '지석동', '진월동', '행동', '화장동'],
  '광주 동구': ['전체', '계림동', '금남로', '금동', '내남동', '대인동', '동명동', '불로동', '산수동', '서석동', '소태동', '수기동', '용산동', '용연동', '운림동', '장동', '지산동', '충장로', '필문동', '학동', '호남동'],
  '광주 북구': ['전체', '각화동', '건국동', '금곡동', '누문동', '대촌동', '두암동', '매곡동', '문흥동', '본촌동', '삼각동', '생용동', '신안동', '신용동', '양산동', '연제동', '오룡동', '용봉동', '용전동', '운암동', '일곡동', '임동', '장등동', '중흥동', '지야동', '청풍동', '충효동', '풍향동', '화정동'],
  '광주 서구': ['전체', '광천동', '금호동', '내방동', '농성동', '덕흥동', '마륵동', '매월동', '벽진동', '비아동', '상무동', '세하동', '쌍촌동', '양동', '용두동', '유촌동', '치평동', '풍암동', '화정동'],
  // 대전 구의 동
  '대전 대덕구': ['전체', '갈전동', '대화동', '덕암동', '목상동', '미호동', '비래동', '석봉동', '송촌동', '신대동', '신탄진동', '오정동', '와동', '용호동', '이현동', '장동', '중리동', '평촌동', '황호동'],
  '대전 동구': ['전체', '가양동', '가오동', '갑동', '대별동', '대성동', '마산동', '비룡동', '사성동', '삼성동', '상소동', '소제동', '신인동', '용운동', '용전동', '이사동', '자양동', '장동', '정동', '주산동', '주촌동', '중동', '직동', '천동', '판암동', '하소동', '홍도동', '효동', '효평동'],
  '대전 서구': ['전체', '가수원동', '갈마동', '관저동', '괴정동', '내동', '도마동', '도안동', '둔산동', '만년동', '매노동', '변동', '봉서동', '복수동', '용문동', '우명동', '원정동', '월평동', '장안동', '정림동', '진잠동', '탄방동', '평촌동', '흑석동'],
  '대전 유성구': ['전체', '갑동', '관평동', '구암동', '궁동', '노은동', '대정동', '덕명동', '도룡동', '봉명동', '상대동', '성북동', '신성동', '어은동', '원신흥동', '자운동', '장대동', '전민동', '지족동', '하기동', '학하동', '화암동'],
  '대전 중구': ['전체', '대사동', '대흥동', '목동', '문창동', '부사동', '산성동', '석교동', '선화동', '안영동', '어남동', '오류동', '용두동', '유천동', '은행동', '인동', '정생동', '중촌동', '침산동', '태평동', '호동'],
  // 울산 구의 동
  '울산 남구': ['전체', '달동', '대현동', '무거동', '삼산동', '상개동', '선암동', '신정동', '야음동', '여천동', '옥동', '용연동', '용잠동', '장생포동', '주전동', '지anden동', '화암동'],
  '울산 동구': ['전체', '대송동', '방어동', '서부동', '일산동', '전하동', '화정동'],
  '울산 북구': ['전체', '강동동', '구유동', '달천동', '당사동', '매곡동', '무룡동', '상안동', '송정동', '신천동', '어물동', '연암동', '염포동', '여천동', '이천동', '진장동', '창평동', '천곡동', '화봉동', '효문동'],
  '울산 중구': ['전체', '교동', '남외동', '다운동', '동동', '반구동', '복산동', '성안동', '성안동', '약사동', '옥교동', '우정동', '유곡동', '태화동', '학성동', '학산동'],
  // 경기도 주요 도시의 동 (시 단위는 동이 많으므로 주요 동만)
  '경기 성남시': ['전체', '금광동', '단대동', '복정동', '산성동', '수진동', '신촌동', '야탑동', '양지동', '은행동', '이매동', '정자동', '판교동', '하대원동', '하산운동'],
  '경기 수원시': ['전체', '고등동', '곡반정동', '구운동', '권선동', '금곡동', '기산동', '매교동', '매산동', '매탄동', '영동', '영통동', '원천동', '이의동', '인계동', '장안동', '정자동', '조원동', '천천동', '팔달동', '하동', '호매실동'],
  '경기 고양시': ['전체', '고양동', '관산동', '대자동', '덕이동', '마두동', '백석동', '삼송동', '성사동', '식사동', '신원동', '원당동', '주교동', '지축동', '행신동', '행주동', '화정동'],
  '경기 용인시': ['전체', '고림동', '구갈동', '기흥동', '동백동', '마북동', '모현동', '보라동', '상하동', '서천동', '신갈동', '언남동', '영덕동', '죽전동', '지곡동', '포곡동', '해곡동', '호동'],
  '경기 부천시': ['전체', '고강동', '괴안동', '내동', '대야동', '도당동', '범박동', '삼정동', '상동', '소사동', '송내동', '심곡동', '역곡동', '옥길동', '원미동', '작동', '중동', '춘의동'],
  '경기 안산시': ['전체', '고잔동', '공단동', '광덕동', '대부동', '대야동', '목내동', '부곡동', '사동', '상록수동', '선부동', '성곡동', '신길동', '와동', '원곡동', '월피동', '이동', '초지동', '팔곡동', '화정동'],
  '경기 안양시': ['전체', '갈산동', '관양동', '귀인동', '달안동', '범계동', '비산동', '석수동', '신촌동', '안양동', '인덕원동', '평촌동', '호계동'],
  '경기 평택시': ['전체', '가재동', '고덕동', '군문동', '도일동', '동삭동', '비전동', '서정동', '서탄동', '송탄동', '신장동', '용이동', '이충동', '장당동', '장안동', '죽백동', '청룡동', '통복동', '팽성동', '평택동', '합정동', '현덕동'],
  '경기 시흥시': ['전체', '거모동', '계수동', '과림동', '광석동', '군자동', '능곡동', '대야동', '매화동', '목감동', '무지내동', '미산동', '방산동', '배곧동', '산현동', '신현동', '신천동', '연성동', '월곶동', '은행동', '장곡동', '장현동', '정왕동', '조남동', '죽율동', '포동', '하중동', '화정동'],
  '경기 김포시': ['전체', '감정동', '걸포동', '고촌동', '구래동', '마산동', '사우동', '양촌동', '운양동', '월곶동', '장기동', '풍무동', '하성동'],
  '경기 화성시': ['전체', '기산동', '남양동', '능동', '동탄동', '마도동', '매송동', '목동', '반월동', '봉담동', '비봉동', '새솔동', '송산동', '송림동', '신동', '양감동', '영천동', '우정동', '장안동', '정남동', '진안동', '팔탄동', '향남동', '화산동'],
  '경기 광명시': ['전체', '가학동', '광명동', '노온사동', '소하동', '옥길동', '일직동', '철산동', '하안동'],
  '경기 이천시': ['전체', '관고동', '관동', '대월동', '대포동', '마장동', '부발동', '사음동', '설성동', '신둔동', '율면동', '장호원동', '증포동', '창전동', '호법동'],
  '경기 오산시': ['전체', '가수동', '가장동', '갈곶동', '고현동', '궐동', '내삼미동', '누읍동', '두교동', '벌음동', '부산동', '세교동', '수청동', '오산동', '원동', '은계동', '지곶동', '청학동', '탑동', '화산동'],
  '경기 의정부시': ['전체', '가능동', '금오동', '낙양동', '녹양동', '민락동', '의정부동', '장암동', '장현동', '호원동'],
  '경기 하남시': ['전체', '감이동', '감북동', '광암동', '교산동', '덕풍동', '망월동', '미사동', '선동', '신장동', '위례동', '창우동', '천현동', '춘궁동', '하산곡동', '학암동', '항동'],
  '경기 구리시': ['전체', '갈매동', '교문동', '동구동', '사노동', '수택동', '인창동', '토평동'],
  '경기 남양주시': ['전체', '금곡동', '다산동', '도농동', '별내동', '삼패동', '수동면', '오남동', '와부동', '이패동', '진건동', '진접동', '퇴계원동', '평내동', '호평동', '화도동'],
  '경기 파주시': ['전체', '검산동', '광탄면', '교하동', '금촌동', '문산동', '법원동', '운정동', '적성면', '조리동', '진동면', '진서면', '탄현면', '파주동', '파평면'],
  '경기 의왕시': ['전체', '고천동', '내손동', '삼동', '오전동', '왕곡동', '이동', '청계동', '초평동', '포일동', '학의동'],
  '경기 양주시': ['전체', '고암동', '광사동', '남면', '덕계동', '덕정동', '마전동', '백석동', '봉양동', '옥정동', '은현면', '장흥면', '주내동', '회암동'],
  '경기 여주시': ['전체', '가남면', '강천면', '금사면', '능서면', '대신면', '북내면', '산북면', '세종대왕면', '점동면', '흥천면'],
  '경기 양평군': ['전체', '강상면', '강하면', '개군면', '단월면', '서종면', '양동면', '양서면', '옥천면', '용문면', '지평면', '청운면'],
  '경기 가평군': ['전체', '가평읍', '상면', '설악면', '조종면', '청평면', '하면'],
  '경기 연천군': ['전체', '군남면', '미산면', '백학면', '신서면', '연천읍', '왕징면', '장남면', '전곡읍', '중면', '청산면'],
  '경기 포천시': ['전체', '가산면', '관인면', '내촌면', '선단동', '소흘읍', '신북면', '영중면', '영북면', '이동면', '일동면', '창수면', '화현면'],
  '경기 동두천시': ['전체', '걸산동', '광암동', '동두천동', '보산동', '상봉암동', '상패동', '생연동', '송내동', '안흥동', '지행동', '탑동동', '하봉암동'],
  '경기 안성시': ['전체', '가사동', '고삼면', '공도읍', '구포동', '금광면', '대덕면', '미양면', '보개면', '삼죽면', '서운면', '양성면', '원곡면', '일죽면', '죽산면', '진사면', '평택동', '현수동'],
  '경기 광주시': ['전체', '경안동', '곤지암읍', '남종면', '도척면', '목동', '삼동', '송정동', '쌍령동', '오포면', '초월읍', '탄벌동', '퇴촌면'],
  // 기타 시/군은 동 데이터가 없으면 동 선택 드롭다운이 표시되지 않음
}

// 구/군이 선택되지 않았거나 해당 구의 동 데이터가 없을 때
const getDistricts = (region: string, district: string): string[] => {
  if (district === '전체') {
    return ['전체']
  }
  // 시/도와 구를 함께 키로 사용하여 중복 방지
  const key = `${region} ${district}`
  if (!districts[key]) {
    return ['전체']
  }
  return districts[key] || ['전체']
}

function JobSearch() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [savedJobIds, setSavedJobIds] = useState<number[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedRegion, setSelectedRegion] = useState('전체')
  const [selectedDistrict, setSelectedDistrict] = useState('전체')
  const [selectedDong, setSelectedDong] = useState('전체')
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showDongDropdown, setShowDongDropdown] = useState(false)

  // localStorage에서 저장된 일자리 ID 목록 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('savedJobs')
    if (saved) {
      setSavedJobIds(JSON.parse(saved))
    }
  }, [])

  // 백엔드에서 활성 공고 불러오기
  useEffect(() => {
    const fetchActiveJobs = async () => {
      try {
        console.log('🔍 Fetching active jobs from backend')
        const response = await fetch('/api/jobs/active')
        
        if (response.ok) {
          const activeJobs = await response.json()
          console.log('✅ Active jobs fetched:', activeJobs)
          console.log('📋 First job category:', activeJobs[0]?.category)
          
          // 백엔드 데이터를 JobSearch 형식으로 변환
          const convertedJobs = activeJobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            category: job.category || '',
            company: job.company || '',
            location: job.location || '',
            salary: job.salaryType && job.salary ? `${job.salaryType} ${job.salary}` : job.salary || '협의',
            description: job.description || '',
            type: '파트타임', // 기본값
            posted: job.postedDate ? getDaysAgo(job.postedDate) : '최근',
            gender: job.gender || '무관',
            age: job.age || '무관',
            education: job.education || '무관'
          }))
          
          console.log('🔄 Converted jobs:', convertedJobs)
          console.log('📋 First converted job category:', convertedJobs[0]?.category)
          setJobs(convertedJobs)
        } else {
          console.error('❌ Failed to fetch active jobs:', response.status)
          setJobs([])
        }
      } catch (error) {
        console.error('❌ Error fetching active jobs:', error)
        setJobs([])
      }
    }

    fetchActiveJobs()
  }, [])

  // 지역 변경 시 구/군과 동을 '전체'로 리셋
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    setSelectedDistrict('전체')
    setSelectedDong('전체')
    setShowRegionDropdown(false)
  }

  // 구/군 변경 시 동을 '전체'로 리셋
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district)
    setSelectedDong('전체')
    setShowDistrictDropdown(false)
  }

  const handleDongChange = (dong: string) => {
    setSelectedDong(dong)
    setShowDongDropdown(false)
  }

  // 일자리 저장/저장 해제
  const handleSaveJob = async (jobId: number) => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      if (savedJobIds.includes(jobId)) {
        // 이미 저장된 경우 제거
        console.log('🗑️ 저장 해제 API 호출:', `/api/jobseeker/saved-jobs/${userId}/${jobId}`)
        await apiCall(`/api/jobseeker/saved-jobs/${userId}/${jobId}`, { method: 'DELETE' })
        const updatedSavedJobs = savedJobIds.filter(id => id !== jobId)
        setSavedJobIds(updatedSavedJobs)
        localStorage.setItem('savedJobs', JSON.stringify(updatedSavedJobs))
        alert('저장이 해제되었습니다.')
      } else {
        // 저장
        console.log('💾 저장 API 호출:', `/api/jobseeker/saved-jobs/${userId}/${jobId}`)
        await apiCall(`/api/jobseeker/saved-jobs/${userId}/${jobId}`, { method: 'POST' })
        const updatedSavedJobs = [...savedJobIds, jobId]
        setSavedJobIds(updatedSavedJobs)
        localStorage.setItem('savedJobs', JSON.stringify(updatedSavedJobs))
        alert('일자리가 저장되었습니다.')
      }
    } catch (error) {
      console.error('❌ 저장 처리 실패:', error)
      alert('저장 처리에 실패했습니다.')
    }
  }

  // 필터링된 일자리
  const filteredJobs = jobs.filter(job => {
    // 검색어 필터링
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    // 지역 필터링
    let matchesLocation = true
    if (selectedRegion !== '전체') {
      if (selectedDistrict === '전체') {
        matchesLocation = job.location.includes(selectedRegion)
      } else if (selectedDong === '전체') {
        matchesLocation = job.location.includes(selectedDistrict)
      } else {
        matchesLocation = job.location.includes(selectedDong)
      }
    }
    
    return matchesSearch && matchesLocation
  })

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-dropdown]')) {
        setShowRegionDropdown(false)
        setShowDistrictDropdown(false)
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

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>구직 검색</h1>
      
      {/* 주소 필터 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>근무하고 싶은 지역을 선택하세요</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* 시/도 선택 */}
          <div style={{ position: 'relative', flex: 1 }} data-dropdown>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowRegionDropdown(!showRegionDropdown)
                setShowDistrictDropdown(false)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
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
              <span>{selectedRegion}</span>
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
                      handleRegionChange(region)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: selectedRegion === region ? '#e3f2fd' : '#ffffff',
                      color: selectedRegion === region ? '#2196f3' : '#333',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedRegion !== region) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedRegion !== region) {
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
          <div style={{ position: 'relative', flex: 1 }} data-dropdown>
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
                padding: '12px 16px',
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
              <span>{selectedDistrict}</span>
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
                {regions[selectedRegion]?.map((district) => (
                  <button
                    key={district}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDistrictChange(district)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: selectedDistrict === district ? '#e3f2fd' : '#ffffff',
                      color: selectedDistrict === district ? '#2196f3' : '#333',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDistrict !== district) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDistrict !== district) {
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

          {/* 동 선택 */}
          {selectedDistrict !== '전체' && getDistricts(selectedRegion, selectedDistrict).length > 1 && (
            <div style={{ position: 'relative', flex: 1 }} data-dropdown>
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
                  padding: '12px 16px',
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
                <span>{selectedDong}</span>
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
                  {getDistricts(selectedRegion, selectedDistrict).map((dong) => (
                    <button
                      key={dong}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDongChange(dong)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: selectedDong === dong ? '#e3f2fd' : '#ffffff',
                        color: selectedDong === dong ? '#2196f3' : '#333',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedDong !== dong) {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedDong !== dong) {
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
      
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="구직 제목, 기술 또는 회사 입력"
          style={{
            width: '100%',
            padding: '12px 16px 12px 48px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '16px'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ color: '#666', fontSize: '16px' }}>총 {filteredJobs.length}개의 일자리</div>
        <select style={{
          padding: '8px 16px',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <option>정렬: 추천순</option>
          <option>최신순</option>
          <option>급여순</option>
        </select>
      </div>

      <main>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredJobs.length === 0 ? (
              <div style={{
                padding: '48px',
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <Search size={48} color="#999" style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>검색 결과가 없습니다</p>
                <p style={{ fontSize: '14px', color: '#999' }}>다른 검색어나 지역을 선택해보세요.</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
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
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{job.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{job.company}</p>
                      {job.category && (
                        <>
                          <span style={{ color: '#e0e0e0' }}>|</span>
                          <span style={{ 
                            color: '#2196f3', 
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>
                            {job.category}
                          </span>
                        </>
                      )}
                    </div>
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
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                      <span>성별: <strong style={{ color: '#555' }}>{job.gender || '무관'}</strong></span>
                      <span>연령: <strong style={{ color: '#555' }}>{job.age || '무관'}</strong></span>
                      <span>학력: <strong style={{ color: '#555' }}>{job.education || '무관'}</strong></span>
                    </div>
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
                    onClick={() => handleSaveJob(job.id)}
                    style={{
                      padding: '8px 16px',
                      border: savedJobIds.includes(job.id) ? '1px solid #2196f3' : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      backgroundColor: savedJobIds.includes(job.id) ? '#e3f2fd' : '#ffffff',
                      color: savedJobIds.includes(job.id) ? '#2196f3' : '#333',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {savedJobIds.includes(job.id) ? (
                      <>
                        <BookmarkCheck size={16} />
                        저장됨
                      </>
                    ) : (
                      <>
                        <Bookmark size={16} />
                        저장
                      </>
                    )}
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
                      gap: '4px'
                    }}
                  >
                    상세보기
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
      </main>
    </div>
  )
}

export default JobSearch

