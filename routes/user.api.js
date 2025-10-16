// const express = require("express")
// const router = express.Router()
// const userController = require("../controller/user.controller")
// const authController = require("../controller/auth.controller")
// // const taskApi = require('./task.api')
// // 01. 회원가입 endpoint

// // router.post("/", (req, res) => {
// //     res.send("create user controller will be here")
// // })
// router.post("/", userController.createUser)
// router.post("/login", userController.loginWithEmail)
// // 토큰을 통해 유저 id빼내고 => 그 아이디로 유저 객체 찾아서 보내주기
// router.get("/me", authController.authenticate, userController.getUser)
// // router.get('/me', authController.authenticate, userController.getUserInfo);

// module.exports = router


const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// 회원가입 endpoint
router.post('/', userController.createUser);
router.post('/login', userController.loginWithEmail);
router.post('/logout', authController.authenticate, userController.logout);
router.post('/google-login', userController.googleLogin);
router.post('/google-oauth', userController.googleOAuth);
router.post('/naver-login', userController.naverLogin);
router.post('/restore-account', userController.restoreDeletedAccount);
router.put('/coins', userController.updateCoins);

// 특정 경로들을 먼저 정의 (파라미터 라우트보다 먼저)
router.get('/me', authController.authenticate, userController.getUser);
router.get('/all', authController.authenticate, userController.getAllUsers); // 플랫폼 운영자용
router.put('/level', authController.authenticate, userController.updateLevel); // 레벨 업데이트를 더 위쪽으로 이동
router.put('/update', authController.authenticate, userController.updateUser);
router.put('/premium', authController.authenticate, userController.updatePremiumStatus); // 프리미엄 상태 업데이트
router.put('/subscription-status', authController.authenticate, userController.updateSubscriptionStatus); // 구독 상태 업데이트
router.get('/check-nickname/:nickname', userController.checkNicknameAvailability);
router.get('/check-email/:email', userController.checkEmailAvailability);
router.get('/check-business-number/:businessNumber', userController.checkBusinessNumberAvailability);

// 파라미터 라우트 (마지막에 정의)
router.get('/:id', authController.authenticate, userController.getUserById);

// 사용자 삭제 경로 추가
router.delete('/deleteUserByAdmin/:id', authController.authenticate, userController.deleteUserByAdmin);
router.post('/delete', authController.authenticate, userController.deleteUser);

// 기본 사용자 목록 조회 (같은 사업자 번호만)
router.get('/', authController.authenticate, userController.getUsers);

// 디버깅용: 데이터베이스 상태 확인 (임시)
router.get('/debug/db-status', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const User = require('../models/user.model');
        
        const dbState = mongoose.connection.readyState;
        const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
        const totalUsers = await User.countDocuments({});
        const deletedUsers = await User.countDocuments({ isDeleted: true });
        const activeUsers = await User.countDocuments({ isDeleted: false });
        
        res.json({
            status: 'success',
            database: {
                connection: dbStates[dbState],
                readyState: dbState
            },
            users: {
                total: totalUsers,
                active: activeUsers,
                deleted: deletedUsers
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 비밀번호 관련
router.post('/forgot-password', userController.forgotPassword); // 비밀번호 찾기 요청
router.post('/reset-password', userController.resetPassword); // 비밀번호 재설정 요청

// 최초 회사 관리자 설정
router.put('/set-initial-company-admin', auth, userController.setInitialCompanyAdmin);

module.exports = router;

