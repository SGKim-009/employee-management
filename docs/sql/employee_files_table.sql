-- 직원 파일 관리 테이블 생성
CREATE TABLE IF NOT EXISTS employee_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('document', 'resume', 'contract', 'other')),
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  description TEXT,
  version_number INTEGER, -- 이력서 버전 번호
  is_latest_version BOOLEAN DEFAULT true, -- 최신 버전 여부
  expiry_date DATE, -- 계약서 만료일
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_employee_files_employee_id ON employee_files(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_files_file_type ON employee_files(file_type);
CREATE INDEX IF NOT EXISTS idx_employee_files_uploaded_at ON employee_files(uploaded_at DESC);

-- RLS 정책 설정
ALTER TABLE employee_files ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모든 파일 조회 가능
CREATE POLICY "인증된 사용자는 파일 조회 가능"
  ON employee_files
  FOR SELECT
  TO authenticated
  USING (true);

-- 인증된 사용자는 파일 업로드 가능
CREATE POLICY "인증된 사용자는 파일 업로드 가능"
  ON employee_files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 인증된 사용자는 파일 삭제 가능
CREATE POLICY "인증된 사용자는 파일 삭제 가능"
  ON employee_files
  FOR DELETE
  TO authenticated
  USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_employee_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_files_updated_at
  BEFORE UPDATE ON employee_files
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_files_updated_at();

-- Storage 버킷 생성 (Supabase 대시보드에서 수동으로 생성해야 함)
-- 버킷 이름: employee-documents
-- 공개 버킷: false (비공개)
-- 파일 크기 제한: 10MB (선택)
-- 허용된 MIME 타입: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.* (선택)

-- 기존 테이블에 필드 추가 (테이블이 이미 있는 경우)
-- 다음 명령어를 실행하여 버전 관리 및 만료일 필드를 추가하세요:

-- ALTER TABLE employee_files 
-- ADD COLUMN IF NOT EXISTS version_number INTEGER;

-- ALTER TABLE employee_files 
-- ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;

-- ALTER TABLE employee_files 
-- ADD COLUMN IF NOT EXISTS expiry_date DATE;

