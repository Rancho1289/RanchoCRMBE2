const mongoose = require('mongoose');
const User = require('./models/user.model'); // 사용자 모델
require('dotenv').config();

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI_PROD)
    .then(() => {
        return updateUsersWithFields();
    })
    .catch((err) => { console.error("DB connected fail", err) });

// `requestList`, `proposalList`, `ReceiveList` 필드가 없는 모든 사용자 업데이트
async function updateUsersWithFields() {
  try {
    await User.updateMany(
      { 
        $or: [
          { requestList: { $exists: false } }, // requestList가 없는 사용자
          { proposalList: { $exists: false } }, // proposalList가 없는 사용자
          { ReceiveList: { $exists: false } }   // ReceiveList가 없는 사용자
        ]
      },
      { 
        $set: { 
          requestList: [],  // 빈 배열로 설정
          proposalList: [], // 빈 배열로 설정
          ReceiveList: []   // 빈 배열로 설정
        } 
      }
    );
  } catch (err) {
    console.error('업데이트 중 오류 발생:', err);
  } finally {
    mongoose.disconnect(); // MongoDB 연결 종료
  }
}
