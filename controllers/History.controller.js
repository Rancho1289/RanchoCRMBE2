// History.controller.js
const History = require('../models/History.model');

// 새로운 히스토리 생성
const createHistory = async (req, res) => {
  try {
    const { author, category, content, relatedUsers, location } = req.body;

    const newHistory = new History({
      author,
      category,
      content,
      relatedUsers,
      location, // 위도와 경도 추가
    });

    await newHistory.save();

    res.status(201).json({ status: 'success', data: newHistory });
  } catch (error) {
    console.error('History 등록 실패:', error);
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

// 모든 히스토리 조회
const getAllHistories = async (req, res) => {
  try {
    const { author, category } = req.query;

    const filter = {};
    if (author) filter.author = author;
    if (category) filter.category = category;

    const histories = await History.find(filter)
      .populate('author', 'name email')
      .populate('relatedUsers', 'name email');

    res.status(200).json({ status: 'success', data: histories });
  } catch (error) {
    console.error('Failed to fetch histories:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to fetch histories.', error: error.message });
  }
};

// 특정 히스토리 조회
const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await History.findById(id)
      .populate('author', 'name email contactNumber nickname')
      .populate('relatedUsers', 'name email contactNumber nickname');

    if (!history) {
      return res.status(404).json({ status: 'fail', message: 'History not found' });
    }

    res.status(200).json({ status: 'success', data: history });
  } catch (error) {
    console.error('Failed to fetch history by ID:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to fetch history.', error: error.message });
  }
};

// 히스토리 업데이트
const updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, content, relatedUsers, location } = req.body;

    const updatedHistory = await History.findByIdAndUpdate(
      id,
      { category, content, relatedUsers, location },
      { new: true, runValidators: true }
    );

    if (!updatedHistory) {
      return res.status(404).json({ status: 'fail', message: 'History not found' });
    }

    res.status(200).json({ status: 'success', data: updatedHistory });
  } catch (error) {
    console.error('Failed to update history:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to update history.', error: error.message });
  }
};

// 히스토리 삭제
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedHistory = await History.findByIdAndDelete(id);

    if (!deletedHistory) {
      return res.status(404).json({ status: 'fail', message: 'History not found' });
    }

    res.status(200).json({ status: 'success', message: 'History deleted successfully' });
  } catch (error) {
    console.error('Failed to delete history:', error);
    res.status(500).json({ status: 'fail', message: 'Failed to delete history.', error: error.message });
  }
};

// HistoryController 객체로 메서드 묶음
const HistoryController = {
  createHistory,
  getAllHistories,
  getHistoryById,
  updateHistory,
  deleteHistory,
};

module.exports = HistoryController;
