'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Employee, SalaryHistory, PositionHistory } from '@/types/employee';
import { employeeService } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';

const EmployeeCard = dynamic(() => import('@/components/EmployeeCard'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />,
});

const EmployeeForm = dynamic(() => import('@/components/EmployeeForm'), {
  ssr: false,
}) as React.ComponentType<{
  employee?: Employee | null;
  onSubmit: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>, imageFile?: File) => void;
  onCancel: () => void;
}>;

const EmployeeDetails = dynamic(() => import('@/components/EmployeeDetails'), {
  ssr: false,
});

const EmployeePrintCard = dynamic(() => import('@/components/EmployeePrintCard'), {
  ssr: false,
});
import { UserX, Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmployeeCardSkeleton from '@/components/EmployeeCardSkeleton';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserRole, hasPermission } from '@/lib/userRole';

export default function ResignedPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [printingEmployee, setPrintingEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 인사관리카드용 데이터
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [positionHistory, setPositionHistory] = useState<PositionHistory[]>([]);
  
  // 검색 및 페이지네이션
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 9;

  // 퇴사자 목록 불러오기 (초기 로드)
  const fetchEmployees = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const result = await employeeService.getAll(page, pageSize, searchTerm, true); // 퇴사자만
      
      if (append) {
        setEmployees(prev => [...prev, ...result.data]);
      } else {
        setEmployees(result.data);
      }
      
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
      setHasMore(page < result.totalPages);
    } catch (err) {
      setError('퇴사자 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching resigned employees:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageSize, searchTerm]);

  // 초기 로드
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchEmployees(1, false);
  }, [searchTerm]); // searchTerm 변경 시에만 초기 로드

  // 다음 페이지 로드 (무한 스크롤)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchEmployees(nextPage, true);
  }, [currentPage, hasMore, loadingMore, loading, fetchEmployees]);

  // 검색어 변경 시 첫 페이지로
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setHasMore(true);
  }, []);

  // Intersection Observer를 위한 ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    // 기존 observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (!node || loadingMore || !hasMore) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observerRef.current.observe(node);
  }, [hasMore, loadingMore, loading, loadMore]);

  // 컴포넌트 언마운트 시 observer 정리
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // 직원 수정
  const handleSubmit = useCallback(async (
    employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>,
    imageFile?: File
  ) => {
    try {
      let imageUrl = employeeData.profile_image_url;
      
      if (imageFile) {
        const tempId = editingEmployee?.id || 'temp-' + Date.now();
        imageUrl = await employeeService.uploadProfileImage(imageFile, tempId);
      }

      const dataWithImage = { ...employeeData, profile_image_url: imageUrl };

      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, dataWithImage);
      }
      
      // 목록 새로고침 (첫 페이지부터 다시 로드)
      setCurrentPage(1);
      setHasMore(true);
      await fetchEmployees(1, false);
      setShowForm(false);
      setEditingEmployee(null);
      showToast.success('직원 정보가 수정되었습니다.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '작업에 실패했습니다. 다시 시도해주세요.';
      showToast.error(errorMessage);
      console.error('Error saving employee:', err);
    }
  }, [editingEmployee, fetchEmployees]);

  // 직원 삭제
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('정말로 이 직원 데이터를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;

    try {
      await employeeService.delete(id);
      // 목록 새로고침 (첫 페이지부터 다시 로드)
      setCurrentPage(1);
      setHasMore(true);
      await fetchEmployees(1, false);
      showToast.success('직원이 삭제되었습니다.');
    } catch (err) {
      showToast.error('삭제에 실패했습니다. 다시 시도해주세요.');
      console.error('Error deleting employee:', err);
    }
  }, [fetchEmployees]);

  // 수정 모드 시작
  const handleEdit = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  }, []);

  // 상세보기
  const handleViewDetails = useCallback((employee: Employee) => {
    setViewingEmployee(employee);
  }, []);

  // 인사관리카드 출력
  const handlePrintCard = useCallback(async (employee: Employee) => {
    try {
      const [salary, position] = await Promise.all([
        employeeService.getSalaryHistory(employee.id),
        employeeService.getPositionHistory(employee.id)
      ]);
      setSalaryHistory(salary);
      setPositionHistory(position);
      setPrintingEmployee(employee);
    } catch (error) {
      showToast.error('인사관리카드를 불러오는데 실패했습니다.');
      console.error('Error loading print card:', error);
    }
  }, []);

  // 폼 취소
  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingEmployee(null);
  }, []);

  // 페이지 변경
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const { role } = useUserRole();
  const canWrite = useMemo(() => hasPermission(role, 'write'), [role]);
  const canDelete = useMemo(() => hasPermission(role, 'delete'), [role]);

  // 페이지네이션 범위 계산
  const paginationRange = useMemo(() => {
    const start = ((currentPage - 1) * pageSize) + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return { start, end };
  }, [currentPage, pageSize, totalCount]);

  // 모달 닫기 핸들러
  const handleCloseDetails = useCallback(() => {
    setViewingEmployee(null);
  }, []);

  const handleClosePrintCard = useCallback(() => {
    setPrintingEmployee(null);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="재직자 페이지로"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </Link>
              <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-3 rounded-xl">
                <UserX className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">퇴사자 관리</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">퇴사한 직원의 정보를 관리하세요</p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 통계 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 text-gray-700 dark:text-gray-200">
              <div className="flex items-center gap-2">
                <UserX size={20} className="text-gray-600 dark:text-gray-300" />
                <span className="font-semibold">전체 퇴사자:</span>
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">{totalCount}명</span>
              </div>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="이름, 부서, 직급, 직책, 사원번호로 검색..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                aria-label="퇴사자 검색"
              />
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 로딩 상태 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, index) => (
              <EmployeeCardSkeleton key={index} />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <UserX className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '퇴사자가 없습니다'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? '다른 검색어로 시도해보세요' : '퇴사 처리된 직원이 없습니다'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                전체 보기
              </button>
            ) : (
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                재직자 페이지로 이동
              </Link>
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
                  onEdit={canWrite ? handleEdit : undefined}
                  onDelete={canDelete ? handleDelete : undefined}
                  onViewDetails={handleViewDetails}
                  onPrintCard={handlePrintCard}
                />
              ))}
            </div>

            {/* 무한 스크롤 트리거 및 로딩 */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                {loadingMore && (
                  <div className="flex flex-col items-center gap-4">
                    <LoadingSpinner />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">더 많은 퇴사자를 불러오는 중...</p>
                  </div>
                )}
              </div>
            )}

            {!hasMore && employees.length > 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>모든 퇴사자를 불러왔습니다.</p>
                <p className="text-sm mt-2">총 {totalCount}명</p>
              </div>
            )}

            {/* 페이지네이션 (선택적 - 필요시 표시) */}
            {false && totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300 text-center md:text-left order-3 md:order-1">
                    {paginationRange.start} - {paginationRange.end} / {totalCount}명
                  </div>
                  
                  <div className="flex items-center gap-2 order-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      aria-label="이전 페이지"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`min-w-[44px] min-h-[44px] px-3 md:px-4 py-2 rounded-lg transition-colors touch-manipulation ${
                                currentPage === page
                                  ? 'bg-gray-600 dark:bg-gray-700 text-white'
                                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="px-2 py-2 flex items-center">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      aria-label="다음 페이지"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-300 text-center md:text-right order-1 md:order-3">
                    페이지 {currentPage} / {totalPages}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 직원 수정 폼 모달 */}
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
            onClose={handleCloseDetails}
          />
        )}

        {/* 인사관리카드 출력 모달 */}
        {printingEmployee && (
          <EmployeePrintCard
            employee={printingEmployee}
            salaryHistory={salaryHistory}
            positionHistory={positionHistory}
            onClose={handleClosePrintCard}
          />
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}