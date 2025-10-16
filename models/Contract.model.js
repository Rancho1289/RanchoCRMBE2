const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    contractNumber: {
        type: String,
        required: false,
        unique: true
    },
    type: {
        type: String,
        enum: ['매매', '월세', '전세'],
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    // 매수자/임차인 정보 (Customer ID만 사용)
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    // 매도자/임대인 정보 (Customer ID만 사용)
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    // 매매 정보
    price: Number, // 매매가격
    commission: Number, // 중계수수료
    // 임대 정보
    monthlyRent: Number, // 월세
    deposit: Number, // 보증금
    // 계약 일정
    contractDate: {
        type: Date,
        required: true
    },
    closingDate: Date, // 매매 완료일
    startDate: Date, // 임대 시작일
    endDate: Date, // 임대 종료일
    // 계약 상태
    status: {
        type: String,
        enum: ['진행중', '완료', '취소', '보류'],
        default: '진행중'
    },

    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: String,
    // 등록자 정보
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 사업자 번호 (회사별 필터링용)
    byCompanyNumber: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// 계약번호 자동 생성
contractSchema.pre('save', async function(next) {
    if (this.isNew && !this.contractNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // 계약 유형에 따른 접두사 결정
        let prefix;
        switch(this.type) {
            case '매매':
                prefix = 'MM'; // 매매
                break;
            case '월세':
                prefix = 'MR'; // 월세 (Monthly Rent)
                break;
            case '전세':
                prefix = 'JS'; // 전세 (Jeonse)
                break;
            default:
                prefix = 'CT'; // 기본값
        }
        
        // 해당 월의 마지막 계약번호 찾기 (계약 유형별로 구분)
        const lastContract = await this.constructor.findOne({
            contractNumber: new RegExp(`${prefix}-${year}-${month}-\\d+`)
        }).sort({ contractNumber: -1 });
        
        let sequence = 1;
        if (lastContract) {
            const lastSequence = parseInt(lastContract.contractNumber.split('-')[3]);
            sequence = lastSequence + 1;
        }
        
        this.contractNumber = `${prefix}-${year}-${month}-${String(sequence).padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Contract', contractSchema); 