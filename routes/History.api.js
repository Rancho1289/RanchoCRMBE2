const express = require('express');
const HistoryController = require('../controllers/History.controller');

const router = express.Router();

// 생성
router.post('/', HistoryController.createHistory);

// 전체 조회
router.get('/', HistoryController.getAllHistories);

// 특정 히스토리 조회
router.get('/:id', HistoryController.getHistoryById);

// 업데이트
router.put('/:id', HistoryController.updateHistory);

// 삭제
router.delete('/:id', HistoryController.deleteHistory);

module.exports = router;
