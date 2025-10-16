// Nodemailer.controller.js

const nodemailer = require('nodemailer');
// const { saveVerificationCode } = require('../models/Nodemailer.model');
const { saveVerificationCode, getVerificationCode } = require('../models/Nodemailer.model');

// require('dotenv').config();

// Nodemailer 설정
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


const sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 코드 생성

    // 이메일 전송 설정
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '이메일 인증 코드',
        text: `Your verification code is: ${verificationCode}`
    };

    try {
        // 이메일을 전송하는 부분을 Promise로 처리
        const info = await transporter.sendMail(mailOptions);


        // 인증 코드를 저장합니다.
        saveVerificationCode(email, verificationCode);

        // 응답으로 성공 메시지를 보냅니다.
        return res.status(200).send({ message: 'Verification code sent' });
    } catch (error) {
        console.error('Failed to send verification code:', error);

        // 오류가 발생하면 500 상태 코드와 함께 오류 메시지를 응답으로 보냅니다.
        return res.status(500).send('Failed to send verification code');
    }
};



// 인증 코드 확인 함수
const verifyCode = (req, res) => {
    const { email, code } = req.body;
    const storedCode = getVerificationCode(email);



    if (storedCode === code) {
        res.status(200).send({ message: 'Verification successful' });
    } else {
        res.status(400).send({ message: 'Invalid verification code' });
    }
};


// G마켓 크롤링 결과 메일 전송용
const sendScrapingResult = async (req, res) => {
    const { keyword, results } = req.body;

    if (!results || results.length === 0) {
        return res.status(400).json({ message: '결과가 없습니다.' });
    }

    const parsedItems = results
        .map(item => ({
            ...item,
            parsedPrice: parseInt(item.price ?.replace(/,/g, '')) || 0
        }))
        .filter(item => item.parsedPrice > 0);

    let min = null;
    let max = null;

    if (parsedItems.length > 0) {
        min = parsedItems.reduce((a, b) => (a.parsedPrice < b.parsedPrice ? a : b));
        max = parsedItems.reduce((a, b) => (a.parsedPrice > b.parsedPrice ? a : b));
    }


    // ✅ 결과 테이블 생성
    const htmlTable = `
      <h3>[${keyword}]에 대한 G마켓 상품 검색 결과</h3>
  
      <h4>📉 최저가 상품</h4>
      ${min ? `
        <p>
          <strong>${min.title}</strong> - ${min.price}원<br/>
          <a href="${min.link}" target="_blank">상품 보기</a>
        </p>
      ` : `<p>최저가 상품 정보가 없습니다.</p>`}
  
      <h4>📈 최고가 상품</h4>
      ${max ? `
        <p>
          <strong>${max.title}</strong> - ${max.price}원<br/>
          <a href="${max.link}" target="_blank">상품 보기</a>
        </p>
      ` : `<p>최고가 상품 정보가 없습니다.</p>`}
  
      <hr/>
  
      <h4>📦 전체 검색 결과 목록</h4>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>#</th>
            <th>상품명</th>
            <th>가격</th>
            <th>원가</th>
            <th>특이사항</th>
            <th>링크</th>
          </tr>
        </thead>
        <tbody>
          ${results.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${item.title}</td>
              <td>${item.price}</td>
              <td>${item.originalPrice || '-'}</td>
              <td>${item.tags ?.join(', ') || '-'}</td>
              <td><a href="${item.link}" target="_blank">보기</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'hyin9414@naver.com',
            subject: `[크롤링 결과] ${keyword} 검색 결과`,
            html: htmlTable
        });


        res.status(200).json({ message: '메일 전송 완료' });
    } catch (err) {
        console.error('❌ 메일 전송 실패:', err.message);
        res.status(500).json({ message: '메일 전송 실패', error: err.message });
    }
};


module.exports = {
    sendVerificationCode,
    verifyCode,
    sendScrapingResult // 이거 추가!
};



module.exports = {
    sendVerificationCode,
    verifyCode,
    sendScrapingResult
};
