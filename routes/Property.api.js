const express = require('express');
const router = express.Router();
const PropertyController = require('../controllers/Property.controller');
const authMiddleware = require('../middleware/auth'); // JWT 인증 미들웨어

// 모든 매물 목록 조회 (검색, 필터링 가능) - 인증 필요
router.get('/', authMiddleware, PropertyController.getProperties);

// 매물명 중복 검사 (인증 필요)
router.get('/check-title-duplicate', authMiddleware, PropertyController.checkTitleDuplicate);

// 매물 상세 조회
router.get('/:id', PropertyController.getProperty);

// 내가 등록한 매물 목록 조회
router.get('/my/list', authMiddleware, PropertyController.getMyProperties);

// 매물 등록 (인증 필요)
router.post('/', authMiddleware, PropertyController.createProperty);

// 매물 수정 (인증 필요)
router.put('/:id', authMiddleware, PropertyController.updateProperty);

// 매물 삭제 (인증 필요)
router.delete('/:id', authMiddleware, PropertyController.deleteProperty);

// 매물 소유자 변경 (인증 필요)
router.put('/:id/owner', authMiddleware, PropertyController.changePropertyOwner);

// 매물 publisher 업데이트 (관리자용)
router.post('/update-publishers', authMiddleware, PropertyController.updatePropertyPublishers);

module.exports = router; 