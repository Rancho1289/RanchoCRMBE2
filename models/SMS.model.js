const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema({
    // 발신자 정보 (로그인한 사용자)
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderPhone: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    
    // 수신자 정보
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    recipientPhone: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
        required: true
    },
    
    // 메시지 내용
    message: {
        type: String,
        required: true,
        maxlength: 2000 // SMS 최대 길이
    },
    
    // 전송 상태
    status: {
        type: String,
        enum: ['대기', '전송중', '전송완료', '전송실패', '취소'],
        default: '대기'
    },
    
    // 전송 결과
    result: {
        messageId: String, // SMS 서비스에서 제공하는 메시지 ID
        errorCode: String,
        errorMessage: String,
        sentAt: Date,
        deliveredAt: Date
    },
    
    // 전송 설정
    settings: {
        isScheduled: {
            type: Boolean,
            default: false
        },
        scheduledAt: Date,
        isUrgent: {
            type: Boolean,
            default: false
        }
    },
    
    // 메타데이터
    metadata: {
        ipAddress: String,
        userAgent: String,
        campaignId: String, // 일괄 전송 시 그룹 ID
        templateId: String // 템플릿 사용 시
    }
}, {
    timestamps: true
});

// 인덱스 설정
smsSchema.index({ sender: 1, createdAt: -1 });
smsSchema.index({ recipient: 1, createdAt: -1 });
smsSchema.index({ status: 1, createdAt: -1 });
smsSchema.index({ 'settings.scheduledAt': 1 });

// 가상 필드: 전송 상태별 색상
smsSchema.virtual('statusColor').get(function() {
    const statusColors = {
        '대기': 'secondary',
        '전송중': 'warning',
        '전송완료': 'success',
        '전송실패': 'danger',
        '취소': 'dark'
    };
    return statusColors[this.status] || 'secondary';
});

// 가상 필드: 전송 상태별 아이콘
smsSchema.virtual('statusIcon').get(function() {
    const statusIcons = {
        '대기': 'clock',
        '전송중': 'spinner',
        '전송완료': 'check-circle',
        '전송실패': 'exclamation-triangle',
        '취소': 'times-circle'
    };
    return statusIcons[this.status] || 'clock';
});

module.exports = mongoose.model('SMS', smsSchema);
