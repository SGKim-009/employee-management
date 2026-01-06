-- 평가 시스템 테이블 생성

-- 평가 항목 정의 테이블
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 평가 항목명 (예: "업무 능력", "협업 능력")
  description TEXT, -- 평가 항목 설명
  weight DECIMAL(5, 2) DEFAULT 1.0, -- 가중치 (1.0 = 100%)
  category TEXT, -- 카테고리 (예: "업무", "인성", "리더십")
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 평가 테이블
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES auth.users(id), -- 평가자 (현재 로그인한 사용자)
  evaluation_period TEXT NOT NULL, -- 평가 기간 (예: "2024-상반기", "2024-Q1")
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 평가 일자
  overall_score DECIMAL(5, 2), -- 전체 점수 (0-100)
  overall_comment TEXT, -- 종합 의견
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 평가 항목별 점수 테이블
CREATE TABLE IF NOT EXISTS evaluation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100), -- 점수 (0-100)
  comment TEXT, -- 항목별 의견
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(evaluation_id, criteria_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_evaluations_employee_id ON evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluation_period ON evaluations(evaluation_period);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_evaluation_id ON evaluation_scores(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_criteria_id ON evaluation_scores(criteria_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_is_active ON evaluation_criteria(is_active);

-- RLS 정책 설정
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_scores ENABLE ROW LEVEL SECURITY;

-- 평가 항목 조회 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 평가 항목 조회 가능"
  ON evaluation_criteria
  FOR SELECT
  TO authenticated
  USING (true);

-- 평가 항목 생성/수정 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 평가 항목 생성/수정 가능"
  ON evaluation_criteria
  FOR INSERT, UPDATE
  TO authenticated
  WITH CHECK (true);

-- 평가 조회 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 평가 조회 가능"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (true);

-- 평가 생성/수정 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 평가 생성/수정 가능"
  ON evaluations
  FOR INSERT, UPDATE
  TO authenticated
  WITH CHECK (true);

-- 평가 삭제 권한 (평가자 또는 관리자만)
CREATE POLICY "평가자는 자신의 평가 삭제 가능"
  ON evaluations
  FOR DELETE
  TO authenticated
  USING (
    evaluator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- 평가 점수 조회 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 평가 점수 조회 가능"
  ON evaluation_scores
  FOR SELECT
  TO authenticated
  USING (true);

-- 평가 점수 생성/수정 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 평가 점수 생성/수정 가능"
  ON evaluation_scores
  FOR INSERT, UPDATE
  TO authenticated
  WITH CHECK (true);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_evaluation_criteria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_evaluation_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_evaluation_criteria_updated_at
  BEFORE UPDATE ON evaluation_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_criteria_updated_at();

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at();

CREATE TRIGGER update_evaluation_scores_updated_at
  BEFORE UPDATE ON evaluation_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_scores_updated_at();

-- 기본 평가 항목 데이터 삽입 (선택사항)
INSERT INTO evaluation_criteria (name, description, weight, category) VALUES
  ('업무 능력', '업무 수행 능력 및 전문성', 1.0, '업무'),
  ('협업 능력', '팀워크 및 협업 능력', 1.0, '인성'),
  ('의사소통', '의사소통 능력', 1.0, '인성'),
  ('책임감', '업무에 대한 책임감', 1.0, '인성'),
  ('리더십', '리더십 및 팀 관리 능력', 1.0, '리더십'),
  ('창의성', '창의적 사고 및 문제 해결 능력', 1.0, '업무'),
  ('성장 가능성', '향후 성장 가능성', 1.0, '업무')
ON CONFLICT DO NOTHING;



