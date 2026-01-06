'use client';

'use client';

import { useEffect, useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { leaveService } from '@/lib/leaveService';
import { employeeService } from '@/lib/supabaseClient';
import { LeaveRequest } from '@/types/leave';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import moment from 'moment';
import 'moment/locale/ko';

// 한국어 로케일 설정
const localizer = momentLocalizer(moment);
moment.locale('ko');

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: LeaveRequest;
}

export default function LeaveCalendarPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadLeaveRequests();
  }, [currentDate]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      // 현재 월의 시작과 끝 날짜 계산
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // 모든 직원 조회
      const allEmployeesResult = await employeeService.getAll(1, 1000, '', false);
      const allEmployees = allEmployeesResult.data;
      const allRequests: LeaveRequest[] = [];
      
      // 모든 직원의 휴가 신청 조회
      for (const employee of allEmployees) {
        const requests = await leaveService.getLeaveRequestsByEmployee(employee.id, year);
        allRequests.push(...requests);
      }

      // 현재 월에 해당하는 휴가만 필터링
      const filtered = allRequests.filter(req => {
        const start = new Date(req.start_date);
        const end = new Date(req.end_date);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        return (start >= monthStart && start <= monthEnd) || 
               (end >= monthStart && end <= monthEnd) ||
               (start <= monthStart && end >= monthEnd);
      });

      setLeaveRequests(filtered);
    } catch (error) {
      console.error('휴가 일정 로드 실패:', error);
      showToast.error('휴가 일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const events: CalendarEvent[] = useMemo(() => {
    return leaveRequests.map(request => ({
      id: request.id,
      title: `${request.employee?.name || '직원'} - ${request.leave_type?.name || '휴가'}`,
      start: new Date(request.start_date),
      end: new Date(new Date(request.end_date).setHours(23, 59, 59, 999)), // 종료일 포함
      resource: request
    }));
  }, [leaveRequests]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';

    switch (status) {
      case 'approved':
        backgroundColor = '#10b981';
        borderColor = '#10b981';
        break;
      case 'rejected':
        backgroundColor = '#ef4444';
        borderColor = '#ef4444';
        break;
      case 'pending':
        backgroundColor = '#f59e0b';
        borderColor = '#f59e0b';
        break;
      case 'cancelled':
        backgroundColor = '#6b7280';
        borderColor = '#6b7280';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: '#fff',
        borderRadius: '4px',
        border: 'none',
        padding: '2px 4px',
        fontSize: '12px'
      }
    };
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner fullScreen text="휴가 일정 로딩 중..." />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon className="text-green-600 dark:text-green-400" size={28} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    휴가 캘린더
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    휴가 일정을 캘린더로 확인
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 캘린더 */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {format(currentDate, 'yyyy년 M월', { locale: ko })}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="이전 달"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  오늘
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="다음 달"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                onNavigate={handleNavigate}
                defaultDate={currentDate}
                views={['month', 'week', 'day']}
                defaultView="month"
                messages={{
                  next: '다음',
                  previous: '이전',
                  today: '오늘',
                  month: '월',
                  week: '주',
                  day: '일',
                  agenda: '일정',
                  date: '날짜',
                  time: '시간',
                  event: '이벤트',
                  noEventsInRange: '이 기간에 휴가 일정이 없습니다.'
                }}
                culture="ko"
              />
            </div>

            {/* 범례 */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">승인됨</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">대기중</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">거절됨</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">취소됨</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

