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
exports.transcribeAudioSecure = exports.audioTranscriptionFunction = void 0;
const functions = __importStar(require("firebase-functions"));
const openai_1 = __importDefault(require("openai"));
const formidable = __importStar(require("formidable"));
const fs = __importStar(require("fs"));
// OpenAI 클라이언트 초기화
const openai = new openai_1.default({
    apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY,
});
// HTTP 요청용 함수
const audioTranscriptionFunction = async (req, res) => {
    var _a;
    try {
        // POST 요청만 허용
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
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
        // Content-Type 확인
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('multipart/form-data')) {
            res.status(400).json({
                error: '잘못된 Content-Type입니다. multipart/form-data를 사용해주세요.'
            });
            return;
        }
        // 파일 파싱
        const form = new formidable.IncomingForm({
            maxFileSize: 25 * 1024 * 1024,
            keepExtensions: true,
        });
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('파일 파싱 오류:', err);
                res.status(400).json({ error: '파일 업로드 오류가 발생했습니다.' });
                return;
            }
            const file = Array.isArray(files.file) ? files.file[0] : files.file;
            if (!file) {
                res.status(400).json({ error: '오디오 파일이 필요합니다.' });
                return;
            }
            try {
                const transcription = await transcribeAudioInternal(file.filepath);
                res.json({ text: transcription });
            }
            catch (error) {
                console.error('음성 전사 오류:', error);
                if (error instanceof Error) {
                    if (error.message.includes('401')) {
                        res.status(500).json({ error: 'API 인증 오류가 발생했습니다.' });
                    }
                    else if (error.message.includes('429')) {
                        res.status(429).json({ error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' });
                    }
                    else if (error.message.includes('413')) {
                        res.status(413).json({ error: '파일 크기가 너무 큽니다. 25MB 이하의 파일만 지원됩니다.' });
                    }
                    else {
                        res.status(500).json({ error: '음성 전사 중 오류가 발생했습니다.' });
                    }
                }
                else {
                    res.status(500).json({ error: '알 수 없는 오류가 발생했습니다.' });
                }
            }
            finally {
                // 임시 파일 삭제
                if (file.filepath && fs.existsSync(file.filepath)) {
                    fs.unlinkSync(file.filepath);
                }
            }
        });
    }
    catch (error) {
        console.error('음성 전사 함수 오류:', error);
        res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.audioTranscriptionFunction = audioTranscriptionFunction;
// Firebase Functions onCall용 함수 (인증 필요)
const transcribeAudioSecure = async (data, context) => {
    var _a, _b, _c;
    try {
        // 요청 로깅 (개인정보 제외)
        console.log('음성 전사 요청:', {
            userId: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
            fileName: data.fileName || 'unknown',
            language: data.language || 'ko',
            timestamp: new Date().toISOString()
        });
        // Base64 데이터를 임시 파일로 저장
        const audioBuffer = Buffer.from(data.audioData, 'base64');
        const tempFilePath = `/tmp/audio_${Date.now()}.mp3`;
        fs.writeFileSync(tempFilePath, audioBuffer);
        try {
            const transcription = await transcribeAudioInternal(tempFilePath, data.language);
            // 성공 로깅
            console.log('음성 전사 성공:', {
                userId: (_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid,
                transcriptionLength: transcription.length,
                timestamp: new Date().toISOString()
            });
            return { text: transcription };
        }
        finally {
            // 임시 파일 삭제
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }
    catch (error) {
        console.error('음성 전사 오류:', {
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
            else if (error.message.includes('413')) {
                throw new functions.https.HttpsError('invalid-argument', '파일 크기가 너무 큽니다.');
            }
        }
        throw new functions.https.HttpsError('internal', '음성 전사 중 오류가 발생했습니다.');
    }
};
exports.transcribeAudioSecure = transcribeAudioSecure;
// 실제 음성 전사 로직
async function transcribeAudioInternal(filePath, language = 'ko') {
    try {
        // 파일 크기 확인
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > 25) {
            throw new Error('파일 크기가 25MB를 초과합니다.');
        }
        console.log('Whisper API 요청:', {
            filePath,
            fileSizeInMB: fileSizeInMB.toFixed(2),
            language,
            model: 'whisper-1'
        });
        // Whisper API 호출
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-1',
            language: language,
            response_format: 'json'
        });
        if (!transcription.text) {
            throw new Error('음성 전사 결과가 없습니다.');
        }
        console.log('Whisper API 응답 성공:', {
            transcriptionLength: transcription.text.length,
            language: language
        });
        return transcription.text;
    }
    catch (error) {
        console.error('Whisper API 호출 오류:', error);
        throw error;
    }
}
//# sourceMappingURL=audioTranscription.js.map