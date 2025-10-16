const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/Notification.controller');
const auth = require('../middleware/auth');
const notificationPermission = require('../middleware/notificationPermission');

// 공지사항 목록 조회 (인증 선택적)
router.get('/', notificationController.getNotifications);

// 공지사항 상세 조회 (인증 필요)
router.get('/:id', auth, notificationController.getNotificationById);

// 공지사항 생성 (인증 + 권한 필요)
router.post('/', auth, notificationPermission, notificationController.createNotification);

// 공지사항 수정 (인증 + 권한 필요)
router.put('/:id', auth, notificationPermission, notificationController.updateNotification);

// 공지사항 삭제 (인증 + 권한 필요)
router.delete('/:id', auth, notificationPermission, notificationController.deleteNotification);

// 공지사항 읽음 처리 (인증 필요)
router.patch('/:id/read', auth, notificationController.markAsRead);

// 읽지 않은 공지사항 수 조회 (인증 필요)
router.get('/unread/count', auth, notificationController.getUnreadCount);

module.exports = router;