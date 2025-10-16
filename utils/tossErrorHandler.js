/**
 * 토스페이먼츠 에러 처리 유틸리티
 * 에러 코드별 상세한 처리 및 로깅
 */

const { getErrorMessage, getStatusMessage } = require('../config/tossPayments');

class TossErrorHandler {
  /**
   * 토스페이먼츠 에러 처리
   * @param {Error} error - 에러 객체
   * @param {string} context - 에러 발생 컨텍스트
   * @returns {Object} 처리된 에러 정보
   */
  static handleError(error, context = 'unknown') {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      originalError: error.message,
      userMessage: '결제 처리 중 오류가 발생했습니다.',
      retryable: false,
      logLevel: 'error'
    };

    // 토스페이먼츠 API 에러 응답 처리
    if (error.response?.data) {
      const tossError = error.response.data;
      errorInfo.tossErrorCode = tossError.code;
      errorInfo.tossErrorMessage = tossError.message;
      errorInfo.userMessage = getErrorMessage(tossError.code);
      errorInfo.retryable = this.isRetryableError(tossError.code);
      errorInfo.logLevel = this.getLogLevel(tossError.code);
    }

    // 네트워크 에러 처리
    if (error.code === 'ECONNABORTED') {
      errorInfo.userMessage = '결제 요청 시간이 초과되었습니다. 다시 시도해주세요.';
      errorInfo.retryable = true;
      errorInfo.logLevel = 'warn';
    }

    // 인증 에러 처리
    if (error.response?.status === 401) {
      errorInfo.userMessage = 'API 인증에 실패했습니다. 관리자에게 문의해주세요.';
      errorInfo.retryable = false;
      errorInfo.logLevel = 'error';
    }

    // 권한 에러 처리
    if (error.response?.status === 403) {
      errorInfo.userMessage = '자동결제 서비스 사용 권한이 없습니다.';
      errorInfo.retryable = false;
      errorInfo.logLevel = 'error';
    }

    // 서버 에러 처리
    if (error.response?.status >= 500) {
      errorInfo.userMessage = '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      errorInfo.retryable = true;
      errorInfo.logLevel = 'warn';
    }

    // 로깅
    this.logError(errorInfo);

    return errorInfo;
  }

  /**
   * 재시도 가능한 에러인지 확인
   * @param {string} errorCode - 토스페이먼츠 에러 코드
   * @returns {boolean} 재시도 가능 여부
   */
  static isRetryableError(errorCode) {
    const retryableErrors = [
      'INSUFFICIENT_BALANCE',      // 잔액 부족 (일시적)
      'CARD_LIMIT_EXCEEDED',      // 카드 한도 초과 (일시적)
      'TIMEOUT',                  // 타임아웃
      'NETWORK_ERROR',            // 네트워크 오류
      'SERVER_ERROR'              // 서버 오류
    ];

    return retryableErrors.includes(errorCode);
  }

  /**
   * 에러 로그 레벨 결정
   * @param {string} errorCode - 토스페이먼츠 에러 코드
   * @returns {string} 로그 레벨
   */
  static getLogLevel(errorCode) {
    const criticalErrors = [
      'UNAUTHORIZED_KEY',         // API 키 인증 실패
      'NOT_SUPPORTED_METHOD',     // 자동결제 계약 없음
      'INVALID_BILLING_KEY',      // 유효하지 않은 빌링키
      'BILLING_KEY_EXPIRED'       // 빌링키 만료
    ];

    return criticalErrors.includes(errorCode) ? 'error' : 'warn';
  }

  /**
   * 에러 로깅
   * @param {Object} errorInfo - 에러 정보
   */
  static logError(errorInfo) {
    const logMessage = {
      timestamp: errorInfo.timestamp,
      level: errorInfo.logLevel,
      context: errorInfo.context,
      message: errorInfo.originalError,
      tossError: errorInfo.tossErrorCode ? {
        code: errorInfo.tossErrorCode,
        message: errorInfo.tossErrorMessage
      } : null,
      retryable: errorInfo.retryable
    };

    if (errorInfo.logLevel === 'error') {
      console.error('❌ 토스페이먼츠 에러:', logMessage);
    } else if (errorInfo.logLevel === 'warn') {
      console.warn('⚠️ 토스페이먼츠 경고:', logMessage);
    } else {

    }
  }

  /**
   * 사용자 친화적인 에러 메시지 생성
   * @param {Object} errorInfo - 에러 정보
   * @returns {string} 사용자 메시지
   */
  static getUserMessage(errorInfo) {
    if (errorInfo.userMessage) {
      return errorInfo.userMessage;
    }

    // 기본 에러 메시지
    return '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }

  /**
   * 에러 응답 생성
   * @param {Object} errorInfo - 에러 정보
   * @returns {Object} HTTP 응답 객체
   */
  static createErrorResponse(errorInfo) {
    return {
      success: false,
      message: this.getUserMessage(errorInfo),
      error: {
        code: errorInfo.tossErrorCode || 'UNKNOWN_ERROR',
        message: errorInfo.originalError,
        retryable: errorInfo.retryable
      },
      timestamp: errorInfo.timestamp
    };
  }
}

module.exports = TossErrorHandler; 