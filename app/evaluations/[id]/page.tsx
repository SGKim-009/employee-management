'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { evaluationService } from '@/lib/evaluationService';
import { Evaluation } from '@/types/evaluation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { ArrowLeft, Star, Calendar, User, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (evaluationId) {
      loadEvaluation();
    }
  }, [evaluationId]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const data = await evaluationService.getEvaluationById(evaluationId);
      setEvaluation(data);
    } catch (error) {
      console.error('평가 로드 실패:', error);
      showToast.error('평가를 불러오는데 실패했습니다.');
      router.push('/evaluations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner fullScreen text="평가 로딩 중..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (!evaluation) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              평가를 찾을 수 없습니다.
            </p>
            <Link
              href="/evaluations"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              평가 목록으로 돌아가기
            </Link>
          </div>
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
              <div className="flex items-center gap-4">
                <Link
                  href="/evaluations"
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="뒤로 가기"
                >
                  <ArrowLeft size={24} />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    평가 상세
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {evaluation.employee?.name} - {evaluation.evaluation_period}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                evaluation.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                evaluation.status === 'submitted' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                evaluation.status === 'rejected' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}>
                {evaluation.status === 'approved' ? '승인됨' :
                 evaluation.status === 'submitted' ? '제출됨' :
                 evaluation.status === 'rejected' ? '반려됨' :
                 '임시저장'}
              </span>
            </div>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 메인 컨텐츠 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 기본 정보 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  기본 정보
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">직원</p>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {evaluation.employee?.name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">부서</p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {evaluation.employee?.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">직책</p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {evaluation.employee?.position}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평가 기간</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <p className="text-gray-800 dark:text-gray-200">
                        {evaluation.evaluation_period}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평가 일자</p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {new Date(evaluation.evaluation_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {evaluation.overall_score !== null && evaluation.overall_score !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">전체 점수</p>
                      <div className="flex items-center gap-2">
                        <Star className="text-yellow-500" size={20} />
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {evaluation.overall_score.toFixed(1)}
                        </p>
                        <span className="text-gray-500">/ 100</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 평가 항목별 점수 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  평가 항목별 점수
                </h2>
                <div className="space-y-4">
                  {evaluation.scores && evaluation.scores.length > 0 ? (
                    evaluation.scores.map((score) => (
                      <div key={score.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                              {score.criteria?.name}
                              {score.criteria?.category && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  ({score.criteria.category})
                                </span>
                              )}
                            </h3>
                            {score.criteria?.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {score.criteria.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="text-yellow-500" size={20} />
                            <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                              {score.score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        {score.comment && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {score.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      평가 항목 점수가 없습니다.
                    </p>
                  )}
                </div>
              </div>

              {/* 종합 의견 */}
              {evaluation.overall_comment && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    종합 의견
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {evaluation.overall_comment}
                  </p>
                </div>
              )}
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {/* 평가 통계 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} />
                  평가 정보
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평가자</p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {evaluation.evaluator?.email || '시스템'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">생성일</p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {evaluation.created_at 
                        ? new Date(evaluation.created_at).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">수정일</p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {evaluation.updated_at 
                        ? new Date(evaluation.updated_at).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}



