const mongoose = require('mongoose');
const Property = require('./models/Property.model');
const User = require('./models/user.model');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/crm_project', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const updatePropertyPublishers = async () => {
    try {
        // 현재 로그인한 사용자 ID (실제 사용자 ID로 변경 필요)
        const currentUserId = '6885826e46d149a6ecaeb344'; // 로그에서 확인한 사용자 ID
        
        // publisher가 null이거나 존재하지 않는 User를 참조하는 매물들 찾기
        const properties = await Property.find({
            isDeleted: false,
            $or: [
                { publisher: null },
                { publisher: { $exists: false } }
            ]
        });
        
        // 각 매물의 publisher를 현재 사용자로 업데이트
        for (const property of properties) {
            await Property.findByIdAndUpdate(property._id, {
                publisher: currentUserId
            });
        }
        
        // 존재하지 않는 User를 참조하는 매물들도 업데이트
        const User = require('./models/user.model');
        const existingUserIds = await User.find({}).select('_id');
        const existingUserIdStrings = existingUserIds.map(u => u._id.toString());
        
        const propertiesWithInvalidPublisher = await Property.find({
            isDeleted: false,
            publisher: { $nin: existingUserIdStrings }
        });
        
        for (const property of propertiesWithInvalidPublisher) {
            await Property.findByIdAndUpdate(property._id, {
                publisher: currentUserId
            });
        }
        
    } catch (error) {
        console.error('매물 publisher 업데이트 오류:', error);
    } finally {
        mongoose.connection.close();
    }
};

updatePropertyPublishers(); 