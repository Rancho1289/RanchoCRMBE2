const mongoose = require('mongoose');
const Customer = require('./models/Customer.model');

// MongoDB 연결
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/crm_project', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
        process.exit(1);
    }
};

// 고객 유형 업데이트 함수
const updateCustomerTypes = async () => {
    try {
        // 구매자를 매수자로 변경
        const buyerResult = await Customer.updateMany(
            { type: '구매자' },
            { $set: { type: '매수자' } }
        );

        // 판매자를 매도자로 변경
        const sellerResult = await Customer.updateMany(
            { type: '판매자' },
            { $set: { type: '매도자' } }
        );

        // 변경된 데이터 확인
        const buyers = await Customer.find({ type: '매수자' });
        const sellers = await Customer.find({ type: '매도자' });
        const oldBuyers = await Customer.find({ type: '구매자' });
        const oldSellers = await Customer.find({ type: '판매자' });

    } catch (error) {
        console.error('고객 유형 업데이트 실패:', error);
    }
};

// 메인 실행 함수
const main = async () => {
    await connectDB();
    await updateCustomerTypes();
    
    await mongoose.connection.close();
    process.exit(0);
};

// 스크립트 실행
main().catch(error => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
}); 