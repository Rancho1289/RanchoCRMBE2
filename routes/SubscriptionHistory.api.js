const express = require('express');
const router = express.Router();
const subscriptionHistoryController = require('../controllers/SubscriptionHistory.controller');
const authController = require('../controllers/auth.controller');

// 모든 라우트에 인증 미들웨어 적용
router.use(authController.authenticate);

// 사용자별 히스토리 조회
router.get('/user/:userId', subscriptionHistoryController.getUserHistory);

// 전체 히스토리 조회 (관리자용)
router.get('/all', subscriptionHistoryController.getAllHistory);

// 히스토리 통계
router.get('/stats', subscriptionHistoryController.getHistoryStats);

// 특정 히스토리 상세 조회
router.get('/detail/:historyId', subscriptionHistoryController.getHistoryDetail);

module.exports = router; 