import { supabase } from './supabaseClient';

export interface EmployeeFile {
  id: string;
  employee_id: string;
  file_name: string;
  file_type: 'document' | 'resume' | 'contract' | 'other';
  file_path: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by?: string;
  description?: string;
  version_number?: number; // 이력서 버전 번호
  is_latest_version?: boolean; // 최신 버전 여부
  expiry_date?: string; // 계약서 만료일
}

/**
 * 직원별 파일 업로드
 */
export async function uploadEmployeeFile(
  employeeId: string,
  file: File,
  fileType: EmployeeFile['file_type'],
  description?: string,
  expiryDate?: string
): Promise<EmployeeFile> {
  // 파일 확장자 추출
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${employeeId}/${fileType}/${timestamp}-${file.name}`;
  
  // Supabase Storage에 업로드
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('employee-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    throw new Error(`파일 업로드 실패: ${uploadError.message}`);
  }
  
  // 이력서인 경우 버전 번호 계산
  let versionNumber: number | undefined;
  let isLatestVersion = true;
  
  if (fileType === 'resume') {
    // 기존 이력서 파일들 조회
    const { data: existingResumes } = await supabase
      .from('employee_files')
      .select('version_number, is_latest_version')
      .eq('employee_id', employeeId)
      .eq('file_type', 'resume')
      .order('version_number', { ascending: false })
      .limit(1);
    
    if (existingResumes && existingResumes.length > 0) {
      const latestVersion = existingResumes[0].version_number || 0;
      versionNumber = latestVersion + 1;
      
      // 기존 최신 버전을 false로 업데이트
      await supabase
        .from('employee_files')
        .update({ is_latest_version: false })
        .eq('employee_id', employeeId)
        .eq('file_type', 'resume')
        .eq('is_latest_version', true);
    } else {
      versionNumber = 1;
    }
  }
  
  // 파일 메타데이터를 데이터베이스에 저장
  const { data: fileData, error: dbError } = await supabase
    .from('employee_files')
    .insert({
      employee_id: employeeId,
      file_name: file.name,
      file_type: fileType,
      file_path: uploadData.path,
      file_size: file.size,
      description: description || null,
      version_number: versionNumber || null,
      is_latest_version: isLatestVersion,
      expiry_date: expiryDate || null,
    })
    .select()
    .single();
  
  if (dbError) {
    // 업로드된 파일 삭제
    await supabase.storage
      .from('employee-documents')
      .remove([uploadData.path]);
    
    throw new Error(`파일 정보 저장 실패: ${dbError.message}`);
  }
  
  return fileData;
}

/**
 * 직원별 파일 목록 조회
 */
export async function getEmployeeFiles(
  employeeId: string,
  fileType?: EmployeeFile['file_type']
): Promise<EmployeeFile[]> {
  let query = supabase
    .from('employee_files')
    .select('*')
    .eq('employee_id', employeeId)
    .order('uploaded_at', { ascending: false });
  
  if (fileType) {
    query = query.eq('file_type', fileType);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`파일 목록 조회 실패: ${error.message}`);
  }
  
  return data || [];
}

/**
 * 파일 다운로드 URL 생성
 */
export async function getFileDownloadUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage
    .from('employee-documents')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * 파일 삭제
 */
export async function deleteEmployeeFile(fileId: string): Promise<void> {
  // 파일 정보 조회
  const { data: fileData, error: fetchError } = await supabase
    .from('employee_files')
    .select('file_path')
    .eq('id', fileId)
    .single();
  
  if (fetchError) {
    throw new Error(`파일 정보 조회 실패: ${fetchError.message}`);
  }
  
  // Storage에서 파일 삭제
  const { error: storageError } = await supabase.storage
    .from('employee-documents')
    .remove([fileData.file_path]);
  
  if (storageError) {
    throw new Error(`파일 삭제 실패: ${storageError.message}`);
  }
  
  // 데이터베이스에서 파일 정보 삭제
  const { error: dbError } = await supabase
    .from('employee_files')
    .delete()
    .eq('id', fileId);
  
  if (dbError) {
    throw new Error(`파일 정보 삭제 실패: ${dbError.message}`);
  }
}

/**
 * 파일 타입별 라벨
 */
export function getFileTypeLabel(fileType: EmployeeFile['file_type']): string {
  const labels = {
    document: '문서',
    resume: '이력서',
    contract: '계약서',
    other: '기타',
  };
  return labels[fileType];
}

/**
 * 파일 크기 포맷팅
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 이력서 최신 버전으로 설정
 */
export async function setResumeAsLatestVersion(fileId: string, employeeId: string): Promise<void> {
  // 기존 최신 버전을 false로 업데이트
  await supabase
    .from('employee_files')
    .update({ is_latest_version: false })
    .eq('employee_id', employeeId)
    .eq('file_type', 'resume')
    .eq('is_latest_version', true);
  
  // 선택한 파일을 최신 버전으로 설정
  const { error } = await supabase
    .from('employee_files')
    .update({ is_latest_version: true })
    .eq('id', fileId);
  
  if (error) {
    throw new Error(`버전 업데이트 실패: ${error.message}`);
  }
}

/**
 * 계약서 만료일 업데이트
 */
export async function updateContractExpiryDate(fileId: string, expiryDate: string): Promise<void> {
  const { error } = await supabase
    .from('employee_files')
    .update({ expiry_date: expiryDate })
    .eq('id', fileId);
  
  if (error) {
    throw new Error(`만료일 업데이트 실패: ${error.message}`);
  }
}

