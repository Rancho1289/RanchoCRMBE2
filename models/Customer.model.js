const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerSchema = Schema({
    name: {
        type: String,
        required: true
    },
    // 고객 분류 (실거주, 매도, 매수 - 중복 선택 가능)
    categories: {
        type: [String],
        required: true,
        enum: ['실거주', '매도', '매수', '일반'],
        default: []
    },

    // 매수 유형 (매매, 월세, 전세 - 중복 선택 가능)
    buyTypes: {
        type: [String],
        required: false,
        default: []
    },
    // 매수 가격대 정보
    buyPriceRanges: {
        매매: {
            min: { type: Number, required: false },
            max: { type: Number, required: false }
        },
        월세: {
            monthlyRent: {
                min: { type: Number, required: false },
                max: { type: Number, required: false }
            },
            deposit: {
                min: { type: Number, required: false },
                max: { type: Number, required: false }
            }
        },
        전세: {
            min: { type: Number, required: false },
            max: { type: Number, required: false }
        }
    },
    phone: {
        type: String,
        required: false,
        default: ''
    },
    email: {
        type: String,
        required: false,
        default: ''
    },
    businessNumber: {
        type: String,
        required: false,
        default: ''
    },
    address: {
        type: String,
        required: false,
        default: ''
    },
    // 매매 관련 필드
    budget: {
        type: Number,
        required: false
    },
    preferredArea: {
        type: String,
        required: false
    },
    // 여러 매물을 가질 수 있도록 배열로 변경
    properties: [{
        property: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: true
        },
        askingPrice: {
            type: Number,
            required: false
        },
        monthlyRent: {
            type: Number,
            required: false
        },
        deposit: {
            type: Number,
            required: false
        },
        jeonseDeposit: {
            type: Number,
            required: false
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        required: true,
        enum: ['활성', '비활성'],
        default: '활성'
    },
    lastContact: {
        type: Date,
        required: true,
        default: Date.now
    },
    notes: {
        type: String,
        required: false
    },
    publisher: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    byCompanyNumber: {
        type: String,
        required: false,
        default: ''
    },
    // 매물 변경 히스토리
    propertyHistory: [{
        property: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: true
        },
        propertyTitle: {
            type: String,
            required: true
        },
        changeDate: {
            type: Date,
            default: Date.now
        },
        changeType: {
            type: String,
            enum: ['추가', '제거', '소유권 이전'],
            required: true
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        previousOwner: {
            type: Schema.Types.ObjectId,
            ref: 'Customer'
        },
        newOwner: {
            type: Schema.Types.ObjectId,
            ref: 'Customer'
        }
    }],
    // 지원 이력 (일정)
    schedules: [{
        _id: false,
        schedule: {
            type: Schema.Types.ObjectId,
            ref: 'Schedule',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deletedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// 삭제된 데이터를 제외하고 JSON으로 반환
customerSchema.methods.toJSON = function () {
    const obj = this._doc;
    delete obj.updatedAt;
    delete obj.__v;
    return obj;
};

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer; 