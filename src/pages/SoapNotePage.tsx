import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateSoapNote } from '../services/openaiService';
import { startRecording, stopRecording } from '../services/audioService';
import { Template, PatientInfo } from '../types';
import '../styles/SoapNotePage.css';
import TemplateManager from '../components/TemplateManager';

const SoapNotePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const profession = searchParams.get('profession') || '';
  const specialty = searchParams.get('specialty') || '';
  const method = searchParams.get('method') || 'text';
  
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

  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateSoapNote({
        noteType: specialty,
        patientInfo,
        shorthandNotes: shorthandNotes || transcribedText,
        language: 'ko',
        template: selectedTemplate?.format // 템플릿 형식 전달
      });
      setSoapNote(result);
    } catch (err) {
      setError('SOAP 노트 생성 중 오류가 발생했습니다.');
      console.error('Error generating SOAP note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="soap-note-page">
      <header className="page-header">
        <h1>{specialty} SOAP 노트 작성</h1>
        <p>{profession} | {method === 'text' ? '텍스트' : '음성'} 입력</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <TemplateManager
        profession={profession}
        specialty={specialty}
        onTemplateSelect={handleTemplateSelect}
      />

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
                onChange={handlePatientInfoChange as any}
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
          {method === 'voice' ? (
            <div className="voice-input">
              <div className="voice-controls">
                <button
                  type="button"
                  className={`record-button ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                >
                  {isRecording ? '녹음 중지' : '녹음 시작'} 🎙️
                </button>
                <div className="upload-button">
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
                    className="upload-audio-button"
                  >
                    오디오 파일 업로드 📁
                  </button>
                </div>
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
          ) : null}
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
            {isLoading ? '생성 중...' : 'SOAP 노트 생성'}
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