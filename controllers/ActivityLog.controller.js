const ActivityLog = require('../models/ActivityLog.model');
const User = require('../models/user.model');

// 활동 로그 생성
const createActivityLog = async (req, res) => {
    try {
        const {
            type,
            action,
            description,
            relatedEntity,
            details,
            priority = 2,
            status = 'success',
            errorMessage
        } = req.body;

        // 필수 필드 검증
        if (!type || !action || !description) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다. (type, action, description)'
            });
        }

        // 사용자 정보 가져오기
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 활동 로그 데이터 구성
        const logData = {
            type,
            action,
            description,
            userId: req.user.id,
            userName: user.name || user.email,
            companyName: user.companyName,
            businessNumber: user.businessNumber,
            relatedEntity,
            details: details || {},
            priority,
            status,
            errorMessage,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        };

        // 활동 로그 생성
        const activityLog = await ActivityLog.createLog(logData);

        res.status(201).json({
            success: true,
            message: '활동 로그가 생성되었습니다.',
            data: activityLog
        });

    } catch (error) {
        console.error('Create activity log error:', error);
        res.status(500).json({
            success: false,
            message: '활동 로그 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 활동 로그 목록 조회
const getActivityLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type = 'all',
            startDate,
            endDate,
            searchTerm,
            employeeName,
            companyOnly = 'false',
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = req.query;

        // 페이지네이션 설정 (하드 상한 150개)
        const pageNum = parseInt(page);
        const requestedLimit = parseInt(limit);
        const HARD_LIMIT = 150;
        const limitNum = Math.min(requestedLimit || 20, HARD_LIMIT);
        const skip = (pageNum - 1) * limitNum;

        // 현재 사용자 정보 가져오기
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 쿼리 조건 구성
        let query = {};
        
        console.log('🔍 ActivityLog Query Debug:');
        console.log('- companyOnly:', companyOnly);
        console.log('- currentUser.businessNumber:', currentUser.businessNumber);
        console.log('- req.user.id:', req.user.id);
        
        // 개인 활동기록만 보기 옵션이 활성화된 경우 (companyOnly === 'false')
        if (companyOnly === 'false') {
            // 자신의 로그만 보기
            query.userId = req.user.id;
            console.log('✅ 개인 활동기록만 보기 모드 - userId 필터 적용');
        } else {
            // 회사 직원 전체 보기 (companyOnly === 'true' 또는 기본값)
            if (currentUser.businessNumber) {
                // 같은 회사 사용자 목록 조회
                const companyUsers = await User.find({ businessNumber: currentUser.businessNumber }, { _id: 1, name: 1, email: 1 }).lean();
                const companyUserIds = companyUsers.map(u => u._id);

                // 일부 예전 로그는 businessNumber가 없을 수 있으므로 OR 조건으로 보강
                query.$or = [
                    { businessNumber: currentUser.businessNumber },
                    { userId: { $in: companyUserIds } }
                ];

                console.log('✅ 회사 직원 전체 보기 모드 - OR 필터 적용:', {
                    businessNumber: currentUser.businessNumber,
                    companyUserCount: companyUsers.length
                });
            } else {
                // 사업자등록번호가 없는 경우 자신의 로그만 보기
                query.userId = req.user.id;
                console.log('⚠️ 사업자등록번호 없음 - userId 필터 적용');
            }
        }

        // 타입 필터
        if (type && type !== 'all') {
            query.type = type;
        }

        // 날짜 범위 필터
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        // 직원 이름 필터
        if (employeeName) {
            query.userName = { $regex: employeeName, $options: 'i' };
        }

        // 검색어 필터
        if (searchTerm) {
            const searchConditions = [
                { action: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { userName: { $regex: searchTerm, $options: 'i' } }
            ];
            
            if (query.$or) {
                // 이미 $or 조건이 있는 경우 AND 조건으로 결합
                query.$and = [
                    { $or: query.$or },
                    { $or: searchConditions }
                ];
                delete query.$or;
            } else {
                query.$or = searchConditions;
            }
        }

        // 정렬 설정
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // 활동 로그 조회
        console.log('ActivityLog Query:', query);
        console.log('User ID:', req.user.id);
        
        // 최신순 상위 150개까지만 전체 데이터셋에서 허용
        // 먼저 상한 내 ID만 가져와 이후 페이지네이션 수행 (불필요한 스캔 방지)
        const topIds = await ActivityLog.find(query)
            .sort({ timestamp: -1, _id: -1 })
            .limit(HARD_LIMIT)
            .select('_id')
            .lean();

        const idList = topIds.map(d => d._id);

        const [activities, total] = await Promise.all([
            ActivityLog.find({ _id: { $in: idList } })
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .populate('userId', 'name email')
                .lean(),
            Promise.resolve(idList.length)
        ]);

        console.log('📊 ActivityLog Query Results:');
        console.log('- Found activities:', activities.length);
        console.log('- Total count:', total);
        console.log('- Final query:', JSON.stringify(query, null, 2));

        // 상대적 시간 추가
        const activitiesWithRelativeTime = activities.map(activity => ({
            ...activity,
            relativeTime: getRelativeTime(activity.timestamp)
        }));

        res.json({
            success: true,
            data: {
                activities: activitiesWithRelativeTime,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({
            success: false,
            message: '활동 로그 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 활동 로그 상세 조회
const getActivityLogById = async (req, res) => {
    try {
        const { id } = req.params;

        const activityLog = await ActivityLog.findById(id)
            .populate('userId', 'name email')
            .lean();

        if (!activityLog) {
            return res.status(404).json({
                success: false,
                message: '활동 로그를 찾을 수 없습니다.'
            });
        }

        // 사용자 권한 확인 (자신의 로그만 조회 가능)
        if (activityLog.userId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다.'
            });
        }

        // 상대적 시간 추가
        activityLog.relativeTime = getRelativeTime(activityLog.timestamp);

        res.json({
            success: true,
            data: activityLog
        });

    } catch (error) {
        console.error('Get activity log by id error:', error);
        res.status(500).json({
            success: false,
            message: '활동 로그 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 활동 통계 조회
const getActivityStats = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const userId = req.user.id;

        const stats = await ActivityLog.getActivityStats(userId, period);

        // 전체 활동 수
        const totalActivities = await ActivityLog.countDocuments({ userId });

        // 최근 활동
        const recentActivities = await ActivityLog.find({ userId })
            .sort({ timestamp: -1 })
            .limit(5)
            .select('action description timestamp type')
            .lean();

        res.json({
            success: true,
            data: {
                stats,
                totalActivities,
                recentActivities: recentActivities.map(activity => ({
                    ...activity,
                    relativeTime: getRelativeTime(activity.timestamp)
                }))
            }
        });

    } catch (error) {
        console.error('Get activity stats error:', error);
        res.status(500).json({
            success: false,
            message: '활동 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 활동 로그 삭제 (관리자만)
const deleteActivityLog = async (req, res) => {
    try {
        const { id } = req.params;

        // 관리자 권한 확인
        if (req.user.level < 99) {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        const activityLog = await ActivityLog.findByIdAndDelete(id);

        if (!activityLog) {
            return res.status(404).json({
                success: false,
                message: '활동 로그를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '활동 로그가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('Delete activity log error:', error);
        res.status(500).json({
            success: false,
            message: '활동 로그 삭제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 활동 로그 일괄 삭제 (관리자만)
const bulkDeleteActivityLogs = async (req, res) => {
    try {
        const { ids, type, startDate, endDate } = req.body;

        // 관리자 권한 확인
        if (req.user.level < 99) {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        let query = {};

        if (ids && ids.length > 0) {
            query._id = { $in: ids };
        } else {
            if (type) query.type = type;
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = new Date(startDate);
                if (endDate) query.timestamp.$lte = new Date(endDate);
            }
        }

        const result = await ActivityLog.deleteMany(query);

        res.json({
            success: true,
            message: `${result.deletedCount}개의 활동 로그가 삭제되었습니다.`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Bulk delete activity logs error:', error);
        res.status(500).json({
            success: false,
            message: '활동 로그 일괄 삭제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 상대적 시간 계산 함수
const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return timestamp.toLocaleDateString('ko-KR');
};

module.exports = {
    createActivityLog,
    getActivityLogs,
    getActivityLogById,
    getActivityStats,
    deleteActivityLog,
    bulkDeleteActivityLogs
};
