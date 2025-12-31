'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Plus, Users, Search, ChevronLeft, ChevronRight, UserX, LogOut, Filter, X, Save, Bookmark, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmployeeCardSkeleton from '@/components/EmployeeCardSkeleton';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { useUserRole, hasPermission } from '@/lib/userRole';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
  
  // 검색 및 페이지네이션 (URL에서 초기화)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 9;

  // 필터 상태 (URL에서 초기화)
  type FilterType = {
    department?: string;
    rank?: string;
    status?: 'active' | 'inactive' | 'resigned';
    hireDateFrom?: string;
    hireDateTo?: string;
  };
  
  const [filters, setFilters] = useState<FilterType>(() => {
    const urlFilters: FilterType = {};
    if (searchParams.get('department')) urlFilters.department = searchParams.get('department') || undefined;
    if (searchParams.get('rank')) urlFilters.rank = searchParams.get('rank') || undefined;
    if (searchParams.get('status')) urlFilters.status = searchParams.get('status') as 'active' | 'inactive' | 'resigned' || undefined;
    if (searchParams.get('hireDateFrom')) urlFilters.hireDateFrom = searchParams.get('hireDateFrom') || undefined;
    if (searchParams.get('hireDateTo')) urlFilters.hireDateTo = searchParams.get('hireDateTo') || undefined;
    return urlFilters;
  });

  // 정렬 상태 (URL에서 초기화)
  const [sortBy, setSortBy] = useState<{
    field: 'name' | 'hire_date' | 'current_salary' | 'department' | 'created_at';
    order: 'asc' | 'desc';
  }>(() => {
    const field = (searchParams.get('sortField') || 'created_at') as 'name' | 'hire_date' | 'current_salary' | 'department' | 'created_at';
    const order = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    return { field, order };
  });

  // 필터 옵션 (부서, 직급 목록)
  const [departments, setDepartments] = useState<string[]>([]);
  const [ranks, setRanks] = useState<string[]>([]);

  // 필터 프리셋 관리
  const [filterPresets, setFilterPresets] = useState<Array<{
    id: string;
    name: string;
    filters: typeof filters;
    sortBy: typeof sortBy;
    searchTerm: string;
  }>>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  // URL 파라미터 업데이트 함수
  const updateURLParams = useCallback((params: {
    department?: string;
    rank?: string;
    status?: string;
    hireDateFrom?: string;
    hireDateTo?: string;
    search?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // 필터 파라미터 업데이트
    if (params.department !== undefined) {
      if (params.department) {
        newParams.set('department', params.department);
      } else {
        newParams.delete('department');
      }
    }
    if (params.rank !== undefined) {
      if (params.rank) {
        newParams.set('rank', params.rank);
      } else {
        newParams.delete('rank');
      }
    }
    if (params.status !== undefined) {
      if (params.status) {
        newParams.set('status', params.status);
      } else {
        newParams.delete('status');
      }
    }
    if (params.hireDateFrom !== undefined) {
      if (params.hireDateFrom) {
        newParams.set('hireDateFrom', params.hireDateFrom);
      } else {
        newParams.delete('hireDateFrom');
      }
    }
    if (params.hireDateTo !== undefined) {
      if (params.hireDateTo) {
        newParams.set('hireDateTo', params.hireDateTo);
      } else {
        newParams.delete('hireDateTo');
      }
    }
    
    // 검색어 업데이트
    if (params.search !== undefined) {
      if (params.search) {
        newParams.set('search', params.search);
      } else {
        newParams.delete('search');
      }
    }
    
    // 정렬 파라미터 업데이트
    if (params.sortField !== undefined) {
      if (params.sortField) {
        newParams.set('sortField', params.sortField);
      } else {
        newParams.delete('sortField');
      }
    }
    if (params.sortOrder !== undefined) {
      if (params.sortOrder) {
        newParams.set('sortOrder', params.sortOrder);
      } else {
        newParams.delete('sortOrder');
      }
    }
    
    router.replace(`/?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // 필터 옵션 로드
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [depts, rankList] = await Promise.all([
          employeeService.getUniqueDepartments(),
          employeeService.getUniqueRanks()
        ]);
        setDepartments(depts);
        setRanks(rankList);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // 필터 프리셋 로드 (localStorage에서)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('employee-filter-presets');
        if (saved) {
          setFilterPresets(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading filter presets:', error);
      }
    }
  }, []);

  // 필터 프리셋 저장 (localStorage에)
  const saveFilterPreset = useCallback(() => {
    if (!presetName.trim()) {
      showToast.error('프리셋 이름을 입력하세요.');
      return;
    }

    const newPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters },
      sortBy: { ...sortBy },
      searchTerm: searchTerm
    };

    const updatedPresets = [...filterPresets, newPreset];
    setFilterPresets(updatedPresets);
    
    try {
      localStorage.setItem('employee-filter-presets', JSON.stringify(updatedPresets));
      showToast.success('필터 프리셋이 저장되었습니다.');
      setShowPresetModal(false);
      setPresetName('');
    } catch (error) {
      console.error('Error saving filter preset:', error);
      showToast.error('프리셋 저장에 실패했습니다.');
    }
  }, [presetName, filters, sortBy, searchTerm, filterPresets]);

  // 필터 프리셋 적용
  const applyFilterPreset = useCallback((preset: typeof filterPresets[0]) => {
    setFilters(preset.filters);
    setSortBy(preset.sortBy);
    setSearchTerm(preset.searchTerm);
    setCurrentPage(1);
    setHasMore(true);
    
    // URL도 업데이트
    updateURLParams({
      ...preset.filters,
      search: preset.searchTerm,
      sortField: preset.sortBy.field,
      sortOrder: preset.sortBy.order
    });
    
    showToast.success(`"${preset.name}" 프리셋이 적용되었습니다.`);
  }, [updateURLParams]);

  // 필터 프리셋 삭제
  const deleteFilterPreset = useCallback((id: string) => {
    const updatedPresets = filterPresets.filter(p => p.id !== id);
    setFilterPresets(updatedPresets);
    
    try {
      localStorage.setItem('employee-filter-presets', JSON.stringify(updatedPresets));
      showToast.success('프리셋이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting filter preset:', error);
      showToast.error('프리셋 삭제에 실패했습니다.');
    }
  }, [filterPresets]);

  // 직원 목록 불러오기 (초기 로드)
  const fetchEmployees = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const result = await employeeService.getAll(page, pageSize, searchTerm, false, filters, sortBy); // 재직자만
      
      if (append) {
        setEmployees(prev => [...prev, ...result.data]);
      } else {
        setEmployees(result.data);
      }
      
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
      setHasMore(page < result.totalPages);
    } catch (err) {
      setError('직원 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching employees:', err);
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

  // 직원 추가 또는 수정
  const handleSubmit = useCallback(async (
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
      
      // 목록 새로고침 (첫 페이지부터 다시 로드)
      setCurrentPage(1);
      setHasMore(true);
      await fetchEmployees(1, false);
      setShowForm(false);
      setEditingEmployee(null);
      showToast.success(editingEmployee ? '직원 정보가 수정되었습니다.' : '새 직원이 등록되었습니다.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '작업에 실패했습니다. 다시 시도해주세요.';
      showToast.error(errorMessage);
      console.error('Error saving employee:', err);
    }
  }, [editingEmployee, fetchEmployees]);

  // 직원 삭제
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('정말로 이 직원을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;

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

  const { user, signOut } = useAuth();
  const { role } = useUserRole();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      showToast.success('로그아웃되었습니다.');
    } catch (error) {
      showToast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }, [signOut]);

  const canWrite = useMemo(() => hasPermission(role, 'write'), [role]);
  const canDelete = useMemo(() => hasPermission(role, 'delete'), [role]);

  // 페이지네이션 범위 계산
  const paginationRange = useMemo(() => {
    const start = ((currentPage - 1) * pageSize) + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return { start, end };
  }, [currentPage, pageSize, totalCount]);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl">
                <Users className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">인사관리 시스템</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">직원 정보를 효율적으로 관리하세요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/resigned"
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label="퇴사자 관리 페이지로 이동"
              >
                <UserX size={20} />
                퇴사자 관리
              </Link>
              {canWrite && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 text-sm md:text-base touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  aria-label="새 직원 등록"
                >
                  <Plus size={18} className="md:w-5 md:h-5" />
                  <span className="hidden sm:inline">새 직원 등록</span>
                  <span className="sm:hidden">등록</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 검색 및 통계 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* 통계 및 검색 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4 text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold">전체 직원:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount}명</span>
                </div>
              </div>
              
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="이름, 부서, 직급, 직책, 사원번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  aria-label="직원 검색"
                />
              </div>
            </div>

            {/* 필터 및 정렬 */}
            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* 부서 필터 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">부서</label>
                <select
                  value={filters.department || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters };
                    if (e.target.value) {
                      newFilters.department = e.target.value;
                    } else {
                      delete newFilters.department;
                    }
                    setFilters(newFilters);
                    setCurrentPage(1);
                    setHasMore(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                  aria-label="부서 필터"
                >
                  <option value="">전체</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* 직급 필터 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">직급</label>
                <select
                  value={filters.rank || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters };
                    if (e.target.value) {
                      newFilters.rank = e.target.value;
                    } else {
                      delete newFilters.rank;
                    }
                    setFilters(newFilters);
                    setCurrentPage(1);
                    setHasMore(true);
                    updateURLParams({ rank: e.target.value || undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                  aria-label="직급 필터"
                >
                  <option value="">전체</option>
                  {ranks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              {/* 재직 상태 필터 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">재직 상태</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters };
                    if (e.target.value) {
                      newFilters.status = e.target.value as 'active' | 'inactive' | 'resigned';
                    } else {
                      delete newFilters.status;
                    }
                    setFilters(newFilters);
                    setCurrentPage(1);
                    setHasMore(true);
                    updateURLParams({ status: e.target.value || undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                  aria-label="재직 상태 필터"
                >
                  <option value="">전체</option>
                  <option value="active">재직중</option>
                  <option value="inactive">휴직</option>
                </select>
              </div>

              {/* 입사일 범위 필터 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">입사일 범위</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.hireDateFrom || ''}
                    onChange={(e) => {
                      const newFilters = { ...filters };
                      if (e.target.value) {
                        newFilters.hireDateFrom = e.target.value;
                      } else {
                        delete newFilters.hireDateFrom;
                      }
                      setFilters(newFilters);
                      setCurrentPage(1);
                      setHasMore(true);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none text-sm"
                    aria-label="입사일 시작일"
                    placeholder="시작일"
                  />
                  <span className="self-center text-gray-500 dark:text-gray-400">~</span>
                  <input
                    type="date"
                    value={filters.hireDateTo || ''}
                    onChange={(e) => {
                      const newFilters = { ...filters };
                      if (e.target.value) {
                        newFilters.hireDateTo = e.target.value;
                      } else {
                        delete newFilters.hireDateTo;
                      }
                      setFilters(newFilters);
                      setCurrentPage(1);
                      setHasMore(true);
                      updateURLParams({ hireDateTo: e.target.value || undefined });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none text-sm"
                    aria-label="입사일 종료일"
                    placeholder="종료일"
                  />
                </div>
              </div>

              {/* 정렬 옵션 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">정렬</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy.field}
                    onChange={(e) => {
                      const newField = e.target.value as 'name' | 'hire_date' | 'current_salary' | 'department' | 'created_at';
                      setSortBy({
                        field: newField,
                        order: sortBy.order
                      });
                      setCurrentPage(1);
                      setHasMore(true);
                      updateURLParams({ sortField: newField });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                    aria-label="정렬 기준"
                  >
                    <option value="created_at">등록일순</option>
                    <option value="name">이름순</option>
                    <option value="hire_date">입사일순</option>
                    <option value="current_salary">급여순</option>
                    <option value="department">부서순</option>
                  </select>
                  <button
                    onClick={() => {
                      const newOrder = sortBy.order === 'asc' ? 'desc' : 'asc';
                      setSortBy({ ...sortBy, order: newOrder });
                      setCurrentPage(1);
                      setHasMore(true);
                      updateURLParams({ sortOrder: newOrder });
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    aria-label={sortBy.order === 'asc' ? '내림차순으로 변경' : '오름차순으로 변경'}
                    title={sortBy.order === 'asc' ? '내림차순' : '오름차순'}
                  >
                    {sortBy.order === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* 필터 프리셋 관리 */}
              <div className="flex items-end gap-2">
                {filterPresets.length > 0 && (
                  <div className="relative group">
                    <button
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      aria-label="저장된 필터 프리셋"
                      title="저장된 필터 프리셋"
                    >
                      <Bookmark size={16} />
                      <span className="hidden md:inline">프리셋</span>
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="p-2 max-h-64 overflow-y-auto">
                        {filterPresets.map((preset) => (
                          <div key={preset.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group/item">
                            <button
                              onClick={() => applyFilterPreset(preset)}
                              className="flex-1 text-left text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {preset.name}
                            </button>
                            <button
                              onClick={() => deleteFilterPreset(preset.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                              aria-label={`${preset.name} 프리셋 삭제`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => setShowPresetModal(true)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  aria-label="현재 필터를 프리셋으로 저장"
                  title="현재 필터를 프리셋으로 저장"
                >
                  <Save size={16} />
                  <span className="hidden md:inline">저장</span>
                </button>

                {/* 필터 초기화 */}
                {(filters.department || filters.rank || filters.status || filters.hireDateFrom || filters.hireDateTo || searchTerm) && (
                  <button
                    onClick={() => {
                      setFilters({});
                      setSearchTerm('');
                      setCurrentPage(1);
                      setHasMore(true);
                      updateURLParams({
                        department: undefined,
                        rank: undefined,
                        status: undefined,
                        hireDateFrom: undefined,
                        hireDateTo: undefined,
                        search: undefined
                      });
                    }}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    aria-label="필터 초기화"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 필터 프리셋 저장 모달 */}
        {showPresetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">필터 프리셋 저장</h3>
                <button
                  onClick={() => {
                    setShowPresetModal(false);
                    setPresetName('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="닫기"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  프리셋 이름
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveFilterPreset();
                    } else if (e.key === 'Escape') {
                      setShowPresetModal(false);
                      setPresetName('');
                    }
                  }}
                  placeholder="예: 개발팀 재직자"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <p className="font-semibold mb-2">저장될 필터:</p>
                <ul className="space-y-1">
                  {filters.department && <li>• 부서: {filters.department}</li>}
                  {filters.rank && <li>• 직급: {filters.rank}</li>}
                  {filters.status && <li>• 상태: {filters.status === 'active' ? '재직중' : filters.status === 'inactive' ? '휴직' : '퇴사'}</li>}
                  {filters.hireDateFrom && <li>• 입사일 시작: {filters.hireDateFrom}</li>}
                  {filters.hireDateTo && <li>• 입사일 종료: {filters.hireDateTo}</li>}
                  {searchTerm && <li>• 검색어: {searchTerm}</li>}
                  <li>• 정렬: {sortBy.field} ({sortBy.order === 'asc' ? '오름차순' : '내림차순'})</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPresetModal(false);
                    setPresetName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  취소
                </button>
                <button
                  onClick={saveFilterPreset}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

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
              <div
                key={index}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
              >
                <EmployeeCardSkeleton />
              </div>
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-12 text-center">
            <Users className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '등록된 직원이 없습니다'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? '다른 검색어로 시도해보세요' : '첫 번째 직원을 등록하여 시작하세요!'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                전체 보기
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 직원 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {employees.map((employee, index) => (
                <div
                  key={employee.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
                  <EmployeeCard
                    employee={employee}
                    onEdit={canWrite ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onViewDetails={handleViewDetails}
                    onPrintCard={handlePrintCard}
                  />
                </div>
              ))}
            </div>

            {/* 무한 스크롤 트리거 및 로딩 */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                {loadingMore && (
                  <div className="flex flex-col items-center gap-4">
                    <LoadingSpinner />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">더 많은 직원을 불러오는 중...</p>
                  </div>
                )}
              </div>
            )}

            {!hasMore && employees.length > 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>모든 직원을 불러왔습니다.</p>
                <p className="text-sm mt-2">총 {totalCount}명</p>
              </div>
            )}

            {/* 페이지네이션 (선택적 - 필요시 표시) */}
            {false && totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-4 md:p-6">
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
                              className={`min-w-[44px] min-h-[44px] px-3 md:px-4 py-2 rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                                currentPage === page
                                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                              }`}
                              aria-label={`${page}페이지로 이동`}
                              aria-current={currentPage === page ? 'page' : undefined}
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
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
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

        {/* 인사관리카드 출력 모달 */}
        {printingEmployee && (
          <EmployeePrintCard
            employee={printingEmployee}
            salaryHistory={salaryHistory}
            positionHistory={positionHistory}
            onClose={() => setPrintingEmployee(null)}
          />
        )}
      </div>
    </main>
    </ProtectedRoute>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner text="로딩 중..." />}>
      <HomeContent />
    </Suspense>
  );
}