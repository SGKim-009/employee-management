'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Employee } from '@/types/employee';
import { EvaluationCriteria, EvaluationFormData } from '@/types/evaluation';
import { evaluationService } from '@/lib/evaluationService';
import { showToast } from '@/lib/toast';
import { X, Star, Save, Send } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

// 평가 폼 스키마
const evaluationFormSchema = z.object({
  employee_id: z.string().min(1, '직원을 선택하세요'),
  evaluation_period: z.string().min(1, '평가 기간을 입력하세요'),
  evaluation_date: z.string().min(1, '평가 일자를 선택하세요'),
  overall_comment: z.string().optional(),
  scores: z.array(z.object({
    criteria_id: z.string(),
    score: z.number().min(0, '점수는 0 이상이어야 합니다').max(100, '점수는 100 이하여야 합니다'),
    comment: z.string().optional()
  }))
});

type EvaluationFormValues = z.infer<typeof evaluationFormSchema>;

interface EvaluationFormProps {
  employee: Employee;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EvaluationForm({ employee, onClose, onSuccess }: EvaluationFormProps) {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      employee_id: employee.id,
      evaluation_period: '',
      evaluation_date: new Date().toISOString().split('T')[0],
      overall_comment: '',
      scores: []
    }
  });

  useEffect(() => {
    loadCriteria();
  }, []);

  const loadCriteria = async () => {
    try {
      setLoading(true);
      const data = await evaluationService.getCriteria();
      setCriteria(data);
      
      // 기본 점수 배열 초기화
      setValue('scores', data.map(c => ({
        criteria_id: c.id,
        score: 0,
        comment: ''
      })));
    } catch (error) {
      console.error('평가 항목 로드 실패:', error);
      showToast.error('평가 항목을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EvaluationFormValues) => {
    try {
      setSubmitting(true);
      
      const formData: EvaluationFormData = {
        employee_id: data.employee_id,
        evaluation_period: data.evaluation_period,
        evaluation_date: data.evaluation_date,
        overall_comment: data.overall_comment,
        scores: data.scores
      };

      await evaluationService.createEvaluation(formData);
      showToast.success('평가가 저장되었습니다.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('평가 저장 실패:', error);
      showToast.error('평가 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const scores = watch('scores');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <LoadingSpinner text="평가 항목 로딩 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              성과 평가 작성
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              aria-label="폼 닫기"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            {employee.name} ({employee.department} - {employee.position})
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* 평가 기본 정보 */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                평가 기본 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    평가 기간 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('evaluation_period')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.evaluation_period ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="예: 2024-상반기, 2024-Q1"
                  />
                  {errors.evaluation_period && (
                    <p className="text-red-500 text-xs mt-1">{errors.evaluation_period.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    평가 일자 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('evaluation_date')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.evaluation_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.evaluation_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.evaluation_date.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 평가 항목별 점수 */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                평가 항목별 점수
              </h3>
              <div className="space-y-4">
                {criteria.map((criterion, index) => {
                  const scoreValue = scores[index]?.score || 0;
                  return (
                    <div key={criterion.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                            {criterion.name}
                            {criterion.category && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                ({criterion.category})
                              </span>
                            )}
                          </h4>
                          {criterion.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {criterion.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="text-yellow-500" size={20} />
                          <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {scoreValue.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          점수 (0-100)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={scoreValue}
                          onChange={(e) => {
                            const newScores = [...scores];
                            newScores[index] = {
                              ...newScores[index],
                              criteria_id: criterion.id,
                              score: parseInt(e.target.value),
                              comment: newScores[index]?.comment || ''
                            };
                            setValue('scores', newScores);
                          }}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>0</span>
                          <span>50</span>
                          <span>100</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          의견 (선택사항)
                        </label>
                        <textarea
                          {...register(`scores.${index}.comment`)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          placeholder="해당 항목에 대한 평가 의견을 입력하세요"
                        />
                      </div>

                      <input
                        type="hidden"
                        {...register(`scores.${index}.criteria_id`)}
                        value={criterion.id}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 종합 의견 */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                종합 의견
              </h3>
              <textarea
                {...register('overall_comment')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="전체적인 평가 의견을 입력하세요"
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" text="" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save size={18} />
                  저장
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



