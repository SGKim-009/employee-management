'use client';

import { useEffect, useState } from 'react';
import { employeeService } from '@/lib/supabaseClient';
import { payrollService } from '@/lib/payrollService';
import { Employee } from '@/types/employee';
import { PayrollStatement } from '@/types/payroll';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { DollarSign, Plus, Search, Download, Eye, Calendar } from 'lucide-react';
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="text-purple-600 dark:text-purple-400" size={28} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    급여 관리
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    급여 명세서 생성 및 관리
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* 급여 명세서 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
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
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStatements.map((statement) => (
                  <div
                    key={statement.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {statement.employee?.name}
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {statement.employee?.department}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                            {statement.year}년 {statement.month}월
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <span>총 지급액: </span>
                            <span className="font-semibold">{statement.total_income.toLocaleString()}원</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>총 공제액: </span>
                            <span className="font-semibold text-red-600">{statement.total_deduction.toLocaleString()}원</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>실지급액: </span>
                            <span className="font-semibold text-green-600">{statement.net_pay.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          statement.payment_status === 'paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          statement.payment_status === 'cancelled' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                          'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {statement.payment_status === 'paid' ? '지급완료' :
                           statement.payment_status === 'cancelled' ? '취소됨' :
                           '대기중'}
                        </span>
                        <button
                          onClick={() => handleDownloadPDF(statement)}
                          className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          aria-label="PDF 다운로드"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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



