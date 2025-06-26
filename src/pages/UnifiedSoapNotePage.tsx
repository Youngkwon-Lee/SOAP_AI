import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateSoapNote } from '../services/openaiService';
import { startRecording, stopRecording, transcribeAudio } from '../services/audioService';
import { Template, PatientInfo, SoapNote } from '../types';
import TemplateManager from '../components/TemplateManager';
import SpecialtySelector from '../components/SpecialtySelector';
import PersonalizationDashboard from '../components/PersonalizationDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import RealtimeAIAssistant from '../components/RealtimeAIAssistant';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts, createSoapNoteShortcuts } from '../hooks/useKeyboardShortcuts';
import { getTemplateBySpecialty } from '../services/defaultTemplates';
import { analyzeAndStorePattern } from '../services/personalizationEngine';
import { saveNote } from '../services/noteService';
import { saveOfflineNote, isOnline, saveDraft, loadDraft, clearDraft } from '../services/offlineStorage';
import '../styles/UnifiedSoapNotePage.css';

// 통합된 SOAP 노트 페이지 - Week 3 기능
const UnifiedSoapNotePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const profession = searchParams.get('profession') || 'doctor';
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>(
    (searchParams.get('method') as 'text' | 'voice') || 'text'
  );
  
  // 언어 및 설정
  const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en' | 'medical'>('ko');
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(true);

  // 오디오 관련 상태 (AudioSoapNote의 고급 기능들)
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  
  // 처리 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'transcribing' | 'generating' | 'complete'>('input');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 데이터 상태
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    visitDate: new Date().toISOString().split('T')[0]
  });
  const [shorthandNotes, setShorthandNotes] = useState('');
  const [soapNote, setSoapNote] = useState<SoapNote | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // 참조와 타이머
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 자동 저장 설정
  interface AutoSaveData {
    patientInfo: PatientInfo;
    shorthandNotes: string;
    selectedTemplate: Template | null;
    inputMethod: 'text' | 'voice';
  }

  const autoSaveData: AutoSaveData = {
    patientInfo,
    shorthandNotes,
    selectedTemplate,
    inputMethod
  };

  const { loadFromLocal, clearLocal, hasSavedData } = useAutoSave(autoSaveData, {
    key: `unified-soap-note-${profession}-${selectedSpecialty}`,
    delay: 3000,
    enabled: true
  });

  // 타이머 및 오디오 레벨 모니터링 함수들
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

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 오디오 레벨 모니터링
  const startAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const normalizedLevel = Math.min(average / 128, 1);
          setAudioLevel(normalizedLevel);

          // 품질 경고 시스템
          const warnings: string[] = [];
          if (normalizedLevel < 0.1) {
            warnings.push('음성이 너무 작습니다. 마이크에 더 가까이 말해주세요.');
          } else if (normalizedLevel > 0.9) {
            warnings.push('음성이 너무 큽니다. 마이크에서 조금 떨어져 주세요.');
          }
          setQualityWarnings(warnings);
          
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (err) {
      console.error('오디오 레벨 모니터링 시작 실패:', err);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setQualityWarnings([]);
  };

  // 고급 오디오 녹음 시작 (AudioSoapNote의 최적화된 설정)
  const handleStartRecording = async () => {
    try {
      setError(null);
      setCurrentStep('input');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      chunksRef.current = [];
      
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
        audioBitsPerSecond: 128000
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        stopAudioLevelMonitoring();
        stopTimer();
        
        // 자동으로 전사 시작
        handleTranscribe(blob);
      };

      setMediaRecorder(recorder);
      recorder.start(1000);
      setIsRecording(true);
      startTimer();
      startAudioLevelMonitoring(stream);
      
    } catch (err) {
      setError('녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.');
      console.error('Recording error:', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('오디오 파일만 업로드 가능합니다.');
        return;
      }
      setUploadedFile(file);
      await handleTranscribe(file);
    }
  };

  // 음성 전사 처리
  const handleTranscribe = async (audioData: Blob | File) => {
    setIsProcessing(true);
    setCurrentStep('transcribing');
    setError(null);
    
    try {
      const text = await transcribeAudio(audioData);
      setTranscribedText(text);
      setShorthandNotes(text);
      setCurrentStep('input');
      setSuccess('음성이 성공적으로 텍스트로 변환되었습니다!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('음성을 텍스트로 변환하는 중 오류가 발생했습니다.');
      console.error('Transcription error:', err);
      setCurrentStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  // 입력 방법 전환
  const handleMethodSwitch = (method: 'text' | 'voice') => {
    setInputMethod(method);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('method', method);
      return newParams;
    });
    
    // 음성에서 텍스트로 전환 시 기존 녹음 정리
    if (method === 'text' && isRecording) {
      handleStopRecording();
    }
  };

  // 폼 핸들러들
  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setShorthandNotes(e.target.value);
  };

  // AI 어시스턴트 제안 적용
  const handleAISuggestionApply = (suggestion: string) => {
    setShorthandNotes(suggestion);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setShorthandNotes(template.example);
  };

  // SOAP 노트 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCurrentStep('generating');
    setError(null);
    
    try {
      const result = await generateSoapNote({
        noteType: selectedSpecialty,
        patientInfo,
        shorthandNotes: shorthandNotes || transcribedText,
        language: selectedLanguage,
        template: selectedTemplate?.format
      });
      
      setSoapNote(result);
      setCurrentStep('complete');
      
      // 개인화 패턴 학습
      if (result && selectedSpecialty) {
        try {
          await analyzeAndStorePattern(result, selectedSpecialty);
          console.log('✅ 개인화 패턴 학습 완료');
        } catch (patternError) {
          console.error('개인화 패턴 학습 실패:', patternError);
        }
      }
      
      clearLocal();
      setSuccess('SOAP 노트가 성공적으로 생성되었습니다!');
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err) {
      setError('SOAP 노트 생성 중 오류가 발생했습니다.');
      console.error('Error generating SOAP note:', err);
      setCurrentStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  // SOAP 노트 저장
  const handleSaveNote = async () => {
    if (!soapNote) return;
    
    try {
      setIsLoading(true);
      
      if (isOnline()) {
        // 온라인: Firebase에 저장
        await saveNote(soapNote, selectedSpecialty as any);
        setSuccess('노트가 성공적으로 저장되었습니다!');
      } else {
        // 오프라인: 로컬 스토리지에 저장
        const offlineId = saveOfflineNote(soapNote, patientInfo, selectedSpecialty);
        setSuccess('오프라인 상태입니다. 노트가 로컬에 저장되었습니다. 온라인 연결 시 자동으로 동기화됩니다.');
        console.log('오프라인 노트 저장:', offlineId);
      }
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(isOnline() ? '노트 저장 중 오류가 발생했습니다.' : '오프라인 노트 저장 중 오류가 발생했습니다.');
      console.error('Save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기화
  const handleClear = () => {
    if (window.confirm('작성 중인 내용을 모두 지우시겠습니까?')) {
      setPatientInfo({
        name: '',
        age: '',
        gender: '',
        visitDate: new Date().toISOString().split('T')[0]
      });
      setShorthandNotes('');
      setTranscribedText('');
      setSoapNote(null);
      setAudioBlob(null);
      setUploadedFile(null);
      setCurrentStep('input');
      clearLocal();
    }
  };

  // 키보드 단축키 설정
  const shortcuts = createSoapNoteShortcuts({
    generate: () => {
      if (!isLoading && patientInfo.name && shorthandNotes && currentStep === 'input') {
        handleSubmit(new Event('submit') as any);
      }
    },
    clear: handleClear,
    toggleRecording: () => {
      if (inputMethod === 'voice') {
        if (isRecording) {
          handleStopRecording();
        } else {
          handleStartRecording();
        }
      }
    }
  });

  const { getShortcutHelp } = useKeyboardShortcuts(shortcuts, { enabled: true });

  // 저장된 데이터 복원
  useEffect(() => {
    if (hasSavedData()) {
      const savedData = loadFromLocal();
      if (savedData && window.confirm('이전에 작성 중이던 내용이 있습니다. 복원하시겠습니까?')) {
        setPatientInfo(savedData.patientInfo);
        setShorthandNotes(savedData.shorthandNotes);
        setSelectedTemplate(savedData.selectedTemplate);
        setInputMethod(savedData.inputMethod);
      }
    }
  }, [hasSavedData, loadFromLocal]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopTimer();
      stopAudioLevelMonitoring();
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, []);

  return (
    <div className="unified-soap-note-page">
      {/* 로딩 오버레이 */}
      {(isLoading || isProcessing) && (
        <LoadingSpinner 
          overlay 
          message={
            currentStep === 'transcribing' ? '음성을 텍스트로 변환하고 있습니다...' :
            currentStep === 'generating' ? 'SOAP 노트를 생성하고 있습니다...' :
            '처리 중입니다...'
          } 
        />
      )}
      
      {/* 헤더 */}
      <header className="page-header">
        <div className="header-main">
          <h1>
            {selectedSpecialty ? `${selectedSpecialty} SOAP 노트` : 'SOAP 노트 작성'}
          </h1>
          <div className="progress-indicator">
            <div className={`step ${currentStep === 'input' || currentStep === 'transcribing' ? 'active' : ['generating', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
              입력
            </div>
            <div className={`step ${currentStep === 'generating' ? 'active' : currentStep === 'complete' ? 'completed' : ''}`}>
              생성
            </div>
            <div className={`step ${currentStep === 'complete' ? 'active' : ''}`}>
              완료
            </div>
          </div>
        </div>
        
        <div className="header-controls">
          {/* 입력 방법 전환 */}
          <div className="method-switch">
            <button
              className={`method-btn ${inputMethod === 'text' ? 'active' : ''}`}
              onClick={() => handleMethodSwitch('text')}
            >
              ✏️ 텍스트
            </button>
            <button
              className={`method-btn ${inputMethod === 'voice' ? 'active' : ''}`}
              onClick={() => handleMethodSwitch('voice')}
            >
              🎙️ 음성
            </button>
          </div>
          
          {/* 언어 선택 */}
          <div className="language-selector">
            <label htmlFor="language">출력:</label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'ko' | 'en' | 'medical')}
            >
              <option value="ko">🇰🇷 한국어</option>
              <option value="en">🇺🇸 English</option>
              <option value="medical">🏥 Medical</option>
            </select>
          </div>
          
          {/* 도구 버튼들 */}
          <button 
            onClick={() => setShowShortcutHelp(!showShortcutHelp)}
            className="tool-btn"
            title="키보드 단축키"
          >
            ⌨️
          </button>
          
          <button 
            onClick={() => setShowPersonalization(!showPersonalization)}
            className="tool-btn"
            title="AI 개인화"
          >
            🤖
          </button>

          <button 
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={`tool-btn ${showAIAssistant ? 'active' : ''}`}
            title="실시간 AI 도움"
          >
            ✨
          </button>
        </div>
      </header>

      {/* 상태 메시지 */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* 단축키 도움말 */}
      {showShortcutHelp && (
        <div className="shortcut-help">
          <h3>키보드 단축키</h3>
          <ul>
            {getShortcutHelp().map((shortcut, index) => (
              <li key={index}>
                <kbd>{shortcut.combination}</kbd> - {shortcut.description}
              </li>
            ))}
          </ul>
          <button onClick={() => setShowShortcutHelp(false)}>닫기</button>
        </div>
      )}

      {/* 전문과 선택 */}
      <SpecialtySelector
        selectedSpecialty={selectedSpecialty}
        onSpecialtyChange={(newSpecialty) => {
          setSelectedSpecialty(newSpecialty);
          setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (newSpecialty) {
              newParams.set('specialty', newSpecialty);
            } else {
              newParams.delete('specialty');
            }
            return newParams;
          });
          
          if (newSpecialty) {
            const defaultTemplate = getTemplateBySpecialty(newSpecialty);
            if (defaultTemplate) {
              setSelectedTemplate({
                id: 'default',
                ...defaultTemplate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          } else {
            setSelectedTemplate(null);
          }
        }}
      />

      {/* 템플릿 관리 */}
      {selectedSpecialty && (
        <TemplateManager
          profession={profession}
          specialty={selectedSpecialty}
          onTemplateSelect={handleTemplateSelect}
        />
      )}

      {/* 개인화 대시보드 */}
      {showPersonalization && selectedSpecialty && (
        <PersonalizationDashboard
          specialty={selectedSpecialty}
          onTemplateGenerated={(template) => {
            setSelectedTemplate(template);
            setSuccess('개인 맞춤 템플릿이 적용되었습니다!');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        <div className="content-layout">
          <div className="form-section">
            <form onSubmit={handleSubmit} className="soap-form">
          {/* 환자 정보 */}
          <section className="patient-info-section">
            <h2>환자 정보</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">이름 *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={patientInfo.name}
                  onChange={handlePatientInfoChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="age">나이 *</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={patientInfo.age}
                  onChange={handlePatientInfoChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">성별 *</label>
                <select
                  id="gender"
                  name="gender"
                  value={patientInfo.gender}
                  onChange={handlePatientInfoChange}
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="visitDate">방문일 *</label>
                <input
                  type="date"
                  id="visitDate"
                  name="visitDate"
                  value={patientInfo.visitDate}
                  onChange={handlePatientInfoChange}
                  required
                />
              </div>
            </div>
          </section>

          {/* 진료 노트 입력 */}
          <section className="notes-section">
            <h2>진료 노트</h2>
            
            {/* 음성 입력 인터페이스 */}
            {inputMethod === 'voice' && (
              <div className="voice-input-panel">
                <div className="voice-controls">
                  <button
                    type="button"
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isProcessing}
                  >
                    {isRecording ? (
                      <>
                        <span className="recording-pulse"></span>
                        녹음 중지 ({formatTime(recordingTime)})
                      </>
                    ) : (
                      '🎙️ 녹음 시작'
                    )}
                  </button>
                  
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-button"
                    disabled={isProcessing}
                  >
                    📁 파일 업로드
                  </button>
                </div>

                {/* 오디오 레벨 표시 */}
                {isRecording && (
                  <div className="audio-monitoring">
                    <div className="audio-level-container">
                      <div className="audio-level-label">음성 레벨:</div>
                      <div className="audio-level-bar">
                        <div 
                          className="audio-level-fill"
                          style={{ width: `${audioLevel * 100}%` }}
                        />
                      </div>
                      <div className="audio-level-value">{Math.round(audioLevel * 100)}%</div>
                    </div>
                    
                    {qualityWarnings.length > 0 && (
                      <div className="quality-warnings">
                        {qualityWarnings.map((warning, index) => (
                          <div key={index} className="warning">⚠️ {warning}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 오디오 미리보기 */}
                {(audioBlob || uploadedFile) && (
                  <div className="audio-preview">
                    <h4>
                      {uploadedFile ? `업로드된 파일: ${uploadedFile.name}` : '녹음된 오디오'}
                    </h4>
                    {audioBlob && (
                      <audio controls src={URL.createObjectURL(audioBlob)} />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 텍스트 입력 영역 */}
            <div className="text-input-container">
              <textarea
                value={shorthandNotes}
                onChange={handleNotesChange}
                placeholder={
                  inputMethod === 'voice' 
                    ? '음성이 텍스트로 변환되면 여기에 표시됩니다. 직접 수정하거나 추가 입력도 가능합니다...'
                    : '진료 내용을 자유롭게 작성하세요...'
                }
                required
                className="notes-textarea"
              />
              
              {transcribedText && inputMethod === 'voice' && (
                <div className="transcription-info">
                  ✅ 음성에서 변환된 텍스트입니다. 필요시 수정하세요.
                </div>
              )}
            </div>
          </section>

          {/* 액션 버튼들 */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              disabled={isLoading || isProcessing}
            >
              🗑️ 초기화
            </button>
            
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || isProcessing || !patientInfo.name || !shorthandNotes}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  생성 중...
                </>
              ) : (
                '✨ SOAP 노트 생성'
              )}
            </button>
          </div>
            </form>

            {/* 생성된 SOAP 노트 */}
            {soapNote && currentStep === 'complete' && (
              <section className="soap-result">
                <div className="result-header">
                  <h2>생성된 SOAP 노트</h2>
                  <div className="result-actions">
                    <button
                      onClick={handleSaveNote}
                      className="save-button"
                      disabled={isLoading}
                    >
                      💾 저장
                    </button>
                    <button
                      onClick={() => navigate('/all-notes')}
                      className="view-all-button"
                    >
                      📚 모든 노트 보기
                    </button>
                  </div>
                </div>
                
                <div className="soap-sections">
                  <div className="soap-section subjective">
                    <h3>S (Subjective)</h3>
                    <div className="soap-content">{soapNote.subjective}</div>
                  </div>
                  <div className="soap-section objective">
                    <h3>O (Objective)</h3>
                    <div className="soap-content">{soapNote.objective}</div>
                  </div>
                  <div className="soap-section assessment">
                    <h3>A (Assessment)</h3>
                    <div className="soap-content">{soapNote.assessment}</div>
                  </div>
                  <div className="soap-section plan">
                    <h3>P (Plan)</h3>
                    <div className="soap-content">{soapNote.plan}</div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* AI 어시스턴트 사이드바 */}
          {showAIAssistant && selectedSpecialty && (
            <div className="ai-assistant-sidebar">
              <RealtimeAIAssistant
                specialty={selectedSpecialty}
                patientInfo={patientInfo}
                currentNotes={shorthandNotes}
                onSuggestionApply={handleAISuggestionApply}
                isVisible={showAIAssistant}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UnifiedSoapNotePage;