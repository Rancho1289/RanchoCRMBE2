const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, '회사명은 필수입니다.'],
        trim: true,
        maxlength: [100, '회사명은 100자를 초과할 수 없습니다.']
    },
    ceoName: {
        type: String,
        required: false,  // 새로운 회사 등록에서는 선택사항
        trim: true,
        maxlength: [50, '대표자명은 50자를 초과할 수 없습니다.']
    },
    businessNumber: {
        type: String,
        required: [true, '사업자등록번호는 필수입니다.'],
        trim: true,
        unique: true,
        match: [/^\d{3}-\d{2}-\d{5}$/, '사업자등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)'],
        maxlength: [12, '사업자등록번호는 12자를 초과할 수 없습니다.']
    },
    address: {
        type: String,
        required: false,  // 새로운 회사 등록에서는 선택사항
        trim: true,
        maxlength: [200, '주소는 200자를 초과할 수 없습니다.']
    },
    detailedAddress: {
        type: String,
        trim: true,
        maxlength: [100, '상세주소는 100자를 초과할 수 없습니다.']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false  // 새로운 회사 등록에서는 필수가 아님
    },
    // 새로운 회사 등록을 위한 필드들
    businessType: {
        type: String,
        trim: true,
        maxlength: [100, '업종은 100자를 초과할 수 없습니다.']
    },
    businessAddress: {
        type: String,
        trim: true,
        maxlength: [200, '사업장 주소는 200자를 초과할 수 없습니다.']
    },
    representativeName: {
        type: String,
        trim: true,
        maxlength: [50, '대표자명은 50자를 초과할 수 없습니다.']
    },
    contactNumber: {
        type: String,
        trim: true,
        maxlength: [20, '연락처는 20자를 초과할 수 없습니다.']
    },
    email: {
        type: String,
        trim: true,
        maxlength: [100, '이메일은 100자를 초과할 수 없습니다.']
    },
    // 최초 등록자 관련 필드들
    initialUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    initialUserEmail: {
        type: String,
        trim: true,
        default: null
    },
    initialUserName: {
        type: String,
        trim: true,
        maxlength: [50, '최초 등록자 이름은 50자를 초과할 수 없습니다.'],
        default: null
    },
    isInitialRegistration: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 인덱스 설정
companySchema.index({ userId: 1 });
companySchema.index({ businessNumber: 1 }, { unique: true });
companySchema.index({ companyName: 1 });
companySchema.index({ createdAt: -1 });

// 업데이트 시 updatedAt 자동 갱신
companySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// 가상 필드: 회사 정보 요약
companySchema.virtual('summary').get(function() {
    return `${this.companyName} (대표: ${this.ceoName})`;
});

// JSON 변환 시 가상 필드 포함
companySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Company', companySchema);
