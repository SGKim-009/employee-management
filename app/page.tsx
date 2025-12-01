'use client';

import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { employeeService } from '@/lib/supabaseClient';
import EmployeeCard from '@/components/EmployeeCard';
import EmployeeForm from '@/components/EmployeeForm';
import { Plus, Users } from 'lucide-react';

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 직원 목록 불러오기
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      setError('직원 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 직원 추가 또는 수정
  const handleSubmit = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, employeeData);
      } else {
        await employeeService.create(employeeData);
      }
      await fetchEmployees();
      setShowForm(false);
      setEditingEmployee(null);
    } catch (err) {
      alert('작업에 실패했습니다. 다시 시도해주세요.');
      console.error('Error saving employee:', err);
    }
  };

  // 직원 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 직원을 삭제하시겠습니까?')) return;

    try {
      await employeeService.delete(id);
      await fetchEmployees();
    } catch (err) {
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
      console.error('Error deleting employee:', err);
    }
  };

  // 수정 모드 시작
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  // 폼 취소
  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">인사관리 시스템</h1>
                <p className="text-gray-600 mt-1">직원 정보를 효율적으로 관리하세요</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              새 직원 추가
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              등록된 직원이 없습니다
            </h3>
            <p className="text-gray-500">
              첫 번째 직원을 추가하여 시작하세요!
            </p>
          </div>
        ) : (
          <>
            {/* 통계 정보 */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <p className="text-gray-600">
                전체 직원: <span className="font-bold text-blue-600">{employees.length}명</span>
              </p>
            </div>

            {/* 직원 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}

        {/* 직원 추가/수정 폼 모달 */}
        {showForm && (
          <EmployeeForm
            employee={editingEmployee}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </main>
  );
}