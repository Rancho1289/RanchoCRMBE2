// Nodemailer.model.js

// 간단한 메모리 저장, 실제 환경에서는 Redis나 DB를 사용하는 것이 좋습니다.
let verificationCodes = {};


const saveVerificationCode = (email, code) => {
    verificationCodes[email] = code; // 이메일을 키로, 코드를 값으로 저장
    
};

const getVerificationCode = (email) => {
    return verificationCodes[email]; // 이메일에 저장된 인증 코드를 반환
};


module.exports = {
    saveVerificationCode,
    getVerificationCode
};
