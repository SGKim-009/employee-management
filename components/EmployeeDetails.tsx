'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, memo } from 'react';
import { Employee, SalaryHistory, PositionHistory } from '@/types/employee';
import { employeeService } from '@/lib/supabaseClient';
import { X, User, Mail, Phone, Briefcase, Calendar, TrendingUp
    , GraduationCap, Award, History, Building, FileText } from 'lucide-react';
import Link from 'next/link';

interface EmployeeDetailsProps {
  employee: Employee;
  onClose: () => void;
}

function EmployeeDetails({ employee, onClose }: EmployeeDetailsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [positionHistory, setPositionHistory] = useState<PositionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [employee.id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [salary, position] = await Promise.all([
        employeeService.getSalaryHistory(employee.id),
        employeeService.getPositionHistory(employee.id)
      ]);
      setSalaryHistory(salary);
      setPositionHistory(position);
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
          )}
        </div>

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