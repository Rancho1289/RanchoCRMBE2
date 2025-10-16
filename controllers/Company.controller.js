const Company = require('../models/Company.model');
const logger = require('../utils/logger');

// 새 회사 등록 (최초 등록자 포함)
const registerNewCompany = async (req, res) => {
    try {
        console.log('📥 registerNewCompany 요청 받음:', req.body);
        
        const { 
            companyName, 
            businessNumber, 
            businessType, 
            businessAddress, 
            detailedAddress, 
            representativeName,
            contactNumber,
            email,
            initialUserId,
            initialUserEmail,
            initialUserName,
            isInitialRegistration 
        } = req.body;

        // 필수 필드 검증
        if (!companyName || !businessNumber) {
            return res.status(400).json({
                success: false,
                message: '회사명과 사업자번호는 필수입니다.',
                errors: {
                    companyName: !companyName ? '회사명을 입력해주세요.' : '',
                    businessNumber: !businessNumber ? '사업자번호를 입력해주세요.' : ''
                }
            });
        }

        // 사업자번호 중복 확인
        const existingCompany = await Company.findOne({ 
            businessNumber: businessNumber.trim(),
            status: 'active'
        });
        
        if (existingCompany) {
            return res.status(409).json({
                success: false,
                message: '이미 등록된 사업자번호입니다.',
                data: {
                    existingCompany: {
                        id: existingCompany._id,
                        companyName: existingCompany.companyName,
                        businessNumber: existingCompany.businessNumber
                    }
                }
            });
        }

        // 새 회사 생성
        const newCompany = new Company({
            companyName: companyName.trim(),
            businessNumber: businessNumber.trim(),
            businessType: businessType ? businessType.trim() : '',
            businessAddress: businessAddress ? businessAddress.trim() : '',
            detailedAddress: detailedAddress ? detailedAddress.trim() : '',
            representativeName: representativeName ? representativeName.trim() : '',
            contactNumber: contactNumber ? contactNumber.trim() : '',
            email: email ? email.trim() : '',
            status: 'active',
            createdAt: new Date(),
            
            // 최초 등록자 정보 추가
            userId: initialUserId || null,  // 기존 userId 필드도 설정
            initialUserId: initialUserId || null,
            initialUserEmail: initialUserEmail || null,
            initialUserName: initialUserName || null,
            isInitialRegistration: isInitialRegistration || false
        });

        console.log('🏢 새 회사 생성:', newCompany);
        await newCompany.save();
        console.log('✅ 회사 저장 완료:', newCompany._id);

        // 최초 등록자인 경우 사용자 정보 업데이트 로직 호출
        let userUpdateResult = null;
        if (isInitialRegistration && initialUserId) {
            console.log('👤 사용자 업데이트 시작 - initialUserId:', initialUserId);
            try {
                const User = require('../models/user.model');
                const user = await User.findById(initialUserId);
                console.log('👤 사용자 찾기 결과:', user ? '찾음' : '없음');
                
                if (user) {
                    // 사용자 레벨을 10으로 업데이트 (최초 등록자)
                    const originalLevel = user.level || 5;
                    console.log('👤 업데이트 전 사용자 상태:', {
                        name: user.name,
                        level: user.level,
                        companyId: user.companyId,
                        companyName: user.companyName
                    });
                    
                    user.level = 10;
                    user.companyName = companyName.trim();
                    user.companyId = newCompany._id.toString();
                    
                    console.log('👤 업데이트 후 사용자 상태:', {
                        name: user.name,
                        level: user.level,
                        companyId: user.companyId,
                        companyName: user.companyName
                    });
                    
                    try {
                        // findByIdAndUpdate를 사용하여 직접 업데이트
                        const updatedUser = await User.findByIdAndUpdate(
                            initialUserId,
                            {
                                level: 10,
                                companyName: companyName.trim(),
                                companyId: newCompany._id.toString()
                            },
                            { 
                                new: true,  // 업데이트된 문서 반환
                                runValidators: true  // 스키마 검증 실행
                            }
                        );
                        
                        console.log('✅ 사용자 업데이트 성공:', {
                            name: updatedUser.name,
                            level: updatedUser.level,
                            companyId: updatedUser.companyId,
                            companyName: updatedUser.companyName
                        });
                        
                        userUpdateResult = {
                            updated: true,
                            originalLevel,
                            newLevel: 10,
                            message: '최초 등록자로 레벨 10으로 설정되었습니다.'
                        };
                    } catch (updateError) {
                        console.error('❌ 사용자 업데이트 오류:', updateError);
                        userUpdateResult = {
                            updated: false,
                            error: updateError.message || '사용자 업데이트 실패'
                        };
                    }
                } else {
                    console.warn(`User with ID ${initialUserId} not found`);
                    userUpdateResult = {
                        updated: false,
                        error: '사용자를 찾을 수 없습니다.'
                    };
                }
            } catch (userError) {
                console.error('사용자 업데이트 오류:', userError);
                userUpdateResult = {
                    updated: false,
                    error: userError.message || '사용자 업데이트 실패'
                };
            }
        }

        // 성공 응답
        return res.status(201).json({
            success: true,
            message: '회사가 성공적으로 등록되었습니다.',
            data: {
                company: newCompany,
                userUpdate: userUpdateResult
            }
        });

    } catch (error) {
        console.error('회사 등록 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// 기존 회사 등록 (레거시)
const registerCompany = async (req, res) => {
    try {
        const { companyName, ceoName, businessNumber, address, detailedAddress } = req.body;
        const userId = req.user.id;

        // 필수 필드 검증
        if (!companyName || !ceoName || !businessNumber || !address) {
            return res.status(400).json({
                success: false,
                message: '모든 필수 필드를 입력해주세요.',
                errors: {
                    companyName: !companyName ? '회사명을 입력해주세요.' : '',
                    ceoName: !ceoName ? '대표자명을 입력해주세요.' : '',
                    businessNumber: !businessNumber ? '사업자등록번호를 입력해주세요.' : '',
                    address: !address ? '주소를 입력해주세요.' : ''
                }
            });
        }


        // 사업자등록번호 중복 확인
        const duplicateCompany = await Company.findOne({ 
            businessNumber: businessNumber.trim(),
            status: 'active'
        });
        if (duplicateCompany) {
            return res.status(409).json({
                success: false,
                message: '이미 등록된 사업자등록번호입니다.',
                data: {
                    existingCompany: {
                        id: duplicateCompany._id,
                        companyName: duplicateCompany.companyName,
                        businessNumber: duplicateCompany.businessNumber
                    }
                }
            });
        }

        // 새 회사 생성
        const newCompany = new Company({
            companyName: companyName.trim(),
            ceoName: ceoName.trim(),
            businessNumber: businessNumber.trim(),
            address: address.trim(),
            detailedAddress: detailedAddress ? detailedAddress.trim() : '',
            userId
        });

        await newCompany.save();

        logger.info(`회사 등록 성공: ${companyName} (사용자: ${userId})`);

        res.status(201).json({
            success: true,
            message: '회사가 성공적으로 등록되었습니다.',
            data: {
                id: newCompany._id,
                companyName: newCompany.companyName,
                ceoName: newCompany.ceoName,
                businessNumber: newCompany.businessNumber,
                address: newCompany.address,
                detailedAddress: newCompany.detailedAddress,
                status: newCompany.status,
                createdAt: newCompany.createdAt
            }
        });

    } catch (error) {
        logger.error('회사 등록 오류:', error);
        
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({
                success: false,
                message: '입력 데이터가 유효하지 않습니다.',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자의 모든 회사 정보 조회
const getMyCompanies = async (req, res) => {
    try {
        const userId = req.user.id;

        const companies = await Company.find({ userId, status: 'active' })
            .select('-__v')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: companies
        });

    } catch (error) {
        logger.error('회사 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 회사 정보 수정
const updateCompany = async (req, res) => {
    try {
        const { companyName, ceoName, businessNumber, address, detailedAddress } = req.body;
        const userId = req.user.id;

        const company = await Company.findOne({ userId });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: '등록된 회사 정보가 없습니다.'
            });
        }

        // 사업자등록번호가 변경된 경우 중복 확인
        if (businessNumber && businessNumber.trim() !== company.businessNumber) {
            const duplicateCompany = await Company.findOne({ 
                businessNumber: businessNumber.trim(),
                status: 'active',
                _id: { $ne: company._id }
            });
            if (duplicateCompany) {
                return res.status(409).json({
                    success: false,
                    message: '이미 등록된 사업자등록번호입니다.'
                });
            }
        }

        // 업데이트할 필드만 설정
        const updateData = {};
        if (companyName) updateData.companyName = companyName.trim();
        if (ceoName) updateData.ceoName = ceoName.trim();
        if (businessNumber) updateData.businessNumber = businessNumber.trim();
        if (address) updateData.address = address.trim();
        if (detailedAddress !== undefined) updateData.detailedAddress = detailedAddress.trim();

        const updatedCompany = await Company.findByIdAndUpdate(
            company._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        logger.info(`회사 정보 수정: ${updatedCompany.companyName} (사용자: ${userId})`);

        res.json({
            success: true,
            message: '회사 정보가 성공적으로 수정되었습니다.',
            data: updatedCompany
        });

    } catch (error) {
        logger.error('회사 정보 수정 오류:', error);
        
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({
                success: false,
                message: '입력 데이터가 유효하지 않습니다.',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 회사 삭제 (상태 변경)
const deleteCompany = async (req, res) => {
    try {
        const userId = req.user.id;

        const company = await Company.findOne({ userId });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: '등록된 회사 정보가 없습니다.'
            });
        }

        // 실제 삭제 대신 상태를 inactive로 변경
        await Company.findByIdAndUpdate(company._id, { status: 'inactive' });

        logger.info(`회사 삭제: ${company.companyName} (사용자: ${userId})`);

        res.json({
            success: true,
            message: '회사 정보가 삭제되었습니다.'
        });

    } catch (error) {
        logger.error('회사 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 회사 검색
const searchCompanies = async (req, res) => {
    try {
        const { q: query, type = 'companyName' } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: '검색어는 2글자 이상 입력해주세요.'
            });
        }

        let searchCondition = {};
        
        switch (type) {
            case 'companyName':
                searchCondition.companyName = { $regex: query.trim(), $options: 'i' };
                break;
            case 'ceoName':
                searchCondition.ceoName = { $regex: query.trim(), $options: 'i' };
                break;
            case 'businessNumber':
                // 사업자번호는 정확한 매칭 또는 부분 매칭
                const cleanQuery = query.trim().replace(/[^0-9]/g, '');
                if (cleanQuery.length >= 3) {
                    searchCondition.businessNumber = { $regex: cleanQuery, $options: 'i' };
                } else {
                    return res.status(400).json({
                        success: false,
                        message: '사업자번호는 3자리 이상 입력해주세요.'
                    });
                }
                break;
            case 'address':
                searchCondition.address = { $regex: query.trim(), $options: 'i' };
                break;
            default:
                // 전체 검색
                searchCondition = {
                    $or: [
                        { companyName: { $regex: query.trim(), $options: 'i' } },
                        { ceoName: { $regex: query.trim(), $options: 'i' } },
                        { businessNumber: { $regex: query.trim().replace(/[^0-9]/g, ''), $options: 'i' } },
                        { address: { $regex: query.trim(), $options: 'i' } }
                    ]
                };
        }

        const companies = await Company.find({
            ...searchCondition,
            status: 'active'
        })
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(50) // 최대 50개 결과
        .lean();

        res.json({
            success: true,
            data: companies,
            total: companies.length
        });

    } catch (error) {
        logger.error('회사 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 관리자용: 모든 회사 목록 조회 (페이지네이션, 필터링 지원)
const getAllCompanies = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            businessType,
            searchTerm,
            startDate,
            endDate
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // 필터 조건 구성
        const filter = {};
        
        if (status) {
            filter.status = status;
        }
        
        if (businessType) {
            filter.businessType = businessType;
        }
        
        if (searchTerm) {
            filter.$or = [
                { companyName: { $regex: searchTerm, $options: 'i' } },
                { businessNumber: { $regex: searchTerm, $options: 'i' } },
                { representativeName: { $regex: searchTerm, $options: 'i' } }
            ];
        }
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // 회사 목록 조회
        const companies = await Company.find(filter)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // 전체 개수 조회
        const totalItems = await Company.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limitNum);

        res.json({
            success: true,
            data: {
                companies,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems,
                    itemsPerPage: limitNum
                }
            }
        });

    } catch (error) {
        logger.error('관리자 회사 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 관리자용: 회사 통계 조회
const getCompanyStats = async (req, res) => {
    try {
        const {
            status,
            businessType,
            startDate,
            endDate
        } = req.query;

        // 필터 조건 구성
        const filter = {};
        
        if (status) {
            filter.status = status;
        }
        
        if (businessType) {
            filter.businessType = businessType;
        }
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // 통계 조회
        const [
            totalCompanies,
            activeCompanies,
            inactiveCompanies,
            newThisMonth
        ] = await Promise.all([
            Company.countDocuments(filter),
            Company.countDocuments({ ...filter, status: 'active' }),
            Company.countDocuments({ ...filter, status: 'inactive' }),
            Company.countDocuments({
                ...filter,
                createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                totalCompanies,
                activeCompanies,
                inactiveCompanies,
                newThisMonth
            }
        });

    } catch (error) {
        logger.error('회사 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 관리자용: 회사 정보 수정 (ID 기반)
const updateCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 회사 존재 확인
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: '회사를 찾을 수 없습니다.'
            });
        }

        // 회사 정보 업데이트
        const updatedCompany = await Company.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedCompany,
            message: '회사 정보가 성공적으로 수정되었습니다.'
        });

    } catch (error) {
        logger.error('회사 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 관리자용: 회사 삭제 (ID 기반)
const deleteCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        // 회사 존재 확인
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: '회사를 찾을 수 없습니다.'
            });
        }

        // 회사 삭제 (실제 삭제 또는 상태 변경)
        await Company.findByIdAndDelete(id);

        res.json({
            success: true,
            message: '회사가 성공적으로 삭제되었습니다.'
        });

    } catch (error) {
        logger.error('회사 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    registerCompany,
    registerNewCompany,
    getMyCompanies,
    updateCompany,
    deleteCompany,
    searchCompanies,
    getAllCompanies,
    getCompanyStats,
    updateCompanyById,
    deleteCompanyById
};

