const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['일반', '중요', '긴급', '시스템'],
        default: '일반'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0, // 0: 일반, 1: 높음, 2: 매우 높음
        min: 0,
        max: 2
    },
    targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }], // 특정 사용자들에게만 보여줄 경우
    isGlobal: {
        type: Boolean,
        default: true // 모든 사용자에게 보여줄지 여부
    },
    attachments: [{
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String
    }],
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date // 공지사항 만료일
    }
}, {
    timestamps: true
});

// 인덱스 설정
notificationSchema.index({ isActive: 1, publishedAt: -1 });
notificationSchema.index({ type: 1, isActive: 1 });
notificationSchema.index({ isGlobal: 1, isActive: 1 });
notificationSchema.index({ targetUsers: 1, isActive: 1 });

// 가상 필드: 읽지 않은 사용자 수
notificationSchema.virtual('unreadCount').get(function() {
    if (this.isGlobal) {
        // 전체 공지사항의 경우, 모든 사용자 수에서 읽은 사용자 수를 뺀 값
        // 실제 구현에서는 User 모델의 총 사용자 수를 가져와야 함
        return 0; // 임시로 0 반환
    } else {
        return this.targetUsers.length - this.readBy.length;
    }
});

// 메서드: 특정 사용자가 읽었는지 확인
notificationSchema.methods.isReadByUser = function(userId) {
    return this.readBy.some(read => read.user.toString() === userId.toString());
};

// 메서드: 특정 사용자에게 읽음 처리
notificationSchema.methods.markAsRead = function(userId) {
    if (!this.isReadByUser(userId)) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
        return this.save();
    }
    return Promise.resolve(this);
};

// 메서드: 공지사항이 활성 상태인지 확인
notificationSchema.methods.isActiveNow = function() {
    const now = new Date();
    return this.isActive && 
           this.publishedAt <= now && 
           (!this.expiresAt || this.expiresAt > now);
};

module.exports = mongoose.model('Notification', notificationSchema);
