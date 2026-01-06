-- 급여 타입(salary_type) 컬럼 추가 마이그레이션
-- 연봉(annual) 또는 시급(hourly)을 선택할 수 있도록 함

-- 1. salary_type 컬럼 추가 (기본값: 'annual')
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS salary_type TEXT CHECK (salary_type IN ('annual', 'hourly')) DEFAULT 'annual';

-- 2. 기존 데이터의 salary_type을 'annual'로 설정 (기존 데이터는 모두 연봉으로 간주)
UPDATE employees 
SET salary_type = 'annual' 
WHERE salary_type IS NULL;

-- 3. NOT NULL 제약 조건 추가 (기본값이 있으므로 안전)
ALTER TABLE employees 
ALTER COLUMN salary_type SET NOT NULL;

-- 4. 인덱스 추가 (선택사항, 급여 타입별 조회가 필요한 경우)
CREATE INDEX IF NOT EXISTS idx_employees_salary_type ON employees(salary_type);

-- 5. 코멘트 추가
COMMENT ON COLUMN employees.salary_type IS '급여 타입: annual(연봉) 또는 hourly(시급)';



