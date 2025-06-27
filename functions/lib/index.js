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
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeAudioSecure = exports.generateSoapNoteSecure = exports.healthCheck = exports.transcribeAudio = exports.generateSoapNote = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const soapNote_1 = require("./soapNote");
const audioTranscription_1 = require("./audioTranscription");
// Firebase Admin 초기화
admin.initializeApp();
// CORS 설정
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://your-app-domain.com',
        /\.firebaseapp\.com$/,
        /\.web\.app$/
    ],
    credentials: true
};
const corsHandler = (0, cors_1.default)(corsOptions);
// SOAP 노트 생성 함수
exports.generateSoapNote = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        await (0, soapNote_1.soapNoteFunction)(req, res);
    });
});
// 음성 전사 함수
exports.transcribeAudio = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        await (0, audioTranscription_1.audioTranscriptionFunction)(req, res);
    });
});
// 헬스 체크 함수
exports.healthCheck = functions.https.onRequest((req, res) => {
    corsHandler(req, res, () => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });
});
// 인증된 사용자를 위한 SOAP 노트 생성 (보안 강화)
exports.generateSoapNoteSecure = functions.https.onCall(async (data, context) => {
    // 사용자 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '이 기능을 사용하려면 로그인이 필요합니다.');
    }
    const { generateSoapNoteSecure } = await Promise.resolve().then(() => __importStar(require('./soapNote')));
    return await generateSoapNoteSecure(data, context);
});
// 인증된 사용자를 위한 음성 전사 (보안 강화)
exports.transcribeAudioSecure = functions.https.onCall(async (data, context) => {
    // 사용자 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '이 기능을 사용하려면 로그인이 필요합니다.');
    }
    const { transcribeAudioSecure } = await Promise.resolve().then(() => __importStar(require('./audioTranscription')));
    return await transcribeAudioSecure(data, context);
});
//# sourceMappingURL=index.js.map