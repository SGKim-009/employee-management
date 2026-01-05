'use client';

import Image from 'next/image';
import { memo } from 'react';
import { Employee, SalaryHistory, PositionHistory, calculateTenure } from '@/types/employee';
import { X, User } from 'lucide-react';

interface EmployeePrintCardProps {
  employee: Employee;
  salaryHistory: SalaryHistory[];
  positionHistory: PositionHistory[];
  onClose: () => void;
}

function EmployeePrintCard({ 
  employee, 
  salaryHistory, 
  positionHistory, 
  onClose 
}: EmployeePrintCardProps) {
  const handlePrint = () => {
    window.print();
  };

  const tenure = calculateTenure(employee.hire_date, employee.resignation_date);

  return (
    <>
      {/* 화면용 오버레이 (인쇄 시 숨김) */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">인사관리카드</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="인사관리카드 인쇄"
              >
                인쇄
              </button>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                aria-label="인쇄 미리보기 닫기"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* 프리뷰 */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <div className="bg-white p-8 shadow-lg max-w-4xl mx-auto print-content">
              <PrintCardContent 
                employee={employee} 
                salaryHistory={salaryHistory}
                positionHistory={positionHistory}
                tenure={tenure}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 인쇄용 스타일 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </>
  );
}

// 실제 출력 내용
function PrintCardContent({ 
  employee, 
  salaryHistory, 
  positionHistory,
  tenure 
}: { 
  employee: Employee; 
  salaryHistory: SalaryHistory[];
  positionHistory: PositionHistory[];
  tenure: string;
}) {
  return (
    <div>
      {/* 제목 */}
      <div className="text-center border-b-4 border-blue-600 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">인사관리카드</h1>
        <p className="text-sm text-gray-600">Human Resource Management Card</p>
      </div>

      {/* 기본 정보 섹션 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* 프로필 사진 */}
        <div className="col-span-1 flex flex-col items-center">
          {employee.profile_image_url ? (
            <Image
              src={employee.profile_image_url}
              alt={employee.name}
              width={160}
              height={192}
              className="w-40 h-48 object-cover border-2 border-gray-300 rounded-lg mb-2"
              loading="lazy"
            />
          ) : (
            <div className="w-40 h-48 bg-gray-200 flex items-center justify-center border-2 border-gray-300 rounded-lg mb-2">
              <User size={60} className="text-gray-400" />
            </div>
          )}
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            employee.status === 'active' ? 'bg-green-100 text-green-800' :
            employee.status === 'resigned' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {employee.status === 'active' ? '재직중' :
             employee.status === 'resigned' ? '퇴사' : '휴직'}
          </div>
        </div>

        {/* 인적사항 */}
        <div className="col-span-2">
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-3">
            인적사항
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">사원번호:</span>
              <span className="text-gray-900">{employee.employee_number || '-'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">성명:</span>
              <span className="text-gray-900 font-bold">{employee.name}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">부서:</span>
              <span className="text-gray-900">{employee.department}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">직급:</span>
              <span className="text-gray-900">{employee.rank}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">직책:</span>
              <span className="text-gray-900">{employee.position}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">입사일:</span>
              <span className="text-gray-900">
                {new Date(employee.hire_date).toLocaleDateString('ko-KR')}
              </span>
            </div>
            {employee.resignation_date && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-24">퇴사일:</span>
                <span className="text-red-600">
                  {new Date(employee.resignation_date).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">근속기간:</span>
              <span className="text-gray-900 font-semibold">{tenure}</span>
            </div>
            <div className="flex col-span-2">
              <span className="font-semibold text-gray-700 w-24">이메일:</span>
              <span className="text-gray-900">{employee.email}</span>
            </div>
            <div className="flex col-span-2">
              <span className="font-semibold text-gray-700 w-24">연락처:</span>
              <span className="text-gray-900">{employee.phone || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 학력 정보 */}
      {employee.education_level && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-3">
            학력사항
          </h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">최종학력:</span>
              <p className="text-gray-900">{employee.education_level}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">학교명:</span>
              <p className="text-gray-900">{employee.education_school || '-'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">전공:</span>
              <p className="text-gray-900">{employee.education_major || '-'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">졸업년도:</span>
              <p className="text-gray-900">{employee.education_graduation_year || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 자격증 */}
      {employee.certifications && employee.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-3">
            자격사항
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">자격증명</th>
                <th className="border border-gray-300 px-3 py-2 text-left">발급기관</th>
                <th className="border border-gray-300 px-3 py-2 text-left">취득일</th>
                <th className="border border-gray-300 px-3 py-2 text-left">자격번호</th>
              </tr>
            </thead>
            <tbody>
              {employee.certifications.map((cert, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-3 py-2">{cert.name}</td>
                  <td className="border border-gray-300 px-3 py-2">{cert.issuer}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {new Date(cert.issue_date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{cert.certification_number || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 경력사항 */}
      {employee.career_history && employee.career_history.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-3">
            경력사항
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">회사명</th>
                <th className="border border-gray-300 px-3 py-2 text-left">직책</th>
                <th className="border border-gray-300 px-3 py-2 text-left">근무기간</th>
                <th className="border border-gray-300 px-3 py-2 text-left">업무내용</th>
              </tr>
            </thead>
            <tbody>
              {employee.career_history.map((career, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-3 py-2">{career.company}</td>
                  <td className="border border-gray-300 px-3 py-2">{career.position}</td>
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">
                    {new Date(career.start_date).toLocaleDateString('ko-KR')} ~ 
                    {new Date(career.end_date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{career.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 인사변동 이력 */}
      {positionHistory.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-3">
            인사변동 이력
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">발령일</th>
                <th className="border border-gray-300 px-3 py-2 text-left">변경 전</th>
                <th className="border border-gray-300 px-3 py-2 text-left">변경 후</th>
                <th className="border border-gray-300 px-3 py-2 text-left">사유</th>
              </tr>
            </thead>
            <tbody>
              {positionHistory.map((history) => (
                <tr key={history.id}>
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">
                    {new Date(history.change_date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {history.previous_position ? 
                      `${history.previous_rank} / ${history.previous_position} / ${history.previous_department}` 
                      : '-'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {history.new_rank} / {history.new_position} / {history.new_department}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{history.change_reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 급여변동 이력 */}
      {salaryHistory.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-3">
            급여변동 이력
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">연월</th>
                <th className="border border-gray-300 px-3 py-2 text-right">변경 전</th>
                <th className="border border-gray-300 px-3 py-2 text-right">변경 후</th>
                <th className="border border-gray-300 px-3 py-2 text-right">증감</th>
                <th className="border border-gray-300 px-3 py-2 text-left">사유</th>
              </tr>
            </thead>
            <tbody>
              {salaryHistory.map((history) => {
                const diff = history.new_salary - history.previous_salary;
                return (
                  <tr key={history.id}>
                    <td className="border border-gray-300 px-3 py-2">
                      {history.change_year_month || new Date(history.change_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {history.previous_salary > 0 ? history.previous_salary.toLocaleString() : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                      {history.new_salary.toLocaleString()}
                    </td>
                    <td className={`border border-gray-300 px-3 py-2 text-right font-semibold ${
                      diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {history.previous_salary > 0 ? 
                        `${diff > 0 ? '+' : ''}${diff.toLocaleString()}` 
                        : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{history.change_reason || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 급여 정보 */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-3">
          현재 급여
        </h2>
        <div className="text-center py-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">
            {employee.current_salary.toLocaleString()}원
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {employee.salary_type === 'hourly' ? '시급 기준' : '연봉 기준'}
          </p>
        </div>
      </div>

      {/* 메모 */}
      {employee.notes && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-3">
            특이사항
          </h2>
          <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded">
            {employee.notes}
          </p>
        </div>
      )}

      {/* 푸터 */}
      <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center text-sm text-gray-600">
        <p>발급일: {new Date().toLocaleDateString('ko-KR')}</p>
      </div>
    </div>
  );
}

export default memo(EmployeePrintCard);