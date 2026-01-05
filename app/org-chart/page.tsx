'use client';

import { useEffect, useState } from 'react';
import { employeeService } from '@/lib/supabaseClient';
import { Employee } from '@/types/employee';
import OrgChart from '@/components/OrgChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { Users, RefreshCw } from 'lucide-react';

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoot, setSelectedRoot] = useState<string>('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // 재직 중인 직원만 조회
      const data = await employeeService.getAll(1, 1000, '', false);
      setEmployees(data);
    } catch (error) {
      console.error('직원 목록 로드 실패:', error);
      showToast.error('직원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner fullScreen text="조직도 로딩 중..." />
        </div>
      </ProtectedRoute>
    );
  }

  // 루트 노드 후보 (manager_id가 없는 직원들)
  const rootCandidates = employees.filter((emp) => !emp.manager_id);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-blue-600 dark:text-blue-400" size={28} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    조직도
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    회사 조직 구조를 시각적으로 확인하세요
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* 루트 노드 선택 */}
                {rootCandidates.length > 0 && (
                  <select
                    value={selectedRoot}
                    onChange={(e) => setSelectedRoot(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">전체 조직도</option>
                    {rootCandidates.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={loadEmployees}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  aria-label="새로고침"
                >
                  <RefreshCw size={18} />
                  새로고침
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 조직도 */}
        <div className="mt-4">
          {employees.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  조직도 데이터가 없습니다.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  직원 정보를 추가하고 보고 체계를 설정하세요.
                </p>
              </div>
            </div>
          ) : (
            <OrgChart
              employees={employees}
              rootEmployeeId={selectedRoot || undefined}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


