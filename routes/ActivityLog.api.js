const express = require('express');
const router = express.Router();
const {
    createActivityLog,
    getActivityLogs,
    getActivityLogById,
    getActivityStats,
    deleteActivityLog,
    bulkDeleteActivityLogs
} = require('../controllers/ActivityLog.controller');
const auth = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 활동 로그 생성
// POST /api/activity-logs
router.post('/', createActivityLog);

// 활동 로그 목록 조회
// GET /api/activity-logs?page=1&limit=20&type=all&startDate=2024-01-01&endDate=2024-12-31&searchTerm=검색어
router.get('/', getActivityLogs);

// 활동 로그 상세 조회
// GET /api/activity-logs/:id
router.get('/:id', getActivityLogById);

// 활동 통계 조회
// GET /api/activity-logs/stats?period=30
router.get('/stats', getActivityStats);

// 활동 로그 삭제 (관리자만)
// DELETE /api/activity-logs/:id
router.delete('/:id', deleteActivityLog);

// 활동 로그 일괄 삭제 (관리자만)
// DELETE /api/activity-logs/bulk
router.delete('/bulk', bulkDeleteActivityLogs);

module.exports = router;
