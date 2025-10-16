const express = require('express');
const router = express.Router();
const socialAuthController = require('../controllers/socialAuth.controller');

// Google OAuth 콜백
router.post('/google/callback', socialAuthController.googleCallback);

// Naver OAuth 콜백
router.post('/naver/callback', socialAuthController.naverCallback);

// 소셜 계정으로 회원가입
router.post('/social-signup', socialAuthController.socialSignup);

module.exports = router; 