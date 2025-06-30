import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import fewShotExamplesData from './fewShotExamples.json';

// Firebase Admin 초기화 (index.ts에서 이미 초기화되므로 여기서는 건너뜀)
// admin.initializeApp(); 

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
  specialty?: string;
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
  // 사용자 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      '이 기능을 사용하려면 로그인이 필요합니다.'
    );
  }
  const userId = context.auth.uid;

  try {
    // 요청 로깅 (개인정보 제외)
    console.log('SOAP 노트 생성 요청:', {
      userId: userId,
      noteType: data.noteType,
      hasTemplate: !!data.template,
      timestamp: new Date().toISOString()
    });

    const soapNote = await generateSoapNoteInternal(data, userId);
    
    // 성공 로깅
    console.log('SOAP 노트 생성 성공:', {
      userId: userId,
      noteType: data.noteType,
      timestamp: new Date().toISOString()
    });

    return soapNote;

  } catch (error) {
    console.error('SOAP 노트 생성 오류:', {
      userId: userId,
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
async function generateSoapNoteInternal(params: GenerateSoapNoteParams, userId?: string): Promise<SoapNote> {
  const { noteType, patientInfo, shorthandNotes, template, specialty } = params;

  const db = admin.firestore();

  // 사용자 맞춤형 Few-shot 예시 가져오기
  let userFewShotExamples = '';
  if (userId) {
    try {
      const userNotesSnapshot = await db.collection(`users/${userId}/soapNotes`)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      const userExamples = userNotesSnapshot.docs.map(doc => {
        const data = doc.data();
        // 사용자의 저장된 노트에서 input과 output을 구성하는 로직이 필요합니다.
        // 여기서는 간단하게 shorthandNotes를 input으로, 생성된 subjective, objective, assessment, plan을 output으로 가정합니다.
        const input = `환자 대화 내용:\n${data.shorthandNotes}`;
        const output = `Subjective: ${data.subjective}\nObjective: ${data.objective}\nAssessment: ${data.assessment}\nPlan: ${data.plan}`;
        return `--- 사용자 예시 ---\n${input}\n\nSOAP 노트:\n${output}\n`;
      }).join('');

      if (userExamples.length > 0) {
        userFewShotExamples = userExamples;
        console.log(`Loaded ${userNotesSnapshot.docs.length} user-specific few-shot examples for user ${userId}`);
      }
    } catch (error) {
      console.error('Error fetching user-specific few-shot examples:', error);
      // 사용자 예시를 가져오는 데 실패해도 기본 예시로 진행
    }
  }

  // 프롬프트 생성
  const getLanguageInstruction = (language?: string) => {
    if (language === 'en') {
      return '모든 내용은 반드시 영어로 작성해야 합니다.';
    } else if (language === 'medical') {
      return '모든 내용은 반드시 영어 의학 용어와 약어를 사용하여 간결하게 작성해야 합니다. (예: c/o, Pt, Dx, Tx, F/U, ROM, WNL 등)';
    } else {
      return '모든 내용은 반드시 한국어로 작성해야 합니다. 의학 용어는 가능한 한글로 작성해야 합니다.';
    }
  };

  // 사용자 맞춤형 예시가 있다면 그것을 사용하고, 없다면 과별 특화 예시를 사용
  const fewShotExamples = userFewShotExamples || getFewShotExamples(params.language, specialty);

  const prompt = template 
    ? `${getRolePrompt(noteType)}
${fewShotExamples}
다음은 SOAP 노트 템플릿과 환자와의 대화 내용입니다. 템플릿의 형식과 구조를 최대한 참고하여 SOAP 노트를 작성해주세요.

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

${getLanguageInstruction(params.language)}

주의사항:
- 대화에서 언급되지 않은 내용은 포함하지 마세요
- 추측이나 가정을 하지 마세요
- 환자 개인 식별 정보(이름, 주민번호 등)는 절대 포함하지 마세요.
- 각 섹션(Subjective, Objective, Assessment, Plan)을 명확히 구분하여 작성해주세요.`
    : `${getRolePrompt(noteType)}
${fewShotExamples}
다음은 환자와의 대화 내용입니다. 이 대화를 바탕으로 SOAP 노트를 작성해주세요.

대화 내용:
${shorthandNotes}

노트 유형: ${noteType}
환자 정보:
- 이름: ${patientInfo.name}
- 나이: ${patientInfo.age}
- 성별: ${patientInfo.gender}
- 방문 날짜: ${patientInfo.visitDate}

${getLanguageInstruction(params.language)}

다음 형식으로 SOAP 노트를 작성해주세요:
1. Subjective: 환자가 직접 말한 증상, 불편사항, 병력, 사회력 등 주관적인 정보만 포함
2. Objective: 신체 검진 소견, 검사 결과, 바이탈 사인 등 객관적인 관찰 및 측정 가능한 정보만 포함
3. Assessment: 주관적/객관적 정보를 바탕으로 한 문제점 분석, 진단, 감별 진단 등 평가 내용만 포함
4. Plan: 진단에 따른 치료 계획, 처방, 교육, 추후 관리 등 계획 내용만 포함

주의사항:
- 대화에서 언급되지 않은 내용은 포함하지 마세요
- 추측이나 가정을 하지 마세요
- 환자 개인 식별 정보(이름, 주민번호 등)는 절대 포함하지 마세요.
- 각 섹션(Subjective, Objective, Assessment, Plan)을 명확히 구분하여 작성해주세요.`}

  try {
    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `당신은 숙련된 의료 기록 전문가입니다. 다음은 몇 가지 SOAP 노트 작성 예시입니다. 이 예시들을 참고하여 환자의 대화 내용을 바탕으로 정확하고 간결한 SOAP 노트를 작성해주세요.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    console.log('OpenAI API 응답:', completion.choices[0].message.content);

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

    const finalSoapNote = {
      ...sections,
      patientInfo
    };

    console.log('최종 SOAP 노트 객체:', finalSoapNote);

    return finalSoapNote;

  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    throw error;
  }
} 