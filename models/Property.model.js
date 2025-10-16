const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: [String],
        required: true,
        enum: ['매매', '월세', '전세', '실거주'],
        validate: {
            validator: function(types) {
                // 실거주가 포함된 경우 다른 유형과 함께 선택 불가
                if (types.includes('실거주') && types.length > 1) {
                    return false;
                }
                return types.length > 0;
            },
            message: '실거주는 다른 유형과 함께 선택할 수 없습니다.'
        }
    },
    // 각 유형별 개별 가격 정보
    prices: {
        매매가격: {
            type: Number,
            required: false
        },
        월세가격: {
            type: Number,
            required: false
        },
        월세보증금: {
            type: Number,
            required: false
        },
        전세가격: {
            type: Number,
            required: false
        }
    },
    area: {
        type: String,
        required: true
    },
    rooms: {
        type: Number,
        required: true,
        min: 1
    },
    bathrooms: {
        type: Number,
        required: true,
        min: 1
    },
    address: {
        type: String,
        required: true
    },
    detailedAddress: {
        type: String,
        required: false,
        default: ''
    },
    status: {
        type: String,
        required: true,
        enum: ['판매중', '판매완료', '월세중', '월세완료', '전세중', '전세완료']
    },
    // 편의시설 필드들
    parking: {
        type: String,
        enum: ['가능', '불가능', '별도문의'],
        default: '별도문의'
    },
    pets: {
        type: String,
        enum: ['가능', '불가능', '별도문의'],
        default: '별도문의'
    },
    elevator: {
        type: String,
        enum: ['있음', '없음', '별도문의'],
        default: '별도문의'
    },
    // 특이사항 필드 추가
    specialNotes: {
        type: String,
        required: false,
        default: ''
    },
    // 계약 기간 필드 (월세중, 전세중일 때 사용)
    contractPeriod: {
        startDate: {
            type: String,
            required: false
        },
        endDate: {
            type: String,
            required: false
        }
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
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    // 고객 변경 히스토리
    customerHistory: [{
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        customerName: {
            type: String,
            required: true
        },
        customerPhone: {
            type: String,
            required: false
        },
        changeDate: {
            type: Date,
            default: Date.now
        },
        changeType: {
            type: String,
            enum: ['연결', '해제', '소유자 변경', '소유자 해제'],
            required: true
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],
    // 매물 수정 히스토리
    modificationHistory: [{
        modifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        modifiedAt: {
            type: Date,
            default: Date.now
        },
        modificationType: {
            type: String,
            enum: ['계약등록', '계약수정', '상태변경', '정보수정', '소유자변경'],
            required: true
        },
        previousStatus: {
            type: String,
            required: false
        },
        newStatus: {
            type: String,
            required: false
        },
        contractDetails: {
            contractNumber: {
                type: String,
                required: false
            },
            contractType: {
                type: String,
                required: false
            },
            contractStatus: {
                type: String,
                required: false
            },
            price: {
                type: Number,
                required: false
            },
            deposit: {
                type: Number,
                required: false
            },
            commission: {
                type: Number,
                required: false
            },
            contractDate: {
                type: Date,
                required: false
            },
            closingDate: {
                type: Date,
                required: false
            },
            startDate: {
                type: Date,
                required: false
            },
            endDate: {
                type: Date,
                required: false
            },
            buyer: {
                type: Schema.Types.ObjectId,
                ref: 'Customer',
                required: false
            },
            seller: {
                type: Schema.Types.ObjectId,
                ref: 'Customer',
                required: false
            },
            agent: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: false
            }
        },
        description: {
            type: String,
            required: false
        },
        // 기존 필드들과의 호환성을 위한 필드들
        field: {
            type: String,
            required: false
        },
        oldValue: {
            type: String,
            required: false
        },
        newValue: {
            type: String,
            required: false
        },
        changeDate: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false
        }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deletedReason: {
        type: String
    }
}, { timestamps: true });

// 삭제된 데이터를 제외하고 JSON으로 반환
propertySchema.methods.toJSON = function () {
    const obj = this._doc;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model("Property", propertySchema); 