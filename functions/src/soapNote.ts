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
  const getLanguageInstruction = (language?: string) => {
    if (language === 'en') {
      return '모든 내용은 반드시 영어로 작성해야 합니다.';
    } else if (language === 'medical') {
      return '모든 내용은 반드시 영어 의학 용어와 약어를 사용하여 간결하게 작성해야 합니다. (예: c/o, Pt, Dx, Tx, F/U, ROM, WNL 등)';
    } else {
      return '모든 내용은 반드시 한국어로 작성해야 합니다. 의학 용어는 가능한 한글로 작성해야 합니다.';
    }
  };

  const getFewShotExamples = (language?: string) => {
    const examples = [
      {
        input: '환자: 어제부터 열이 나고 목이 아파요. 기침도 좀 나고 몸살 기운이 있어요.\n의사: 체온은 38.5도이고, 목 안이 좀 부어있네요. 인후통과 기침이 주 증상이고, 독감 검사는 음성입니다.',
        output_ko: 'Subjective: 환자 어제부터 발열, 인후통, 기침, 몸살 호소.\nObjective: T 38.5°C. 인두 발적. 기침 있음. 독감 검사 음성.\nAssessment: 급성 인두염. 바이러스 감염 의심.\nPlan: 대증 치료. 휴식, 수분 섭취. 일반 진통제. 필요시 추적 관찰.',
        output_en: 'Subjective: Pt c/o fever (onset yesterday), sore throat, cough, body aches.\nObjective: T 38.5°C. Pharyngeal erythema. Cough present. Flu test negative.\nAssessment: Acute pharyngitis. Viral infection suspected.\nPlan: Symptomatic treatment. Rest, hydration. OTC pain relievers. F/U PRN.',
        output_medical: 'S: Pt c/o fever (onset yest), sore throat, cough, body aches.\nO: T 38.5°C. Pharyngitis. Cough. Flu test neg.\nA: Acute pharyngitis. Viral infxn.\nP: Sx mgmt. Rest, hydration. OTC PRN. F/U PRN.'
      },
      {
        input: '환자: 지난주에 운동하다가 오른쪽 어깨를 삐끗했어요. 팔을 올릴 때 아프고, 밤에 잠을 잘 못 자요.\n치료사: 우측 어깨 외전 시 90도에서 통증이 있고, 능동 관절 가동 범위(AROM)가 제한됩니다. 극상근 부위 압통이 있습니다.',
        output_ko: 'Subjective: 환자 지난주 운동 중 우측 어깨 염좌 발생. 팔 거상 시 통증, 야간 수면 방해 호소.\nObjective: 우측 어깨 외전 90° 통증, AROM 제한. 극상근 압통.\nAssessment: 우측 어깨 충돌 증후군. 통증으로 인한 기능 제한.\nPlan: 물리치료 주 3회 4주. 통증 조절. ROM/근력 강화 운동. 활동 수정 교육. 2주 후 추적 관찰.',
        output_en: 'Subjective: Pt reports R shoulder sprain 1 wk ago during exercise. Pain with arm elevation, disturbed sleep.\nObjective: R shoulder AROM limited to 90° abduction with pain. Supraspinatus tenderness to palpation.\nAssessment: R shoulder impingement syndrome. Functional limitation due to pain.\nPlan: PT 3x/wk for 4 wks. Modalities for pain. ROM/strengthening exercises. Patient education on activity modification. F/U in 2 wks.',
        output_medical: 'S: Pt c/o R shoulder sprain 1 wk ago. Pain w/ elev, disturbed sleep.\nO: R shoulder AROM lim 90° abd w/ pain. Supraspinatus TTP.\nA: R shoulder impingement. Pain-induced fxnl lim.\nP: PT 3x/wk x 4 wks. Pain mgmt. ROM/strength. Pt ed. F/U 2 wks.'
      },
      {
        input: '환자: 계단에서 넘어져서 발목을 접질렀어요. 붓고 아파서 걷기가 힘들어요.\n의사: 우측 발목 외측 부종과 압통이 심하고, 발목 관절 운동 제한이 있습니다. X-ray 상 골절은 보이지 않습니다.',
        output_ko: 'Subjective: 환자 계단에서 넘어져 우측 발목 염좌 발생. 부종, 통증, 보행 어려움 호소.\nObjective: 우측 발목 외측 부종 및 압통 심함. 발목 ROM 제한. X-ray 골절 음성.\nAssessment: 우측 발목 염좌, 2도. 급성 통증 및 기능 제한.\nPlan: RICE (휴식, 냉찜질, 압박, 거상). 비스테로이드성 소염진통제. 목발 사용. 물리치료 의뢰. 1주 후 추적 관찰.',
        output_en: 'Subjective: Pt reports R ankle sprain after fall on stairs. Swelling, pain, difficulty ambulating.\nObjective: Significant swelling and tenderness over R lateral ankle. Limited ankle ROM. X-ray negative for fracture.\nAssessment: R ankle sprain, Grade II. Acute pain and functional limitation.\nPlan: RICE (Rest, Ice, Compression, Elevation). NSAIDs. Crutches for ambulation. PT referral. F/U in 1 wk.',
        output_medical: 'S: Pt c/o R ankle sprain post fall. Swelling, pain, diff amb.\nO: R lat ankle swelling/TTP. Ankle ROM lim. X-ray neg fx.\nA: R ankle sprain Gr II. Acute pain/fxnl lim.\nP: RICE. NSAIDs. Crutches. PT ref. F/U 1 wk.'
      },
      {
        input: '환자: 갑자기 가슴이 답답하고 숨쉬기가 힘들어요. 식은땀도 나고 어지러워요.\n의사: 환자 의식 명료하고, 혈압 140/90, 맥박 110회/분, 호흡 24회/분. 심전도상 ST 분절 상승 소견. 심근효소 수치 상승.',
        output_ko: 'Subjective: 환자 갑작스러운 흉부 압박감, 호흡곤란, 식은땀, 어지럼증 호소.\nObjective: 의식 명료. BP 140/90, HR 110, RR 24. EKG: ST 분절 상승. 심근효소 상승.\nAssessment: 급성 심근경색 (AMI). STEMI.\nPlan: 산소, 아스피린, 니트로글리세린, 모르핀 투여. 심도자실 전실. 심장내과 협진.',
        output_en: 'Subjective: Pt c/o sudden chest tightness, dyspnea, diaphoresis, dizziness.\nObjective: A&Ox3. BP 140/90, HR 110, RR 24. EKG: ST elevation. Cardiac enzymes elevated.\nAssessment: Acute Myocardial Infarction (AMI). STEMI.\nPlan: O2, Aspirin, Nitroglycerin, Morphine. Transfer to Cath Lab. Consult Cardiology.',
        output_medical: 'S: Pt c/o sudden chest tightness, dyspnea, diaphoresis, dizziness.\nO: A&Ox3. BP 140/90, HR 110, RR 24. EKG: ST elev. Cardiac enzymes elev.\nA: AMI. STEMI.\nP: O2, ASA, NTG, Morphine. Transfer to Cath Lab. Consult Cardio.'
      }
    ];

    return examples.map(ex => {
      let output = '';
      if (language === 'en') output = ex.output_en;
      else if (language === 'medical') output = ex.output_medical;
      else output = ex.output_ko;
      
      return `--- 예시 ---\n환자 대화 내용:\n${ex.input}\n\nSOAP 노트:\n${output}\n`;
    }).join('');
  };

  const prompt = template 
    ? `${getRolePrompt(noteType)}
${getFewShotExamples(params.language)}
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
${getFewShotExamples(params.language)}
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
          content: `당신은 숙련된 의료 기록 전문가입니다. 다음은 몇 가지 SOAP 노트 작성 예시입니다. 이 예시들을 참고하여 환자의 대화 내용을 바탕으로 정확하고 간결한 SOAP 노트를 작성해주세요.

--- 예시 1 (내과) ---
환자 대화 내용:
환자: 어제부터 열이 나고 목이 아파요. 기침도 좀 나고 몸살 기운이 있어요.
의사: 체온은 38.5도이고, 목 안이 좀 부어있네요. 인후통과 기침이 주 증상이고, 독감 검사는 음성입니다.

SOAP 노트:
Subjective: Pt c/o fever (onset yesterday), sore throat, cough, body aches.
Objective: T 38.5°C. Pharyngeal erythema. Cough present. Flu test negative.
Assessment: Acute pharyngitis. Viral infection suspected.
Plan: Symptomatic treatment. Rest, hydration. OTC pain relievers. F/U PRN.

--- 예시 2 (물리치료) ---
환자 대화 내용:
환자: 지난주에 운동하다가 오른쪽 어깨를 삐끗했어요. 팔을 올릴 때 아프고, 밤에 잠을 잘 못 자요.
치료사: 우측 어깨 외전 시 90도에서 통증이 있고, 능동 관절 가동 범위(AROM)가 제한됩니다. 극상근 부위 압통이 있습니다.

SOAP 노트:
Subjective: Pt reports R shoulder sprain 1 wk ago during exercise. Pain with arm elevation, disturbed sleep.
Objective: R shoulder AROM limited to 90° abduction with pain. Supraspinatus tenderness to palpation.
Assessment: R shoulder impingement syndrome. Functional limitation due to pain.
Plan: PT 3x/wk for 4 wks. Modalities for pain. ROM/strengthening exercises. Patient education on activity modification. F/U in 2 wks.

--- 예시 3 (정형외과) ---
환자 대화 내용:
환자: 계단에서 넘어져서 발목을 접질렀어요. 붓고 아파서 걷기가 힘들어요.
의사: 우측 발목 외측 부종과 압통이 심하고, 발목 관절 운동 제한이 있습니다. X-ray 상 골절은 보이지 않습니다.

SOAP 노트:
Subjective: Pt reports R ankle sprain after fall on stairs. Swelling, pain, difficulty ambulating.
Objective: Significant swelling and tenderness over R lateral ankle. Limited ankle ROM. X-ray negative for fracture.
Assessment: R ankle sprain, Grade II. Acute pain and functional limitation.
Plan: RICE (Rest, Ice, Compression, Elevation). NSAIDs. Crutches for ambulation. PT referral. F/U in 1 wk.

--- 예시 4 (응급의학과) ---
환자 대화 내용:
환자: 갑자기 가슴이 답답하고 숨쉬기가 힘들어요. 식은땀도 나고 어지러워요.
의사: 환자 의식 명료하고, 혈압 140/90, 맥박 110회/분, 호흡 24회/분. 심전도상 ST 분절 상승 소견. 심근효소 수치 상승.

SOAP 노트:
Subjective: Pt c/o sudden chest tightness, dyspnea, diaphoresis, dizziness.
Objective: A&Ox3. BP 140/90, HR 110, RR 24. EKG: ST elevation. Cardiac enzymes elevated.
Assessment: Acute Myocardial Infarction (AMI). STEMI.
Plan: O2, Aspirin, Nitroglycerin, Morphine. Transfer to Cath Lab. Consult Cardiology.

--- 예시 끝 ---
`
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