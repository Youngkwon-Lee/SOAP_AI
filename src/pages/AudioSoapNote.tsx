import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAudio, transcribeAudio } from '../services/audioService';
import { generateSoapNote } from '../services/openaiService';
import { PatientInfo, SoapNote } from '../types/note';
import '../styles/AudioSoapNote.css';

const AudioSoapNote: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('recording');
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    visitDate: new Date().toISOString().split('T')[0]
  });
  const [soapNote, setSoapNote] = useState<SoapNote | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000
        }
      });

      const audioChunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(audioBlob);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setError(null);

      // 녹음 시간 타이머 시작
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      setError('오디오 파일이 필요합니다.');
      return;
    }

    try {
      setIsProcessing(true);
      setCurrentStep('transcribing');

      // 음성을 텍스트로 변환
      const transcribedText = await transcribeAudio(audioBlob);
      setTranscription(transcribedText);

      setCurrentStep('generating');
      // SOAP 노트 생성
      const soapNote = await generateSoapNote({
        patientInfo,
        shorthandNotes: transcribedText,
        noteType: '물리치료',
        language: 'ko'
      });

      setSoapNote(soapNote);
      setIsProcessing(false);
      setCurrentStep('completed');
    } catch (error) {
      console.error('처리 중 오류 발생:', error);
      setError('처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
      setCurrentStep('error');
    }
  };

  return (
    <div className="audio-soap-note">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← 홈으로
        </button>
        <h1>음성 SOAP 노트</h1>
      </div>

      <div className="content-container">
        <div className="note-card">
          <div className="card-section">
            <h2>환자 정보</h2>
            <div className="form-group">
              <label htmlFor="patientName">환자 이름</label>
              <input
                id="patientName"
                type="text"
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({
                  ...patientInfo,
                  name: e.target.value
                })}
                placeholder="환자 이름을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label htmlFor="visitDate">방문 날짜</label>
              <input
                id="visitDate"
                type="date"
                value={patientInfo.visitDate}
                onChange={(e) => setPatientInfo({
                  ...patientInfo,
                  visitDate: e.target.value
                })}
              />
            </div>
          </div>

          <div className="card-section">
            <h2>음성 녹음</h2>
            <p className="section-description">
              환자와의 대화를 녹음하거나 기존 녹음 파일을 업로드하세요
            </p>

            <div className="recording-container">
              <div className="status-indicator">
                <div className={`dot ${isRecording ? 'recording' : ''}`}></div>
                <span>{isRecording ? '녹음 중...' : '녹음 대기 중'}</span>
                {isRecording && (
                  <span className="timer">{formatTime(recordingTime)}</span>
                )}
              </div>

              <div className="recording-controls">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`control-button ${isRecording ? 'recording' : ''}`}
                >
                  {isRecording ? '녹음 중지' : '녹음 시작'}
                </button>

                <div className="file-upload">
                  <label htmlFor="audio-file" className="upload-label">
                    또는 파일 업로드
                  </label>
                  <input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                </div>
              </div>

              {audioBlob && (
                <div className="audio-preview">
                  <audio controls src={URL.createObjectURL(audioBlob)} />
                  <button 
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="process-button"
                  >
                    {isProcessing ? 'SOAP 노트 생성 중...' : 'SOAP 노트 생성하기'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {isProcessing && (
            <div className="processing-indicator">
              <div className="processing-steps">
                <div className="step">
                  <div className="spinner"></div>
                  <span>{currentStep === 'transcribing' ? '음성을 텍스트로 변환 중...' : currentStep === 'generating' ? 'SOAP 노트 생성 중...' : '처리 중...'}</span>
                </div>
              </div>
            </div>
          )}

          {transcription && (
            <div className="card-section">
              <h2>음성 텍스트 변환 결과</h2>
              <div className="transcription-box">
                <p>{transcription}</p>
              </div>
            </div>
          )}

          {soapNote && (
            <div className="card-section">
              <h2>생성된 SOAP 노트</h2>
              <div className="soap-note-box">
                <div className="soap-section">
                  <h3>Subjective</h3>
                  <p>{soapNote.subjective}</p>
                </div>
                <div className="soap-section">
                  <h3>Objective</h3>
                  <p>{soapNote.objective}</p>
                </div>
                <div className="soap-section">
                  <h3>Assessment</h3>
                  <p>{soapNote.assessment}</p>
                </div>
                <div className="soap-section">
                  <h3>Plan</h3>
                  <p>{soapNote.plan}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioSoapNote; 