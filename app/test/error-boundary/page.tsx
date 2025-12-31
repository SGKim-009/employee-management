'use client';

import { useState } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';

// 의도적으로 에러를 발생시키는 컴포넌트
function ErrorThrower() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('테스트용 에러입니다. 에러 바운더리가 이를 잡아야 합니다.');
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-2">에러 발생 테스트</h3>
      <p className="text-sm text-gray-600 mb-4">
        아래 버튼을 클릭하면 의도적으로 에러가 발생합니다.
        ErrorBoundary가 이를 잡아서 사용자 친화적인 메시지를 표시해야 합니다.
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        에러 발생시키기
      </button>
    </div>
  );
}

// 비동기 에러 테스트 컴포넌트
function AsyncErrorThrower() {
  const [shouldThrow, setShouldThrow] = useState(false);

  const handleAsyncError = async () => {
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('비동기 에러 테스트'));
        }, 100);
      });
    } catch (error) {
      showToast.error('비동기 에러가 발생했습니다. (ErrorBoundary는 비동기 에러를 잡지 못합니다)');
      console.error('비동기 에러:', error);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">비동기 에러 테스트</h3>
      <p className="text-sm text-gray-600 mb-4">
        ErrorBoundary는 비동기 에러를 잡지 못합니다.
        비동기 에러는 try-catch나 Promise.catch로 처리해야 합니다.
      </p>
      <button
        onClick={handleAsyncError}
        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
      >
        비동기 에러 발생시키기
      </button>
    </div>
  );
}

export default function ErrorBoundaryTestPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">에러 바운더리 테스트</h1>
          <p className="text-gray-600 mb-8">
            이 페이지는 ErrorBoundary 컴포넌트의 동작을 테스트하기 위한 페이지입니다.
          </p>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">테스트 항목</h2>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>동기 에러 발생 시 ErrorBoundary가 에러를 잡는지 확인</li>
                <li>에러 발생 시 사용자 친화적인 메시지가 표시되는지 확인</li>
                <li>비동기 에러는 ErrorBoundary가 잡지 못함을 확인</li>
              </ul>
            </div>

            {/* ErrorBoundary로 감싼 에러 발생 컴포넌트 */}
            <ErrorBoundary>
              <ErrorThrower />
            </ErrorBoundary>

            {/* 비동기 에러 테스트 (ErrorBoundary로 감싸지 않음) */}
            <AsyncErrorThrower />

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">참고사항</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>ErrorBoundary는 렌더링 중 발생하는 동기 에러만 잡습니다.</li>
                <li>비동기 에러(이벤트 핸들러, setTimeout, Promise 등)는 try-catch로 처리해야 합니다.</li>
                <li>에러가 발생하면 ErrorBoundary의 fallback UI가 표시됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}

