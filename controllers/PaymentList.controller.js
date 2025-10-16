const Payment = require('../models/PaymentList.model');


const PaymentController = {};


PaymentController.createPayment = async (req, res) => {
    try {
        const paymentData = req.body;

        // seller 정보가 제대로 전달되었는지 확인
        if (!paymentData.seller || !paymentData.seller.id) {
            return res.status(400).json({ message: 'Seller information is missing' });
        }

        const newPayment = new Payment(paymentData);
        await newPayment.save();

        // 생성된 Payment 객체와 명시적으로 _id 반환
        res.status(201).json({
            message: 'Payment successful',
            data: newPayment,
            id: newPayment._id, // _id 필드를 명시적으로 추가
        });
    } catch (error) {
        console.error('Error in createPayment:', error); // 에러 로그 추가
        res.status(500).json({ message: 'Failed to process payment', error });
    }
};



// 모든 결제 내역 조회
PaymentController.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find();
        res.status(200).json({ data: payments });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve payments', error });
    }
};


PaymentController.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ status: 'fail', message: 'Payment not found' });
        }
        res.status(200).json({ status: 'success', data: payment });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch payment', error });
    }
};

PaymentController.deletePayment = async (req, res) => {
    try {
        const { id } = req.params;

        // ID로 결제 내역 찾기
        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({ status: 'fail', message: 'Payment not found' });
        }

        // 결제 내역 삭제
        await Payment.findByIdAndDelete(id);

        res.status(200).json({ status: 'success', message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error in deletePayment:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete payment', error });
    }
};


module.exports = PaymentController;