const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    index: true
  },
  planId: {
    type: String,
    required: true,
    enum: ['basic', 'professional', 'enterprise', 'premium', 'premium_trial']
  },
  planName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'cancelled', 'suspended'],
    default: 'active'
  },
  billingKey: {
    type: String,
    sparse: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'transfer', 'virtual_account'],
    default: 'card'
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  company: {
    type: String
  },
  // 정기구독 자동화를 위한 추가 필드들
  billingCycle: {
    type: String,
    enum: ['test_minute', 'daily', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAttempt: {
    type: Date
  },
  suspendedAt: {
    type: Date
  },
  // 구독 취소 시 유예 기간 관련 필드
  cancelledAt: {
    type: Date
  },
  gracePeriodEndDate: {
    type: Date
  },
  paymentHistory: [{
    paymentKey: String,
    amount: Number,
    date: Date,
    status: {
      type: String,
      enum: ['success', 'failed', 'canceled']
    },
    error: String,
    action: String,
    source: {
      type: String,
      enum: ['scheduler', 'manual'],
      default: 'scheduler'
    },
    retryCount: Number
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// 다음 결제일 계산
subscriptionSchema.methods.calculateNextBillingDate = function() {
  const nextDate = new Date(this.nextBillingDate || this.startDate);
  
  switch (this.billingCycle) {
    case 'test_minute':
      // 🧪 테스트용: 1분 후
      nextDate.setMinutes(nextDate.getMinutes() + 1);
      break;
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
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
};

// 구독 활성화 여부 확인
subscriptionSchema.methods.isActive = function() {
  const now = new Date();
  
  // 활성 상태이거나 취소되었지만 유예 기간 내인 경우
  if (this.status === 'active') {
    return !this.endDate || this.endDate > now;
  } else if (this.status === 'cancelled') {
    // 취소되었지만 유예 기간이 남아있는 경우
    return this.gracePeriodEndDate && this.gracePeriodEndDate > now;
  }
  
  return false;
};

// 유예 기간 상태 확인
subscriptionSchema.methods.isInGracePeriod = function() {
  const now = new Date();
  return this.status === 'cancelled' && 
         this.gracePeriodEndDate && 
         this.gracePeriodEndDate > now;
};

// 유예 기간 남은 일수 계산
subscriptionSchema.methods.getGracePeriodDaysLeft = function() {
  if (!this.isInGracePeriod()) {
    return 0;
  }
  
  const now = new Date();
  const diffTime = this.gracePeriodEndDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// 구독 갱신
subscriptionSchema.methods.renew = function() {
  this.nextBillingDate = this.calculateNextBillingDate();
  this.status = 'active';
  this.retryCount = 0; // 재시도 횟수 초기화
  return this.save();
};

// 구독 취소
subscriptionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.autoRenew = false;
  
  // 마지막 결제일로부터 1개월 후까지 유예 기간 설정
  if (this.lastPaymentDate) {
    this.gracePeriodEndDate = new Date(this.lastPaymentDate);
    this.gracePeriodEndDate.setMonth(this.gracePeriodEndDate.getMonth() + 1);
  } else {
    // 마지막 결제일이 없는 경우 현재 시간으로부터 1개월
    this.gracePeriodEndDate = new Date();
    this.gracePeriodEndDate.setMonth(this.gracePeriodEndDate.getMonth() + 1);
  }
  
  // 유예 기간이 끝나는 날을 endDate로 설정
  this.endDate = this.gracePeriodEndDate;
  
  return this.save();
};

// 구독 일시정지
subscriptionSchema.methods.suspend = function() {
  this.status = 'suspended';
  this.suspendedAt = new Date();
  return this.save();
};

// 구독 재개
subscriptionSchema.methods.resume = function() {
  this.status = 'active';
  this.suspendedAt = undefined;
  this.retryCount = 0;
  return this.save();
};

// 결제 실패 처리
subscriptionSchema.methods.handlePaymentFailure = function(error) {
  this.retryCount = (this.retryCount || 0) + 1;
  this.lastPaymentAttempt = new Date();
  
  // 결제 히스토리에 실패 기록 추가
  this.paymentHistory = this.paymentHistory || [];
  this.paymentHistory.push({
    error: error.message,
    date: new Date(),
    status: 'failed',
    retryCount: this.retryCount,
    source: 'scheduler'
  });
  
  // 최대 재시도 횟수 초과 시 일시정지
  if (this.retryCount >= this.maxRetries) {
    this.status = 'suspended';
    this.suspendedAt = new Date();
  }
  
  return this.save();
};

// 결제 성공 처리
subscriptionSchema.methods.handlePaymentSuccess = function(paymentKey, amount) {
  this.lastPaymentDate = new Date();
  this.nextBillingDate = this.calculateNextBillingDate();
  this.retryCount = 0; // 재시도 횟수 초기화
  
  // 결제 히스토리에 성공 기록 추가
  this.paymentHistory = this.paymentHistory || [];
  this.paymentHistory.push({
    paymentKey,
    amount,
    date: new Date(),
    status: 'success',
    source: 'scheduler'
  });
  
  return this.save();
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription; 