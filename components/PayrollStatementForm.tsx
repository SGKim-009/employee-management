'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Employee } from '@/types/employee';
import { payrollService } from '@/lib/payrollService';
import { showToast } from '@/lib/toast';
import { X, Save, Calculator } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

// 급여 명세서 폼 스키마
const payrollStatementFormSchema = z.object({
  employee_id: z.string().min(1, '직원을 선택하세요'),
  year: z.number().min(2000).max(2100),
  month: z.number().min(1).max(12),
  base_salary: z.number().min(0, '기본급은 0 이상이어야 합니다'),
  overtime_pay: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
  allowances: z.number().min(0).optional(),
  payment_date: z.string().optional(),
  notes: z.string().optional()
});

type PayrollStatementFormValues = z.infer<typeof payrollStatementFormSchema>;

interface PayrollStatementFormProps {
  employee: Employee;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PayrollStatementForm({ employee, onClose, onSuccess }: PayrollStatementFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<PayrollStatementFormValues>({
    resolver: zodResolver(payrollStatementFormSchema),
    defaultValues: {
      employee_id: employee.id,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      base_salary: employee.current_salary || 0,
      overtime_pay: 0,
      bonus: 0,
      allowances: 0,
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  const baseSalary = watch('base_salary') || 0;
  const overtimePay = watch('overtime_pay') || 0;
  const bonus = watch('bonus') || 0;
  const allowances = watch('allowances') || 0;

  // 미리보기 계산
  useEffect(() => {
    const totalIncome = baseSalary + overtimePay + bonus + allowances;
    const taxes = payrollService.calculateTaxes(totalIncome);
    const netPay = totalIncome - taxes.total_deduction;

    setPreview({
      total_income: totalIncome,
      ...taxes,
      net_pay: netPay
    });
  }, [baseSalary, overtimePay, bonus, allowances]);

  const onSubmit = async (data: PayrollStatementFormValues) => {
    try {
      setSubmitting(true);
      
      await payrollService.createPayrollStatement({
        employee_id: data.employee_id,
        year: data.year,
        month: data.month,
        base_salary: data.base_salary,
        overtime_pay: data.overtime_pay,
        bonus: data.bonus,
        allowances: data.allowances,
        payment_date: data.payment_date,
        notes: data.notes
      });

      showToast.success('급여 명세서가 생성되었습니다.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('급여 명세서 생성 실패:', error);
      showToast.error('급여 명세서 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              급여 명세서 생성
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              aria-label="폼 닫기"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-purple-100 mt-2">
            {employee.name} ({employee.department} - {employee.position})
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">기본 정보</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  연도 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.year ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="2000"
                  max="2100"
                />
                {errors.year && (
                  <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  월 <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('month', { valueAsNumber: true })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.month ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
                {errors.month && (
                  <p className="text-red-500 text-xs mt-1">{errors.month.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  지급일
                </label>
                <input
                  type="date"
                  {...register('payment_date')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 급여 항목 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">급여 항목</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  기본급 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('base_salary', { valueAsNumber: true })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.base_salary ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                />
                {errors.base_salary && (
                  <p className="text-red-500 text-xs mt-1">{errors.base_salary.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  연장근로수당
                </label>
                <input
                  type="number"
                  {...register('overtime_pay', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  defaultValue={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  상여금
                </label>
                <input
                  type="number"
                  {...register('bonus', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  defaultValue={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  제수당
                </label>
                <input
                  type="number"
                  {...register('allowances', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  defaultValue={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  비고
                </label>
                <textarea
                  {...register('notes')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="비고 사항을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 미리보기 */}
          {preview && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Calculator size={20} className="text-purple-600" />
                계산 미리보기
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">총 지급액</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {preview.total_income.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">총 공제액</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {preview.total_deduction.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">실지급액</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {preview.net_pay.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">소득세</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {preview.income_tax.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          )}

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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" text="" />
                  생성 중...
                </>
              ) : (
                <>
                  <Save size={18} />
                  생성하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


