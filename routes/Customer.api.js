const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/Customer.controller');
const auth = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 고객 목록 조회
router.get('/', CustomerController.getCustomers);

// 고객 검색 (일정 등록용)
router.get('/search', CustomerController.searchCustomers);

// 고객 중복 검색
router.get('/check-duplicate', CustomerController.checkDuplicateCustomer);

// 고객 상세 조회
router.get('/:id', CustomerController.getCustomer);

// 고객의 일정 목록 조회
router.get('/:id/schedules', CustomerController.getCustomerSchedules);

// 고객 등록
router.post('/', CustomerController.createCustomer);

// CSV 일괄 등록
router.post('/bulk-csv', CustomerController.bulkCreateFromCSV);

// 고객 수정
router.put('/:id', CustomerController.updateCustomer);

// 고객 일괄 삭제 (개별 삭제보다 먼저 위치해야 함)
router.delete('/bulk', CustomerController.bulkDeleteCustomers);

// 고객 삭제
router.delete('/:id', CustomerController.deleteCustomer);

module.exports = router; 