const express = require('express');
const multer = require('multer');
const router = express.Router();
const fileController = require('../controllers/upload.Controller');

// Multer를 사용하여 파일 업로드 설정
const upload = multer({ dest: 'uploads/' });

// 파일 업로드 API
router.post('/upload', upload.single('file'), fileController.uploadFile);

// 파일 삭제 API 추가 (필요 시)
router.delete('/:fileId', fileController.deleteFile);

module.exports = router;
