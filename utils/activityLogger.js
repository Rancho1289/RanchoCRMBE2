const ActivityLog = require('../models/ActivityLog.model');

/**
 * 활동 로그를 생성하는 유틸리티 함수
 * @param {Object} options - 로그 옵션
 * @param {string} options.type - 활동 타입 (property, customer, contract, system, schedule, payment)
 * @param {string} options.action - 활동 액션 (등록, 수정, 삭제, 상태변경 등)
 * @param {string} options.description - 활동 설명
 * @param {string} options.userId - 사용자 ID
 * @param {string} options.userName - 사용자 이름
 * @param {string} options.companyName - 회사명
 * @param {string} options.businessNumber - 사업자등록번호
 * @param {Object} options.relatedEntity - 관련 엔티티 정보
 * @param {Object} options.details - 추가 상세 정보
 * @param {number} options.priority - 중요도 (1-4, 기본값: 2)
 * @param {string} options.status - 상태 (success, error, warning, 기본값: success)
 * @param {string} options.errorMessage - 오류 메시지
 * @param {string} options.ipAddress - IP 주소
 * @param {string} options.userAgent - 사용자 에이전트
 */
const logActivity = async (options) => {
    try {
        const {
            type,
            action,
            description,
            userId,
            userName,
            companyName = null,
            businessNumber = null,
            relatedEntity = null,
            details = {},
            priority = 2,
            status = 'success',
            errorMessage = null,
            ipAddress = null,
            userAgent = null
        } = options;

        // 필수 필드 검증
        if (!type || !action || !description || !userId || !userName) {
            console.error('Activity log creation failed: Missing required fields', options);
            return null;
        }

        const logData = {
            type,
            action,
            description,
            userId,
            userName,
            companyName,
            businessNumber,
            relatedEntity,
            details,
            priority,
            status,
            errorMessage,
            ipAddress,
            userAgent
        };

        const activityLog = await ActivityLog.createLog(logData);
        return activityLog;

    } catch (error) {
        console.error('Activity log creation failed:', error);
        return null;
    }
};

/**
 * 매물 관련 활동 로그 생성
 */
const logPropertyActivity = async (action, description, userId, userName, propertyId, propertyName, details = {}, req = null) => {
    return await logActivity({
        type: 'property',
        action,
        description,
        userId,
        userName,
        relatedEntity: {
            type: 'property',
            id: propertyId,
            name: propertyName
        },
        details,
        ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
        userAgent: req ? req.get('User-Agent') : null
    });
};

/**
 * 고객 관련 활동 로그 생성
 */
const logCustomerActivity = async (action, description, userId, userName, customerId, customerName, details = {}, req = null) => {
    return await logActivity({
        type: 'customer',
        action,
        description,
        userId,
        userName,
        relatedEntity: {
            type: 'customer',
            id: customerId,
            name: customerName
        },
        details,
        ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
        userAgent: req ? req.get('User-Agent') : null
    });
};

/**
 * 계약 관련 활동 로그 생성
 */
const logContractActivity = async (action, description, userId, userName, contractId, contractType, details = {}, req = null) => {
    return await logActivity({
        type: 'contract',
        action,
        description,
        userId,
        userName,
        relatedEntity: {
            type: 'contract',
            id: contractId,
            name: contractType
        },
        details,
        ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
        userAgent: req ? req.get('User-Agent') : null
    });
};

/**
 * 일정 관련 활동 로그 생성
 */
const logScheduleActivity = async (action, description, userId, userName, scheduleId, scheduleTitle, details = {}, req = null) => {
    return await logActivity({
        type: 'schedule',
        action,
        description,
        userId,
        userName,
        relatedEntity: {
            type: 'schedule',
            id: scheduleId,
            name: scheduleTitle
        },
        details,
        ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
        userAgent: req ? req.get('User-Agent') : null
    });
};

/**
 * 결제 관련 활동 로그 생성
 */
const logPaymentActivity = async (action, description, userId, userName, paymentId, paymentAmount, details = {}, req = null) => {
    return await logActivity({
        type: 'payment',
        action,
        description,
        userId,
        userName,
        relatedEntity: {
            type: 'payment',
            id: paymentId,
            name: `결제 ${paymentAmount}원`
        },
        details,
        ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
        userAgent: req ? req.get('User-Agent') : null
    });
};

/**
 * 시스템 관련 활동 로그 생성
 */
const logSystemActivity = async (action, description, userId, userName, details = {}, req = null) => {
    return await logActivity({
        type: 'system',
        action,
        description,
        userId,
        userName,
        details,
        ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
        userAgent: req ? req.get('User-Agent') : null
    });
};

/**
 * 오류 활동 로그 생성
 */
const logErrorActivity = async (action, description, userId, userName, errorMessage, details = {}, req = null) => {
    return await logActivity({
        type: 'system',
        action,
        description,
        userId,
        userName,
        status: 'error',
        errorMessage,
        details,
        priority: 4, // 오류는 높은 우선순위
        ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
        userAgent: req ? req.get('User-Agent') : null
    });
};

/**
 * 미들웨어: 요청 정보를 자동으로 로깅
 */
const activityLoggerMiddleware = (type, action, description) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // 응답이 성공적일 때만 로깅
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logActivity({
                    type,
                    action,
                    description,
                    userId: req.user ? req.user.id : null,
                    userName: req.user ? (req.user.name || req.user.email) : 'Unknown',
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    details: {
                        method: req.method,
                        url: req.originalUrl,
                        statusCode: res.statusCode
                    }
                });
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = {
    logActivity,
    logPropertyActivity,
    logCustomerActivity,
    logContractActivity,
    logScheduleActivity,
    logPaymentActivity,
    logSystemActivity,
    logErrorActivity,
    activityLoggerMiddleware
};
