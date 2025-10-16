const SMS = require('../models/SMS.model');
const Customer = require('../models/Customer.model');
const User = require('../models/user.model');
const axios = require('axios');

// SMS 전송 함수
const sendSMS = async (phoneNumber, message, senderPhone) => {
    try {
        // 문자모아 API 설정 (실제 API 키는 환경변수에서 가져옴)
        const apiUrl = process.env.SMS_API_URL || 'https://api.smsmoa.com/send';
        const apiKey = process.env.SMS_API_KEY;
        const userId = process.env.SMS_USER_ID;
        
        if (!apiKey || !userId) {
            throw new Error('SMS API 설정이 필요합니다.');
        }

        const requestData = {
            user_id: userId,
            key: apiKey,
            msg: message,
            rphone: phoneNumber.replace(/[^0-9]/g, ''), // 숫자만 추출
            sphone: senderPhone.replace(/[^0-9]/g, ''), // 발신번호도 숫자만 추출
            testmode_yn: process.env.NODE_ENV === 'development' ? 'Y' : 'N'
        };

        const response = await axios.post(apiUrl, requestData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return {
            success: true,
            messageId: response.data.message_id,
            data: response.data
        };
    } catch (error) {
        console.error('SMS 전송 오류:', error);
        return {
            success: false,
            error: error.message,
            data: error.response?.data
        };
    }
};

// 단일 SMS 전송
exports.sendSMS = async (req, res) => {
    try {
        const { customerId, message, isScheduled, scheduledAt } = req.body;
        const user = req.user;

        // 사용자 연락처 확인
        if (!user.phone) {
            return res.status(400).json({
                success: false,
                message: '발신자 연락처가 등록되지 않았습니다. 프로필에서 연락처를 등록해주세요.'
            });
        }

        // 고객 정보 조회
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: '고객을 찾을 수 없습니다.'
            });
        }

        if (!customer.phone) {
            return res.status(400).json({
                success: false,
                message: '고객의 연락처가 등록되지 않았습니다.'
            });
        }

        // SMS 레코드 생성
        const smsData = {
            sender: user._id,
            senderPhone: user.phone,
            senderName: user.name || user.username,
            recipient: customer._id,
            recipientPhone: customer.phone,
            recipientName: customer.name,
            message: message,
            settings: {
                isScheduled: isScheduled || false,
                scheduledAt: scheduledAt || null
            },
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        };

        const sms = new SMS(smsData);
        await sms.save();

        // 즉시 전송인 경우
        if (!isScheduled) {
            sms.status = '전송중';
            await sms.save();

            const result = await sendSMS(customer.phone, message, user.phone);
            
            if (result.success) {
                sms.status = '전송완료';
                sms.result = {
                    messageId: result.messageId,
                    sentAt: new Date()
                };
            } else {
                sms.status = '전송실패';
                sms.result = {
                    errorMessage: result.error
                };
            }
            
            await sms.save();
        }

        res.json({
            success: true,
            message: isScheduled ? '문자가 예약되었습니다.' : '문자가 전송되었습니다.',
            data: sms
        });

    } catch (error) {
        console.error('SMS 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: 'SMS 전송 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 일괄 SMS 전송
exports.sendBulkSMS = async (req, res) => {
    try {
        const { customerIds, message, isScheduled, scheduledAt } = req.body;
        const user = req.user;

        if (!user.phone) {
            return res.status(400).json({
                success: false,
                message: '발신자 연락처가 등록되지 않았습니다.'
            });
        }

        if (!customerIds || customerIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '전송할 고객을 선택해주세요.'
            });
        }

        // 고객 정보 조회
        const customers = await Customer.find({
            _id: { $in: customerIds },
            phone: { $exists: true, $ne: null }
        });

        if (customers.length === 0) {
            return res.status(400).json({
                success: false,
                message: '전송 가능한 고객이 없습니다.'
            });
        }

        const campaignId = `bulk_${Date.now()}_${user._id}`;
        const results = [];

        for (const customer of customers) {
            const smsData = {
                sender: user._id,
                senderPhone: user.phone,
                senderName: user.name || user.username,
                recipient: customer._id,
                recipientPhone: customer.phone,
                recipientName: customer.name,
                message: message,
                settings: {
                    isScheduled: isScheduled || false,
                    scheduledAt: scheduledAt || null
                },
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    campaignId: campaignId
                }
            };

            const sms = new SMS(smsData);
            await sms.save();

            // 즉시 전송인 경우
            if (!isScheduled) {
                sms.status = '전송중';
                await sms.save();

                const result = await sendSMS(customer.phone, message, user.phone);
                
                if (result.success) {
                    sms.status = '전송완료';
                    sms.result = {
                        messageId: result.messageId,
                        sentAt: new Date()
                    };
                } else {
                    sms.status = '전송실패';
                    sms.result = {
                        errorMessage: result.error
                    };
                }
                
                await sms.save();
            }

            results.push(sms);
        }

        res.json({
            success: true,
            message: `${results.length}명에게 ${isScheduled ? '문자가 예약되었습니다.' : '문자가 전송되었습니다.'}`,
            data: {
                campaignId,
                totalSent: results.length,
                results
            }
        });

    } catch (error) {
        console.error('일괄 SMS 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '일괄 SMS 전송 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// SMS 전송 이력 조회
exports.getSMSHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, startDate, endDate } = req.query;
        const user = req.user;

        let query = { sender: user._id };

        // 상태 필터
        if (status) {
            query.status = status;
        }

        // 날짜 필터
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const smsHistory = await SMS.find(query)
            .populate('recipient', 'name phone email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await SMS.countDocuments(query);

        res.json({
            success: true,
            data: {
                smsHistory,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('SMS 이력 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: 'SMS 이력을 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// SMS 전송 취소
exports.cancelSMS = async (req, res) => {
    try {
        const { smsId } = req.params;
        const user = req.user;

        const sms = await SMS.findOne({ _id: smsId, sender: user._id });
        if (!sms) {
            return res.status(404).json({
                success: false,
                message: 'SMS를 찾을 수 없습니다.'
            });
        }

        if (sms.status === '전송완료') {
            return res.status(400).json({
                success: false,
                message: '이미 전송된 SMS는 취소할 수 없습니다.'
            });
        }

        sms.status = '취소';
        await sms.save();

        res.json({
            success: true,
            message: 'SMS가 취소되었습니다.'
        });

    } catch (error) {
        console.error('SMS 취소 오류:', error);
        res.status(500).json({
            success: false,
            message: 'SMS 취소 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// SMS 통계 조회
exports.getSMSStats = async (req, res) => {
    try {
        const user = req.user;
        const { startDate, endDate } = req.query;

        let matchQuery = { sender: user._id };
        
        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const stats = await SMS.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalSMS = await SMS.countDocuments(matchQuery);
        const todaySMS = await SMS.countDocuments({
            sender: user._id,
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        });

        res.json({
            success: true,
            data: {
                totalSMS,
                todaySMS,
                statusStats: stats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                successRate: totalSMS > 0 ? 
                    Math.round((stats.find(s => s._id === '전송완료')?.count || 0) / totalSMS * 100) : 0
            }
        });

    } catch (error) {
        console.error('SMS 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: 'SMS 통계를 조회하는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};
