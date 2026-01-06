'use client';

import { useEffect, useState } from 'react';
import { Employee } from '@/types/employee';
import { EmployeeLeaveBalance, AnnualLeaveCalculation } from '@/types/leave';
import { leaveService } from '@/lib/leaveService';
import LoadingSpinner from './LoadingSpinner';
import { Calendar, TrendingUp } from 'lucide-react';

interface LeaveBalanceCardProps {
  employee: Employee;
}

export default function LeaveBalanceCard({ employee }: LeaveBalanceCardProps) {
  const [annualLeave, setAnnualLeave] = useState<AnnualLeaveCalculation | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadLeaveBalances();
  }, [employee.id]);

  const loadLeaveBalances = async () => {
    try {
      setLoading(true);
      const [annual, balances] = await Promise.all([
        leaveService.getAnnualLeaveCalculation(employee.id, currentYear),
        leaveService.getLeaveBalancesByEmployee(employee.id, currentYear)
      ]);
      setAnnualLeave(annual);
      setLeaveBalances(balances);
    } catch (error) {
      console.error('휴가 잔여일 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <LoadingSpinner text="휴가 잔여일 로딩 중..." />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-green-600" />
        {currentYear}년 휴가 잔여일
      </h3>

      {/* 연차 정보 */}
      {annualLeave && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">연차</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {annualLeave.remaining_annual_leave.toFixed(1)}일 남음
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{
                  width: `${(annualLeave.remaining_annual_leave / annualLeave.total_annual_leave) * 100}%`
                }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {annualLeave.remaining_annual_leave.toFixed(1)} / {annualLeave.total_annual_leave.toFixed(1)}일
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span>총 {annualLeave.total_annual_leave.toFixed(1)}일</span>
            <span>사용 {annualLeave.used_annual_leave.toFixed(1)}일</span>
            <span>잔여 {annualLeave.remaining_annual_leave.toFixed(1)}일</span>
          </div>
        </div>
      )}

      {/* 기타 휴가 유형 */}
      {leaveBalances.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">기타 휴가</h4>
          {leaveBalances
            .filter(balance => balance.leave_type?.code !== 'annual')
            .map(balance => (
              <div key={balance.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {balance.leave_type?.name || '휴가'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {balance.remaining_days.toFixed(1)}일 남음
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${balance.total_days > 0 ? (balance.remaining_days / balance.total_days) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {balance.remaining_days.toFixed(1)} / {balance.total_days.toFixed(1)}일
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {leaveBalances.length === 0 && !annualLeave && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          휴가 잔여일 정보가 없습니다.
        </p>
      )}
    </div>
  );
}



