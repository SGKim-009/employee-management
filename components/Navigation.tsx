'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/lib/userRole';
import ProtectedRoute from './ProtectedRoute';
import { Users, UserX, LogOut, Settings, TestTube, Menu, X, Bell, FileSpreadsheet } from 'lucide-react';
import { showToast } from '@/lib/toast';
import ThemeToggle from './ThemeToggle';
import { getUnreadNotificationCount } from '@/lib/notificationUtils';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // 알림 개수 업데이트
  useEffect(() => {
    const updateNotificationCount = () => {
      const count = getUnreadNotificationCount();
      setUnreadNotificationCount(count);
    };

    // 초기 로드
    updateNotificationCount();

    // 주기적으로 업데이트 (30초마다)
    const interval = setInterval(updateNotificationCount, 30000);

    // storage 이벤트 리스너 (다른 탭에서 알림이 변경될 때)
    window.addEventListener('storage', updateNotificationCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateNotificationCount);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      showToast.success('로그아웃되었습니다.');
      router.push('/login');
      router.refresh();
    } catch (error) {
      showToast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 로그인/회원가입 페이지에서는 네비게이션 숨김
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  // 인증되지 않은 사용자에게는 네비게이션 숨김 (ProtectedRoute가 처리)
  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 및 메인 링크 */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Users className="text-blue-600 dark:text-blue-400" size={20} />
              <span className="hidden sm:inline">인사관리 시스템</span>
              <span className="sm:hidden">인사관리</span>
            </Link>

            {/* 데스크톱 네비게이션 링크 */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className={`px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                  pathname === '/' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                재직자 관리
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                  pathname === '/dashboard' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                대시보드
              </Link>
              <Link
                href="/resigned"
                className={`px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === '/resigned' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                <UserX size={18} />
                퇴사자 관리
              </Link>
              <Link
                href="/import"
                className={`px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === '/import' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                <FileSpreadsheet size={18} />
                엑셀 임포트
              </Link>
            </div>
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* 테스트 페이지 링크 (개발 환경에서만, 데스크톱만) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="hidden lg:flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-4">
                <Link
                  href="/test/error-boundary"
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                  title="에러 바운더리 테스트"
                >
                  <TestTube size={16} />
                  <span className="hidden xl:inline">에러 테스트</span>
                </Link>
                <Link
                  href="/test/api-validation"
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                  title="API 검증 테스트"
                >
                  <TestTube size={16} />
                  <span className="hidden xl:inline">API 테스트</span>
                </Link>
              </div>
            )}

            {/* 테마 전환 버튼 */}
            <ThemeToggle />

            {/* 알림 버튼 */}
            <Link
              href="/notifications"
              className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="알림"
            >
              <Bell size={20} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </Link>

            {/* 사용자 정보 (데스크톱만) */}
            <div className="hidden md:flex items-center gap-3">
              {user && (
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {user.email}
                  </span>
                  {roleLoading ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">역할 확인 중...</span>
                  ) : role ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {role === 'admin' && '관리자'}
                      {role === 'hr' && '인사담당자'}
                      {role === 'viewer' && '조회자'}
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400" title="역할이 설정되지 않았습니다. 관리자에게 문의하세요.">
                      역할 없음
                    </span>
                  )}
                </div>
              )}

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="로그아웃"
              >
                <LogOut size={18} />
                <span>로그아웃</span>
              </button>
            </div>

            {/* 모바일 햄버거 메뉴 버튼 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="flex flex-col gap-2">
              {/* 모바일 네비게이션 링크 */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === '/' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                <Users size={18} />
                재직자 관리
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === '/dashboard' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                <Users size={18} />
                대시보드
              </Link>
              <Link
                href="/resigned"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === '/resigned' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                <UserX size={18} />
                퇴사자 관리
              </Link>
              <Link
                href="/import"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === '/import' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                <FileSpreadsheet size={18} />
                엑셀 임포트
              </Link>

              {/* 모바일 테마 전환 버튼 */}
              <div className="px-4 py-2">
                <ThemeToggle />
              </div>

              {/* 모바일 알림 링크 */}
              <Link
                href="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 ${
                  pathname === '/notifications' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="relative">
                  <Bell size={18} />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </div>
                알림
                {unreadNotificationCount > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {unreadNotificationCount}
                  </span>
                )}
              </Link>

              {/* 모바일 사용자 정보 */}
              {user && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                    {user.email}
                  </div>
                  {roleLoading ? (
                    <div className="text-xs text-gray-400 dark:text-gray-500">역할 확인 중...</div>
                  ) : role ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {role === 'admin' && '관리자'}
                      {role === 'hr' && '인사담당자'}
                      {role === 'viewer' && '조회자'}
                    </div>
                  ) : (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      역할 없음
                    </div>
                  )}
                </div>
              )}

              {/* 모바일 로그아웃 버튼 */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                로그아웃
              </button>

              {/* 모바일 테스트 페이지 링크 (개발 환경에서만) */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <Link
                      href="/test/error-boundary"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <TestTube size={16} />
                      에러 테스트
                    </Link>
                    <Link
                      href="/test/api-validation"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <TestTube size={16} />
                      API 테스트
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

