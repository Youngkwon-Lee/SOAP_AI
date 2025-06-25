import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import { Request, Response } from 'express';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

interface PatientInfo {
  name: string;
  age: string;
  gender: string;
  visitDate: string;
}

interface SoapNote {
  patientInfo: PatientInfo;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface GenerateSoapNoteParams {
  noteType: string;
  patientInfo: PatientInfo;
  shorthandNotes: string;
  language?: string;
  template?: string;
}

// HTTP 요청용 함수
export const soapNoteFunction = async (req: Request, res: Response) => {
  try {
    // POST 요청만 허용
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const params: GenerateSoapNoteParams = req.body;

    // 입력 데이터 검증
    if (!params.noteType || !params.patientInfo || !params.shorthandNotes) {
      res.status(400).json({ 
        error: '필수 매개변수가 누락되었습니다.',
        required: ['noteType', 'patientInfo', 'shorthandNotes']
      });
      return;
    }

    // OpenAI API 키 확인
    if (!functions.config().openai?.key && !process.env.OPENAI_API_KEY) {
      console.error('OpenAI API 키가 설정되지 않았습니다.');
      res.status(500).json({ 
        error: 'API 설정 오류가 발생했습니다. 관리자에게 문의하세요.' 
      });
      return;
    }

    const soapNote = await generateSoapNoteInternal(params);
    res.json(soapNote);

  } catch (error) {
    console.error('SOAP 노트 생성 오류:', error);
    
    if (error instanceof Error) {
      // OpenAI API 오류 처리
      if (error.message.includes('401')) {
        res.status(500).json({ error: 'API 인증 오류가 발생했습니다.' });
      } else if (error.message.includes('429')) {
        res.status(429).json({ error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' });
      } else if (error.message.includes('400')) {
        res.status(400).json({ error: '잘못된 요청입니다.' });
      } else {
        res.status(500).json({ error: 'SOAP 노트 생성 중 오류가 발생했습니다.' });
      }
    } else {
      res.status(500).json({ error: '알 수 없는 오류가 발생했습니다.' });
    }
  }
};

// Firebase Functions onCall용 함수 (인증 필요)
export const generateSoapNoteSecure = async (
  data: GenerateSoapNoteParams,
  context: functions.https.CallableContext
): Promise<SoapNote> => {
  try {
    // 요청 로깅 (개인정보 제외)
    console.log('SOAP 노트 생성 요청:', {
      userId: context.auth?.uid,
      noteType: data.noteType,
      hasTemplate: !!data.template,
      timestamp: new Date().toISOString()
    });

    const soapNote = await generateSoapNoteInternal(data);
    
    // 성공 로깅
    console.log('SOAP 노트 생성 성공:', {
      userId: context.auth?.uid,
      noteType: data.noteType,
      timestamp: new Date().toISOString()
    });

    return soapNote;

  } catch (error) {
    console.error('SOAP 노트 생성 오류:', {
      userId: context.auth?.uid,
      error: error,
      timestamp: new Date().toISOString()
    });

    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new functions.https.HttpsError('internal', 'API 인증 오류가 발생했습니다.');
      } else if (error.message.includes('429')) {
        throw new functions.https.HttpsError('resource-exhausted', 'API 요청 한도를 초과했습니다.');
      } else if (error.message.includes('400')) {
        throw new functions.https.HttpsError('invalid-argument', '잘못된 요청입니다.');
      }
    }
    
    throw new functions.https.HttpsError('internal', 'SOAP 노트 생성 중 오류가 발생했습니다.');
  }
};

// 실제 SOAP 노트 생성 로직
async function generateSoapNoteInternal(params: GenerateSoapNoteParams): Promise<SoapNote> {
  const { noteType, patientInfo, shorthandNotes, template } = params;

  // 프롬프트 생성
  const prompt = template 
    ? `다음은 SOAP 노트 템플릿과 환자와의 대화 내용입니다. 템플릿의 형식을 참고하여 SOAP 노트를 작성해주세요.

템플릿:
${template}

대화 내용:
${shorthandNotes}

노트 유형: ${noteType}
환자 정보:
- 이름: ${patientInfo.name}
- 나이: ${patientInfo.age}
- 성별: ${patientInfo.gender}
- 방문 날짜: ${patientInfo.visitDate}

주의사항:
- 제공된 템플릿의 형식과 구조를 최대한 따라주세요
- 대화에서 언급되지 않은 내용은 포함하지 마세요
- 추측이나 가정을 하지 마세요
- 의학 용어는 가능한 한글로 작성해주세요`
    : `다음은 환자와의 대화 내용입니다. 이 대화를 바탕으로 SOAP 노트를 작성해주세요.

대화 내용:
${shorthandNotes}

노트 유형: ${noteType}
환자 정보:
- 이름: ${patientInfo.name}
- 나이: ${patientInfo.age}
- 성별: ${patientInfo.gender}
- 방문 날짜: ${patientInfo.visitDate}

다음 형식으로 SOAP 노트를 작성해주세요:
1. Subjective: 환자가 직접 말한 증상과 불편사항만 포함
2. Objective: 실제 대화에서 언급된 객관적인 검사 결과나 관찰 사항만 포함
3. Assessment: 대화 내용에서 파악할 수 있는 문제점이나 진단만 포함
4. Plan: 대화에서 실제로 논의된 치료 계획이나 권장사항만 포함

주의사항:
- 대화에서 언급되지 않은 내용은 포함하지 마세요
- 추측이나 가정을 하지 마세요
- 의학 용어는 가능한 한글로 작성해주세요`;

  try {
    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const soapNoteText = completion.choices[0].message.content;
    
    if (!soapNoteText) {
      throw new Error('OpenAI에서 응답을 받지 못했습니다.');
    }

    // SOAP 노트 파싱
    const sections: Record<'subjective' | 'objective' | 'assessment' | 'plan', string> = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    };

    const lines = soapNoteText.split('\n');
    let currentSection: keyof typeof sections | null = null;

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
      patientInfo
    };

  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    throw error;
  }
} 