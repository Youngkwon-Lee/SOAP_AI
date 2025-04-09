import { SoapNote, PatientInfo } from '../types';

// 환경 변수 로딩 확인
console.log('환경 변수 확인:', {
  allEnvKeys: Object.keys(process.env),
  openaiKey: process.env.REACT_APP_OPENAI_API_KEY ? '설정됨' : '설정되지 않음',
  keyLength: process.env.REACT_APP_OPENAI_API_KEY?.length,
  keyPrefix: process.env.REACT_APP_OPENAI_API_KEY?.substring(0, 5)
});

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

interface GenerateSoapNoteParams {
  noteType: string;
  patientInfo: PatientInfo;
  shorthandNotes: string;
  language?: string;
  template?: string;
}

export const generateSoapNote = async (params: GenerateSoapNoteParams): Promise<SoapNote> => {
  try {
    // API 키 검증
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API 키가 없습니다:', {
        envKeys: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')),
        apiKeyLength: OPENAI_API_KEY?.length
      });
      throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일에 REACT_APP_OPENAI_API_KEY를 설정해주세요.');
    }

    if (!OPENAI_API_KEY.startsWith('sk-')) {
      console.error('잘못된 API 키 형식:', {
        keyPrefix: OPENAI_API_KEY.substring(0, 5),
        keyLength: OPENAI_API_KEY.length
      });
      throw new Error('유효하지 않은 OpenAI API 키 형식입니다. API 키는 "sk-"로 시작해야 합니다.');
    }

    console.log('환경 변수 확인:', {
      hasOpenAIKey: !!OPENAI_API_KEY,
      keyLength: OPENAI_API_KEY.length,
      keyStart: OPENAI_API_KEY.substring(0, 5)
    });

    const prompt = params.template 
      ? `다음은 SOAP 노트 템플릿과 환자와의 대화 내용입니다. 템플릿의 형식을 참고하여 SOAP 노트를 작성해주세요.

템플릿:
${params.template}

대화 내용:
${params.shorthandNotes}

노트 유형: ${params.noteType}
환자 정보:
- 이름: ${params.patientInfo.name}
- 나이: ${params.patientInfo.age}
- 성별: ${params.patientInfo.gender}
- 방문 날짜: ${params.patientInfo.visitDate}

주의사항:
- 제공된 템플릿의 형식과 구조를 최대한 따라주세요
- 대화에서 언급되지 않은 내용은 포함하지 마세요
- 추측이나 가정을 하지 마세요
- 의학 용어는 가능한 한글로 작성해주세요`
      : `다음은 환자와의 대화 내용입니다. 이 대화를 바탕으로 SOAP 노트를 작성해주세요.

대화 내용:
${params.shorthandNotes}

노트 유형: ${params.noteType}
환자 정보:
- 이름: ${params.patientInfo.name}
- 나이: ${params.patientInfo.age}
- 성별: ${params.patientInfo.gender}
- 방문 날짜: ${params.patientInfo.visitDate}

다음 형식으로 SOAP 노트를 작성해주세요:
1. Subjective: 환자가 직접 말한 증상과 불편사항만 포함
2. Objective: 실제 대화에서 언급된 객관적인 검사 결과나 관찰 사항만 포함
3. Assessment: 대화 내용에서 파악할 수 있는 문제점이나 진단만 포함
4. Plan: 대화에서 실제로 논의된 치료 계획이나 권장사항만 포함

주의사항:
- 대화에서 언급되지 않은 내용은 포함하지 마세요
- 추측이나 가정을 하지 마세요
- 의학 용어는 가능한 한글로 작성해주세요`;

    console.log('OpenAI API 요청 준비:', {
      model: 'gpt-3.5-turbo',
      promptLength: prompt.length,
      apiKeyPrefix: OPENAI_API_KEY.substring(0, 5) + '...',
      apiKeyLength: OPENAI_API_KEY.length
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Organization': '' // 조직 ID가 있다면 여기에 추가
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenAI API 응답 에러 상세:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        headers: Object.fromEntries(response.headers.entries()),
        requestHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY.substring(0, 10)}...`,
          'OpenAI-Organization': ''
        }
      });

      if (response.status === 401) {
        throw new Error(`OpenAI API 인증 실패: ${errorData?.error?.message || '알 수 없는 오류'}`);
      } else if (response.status === 429) {
        throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else if (response.status === 404) {
        throw new Error('요청한 API 엔드포인트를 찾을 수 없습니다.');
      } else if (response.status === 400) {
        throw new Error('잘못된 요청입니다: ' + (errorData?.error?.message || '알 수 없는 오류'));
      }
      
      throw new Error(`SOAP 노트 생성에 실패했습니다. (HTTP ${response.status})`);
    }

    const data = await response.json();
    console.log('OpenAI API 응답 성공:', {
      responseLength: data.choices[0].message.content.length,
      usage: data.usage
    });
    
    const soapNoteText = data.choices[0].message.content;

    // SOAP 노트 파싱
    type SectionKey = 'subjective' | 'objective' | 'assessment' | 'plan';
    const sections: Record<SectionKey, string> = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    };

    const lines = soapNoteText.split('\n');
    let currentSection: SectionKey | null = null;

    for (const line of lines) {
      if (line.toLowerCase().startsWith('subjective:')) {
        currentSection = 'subjective';
        sections.subjective = line.substring(11).trim();
      } else if (line.toLowerCase().startsWith('objective:')) {
        currentSection = 'objective';
        sections.objective = line.substring(10).trim();
      } else if (line.toLowerCase().startsWith('assessment:')) {
        currentSection = 'assessment';
        sections.assessment = line.substring(11).trim();
      } else if (line.toLowerCase().startsWith('plan:')) {
        currentSection = 'plan';
        sections.plan = line.substring(5).trim();
      } else if (line.trim() && currentSection) {
        sections[currentSection] += ' ' + line.trim();
      }
    }

    return {
      ...sections,
      patientInfo: params.patientInfo
    };

  } catch (error) {
    console.error('SOAP 노트 생성 중 오류:', error);
    throw error;
  }
};

const parseGeneratedText = (text: string, patientInfo: PatientInfo): SoapNote => {
  console.log('Parsing text:', text);

  // 섹션 시작 위치 찾기
  const subjectiveIndex = text.toLowerCase().indexOf('subjective:');
  const objectiveIndex = text.toLowerCase().indexOf('objective:');
  const assessmentIndex = text.toLowerCase().indexOf('assessment:');
  const planIndex = text.toLowerCase().indexOf('plan:');

  if (subjectiveIndex === -1 || objectiveIndex === -1 || assessmentIndex === -1 || planIndex === -1) {
    throw new Error('필수 SOAP 섹션이 누락되었습니다.');
  }

  // 각 섹션의 내용 추출
  const subjective = text.slice(subjectiveIndex + 'subjective:'.length, objectiveIndex).trim();
  const objective = text.slice(objectiveIndex + 'objective:'.length, assessmentIndex).trim();
  const assessment = text.slice(assessmentIndex + 'assessment:'.length, planIndex).trim();
  const plan = text.slice(planIndex + 'plan:'.length).trim();

  console.log('Parsed sections:', {
    subjective,
    objective,
    assessment,
    plan
  });

  // 모든 섹션이 비어있지 않은지 확인
  if (!subjective || !objective || !assessment || !plan) {
    throw new Error('하나 이상의 SOAP 섹션이 비어있습니다.');
  }

  return {
    patientInfo,
    subjective,
    objective,
    assessment,
    plan
  };
};

// 수정된 export 방식
const openaiService = {
  generateSoapNote
};

export default openaiService; 