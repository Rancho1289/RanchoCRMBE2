const notificationPermission = (req, res, next) => {
    try {
        // 사용자 정보가 없으면 권한 없음
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다.'
            });
        }

        const { level, email } = req.user;

        // level 90 이상이거나 특정 이메일인 경우 허용
        if (level >= 90 || email === 'hyin9414@gmail.com') {
            return next();
        }

        // 권한이 없는 경우
        return res.status(403).json({
            success: false,
            message: '공지사항 등록 권한이 없습니다. 관리자에게 문의하세요.'
        });

    } catch (error) {
        console.error('공지사항 권한 체크 오류:', error);
        return res.status(500).json({
            success: false,
            message: '권한 확인 중 오류가 발생했습니다.'
        });
    }
};

module.exports = notificationPermission;
