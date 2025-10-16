const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    quotation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quotation',
        required: true,
    },
    responder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    buyer: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // User 모델 참조
        },
        name: String,
        email: String,
        companyName: String,
        businessNumber: String,
        businessAddress: String,
        contactNumber: String,
    },
    seller: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // User 모델 참조
        },
        name: String,
        email: String,
        companyName: String,
        businessNumber: String,
        businessAddress: String,
        contactNumber: String,
    },
    product: {
        software: String,
        price: String,
        currency: String,
    },
    recommendedSoftware: String,
    techSupportAvailable: Boolean,
    techSupportPrice: String,
    techSupportDuration: String,
    educationMaterials: Boolean,
    installationFiles: Boolean,
    totalPrice: String,
    SoftwarePrice: String,
    currency: String,
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Payment', PaymentSchema);
