import React, { useState, useEffect, useRef } from 'react';
import { generateSoapNote } from '../services/openaiService';
import LoadingSpinner from './LoadingSpinner';
import '../styles/RealtimeAIAssistant.css';

interface RealtimeAIAssistantProps {
  specialty: string;
  patientInfo: {
    name: string;
    age: string;
    gender: string;
    visitDate: string;
  };
  currentNotes: string;
  onSuggestionApply: (suggestion: string) => void;
  isVisible: boolean;
}

interface AISuggestion {
  id: string;
  type: 'completion' | 'correction' | 'structure' | 'terminology';
  title: string;
  content: string;
  confidence: number;
  timestamp: Date;
}

const RealtimeAIAssistant: React.FC<RealtimeAIAssistantProps> = ({
  specialty,
  patientInfo,
  currentNotes,
  onSuggestionApply,
  isVisible
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'auto' | 'manual'>('auto');
  const [lastAnalyzedNotes, setLastAnalyzedNotes] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 실시간 AI 분석 (디바운싱)
  useEffect(() => {
    if (!isVisible || !currentNotes || currentNotes === lastAnalyzedNotes) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (assistantMode === 'auto' && currentNotes.length > 20) {
      debounceTimerRef.current = setTimeout(() => {
        analyzeNotesForSuggestions();
      }, 2000); // 2초 디바운싱
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentNotes, assistantMode, isVisible]);

  const analyzeNotesForSuggestions = async () => {
    if (isAnalyzing || currentNotes === lastAnalyzedNotes) return;

    setIsAnalyzing(true);
    setLastAnalyzedNotes(currentNotes);

    try {
      const newSuggestions = await generateAISuggestions(currentNotes);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('AI 분석 실패:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAISuggestions = async (notes: string): Promise<AISuggestion[]> => {
    const suggestions: AISuggestion[] = [];

    // 1. 문장 완성 제안
    if (notes.endsWith(' ') || notes.endsWith('.')) {
      const completion = await getCompletionSuggestion(notes);
      if (completion) {
        suggestions.push({
          id: `completion-${Date.now()}`,
          type: 'completion',
          title: '문장 완성 제안',
          content: completion,
          confidence: 0.8,
          timestamp: new Date()
        });
      }
    }

    // 2. 의학 용어 교정
    const corrections = await getTerminologyCorrections(notes);
    corrections.forEach((correction, index) => {
      suggestions.push({
        id: `correction-${Date.now()}-${index}`,
        type: 'correction',
        title: '의학 용어 교정',
        content: correction,
        confidence: 0.9,
        timestamp: new Date()
      });
    });

    // 3. SOAP 구조 제안
    if (notes.length > 100) {
      const structureSuggestion = await getStructureSuggestion(notes);
      if (structureSuggestion) {
        suggestions.push({
          id: `structure-${Date.now()}`,
          type: 'structure',
          title: 'SOAP 구조 개선',
          content: structureSuggestion,
          confidence: 0.7,
          timestamp: new Date()
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  };

  const getCompletionSuggestion = async (notes: string): Promise<string | null> => {
    try {
      // 마지막 문장 분석하여 다음 가능한 내용 제안
      const lastSentence = notes.split('.').pop()?.trim() || '';
      
      if (lastSentence.length < 10) return null;

      // 간단한 패턴 기반 제안 (실제로는 OpenAI API 사용)
      const commonPatterns = {
        '환자는': '호소하고 있습니다.',
        '증상은': '으로 확인됩니다.',
        '검사 결과': '를 보였습니다.',
        '치료 계획은': '으로 진행하겠습니다.',
        '환자에게': '를 설명드렸습니다.'
      };

      for (const [pattern, completion] of Object.entries(commonPatterns)) {
        if (lastSentence.includes(pattern)) {
          return completion;
        }
      }

      return null;
    } catch (error) {
      console.error('완성 제안 생성 실패:', error);
      return null;
    }
  };

  const getTerminologyCorrections = async (notes: string): Promise<string[]> => {
    const corrections: string[] = [];
    
    // 일반적인 의학 용어 교정 패턴
    const corrections_map = {
      '아파요': '통증을 호소합니다',
      '아픈': '통증이 있는',
      '많이 아픈': '심한 통증의',
      '조금 아픈': '경미한 통증의',
      '머리가 아픈': '두통을 호소하는',
      '배가 아픈': '복통을 호소하는',
      '다리가 아픈': '하지 통증을 호소하는'
    };

    for (const [informal, formal] of Object.entries(corrections_map)) {
      if (notes.includes(informal)) {
        corrections.push(`"${informal}" → "${formal}"`);
      }
    }

    return corrections;
  };

  const getStructureSuggestion = async (notes: string): Promise<string | null> => {
    // SOAP 구조 분석
    const hasSubjective = /주관적|주소|호소|증상/.test(notes);
    const hasObjective = /객관적|검사|활력징후|관찰/.test(notes);
    const hasAssessment = /평가|진단|소견/.test(notes);
    const hasPlan = /계획|치료|처방|교육/.test(notes);

    const missing = [];
    if (!hasSubjective) missing.push('주관적 정보(S)');
    if (!hasObjective) missing.push('객관적 정보(O)');
    if (!hasAssessment) missing.push('평가(A)');
    if (!hasPlan) missing.push('계획(P)');

    if (missing.length > 0) {
      return `SOAP 구조 완성을 위해 다음 항목을 추가해보세요: ${missing.join(', ')}`;
    }

    return null;
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    if (suggestion.type === 'completion') {
      onSuggestionApply(currentNotes + ' ' + suggestion.content);
    } else if (suggestion.type === 'correction') {
      // 교정 제안 적용
      const correctionParts = suggestion.content.split(' → ');
      if (correctionParts.length === 2) {
        const [from, to] = correctionParts.map(part => part.replace(/"/g, ''));
        onSuggestionApply(currentNotes.replace(from, to));
      }
    } else {
      // 구조 제안은 텍스트 끝에 추가
      onSuggestionApply(currentNotes + '\\n\\n' + suggestion.content);
    }

    // 적용한 제안 제거
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'completion': return '✨';
      case 'correction': return '📝';
      case 'structure': return '📋';
      case 'terminology': return '🔬';
      default: return '💡';
    }
  };

  const getSuggestionColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10b981'; // green
    if (confidence >= 0.6) return '#f59e0b'; // amber
    return '#6b7280'; // gray
  };

  if (!isVisible) return null;

  return (
    <div className="realtime-ai-assistant">
      <div className="assistant-header">
        <div className="assistant-title">
          <span className="assistant-icon">🤖</span>
          <h3>AI 실시간 도움</h3>
          {isAnalyzing && (
            <LoadingSpinner size="small" />
          )}
        </div>
        
        <div className="assistant-controls">
          <label className="mode-switch">
            <input
              type="checkbox"
              checked={assistantMode === 'auto'}
              onChange={(e) => setAssistantMode(e.target.checked ? 'auto' : 'manual')}
            />
            <span className="mode-label">자동 분석</span>
          </label>
          
          {assistantMode === 'manual' && (
            <button
              onClick={analyzeNotesForSuggestions}
              className="analyze-btn"
              disabled={isAnalyzing}
            >
              분석하기
            </button>
          )}
        </div>
      </div>

      <div className="suggestions-container">
        {suggestions.length === 0 && !isAnalyzing && (
          <div className="no-suggestions">
            <p>💡 작성하시면 실시간으로 AI가 도움을 드립니다</p>
            <ul className="help-tips">
              <li>문장 완성 제안</li>
              <li>의학 용어 교정</li>
              <li>SOAP 구조 개선</li>
            </ul>
          </div>
        )}

        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-type">
                <span className="suggestion-icon">
                  {getSuggestionIcon(suggestion.type)}
                </span>
                <span className="suggestion-title">{suggestion.title}</span>
              </div>
              <div 
                className="confidence-indicator"
                style={{ backgroundColor: getSuggestionColor(suggestion.confidence) }}
              >
                {Math.round(suggestion.confidence * 100)}%
              </div>
            </div>
            
            <div className="suggestion-content">
              {suggestion.content}
            </div>
            
            <div className="suggestion-actions">
              <button
                onClick={() => applySuggestion(suggestion)}
                className="apply-btn"
              >
                적용
              </button>
              <button
                onClick={() => dismissSuggestion(suggestion.id)}
                className="dismiss-btn"
              >
                무시
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAnalyzing && (
        <div className="analyzing-indicator">
          <LoadingSpinner size="small" />
          <span>AI가 분석 중입니다...</span>
        </div>
      )}
    </div>
  );
};

export default RealtimeAIAssistant;