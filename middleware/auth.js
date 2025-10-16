const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
require('dotenv').config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const authMiddleware = async (req, res, next) => {
    try {
        // Authorization 헤더에서 토큰 추출
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        const token = authHeader.substring(7); // 'Bearer ' 제거

        // 토큰 검증
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        
        // 사용자 정보 조회
        const user = await User.findById(decoded._id);
        
        if (!user || user.isDeleted) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 사용자입니다.'
            });
        }

        // 세션 ID 검증 (중복 로그인 방지)
        if (decoded.sessionId && !user.validateSession(decoded.sessionId)) {
            return res.status(401).json({
                success: false,
                message: '다른 기기에서 로그인되어 세션이 만료되었습니다. 다시 로그인해주세요.'
            });
        }

        // req.user에 사용자 정보 저장
        req.user = user;
        next();
        
    } catch (error) {
        console.error('인증 미들웨어 오류:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다.'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: '인증 처리 중 오류가 발생했습니다.'
        });
    }
};

module.exports = authMiddleware; 