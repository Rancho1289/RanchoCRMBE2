const express = require('express');
const router = express.Router();
const {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  hardDeleteNews,
  getLatestNews
} = require('../controllers/News.controller');
const auth = require('../middleware/auth');

// 뉴스 생성 (인증 필요)
router.post('/', auth, createNews);

// 모든 뉴스 조회 (페이지네이션, 검색, 필터링 지원)
router.get('/', getAllNews);

// 최신 뉴스 조회
router.get('/latest', getLatestNews);

// 특정 뉴스 조회
router.get('/:id', getNewsById);

// 뉴스 수정 (인증 필요)
router.put('/:id', auth, updateNews);

// 뉴스 삭제 (소프트 삭제, 인증 필요)
router.delete('/:id', auth, deleteNews);

// 뉴스 완전 삭제 (인증 필요)
router.delete('/:id/hard', auth, hardDeleteNews);

module.exports = router;
