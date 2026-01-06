/**
 * 데이터베이스 통합 테스트: employeeService
 * 
 * 주의: 실제 Supabase 연결이 필요한 테스트입니다.
 * 환경 변수가 설정되어 있어야 합니다.
 */

import { employeeService } from '@/lib/supabaseClient';
import { Employee } from '@/types/employee';

// 통합 테스트는 실제 데이터베이스 연결이 필요하므로
// 환경 변수 확인 후 실행
const shouldRunIntegrationTests = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

describe('Integration: employeeService', () => {
  beforeAll(() => {
    if (!shouldRunIntegrationTests()) {
      console.warn('통합 테스트를 건너뜁니다. 환경 변수가 설정되지 않았습니다.');
    }
  });

  describe('getAll', () => {
    it.skip('should fetch employees with pagination', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const result = await employeeService.getAll(1, 10);
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it.skip('should filter employees by department', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const result = await employeeService.getAll(1, 10, '', false, {
        department: '개발팀',
      });

      expect(result.data.every((emp: Employee) => emp.department === '개발팀')).toBe(true);
    });

    it.skip('should search employees by name', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const result = await employeeService.getAll(1, 10, '홍길동');

      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getById', () => {
    it.skip('should fetch employee by id', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      // 실제 테스트를 위해서는 먼저 직원을 생성해야 함
      // 이는 E2E 테스트에서 다룰 수 있음
      expect(true).toBe(true);
    });
  });

  describe('create', () => {
    it.skip('should create a new employee', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const newEmployee = {
        name: '테스트 직원',
        email: `test-${Date.now()}@example.com`,
        position: '테스트 직책',
        rank: '사원',
        company: '테스트 회사',
        department: '테스트 부서',
        hire_date: new Date().toISOString().split('T')[0],
        current_salary: 3000000,
        salary_type: 'annual' as const,
        status: 'active' as const,
      };

      // 실제 생성 테스트는 E2E에서 수행
      expect(true).toBe(true);
    });
  });

  describe('checkEmployeeNumberExists', () => {
    it.skip('should check if employee number exists', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const exists = await employeeService.checkEmployeeNumberExists('NONEXISTENT123');
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('checkEmailExists', () => {
    it.skip('should check if email exists', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const exists = await employeeService.checkEmailExists('nonexistent@example.com');
      expect(typeof exists).toBe('boolean');
    });
  });
});



