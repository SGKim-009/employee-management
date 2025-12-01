'use client';

import { useState, useEffect } from 'react';
import { Employee, Certification, Career } from '@/types/employee';
import { X, Plus, Trash2, Upload, User } from 'lucide-react';
import { employeeService } from '@/lib/supabaseClient';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>, imageFile?: File) => void;
  onCancel: () => void;
}

export default function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'education' | 'career' | 'salary'>('basic');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    rank: '사원',
    email: '',
    phone: '',
    department: '',
    hire_date: '',
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

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        position: employee.position,
        rank: employee.rank,
        email: employee.email,
        phone: employee.phone || '',
        department: employee.department,
        hire_date: employee.hire_date,
        current_salary: employee.current_salary,
        education_level: employee.education_level || '',
        education_school: employee.education_school || '',
        education_major: employee.education_major || '',
        education_graduation_year: employee.education_graduation_year || new Date().getFullYear(),
        certifications: employee.certifications || [],
        career_history: employee.career_history || [],
        profile_image_url: employee.profile_image_url || '',
        status: employee.status,
        notes: employee.notes || ''
      });
      if (employee.profile_image_url) {
        setImagePreview(employee.profile_image_url);
      }
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, imageFile || undefined);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'current_salary' || name === 'education_graduation_year' ? parseInt(value) || 0 : value
    });
  };

  // 이미지 파일 선택
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

  // 자격증 추가
  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [
        ...formData.certifications,
        { name: '', issuer: '', issue_date: '', expiry_date: '', certification_number: '' }
      ]
    });
  };

  // 자격증 삭제
  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index)
    });
  };

  // 자격증 수정
  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...formData.certifications];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, certifications: updated });
  };

  // 경력 추가
  const addCareer = () => {
    setFormData({
      ...formData,
      career_history: [
        ...formData.career_history,
        { company: '', position: '', department: '', start_date: '', end_date: '', description: '' }
      ]
    });
  };

  // 경력 삭제
  const removeCareer = (index: number) => {
    setFormData({
      ...formData,
      career_history: formData.career_history.filter((_, i) => i !== index)
    });
  };

  // 경력 수정
  const updateCareer = (index: number, field: keyof Career, value: string) => {
    const updated = [...formData.career_history];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, career_history: updated });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {employee ? '직원 정보 수정' : '새 직원 등록'}
            </h2>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              기본 정보
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'education'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              학력 & 자격
            </button>
            <button
              onClick={() => setActiveTab('career')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'career'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              경력 사항
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'salary'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              급여 & 메모
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="max-h-[60vh] overflow-y-auto">
            {/* 기본 정보 탭 */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* 프로필 이미지 업로드 */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-blue-100">
                        <User size={48} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Upload size={18} />
                    프로필 사진 업로드
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">JPG, PNG (최대 5MB)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="홍길동"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="hong@company.com"
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
                      name="hire_date"
                      value={formData.hire_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      부서 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="개발팀"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      직급 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="rank"
                      value={formData.rank}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      직책 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="소프트웨어 엔지니어"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      재직 상태
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">재직중</option>
                      <option value="inactive">휴직</option>
                      <option value="resigned">퇴사</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 학력 & 자격 탭 */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                {/* 학력 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">학력 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        최종 학력
                      </label>
                      <select
                        name="education_level"
                        value={formData.education_level}
                        onChange={handleChange}
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
                        name="education_school"
                        value={formData.education_school}
                        onChange={handleChange}
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
                        name="education_major"
                        value={formData.education_major}
                        onChange={handleChange}
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
                        name="education_graduation_year"
                        value={formData.education_graduation_year}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2020"
                        min="1950"
                        max={new Date().getFullYear() + 10}
                      />
                    </div>
                  </div>
                </div>

                {/* 자격증 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">자격증</h3>
                    <button
                      type="button"
                      onClick={addCertification}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus size={16} />
                      자격증 추가
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.certifications.map((cert, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
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
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => updateCertification(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="자격증명 (예: 정보처리기사)"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="발급기관"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={cert.certification_number}
                              onChange={(e) => updateCertification(index, 'certification_number', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="자격번호"
                            />
                          </div>
                          <div>
                            <input
                              type="date"
                              value={cert.issue_date}
                              onChange={(e) => updateCertification(index, 'issue_date', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="발급일"
                            />
                          </div>
                          <div>
                            <input
                              type="date"
                              value={cert.expiry_date}
                              onChange={(e) => updateCertification(index, 'expiry_date', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="만료일 (선택)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {formData.certifications.length === 0 && (
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
                      onClick={addCareer}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus size={16} />
                      경력 추가
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.career_history.map((career, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
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
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={career.company}
                              onChange={(e) => updateCareer(index, 'company', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="회사명"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={career.position}
                              onChange={(e) => updateCareer(index, 'position', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="직책"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={career.department}
                              onChange={(e) => updateCareer(index, 'department', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="부서"
                            />
                          </div>
                          <div>
                            <input
                              type="date"
                              value={career.start_date}
                              onChange={(e) => updateCareer(index, 'start_date', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="시작일"
                            />
                          </div>
                          <div>
                            <input
                              type="date"
                              value={career.end_date}
                              onChange={(e) => updateCareer(index, 'end_date', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="종료일"
                            />
                          </div>
                          <div className="col-span-2">
                            <textarea
                              value={career.description}
                              onChange={(e) => updateCareer(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="업무 내용"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {formData.career_history.length === 0 && (
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
                      name="current_salary"
                      value={formData.current_salary}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="3500000"
                      min="0"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.current_salary.toLocaleString()}원
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">메모</h3>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="추가 메모사항을 입력하세요..."
                    rows={6}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {employee ? '수정 완료' : '등록 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}