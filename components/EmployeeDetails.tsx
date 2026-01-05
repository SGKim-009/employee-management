'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, memo } from 'react';
import { Employee, SalaryHistory, PositionHistory } from '@/types/employee';
import { employeeService } from '@/lib/supabaseClient';
import { evaluationService } from '@/lib/evaluationService';
import { Evaluation, EvaluationStats } from '@/types/evaluation';
import { X, User, Mail, Phone, Briefcase, Calendar, TrendingUp
    , GraduationCap, Award, History, Building, FileText, Star, Plus } from 'lucide-react';
import Link from 'next/link';
import EvaluationForm from './EvaluationForm';

interface EmployeeDetailsProps {
  employee: Employee;
  onClose: () => void;
}

function EmployeeDetails({ employee, onClose }: EmployeeDetailsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'evaluation'>('info');
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [positionHistory, setPositionHistory] = useState<PositionHistory[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evaluationStats, setEvaluationStats] = useState<EvaluationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [employee.id]);

  useEffect(() => {
    if (activeTab === 'evaluation') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [salary, position, evaluationsData, stats] = await Promise.all([
        employeeService.getSalaryHistory(employee.id),
        employeeService.getPositionHistory(employee.id),
        evaluationService.getEvaluationsByEmployee(employee.id),
        evaluationService.getEvaluationStats(employee.id)
      ]);
      setSalaryHistory(salary);
      setPositionHistory(position);
      setEvaluations(evaluationsData);
      setEvaluationStats(stats);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const workYears = useMemo(() => {
    const hireDate = new Date(employee.hire_date);
    const today = new Date();
    const years = today.getFullYear() - hireDate.getFullYear();
    const months = today.getMonth() - hireDate.getMonth();
    const totalMonths = years * 12 + months;
    return `${Math.floor(totalMonths / 12)}년 ${totalMonths % 12}개월`;
  }, [employee.hire_date]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {employee.profile_image_url ? (
                <Image
                  src={employee.profile_image_url}
                  alt={employee.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  loading="lazy"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-lg">
                  <User size={40} className="text-gray-400" />
                </div>
              )}
              <div className="text-white">
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-blue-100">{employee.rank} · {employee.position}</p>
                <p className="text-blue-200 text-sm mt-1">{employee.department}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="상세보기 닫기"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-4 font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'info'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="상세 정보 탭"
              aria-pressed={activeTab === 'info'}
            >
              상세 정보
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="변동 이력 탭"
              aria-pressed={activeTab === 'history'}
            >
              변동 이력
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-6 py-4 font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'evaluation'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="성과 평가 탭"
              aria-pressed={activeTab === 'evaluation'}
            >
              성과 평가
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-blue-600" />
                  기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">이메일</p>
                    <p className="flex items-center gap-2 text-gray-800">
                      <Mail size={16} className="text-gray-500" />
                      {employee.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">전화번호</p>
                    <p className="flex items-center gap-2 text-gray-800">
                      <Phone size={16} className="text-gray-500" />
                      {employee.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">입사일</p>
                    <p className="flex items-center gap-2 text-gray-800">
                      <Calendar size={16} className="text-gray-500" />
                      {new Date(employee.hire_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">재직 기간</p>
                    <p className="text-gray-800 font-medium">{workYears}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">현재 급여</p>
                    <p className="flex items-center gap-2 text-gray-800 font-semibold">
                      <TrendingUp size={16} className="text-green-600" />
                      {employee.current_salary.toLocaleString()}원
                      {employee.salary_type === 'hourly' ? ' (시급)' : ' (연봉)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">재직 상태</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      employee.status === 'active' ? 'bg-green-100 text-green-800' :
                      employee.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.status === 'active' ? '재직중' :
                       employee.status === 'inactive' ? '휴직' : '퇴사'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 학력 정보 */}
              {employee.education_level && (
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <GraduationCap size={20} className="text-blue-600" />
                    학력 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">최종 학력</p>
                      <p className="text-gray-800 font-medium">{employee.education_level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">학교명</p>
                      <p className="text-gray-800">{employee.education_school || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">전공</p>
                      <p className="text-gray-800">{employee.education_major || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">졸업년도</p>
                      <p className="text-gray-800">{employee.education_graduation_year || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 자격증 */}
              {employee.certifications && employee.certifications.length > 0 && (
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Award size={20} className="text-blue-600" />
                    자격증 ({employee.certifications.length})
                  </h3>
                  <div className="space-y-3">
                    {employee.certifications.map((cert, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800">{cert.name}</h4>
                          {cert.certification_number && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {cert.certification_number}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">발급기관: {cert.issuer}</p>
                        <p className="text-sm text-gray-500">
                          발급일: {new Date(cert.issue_date).toLocaleDateString('ko-KR')}
                          {cert.expiry_date && ` | 만료일: ${new Date(cert.expiry_date).toLocaleDateString('ko-KR')}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 경력 사항 */}
              {employee.career_history && employee.career_history.length > 0 && (
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building size={20} className="text-blue-600" />
                    경력 사항 ({employee.career_history.length})
                  </h3>
                  <div className="space-y-3">
                    {employee.career_history.map((career, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">{career.company}</h4>
                            <p className="text-sm text-gray-600">
                              {career.position} {career.department && `· ${career.department}`}
                            </p>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {new Date(career.start_date).toLocaleDateString('ko-KR')} - {new Date(career.end_date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        {career.description && (
                          <p className="text-sm text-gray-600 mt-2">{career.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 메모 */}
              {employee.notes && (
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">메모</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{employee.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* 인사 변동 이력 */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <History size={20} className="text-blue-600" />
                  인사 변동 이력
                </h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : positionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {positionHistory.map((history, index) => (
                      <div key={history.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            {history.previous_position ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 line-through text-sm">
                                    {history.previous_rank} · {history.previous_position} · {history.previous_department}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600">→</span>
                                  <span className="font-semibold text-gray-800">
                                    {history.new_rank} · {history.new_position} · {history.new_department}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="font-semibold text-gray-800">
                                {history.new_rank} · {history.new_position} · {history.new_department}
                              </div>
                            )}
                            {history.change_reason && (
                              <p className="text-sm text-gray-600 mt-2">사유: {history.change_reason}</p>
                            )}
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap ml-2">
                            {new Date(history.change_date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">인사 변동 이력이 없습니다.</p>
                )}
              </div>

              {/* 급여 변동 이력 */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  급여 변동 이력
                </h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : salaryHistory.length > 0 ? (
                  <div className="space-y-3">
                    {salaryHistory.map((history) => (
                      <div key={history.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 line-through">
                                {history.previous_salary.toLocaleString()}원
                              </span>
                              <span className="text-blue-600">→</span>
                              <span className="font-semibold text-gray-800">
                                {history.new_salary.toLocaleString()}원
                              </span>
                              <span className={`text-sm px-2 py-1 rounded ${
                                history.new_salary > history.previous_salary
                                  ? 'bg-green-100 text-green-700'
                                  : history.new_salary < history.previous_salary
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {history.new_salary > history.previous_salary ? '↑' : history.new_salary < history.previous_salary ? '↓' : '='} 
                                {Math.abs(history.new_salary - history.previous_salary).toLocaleString()}원
                              </span>
                            </div>
                            {history.change_reason && (
                              <p className="text-sm text-gray-600 mt-2">사유: {history.change_reason}</p>
                            )}
                          </div>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap ml-2">
                            {new Date(history.change_date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">급여 변동 이력이 없습니다.</p>
                )}
              </div>
            </div>
          ) : activeTab === 'evaluation' ? (
            <div className="space-y-6">
              {/* 평가 통계 */}
              {evaluationStats && evaluationStats.total_evaluations > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    평가 통계
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">총 평가 수</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {evaluationStats.total_evaluations}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평균 점수</p>
                      <div className="flex items-center gap-2">
                        <Star className="text-yellow-500" size={20} />
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {evaluationStats.average_score.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">최근 평가일</p>
                      <p className="text-gray-800 dark:text-gray-200">
                        {evaluationStats.latest_evaluation_date
                          ? new Date(evaluationStats.latest_evaluation_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">최근 점수</p>
                      {evaluationStats.latest_score !== null && evaluationStats.latest_score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <Star className="text-yellow-500" size={16} />
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {evaluationStats.latest_score.toFixed(1)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">-</p>
                      )}
                    </div>
                  </div>
                  {evaluationStats.scores_by_category.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">카테고리별 평균 점수</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {evaluationStats.scores_by_category.map((cat, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{cat.category}</p>
                            <div className="flex items-center gap-1">
                              <Star className="text-yellow-500" size={14} />
                              <p className="font-semibold text-gray-800 dark:text-gray-200">
                                {cat.average_score.toFixed(1)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 평가 목록 */}
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    평가 이력 ({evaluations.length})
                  </h3>
                  <button
                    onClick={() => setShowEvaluationForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    새 평가 작성
                  </button>
                </div>
                {evaluations.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      평가 이력이 없습니다.
                    </p>
                    <button
                      onClick={() => setShowEvaluationForm(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      첫 평가 작성하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evaluations.map((evaluation) => (
                      <Link
                        key={evaluation.id}
                        href={`/evaluations/${evaluation.id}`}
                        className="block bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                                {evaluation.evaluation_period}
                              </h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
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
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{new Date(evaluation.evaluation_date).toLocaleDateString('ko-KR')}</span>
                              </div>
                              {evaluation.overall_score !== null && evaluation.overall_score !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Star className="text-yellow-500" size={14} />
                                  <span className="font-semibold">{evaluation.overall_score.toFixed(1)}점</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* 평가 작성 폼 */}
        {showEvaluationForm && (
          <EvaluationForm
            employee={employee}
            onClose={() => setShowEvaluationForm(false)}
            onSuccess={() => {
              setShowEvaluationForm(false);
              fetchHistory();
            }}
          />
        )}

        {/* 푸터 */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex gap-3">
            <Link
              href={`/employees/${employee.id}/files`}
              className="flex-1 px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium min-h-[44px] flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              onClick={onClose}
            >
              <FileText size={18} />
              파일 관리
            </Link>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label="상세보기 닫기"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EmployeeDetails);