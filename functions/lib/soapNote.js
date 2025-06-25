"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSoapNoteSecure = exports.soapNoteFunction = void 0;
const functions = __importStar(require("firebase-functions"));
const openai_1 = __importDefault(require("openai"));
// OpenAI 클라이언트 초기화
const openai = new openai_1.default({
    apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY,
});
// HTTP 요청용 함수
const soapNoteFunction = async (req, res) => {
    var _a;
    try {
        // POST 요청만 허용
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const params = req.body;
        // 입력 데이터 검증
        if (!params.noteType || !params.patientInfo || !params.shorthandNotes) {
            res.status(400).json({
                error: '필수 매개변수가 누락되었습니다.',
                required: ['noteType', 'patientInfo', 'shorthandNotes']
            });
            return;
        }
        // OpenAI API 키 확인
        if (!((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) && !process.env.OPENAI_API_KEY) {
            console.error('OpenAI API 키가 설정되지 않았습니다.');
            res.status(500).json({
                error: 'API 설정 오류가 발생했습니다. 관리자에게 문의하세요.'
            });
            return;
        }
        const soapNote = await generateSoapNoteInternal(params);
        res.json(soapNote);
    }
    catch (error) {
        console.error('SOAP 노트 생성 오류:', error);
        if (error instanceof Error) {
            // OpenAI API 오류 처리
            if (error.message.includes('401')) {
                res.status(500).json({ error: 'API 인증 오류가 발생했습니다.' });
            }
            else if (error.message.includes('429')) {
                res.status(429).json({ error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' });
            }
            else if (error.message.includes('400')) {
                res.status(400).json({ error: '잘못된 요청입니다.' });
            }
            else {
                res.status(500).json({ error: 'SOAP 노트 생성 중 오류가 발생했습니다.' });
            }
        }
        else {
            res.status(500).json({ error: '알 수 없는 오류가 발생했습니다.' });
        }
    }
};
exports.soapNoteFunction = soapNoteFunction;
// Firebase Functions onCall용 함수 (인증 필요)
const generateSoapNoteSecure = async (data, context) => {
    var _a, _b, _c;
    try {
        // 요청 로깅 (개인정보 제외)
        console.log('SOAP 노트 생성 요청:', {
            userId: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
            noteType: data.noteType,
            hasTemplate: !!data.template,
            timestamp: new Date().toISOString()
        });
        const soapNote = await generateSoapNoteInternal(data);
        // 성공 로깅
        console.log('SOAP 노트 생성 성공:', {
            userId: (_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid,
            noteType: data.noteType,
            timestamp: new Date().toISOString()
        });
        return soapNote;
    }
    catch (error) {
        console.error('SOAP 노트 생성 오류:', {
            userId: (_c = context.auth) === null || _c === void 0 ? void 0 : _c.uid,
            error: error,
            timestamp: new Date().toISOString()
        });
        if (error instanceof Error) {
            if (error.message.includes('401')) {
                throw new functions.https.HttpsError('internal', 'API 인증 오류가 발생했습니다.');
            }
            else if (error.message.includes('429')) {
                throw new functions.https.HttpsError('resource-exhausted', 'API 요청 한도를 초과했습니다.');
            }
            else if (error.message.includes('400')) {
                throw new functions.https.HttpsError('invalid-argument', '잘못된 요청입니다.');
            }
        }
        throw new functions.https.HttpsError('internal', 'SOAP 노트 생성 중 오류가 발생했습니다.');
    }
};
exports.generateSoapNoteSecure = generateSoapNoteSecure;
// 실제 SOAP 노트 생성 로직
async function generateSoapNoteInternal(params) {
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
        const sections = {
            subjective: '',
            objective: '',
            assessment: '',
            plan: ''
        };
        const lines = soapNoteText.split('\n');
        let currentSection = null;
        for (const line of lines) {
            if (line.toLowerCase().startsWith('subjective:')) {
                currentSection = 'subjective';
                sections.subjective = line.substring(11).trim();
            }
            else if (line.toLowerCase().startsWith('objective:')) {
                currentSection = 'objective';
                sections.objective = line.substring(10).trim();
            }
            else if (line.toLowerCase().startsWith('assessment:')) {
                currentSection = 'assessment';
                sections.assessment = line.substring(11).trim();
            }
            else if (line.toLowerCase().startsWith('plan:')) {
                currentSection = 'plan';
                sections.plan = line.substring(5).trim();
            }
            else if (line.trim() && currentSection) {
                sections[currentSection] += ' ' + line.trim();
            }
        }
        return Object.assign(Object.assign({}, sections), { patientInfo });
    }
    catch (error) {
        console.error('OpenAI API 호출 오류:', error);
        throw error;
    }
}
//# sourceMappingURL=soapNote.js.map