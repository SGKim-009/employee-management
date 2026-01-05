'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { importEmployeesFromExcel, generateExcelTemplate, ImportResult } from '@/lib/excelService';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        toast.error('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('파일을 선택해주세요.');
      return;
    }

    try {
      setImporting(true);
      const result = await importEmployeesFromExcel(file);
      setImportResult(result);
      
      if (result.success > 0) {
        toast.success(`${result.success}명의 직원이 성공적으로 임포트되었습니다.`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed}명의 직원 임포트에 실패했습니다.`);
      }
    } catch (error: any) {
      console.error('Error importing employees:', error);
      toast.error(error.message || '엑셀 파일 임포트에 실패했습니다.');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      generateExcelTemplate();
      toast.success('템플릿 파일이 다운로드되었습니다.');
    } catch (error: any) {
      console.error('Error generating template:', error);
      toast.error('템플릿 생성에 실패했습니다.');
    }
  };

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
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">엑셀 임포트</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-300">엑셀 파일을 업로드하여 직원 정보를 일괄 등록하세요</p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                템플릿 다운로드
              </button>
            </div>
          </div>

          {/* 업로드 영역 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 mb-8">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12">
              <FileSpreadsheet className="text-gray-400 dark:text-gray-500 mb-4" size={64} />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">엑셀 파일 업로드</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                .xlsx 또는 .xls 형식의 엑셀 파일을 업로드하세요
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Upload size={18} />
                파일 선택
              </label>
              
              {file && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    선택된 파일: <span className="font-semibold">{file.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    크기: {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-8 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      임포트 중...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      임포트 시작
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 임포트 결과 */}
          {importResult && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">임포트 결과</h2>
              
              {/* 요약 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">성공</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {importResult.success}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="text-red-600 dark:text-red-400" size={24} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">실패</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {importResult.failed}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={24} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">전체</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {importResult.success + importResult.failed}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 에러 목록 */}
              {importResult.errors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                    오류 상세 ({importResult.errors.length}건)
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">행 번호</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">오류 메시지</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {importResult.errors.map((error, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{error.row}</td>
                            <td className="px-4 py-2 text-red-600 dark:text-red-400">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 성공한 직원 목록 */}
              {importResult.importedEmployees.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                    임포트된 직원 ({importResult.importedEmployees.length}명)
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">이름</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">이메일</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">부서</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">직급</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {importResult.importedEmployees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{emp.name}</td>
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{emp.email}</td>
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{emp.department}</td>
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{emp.rank}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 완료 버튼 */}
              <div className="mt-6 flex justify-end">
                <Link
                  href="/"
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  메인으로 돌아가기
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}



