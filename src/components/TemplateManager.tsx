import React, { useState, useEffect, useRef } from 'react';
import { Template, TemplateFormData } from '../types';
import { createTemplate, getTemplates, uploadTemplateFile } from '../services/templateService';
import '../styles/TemplateManager.css';

interface TemplateManagerProps {
  profession: string;
  specialty: string;
  onTemplateSelect: (template: Template) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  profession,
  specialty,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    profession,
    specialty,
    format: '',
    example: ''
  });

  useEffect(() => {
    loadTemplates();
  }, [profession, specialty]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const loadedTemplates = await getTemplates(profession, specialty);
      setTemplates(loadedTemplates);
    } catch (err) {
      setError('템플릿을 불러오는 중 오류가 발생했습니다.');
      console.error('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await createTemplate(formData);
      setShowForm(false);
      setFormData({
        name: '',
        profession,
        specialty,
        format: '',
        example: ''
      });
      await loadTemplates();
    } catch (err) {
      setError('템플릿 생성 중 오류가 발생했습니다.');
      console.error('Error creating template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const fileUrl = await uploadTemplateFile(file);
      
      // 파일 내용 읽기
      const text = await file.text();
      
      setFormData(prev => ({
        ...prev,
        format: text
      }));
    } catch (err) {
      setError('파일 업로드 중 오류가 발생했습니다.');
      console.error('Error uploading file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="template-manager">
      <div className="template-header">
        <h2>SOAP 노트 템플릿</h2>
        <button
          className="add-template-button"
          onClick={() => setShowForm(true)}
        >
          새 템플릿 추가
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={handleFormSubmit} className="template-form">
          <div className="form-group">
            <label htmlFor="name">템플릿 이름</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="format">SOAP 노트 형식</label>
            <div className="format-input-container">
              <textarea
                id="format"
                value={formData.format}
                onChange={e => setFormData(prev => ({ ...prev, format: e.target.value }))}
                placeholder="SOAP 노트 형식을 입력하거나 파일을 업로드하세요..."
                required
              />
              <div className="upload-button">
                <input
                  type="file"
                  accept=".txt,.doc,.docx"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  파일 업로드
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="example">예시 SOAP 노트</label>
            <textarea
              id="example"
              value={formData.example}
              onChange={e => setFormData(prev => ({ ...prev, example: e.target.value }))}
              placeholder="예시 SOAP 노트를 입력하세요..."
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? '저장 중...' : '템플릿 저장'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      <div className="templates-list">
        {isLoading ? (
          <div className="loading">템플릿 로딩 중...</div>
        ) : templates.length > 0 ? (
          templates.map(template => (
            <div
              key={template.id}
              className="template-item"
              onClick={() => onTemplateSelect(template)}
            >
              <h3>{template.name}</h3>
              <p className="template-preview">{template.format.substring(0, 100)}...</p>
              <div className="template-meta">
                <span>생성일: {new Date(template.createdAt).toLocaleDateString()}</span>
                <span>수정일: {new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-templates">
            저장된 템플릿이 없습니다. 새로운 템플릿을 추가해주세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager; 