'use client';

import { Employee } from '@/types/employee';
import { Mail, Phone, Briefcase, Calendar, Trash2, Edit } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onViewDetails: (employee: Employee) => void;  // 이 줄이 있는지 확인!
}

export default function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{employee.name}</h3>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <Briefcase size={16} />
            {employee.position}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(employee)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="수정"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(employee.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <Mail size={16} />
          {employee.email}
        </p>
        {employee.phone && (
          <p className="flex items-center gap-2">
            <Phone size={16} />
            {employee.phone}
          </p>
        )}
        {employee.department && (
          <p className="text-gray-500">부서: {employee.department}</p>
        )}
        <p className="flex items-center gap-2 text-gray-500">
          <Calendar size={16} />
          입사일: {new Date(employee.hire_date).toLocaleDateString('ko-KR')}
        </p>
      </div>
    </div>
  );
}