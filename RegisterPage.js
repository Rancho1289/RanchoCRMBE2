import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState(1);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secPassword, setSecPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailDuplicateError, setEmailDuplicateError] = useState('');
  const [businessNumberError, setBusinessNumberError] = useState('');
  const [businessNumberSuccess, setBusinessNumberSuccess] = useState('');
  const navigate = useNavigate();

  // 닉네임 중복 검사
  useEffect(() => {
    const checkNickname = async () => {
      if (nickname.trim() === '') {
        setNicknameError('');
        setNicknameSuccess('');
        return;
      }

      try {
        const response = await api.get(`/user/check-nickname/${nickname}`);
        if (response.data.status === 'fail') {
          setNicknameError('이미 사용 중인 닉네임입니다.');
          setNicknameSuccess('');
        } else {
          setNicknameError('');
          setNicknameSuccess('사용 가능한 닉네임입니다.');
        }
      } catch (error) {
        setNicknameError('서버 오류가 발생했습니다.');
        setNicknameSuccess('');
      }
    };

    checkNickname();
  }, [nickname]);

  // 이메일 중복 검사
  useEffect(() => {
    const checkEmail = async () => {
      if (email.trim() === '') {
        setEmailDuplicateError('');
        setEmailSuccess('');
        return;
      }

      try {
        const response = await api.get(`/user/check-email/${email}`);
        if (response.data.status === 'fail') {
          setEmailDuplicateError('이미 사용 중인 이메일입니다.');
          setEmailSuccess('');
        } else {
          setEmailDuplicateError('');
          setEmailSuccess('사용 가능한 이메일입니다.');
        }
      } catch (error) {
        setEmailDuplicateError('서버 오류가 발생했습니다.');
        setEmailSuccess('');
      }
    };

    checkEmail();
  }, [email]);

  // 사업자 등록번호 중복 검사 및 최초 등록자 확인
  useEffect(() => {
    const checkBusinessNumber = async () => {
      if (businessNumber.trim() === '') {
        setBusinessNumberError('');
        setBusinessNumberSuccess('');
        return;
      }

      try {
        const response = await api.get(`/user/check-business-number/${businessNumber}`);
        if (response.data.status === 'fail') {
          setBusinessNumberError('이미 등록된 사업자 등록번호입니다.');
          setBusinessNumberSuccess('');
        } else {
          setBusinessNumberError('');
          if (response.data.isFirstEmployee) {
            setBusinessNumberSuccess('해당 사업자의 최초 등록자입니다. 해당 업체의 관리자 권한이 부여됩니다.');
            setLevel(10); // 관리자 레벨로 설정
          } else {
            setBusinessNumberSuccess('사용 가능한 사업자 등록번호입니다.');
            setLevel(1); // 일반 사용자 레벨로 설정
          }
        }
      } catch (error) {
        setBusinessNumberError('서버 오류가 발생했습니다.');
        setBusinessNumberSuccess('');
      }
    };

    checkBusinessNumber();
  }, [businessNumber]);

  // 이메일 형식 검증 함수
  const validateEmailFormat = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // 비밀번호 강도 검증 함수
  const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  // 연락처 검증 함수
  const validatePhoneNumber = (contactNumber) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(contactNumber);
  };

  // 사업자 등록번호 검증 함수
  const validateBusinessNumber = (businessNumber) => {
    const cleanNumber = businessNumber.replace(/-/g, '');
    const businessRegex = /^[0-9]{10}$/;
    return businessRegex.test(cleanNumber);
  };

  // 사업자 등록번호 포맷팅 함수
  const formatBusinessNumber = (value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length <= 3) {
      return cleanValue;
    } else if (cleanValue.length <= 5) {
      return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
    } else {
      return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3, 5)}-${cleanValue.slice(5, 10)}`;
    }
  };

  // 이메일 변경 핸들러
  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);

    if (!validateEmailFormat(emailValue)) {
      setEmailError('유효한 이메일 주소를 입력하세요.');
    } else {
      setEmailError('');
    }
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e) => {
    const passwordValue = e.target.value;
    setPassword(passwordValue);

    if (!validatePasswordStrength(passwordValue)) {
      setPasswordError('비밀번호는 최소 8자, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.');
    } else {
      setPasswordError('');
    }
  };

  // 생년월일 입력 핸들링
  const handleBirthDateChange = (e) => {
    const input = e.target.value;
    const regex = /^[0-9.]*$/;

    if (regex.test(input)) {
      let formattedInput = input
        .replace(/^(\d{4})(\d)/, "$1.$2")
        .replace(/^(\d{4})\.(\d{2})(\d)/, "$1.$2.$3");
      setBirthDate(formattedInput);
    }
  };

  // 사업자 등록번호 입력 핸들링
  const handleBusinessNumberChange = (e) => {
    const input = e.target.value;
    const formattedInput = formatBusinessNumber(input);
    setBusinessNumber(formattedInput);
  };

  // 모든 입력 필드 처리 함수
  const handleChange = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case 'name':
        setName(value);
        break;
      case 'nickname':
        setNickname(value);
        break;
      case 'contactNumber':
        setContactNumber(value);
        break;
      case 'birthDate':
        handleBirthDateChange(e);
        break;
      case 'gender':
        setGender(value);
        break;
      case 'email':
        handleEmailChange(e);
        break;
      case 'password':
        handlePasswordChange(e);
        break;
      case 'secPassword':
        setSecPassword(value);
        break;
      case 'companyName':
        setCompanyName(value);
        break;
      case 'businessNumber':
        handleBusinessNumberChange(e);
        break;
      case 'businessAddress':
        setBusinessAddress(value);
        break;
      case 'detailedAddress':
        setDetailedAddress(value);
        break;
      default:
        break;
    }
  };

  // 주소 검색 함수
  const openAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        setBusinessAddress(data.address);
      }
    }).open();
  };

  // 이메일 인증 코드 발송 함수
  const handleSendVerificationCode = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/nodemailer/send-verification-code', { email });

      if (response.status === 200) {
        setVerificationMessage('인증 코드를 해당 메일에서 확인하세요.');
      } else {
        throw new Error('인증 코드를 전송할 수 없습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 인증 코드 확인 함수
  const handleVerifyCode = async () => {
    try {
      const response = await api.post('/nodemailer/verify-code', { email, code: verificationCode });
      if (response.status === 200) {
        alert("인증이 완료되었습니다.");
        setEmailVerified(true);
      } else {
        throw new Error("잘못된 인증 코드입니다. 다시 확인해주세요.");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // 폼 제출 처리 함수
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // 검증 로직
      if (!name.trim() || !nickname.trim() || !contactNumber.trim() || !birthDate || !gender) {
        throw new Error("이름, 닉네임, 연락처, 생년월일 및 성별을 모두 입력해 주세요.");
      }

      if (nicknameError) {
        throw new Error(nicknameError);
      }

      if (businessNumberError) {
        throw new Error(businessNumberError);
      }

      if (!emailVerified) {
        throw new Error("이메일 인증을 완료해 주세요.");
      }

      if (!validatePhoneNumber(contactNumber)) {
        throw new Error("유효한 연락처 번호를 입력하세요.");
      }

      if (!validateBusinessNumber(businessNumber)) {
        throw new Error("유효한 사업자 등록번호를 입력하세요. (10자리 숫자)");
      }

      if (password !== secPassword) {
        throw new Error("패스워드가 일치하지 않습니다. 다시 입력해주세요.");
      }

      if (!validatePasswordStrength(password)) {
        throw new Error("비밀번호는 최소 8자, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.");
      }

      if (!validateEmailFormat(email)) {
        throw new Error("유효한 이메일 주소를 입력하세요.");
      }

      // API 호출
      const response = await api.post('/user', {
        name,
        nickname,
        contactNumber,
        birthDate,
        gender,
        email,
        password,
        companyName,
        businessNumber: businessNumber.replace(/-/g, ''), // 하이픈 제거하여 전송
        businessAddress,
        detailedAddress,
        level // 최초 등록자 여부에 따라 설정된 레벨
      });

      if (response.status === 200) {
        alert(level === 10 ? "회원가입이 완료되었습니다. 해당 업체의 관리자 권한이 부여되었습니다." : "회원가입이 완료되었습니다.");
        navigate('/login');
      } else {
        throw new Error(response.data?.message || "회원가입 실패. 다시 시도해주세요.");
      }
    } catch (error) {
      const errorMsg = error?.message || "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.";
      setError(errorMsg);
    }
  };

  return (
    <div className="display-center">
      <Form className="login-box" onSubmit={handleSubmit}>
        <h1>회원가입</h1>

        <Form.Group className="mb-3" controlId="formBasicName">
          <Form.Label>이름</Form.Label>
          <Form.Control
            type="text"
            placeholder="이름을 입력하세요"
            name="name"
            value={name}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicNickname">
          <Form.Label>닉네임</Form.Label>
          <Form.Control
            type="text"
            placeholder="닉네임을 입력하세요"
            name="nickname"
            value={nickname}
            onChange={handleChange}
          />
          {nicknameError && <div className="errorMSG">{nicknameError}</div>}
          {nicknameSuccess && <div className="successMSG">{nicknameSuccess}</div>}
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicContact">
          <Form.Label>연락처</Form.Label>
          <Form.Control
            type="text"
            placeholder="연락처를 입력하세요 (예: 01012345678)"
            name="contactNumber"
            value={contactNumber}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicBirthDate">
          <Form.Label>생년월일</Form.Label>
          <Form.Control
            type="text"
            name="birthDate"
            value={birthDate}
            onChange={handleBirthDateChange}
            placeholder="YYYY.MM.DD"
            maxLength="10"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicGender">
          <Form.Label>성별</Form.Label>
          <div className="d-flex justify-content-end">
            <Button
              variant={gender === 'male' ? 'primary' : 'outline-primary'}
              onClick={() => setGender('male')}
              className="me-2"
            >
              남성
            </Button>
            <Button
              variant={gender === 'female' ? 'primary' : 'outline-primary'}
              onClick={() => setGender('female')}
            >
              여성
            </Button>
          </div>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>이메일 주소</Form.Label>
          <Form.Control
            type="email"
            placeholder="이메일을 입력하세요"
            name="email"
            value={email}
            onChange={handleChange}
          />
          {emailError && <div className="errorMSG">{emailError}</div>}
          {emailDuplicateError && <div className="errorMSG">{emailDuplicateError}</div>}
          {emailSuccess && <div className="successMSG">{emailSuccess}</div>}
        </Form.Group>

        <div className="d-flex justify-content-end">
          <Button onClick={handleSendVerificationCode} disabled={isLoading}>
            인증 코드 발송
          </Button>
        </div>

        {isLoading && (
          <Spinner animation="border" role="status" style={{ width: '50px', height: '50px' }} variant="info">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        )}

        {verificationMessage && <div className="verificationMSG">{verificationMessage}</div>}

        <div className="verification-section">
          <Form.Group className="mb-3" controlId="formVerificationCode">
            <Form.Label>인증 코드</Form.Label>
            <Form.Control
              type="text"
              placeholder="이메일로 받은 인증 코드를 입력하세요"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button onClick={handleVerifyCode}>인증 코드 확인</Button>
          </div>
        </div>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>비밀번호</Form.Label>
          <Form.Control
            type="password"
            placeholder="비밀번호를 입력하세요"
            name="password"
            value={password}
            onChange={handleChange}
          />
          {passwordError && <div className="errorMSG">{passwordError}</div>}
          <small className="text-muted">
            비밀번호는 최소 8자, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.
          </small>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formSecPassword">
          <Form.Label>비밀번호 확인</Form.Label>
          <Form.Control
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            name="secPassword"
            value={secPassword}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formCompanyName">
          <Form.Label>회사명</Form.Label>
          <Form.Control
            type="text"
            placeholder="회사명을 입력하세요"
            name="companyName"
            value={companyName}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBusinessNumber">
          <Form.Label>사업자 등록번호</Form.Label>
          <Form.Control
            type="text"
            placeholder="사업자 등록번호를 입력하세요 (예: 123-45-67890)"
            name="businessNumber"
            value={businessNumber}
            onChange={handleChange}
            maxLength="12"
          />
          {businessNumberError && <div className="errorMSG">{businessNumberError}</div>}
          {businessNumberSuccess && <div className="successMSG">{businessNumberSuccess}</div>}
          <small className="text-muted">
            숫자만 입력하면 자동으로 하이픈(-)이 추가됩니다.
          </small>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBusinessAddress">
          <Form.Label>사업장 주소</Form.Label>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="사업장 주소를 입력하세요"
              name="businessAddress"
              value={businessAddress}
              readOnly
            />
            <Button onClick={openAddressSearch}><FontAwesomeIcon icon={faSearch} /></Button>
          </div>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formDetailedAddress">
          <Form.Label>상세 주소</Form.Label>
          <Form.Control
            type="text"
            placeholder="상세 주소를 입력하세요"
            name="detailedAddress"
            value={detailedAddress}
            onChange={handleChange}
          />
        </Form.Group>

        <Button className="button-primary" type="submit" disabled={!!nicknameError || !!businessNumberError}>
          회원가입
        </Button>

        {error && <div className="errorMSG">{error}</div>}
      </Form>
    </div>
  );
};

export default RegisterPage;
