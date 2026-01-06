'use client';

import { useEffect, useState } from 'react';
import { employeeService } from '@/lib/supabaseClient';
import { evaluationService } from '@/lib/evaluationService';
import { Employee } from '@/types/employee';
import { Evaluation } from '@/types/evaluation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { FileText, Plus, Search, Calendar, Star, Eye } from 'lucide-react';
import EvaluationForm from '@/components/EvaluationForm';
import Link from 'next/link';

export default function EvaluationsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [selectedEmployeeForEvaluation, setSelectedEmployeeForEvaluation] = useState<Employee | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, evaluationsData] = await Promise.all([
        employeeService.getAll(1, 1000, '', false),
        loadEvaluations()
      ]);
      setEmployees(employeesData.data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      showToast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluations = async () => {
    try {
      // 모든 직원의 평가를 조회 (실제로는 페이지네이션이 필요할 수 있음)
      const allEmployeesResult = await employeeService.getAll(1, 1000, '', false);
      const allEmployees = allEmployeesResult.data;
      const allEvaluations: Evaluation[] = [];
      
      for (const employee of allEmployees) {
        const employeeEvaluations = await evaluationService.getEvaluationsByEmployee(employee.id);
        allEvaluations.push(...employeeEvaluations);
      }

      setEvaluations(allEvaluations.sort((a, b) => 
        new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime()
      ));
      
      return allEvaluations;
    } catch (error) {
      console.error('평가 목록 로드 실패:', error);
      return [];
    }
  };

  const handleCreateEvaluation = (employee: Employee) => {
    setSelectedEmployeeForEvaluation(employee);
    setShowEvaluationForm(true);
  };

  const handleEvaluationSuccess = () => {
    loadEvaluations();
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = !searchTerm || 
      evaluation.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.evaluation_period.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = !selectedEmployee || evaluation.employee_id === selectedEmployee;
    
    return matchesSearch && matchesEmployee;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner fullScreen text="평가 목록 로딩 중..." />
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
                <FileText className="text-blue-600 dark:text-blue-400" size={28} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    성과 평가
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    직원 성과 평가 관리
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="직원명 또는 평가 기간 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={selectedEmployeeForEvaluation?.id || ''}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value);
                    if (employee) {
                      handleCreateEvaluation(employee);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">직원 선택하여 평가 작성...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department} - {emp.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 평가 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {filteredEvaluations.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  평가 데이터가 없습니다.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  새 평가를 작성해주세요.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {evaluation.employee?.name}
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {evaluation.employee?.department}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {evaluation.employee?.position}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>{evaluation.evaluation_period}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{new Date(evaluation.evaluation_date).toLocaleDateString('ko-KR')}</span>
                          </div>
                          {evaluation.overall_score !== null && evaluation.overall_score !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="text-yellow-500" size={16} />
                              <span className="font-semibold">{evaluation.overall_score.toFixed(1)}점</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs rounded-full ${
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
                        <Link
                          href={`/evaluations/${evaluation.id}`}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          aria-label="평가 상세 보기"
                        >
                          <Eye size={20} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 평가 작성 폼 */}
        {showEvaluationForm && selectedEmployeeForEvaluation && (
          <EvaluationForm
            employee={selectedEmployeeForEvaluation}
            onClose={() => {
              setShowEvaluationForm(false);
              setSelectedEmployeeForEvaluation(null);
            }}
            onSuccess={handleEvaluationSuccess}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

