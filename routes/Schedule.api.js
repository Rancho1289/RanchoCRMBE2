const express = require('express');
const router = express.Router();
const ScheduleController = require('../controllers/Schedule.controller');
const auth = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 일정 목록 조회
router.get('/', ScheduleController.getSchedules);

// 월별 일정 조회 (캘린더용)
router.get('/monthly/:year/:month', ScheduleController.getMonthlySchedules);

// 일정 상세 조회
router.get('/:id', ScheduleController.getSchedule);

// 일정 등록
router.post('/', ScheduleController.createSchedule);

// 일정 수정
router.put('/:id', ScheduleController.updateSchedule);

// 일정 삭제
router.delete('/:id', ScheduleController.deleteSchedule);

module.exports = router; 