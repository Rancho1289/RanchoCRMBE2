const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User 모델과 연결
    required: true,
  },
  category: {
    type: String,
    required: true, // category가 참조할 컬렉션 이름
  },
  categoryDetailID: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'categoryModel', // categoryModel 필드의 값을 참조
    default: null, // 기본값은 null
  },
  content: {
    type: String,
    required: true,
  },
  relatedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 연관된 user 리스트
    },
  ],
}, {
  timestamps: true, // createdAt과 updatedAt 자동 관리
});

// Middleware로 기본값을 '-'로 변경
historySchema.pre('save', function (next) {
  if (!this.categoryDetailID) {
    this.categoryDetailID = '-'; // 기본값 설정
  }
  next();
});

module.exports = mongoose.model('History', historySchema);
