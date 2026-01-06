'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, MessageCircle } from 'lucide-react';
import { getUnreadNotificationCount } from '@/lib/notificationUtils';

export default function Header() {
  const pathname = usePathname();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateNotificationCount = () => {
      const count = getUnreadNotificationCount();
      setUnreadNotificationCount(count);
    };

    updateNotificationCount();
    const interval = setInterval(updateNotificationCount, 30000);
    window.addEventListener('storage', updateNotificationCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateNotificationCount);
    };
  }, []);

  // 로그인/회원가입 페이지에서는 헤더 숨김
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const getPageTitle = () => {
    if (pathname === '/') return '임직원 관리';
    if (pathname === '/dashboard') return '인사 현황';
    if (pathname === '/payroll') return '급여 관리';
    if (pathname === '/leaves') return '휴가 관리';
    if (pathname?.startsWith('/evaluations')) return '성과 평가';
    if (pathname === '/org-chart') return '조직도';
    if (pathname === '/import') return '엑셀 임포트';
    if (pathname === '/resigned') return '퇴사자 관리';
    return '인사관리 시스템';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="fixed left-0 lg:left-64 top-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30">
      <div className="h-full flex items-center justify-between px-6">
        {/* 페이지 제목 */}
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {getPageTitle()}
        </h1>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4">
          {/* 검색 */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Q 직원 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* 알림 */}
          <Link
            href="/notifications"
            className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Bell size={20} />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </Link>

          {/* 채팅 (선택사항) */}
          <button
            className="p-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="채팅"
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

