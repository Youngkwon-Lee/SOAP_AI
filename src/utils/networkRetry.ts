interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
}

/**
 * 지수 백오프를 사용한 네트워크 재시도 유틸리티
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = (error) => {
      // 네트워크 오류나 일시적 서버 오류인 경우 재시도
      if (error?.name === 'NetworkError') return true;
      if (error?.code === 'NETWORK_ERROR') return true;
      if (error?.status >= 500 && error?.status < 600) return true; // 5xx 서버 오류
      if (error?.status === 429) return true; // Too Many Requests
      if (error?.status === 408) return true; // Request Timeout
      return false;
    },
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt + 1
      };
    } catch (error) {
      lastError = error;
      
      // 마지막 시도이거나 재시도 조건에 맞지 않으면 실패 반환
      if (attempt === maxRetries || !retryCondition(error)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt + 1
        };
      }

      // 재시도 콜백 호출
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // 지수 백오프 계산 (jitter 포함)
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
      const delay = exponentialDelay + jitter;

      console.log(`🔄 재시도 ${attempt + 1}/${maxRetries} - ${delay.toFixed(0)}ms 후 재시도`);
      
      // 지연 후 재시도
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxRetries + 1
  };
}

/**
 * OpenAI API 호출을 위한 특별한 재시도 로직
 */
export async function retryOpenAIRequest<T>(
  operation: () => Promise<T>,
  customOptions?: Partial<RetryOptions>
): Promise<T> {
  const result = await retryWithBackoff(operation, {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    retryCondition: (error) => {
      // OpenAI API 특정 에러 코드 처리
      if (error?.status === 429) return true; // Rate limit
      if (error?.status === 500) return true; // Internal server error
      if (error?.status === 502) return true; // Bad gateway
      if (error?.status === 503) return true; // Service unavailable
      if (error?.status === 504) return true; // Gateway timeout
      if (error?.code === 'ENOTFOUND') return true; // DNS 오류
      if (error?.code === 'ECONNRESET') return true; // 연결 재설정
      if (error?.code === 'ETIMEDOUT') return true; // 타임아웃
      return false;
    },
    onRetry: (attempt, error) => {
      console.warn(`🤖 OpenAI API 재시도 ${attempt}회 - 오류:`, error?.message || error);
    },
    ...customOptions
  });

  if (!result.success) {
    throw result.error;
  }

  return result.data!;
}

/**
 * Firebase API 호출을 위한 재시도 로직
 */
export async function retryFirebaseRequest<T>(
  operation: () => Promise<T>,
  customOptions?: Partial<RetryOptions>
): Promise<T> {
  const result = await retryWithBackoff(operation, {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    retryCondition: (error) => {
      // Firebase 특정 에러 처리
      if (error?.code === 'unavailable') return true;
      if (error?.code === 'deadline-exceeded') return true;
      if (error?.code === 'internal') return true;
      if (error?.code === 'resource-exhausted') return true;
      return false;
    },
    onRetry: (attempt, error) => {
      console.warn(`🔥 Firebase 재시도 ${attempt}회 - 오류:`, error?.message || error);
    },
    ...customOptions
  });

  if (!result.success) {
    throw result.error;
  }

  return result.data!;
}

/**
 * 일반적인 네트워크 요청 상태 확인
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.name === 'NetworkError' ||
    error?.code === 'NETWORK_ERROR' ||
    error?.code === 'ENOTFOUND' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('fetch')
  );
}

/**
 * 서버 오류 상태 확인
 */
export function isServerError(error: any): boolean {
  return error?.status >= 500 && error?.status < 600;
}

/**
 * 재시도 가능한 오류인지 확인
 */
export function isRetryableError(error: any): boolean {
  return isNetworkError(error) || isServerError(error) || error?.status === 429;
} 