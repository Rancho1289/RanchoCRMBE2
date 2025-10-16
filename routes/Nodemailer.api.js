// Nodemailer.api.js

const express = require('express');
const router = express.Router();
const { sendVerificationCode, verifyCode, sendScrapingResult } = require('../controllers/Nodemailer.controller');

// 이메일 인증 코드 전송 엔드포인트
router.post('/send-verification-code', sendVerificationCode);

// 인증 코드 확인 엔드포인트
router.post('/verify-code', verifyCode);

router.post('/send-scraping-result', sendScrapingResult);


module.exports = router;
