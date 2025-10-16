const mongoose = require('mongoose');
const Customer = require('./models/Customer.model');
const Property = require('./models/Property.model');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/crm_project', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const migrateCustomerProperties = async () => {
    try {
        // 모든 고객 조회
        const customers = await Customer.find({});

        let migratedCount = 0;
        let errorCount = 0;

        for (const customer of customers) {
            try {
                // 기존 property, propertyId 필드 확인
                const oldProperty = customer.property;
                const oldPropertyId = customer.propertyId;
                const oldAskingPrice = customer.askingPrice;
                const oldMonthlyRent = customer.monthlyRent;
                const oldDeposit = customer.deposit;
                const oldJeonseDeposit = customer.jeonseDeposit;

                // 새로운 properties 배열 생성
                const properties = [];

                // 기존 매물 정보가 있는 경우
                if (oldPropertyId || oldProperty) {
                    let propertyId = oldPropertyId;
                    
                    // oldProperty가 문자열인 경우 (매물 제목), 해당 매물을 찾아서 ID로 변환
                    if (!oldPropertyId && oldProperty && typeof oldProperty === 'string') {
                        const property = await Property.findOne({ title: oldProperty });
                        if (property) {
                            propertyId = property._id;
                        }
                    }

                    if (propertyId) {
                        const property = await Property.findById(propertyId);
                        if (property) {
                            properties.push({
                                property: propertyId,
                                askingPrice: oldAskingPrice || null,
                                monthlyRent: oldMonthlyRent || null,
                                deposit: oldDeposit || null,
                                jeonseDeposit: oldJeonseDeposit || null,
                                addedAt: new Date()
                            });
                        }
                    }
                }

                // 고객 업데이트
                await Customer.findByIdAndUpdate(customer._id, {
                    $set: {
                        properties: properties
                    },
                    $unset: {
                        property: 1,
                        propertyId: 1,
                        askingPrice: 1,
                        monthlyRent: 1,
                        deposit: 1,
                        jeonseDeposit: 1
                    }
                });

                migratedCount++;

            } catch (error) {
                errorCount++;
                console.error(`고객 "${customer.name}" 마이그레이션 실패:`, error.message);
            }
        }

    } catch (error) {
        console.error('마이그레이션 중 오류 발생:', error);
    } finally {
        mongoose.connection.close();
    }
};

// 마이그레이션 실행
migrateCustomerProperties(); 