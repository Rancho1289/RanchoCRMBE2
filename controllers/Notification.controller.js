const Notification = require('../models/Notification.model');
const User = require('../models/user.model');

// 공지사항 목록 조회
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, isActive = true } = req.query;
        const userId = req.user?.id;

        // 쿼리 조건 설정 (기본값: 활성화된 공지사항만 조회)
        let query = { isActive: isActive !== 'false' };
        
        if (type) {
            query.type = type;
        }

        // 현재 시간 기준으로 유효한 공지사항만 조회
        const now = new Date();
        
        // 만료되지 않은 공지사항만 조회
        query.$or = [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: now } }
        ];

        // 로그인한 사용자의 경우 사용자별 공지사항 필터링만 적용
        if (userId) {
            query.$and = [
                {
                    $or: [
                        { isGlobal: true },
                        { targetUsers: userId }
                    ]
                }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { priority: -1, publishedAt: -1 };

        const notifications = await Notification.find(query)
            .populate('createdBy', 'name email')
            .populate('targetUsers', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));

        // 각 공지사항에 대해 사용자가 읽었는지 여부 추가
        if (userId) {
            notifications.forEach(notification => {
                notification.isRead = notification.isReadByUser(userId);
            });
        }

        res.json({
            success: true,
            data: {
                docs: notifications,
                totalDocs: total,
                limit: parseInt(limit),
                page: parseInt(page),
                totalPages: totalPages,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('공지사항 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항을 불러오는데 실패했습니다.',
            error: error.message
        });
    }
};

// 공지사항 상세 조회
const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const notification = await Notification.findById(id)
            .populate('createdBy', 'name email')
            .populate('targetUsers', 'name email');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        // 공지사항이 활성 상태인지 확인
        if (!notification.isActiveNow()) {
            return res.status(404).json({
                success: false,
                message: '만료되었거나 비활성화된 공지사항입니다.'
            });
        }

        // 사용자별 접근 권한 확인
        if (userId && !notification.isGlobal && !notification.targetUsers.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: '이 공지사항에 접근할 권한이 없습니다.'
            });
        }

        const notificationObj = notification.toObject();
        if (userId) {
            notificationObj.isRead = notification.isReadByUser(userId);
        }

        res.json({
            success: true,
            data: notificationObj
        });
    } catch (error) {
        console.error('공지사항 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항을 불러오는데 실패했습니다.',
            error: error.message
        });
    }
};

// 공지사항 생성
const createNotification = async (req, res) => {
    try {
        const {
            title,
            content,
            type = '일반',
            priority = 0,
            targetUsers = [],
            isGlobal = true,
            expiresAt
        } = req.body;

        const createdBy = req.user.id;

        const notificationData = {
            title,
            content,
            type,
            priority,
            createdBy,
            publisher: createdBy, // publisher는 작성자와 동일
            isGlobal,
            targetUsers: isGlobal ? [] : targetUsers
        };

        if (expiresAt) {
            notificationData.expiresAt = new Date(expiresAt);
        }

        const notification = new Notification(notificationData);
        await notification.save();

        await notification.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: '공지사항이 성공적으로 생성되었습니다.',
            data: notification
        });
    } catch (error) {
        console.error('공지사항 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 생성에 실패했습니다.',
            error: error.message
        });
    }
};

// 공지사항 수정
const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;

        // 수정 권한 확인 (생성자 또는 관리자)
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        if (notification.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: '공지사항을 수정할 권한이 없습니다.'
            });
        }

        updateData.updatedBy = userId;
        const updatedNotification = await Notification.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        res.json({
            success: true,
            message: '공지사항이 성공적으로 수정되었습니다.',
            data: updatedNotification
        });
    } catch (error) {
        console.error('공지사항 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 수정에 실패했습니다.',
            error: error.message
        });
    }
};

// 공지사항 삭제 (비활성화)
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        if (notification.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: '공지사항을 삭제할 권한이 없습니다.'
            });
        }

        // 실제 삭제 대신 비활성화
        notification.isActive = false;
        notification.updatedBy = userId;
        await notification.save();

        res.json({
            success: true,
            message: '공지사항이 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        console.error('공지사항 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 삭제에 실패했습니다.',
            error: error.message
        });
    }
};

// 공지사항 읽음 처리
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        await notification.markAsRead(userId);

        res.json({
            success: true,
            message: '공지사항을 읽음 처리했습니다.'
        });
    } catch (error) {
        console.error('공지사항 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 읽음 처리에 실패했습니다.',
            error: error.message
        });
    }
};

// 읽지 않은 공지사항 수 조회
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = {
            isActive: true,
            publishedAt: { $lte: new Date() },
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ],
            $and: [
                {
                    $or: [
                        { isGlobal: true },
                        { targetUsers: userId }
                    ]
                }
            ]
        };

        const notifications = await Notification.find(query);
        const unreadCount = notifications.filter(notification => 
            !notification.isReadByUser(userId)
        ).length;

        res.json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        console.error('읽지 않은 공지사항 수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '읽지 않은 공지사항 수를 조회하는데 실패했습니다.',
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    getUnreadCount
};
