import React, { useState } from 'react';
import { PatientInfo, SoapNote } from '../types';
import '../App.css';

interface SoapNoteFormProps {
  noteType: string;
  onSubmit: (note: Partial<SoapNote>, language: string) => void;
  isLoading: boolean;
}

const SoapNoteForm: React.FC<SoapNoteFormProps> = ({ noteType, onSubmit, isLoading }) => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    visitDate: new Date().toISOString().split('T')[0]
  });
  
  const [notes, setNotes] = useState<string>('');
  const [language, setLanguage] = useState<string>('ko');
  
  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };
  
  const handleSubmit = () => {
    onSubmit({
      patientInfo,
      subjective: notes
    }, language);
  };
  
  const handleClear = () => {
    setNotes('');
    setPatientInfo({
      name: '',
      age: '',
      gender: '',
      visitDate: new Date().toISOString().split('T')[0]
    });
  };
  
  const handleCopy = () => {
    const textToCopy = `Patient: ${patientInfo.name}
Date: ${patientInfo.visitDate}
Notes: ${notes}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('내용이 클립보드에 복사되었습니다.');
      })
      .catch(err => {
        console.error('복사 실패:', err);
        alert('복사에 실패했습니다.');
      });
  };
  
  const handleDownload = () => {
    const textToDownload = `Patient: ${patientInfo.name}
Date: ${patientInfo.visitDate}
Type: ${noteType}
Notes: ${notes}`;
    
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOAP_Note_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleBaaClick = () => {
    alert('BAA 계약서 페이지로 이동합니다.');
    // 실제 구현에서는 BAA 계약서 페이지로 이동
  };
  
  const handleOfficeHoursClick = () => {
    alert('SOAP Note AI 오피스 아워 예약 페이지로 이동합니다.');
    // 실제 구현에서는 예약 페이지로 이동
  };
  
  const handleEmailClick = () => {
    window.location.href = 'mailto:support@soapnoteai.com';
  };
  
  const handleScheduleClick = () => {
    alert('상담 예약 페이지로 이동합니다.');
    // 실제 구현에서는 예약 페이지로 이동
  };
  
  const handleTermsClick = () => {
    alert('서비스 이용약관 페이지로 이동합니다.');
    // 실제 구현에서는 약관 페이지로 이동
  };
  
  const handlePrivacyClick = () => {
    alert('개인정보 처리방침 페이지로 이동합니다.');
    // 실제 구현에서는 개인정보 처리방침 페이지로 이동
  };
  
  return (
    <div className="soap-note-form">
      <h2>{noteType} SOAP Note</h2>
      
      <div className="form-controls">
        <button className="button new-btn" onClick={handleClear}>New</button>
        <button className="button copy-btn" onClick={handleCopy}>Copy</button>
        <button className="button download-btn" onClick={handleDownload}>Download</button>
      </div>
      
      <div className="patient-info">
        <div className="form-group">
          <label>Patient Name (Optional)</label>
          <input 
            type="text" 
            name="name"
            placeholder="e.g. John Smith"
            value={patientInfo.name}
            onChange={handlePatientInfoChange}
          />
        </div>
        
        <div className="form-group">
          <label>Date of Visit</label>
          <input 
            type="date" 
            name="visitDate"
            value={patientInfo.visitDate}
            onChange={handlePatientInfoChange}
          />
        </div>
      </div>
      
      <div className="hipaa-notice">
        <p>
          If you store or transmit PHI using SOAPNoteAI's platform, we provide and require all customers to sign a Business Associate Agreement (BAA) prior to using our services to ensure compliance with HIPAA regulations.
          To sign the BAA <button className="link-button" onClick={handleBaaClick}>click here</button>.
        </p>
      </div>
      
      <div className="help-links">
        <p>
          Need help or a demo? Sign up for SOAP Note AI office hours <button className="link-button" onClick={handleOfficeHoursClick}>here</button>.
          Need a custom template or format for your practice? <button className="link-button" onClick={handleEmailClick}>Email us</button> or <button className="link-button" onClick={handleScheduleClick}>schedule a call here</button>.
        </p>
      </div>
      
      <div className="note-input">
        <h3>Step 1. Enter your shorthand notes or a description of your case.</h3>
        <textarea 
          placeholder="e.g. 
CC: Intermittent sharp R knee pain; worsens w/ stairs & jogging.
HPI: Started 3 mos post-hiking. Increased severity. No known injury. OTC NSAIDs minimal relief.
Prev Interventions: 2 wks knee brace, mild support, pain persists. No prior PT.
Limitations: Difficulties w/ squats, kneeling, long walks. Avoiding jogging due to pain.
Goals: Return to regular jogging, pain-free outdoor activities."
          value={notes}
          onChange={handleNotesChange}
          rows={10}
        />
      </div>
      
      <div className="generate-notice">
        <p>
          By clicking "Start Note and Generate Subjective" button below, you agree to our <button className="link-button" onClick={handleTermsClick}>terms of service</button> and <button className="link-button" onClick={handlePrivacyClick}>privacy policy</button>. This action will use 1 Note.
        </p>
      </div>
      
      <button 
        className="button generate-btn" 
        onClick={handleSubmit}
        disabled={isLoading || !notes.trim()}
      >
        {isLoading ? '생성 중...' : 'Start Note and Generate Subjective'}
      </button>
      
      <div className="language-selector">
        <select value={language} onChange={handleLanguageChange}>
          <option value="en">English</option>
          <option value="ko">Korean</option>
        </select>
      </div>
    </div>
  );
};

export default SoapNoteForm; 