import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAudio, transcribeAudio } from '../services/audioService';
import { generateSoapNote } from '../services/openaiService';
import { PatientInfo, SoapNote } from '../types/note';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const [audioLevel, setAudioLevel] = useState(0);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
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
      // 의료용 최적화된 오디오 설정
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // 모노 채널
          sampleRate: 16000, // Whisper 최적화 샘플레이트
          echoCancellation: true, // 에코 제거
          noiseSuppression: true, // 노이즈 억제
          autoGainControl: true // 자동 게인 조정
        }
      });

      const audioChunks: Blob[] = [];
      
      // 브라우저별 최적 코덱 선택
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
          }
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // 의료용 품질 확보
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        setAudioBlob(audioBlob);
        
        // 녹음 품질 정보 로깅
        console.log('녹음 완료:', {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: recordingTime,
          quality: 'medical-optimized'
        });
      };

      setMediaRecorder(recorder);
      recorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      setError(null);

      // 녹음 시간 타이머 시작
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // 실시간 오디오 레벨 모니터링
      monitorAudioLevel(stream);

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
      
      // 오디오 컨텍스트 정리
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // 상태 초기화
      setAudioLevel(0);
      setQualityWarnings([]);
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

  // 실시간 오디오 레벨 모니터링
  const monitorAudioLevel = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (analyser && isRecording) {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = Math.round((average / 255) * 100);
        setAudioLevel(level);
        
        // 음성 품질 실시간 체크
        const warnings: string[] = [];
        if (level < 5) {
          warnings.push('음성이 너무 작습니다. 마이크에 가까이 말씀해주세요.');
        } else if (level > 90) {
          warnings.push('음성이 너무 큽니다. 마이크에서 조금 떨어져 말씀해주세요.');
        }
        setQualityWarnings(warnings);
        
        animationRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="audio-soap-note">
      {isProcessing && <LoadingSpinner overlay message="처리 중입니다..." />}
      
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
              <div className={`status-indicator ${isRecording ? 'recording' : ''}`}>
                <div className={`dot ${isRecording ? 'recording' : ''}`}></div>
                <span>{isRecording ? '녹음 중...' : '녹음 대기 중'}</span>
                {isRecording && (
                  <span className="timer">{formatTime(recordingTime)}</span>
                )}
              </div>

              {/* 실시간 오디오 품질 모니터링 */}
              {isRecording && (
                <div className="audio-quality-monitor">
                  <div className="audio-level-display">
                    <span>음성 레벨:</span>
                    <div className="audio-level-bar">
                      <div 
                        className="audio-level-fill" 
                        style={{ width: `${audioLevel}%` }}
                      ></div>
                    </div>
                    <span className="audio-level-text">{audioLevel}%</span>
                  </div>
                  
                  {qualityWarnings.length > 0 && (
                    <div className="quality-warnings">
                      {qualityWarnings.map((warning, index) => (
                        <div key={index} className="quality-warning">
                          <span className="quality-warning-icon">⚠️</span>
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 녹음 품질 안내 */}
              {!isRecording && !audioBlob && (
                <div className="recording-tips">
                  <h4>📝 좋은 음성 인식을 위한 팁</h4>
                  <ul>
                    <li>조용한 환경에서 녹음해주세요</li>
                    <li>마이크에서 30cm 정도 떨어져 말씀해주세요</li>
                    <li>의료 용어는 천천히 명확하게 발음해주세요</li>
                    <li>환자 개인정보는 녹음하지 마세요</li>
                    <li>최소 10초 이상 녹음하시는 것을 권장합니다</li>
                  </ul>
                </div>
              )}

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