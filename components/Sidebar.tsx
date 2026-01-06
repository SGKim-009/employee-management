'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/lib/userRole';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UserPlus, 
  DollarSign, 
  Settings, 
  UserX,
  FileSpreadsheet,
  Network,
  FileText,
  Calendar,
  Bell,
  Search,
  MessageCircle
} from 'lucide-react';
import { getUnreadNotificationCount } from '@/lib/notificationUtils';
import { useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { role } = useUserRole();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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

  // 로그인/회원가입 페이지에서는 사이드바 숨김
  if (pathname === '/login' || pathname === '/signup' || !user) {
    return null;
  }

  const menuItems = [
    { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { href: '/', label: '임직원 관리', icon: Users },
    { href: '/org-chart', label: '부서 관리', icon: Building2 },
    { href: '/import', label: '채용 관리', icon: UserPlus },
    { href: '/payroll', label: '급여 관리', icon: DollarSign },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  // 사용자 이름 추출 (이메일에서)
  const getUserName = () => {
    if (!user?.email) return '사용자';
    const name = user.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getUserRole = () => {
    if (!role) return '직원';
    if (role === 'admin') return '관리자';
    if (role === 'hr') return '인사팀장';
    return '직원';
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 flex-col">
      {/* 로고 */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm opacity-90"></div>
          </div>
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">HR Connect</span>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">MENU</p>
        </div>
        <div className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* 설정 섹션 */}
        <div className="mt-8 px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SETTINGS</p>
        </div>
        <div className="space-y-1 px-2">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === '/settings'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">시스템 설정</span>
          </Link>
        </div>
      </nav>

      {/* 사용자 프로필 */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {getUserName().charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {getUserName()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {getUserRole()}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

