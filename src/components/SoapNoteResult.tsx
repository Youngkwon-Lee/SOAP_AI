import React from 'react';
import { SoapNote } from '../types';
import '../App.css';

interface SoapNoteResultProps {
  soapNote: Partial<SoapNote>;
}

const SoapNoteResult: React.FC<SoapNoteResultProps> = ({ soapNote }) => {
  const { subjective, objective, assessment, plan } = soapNote;
  
  return (
    <div className="soap-note-result">
      {subjective && (
        <div className="result-section">
          <h3>Step 2. Subjective</h3>
          <div className="content-box">
            <p>{subjective}</p>
          </div>
        </div>
      )}
      
      {objective && (
        <div className="result-section">
          <h3>Step 3. Objective</h3>
          <div className="content-box">
            <p>{objective}</p>
          </div>
        </div>
      )}
      
      {assessment && (
        <div className="result-section">
          <h3>Step 4. Assessment</h3>
          <div className="content-box">
            <p>{assessment}</p>
          </div>
        </div>
      )}
      
      {plan && (
        <div className="result-section">
          <h3>Step 5. Plan</h3>
          <div className="content-box">
            <p>{plan}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoapNoteResult; 