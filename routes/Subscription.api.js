const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/Subscription.controller');
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription.model'); // 올바른 경로로 수정
const User = require('../models/user.model'); // 올바른 경로로 수정

// 무료 체험 시작
router.post('/free-trial/start', auth, SubscriptionController.startFreeTrial);

// 구독 생성
router.post('/subscriptions', auth, SubscriptionController.createSubscription);

// 구독 조회 (특정 고객)
router.get('/subscriptions/:customerId', auth, SubscriptionController.getSubscription);

// 구독 목록 조회
router.get('/subscriptions', auth, SubscriptionController.getSubscriptions);

// 구독 업데이트
router.put('/subscriptions/:subscriptionId', auth, SubscriptionController.updateSubscription);

// 구독 취소
router.delete('/subscriptions/:subscriptionId', auth, SubscriptionController.cancelSubscription);

// 구독 일시정지
router.post('/subscriptions/:subscriptionId/suspend', auth, SubscriptionController.suspendSubscription);

// 구독 일시정지 (customerId로)
router.post('/suspend', auth, async (req, res) => {
  try {
    const { customerId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'customerId가 필요합니다.'
      });
    }
    
    const subscription = await Subscription.findOne({ customerId });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: '구독을 찾을 수 없습니다.'
      });
    }

    subscription.status = 'suspended';
    subscription.suspendedAt = new Date();
    await subscription.save();

    // 사용자 정보도 업데이트
    const user = await User.findById(customerId);
    if (user) {
      user.subscriptionStatus = 'suspended';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: '구독이 일시정지되었습니다.',
      data: subscription
    });
  } catch (error) {
    console.error('구독 일시정지 오류:', error);
    res.status(500).json({
      success: false,
      message: '구독 일시정지 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 구독 재개
router.post('/subscriptions/:subscriptionId/resume', auth, SubscriptionController.resumeSubscription);

// 구독 재개 (customerId로)
router.post('/resume', auth, async (req, res) => {
  try {
    const { customerId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'customerId가 필요합니다.'
      });
    }
    
    const subscription = await Subscription.findOne({ customerId });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: '구독을 찾을 수 없습니다.'
      });
    }

    if (subscription.status !== 'suspended') {
      return res.status(400).json({
        success: false,
        message: '일시정지된 구독만 재개할 수 있습니다.'
      });
    }

    subscription.status = 'active';
    subscription.suspendedAt = undefined;
    subscription.retryCount = 0; // 재시도 횟수 초기화
    await subscription.save();

    // 사용자 정보도 업데이트
    const user = await User.findById(customerId);
    if (user) {
      user.subscriptionStatus = 'active';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: '구독이 재개되었습니다.',
      data: subscription
    });
  } catch (error) {
    console.error('구독 재개 오류:', error);
    res.status(500).json({
      success: false,
      message: '구독 재개 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 구독 취소 (customerId로)
router.post('/cancel', auth, SubscriptionController.cancelSubscription);

// 구독 취소철회 (다음달 결제일 내에서만 가능)
router.post('/reactivate', auth, SubscriptionController.reactivateSubscription);

// 새로운 빌링키 발급 요청 (결제 수단 변경)
router.post('/request-new-billing-key', auth, async (req, res) => {
  try {
    const { customerId, customerEmail, customerName } = req.body;
    
    if (!customerId) {
      console.error('❌ customerId가 누락됨');
      return res.status(400).json({
        success: false,
        message: 'customerId가 필요합니다.'
      });
    }
    
    // customerEmail과 customerName이 비어있어도 사용자 정보를 조회하여 처리
    let finalCustomerEmail = customerEmail;
    let finalCustomerName = customerName;
    
    if (!finalCustomerEmail || !finalCustomerName) {
      try {
        const user = await User.findById(customerId);
        if (user) {
          finalCustomerEmail = user.email;
          finalCustomerName = user.name;
        } else {
          console.error('❌ 사용자를 찾을 수 없음:', customerId);
          return res.status(404).json({
            success: false,
            message: '사용자를 찾을 수 없습니다.'
          });
        }
      } catch (userError) {
        console.error('❌ 사용자 정보 조회 오류:', userError);
        return res.status(500).json({
          success: false,
          message: '사용자 정보 조회 중 오류가 발생했습니다.'
        });
      }
    }
    
    // 기존 구독 정보 조회
    const subscription = await Subscription.findOne({ customerId });
    
    if (!subscription) {
      console.error('❌ 구독을 찾을 수 없음:', customerId);
      return res.status(404).json({
        success: false,
            message: '구독을 찾을 수 없습니다.'
          });
        }
    
        // 새로운 빌링키 발급을 위한 URL 생성
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/billing?customerKey=${customerId}&mode=change`;

    res.status(200).json({
      success: true,
      message: '새로운 결제 수단 등록 페이지로 이동합니다.',
      redirectUrl: redirectUrl
    });
  } catch (error) {
    console.error('❌ 새로운 빌링키 발급 요청 오류:', error);
    res.status(500).json({
      success: false,
      message: '새로운 빌링키 발급 요청 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 빌링키 발급
router.post('/issue-billing-key', SubscriptionController.issueBillingKey);

// 정기결제 실행
router.post('/confirm-billing', SubscriptionController.confirmBilling);

// 결제 승인
router.post('/confirm-payment', SubscriptionController.confirmPayment);

// 주문 정보 저장 (결제 전)
router.post('/orders', auth, async (req, res) => {
  try {
    const { orderId, amount, customerId, subscriptionPlan } = req.body;
    
    // 여기서 주문 정보를 데이터베이스에 저장
    // 실제 구현에서는 Order 모델을 사용하여 저장
    
    res.status(201).json({
      success: true,
      message: '주문 정보가 저장되었습니다.',
      data: {
        orderId,
        amount,
        customerId,
        subscriptionPlan
      }
    });
  } catch (error) {
    console.error('주문 정보 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 정보 저장에 실패했습니다.',
      error: error.message
    });
  }
});



// 🧪 테스트용: 즉시 정기결제 실행 (개발/테스트 환경에서만)
router.post('/test/monthly-subscriptions', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      success: false, 
      message: '개발 환경에서만 사용 가능합니다.' 
    });
  }

  try {
  
    
    // 스케줄러 인스턴스 가져오기
    const subscriptionScheduler = require('../schedulers/subscriptionScheduler');
    
    // 즉시 정기결제 실행
    await subscriptionScheduler.testMonthlySubscriptions();
    
    res.status(200).json({
      success: true,
      message: '테스트 정기결제 실행 완료'
    });
  } catch (error) {
    console.error('❌ [테스트] 정기결제 실행 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🧪 테스트용: 즉시 재시도 실행 (개발/테스트 환경에서만)
router.post('/test/failed-payment-retries', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      success: false, 
      message: '개발 환경에서만 사용 가능합니다.' 
    });
  }

  try {

    
    // 스케줄러 인스턴스 가져오기
    const subscriptionScheduler = require('../schedulers/subscriptionScheduler');
    
    // 즉시 재시도 실행
    await subscriptionScheduler.testFailedPaymentRetries();
    
    res.status(200).json({
      success: true,
      message: '테스트 재시도 실행 완료'
    });
  } catch (error) {
    console.error('❌ [테스트] 재시도 실행 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🧪 테스트용: 구독 상태 확인
router.get('/test/subscription-status', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({}).sort({ createdAt: -1 }).limit(10);
    
    res.status(200).json({
      success: true,
      data: subscriptions.map(sub => ({
        id: sub._id,
        customerId: sub.customerId,
        status: sub.status,
        planName: sub.planName,
        price: sub.price,
        nextBillingDate: sub.nextBillingDate,
        retryCount: sub.retryCount,
        lastPaymentDate: sub.lastPaymentDate,
        paymentHistory: sub.paymentHistory?.length || 0
      }))
    });
  } catch (error) {
    console.error('❌ [테스트] 구독 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🧪 테스트용: 1분마다 결제되는 테스트 구독 생성
router.post('/test/create-test-subscription', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      success: false, 
      message: '개발 환경에서만 사용 가능합니다.' 
    });
  }

  try {
    const { customerId, customerEmail, customerName } = req.body;
    
    if (!customerId || !customerEmail || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'customerId, customerEmail, customerName이 필요합니다.'
      });
    }

    // 기존 테스트 구독이 있으면 삭제
    await Subscription.deleteMany({ 
      customerId, 
      billingCycle: 'test_minute' 
    });

    // 테스트 구독 생성 (1분마다 결제)
    const testSubscription = new Subscription({
      customerId,
      planId: 'enterprise',
      planName: '테스트 구독 (1분마다)',
      price: 1000, // 테스트용 작은 금액
      customerEmail,
      customerName,
      status: 'active',
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 60 * 1000), // 1분 후
      autoRenew: true,
      paymentMethod: 'card',
      billingCycle: 'test_minute',
      billingKey: 'test_billing_key_' + Date.now() // 테스트용 빌링키
    });

    await testSubscription.save();

    res.status(200).json({
      success: true,
      message: '테스트 구독이 생성되었습니다. 1분마다 정기결제가 실행됩니다.',
      data: {
        id: testSubscription._id,
        customerId: testSubscription.customerId,
        nextBillingDate: testSubscription.nextBillingDate,
        billingCycle: testSubscription.billingCycle
      }
    });
  } catch (error) {
    console.error('❌ [테스트] 테스트 구독 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



// 다음 결제일 계산 헬퍼 함수
function calculateNextBillingDate(billingCycle = 'monthly') {
  const nextDate = new Date();
  
  switch (billingCycle) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}

module.exports = router; 