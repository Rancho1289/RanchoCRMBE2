const mongoose = require('mongoose');

const subscriptionHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'subscription_created',      // 구독 생성
      'subscription_activated',    // 구독 활성화
      'subscription_cancelled',    // 구독 취소
      'subscription_suspended',    // 구독 일시정지
      'subscription_resumed',      // 구독 재개
      'payment_success',           // 결제 성공
      'payment_failed',            // 결제 실패
      'payment_cancelled',         // 결제 취소
      'billing_key_updated',       // 빌링키 업데이트
      'plan_changed',              // 플랜 변경
      'auto_renewal_enabled',      // 자동갱신 활성화
      'auto_renewal_disabled',     // 자동갱신 비활성화
      'refund_processed',          // 환불 처리
      'subscription_expired',      // 구독 만료
      'manual_payment',            // 수동 결제
      'retry_payment',             // 재시도 결제
      'admin_action',              // 관리자 액션
      'free_trial_started'         // 무료 체험 시작
    ]
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    default: 'KRW'
  },
  paymentKey: {
    type: String,
    default: null
  },
  orderId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'cancelled'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// 인덱스 추가
subscriptionHistorySchema.index({ userId: 1, createdAt: -1 });
subscriptionHistorySchema.index({ subscriptionId: 1, createdAt: -1 });
subscriptionHistorySchema.index({ action: 1, createdAt: -1 });
subscriptionHistorySchema.index({ status: 1, createdAt: -1 });

// 가상 필드: 액션 그룹
subscriptionHistorySchema.virtual('actionGroup').get(function() {
  const actionGroups = {
    subscription_management: ['subscription_created', 'subscription_activated', 'subscription_cancelled', 'subscription_suspended', 'subscription_resumed', 'subscription_expired'],
    payment: ['payment_success', 'payment_failed', 'payment_cancelled', 'manual_payment', 'retry_payment'],
    settings: ['billing_key_updated', 'plan_changed', 'auto_renewal_enabled', 'auto_renewal_disabled'],
    admin: ['admin_action', 'refund_processed']
  };
  
  for (const [group, actions] of Object.entries(actionGroups)) {
    if (actions.includes(this.action)) {
      return group;
    }
  }
  return 'other';
});

// JSON 변환 시 가상 필드 포함
subscriptionHistorySchema.set('toJSON', { virtuals: true });
subscriptionHistorySchema.set('toObject', { virtuals: true });

const SubscriptionHistory = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);

module.exports = SubscriptionHistory; 