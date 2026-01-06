'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Employee } from '@/types/employee';
import { LeaveType } from '@/types/leave';
import { leaveService } from '@/lib/leaveService';
import { showToast } from '@/lib/toast';
import { X, Calendar, Save } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

// 휴가 신청 폼 스키마
const leaveRequestFormSchema = z.object({
  employee_id: z.string().min(1, '직원을 선택하세요'),
  leave_type_id: z.string().min(1, '휴가 유형을 선택하세요'),
  start_date: z.string().min(1, '시작일을 선택하세요'),
  end_date: z.string().min(1, '종료일을 선택하세요'),
  reason: z.string().optional()
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: '종료일은 시작일 이후여야 합니다',
  path: ['end_date']
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestFormSchema>;

interface LeaveRequestFormProps {
  employee: Employee;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LeaveRequestForm({ employee, onClose, onSuccess }: LeaveRequestFormProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: {
      employee_id: employee.id,
      leave_type_id: '',
      start_date: '',
      end_date: '',
      reason: ''
    }
  });

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getLeaveTypes();
      setLeaveTypes(data);
      if (data.length > 0) {
        setValue('leave_type_id', data[0].id);
      }
    } catch (error) {
      console.error('휴가 유형 로드 실패:', error);
      showToast.error('휴가 유형을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LeaveRequestFormValues) => {
    try {
      setSubmitting(true);
      
      await leaveService.createLeaveRequest({
        employee_id: data.employee_id,
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason
      });

      showToast.success('휴가 신청이 완료되었습니다.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('휴가 신청 실패:', error);
      showToast.error('휴가 신청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  // 휴가 일수 계산
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <LoadingSpinner text="휴가 유형 로딩 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full my-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              휴가 신청
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              aria-label="폼 닫기"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-green-100 mt-2">
            {employee.name} ({employee.department} - {employee.position})
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* 휴가 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                휴가 유형 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('leave_type_id')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.leave_type_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">선택하세요</option>
                {leaveTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} {type.is_paid ? '(유급)' : '(무급)'}
                  </option>
                ))}
              </select>
              {errors.leave_type_id && (
                <p className="text-red-500 text-xs mt-1">{errors.leave_type_id.message}</p>
              )}
            </div>

            {/* 시작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                시작일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  {...register('start_date')}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>
              )}
            </div>

            {/* 종료일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                종료일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  {...register('end_date')}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>
              )}
            </div>

            {/* 휴가 일수 표시 */}
            {startDate && endDate && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">휴가 일수</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calculateDays()}일
                </p>
              </div>
            )}

            {/* 사유 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                사유 (선택사항)
              </label>
              <textarea
                {...register('reason')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
                placeholder="휴가 사유를 입력하세요"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" text="" />
                  신청 중...
                </>
              ) : (
                <>
                  <Save size={18} />
                  신청하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



