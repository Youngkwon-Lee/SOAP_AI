import React, { Component, ErrorInfo, ReactNode } from 'react';
import '../styles/ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 여기에 에러 로깅 서비스 연동 가능 (예: Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-container">
            <h1>⚠️ 문제가 발생했습니다</h1>
            <p>예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            
            <div className="error-actions">
              <button 
                onClick={this.handleReload}
                className="button button-primary"
              >
                페이지 새로고침
              </button>
              <button 
                onClick={this.handleGoHome}
                className="button button-secondary"
              >
                홈으로 돌아가기
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>개발자 정보</summary>
                <pre>{this.state.error?.stack}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
          </div>


        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 