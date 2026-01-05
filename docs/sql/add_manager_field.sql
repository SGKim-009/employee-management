-- employees 테이블에 manager_id 필드 추가
-- 이 필드는 상급자(직속 상사)를 참조합니다.

-- manager_id 컬럼 추가 (NULL 허용)
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);

-- 기존 데이터에 대한 제약 조건 (자기 자신을 manager로 지정할 수 없음)
-- 이 제약 조건은 애플리케이션 레벨에서도 체크해야 합니다.
-- 데이터베이스 레벨에서는 CHECK 제약 조건으로 구현할 수 있지만,
-- 순환 참조를 완전히 방지하기 위해서는 트리거가 필요할 수 있습니다.

-- 주석 추가
COMMENT ON COLUMN employees.manager_id IS '직속 상사(상급자)의 ID. 보고 체계를 나타냅니다.';


