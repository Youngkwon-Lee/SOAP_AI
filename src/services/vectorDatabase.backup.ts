import { Pinecone } from '@pinecone-database/pinecone';

// Pinecone 설정
const PINECONE_API_KEY = process.env.REACT_APP_PINECONE_API_KEY || '';
const INDEX_NAME = 'soap-ai-personalization';

let pineconeClient: Pinecone | null = null;

/**
 * Pinecone 클라이언트 초기화
 */
const initializePinecone = async (): Promise<Pinecone> => {
  if (!pineconeClient) {
    if (!PINECONE_API_KEY) {
      console.warn('⚠️ PINECONE_API_KEY가 설정되지 않았습니다. Vector DB 기능이 비활성화됩니다.');
      throw new Error('PINECONE_API_KEY가 설정되지 않았습니다.');
    }

    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    console.log('✅ Pinecone 클라이언트 초기화 완료');
  }
  
  return pineconeClient;
};

/**
 * OpenAI Embedding API를 사용하여 텍스트를 벡터로 변환
 */
const textToVector = async (text: string): Promise<number[]> => {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI Embedding API 오류: ${response.status}`);
    }

    const data = await response.json();
    let embedding = data.data[0].embedding;
    
    // Pinecone 인덱스가 2048 차원인 경우 패딩 추가
    const TARGET_DIMENSION = 2048;
    if (embedding.length < TARGET_DIMENSION) {
      const padding = new Array(TARGET_DIMENSION - embedding.length).fill(0);
      embedding = [...embedding, ...padding];
    }
    
    return embedding;
  } catch (error) {
    console.error('텍스트 벡터화 실패:', error);
    throw error;
  }
};

// [원본 파일의 나머지 함수들...]
// 백업 목적으로 저장됨 