/**
 * 로깅 및 모니터링 시스템
 * 구조화된 로깅과 성능 모니터링
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  /**
   * 로그 디렉토리 생성
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 로그 파일 경로 생성
   * @param {string} level - 로그 레벨
   * @returns {string} 로그 파일 경로
   */
  getLogFilePath(level) {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level}-${today}.log`);
  }

  /**
   * 로그 메시지 포맷팅
   * @param {string} level - 로그 레벨
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   * @returns {string} 포맷된 로그 메시지
   */
  formatLogMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data,
      pid: process.pid,
      memory: process.memoryUsage()
    };

    return JSON.stringify(logEntry);
  }

  /**
   * 로그 파일에 쓰기
   * @param {string} filePath - 로그 파일 경로
   * @param {string} message - 로그 메시지
   */
  writeToFile(filePath, message) {
    try {
      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
      console.error('❌ 로그 파일 쓰기 오류:', error);
    }
  }

  /**
   * 콘솔에 로그 출력
   * @param {string} level - 로그 레벨
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  logToConsole(level, message, data) {
    const timestamp = new Date().toISOString();
    const emoji = this.getLevelEmoji(level);
    
    console.log(`${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('📊 데이터:', data);
    }
  }

  /**
   * 로그 레벨별 이모지
   * @param {string} level - 로그 레벨
   * @returns {string} 이모지
   */
  getLevelEmoji(level) {
    const emojis = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍',
      success: '✅'
    };
    return emojis[level] || '📝';
  }

  /**
   * 에러 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  error(message, data = {}) {
    const logMessage = this.formatLogMessage('error', message, data);
    this.writeToFile(this.getLogFilePath('error'), logMessage);
    this.logToConsole('error', message, data);
  }

  /**
   * 경고 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  warn(message, data = {}) {
    const logMessage = this.formatLogMessage('warn', message, data);
    this.writeToFile(this.getLogFilePath('warn'), logMessage);
    this.logToConsole('warn', message, data);
  }

  /**
   * 정보 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  info(message, data = {}) {
    const logMessage = this.formatLogMessage('info', message, data);
    this.writeToFile(this.getLogFilePath('info'), logMessage);
    this.logToConsole('info', message, data);
  }

  /**
   * 디버그 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatLogMessage('debug', message, data);
      this.writeToFile(this.getLogFilePath('debug'), logMessage);
      this.logToConsole('debug', message, data);
    }
  }

  /**
   * 성공 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  success(message, data = {}) {
    const logMessage = this.formatLogMessage('success', message, data);
    this.writeToFile(this.getLogFilePath('success'), logMessage);
    this.logToConsole('success', message, data);
  }

  /**
   * 결제 관련 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 결제 데이터
   */
  payment(message, data = {}) {
    const logMessage = this.formatLogMessage('payment', message, data);
    this.writeToFile(this.getLogFilePath('payment'), logMessage);
    this.logToConsole('info', `💳 ${message}`, data);
  }



  /**
   * 성능 측정 시작
   * @param {string} operation - 작업명
   * @returns {string} 측정 ID
   */
  startTimer(operation) {
    const id = `${operation}_${Date.now()}`;
    this.timers = this.timers || new Map();
    this.timers.set(id, process.hrtime.bigint());
    
    this.debug(`⏱️ 타이머 시작: ${operation}`, { id });
    return id;
  }

  /**
   * 성능 측정 종료
   * @param {string} id - 측정 ID
   * @param {string} operation - 작업명
   */
  endTimer(id, operation) {
    if (!this.timers || !this.timers.has(id)) {
      this.warn(`타이머를 찾을 수 없습니다: ${id}`);
      return;
    }

    const startTime = this.timers.get(id);
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 밀리초 단위

    this.timers.delete(id);
    
    this.info(`⏱️ 타이머 종료: ${operation}`, { 
      id, 
      duration: `${duration.toFixed(2)}ms` 
    });

    // 성능 임계값 체크
    if (duration > 1000) { // 1초 이상
      this.warn(`성능 경고: ${operation}이 ${duration.toFixed(2)}ms 소요됨`);
    }
  }

  /**
   * 메모리 사용량 로깅
   */
  logMemoryUsage() {
    const usage = process.memoryUsage();
    const memoryInfo = {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    };

    this.info('💾 메모리 사용량', memoryInfo);
  }

  /**
   * 시스템 상태 로깅
   */
  logSystemStatus() {
    const status = {
      uptime: `${Math.round(process.uptime())}초`,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      pid: process.pid,
      version: process.version,
      platform: process.platform
    };

    this.info('🖥️ 시스템 상태', status);
  }
}

// 싱글톤 인스턴스 생성
const logger = new Logger();

module.exports = logger; 