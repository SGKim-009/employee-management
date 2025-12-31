'use client';

import Image from 'next/image';
import { memo } from 'react';
import { Employee } from '@/types/employee';
import { Mail, Phone, Briefcase, Calendar, Trash2, Edit, User, TrendingUp, IdCard, Clock, Printer } from 'lucide-react';
import { calculateTenure } from '@/types/employee';

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onDelete?: (id: string) => void;
  onViewDetails: (employee: Employee) => void;
  onPrintCard: (employee: Employee) => void; // 🆕 인사관리카드 출력
}

function EmployeeCard({ employee, onEdit, onDelete, onViewDetails, onPrintCard }: EmployeeCardProps) {
  const tenure = calculateTenure(employee.hire_date, employee.resignation_date);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 hover:shadow-xl dark:hover:shadow-gray-900/70 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 hover:scale-[1.02]">
      {/* 프로필 이미지 섹션 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
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
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
              employee.status === 'active' ? 'bg-green-500' : 
              employee.status === 'resigned' ? 'bg-gray-400' : 'bg-yellow-400'
            }`} />
          </div>
          
          <div className="flex-1 text-white">
            <h3 className="text-xl font-bold">{employee.name}</h3>
            {/* 🆕 직급/직책 표기 */}
            <p className="text-blue-100 dark:text-blue-200 text-sm">{employee.rank} / {employee.position}</p>
            {employee.employee_number && (
              <p className="text-blue-200 dark:text-blue-300 text-xs mt-1 flex items-center gap-1">
                <IdCard size={12} />
                {employee.employee_number}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 정보 섹션 */}
      <div className="p-6">
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
            <Briefcase size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium">부서:</span>
            <span>{employee.department}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
            <Mail size={14} />
            <span className="truncate">{employee.email}</span>
          </div>
          
          {employee.phone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
              <Phone size={14} />
              <span>{employee.phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
            <Calendar size={14} />
            <span>입사: {new Date(employee.hire_date).toLocaleDateString('ko-KR')}</span>
          </div>

          {/* 🆕 퇴사일 표시 */}
          {employee.resignation_date && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <Calendar size={14} />
              <span>퇴사: {new Date(employee.resignation_date).toLocaleDateString('ko-KR')}</span>
            </div>
          )}
          
          {/* 🆕 근속 기간 표시 */}
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm">
            <Clock size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">근속: {tenure}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm">
            <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
            <span className="font-semibold">
              {employee.current_salary.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(employee)}
              className="flex-1 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label={`${employee.name} 직원 상세보기`}
            >
              상세보기
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(employee)}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                title="수정"
                aria-label={`${employee.name} 직원 정보 수정`}
              >
                <Edit size={18} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(employee.id)}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                title="삭제"
                aria-label={`${employee.name} 직원 삭제`}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          {/* 🆕 인사관리카드 출력 버튼 */}
          <button
            onClick={() => onPrintCard(employee)}
            className="w-full px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium flex items-center justify-center gap-2 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label={`${employee.name} 인사관리카드 출력`}
          >
            <Printer size={16} />
            인사관리카드
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(EmployeeCard);