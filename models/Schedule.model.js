const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const scheduleSchema = Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['시세조사', '고객상담', '계약관리', '기타']
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    priority: {
        type: String,
        required: true,
        enum: ['높음', '보통', '낮음'],
        default: '보통'
    },
    status: {
        type: String,
        required: true,
        enum: ['예정', '진행중', '완료', '취소'],
        default: '예정'
    },
    // 관련 고객들 (선택사항) - 여러 고객 지원
    relatedCustomers: [{
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    }],
    // 관련 매물들 (선택사항) - 여러 매물 지원
    relatedProperties: [{
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: false
    }],
    // 관련 계약 (선택사항)
    relatedContracts: [{
        type: Schema.Types.ObjectId,
        ref: 'Contract',
        required: false
    }],
    // 일정 등록자
    publisher: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 사업자 번호 (회사별 필터링용)
    byCompanyNumber: {
        type: String,
        required: true
    },
    // 완료 시간 (상태가 완료일 때)
    completedAt: {
        type: Date
    },
    // 취소 사유 (상태가 취소일 때)
    cancelReason: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    }
}, { timestamps: true });

// 삭제된 데이터를 제외하고 JSON으로 반환
scheduleSchema.methods.toJSON = function () {
    const obj = this._doc;
    delete obj.updatedAt;
    delete obj.__v;
    return obj;
};

const Schedule = mongoose.model("Schedule", scheduleSchema);
module.exports = Schedule; 