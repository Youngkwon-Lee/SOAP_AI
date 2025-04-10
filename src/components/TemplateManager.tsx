import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Template, TemplateFormData } from '../types';
import { createTemplate, getTemplates, uploadTemplateFile } from '../services/templateService';
import '../styles/TemplateManager.css';

interface TemplateManagerProps {
  profession: string;
  specialty: string;
  onTemplateSelect: (template: Template) => void;
}

interface LoadingState {
  templates: boolean;
  creation: boolean;
  fileUpload: boolean;
}

interface ErrorState {
  message: string;
  code?: string;
  action?: () => void;
  actionText?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['.txt', '.doc', '.docx'];

const TemplateManager: React.FC<TemplateManagerProps> = ({
  profession,
  specialty,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    templates: false,
    creation: false,
    fileUpload: false
  });
  const [error, setError] = useState<ErrorState | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    profession,
    specialty,
    format: '',
    example: ''
  });

  const resetFormData = useCallback(() => {
    setFormData({
      name: '',
      profession,
      specialty,
      format: '',
      example: ''
    });
  }, [profession, specialty]);

  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      setError({
        message: '템플릿 이름을 입력해주세요.',
        code: 'INVALID_NAME'
      });
      return false;
    }
    if (!formData.format.trim()) {
      setError({
        message: 'SOAP 노트 형식을 입력해주세요.',
        code: 'INVALID_FORMAT'
      });
      return false;
    }
    if (!formData.example.trim()) {
      setError({
        message: '예시 SOAP 노트를 입력해주세요.',
        code: 'INVALID_EXAMPLE'
      });
      return false;
    }
    return true;
  }, [formData]);

  const loadTemplates = async () => {
    try {
      setLoading(prev => ({ ...prev, templates: true }));
      setError(null);
      const loadedTemplates = await getTemplates(profession, specialty);
      setTemplates(loadedTemplates);
    } catch (err) {
      setError({
        message: '템플릿을 불러오는 중 오류가 발생했습니다.',
        code: 'LOAD_ERROR',
        action: loadTemplates,
        actionText: '다시 시도'
      });
      console.error('Error loading templates:', err);
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [profession, specialty]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(prev => ({ ...prev, creation: true }));
      setError(null);
      await createTemplate(formData);
      setShowForm(false);
      resetFormData();
      await loadTemplates();
    } catch (err) {
      setError({
        message: '템플릿 생성 중 오류가 발생했습니다.',
        code: 'CREATE_ERROR',
        action: () => handleFormSubmit(e),
        actionText: '다시 시도'
      });
      console.error('Error creating template:', err);
    } finally {
      setLoading(prev => ({ ...prev, creation: false }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      setError({
        message: '파일 크기는 5MB를 초과할 수 없습니다.',
        code: 'FILE_SIZE_ERROR'
      });
      return;
    }

    // 파일 타입 검증
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      setError({
        message: '지원하지 않는 파일 형식입니다. (.txt, .doc, .docx 파일만 허용됩니다)',
        code: 'FILE_TYPE_ERROR'
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, fileUpload: true }));
      setError(null);
      const fileUrl = await uploadTemplateFile(file);
      const text = await file.text();
      setFormData(prev => ({
        ...prev,
        format: text
      }));
    } catch (err) {
      setError({
        message: '파일 업로드 중 오류가 발생했습니다.',
        code: 'UPLOAD_ERROR',
        action: () => handleFileUpload(e),
        actionText: '다시 시도'
      });
      console.error('Error uploading file:', err);
    } finally {
      setLoading(prev => ({ ...prev, fileUpload: false }));
    }
  };

  // 템플릿 아이템 컴포넌트
  const TemplateItem = useMemo(() => {
    return ({ template }: { template: Template }) => (
      <div
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
    );
  }, [onTemplateSelect]);

  return (
    <div className="template-manager">
      <div className="template-header">
        <h2>SOAP 노트 템플릿</h2>
        <button
          className="add-template-button"
          onClick={() => setShowForm(true)}
          disabled={loading.templates}
        >
          새 템플릿 추가
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error.message}</p>
          {error.action && (
            <button onClick={error.action}>
              {error.actionText || '다시 시도'}
            </button>
          )}
        </div>
      )}

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
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading.fileUpload}
                >
                  {loading.fileUpload ? '업로드 중...' : '파일 업로드'}
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
            <button type="submit" disabled={loading.creation}>
              {loading.creation ? '저장 중...' : '템플릿 저장'}
            </button>
            <button type="button" onClick={() => {
              setShowForm(false);
              resetFormData();
              setError(null);
            }}>
              취소
            </button>
          </div>
        </form>
      )}

      <div className="templates-list">
        {loading.templates ? (
          <div className="loading">템플릿 로딩 중...</div>
        ) : templates.length > 0 ? (
          templates.map(template => (
            <TemplateItem key={template.id} template={template} />
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