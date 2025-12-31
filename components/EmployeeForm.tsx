'use client';

import React from 'react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Employee, Certification, Career, SalaryHistory } from '@/types/employee';
import { X, Plus, Trash2, Upload, User, Edit } from 'lucide-react';
import { employeeService } from '@/lib/supabaseClient';
import { showToast } from '@/lib/toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { employeeSchema, EmployeeFormData } from '@/types/employee.schema';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>, imageFile?: File) => void;
  onCancel: () => void;
}

function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'education' | 'career' | 'salary'>('basic');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // React Hook Form 설정
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
    control
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_number: '',
      name: '',
      position: '',
      rank: '사원',
      email: '',
      phone: '',
      company: '',
      department: '',
      team: '',
      hire_date: '',
      resignation_date: '',
      current_salary: 0,
      resident_number: '',
      address: '',
      education_level: '',
      education_school: '',
      education_major: '',
      education_graduation_year: new Date().getFullYear(),
      certifications: [],
      career_history: [],
      profile_image_url: '',
      status: 'active',
      notes: ''
    }
  });

  const status = watch('status');
  const employeeNumber = watch('employee_number');
  const email = watch('email');
  
  // 중복 체크 상태
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateErrors, setDuplicateErrors] = useState<{
    employee_number?: string;
    email?: string;
  }>({});
  
  // 사원번호 중복 체크
  useEffect(() => {
    const trimmedNumber = employeeNumber?.trim();
    
    // 빈 값이면 에러 제거
    if (!trimmedNumber || trimmedNumber === '') {
      setDuplicateErrors(prev => ({ ...prev, employee_number: undefined }));
      return;
    }
    
    // 수정 모드일 때는 현재 직원의 사원번호는 제외
    const excludeId = employee?.id;
    
    const checkDuplicate = async () => {
      setCheckingDuplicate(true);
      try {
        const response = await fetch('/api/employees/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'employee_number',
            value: trimmedNumber,
            excludeId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          return;
        }
        
        const result = await response.json();
        
        if (result.error) {
          console.error('Duplicate check error:', result.error);
          return;
        }
        
        if (result.exists === true) {
          setDuplicateErrors(prev => ({
            ...prev,
            employee_number: '이미 사용 중인 사원번호입니다.'
          }));
        } else {
          setDuplicateErrors(prev => ({ ...prev, employee_number: undefined }));
        }
      } catch (error) {
        console.error('Error checking duplicate employee number:', error);
      } finally {
        setCheckingDuplicate(false);
      }
    };
    
    // 디바운싱: 500ms 후에 체크
    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [employeeNumber, employee?.id]);
  
  // 이메일 중복 체크
  useEffect(() => {
    const trimmedEmail = email?.trim();
    
    // 빈 값이면 에러 제거
    if (!trimmedEmail || trimmedEmail === '') {
      setDuplicateErrors(prev => ({ ...prev, email: undefined }));
      return;
    }
    
    // 수정 모드일 때는 현재 직원의 이메일은 제외
    const excludeId = employee?.id;
    
    const checkDuplicate = async () => {
      setCheckingDuplicate(true);
      try {
        const response = await fetch('/api/employees/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'email',
            value: trimmedEmail,
            excludeId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          return;
        }
        
        const result = await response.json();
        
        if (result.error) {
          console.error('Duplicate check error:', result.error);
          return;
        }
        
        if (result.exists === true) {
          setDuplicateErrors(prev => ({
            ...prev,
            email: '이미 사용 중인 이메일입니다.'
          }));
        } else {
          setDuplicateErrors(prev => ({ ...prev, email: undefined }));
        }
      } catch (error) {
        console.error('Error checking duplicate email:', error);
      } finally {
        setCheckingDuplicate(false);
      }
    };
    
    // 디바운싱: 500ms 후에 체크
    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [email, employee?.id]);
  
  // useFieldArray for certifications and career_history
  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({
    control,
    name: 'certifications',
  });

  const {
    fields: careerFields,
    append: appendCareer,
    remove: removeCareer,
  } = useFieldArray({
    control,
    name: 'career_history',
  });
  
  // 기존 formData는 하위 호환성을 위해 유지 (점진적 마이그레이션)
  const [formData, setFormData] = useState({
    employee_number: '',
    name: '',
    position: '',
    rank: '사원',
    email: '',
    phone: '',
    department: '',
    hire_date: '',
    resignation_date: '',
    current_salary: 0,
    education_level: '',
    education_school: '',
    education_major: '',
    education_graduation_year: new Date().getFullYear(),
    certifications: [] as Certification[],
    career_history: [] as Career[],
    profile_image_url: '',
    status: 'active',
    notes: ''
  });

  // 급여 변동 이력 관련 state
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [loadingSalaryHistory, setLoadingSalaryHistory] = useState(false);
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [editingSalaryData, setEditingSalaryData] = useState<{
    year_month: string;
    amount: number;
    reason: string;
  }>({ year_month: '', amount: 0, reason: '' });

  useEffect(() => {
    if (employee) {
      const employeeData: EmployeeFormData = {
        employee_number: employee.employee_number || '',
        name: employee.name,
        position: employee.position,
        rank: employee.rank,
        email: employee.email,
        phone: employee.phone || '',
        company: employee.company || '',
        department: employee.department,
        team: employee.team || '',
        hire_date: employee.hire_date,
        resignation_date: employee.resignation_date || '',
        current_salary: employee.current_salary,
        resident_number: employee.resident_number || '',
        address: employee.address || '',
        education_level: employee.education_level || '',
        education_school: employee.education_school || '',
        education_major: employee.education_major || '',
        education_graduation_year: employee.education_graduation_year || new Date().getFullYear(),
        certifications: employee.certifications || [],
        career_history: employee.career_history || [],
        profile_image_url: employee.profile_image_url || '',
        status: employee.status as 'active' | 'inactive' | 'resigned',
        notes: employee.notes || ''
      };
      
      reset(employeeData);
      
      setFormData({
        employee_number: employee.employee_number || '',
        name: employee.name,
        position: employee.position,
        rank: employee.rank,
        email: employee.email,
        phone: employee.phone || '',
        department: employee.department,
        hire_date: employee.hire_date,
        resignation_date: employee.resignation_date || '',
        current_salary: employee.current_salary,
        education_level: employee.education_level || '',
        education_school: employee.education_school || '',
        education_major: employee.education_major || '',
        education_graduation_year: employee.education_graduation_year || new Date().getFullYear(),
        certifications: employee.certifications || [],
        career_history: employee.career_history || [],
        profile_image_url: employee.profile_image_url || '',
        status: employee.status as 'active' | 'inactive' | 'resigned',
        notes: employee.notes || ''
      });
      if (employee.profile_image_url) {
        setImagePreview(employee.profile_image_url);
      }
    }
  }, [employee, reset]);

  // 급여 변동 이력 불러오기
  useEffect(() => {
    if (employee && activeTab === 'salary') {
      fetchSalaryHistory();
    }
  }, [employee, activeTab]);

  const fetchSalaryHistory = async () => {
    if (!employee) return;
    
    try {
      setLoadingSalaryHistory(true);
      const history = await employeeService.getSalaryHistory(employee.id);
      setSalaryHistory(history);
    } catch (error) {
      console.error('Error fetching salary history:', error);
    } finally {
      setLoadingSalaryHistory(false);
    }
  };

  // 급여 변동 이력 수정 시작
  const startEditSalary = (history: SalaryHistory) => {
    setEditingSalaryId(history.id);
    setEditingSalaryData({
      year_month: history.change_year_month || '',
      amount: history.new_salary,
      reason: history.change_reason || ''
    });
  };

  // 급여 변동 이력 수정 저장
  const saveSalaryEdit = async () => {
    if (!editingSalaryId) return;
    
    try {
      await employeeService.updateSalaryHistory(editingSalaryId, {
        change_year_month: editingSalaryData.year_month,
        new_salary: editingSalaryData.amount,
        change_reason: editingSalaryData.reason
      });
      
      await fetchSalaryHistory();
      setEditingSalaryId(null);
    } catch (error) {
      showToast.error('급여 이력 수정에 실패했습니다.');
      console.error('Error updating salary history:', error);
    }
  };

  // 급여 변동 이력 삭제
  const deleteSalaryHistory = async (id: string) => {
    if (!confirm('이 급여 변동 이력을 삭제하시겠습니까?')) return;
    
    try {
      await employeeService.deleteSalaryHistory(id);
      await fetchSalaryHistory();
      showToast.success('급여 이력이 삭제되었습니다.');
    } catch (error) {
      showToast.error('급여 이력 삭제에 실패했습니다.');
      console.error('Error deleting salary history:', error);
    }
  };

  const onSubmitForm = async (data: EmployeeFormData) => {
    // 중복 체크 에러가 있으면 제출 방지
    if (duplicateErrors.employee_number || duplicateErrors.email) {
      showToast.error('중복된 사원번호 또는 이메일이 있습니다. 확인해주세요.');
      return;
    }
    
    // 폼 제출 전 최종 중복 체크
    try {
      const trimmedNumber = data.employee_number?.trim();
      const trimmedEmail = data.email?.trim();
      
      // 사원번호 중복 체크 (빈 값이 아닐 때만)
      if (trimmedNumber && trimmedNumber !== '') {
        const numberResponse = await fetch('/api/employees/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'employee_number',
            value: trimmedNumber,
            excludeId: employee?.id
          })
        });
        
        if (numberResponse.ok) {
          const numberResult = await numberResponse.json();
          if (numberResult.exists === true) {
            setDuplicateErrors(prev => ({
              ...prev,
              employee_number: '이미 사용 중인 사원번호입니다.'
            }));
            showToast.error('이미 사용 중인 사원번호입니다.');
            return;
          }
        }
      }
      
      // 이메일 중복 체크
      if (trimmedEmail && trimmedEmail !== '') {
        const emailResponse = await fetch('/api/employees/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'email',
            value: trimmedEmail,
            excludeId: employee?.id
          })
        });
        
        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          if (emailResult.exists === true) {
            setDuplicateErrors(prev => ({
              ...prev,
              email: '이미 사용 중인 이메일입니다.'
            }));
            showToast.error('이미 사용 중인 이메일입니다.');
            return;
          }
        }
      }
      
      // React Hook Form의 데이터를 기존 형식으로 변환
      const employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'> = {
        ...data,
        certifications: data.certifications || [],
        career_history: data.career_history || [],
      };
      onSubmit(employeeData, imageFile || undefined);
    } catch (error) {
      showToast.error('폼 제출 중 오류가 발생했습니다.');
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'current_salary' || name === 'education_graduation_year' ? parseInt(value) || 0 : value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // useFieldArray를 사용하므로 기존 함수들은 제거됨
  const handleAddCertification = () => {
    appendCertification({
      name: '',
      issuer: '',
      issue_date: '',
      expiry_date: '',
      certification_number: '',
    });
  };

  const handleAddCareer = () => {
    appendCareer({
      company: '',
      position: '',
      department: '',
      start_date: '',
      end_date: '',
      description: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-4 md:my-8 max-h-[95vh] md:max-h-[90vh] flex flex-col animate-scale-in">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-6 rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-2xl font-bold text-white">
              {employee ? '직원 정보 수정' : '새 직원 등록'}
            </h2>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="폼 닫기"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex px-2 md:px-6 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'basic'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="기본 정보 탭"
              aria-pressed={activeTab === 'basic'}
            >
              기본 정보
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'education'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="학력 및 자격 탭"
              aria-pressed={activeTab === 'education'}
            >
              학력 & 자격
            </button>
            <button
              onClick={() => setActiveTab('career')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'career'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="경력 사항 탭"
              aria-pressed={activeTab === 'career'}
            >
              경력 사항
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'salary'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="급여 및 메모 탭"
              aria-pressed={activeTab === 'salary'}
            >
              급여 & 메모
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit(onSubmitForm)} className="p-4 md:p-6 flex-1 flex flex-col" noValidate>
          <div className="flex-1 overflow-y-auto">
            {/* 기본 정보 탭 */}
            {activeTab === 'basic' && (
              <div className="space-y-4 md:space-y-6">
                {/* 프로필 이미지 업로드 */}
                <div className="flex flex-col items-center mb-4 md:mb-6">
                  <div className="relative mb-4">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-blue-100"
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-blue-100">
                        <User size={36} className="md:w-12 md:h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 touch-manipulation min-h-[44px]">
                    <Upload size={18} />
                    프로필 사진 업로드
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">JPG, PNG (최대 5MB)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사원번호
                    </label>
                    <input
                      type="text"
                      {...register('employee_number')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        duplicateErrors.employee_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="EMP0001"
                    />
                    {duplicateErrors.employee_number && (
                      <p className="text-red-500 text-xs mt-1">{duplicateErrors.employee_number}</p>
                    )}
                    {!duplicateErrors.employee_number && (
                      <p className="text-xs text-gray-500 mt-1">공백 시 자동 생성됩니다</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="홍길동"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email || duplicateErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="hong@company.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                    {duplicateErrors.email && !errors.email && (
                      <p className="text-red-500 text-xs mt-1">{duplicateErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="010-1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      입사일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('hire_date')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.hire_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.hire_date && (
                      <p className="text-red-500 text-xs mt-1">{errors.hire_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      부서 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('department')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.department ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="개발팀"
                    />
                    {errors.department && (
                      <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      직급 <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('rank')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.rank ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="인턴">인턴</option>
                      <option value="사원">사원</option>
                      <option value="주임">주임</option>
                      <option value="대리">대리</option>
                      <option value="과장">과장</option>
                      <option value="차장">차장</option>
                      <option value="부장">부장</option>
                      <option value="이사">이사</option>
                      <option value="상무">상무</option>
                      <option value="전무">전무</option>
                      <option value="부사장">부사장</option>
                      <option value="사장">사장</option>
                    </select>
                    {errors.rank && (
                      <p className="text-red-500 text-xs mt-1">{errors.rank.message}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      직책 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('position')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.position ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="소프트웨어 엔지니어"
                    />
                    {errors.position && (
                      <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      재직 상태
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">재직중</option>
                      <option value="inactive">휴직</option>
                      <option value="resigned">퇴사</option>
                    </select>
                  </div>

                  {status === 'resigned' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        퇴사일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...register('resignation_date')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.resignation_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.resignation_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.resignation_date.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 학력 & 자격 탭 */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">학력 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        최종 학력
                      </label>
                      <select
                        {...register('education_level')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">선택하세요</option>
                        <option value="고졸">고졸</option>
                        <option value="전문학사">전문학사</option>
                        <option value="학사">학사</option>
                        <option value="석사">석사</option>
                        <option value="박사">박사</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        학교명
                      </label>
                      <input
                        type="text"
                        {...register('education_school')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="서울대학교"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        전공
                      </label>
                      <input
                        type="text"
                        {...register('education_major')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="컴퓨터공학"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        졸업년도
                      </label>
                      <input
                        type="number"
                        {...register('education_graduation_year', { valueAsNumber: true })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2020"
                        min="1950"
                        max={new Date().getFullYear() + 10}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">자격증</h3>
                    <button
                      type="button"
                      onClick={handleAddCertification}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus size={16} />
                      자격증 추가
                    </button>
                  </div>

                  <div className="space-y-4">
                    {certificationFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-700">자격증 {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeCertification(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <input
                              type="text"
                              {...register(`certifications.${index}.name`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                errors.certifications?.[index]?.name ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="자격증명 (예: 정보처리기사)"
                            />
                            {errors.certifications?.[index]?.name && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.certifications[index]?.name?.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              {...register(`certifications.${index}.issuer`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                errors.certifications?.[index]?.issuer ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="발급기관"
                            />
                            {errors.certifications?.[index]?.issuer && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.certifications[index]?.issuer?.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              {...register(`certifications.${index}.certification_number`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="자격번호"
                            />
                          </div>
                          <div>
                            <input
                              type="date"
                              {...register(`certifications.${index}.issue_date`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                errors.certifications?.[index]?.issue_date ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="발급일"
                            />
                            {errors.certifications?.[index]?.issue_date && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.certifications[index]?.issue_date?.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="date"
                              {...register(`certifications.${index}.expiry_date`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="만료일 (선택)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {certificationFields.length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        등록된 자격증이 없습니다. 추가 버튼을 클릭하세요.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 경력 사항 탭 */}
            {activeTab === 'career' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">경력 사항</h3>
                    <button
                      type="button"
                      onClick={handleAddCareer}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus size={16} />
                      경력 추가
                    </button>
                  </div>

                  <div className="space-y-4">
                    {careerFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-700">경력 {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeCareer(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <input
                              type="text"
                              {...register(`career_history.${index}.company`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                errors.career_history?.[index]?.company ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="회사명"
                            />
                            {errors.career_history?.[index]?.company && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.career_history[index]?.company?.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              {...register(`career_history.${index}.position`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                errors.career_history?.[index]?.position ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="직책"
                            />
                            {errors.career_history?.[index]?.position && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.career_history[index]?.position?.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              {...register(`career_history.${index}.department`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="부서"
                            />
                          </div>
                          <div>
                            <input
                              type="date"
                              {...register(`career_history.${index}.start_date`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                errors.career_history?.[index]?.start_date ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="시작일"
                            />
                            {errors.career_history?.[index]?.start_date && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.career_history[index]?.start_date?.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="date"
                              {...register(`career_history.${index}.end_date`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                errors.career_history?.[index]?.end_date ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="종료일"
                            />
                            {errors.career_history?.[index]?.end_date && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.career_history[index]?.end_date?.message}
                              </p>
                            )}
                          </div>
                          <div className="col-span-2">
                            <textarea
                              {...register(`career_history.${index}.description`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="업무 내용"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {careerFields.length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        등록된 경력이 없습니다. 추가 버튼을 클릭하세요.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 급여 & 메모 탭 */}
            {activeTab === 'salary' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">급여 정보</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재 급여 (월급) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('current_salary', { valueAsNumber: true })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.current_salary ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="3500000"
                      min="0"
                    />
                    {errors.current_salary && (
                      <p className="text-red-500 text-xs mt-1">{errors.current_salary.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {watch('current_salary')?.toLocaleString() || 0}원
                    </p>
                  </div>
                </div>

                {/* 급여 변동 이력 */}
                {employee && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">급여 변동 이력</h3>
                    {loadingSalaryHistory ? (
                      <LoadingSpinner size="sm" text="" fullScreen={false} />
                    ) : salaryHistory.length > 0 ? (
                      <div className="space-y-3">
                        {salaryHistory.map((history) => (
                          <div key={history.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            {editingSalaryId === history.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">연월</label>
                                    <input
                                      type="month"
                                      value={editingSalaryData.year_month}
                                      onChange={(e) => setEditingSalaryData({
                                        ...editingSalaryData,
                                        year_month: e.target.value
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">금액</label>
                                    <input
                                      type="number"
                                      value={editingSalaryData.amount}
                                      onChange={(e) => setEditingSalaryData({
                                        ...editingSalaryData,
                                        amount: parseInt(e.target.value) || 0
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-xs text-gray-600 mb-1">사유</label>
                                    <input
                                      type="text"
                                      value={editingSalaryData.reason}
                                      onChange={(e) => setEditingSalaryData({
                                        ...editingSalaryData,
                                        reason: e.target.value
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={saveSalaryEdit}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                  >
                                    저장
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalaryId(null)}
                                    className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="text-sm font-semibold text-blue-600">
                                        {history.change_year_month || new Date(history.change_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="text-lg font-bold text-gray-800">
                                        {history.new_salary.toLocaleString()}원
                                      </span>
                                    </div>
                                    {history.previous_salary > 0 && (
                                      <p className="text-xs text-gray-500">
                                        이전: {history.previous_salary.toLocaleString()}원 
                                        <span className={`ml-2 ${
                                          history.new_salary > history.previous_salary ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          ({history.new_salary > history.previous_salary ? '+' : ''}
                                          {(history.new_salary - history.previous_salary).toLocaleString()}원)
                                        </span>
                                      </p>
                                    )}
                                    {history.change_reason && (
                                      <p className="text-sm text-gray-600 mt-1">사유: {history.change_reason}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startEditSalary(history)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="수정"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteSalaryHistory(history.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="삭제"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">급여 변동 이력이 없습니다.</p>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">메모</h3>
                  <textarea
                    {...register('notes')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="추가 메모사항을 입력하세요..."
                    rows={6}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 md:pt-6 border-t mt-4 md:mt-6 flex-shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 md:px-6 py-2.5 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium touch-manipulation min-h-[44px]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : (employee ? '수정 완료' : '등록 완료')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default React.memo(EmployeeForm);