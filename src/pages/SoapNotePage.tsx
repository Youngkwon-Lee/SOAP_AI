import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateSoapNote } from '../services/openaiService';
import { startRecording, stopRecording } from '../services/audioService';
import { Template, PatientInfo } from '../types';
import '../styles/SoapNotePage.css';
import TemplateManager from '../components/TemplateManager';
import SpecialtySelector from '../components/SpecialtySelector';
import PersonalizationDashboard from '../components/PersonalizationDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts, createSoapNoteShortcuts } from '../hooks/useKeyboardShortcuts';
import { getTemplateBySpecialty } from '../services/defaultTemplates';
import { analyzeAndStorePattern } from '../services/personalizationEngine';

const SoapNotePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const profession = searchParams.get('profession') || 'doctor';
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');
  const method = searchParams.get('method') || 'text';
  
  const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en' | 'medical'>('ko');
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    gender: '',
    visitDate: new Date().toISOString().split('T')[0]
  });
  const [shorthandNotes, setShorthandNotes] = useState('');
  const [soapNote, setSoapNote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // 자동 저장 데이터 타입 정의
  interface AutoSaveData {
    patientInfo: typeof patientInfo;
    shorthandNotes: string;
    selectedTemplate: Template | null;
  }

  // 자동 저장 설정
  const autoSaveData: AutoSaveData = {
    patientInfo,
    shorthandNotes,
    selectedTemplate
  };

  const { loadFromLocal, clearLocal, hasSavedData } = useAutoSave(autoSaveData, {
    key: `soap-note-${profession}-${selectedSpecialty}`,
    delay: 3000,
    enabled: true
  });

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

  const handleStartRecording = async () => {
    try {
      setError(null);
      await startRecording();
      setIsRecording(true);
    } catch (err) {
      setError('녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.');
      console.error('Recording error:', err);
    }
  };

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording();
      setAudioBlob(blob);
      setIsRecording(false);
      
      // 자동으로 STT 시작
      await handleTranscribe(blob);
    } catch (err) {
      setError('녹음을 중지하는 중 오류가 발생했습니다.');
      console.error('Stop recording error:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'audio/mp3' && file.type !== 'audio/wav' && file.type !== 'audio/mpeg') {
        setError('지원되지 않는 파일 형식입니다. MP3 또는 WAV 파일을 업로드해주세요.');
        return;
      }
      setUploadedFile(file);
      await handleTranscribe(file);
    }
  };

  const handleTranscribe = async (audioData: Blob | File) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', audioData);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ko');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('음성을 텍스트로 변환하는데 실패했습니다.');
      }

      const data = await response.json();
      setTranscribedText(data.text);
      setShorthandNotes(data.text); // 텍스트 영역에 자동으로 설정
    } catch (err) {
      setError('음성을 텍스트로 변환하는 중 오류가 발생했습니다.');
      console.error('Transcription error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // 선택된 템플릿의 형식을 기반으로 SOAP 노트 생성 로직 수정
    setShorthandNotes(template.example);
  };

  // 저장된 데이터 복원
  useEffect(() => {
    if (hasSavedData()) {
      const savedData = loadFromLocal();
      if (savedData && window.confirm('이전에 작성 중이던 내용이 있습니다. 복원하시겠습니까?')) {
        setPatientInfo(savedData.patientInfo);
        setShorthandNotes(savedData.shorthandNotes);
        setSelectedTemplate(savedData.selectedTemplate);
      }
    }
  }, [hasSavedData, loadFromLocal]);

  // 키보드 단축키 설정
  const shortcuts = createSoapNoteShortcuts({
    generate: () => {
      if (!isLoading && patientInfo.name && shorthandNotes) {
        handleSubmit(new Event('submit') as any);
      }
    },
    clear: () => {
      if (window.confirm('작성 중인 내용을 모두 지우시겠습니까?')) {
        setPatientInfo({
          name: '',
          age: '',
          gender: '',
          visitDate: new Date().toISOString().split('T')[0]
        });
        setShorthandNotes('');
        setSoapNote(null);
        clearLocal();
      }
    },
    toggleRecording: () => {
      if (method === 'voice') {
        if (isRecording) {
          handleStopRecording();
        } else {
          handleStartRecording();
        }
      }
    }
  });

  const { getShortcutHelp } = useKeyboardShortcuts(shortcuts, { enabled: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
      
      // SOAP 노트 생성 성공 시 개인화 패턴 학습
      if (result && selectedSpecialty) {
        try {
          await analyzeAndStorePattern(result, selectedSpecialty);
          console.log('✅ 개인화 패턴 학습 완료');
        } catch (patternError) {
          console.error('개인화 패턴 학습 실패:', patternError);
          // 학습 실패해도 SOAP 노트 생성은 성공으로 처리
        }
      }
      
      // SOAP 노트 생성 성공 시 자동 저장 데이터 삭제
      clearLocal();
    } catch (err) {
      setError('SOAP 노트 생성 중 오류가 발생했습니다.');
      console.error('Error generating SOAP note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="soap-note-page">
      {isLoading && <LoadingSpinner overlay message="SOAP 노트를 생성하고 있습니다..." />}
      
      <header className="page-header">
        <h1>{selectedSpecialty} SOAP 노트 작성</h1>
        <p>{profession} | {method === 'text' ? '텍스트' : '음성'} 입력</p>
        <div className="header-controls">
          <button 
            type="button" 
            onClick={() => setShowShortcutHelp(!showShortcutHelp)}
            className="shortcut-help-button"
            title="키보드 단축키 도움말"
          >
            ⌨️ 단축키
          </button>
          
          <div className="language-selector">
            <label htmlFor="language">출력 언어:</label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'ko' | 'en' | 'medical')}
              className="language-dropdown"
            >
              <option value="ko">🇰🇷 한국어</option>
              <option value="en">🇺🇸 English</option>
              <option value="medical">🏥 Medical Terms</option>
            </select>
          </div>
        </div>
      </header>

      {selectedLanguage === 'medical' && (
        <div className="language-info medical-info">
          <p>📋 <strong>의학용어 모드:</strong> 의료진용 표준 약어와 영어 의학용어로 간결하게 작성됩니다.</p>
        </div>
      )}
      {selectedLanguage === 'en' && (
        <div className="language-info english-info">
          <p>🇺🇸 <strong>English Mode:</strong> SOAP note will be generated in English for international standards.</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

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
          // 전문과 변경 시 해당 기본 템플릿 자동 선택
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

      <TemplateManager
        profession={profession}
        specialty={selectedSpecialty}
        onTemplateSelect={handleTemplateSelect}
      />

      {selectedSpecialty && (
        <PersonalizationDashboard
          specialty={selectedSpecialty}
          onTemplateGenerated={(template) => {
            setSelectedTemplate(template);
            alert('개인 맞춤 템플릿이 적용되었습니다!');
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="soap-form">
        <section className="patient-info-section">
          <h2>환자 정보</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">이름</label>
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
              <label htmlFor="age">나이</label>
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
              <label htmlFor="gender">성별</label>
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
              <label htmlFor="visitDate">방문일</label>
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

        <section className="notes-section">
          <h2>진료 노트</h2>
          {method === 'voice' && (
            <div className="voice-input">
              <div className="voice-controls">
                <button
                  type="button"
                  className={`record-button ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                >
                  {isRecording ? '녹음 중지' : '녹음 시작'} 🎙️
                </button>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  id="audio-upload"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="record-button upload"
                >
                  오디오 파일 업로드 📁
                </button>
              </div>
              {isRecording && <div className="recording-indicator">녹음 중...</div>}
              {(audioBlob || uploadedFile) && (
                <div className="audio-preview">
                  <p>
                    {uploadedFile ? `파일: ${uploadedFile.name}` : '녹음된 오디오'}
                  </p>
                  {audioBlob && (
                    <audio controls src={URL.createObjectURL(audioBlob)} />
                  )}
                </div>
              )}
            </div>
          )}
          <textarea
            value={shorthandNotes}
            onChange={handleNotesChange}
            placeholder={method === 'voice' ? '음성이 텍스트로 변환되면 여기에 표시됩니다...' : '진료 내용을 자유롭게 작성하세요...'}
            required
          />
        </section>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="small" message="" />
                생성 중...
              </>
            ) : (
              'SOAP 노트 생성'
            )}
          </button>
        </div>
      </form>

      {soapNote && (
        <section className="soap-result">
          <h2>생성된 SOAP 노트</h2>
          <div className="soap-sections">
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
        </section>
      )}
    </div>
  );
};

export default SoapNotePage; 