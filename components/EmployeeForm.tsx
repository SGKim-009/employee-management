'use client';

import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { X } from 'lucide-react';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export default function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    hire_date: '',
    phone: '',
    department: ''
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        position: employee.position,
        email: employee.email,
        hire_date: employee.hire_date,
        phone: employee.phone || '',
        department: employee.department || ''
      });
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      position: '',
      email: '',
      hire_date: '',
      phone: '',
      department: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {employee ? '직원 정보 수정' : '새 직원 추가'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              직책 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="소프트웨어 엔지니어"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="hong@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              입사일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="hire_date"
              value={formData.hire_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              부서
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="개발팀"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {employee ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}