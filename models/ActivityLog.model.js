const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    // 활동 타입 (property, customer, contract, system)
    type: {
        type: String,
        required: true,
        enum: ['property', 'customer', 'contract', 'system', 'schedule', 'payment']
    },
    
    // 활동 액션 (등록, 수정, 삭제, 상태변경 등)
    action: {
        type: String,
        required: true
    },
    
    // 활동 설명
    description: {
        type: String,
        required: true
    },
    
    // 활동을 수행한 사용자 ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // 활동을 수행한 사용자 이름 (성능을 위해 저장)
    userName: {
        type: String,
        required: true
    },
    
    // 회사 정보 (필터링을 위해 저장)
    companyName: {
        type: String,
        required: false
    },
    
    // 사업자등록번호 (같은 회사 직원 필터링용)
    businessNumber: {
        type: String,
        required: false,
        index: true
    },
    
    // 관련 엔티티 정보 (매물, 고객, 계약 등)
    relatedEntity: {
        type: {
            type: String, // 'property', 'customer', 'contract' 등
            required: false
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
        },
        name: {
            type: String,
            required: false
        }
    },
    
    // 추가 상세 정보 (JSON 형태로 저장)
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // 활동 발생 시간
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // IP 주소 (보안을 위해)
    ipAddress: {
        type: String,
        required: false
    },
    
    // 사용자 에이전트 (브라우저 정보)
    userAgent: {
        type: String,
        required: false
    },
    
    // 활동 중요도 (1: 낮음, 2: 보통, 3: 높음, 4: 중요)
    priority: {
        type: Number,
        default: 2,
        min: 1,
        max: 4
    },
    
    // 활동 상태 (success, error, warning)
    status: {
        type: String,
        enum: ['success', 'error', 'warning'],
        default: 'success'
    },
    
    // 오류 메시지 (status가 error일 때)
    errorMessage: {
        type: String,
        required: false
    }
}, {
    timestamps: true, // createdAt, updatedAt 자동 생성
    collection: 'activitylogs'
});

// 인덱스 설정 (성능 최적화)
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ type: 1, timestamp: -1 });
activityLogSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });
activityLogSchema.index({ timestamp: -1 });

// 가상 필드: 상대적 시간
activityLogSchema.virtual('relativeTime').get(function() {
    const now = new Date();
    const diffInMinutes = Math.floor((now - this.timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return this.timestamp.toLocaleDateString('ko-KR');
});

// JSON 변환 시 가상 필드 포함
activityLogSchema.set('toJSON', { virtuals: true });

// 정적 메서드: 활동 로그 생성
activityLogSchema.statics.createLog = async function(logData) {
    try {
        const activityLog = new this(logData);
        await activityLog.save();
        return activityLog;
    } catch (error) {
        console.error('Activity log creation failed:', error);
        throw error;
    }
};

// 정적 메서드: 사용자별 활동 로그 조회
activityLogSchema.statics.getUserActivities = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        type,
        startDate,
        endDate,
        searchTerm
    } = options;
    
    const query = { userId };
    
    if (type && type !== 'all') {
        query.type = type;
    }
    
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (searchTerm) {
        query.$or = [
            { action: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { userName: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    
    const skip = (page - 1) * limit;
    
    const [activities, total] = await Promise.all([
        this.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .lean(),
        this.countDocuments(query)
    ]);
    
    return {
        activities,
        pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
        }
    };
};

// 정적 메서드: 활동 통계 조회
activityLogSchema.statics.getActivityStats = async function(userId, period = '30') {
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stats = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                lastActivity: { $max: '$timestamp' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
    
    return stats;
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
