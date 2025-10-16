const News = require('../models/News.model');

// 뉴스 생성
const createNews = async (req, res) => {
  try {
    const { title, subtitle, publishDate, linkUrl } = req.body;

    // 필수 필드 검증
    if (!title || !publishDate || !linkUrl) {
      return res.status(400).json({
        success: false,
        message: '제목, 작성날짜, 링크주소는 필수 입력 항목입니다.'
      });
    }

    // URL 형식 검증
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(linkUrl)) {
      return res.status(400).json({
        success: false,
        message: '올바른 URL 형식이 아닙니다.'
      });
    }

    const news = new News({
      title,
      subtitle: subtitle || '',
      publishDate: new Date(publishDate),
      linkUrl
    });

    await news.save();

    res.status(201).json({
      success: true,
      message: '뉴스가 성공적으로 생성되었습니다.',
      data: news
    });
  } catch (error) {
    console.error('뉴스 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '뉴스 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 모든 뉴스 조회 (페이지네이션)
const getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'publishDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = { isActive: true };
    
    // 검색 기능
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { subtitle: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // 날짜 범위 필터
    if (req.query.startDate) {
      filter.publishDate = { ...filter.publishDate, $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filter.publishDate = { ...filter.publishDate, $lte: new Date(req.query.endDate) };
    }

    const news = await News.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('뉴스 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '뉴스 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 특정 뉴스 조회
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: '해당 뉴스를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('뉴스 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '뉴스 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 뉴스 수정
const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, publishDate, linkUrl } = req.body;

    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: '해당 뉴스를 찾을 수 없습니다.'
      });
    }

    // URL 형식 검증
    if (linkUrl) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(linkUrl)) {
        return res.status(400).json({
          success: false,
          message: '올바른 URL 형식이 아닙니다.'
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (publishDate) updateData.publishDate = new Date(publishDate);
    if (linkUrl) updateData.linkUrl = linkUrl;

    const updatedNews = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: '뉴스가 성공적으로 수정되었습니다.',
      data: updatedNews
    });
  } catch (error) {
    console.error('뉴스 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '뉴스 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 뉴스 삭제 (소프트 삭제)
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: '해당 뉴스를 찾을 수 없습니다.'
      });
    }

    await News.findByIdAndUpdate(id, { isActive: false });

    res.status(200).json({
      success: true,
      message: '뉴스가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('뉴스 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '뉴스 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 뉴스 완전 삭제
const hardDeleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: '해당 뉴스를 찾을 수 없습니다.'
      });
    }

    await News.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: '뉴스가 완전히 삭제되었습니다.'
    });
  } catch (error) {
    console.error('뉴스 완전 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '뉴스 완전 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 최신 뉴스 조회
const getLatestNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const news = await News.find({ isActive: true })
      .sort({ publishDate: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('최신 뉴스 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '최신 뉴스 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

module.exports = {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  hardDeleteNews,
  getLatestNews
};