import { PatientInfo } from '../types/note';

// Firebase Functions 호출용 인터페이스
interface GenerateSoapNoteParams {
  noteType: string;
  patientInfo: PatientInfo;
  shorthandNotes: string;
  language?: string;
  template?: string;
}

interface SoapNote {
  patientInfo: PatientInfo;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * SOAP 노트 생성 (테스트 모드 - Mock 함수)
 */
export const generateSoapNote = async (params: GenerateSoapNoteParams): Promise<SoapNote> => {
  try {
    console.log('🧪 SOAP 노트 생성 시작 (테스트 모드):', {
      noteType: params.noteType,
      hasTemplate: !!params.template,
      shorthandNotesLength: params.shorthandNotes.length
    });

    // 테스트 모드: Mock 데이터 생성
    console.log('⚠️ 테스트 모드: Mock SOAP 노트를 생성합니다');
    
    // 2초 지연 (실제 AI 처리 시간 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 입력 데이터 기반 Mock SOAP 노트 생성
    const mockSoapNote: SoapNote = {
      patientInfo: params.patientInfo,
      subjective: `환자 ${params.patientInfo.name}(${params.patientInfo.age}세, ${params.patientInfo.gender === 'male' ? '남성' : '여성'})는 다음의 증상을 호소하였습니다:

${params.shorthandNotes}

통증의 시작 시기와 양상, 악화/완화 요인에 대해 자세히 설명하였으며, 일상생활에서의 제약사항과 불편함을 구체적으로 표현했습니다. 환자는 현재 증상으로 인해 업무 및 일상 활동에 제한이 있다고 보고했습니다.`,
      
      objective: `${params.patientInfo.visitDate} 신체 검사 소견:

• 시진: 자세 및 보행 패턴 관찰, 명백한 비대칭성 확인
• 촉진: 주요 부위 압통 및 근긴장도 증가 확인
• 관절 가동범위(ROM): 능동/수동 ROM 모두 제한, 정상 범위의 약 70-80% 수준
• 근력 검사: Manual Muscle Test 결과 Grade 4/5 (약간의 약화 소견)
• 특수 검사: ${params.noteType} 관련 특수 검사에서 양성 소견
• 기능적 움직임 평가: 제한적 수행 능력, 보상 움직임 관찰
• 통증 척도(VAS): 휴식 시 4/10, 활동 시 7/10`,
      
      assessment: `${params.noteType} 관련 진단 및 평가:

🔍 주요 진단:
- ${params.noteType} 관련 기능 장애
- 급성/아급성 통증 증후군  
- 관절 가동성 제한 및 근력 약화
- 기능적 움직임 패턴 이상

📊 현재 상태:
- 통증 수준: 중등도 (VAS 7/10)
- 기능 수준: 제한적 (일상생활 70% 수준)
- 작업 능력: 부분적 제한

🎯 치료 목표:
1. 통증 완화 및 염증 감소
2. 관절 가동성 및 근력 회복
3. 기능적 움직임 정상화
4. 일상생활 및 작업 복귀

📈 예후: 적절한 치료 프로그램 적용 시 양호한 회복 예상`,
      
      plan: `${params.noteType} 종합 치료 계획:

🏥 1단계: 급성기 관리 (1-2주)
   - 통증 및 염증 완화 치료
   - 조직 보호 및 치유 환경 조성
   - 부종 관리 및 근경직 완화
   - 기본적 일상생활 동작 교육

🔄 2단계: 회복기 치료 (3-4주)
   - 관절 가동성 점진적 개선
   - 근력 강화 프로그램 시작 (저강도)
   - 기능적 움직임 재교육
   - 자세 교정 및 신체 인식 훈련

💪 3단계: 강화기 치료 (5-6주)
   - 고강도 기능적 훈련
   - 작업/스포츠 특이적 움직임 훈련
   - 지구력 및 협응성 개선
   - 재발 방지 전략 교육

📋 치료 세부사항:
• 치료 빈도: 주 3회 (월, 수, 금)
• 세션 시간: 60분/회
• 총 치료 기간: 6-8주 예정
• 홈 프로그램: 매일 30분 자가 운동

📅 평가 일정:
• 초기 평가: 완료
• 중간 평가: 2주 후 (${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]})
• 최종 평가: 6주 후 치료 완료 시
• 추적 관찰: 치료 완료 1개월 후

⚠️ 주의사항 및 금기:
- 급성 통증 악화 시 즉시 중단
- 과도한 활동 및 무리한 동작 금지
- 정기적 진행 상황 모니터링 필요`
    };

    console.log('✅ Mock SOAP 노트 생성 완료');
    return mockSoapNote;

  } catch (error) {
    console.error('Mock SOAP 노트 생성 오류:', error);
    throw error;
  }
}; 