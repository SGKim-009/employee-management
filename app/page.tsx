'use client';

import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { employeeService } from '@/lib/supabaseClient';
import EmployeeCard from '@/components/EmployeeCard';
import EmployeeForm from '@/components/EmployeeForm';
import EmployeeDetails from '@/components/EmployeeDetails';
import { Plus, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 검색 및 페이지네이션
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 9;

  // 직원 목록 불러오기
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await employeeService.getAll(currentPage, pageSize, searchTerm);
      setEmployees(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } catch (err) {
      setError('직원 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm]);

  // 검색어 변경 시 첫 페이지로
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 직원 추가 또는 수정
  const handleSubmit = async (
    employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>,
    imageFile?: File
  ) => {
    try {
      let imageUrl = employeeData.profile_image_url;
      
      // 프로필 이미지 업로드
      if (imageFile) {
        const tempId = editingEmployee?.id || 'temp-' + Date.now();
        imageUrl = await employeeService.uploadProfileImage(imageFile, tempId);
      }

      const dataWithImage = { ...employeeData, profile_image_url: imageUrl };

      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, dataWithImage);
      } else {
        await employeeService.create(dataWithImage);
      }
      
      await fetchEmployees();
      setShowForm(false);
      setEditingEmployee(null);
    } catch (err: any) {
      alert(err.message || '작업에 실패했습니다. 다시 시도해주세요.');
      console.error('Error saving employee:', err);
    }
  };

  // 직원 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 직원을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;

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

  // 상세보기
  const handleViewDetails = (employee: Employee) => {
    setViewingEmployee(employee);
  };

  // 폼 취소
  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  // 페이지 변경
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl">
                <Users className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">인사관리 시스템</h1>
                <p className="text-gray-600 mt-1">직원 정보를 효율적으로 관리하세요</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              새 직원 등록
            </button>
          </div>
        </div>

        {/* 검색 및 통계 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 text-gray-700">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                <span className="font-semibold">전체 직원:</span>
                <span className="text-2xl font-bold text-blue-600">{totalCount}명</span>
              </div>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="이름, 부서, 직급, 직책으로 검색..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">직원 정보를 불러오는 중...</p>
            </div>
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '등록된 직원이 없습니다'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? '다른 검색어로 시도해보세요' : '첫 번째 직원을 등록하여 시작하세요!'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                전체 보기
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 직원 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} / {totalCount}명
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        // 현재 페이지 주변만 표시
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                              </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="px-2 py-2">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <div className="text-sm text-gray-600">
                    페이지 {currentPage} / {totalPages}
                  </div>
                </div>
              </div>
            )}
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

        {/* 직원 상세보기 모달 */}
        {viewingEmployee && (
          <EmployeeDetails
            employee={viewingEmployee}
            onClose={() => setViewingEmployee(null)}
          />
        )}
      </div>
    </main>
  );
}