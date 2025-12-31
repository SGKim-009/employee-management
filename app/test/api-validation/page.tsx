'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ApiValidationTestPage() {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    employeeNumber?: { exists: boolean };
    email?: { exists: boolean };
  }>({});

  const checkEmployeeNumber = async () => {
    if (!employeeNumber.trim()) {
      showToast.error('사원번호를 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/employees/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: 'employee_number',
          value: employeeNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '중복 확인 실패');
      }

      setResults((prev) => ({ ...prev, employeeNumber: data }));
      if (data.exists) {
        showToast.error(`사원번호 "${employeeNumber}"는 이미 사용 중입니다.`);
      } else {
        showToast.success(`사원번호 "${employeeNumber}"는 사용 가능합니다.`);
      }
    } catch (error: any) {
      showToast.error(error.message || '중복 확인 중 오류가 발생했습니다.');
      console.error('Error checking employee number:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEmail = async () => {
    if (!email.trim()) {
      showToast.error('이메일을 입력하세요.');
      return;
    }

    // 간단한 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast.error('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/employees/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: 'email',
          value: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '중복 확인 실패');
      }

      setResults((prev) => ({ ...prev, email: data }));
      if (data.exists) {
        showToast.error(`이메일 "${email}"는 이미 사용 중입니다.`);
      } else {
        showToast.success(`이메일 "${email}"는 사용 가능합니다.`);
      }
    } catch (error: any) {
      showToast.error(error.message || '중복 확인 중 오류가 발생했습니다.');
      console.error('Error checking email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">서버 사이드 검증 API 테스트</h1>
          <p className="text-gray-600 mb-8">
            이 페이지는 서버 사이드 중복 검증 API의 동작을 테스트합니다.
          </p>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">테스트 항목</h2>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>사원번호 중복 확인 API 테스트</li>
                <li>이메일 중복 확인 API 테스트</li>
                <li>에러 처리 확인</li>
              </ul>
            </div>

            {/* 사원번호 중복 확인 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">사원번호 중복 확인</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  placeholder="사원번호 입력 (예: EMP0001)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      checkEmployeeNumber();
                    }
                  }}
                />
                <button
                  onClick={checkEmployeeNumber}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <LoadingSpinner size="sm" /> : '확인'}
                </button>
              </div>
              {results.employeeNumber && (
                <div className={`mt-4 p-3 rounded-lg ${
                  results.employeeNumber.exists
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    results.employeeNumber.exists ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {results.employeeNumber.exists
                      ? `❌ 사원번호 "${employeeNumber}"는 이미 사용 중입니다.`
                      : `✅ 사원번호 "${employeeNumber}"는 사용 가능합니다.`}
                  </p>
                </div>
              )}
            </div>

            {/* 이메일 중복 확인 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">이메일 중복 확인</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 입력 (예: test@example.com)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      checkEmail();
                    }
                  }}
                />
                <button
                  onClick={checkEmail}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <LoadingSpinner size="sm" /> : '확인'}
                </button>
              </div>
              {results.email && (
                <div className={`mt-4 p-3 rounded-lg ${
                  results.email.exists
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    results.email.exists ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {results.email.exists
                      ? `❌ 이메일 "${email}"는 이미 사용 중입니다.`
                      : `✅ 이메일 "${email}"는 사용 가능합니다.`}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">참고사항</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>이 API는 서버 사이드에서 데이터베이스를 직접 조회하여 중복을 확인합니다.</li>
                <li>클라이언트 사이드 검증과 함께 사용하면 더욱 안전합니다.</li>
                <li>실제 데이터베이스에 저장된 데이터를 기준으로 확인합니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}

