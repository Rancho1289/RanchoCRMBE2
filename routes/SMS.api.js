const express = require('express');
const router = express.Router();
const SMSController = require('../controllers/SMS.controller');
const auth = require('../middleware/auth');

// 모든 SMS 라우트는 인증이 필요
router.use(auth);

// SMS 전송
router.post('/send', SMSController.sendSMS);

// 일괄 SMS 전송
router.post('/send-bulk', SMSController.sendBulkSMS);

// SMS 전송 이력 조회
router.get('/history', SMSController.getSMSHistory);

// SMS 전송 취소
router.delete('/cancel/:smsId', SMSController.cancelSMS);

// SMS 통계 조회
router.get('/stats', SMSController.getSMSStats);

module.exports = router;
