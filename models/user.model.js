const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
const validator = require('validator');  // 이메일 형식 검증을 위한 validator 라이브러리
require('dotenv').config();  //env파일 불러오는 방법
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const userSchema = Schema({
    name: {
        type: String, required: true
    },
    nickname: {
        type: String, required: false
    },
    email: {
        type: String,
        required: true, unique: true
    },
    password: {
        type: String,
        required: function() {
            return !this.isSocialAccount; // 소셜 계정이 아닌 경우에만 필수
        }
    },
    contactNumber: {
        type: String,
        required: false
    },
    birthDate: {
        type: Date,
        required: false
    },
    gender: {
        type: String,
        required: false,
        enum: ['male', 'female']
    },
    position: {
        type: String,
        required: false,
        enum: ['사원', '대리', '과장', '차장', '부장', '이사', '상무', '전무', '부사장', '사장', '기타']
    },
    companyName: {
        type: String,
        required: false
    },
    businessNumber: {
        type: String,
        required: false
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: false
    },
    businessAddress: {
        type: String,
        required: false
    },
    detailedAddress: {
        type: String,
        required: false
    },
    coins: {
        type: Number,
        required: false,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    }, // 역할 필드 추가 (기본값: 'user')
    requestList: {
        type: [Schema.Types.ObjectId],
        ref: 'Request', default: []
    }, // 빈 배열로 초기화
    proposalList: {
        type: [Schema.Types.ObjectId],
        ref: 'Proposal', default: []
    }, // 빈 배열로 초기화
    ReceiveList: {
        type: [Schema.Types.ObjectId],
        ref: 'Receive', default: []
    }, // 빈 배열로 초기화
    isDeleted: {
        type: Boolean, default: false
    }, // 탈퇴 여부
    deletedAt: {
        type: Date
    }, // 탈퇴 시점 기록
    deletedReason: {
        type: String
    }, // 탈퇴 사유
    emailToken: {
        type: String,
        required: false
    }, // 이메일 인증 토큰
    isVerified: {
        type: Boolean,
        default: false
    }, // 이메일 인증 완료 여부
    // 소셜 계정 관련 필드
    socialAccounts: {
        google: { type: String, required: false },
        naver: { type: String, required: false }
    },
    naverId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    isSocialAccount: {
        type: Boolean,
        default: false
    },
    socialProvider: {
        type: String,
        required: false,
        enum: ['google', 'naver']
    },
    // 구글 OAuth 관련 필드
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    profilePicture: {
        type: String,
        required: false
    },
    // 구독 관련 필드
    isPremium: {
        type: Boolean,
        default: false
    },
    subscriptionPlan: {
        type: String,
        required: false
    },
    subscriptionStartDate: {
        type: Date,
        required: false
    },
    subscriptionEndDate: {
        type: Date,
        required: false
    },
    subscriptionStatus: {
        type: String,
        enum: ['inactive', 'active', 'expired', 'cancelled', 'suspended', 'grace_period'],
        default: 'inactive'
    },
    // 유예 기간 관련 필드
    gracePeriodEndDate: {
        type: Date,
        required: false
    },
    // 구독 결제 주기
    billingCycle: {
        type: String,
        enum: ['test_minute', 'daily', 'monthly', 'quarterly', 'yearly'],
        default: 'monthly'
    },
    lastPaymentDate: {
        type: Date,
        required: false
    },
    nextPaymentDate: {
        type: Date,
        required: false
    },
    // 중복 로그인 방지를 위한 세션 정보
    currentSessionId: {
        type: String,
        required: false
    },
    lastLoginAt: {
        type: Date,
        required: false
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    // 무료 체험 관련 필드
    freeTrialUsed: {
        type: Boolean,
        default: false
    },
    freeTrialStartDate: {
        type: Date,
        required: false
    },
    freeTrialEndDate: {
        type: Date,
        required: false
    }
}, { timestamps: true });


// 비밀번호와 일부 데이터를 제외하고 JSON으로 반환
userSchema.methods.toJSON = function () {
    const obj = this._doc;
    delete obj.password;
    delete obj.updatedAt;
    delete obj.__v;
    
    // 생년월일에서 시간 정보 제거 (YYYY-MM-DD 형식으로 변환)
    if (obj.birthDate && obj.birthDate instanceof Date) {
        obj.birthDate = obj.birthDate.toISOString().split('T')[0];
    }
    
    return obj;
};

// JWT 토큰 생성
userSchema.methods.generateToken = function () {
    // const token = jwt.sign({ _id: this._id }, JWT_SECRET_KEY, { expiresIn: '1d' });
    const token = jwt.sign({ _id: this._id }, JWT_SECRET_KEY); // 만료 시간 제거
    return token;
};

// 프리미엄 상태 확인 (유예 기간 포함)
userSchema.methods.isPremiumActive = function() {
    const now = new Date();
    
    // 기본 프리미엄 상태 확인
    if (!this.isPremium) {
        return false;
    }
    
    // 구독 상태가 활성이거나 유예 기간인 경우
    if (this.subscriptionStatus === 'active') {
        return !this.subscriptionEndDate || this.subscriptionEndDate > now;
    } else if (this.subscriptionStatus === 'grace_period' || this.subscriptionStatus === 'cancelled') {
        // 유예 기간 확인
        return this.gracePeriodEndDate && this.gracePeriodEndDate > now;
    }
    
    return false;
};

// 무료 체험 상태 확인
userSchema.methods.isInFreeTrial = function() {
    const now = new Date();
    
    return this.freeTrialUsed && 
           this.freeTrialStartDate && 
           this.freeTrialEndDate &&
           now >= this.freeTrialStartDate && 
           now <= this.freeTrialEndDate;
};

// 무료 체험 시작
userSchema.methods.startFreeTrial = function() {
    if (this.freeTrialUsed) {
        return false; // 이미 사용함
    }
    
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setMonth(trialEndDate.getMonth() + 1); // 1개월 후
    
    this.freeTrialUsed = true;
    this.freeTrialStartDate = now;
    this.freeTrialEndDate = trialEndDate;
    this.subscriptionStatus = 'active'; // 무료 체험 중에는 활성 상태
    this.isPremium = true;
    
    return true;
};

// 유예 기간 상태 확인
userSchema.methods.isInGracePeriod = function() {
    const now = new Date();
    return (this.subscriptionStatus === 'grace_period' || this.subscriptionStatus === 'cancelled') &&
           this.gracePeriodEndDate && 
           this.gracePeriodEndDate > now;
};

// 유예 기간 남은 일수 계산
userSchema.methods.getGracePeriodDaysLeft = function() {
    if (!this.isInGracePeriod()) {
        return 0;
    }
    
    const now = new Date();
    const diffTime = this.gracePeriodEndDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
};

// 세션 관리 메서드들
userSchema.methods.createSession = function() {
    const sessionId = require('crypto').randomUUID();
    this.currentSessionId = sessionId;
    this.isLoggedIn = true;
    this.lastLoginAt = new Date();
    return sessionId;
};

userSchema.methods.invalidateSession = function() {
    this.currentSessionId = null;
    this.isLoggedIn = false;
};

userSchema.methods.validateSession = function(sessionId) {
    return this.isLoggedIn && this.currentSessionId === sessionId;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
