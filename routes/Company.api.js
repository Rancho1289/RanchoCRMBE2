const express = require('express');
const router = express.Router();
const {
    registerCompany,
    registerNewCompany,
    getMyCompanies,
    updateCompany,
    deleteCompany,
    searchCompanies,
    getAllCompanies,
    getCompanyStats,
    updateCompanyById,
    deleteCompanyById
} = require('../controllers/Company.controller');
const auth = require('../middleware/auth');

// 회사 등록
router.post('/register', auth, registerCompany);

// 새 회사 등록 (최초 등록자 포함, 인증 불필요)
router.post('/register-new', registerNewCompany);

// 내 회사 목록 조회
router.get('/my', auth, getMyCompanies);

// 회사 정보 수정
router.put('/update', auth, updateCompany);

// 회사 삭제
router.delete('/delete', auth, deleteCompany);

// 회사 검색
router.get('/search', auth, searchCompanies);

// 관리자용 API
// 모든 회사 목록 조회 (페이지네이션, 필터링)
router.get('/all', auth, getAllCompanies);

// 회사 통계 조회
router.get('/stats', auth, getCompanyStats);

// 회사 정보 수정 (ID 기반)
router.put('/:id', auth, updateCompanyById);

// 회사 삭제 (ID 기반)
router.delete('/:id', auth, deleteCompanyById);

module.exports = router;
