'use client';

import { useEffect, useState, useMemo } from 'react';
import { employeeService } from '@/lib/supabaseClient';
import { payrollService } from '@/lib/payrollService';
import { Employee } from '@/types/employee';
import { PayrollStatement } from '@/types/payroll';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { DollarSign, Plus, Search, Download, Eye, Calendar, Users, FileText } from 'lucide-react';
import PayrollStatementForm from '@/components/PayrollStatementForm';
import { generatePayrollPDF } from '@/lib/payrollPdfService';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/lib/userRole';

export default function PayrollPage() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollStatements, setPayrollStatements] = useState<PayrollStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] = useState<Employee | null>(null);

  useEffect(() => {
    loadData();
  }, [yearFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const employeesData = await employeeService.getAll(1, 1000, '', false);
      setEmployees(employeesData.data);
      await loadPayrollStatements();
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      showToast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollStatements = async () => {
    try {
      // 관리자나 HR은 모든 급여 명세서 조회, 일반 사용자는 본인 것만
      if (role === 'admin' || role === 'hr') {
        // 모든 직원의 급여 명세서 조회
        const allStatements: PayrollStatement[] = [];
        for (const employee of employees) {
          const statements = await payrollService.getPayrollStatementsByEmployee(employee.id, yearFilter);
          allStatements.push(...statements);
        }
        setPayrollStatements(allStatements.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        }));
      } else {
        // 일반 사용자는 본인의 급여 명세서만 조회
        const employee = employees.find(emp => emp.email === user?.email);
        if (employee) {
          const statements = await payrollService.getPayrollStatementsByEmployee(employee.id, yearFilter);
          setPayrollStatements(statements);
        }
      }
    } catch (error) {
      console.error('급여 명세서 목록 로드 실패:', error);
      return [];
    }
  };

  const handleCreatePayroll = (employee: Employee) => {
    setSelectedEmployeeForPayroll(employee);
    setShowPayrollForm(true);
  };

  const handlePayrollSuccess = () => {
    loadPayrollStatements();
  };

  const handleDownloadPDF = (statement: PayrollStatement) => {
    try {
      generatePayrollPDF(statement);
      showToast.success('PDF가 다운로드되었습니다.');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      showToast.error('PDF 생성에 실패했습니다.');
    }
  };

  const filteredStatements = payrollStatements.filter(statement => {
    const matchesSearch = !searchTerm || 
      statement.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statement.employee?.employee_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = !selectedEmployee || statement.employee_id === selectedEmployee;
    
    return matchesSearch && matchesEmployee;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner fullScreen text="급여 명세서 로딩 중..." />
        </div>
      </ProtectedRoute>
    );
  }

  // 급여 통계 계산
  const payrollStats = useMemo(() => {
    const totalNetPay = filteredStatements.reduce((sum, stmt) => sum + stmt.net_pay, 0);
    const totalDeduction = filteredStatements.reduce((sum, stmt) => sum + stmt.total_deduction, 0);
    const uniqueEmployees = new Set(filteredStatements.map(stmt => stmt.employee_id)).size;
    const newHires = employees.filter(emp => {
      const hireDate = new Date(emp.hire_date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
    }).length;

    return {
      totalNetPay,
      totalDeduction,
      uniqueEmployees,
      newHires
    };
  }, [filteredStatements, employees]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 액션 버튼 */}
        <div className="flex justify-end mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => {
                // 엑셀 다운로드 로직
                showToast.info('엑셀 다운로드 기능 준비 중입니다.');
              }}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              엑셀 다운로드
            </button>
            {(role === 'admin' || role === 'hr') && (
              <button
                onClick={() => setShowPayrollForm(true)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                급여 대장 생성
              </button>
            )}
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">이번 달 실지급 총액</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  ₩{payrollStats.totalNetPay.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <span>↑2.5% 전월 대비</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <Users className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">지급 대상 인원</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {payrollStats.uniqueEmployees}명
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {payrollStats.newHires}명 신규 입사
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <FileText className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">공제 합계 (4대보험/세금)</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  ₩{payrollStats.totalDeduction.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <span>↑1.2% 전월 대비</span>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">기간 설정</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">~</span>
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">급여 구분</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>정기 급여</option>
                  <option>상여금</option>
                  <option>보너스</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">사원 검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="이름 또는 사번 입력"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  초기화
                </button>
                <button className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                  조회
                </button>
              </div>
            </div>
            {/* 기존 필터는 숨김 처리 */}
            <div className="hidden grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="직원명 또는 사번 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedEmployeeForPayroll?.id || ''}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value);
                    if (employee) {
                      handleCreatePayroll(employee);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">직원 선택하여 급여 명세서 생성...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department} - {emp.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 급여 명세서 목록 - 테이블 형식 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
            {filteredStatements.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  급여 명세서 데이터가 없습니다.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  새 급여 명세서를 생성해주세요.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">지급일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">구분</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">사원정보</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">소속</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">지급 총액</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">공제 총액</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">실지급액</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStatements.map((statement) => (
                      <tr key={statement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                          {statement.payment_date || `${statement.year}-${String(statement.month).padStart(2, '0')}-25`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            정기 급여
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                              {statement.employee?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {statement.employee?.name || '알 수 없음'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {statement.employee?.employee_number || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                          {statement.employee?.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-800 dark:text-gray-200 font-medium">
                          ₩{statement.total_income.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400 font-medium">
                          -₩{statement.total_deduction.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400 font-bold">
                          ₩{statement.net_pay.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-1 ${
                            statement.payment_status === 'paid' ? 'text-green-600 dark:text-green-400' :
                            statement.payment_status === 'cancelled' ? 'text-gray-600 dark:text-gray-400' :
                            'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            {statement.payment_status === 'paid' ? '지급완료' :
                             statement.payment_status === 'cancelled' ? '취소됨' :
                             '대기중'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDownloadPDF(statement)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="PDF 다운로드"
                            title="PDF 다운로드"
                          >
                            <Download size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* 페이지네이션 */}
            {filteredStatements.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  총 {filteredStatements.length}개 항목 중 1-{Math.min(10, filteredStatements.length)} 표시
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    이전
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-lg">1</button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">2</button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">3</button>
                  <span className="px-2 text-gray-500">...</span>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">13</button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 급여 명세서 생성 폼 */}
        {showPayrollForm && selectedEmployeeForPayroll && (
          <PayrollStatementForm
            employee={selectedEmployeeForPayroll}
            onClose={() => {
              setShowPayrollForm(false);
              setSelectedEmployeeForPayroll(null);
            }}
            onSuccess={handlePayrollSuccess}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}



