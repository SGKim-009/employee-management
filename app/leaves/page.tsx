'use client';

import { useEffect, useState } from 'react';
import { employeeService } from '@/lib/supabaseClient';
import { leaveService } from '@/lib/leaveService';
import { Employee } from '@/types/employee';
import { LeaveRequest } from '@/types/leave';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { Calendar, Plus, Search, CheckCircle, XCircle, Clock, Eye, CalendarDays } from 'lucide-react';
import LeaveRequestForm from '@/components/LeaveRequestForm';
import LeaveBalanceCard from '@/components/LeaveBalanceCard';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/lib/userRole';

export default function LeavesPage() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [selectedEmployeeForLeave, setSelectedEmployeeForLeave] = useState<Employee | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const employeesData = await employeeService.getAll(1, 1000, '', false);
      setEmployees(employeesData);
      await loadLeaveRequests();
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      showToast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      // 관리자나 HR은 모든 휴가 신청 조회, 일반 사용자는 본인 것만
      if (role === 'admin' || role === 'hr') {
        const pending = await leaveService.getPendingLeaveRequests();
        setLeaveRequests(pending);
      } else {
        // 일반 사용자는 본인의 휴가 신청만 조회
        const employee = employees.find(emp => emp.email === user?.email);
        if (employee) {
          const requests = await leaveService.getLeaveRequestsByEmployee(employee.id);
          setLeaveRequests(requests);
        }
      }
    } catch (error) {
      console.error('휴가 신청 목록 로드 실패:', error);
      return [];
    }
  };

  const handleCreateLeave = (employee: Employee) => {
    setSelectedEmployeeForLeave(employee);
    setShowLeaveForm(true);
  };

  const handleLeaveSuccess = () => {
    loadLeaveRequests();
  };

  const handleApprove = async (id: string) => {
    try {
      await leaveService.approveLeaveRequest(id, user?.id || '');
      showToast.success('휴가 신청이 승인되었습니다.');
      loadLeaveRequests();
    } catch (error) {
      console.error('휴가 승인 실패:', error);
      showToast.error('휴가 승인에 실패했습니다.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('거절 사유를 입력하세요:');
    if (!reason) return;

    try {
      await leaveService.rejectLeaveRequest(id, user?.id || '', reason);
      showToast.success('휴가 신청이 거절되었습니다.');
      loadLeaveRequests();
    } catch (error) {
      console.error('휴가 거절 실패:', error);
      showToast.error('휴가 거절에 실패했습니다.');
    }
  };

  const filteredLeaveRequests = leaveRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leave_type?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = !selectedEmployee || request.employee_id === selectedEmployee;
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesEmployee && matchesStatus;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner fullScreen text="휴가 목록 로딩 중..." />
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
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Calendar className="text-green-600 dark:text-green-400" size={28} />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      휴가 관리
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      휴가 신청 및 승인 관리
                    </p>
                  </div>
                </div>
                <Link
                  href="/leaves/calendar"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CalendarDays size={18} />
                  캘린더 보기
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="container mx-auto px-4 py-4">
          {/* 휴가 잔여일 카드 (일반 사용자만) */}
          {role !== 'admin' && role !== 'hr' && employees.length > 0 && (
            <div className="mb-4">
              <LeaveBalanceCard employee={employees.find(emp => emp.email === user?.email) || employees[0]} />
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="직원명 또는 휴가 유형 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">전체 직원</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">전체 상태</option>
                  <option value="pending">대기중</option>
                  <option value="approved">승인됨</option>
                  <option value="rejected">거절됨</option>
                  <option value="cancelled">취소됨</option>
                </select>
              </div>
              <div>
                <select
                  value={selectedEmployeeForLeave?.id || ''}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value);
                    if (employee) {
                      handleCreateLeave(employee);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">직원 선택하여 휴가 신청...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department} - {emp.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 휴가 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {filteredLeaveRequests.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  휴가 신청 데이터가 없습니다.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  새 휴가를 신청해주세요.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {request.employee?.name}
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {request.employee?.department}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            {request.leave_type?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>
                              {new Date(request.start_date).toLocaleDateString('ko-KR')} - {new Date(request.end_date).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <span className="font-semibold">{request.days}일</span>
                          {request.reason && (
                            <span className="text-gray-500">사유: {request.reason}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          request.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          request.status === 'rejected' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                          request.status === 'cancelled' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                          'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {request.status === 'approved' ? '승인됨' :
                           request.status === 'rejected' ? '거절됨' :
                           request.status === 'cancelled' ? '취소됨' :
                           '대기중'}
                        </span>
                        {(role === 'admin' || role === 'hr') && request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              aria-label="승인"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              aria-label="거절"
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 휴가 신청 폼 */}
        {showLeaveForm && selectedEmployeeForLeave && (
          <LeaveRequestForm
            employee={selectedEmployeeForLeave}
            onClose={() => {
              setShowLeaveForm(false);
              setSelectedEmployeeForLeave(null);
            }}
            onSuccess={handleLeaveSuccess}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

