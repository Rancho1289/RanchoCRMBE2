const SubscriptionHistory = require('../models/SubscriptionHistory.model.js');
const User = require('../models/user.model.js');
const Subscription = require('../models/Subscription.model.js');

const subscriptionHistoryController = {};

// 히스토리 생성
subscriptionHistoryController.createHistory = async (data) => {
  try {
    const history = new SubscriptionHistory({
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      action: data.action,
      description: data.description,
      amount: data.amount,
      currency: data.currency || 'KRW',
      paymentKey: data.paymentKey,
      orderId: data.orderId,
      status: data.status || 'success',
      errorMessage: data.errorMessage,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      adminUserId: data.adminUserId
    });

    await history.save();
    return history;
  } catch (error) {
    console.error('히스토리 생성 오류:', error);
    throw error;
  }
};

// 사용자별 히스토리 조회
subscriptionHistoryController.getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, action, status, startDate, endDate } = req.query;

    // 필터 조건 구성
    const filter = { userId };
    if (action) filter.action = action;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const [histories, total] = await Promise.all([
      SubscriptionHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('subscriptionId', 'planName planId status')
        .populate('adminUserId', 'name email'),
      SubscriptionHistory.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        histories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('사용자 히스토리 조회 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '히스토리 조회 중 오류가 발생했습니다.'
    });
  }
};

// 전체 히스토리 조회 (관리자용)
subscriptionHistoryController.getAllHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, status, startDate, endDate, actionGroup } = req.query;

    // 필터 조건 구성
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (status) filter.status = status;
    if (actionGroup) {
      const actionGroups = {
        subscription_management: ['subscription_created', 'subscription_activated', 'subscription_cancelled', 'subscription_suspended', 'subscription_resumed', 'subscription_expired'],
        payment: ['payment_success', 'payment_failed', 'payment_cancelled', 'manual_payment', 'retry_payment'],
        settings: ['billing_key_updated', 'plan_changed', 'auto_renewal_enabled', 'auto_renewal_disabled'],
        admin: ['admin_action', 'refund_processed']
      };
      if (actionGroups[actionGroup]) {
        filter.action = { $in: actionGroups[actionGroup] };
      }
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const [histories, total] = await Promise.all([
      SubscriptionHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email companyName')
        .populate('subscriptionId', 'planName planId status')
        .populate('adminUserId', 'name email'),
      SubscriptionHistory.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        histories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('전체 히스토리 조회 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '히스토리 조회 중 오류가 발생했습니다.'
    });
  }
};

// 히스토리 통계
subscriptionHistoryController.getHistoryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const stats = await SubscriptionHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            action: '$action',
            status: '$status',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      },
      { $sort: { '_id.date': -1 } }
    ]);

    // 액션별 통계
    const actionStats = await SubscriptionHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          successCount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        dailyStats: stats,
        actionStats: actionStats
      }
    });
  } catch (error) {
    console.error('히스토리 통계 조회 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '통계 조회 중 오류가 발생했습니다.'
    });
  }
};

// 특정 히스토리 상세 조회
subscriptionHistoryController.getHistoryDetail = async (req, res) => {
  try {
    const { historyId } = req.params;
    
    const history = await SubscriptionHistory.findById(historyId)
      .populate('userId', 'name email companyName')
      .populate('subscriptionId', 'planName planId status billingKey')
      .populate('adminUserId', 'name email');

    if (!history) {
      return res.status(404).json({
        status: 'fail',
        message: '히스토리를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    console.error('히스토리 상세 조회 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '히스토리 상세 조회 중 오류가 발생했습니다.'
    });
  }
};

module.exports = subscriptionHistoryController; 