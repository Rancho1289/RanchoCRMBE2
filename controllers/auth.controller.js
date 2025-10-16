const authController = {};
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
require('dotenv').config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

authController.authenticate = async (req, res, next) => {
    try {
        const tokenString = req.headers.authorization;  // "Bearer aadfasdf"
        if (!tokenString) {
            throw new Error('Invalid token');
        }
        const token = tokenString.replace('Bearer ', '');
        
        // 토큰 검증
        const payload = jwt.verify(token, JWT_SECRET_KEY);
        
        // 사용자 정보 조회
        let user; // 함수 스코프에서 user 변수 선언
        
        try {
            user = await User.findById(payload._id);
        } catch (dbError) {
            throw new Error('데이터베이스 조회 중 오류가 발생했습니다.');
        }
        
        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
        
        if (user.isDeleted) {
            throw new Error('삭제된 사용자입니다.');
        }
        
        // req.user와 req.userId 모두 설정
        req.user = user;
        req.userId = user._id;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'fail', message: '유효하지 않은 토큰입니다.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'fail', message: '토큰이 만료되었습니다.' });
        }
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

module.exports = authController;

