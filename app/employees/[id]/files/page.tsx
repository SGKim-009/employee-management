'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { employeeService } from '@/lib/supabaseClient';
import { Employee } from '@/types/employee';
import {
  getEmployeeFiles,
  uploadEmployeeFile,
  deleteEmployeeFile,
  getFileDownloadUrl,
  getFileTypeLabel,
  formatFileSize,
  setResumeAsLatestVersion,
  updateContractExpiryDate,
  EmployeeFile,
} from '@/lib/fileService';
import { Upload, Download, Trash2, File, ArrowLeft, FileText, Briefcase, FileCheck, Star, Calendar } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EmployeeFilesPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [files, setFiles] = useState<EmployeeFile[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<EmployeeFile['file_type'] | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileType, setUploadFileType] = useState<EmployeeFile['file_type']>('document');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [editingFile, setEditingFile] = useState<EmployeeFile | null>(null);
  const [editExpiryDate, setEditExpiryDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 직원 정보 조회
        const emp = await employeeService.getById(employeeId);
        setEmployee(emp);
        
        // 파일 목록 조회
        const fileList = await getEmployeeFiles(employeeId);
        setFiles(fileList);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast.error('파일을 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      const newFile = await uploadEmployeeFile(
        employeeId,
        uploadFile,
        uploadFileType,
        uploadDescription || undefined,
        uploadExpiryDate || undefined
      );
      
      setFiles([newFile, ...files]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadExpiryDate('');
      toast.success('파일이 업로드되었습니다.');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteEmployeeFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      toast.success('파일이 삭제되었습니다.');
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(error.message || '파일 삭제에 실패했습니다.');
    }
  };

  const handleFileDownload = async (file: EmployeeFile) => {
    try {
      const url = await getFileDownloadUrl(file.file_path);
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(error.message || '파일 다운로드에 실패했습니다.');
    }
  };

  const handleSetAsLatestVersion = async (file: EmployeeFile) => {
    try {
      await setResumeAsLatestVersion(file.id, employeeId);
      setFiles(files.map(f => 
        f.id === file.id 
          ? { ...f, is_latest_version: true }
          : f.file_type === 'resume' && f.employee_id === employeeId
          ? { ...f, is_latest_version: false }
          : f
      ));
      toast.success('최신 버전으로 설정되었습니다.');
    } catch (error: any) {
      console.error('Error setting latest version:', error);
      toast.error(error.message || '버전 설정에 실패했습니다.');
    }
  };

  const handleUpdateExpiryDate = async () => {
    if (!editingFile) return;

    try {
      await updateContractExpiryDate(editingFile.id, editExpiryDate);
      setFiles(files.map(f => 
        f.id === editingFile.id 
          ? { ...f, expiry_date: editExpiryDate }
          : f
      ));
      setEditingFile(null);
      setEditExpiryDate('');
      toast.success('만료일이 업데이트되었습니다.');
    } catch (error: any) {
      console.error('Error updating expiry date:', error);
      toast.error(error.message || '만료일 업데이트에 실패했습니다.');
    }
  };

  const filteredFiles = selectedFileType === 'all'
    ? files
    : files.filter(f => f.file_type === selectedFileType);

  const fileTypeCounts = {
    all: files.length,
    document: files.filter(f => f.file_type === 'document').length,
    resume: files.filter(f => f.file_type === 'resume').length,
    contract: files.filter(f => f.file_type === 'contract').length,
    other: files.filter(f => f.file_type === 'other').length,
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <LoadingSpinner text="파일 목록을 불러오는 중..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (!employee) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">직원 정보를 찾을 수 없습니다.</p>
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

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href="/"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </Link>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">파일 관리</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {employee.name} ({employee.employee_number || 'N/A'})
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Upload size={18} />
                파일 업로드
              </button>
            </div>
          </div>

          {/* 파일 타입 필터 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {(['all', 'document', 'resume', 'contract', 'other'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFileType(type)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedFileType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type === 'all' && <File size={16} />}
                  {type === 'document' && <FileText size={16} />}
                  {type === 'resume' && <Briefcase size={16} />}
                  {type === 'contract' && <FileCheck size={16} />}
                  {type === 'other' && <File size={16} />}
                  {type === 'all' ? '전체' : getFileTypeLabel(type)}
                  <span className="text-xs opacity-75">({fileTypeCounts[type]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 파일 목록 */}
          {filteredFiles.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-12 text-center">
              <File className="text-gray-400 dark:text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400 text-lg">파일이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                        <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {file.file_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getFileTypeLabel(file.file_type)}
                          </p>
                          {file.file_type === 'resume' && file.version_number && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              v{file.version_number}
                            </span>
                          )}
                          {file.file_type === 'resume' && file.is_latest_version && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded flex items-center gap-1">
                              <Star size={12} />
                              최신
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {file.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {file.description}
                    </p>
                  )}
                  
                  {file.file_type === 'contract' && file.expiry_date && (
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        만료일: {new Date(file.expiry_date).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>{new Date(file.uploaded_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFileDownload(file)}
                        className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        다운로드
                      </button>
                      <button
                        onClick={() => handleFileDelete(file.id, file.file_name)}
                        className="px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                        aria-label="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {file.file_type === 'resume' && !file.is_latest_version && (
                      <button
                        onClick={() => handleSetAsLatestVersion(file)}
                        className="w-full px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Star size={14} />
                        최신 버전으로 설정
                      </button>
                    )}
                    {file.file_type === 'contract' && (
                      <button
                        onClick={() => {
                          setEditingFile(file);
                          setEditExpiryDate(file.expiry_date || '');
                        }}
                        className="w-full px-3 py-2 bg-yellow-600 dark:bg-yellow-700 text-white rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Calendar size={14} />
                        만료일 {file.expiry_date ? '수정' : '설정'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 업로드 모달 */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">파일 업로드</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      파일 타입
                    </label>
                    <select
                      value={uploadFileType}
                      onChange={(e) => setUploadFileType(e.target.value as EmployeeFile['file_type'])}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    >
                      <option value="document">문서</option>
                      <option value="resume">이력서</option>
                      <option value="contract">계약서</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      파일 선택
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      설명 (선택)
                    </label>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                      placeholder="파일에 대한 설명을 입력하세요"
                    />
                  </div>
                  
                  {uploadFileType === 'contract' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        만료일 (선택)
                      </label>
                      <input
                        type="date"
                        value={uploadExpiryDate}
                        onChange={(e) => setUploadExpiryDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadFile || uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? '업로드 중...' : '업로드'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                      setUploadDescription('');
                      setUploadExpiryDate('');
                    }}
                    className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 만료일 수정 모달 */}
          {editingFile && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">계약서 만료일 {editingFile.expiry_date ? '수정' : '설정'}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      파일명
                    </label>
                    <p className="text-gray-800 dark:text-gray-200">{editingFile.file_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      만료일
                    </label>
                    <input
                      type="date"
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleUpdateExpiryDate}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditingFile(null);
                      setEditExpiryDate('');
                    }}
                    className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

