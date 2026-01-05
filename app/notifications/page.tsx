'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { employeeService } from '@/lib/supabaseClient';
import { Employee } from '@/types/employee';
import {
  checkAllNotifications,
  loadNotificationsFromLocalStorage,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  Notification,
} from '@/lib/notificationUtils';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 모든 직원 데이터 가져오기
        const allEmployees: Employee[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const result = await employeeService.getAll(page, 100, '', true, undefined, undefined);
          allEmployees.push(...result.data);
          hasMore = page < result.totalPages;
          page++;
        }

        setEmployees(allEmployees);

        // 모든 알림 체크 (자격증 + 생일)
        const newNotifications = checkAllNotifications(allEmployees);

        // 기존 알림 불러오기
        const existingNotifications = loadNotificationsFromLocalStorage();

        // 새 알림과 기존 알림 병합 (중복 제거)
        const notificationMap = new Map<string, Notification>();
        
        // 기존 알림 먼저 추가
        existingNotifications.forEach(n => {
          notificationMap.set(n.id, n);
        });

        // 새 알림 추가 (기존 알림이 있으면 업데이트, 없으면 추가)
        newNotifications.forEach(n => {
          const existing = notificationMap.get(n.id);
          if (existing) {
            // 기존 알림이 읽지 않았으면 업데이트
            if (!existing.read) {
              notificationMap.set(n.id, n);
            }
          } else {
            notificationMap.set(n.id, n);
          }
        });

        const mergedNotifications = Array.from(notificationMap.values());
        
        // localStorage에 저장
        localStorage.setItem('employee_notifications', JSON.stringify(mergedNotifications));
        
        setNotifications(mergedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('알림을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('모든 알림을 읽음 처리했습니다.');
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('알림이 삭제되었습니다.');
  };

  const getPriorityIcon = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="text-red-600 dark:text-red-400" size={20} />;
      case 'high':
        return <AlertTriangle className="text-orange-600 dark:text-orange-400" size={20} />;
      case 'medium':
        return <Info className="text-yellow-600 dark:text-yellow-400" size={20} />;
      default:
        return <Bell className="text-blue-600 dark:text-blue-400" size={20} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <LoadingSpinner text="알림을 불러오는 중..." />
        </div>
      </ProtectedRoute>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
                  <Bell className="text-blue-600 dark:text-blue-400" size={32} />
                  알림
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '모든 알림을 확인했습니다'}
                </p>
              </div>
              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCheck size={18} />
                    모두 읽음 처리
                  </button>
                )}
                <Link
                  href="/"
                  className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  메인으로
                </Link>
              </div>
            </div>
          </div>

          {/* 알림 목록 */}
          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-12 text-center">
              <Bell className="text-gray-400 dark:text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400 text-lg">알림이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border-l-4 ${
                    notification.read 
                      ? 'opacity-60' 
                      : getPriorityColor(notification.priority)
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getPriorityIcon(notification.priority)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              새 알림
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mb-2 ${notification.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>직원: {notification.employeeName}</span>
                          {notification.employeeNumber && (
                            <span>사원번호: {notification.employeeNumber}</span>
                          )}
                          {notification.relatedData?.daysUntilExpiry !== undefined && (
                            <span>
                              {notification.relatedData.daysUntilExpiry < 0
                                ? `만료됨 (${Math.abs(notification.relatedData.daysUntilExpiry)}일 전)`
                                : `${notification.relatedData.daysUntilExpiry}일 후 만료`}
                            </span>
                          )}
                          <span>
                            {new Date(notification.createdAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          aria-label="읽음 처리"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

