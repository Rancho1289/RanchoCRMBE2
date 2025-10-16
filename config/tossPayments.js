/**
 * 토스페이먼츠 설정 관리
 * 환경변수를 통한 안전한 API 키 관리
 */

const config = {
  // API 키 설정
  clientKey: process.env.TOSS_CLIENT_KEY,
  secretKey: process.env.TOSS_SECRET_KEY,
  
  // API 엔드포인트
  endpoints: {
    billing: 'https://api.tosspayments.com/v1/billing',
    payments: 'https://api.tosspayments.com/v1/payments',
    billingAuth: 'https://api.tosspayments.com/v1/billing/authorizations/issue'
  },
  
  // 자동결제 설정
  billing: {
    maxRetries: parseInt(process.env.MAX_PAYMENT_RETRIES) || 3,
    retryDelay: parseInt(process.env.PAYMENT_RETRY_DELAY) || 300000, // 5분
    timeout: 30000 // 30초
  },
  
  // 에러 코드별 메시지
  errorMessages: {
    'NOT_MATCHES_CUSTOMER_KEY': '고객 정보가 일치하지 않습니다.',
    'UNAUTHORIZED_KEY': 'API 키 인증에 실패했습니다.',
    'NOT_SUPPORTED_METHOD': '자동결제 계약이 필요합니다.',
    'INVALID_REQUEST': '잘못된 요청입니다.',
    'PAY_PROCESS_CANCELED': '결제가 취소되었습니다.',
    'PAY_PROCESS_ABORTED': '결제가 중단되었습니다.',
    'REJECT_CARD_COMPANY': '카드 정보에 문제가 있습니다.',
    'INSUFFICIENT_BALANCE': '잔액이 부족합니다.',
    'CARD_EXPIRED': '카드가 만료되었습니다.',
    'CARD_LIMIT_EXCEEDED': '카드 한도를 초과했습니다.'
  },
  
  // 결제 상태별 메시지
  statusMessages: {
    'READY': '결제 대기 중',
    'IN_PROGRESS': '결제 진행 중',
    'WAITING_FOR_DEPOSIT': '입금 대기 중',
    'DONE': '결제 완료',
    'CANCELED': '결제 취소',
    'PARTIAL_CANCELED': '부분 취소',
    'ABORTED': '결제 실패',
    'EXPIRED': '결제 만료'
  }
};

// 환경변수 검증
const validateConfig = () => {
  const requiredKeys = ['TOSS_CLIENT_KEY', 'TOSS_SECRET_KEY'];
  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(`필수 환경변수가 설정되지 않았습니다: ${missingKeys.join(', ')}`);
  }
  
  return true;
};

// Basic 인증 헤더 생성
const createAuthHeader = () => {
  if (!config.secretKey) {
    throw new Error('TOSS_SECRET_KEY가 설정되지 않았습니다.');
  }
  
  return `Basic ${Buffer.from(config.secretKey + ':').toString('base64')}`;
};

// 에러 메시지 가져오기
const getErrorMessage = (errorCode) => {
  return config.errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
};

// 상태 메시지 가져오기
const getStatusMessage = (status) => {
  return config.statusMessages[status] || '알 수 없는 상태입니다.';
};

module.exports = {
  config,
  validateConfig,
  createAuthHeader,
  getErrorMessage,
  getStatusMessage
}; 