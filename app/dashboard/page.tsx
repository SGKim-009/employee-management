'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { employeeService } from '@/lib/supabaseClient';
import { Employee } from '@/types/employee';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Users, Building, Briefcase, TrendingUp, Calendar, UserCheck, UserX, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateReportData, downloadReportAsCSV, downloadReportAsJSON, downloadReportAsText } from '@/lib/reportUtils';
import { checkAllNotifications, saveNotificationsToLocalStorage, loadNotificationsFromLocalStorage } from '@/lib/notificationUtils';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  resignedEmployees: number;
  departmentDistribution: Record<string, number>;
  rankDistribution: Record<string, number>;
  recentHires: number; // 최근 30일 내 입사
  recentResignations: number; // 최근 30일 내 퇴사
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 모든 직원 데이터 가져오기 (통계 계산용)
        const allEmployees: Employee[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const result = await employeeService.getAll(page, 100, '', true, undefined, undefined); // 퇴사자 포함, 필터/정렬 없음
          allEmployees.push(...result.data);
          hasMore = page < result.totalPages;
          page++;
        }

        setEmployees(allEmployees);

        // 모든 알림 체크 및 저장 (자격증 + 생일)
        const newNotifications = checkAllNotifications(allEmployees);
        const existingNotifications = loadNotificationsFromLocalStorage();
        
        // 새 알림과 기존 알림 병합 (중복 제거)
        const notificationMap = new Map();
        existingNotifications.forEach((n: any) => {
          notificationMap.set(n.id, n);
        });
        newNotifications.forEach((n: any) => {
          const existing = notificationMap.get(n.id);
          if (existing) {
            if (!existing.read) {
              notificationMap.set(n.id, n);
            }
          } else {
            notificationMap.set(n.id, n);
          }
        });
        
        const mergedNotifications = Array.from(notificationMap.values());
        saveNotificationsToLocalStorage(mergedNotifications);

        // 통계 계산
        const activeEmployees = allEmployees.filter(e => e.status === 'active');
        const inactiveEmployees = allEmployees.filter(e => e.status === 'inactive');
        const resignedEmployees = allEmployees.filter(e => e.status === 'resigned');

        // 부서별 분포
        const departmentDistribution: Record<string, number> = {};
        allEmployees.forEach(emp => {
          if (emp.department) {
            departmentDistribution[emp.department] = (departmentDistribution[emp.department] || 0) + 1;
          }
        });

        // 직급별 분포
        const rankDistribution: Record<string, number> = {};
        allEmployees.forEach(emp => {
          if (emp.rank) {
            rankDistribution[emp.rank] = (rankDistribution[emp.rank] || 0) + 1;
          }
        });

        // 최근 입사/퇴사 (30일 내)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentHires = allEmployees.filter(emp => {
          const hireDate = new Date(emp.hire_date);
          return hireDate >= thirtyDaysAgo && emp.status !== 'resigned';
        }).length;

        const recentResignations = allEmployees.filter(emp => {
          if (!emp.resignation_date) return false;
          const resignationDate = new Date(emp.resignation_date);
          return resignationDate >= thirtyDaysAgo;
        }).length;

        setStats({
          totalEmployees: allEmployees.length,
          activeEmployees: activeEmployees.length,
          inactiveEmployees: inactiveEmployees.length,
          resignedEmployees: resignedEmployees.length,
          departmentDistribution,
          rankDistribution,
          recentHires,
          recentResignations
        });
      } catch (err) {
        setError('대시보드 데이터를 불러오는데 실패했습니다.');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 부서별 분포 정렬 (인원 많은 순)
  const sortedDepartments = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.departmentDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // 상위 10개
  }, [stats]);

  // 직급별 분포 정렬
  const sortedRanks = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.rankDistribution)
      .sort(([, a], [, b]) => b - a);
  }, [stats]);

  // 차트 데이터 준비
  const pieChartData = useMemo(() => {
    if (!stats) return [];
    return sortedDepartments.map(([dept, count]) => ({
      name: dept,
      value: count
    }));
  }, [stats, sortedDepartments]);

  // 입사 추이 데이터 (최근 12개월)
  const hireTrendData = useMemo(() => {
    if (!employees.length) return [];
    
    const months: Record<string, number> = {};
    const now = new Date();
    
    // 최근 12개월 초기화
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }
    
    // 입사일 기준으로 월별 집계
    employees.forEach(emp => {
      if (emp.status !== 'resigned') {
        const hireDate = new Date(emp.hire_date);
        const key = `${hireDate.getFullYear()}-${String(hireDate.getMonth() + 1).padStart(2, '0')}`;
        if (months.hasOwnProperty(key)) {
          months[key]++;
        }
      }
    });
    
    return Object.entries(months).map(([month, count]) => ({
      month: month.split('-')[1] + '월',
      입사: count
    }));
  }, [employees]);

  // 급여 분포 데이터 (구간별)
  const salaryDistributionData = useMemo(() => {
    if (!employees.length) return [];
    
    const activeEmployees = employees.filter(e => e.status === 'active');
    if (!activeEmployees.length) return [];
    
    const ranges = [
      { name: '0-2000', min: 0, max: 2000 },
      { name: '2000-3000', min: 2000, max: 3000 },
      { name: '3000-4000', min: 3000, max: 4000 },
      { name: '4000-5000', min: 4000, max: 5000 },
      { name: '5000-6000', min: 5000, max: 6000 },
      { name: '6000+', min: 6000, max: Infinity }
    ];
    
    const distribution = ranges.map(range => ({
      name: range.name === '6000+' ? '6000만원 이상' : `${range.min}만원-${range.max}만원`,
      인원: activeEmployees.filter(emp => {
        const salary = emp.current_salary / 10000; // 만원 단위로 변환
        return salary >= range.min && salary < range.max;
      }).length
    }));
    
    return distribution;
  }, [employees]);

  // 파이 차트 색상 팔레트
  const COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* 액션 버튼 */}
          <div className="flex justify-end mb-6">
            <div className="flex flex-wrap gap-3">
                {/* 리포트 다운로드 드롭다운 */}
                <div className="relative">
                  <button
                    onClick={() => setReportMenuOpen(!reportMenuOpen)}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
                    aria-label="리포트 다운로드"
                    aria-expanded={reportMenuOpen}
                  >
                    <Download size={18} />
                    리포트 다운로드
                  </button>
                  {reportMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setReportMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 z-20">
                        <div className="py-2">
                          <button
                            onClick={() => {
                              if (!stats || !employees.length) {
                                toast.error('리포트 데이터를 불러올 수 없습니다.');
                                setReportMenuOpen(false);
                                return;
                              }
                              try {
                                const reportData = generateReportData(employees, stats);
                                downloadReportAsCSV(reportData);
                                toast.success('CSV 파일이 다운로드되었습니다.');
                                setReportMenuOpen(false);
                              } catch (error) {
                                console.error('Error generating CSV report:', error);
                                toast.error('리포트 생성 중 오류가 발생했습니다.');
                                setReportMenuOpen(false);
                              }
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <FileText size={16} />
                            CSV 다운로드
                          </button>
                          <button
                            onClick={() => {
                              if (!stats || !employees.length) {
                                toast.error('리포트 데이터를 불러올 수 없습니다.');
                                setReportMenuOpen(false);
                                return;
                              }
                              try {
                                const reportData = generateReportData(employees, stats);
                                downloadReportAsJSON(reportData);
                                toast.success('JSON 파일이 다운로드되었습니다.');
                                setReportMenuOpen(false);
                              } catch (error) {
                                console.error('Error generating JSON report:', error);
                                toast.error('리포트 생성 중 오류가 발생했습니다.');
                                setReportMenuOpen(false);
                              }
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <FileText size={16} />
                            JSON 다운로드
                          </button>
                          <button
                            onClick={() => {
                              if (!stats || !employees.length) {
                                toast.error('리포트 데이터를 불러올 수 없습니다.');
                                setReportMenuOpen(false);
                                return;
                              }
                              try {
                                const reportData = generateReportData(employees, stats);
                                downloadReportAsText(reportData);
                                toast.success('텍스트 파일이 다운로드되었습니다.');
                                setReportMenuOpen(false);
                              } catch (error) {
                                console.error('Error generating text report:', error);
                                toast.error('리포트 생성 중 오류가 발생했습니다.');
                                setReportMenuOpen(false);
                              }
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <FileText size={16} />
                            텍스트 다운로드
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
            </div>
          </div>

          {/* 주요 통계 카드 - 디자인 개선 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 총 임직원 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <Users className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">총 임직원</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{stats.totalEmployees.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <TrendingUp size={16} />
                <span>↑5% 전월 대비</span>
              </div>
            </div>

            {/* 신규 입사 (이번달) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <UserCheck className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">신규 입사 (이번달)</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{stats.recentHires}</p>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <TrendingUp size={16} />
                <span>↑2% 목표 달성</span>
              </div>
            </div>

            {/* 퇴사자 (이번달) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <UserX className="text-red-600 dark:text-red-400" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">퇴사자 (이번달)</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{stats.recentResignations}</p>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <TrendingUp size={16} className="rotate-180" />
                <span>↓1% 전월 대비 감소</span>
              </div>
            </div>

            {/* 휴가/부재중 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <Calendar className="text-orange-600 dark:text-orange-400" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">휴가/부재중</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">45</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">전체 인원의 3.6%</p>
            </div>
          </div>

          {/* 최근 동향 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 최근 입사 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">최근 입사 (30일)</h2>
              </div>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">{stats.recentHires}명</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">최근 30일 내 입사한 직원 수</p>
            </div>

            {/* 최근 퇴사 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                  <UserX className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">최근 퇴사 (30일)</h2>
              </div>
              <p className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">{stats.recentResignations}명</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">최근 30일 내 퇴사한 직원 수</p>
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 부서별 인원 파이 차트 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Building className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">부서별 인원 분포</h2>
              </div>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">부서 데이터가 없습니다.</p>
              )}
            </div>

            {/* 입사 추이 라인 차트 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">입사 추이 (최근 12개월)</h2>
              </div>
              {hireTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hireTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                    />
                    <YAxis 
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="입사" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">입사 데이터가 없습니다.</p>
              )}
            </div>
          </div>

          {/* 급여 분포 히스토그램 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                <Briefcase className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">급여 분포 (재직자 기준)</h2>
            </div>
            {salaryDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salaryDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    className="dark:stroke-gray-400"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:stroke-gray-400"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="인원" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">급여 데이터가 없습니다.</p>
            )}
          </div>

          {/* 부서별 분포 (리스트) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Building className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">부서별 상세 인원</h2>
            </div>
            <div className="space-y-4">
              {sortedDepartments.length > 0 ? (
                sortedDepartments.map(([dept, count]) => {
                  const percentage = stats.totalEmployees > 0 
                    ? Math.round((count / stats.totalEmployees) * 100) 
                    : 0;
                  return (
                    <div key={dept} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dept}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {count}명 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">부서 데이터가 없습니다.</p>
              )}
            </div>
          </div>

          {/* 직급별 분포 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                <Briefcase className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">직급별 분포</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedRanks.length > 0 ? (
                sortedRanks.map(([rank, count]) => {
                  const percentage = stats.totalEmployees > 0 
                    ? Math.round((count / stats.totalEmployees) * 100) 
                    : 0;
                  return (
                    <div key={rank} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rank}</span>
                        <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 dark:bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percentage}%</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 col-span-full">직급 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}


