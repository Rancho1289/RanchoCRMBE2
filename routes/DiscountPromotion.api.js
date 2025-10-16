const express = require('express');
const router = express.Router();
const discountPromotionController = require('../controllers/DiscountPromotion.controller');
const authController = require('../controllers/auth.controller');

router.route('/')
    .post(authController.authenticate, discountPromotionController.createPromotion)
    .get(authController.authenticate, discountPromotionController.getPromotions);
    
router.route('/:id')
    .delete(authController.authenticate, discountPromotionController.deletePromotion); // DELETE 라우트 추가

module.exports = router;
