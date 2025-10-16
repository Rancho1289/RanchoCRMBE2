const express = require('express');
const router = express.Router();
const ContractController = require('../controllers/Contract.controller');
const auth = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 계약 목록 조회
router.get('/', ContractController.getContracts);

// 계약 상세 조회
router.get('/:id', ContractController.getContractById);

// 계약 등록
router.post('/', ContractController.createContract);

// 계약 수정
router.put('/:id', ContractController.updateContract);

// 계약 삭제
router.delete('/:id', ContractController.deleteContract);

// 계약용 고객 목록 조회 (Level 조건에 따른 필터링)
router.get('/customers/list', ContractController.getCustomersForContract);

// 계약용 사용자 목록 조회 (담당자 선택용)
router.get('/users/list', ContractController.getUsersForContract);

module.exports = router; 