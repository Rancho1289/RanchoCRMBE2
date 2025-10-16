const express = require('express');
const router = express.Router();
const userApi = require('./user.api');
const taskApi = require('./task.api');
const paymentsRoutes = require('./PaymentList.api')
const nodemailerRoutes = require('./Nodemailer.api');
const upload = require('./upload.api.js')
const historyRoutes = require('./History.api');
const PropertyRoutes = require('./Property.api')
const CustomerRoutes = require('./Customer.api')
const ContractRoutes = require('./Contract.api')
const ScheduleRoutes = require('./Schedule.api')
const socialAuthRoutes = require('./socialAuth.api')
const subscriptionRoutes = require('./Subscription.api')
const subscriptionHistoryRoutes = require('./SubscriptionHistory.api')
const notificationRoutes = require('./Notification.api')
const smsRoutes = require('./SMS.api')
const activityLogRoutes = require('./ActivityLog.api')
const companyRoutes = require('./Company.api')
const utilsRoutes = require('./utils.api')
const scheduleBriefingRoutes = require('./ScheduleBriefing.api')
const newsRoutes = require('./News.api')
const PORT = process.env.PORT
const app = express();

router.use('/users', userApi);
router.use('/user', userApi);
router.use('/tasks', taskApi);
router.use('/payments', paymentsRoutes);
router.use('/nodemailer', nodemailerRoutes);
router.use('/history', historyRoutes);
router.use('/upload', upload);
router.use('/properties', PropertyRoutes); // 새 경로 추가
router.use('/customers', CustomerRoutes); // 새 경로 추가
router.use('/contracts', ContractRoutes); // 새 경로 추가
router.use('/schedules', ScheduleRoutes); // 새 경로 추가
router.use('/auth', socialAuthRoutes); // 소셜 인증 API 추가
router.use('/subscription', subscriptionRoutes); // 구독 API 추가
// 무료 체험 시작 API를 루트 경로에 직접 추가
router.post('/free-trial/start', require('../middleware/auth'), require('../controllers/Subscription.controller').startFreeTrial);
router.use('/subscription-history', subscriptionHistoryRoutes); // 구독 히스토리 API 추가
router.use('/notifications', notificationRoutes); // 공지사항 API 추가
router.use('/sms', smsRoutes); // SMS API 추가
router.use('/activity-logs', activityLogRoutes); // 활동기록 API 추가
router.use('/company', companyRoutes); // 회사 API 추가
router.use('/utils', utilsRoutes); // 유틸리티 API 추가
router.use('/schedule-briefing', scheduleBriefingRoutes); // 스케줄 브리핑 API 추가
router.use('/news', newsRoutes); // 뉴스 API 추가
router.use('/uploads', express.static('uploads'));




// 토스페이먼츠 설정 가져오기
const { createAuthHeader, validateConfig } = require('../config/tossPayments');

// 환경변수 검증
try {
  validateConfig();
} catch (error) {
  console.error('❌ 토스페이먼츠 설정 오류:', error.message);
  process.exit(1);
}

// Basic 인증 헤더 생성
const encryptedSecretKey = createAuthHeader();


app.post("/api/pay/confirm", async function (req, res) {
  const { paymentKey, orderId, amount } = req.body;

  try {
    // Toss Payments API 호출
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: process.env.ENCRYPTED_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount,
        paymentKey: paymentKey,
      }),
    });

    const result = await response.json();
    

    if (!response.ok) {
      return res.status(response.status).json(result); // 결제 승인 실패
    }

    //  결제 승인 성공 후 코인 추가 로직
    const userId = req.body.userId;
    const coinPackages = await api.get("/coin");
    const selectedPackage = coinPackages.data.find(pkg => parseInt(pkg.price) === parseInt(amount));

    if (!selectedPackage) {
      console.error(" 결제된 금액과 일치하는 코인 패키지를 찾을 수 없습니다.");
      return res.status(400).json({ status: 'fail', message: 'Invalid package amount' });
    }

    const updateResponse = await api.put("/user/coins", {
      userId,
      coins: selectedPackage.total,
    });

    if (updateResponse.status !== 200) {
      console.error(" 코인 추가 실패:", updateResponse.data.message);
      return res.status(500).json({ status: 'fail', message: 'Failed to update coins' });
    }

    // 최종 응답
    res.status(200).json({
      status: 'success',
      message: `${selectedPackage.total} 코인이 추가되었습니다!`,
      result
    });

  } catch (error) {
    console.error(" [API] 결제 승인 중 오류 발생:", error);
    res.status(500).json({ status: "fail", message: "결제 승인 실패", error: error.message });
  }
});



module.exports = router;
