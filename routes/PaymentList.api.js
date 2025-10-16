const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentList.controller');
const authController = require('../controllers/auth.controller');

// 결제 내역 생성
router.post('/', authController.authenticate, paymentController.createPayment);

// 모든 결제 내역 조회
router.get('/', authController.authenticate, paymentController.getAllPayments);



// 특정 결제 내역 조회
router.get('/:id', authController.authenticate, paymentController.getPaymentById);

// 결제 내역 삭제
router.delete('/:id', authController.authenticate, paymentController.deletePayment);


module.exports = router;
