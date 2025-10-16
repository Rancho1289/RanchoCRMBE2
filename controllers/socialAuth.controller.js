const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Google OAuth 토큰 교환
const getGoogleTokens = async (code) => {
    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        return response.data;
    } catch (error) {
        console.error('Google 토큰 교환 오류:', error);
        throw new Error('Google 인증에 실패했습니다.');
    }
};

// Google 사용자 정보 가져오기
const getGoogleUserInfo = async (accessToken) => {
    try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Google 사용자 정보 조회 오류:', error);
        throw new Error('Google 사용자 정보를 가져올 수 없습니다.');
    }
};

// Naver OAuth 토큰 교환
const getNaverTokens = async (code) => {
    try {
        const response = await axios.post('https://nid.naver.com/oauth2.0/token', {
            grant_type: 'authorization_code',
            client_id: process.env.NAVER_CLIENT_ID,
            client_secret: process.env.NAVER_CLIENT_SECRET,
            code,
            state: 'random_state'
        });

        return response.data;
    } catch (error) {
        console.error('Naver 토큰 교환 오류:', error);
        throw new Error('Naver 인증에 실패했습니다.');
    }
};

// Naver 사용자 정보 가져오기
const getNaverUserInfo = async (accessToken) => {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return response.data.response;
    } catch (error) {
        console.error('Naver 사용자 정보 조회 오류:', error);
        throw new Error('Naver 사용자 정보를 가져올 수 없습니다.');
    }
};

// Google 로그인 콜백 처리
exports.googleCallback = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: '인증 코드가 필요합니다.'
            });
        }

        // Google 토큰 교환
        const tokens = await getGoogleTokens(code);
        
        // Google 사용자 정보 가져오기
        const googleUser = await getGoogleUserInfo(tokens.access_token);

        // 기존 사용자 확인
        let user = await User.findOne({ 
            $or: [
                { email: googleUser.email },
                { 'socialAccounts.google': googleUser.id }
            ]
        });

        if (user) {
            // 기존 사용자 로그인
            const token = jwt.sign(
                { userId: user._id, email: user.email },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                message: 'Google 로그인이 완료되었습니다.',
                userData: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    nickname: user.nickname
                },
                token
            });
        } else {
            // 새 사용자 정보 반환 (회원가입용)
            return res.json({
                success: true,
                message: 'Google 계정 정보를 확인했습니다.',
                userData: {
                    id: googleUser.id,
                    email: googleUser.email,
                    name: googleUser.name,
                    nickname: googleUser.name // Google 이름을 닉네임으로 사용
                },
                isNewUser: true
            });
        }
    } catch (error) {
        console.error('Google 콜백 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Naver 로그인 콜백 처리
exports.naverCallback = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: '인증 코드가 필요합니다.'
            });
        }

        // Naver 토큰 교환
        const tokens = await getNaverTokens(code);
        
        // Naver 사용자 정보 가져오기
        const naverUser = await getNaverUserInfo(tokens.access_token);

        // 기존 사용자 확인
        let user = await User.findOne({ 
            $or: [
                { email: naverUser.email },
                { 'socialAccounts.naver': naverUser.id }
            ]
        });

        if (user) {
            // 기존 사용자 로그인
            const token = jwt.sign(
                { userId: user._id, email: user.email },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                message: 'Naver 로그인이 완료되었습니다.',
                userData: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    nickname: user.nickname
                },
                token
            });
        } else {
            // 새 사용자 정보 반환 (회원가입용)
            return res.json({
                success: true,
                message: 'Naver 계정 정보를 확인했습니다.',
                userData: {
                    id: naverUser.id,
                    email: naverUser.email,
                    name: naverUser.name,
                    nickname: naverUser.name // Naver 이름을 닉네임으로 사용
                },
                isNewUser: true
            });
        }
    } catch (error) {
        console.error('Naver 콜백 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 소셜 계정으로 회원가입
exports.socialSignup = async (req, res) => {
    try {
        const {
            name,
            nickname,
            contactNumber,
            birthDate,
            gender,
            email,
            companyName,
            businessNumber,
            businessAddress,
            detailedAddress,
            level,
            socialProvider,
            socialId
        } = req.body;

        // 필수 필드 검증
        if (!name || !nickname || !contactNumber || !birthDate || !gender || !email) {
            return res.status(400).json({
                success: false,
                message: '필수 정보가 누락되었습니다.'
            });
        }

        // 이메일 중복 확인
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '이미 가입된 이메일입니다.'
            });
        }

        // 새 사용자 생성
        const user = new User({
            name,
            nickname,
            contactNumber,
            birthDate,
            gender,
            email,
            companyName,
            businessNumber,
            businessAddress,
            detailedAddress,
            level: level || 1,
            socialAccounts: {
                [socialProvider]: socialId
            },
            isSocialAccount: true,
            socialProvider
        });

        await user.save();

        // JWT 토큰 생성
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: '소셜 계정으로 회원가입이 완료되었습니다.',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                nickname: user.nickname
            },
            token
        });
    } catch (error) {
        console.error('소셜 회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '회원가입 처리 중 오류가 발생했습니다.'
        });
    }
}; 