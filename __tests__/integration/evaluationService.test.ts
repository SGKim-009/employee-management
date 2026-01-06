/**
 * 통합 테스트: evaluationService
 * 
 * 주의: 실제 Supabase 연결이 필요한 테스트입니다.
 * 환경 변수가 설정되어 있어야 합니다.
 */

import { evaluationService } from '@/lib/evaluationService';
import { EvaluationFormData } from '@/types/evaluation';
import { employeeService } from '@/lib/supabaseClient';

const shouldRunIntegrationTests = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

describe('Integration: evaluationService', () => {
  let testEmployeeId: string;
  let testCriteriaId: string;
  let testEvaluationId: string;

  beforeAll(async () => {
    if (!shouldRunIntegrationTests()) {
      console.warn('통합 테스트를 건너뜁니다. 환경 변수가 설정되지 않았습니다.');
      return;
    }

    // 테스트용 직원 생성
    try {
      const employees = await employeeService.getAll(1, 1);
      if (employees.data.length > 0) {
        testEmployeeId = employees.data[0].id;
      }
    } catch (error) {
      console.warn('테스트용 직원을 찾을 수 없습니다.');
    }

    // 테스트용 평가 항목 생성
    try {
      const criteria = await evaluationService.getCriteria();
      if (criteria.length > 0) {
        testCriteriaId = criteria[0].id;
      } else {
        // 평가 항목이 없으면 생성
        const newCriteria = await evaluationService.createCriteria({
          name: '테스트 평가 항목',
          description: '테스트용 평가 항목입니다',
          weight: 1.0,
          category: '업무',
          is_active: true
        });
        testCriteriaId = newCriteria.id;
      }
    } catch (error) {
      console.warn('테스트용 평가 항목을 생성할 수 없습니다.');
    }
  });

  describe('평가 생성 및 조회', () => {
    it.skip('should create a new evaluation', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId || !testCriteriaId) {
        return;
      }

      const formData: EvaluationFormData = {
        employee_id: testEmployeeId,
        evaluation_period: '2024-상반기',
        evaluation_date: new Date().toISOString().split('T')[0],
        overall_comment: '테스트 평가입니다',
        scores: [
          {
            criteria_id: testCriteriaId,
            score: 85,
            comment: '우수한 성과'
          }
        ]
      };

      const evaluation = await evaluationService.createEvaluation(formData);
      
      expect(evaluation).toBeDefined();
      expect(evaluation.employee_id).toBe(testEmployeeId);
      expect(evaluation.evaluation_period).toBe('2024-상반기');
      expect(evaluation.scores).toBeDefined();
      expect(evaluation.scores?.length).toBeGreaterThan(0);
      
      testEvaluationId = evaluation.id;
    });

    it.skip('should get evaluation by id', async () => {
      if (!shouldRunIntegrationTests() || !testEvaluationId) {
        return;
      }

      const evaluation = await evaluationService.getEvaluationById(testEvaluationId);
      
      expect(evaluation).toBeDefined();
      expect(evaluation.id).toBe(testEvaluationId);
      expect(evaluation.employee).toBeDefined();
      expect(evaluation.scores).toBeDefined();
    });

    it.skip('should get evaluations by employee', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const evaluations = await evaluationService.getEvaluationsByEmployee(testEmployeeId);
      
      expect(Array.isArray(evaluations)).toBe(true);
      if (evaluations.length > 0) {
        expect(evaluations[0].employee_id).toBe(testEmployeeId);
      }
    });

    it.skip('should update evaluation', async () => {
      if (!shouldRunIntegrationTests() || !testEvaluationId) {
        return;
      }

      const updates: Partial<EvaluationFormData> = {
        overall_comment: '수정된 평가 의견',
        scores: [
          {
            criteria_id: testCriteriaId,
            score: 90,
            comment: '수정된 점수'
          }
        ]
      };

      const updated = await evaluationService.updateEvaluation(testEvaluationId, updates);
      
      expect(updated.overall_comment).toBe('수정된 평가 의견');
      expect(updated.scores).toBeDefined();
    });

    it.skip('should update evaluation status', async () => {
      if (!shouldRunIntegrationTests() || !testEvaluationId) {
        return;
      }

      const updated = await evaluationService.updateEvaluationStatus(testEvaluationId, 'submitted');
      
      expect(updated.status).toBe('submitted');
    });
  });

  describe('평가 이력 관리', () => {
    it.skip('should get evaluation stats for employee', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const stats = await evaluationService.getEvaluationStats(testEmployeeId);
      
      expect(stats).toBeDefined();
      expect(stats.employee_id).toBe(testEmployeeId);
      expect(typeof stats.total_evaluations).toBe('number');
      expect(typeof stats.average_score).toBe('number');
      expect(Array.isArray(stats.scores_by_category)).toBe(true);
    });

    it.skip('should get all evaluations for employee with history', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const evaluations = await evaluationService.getEvaluationsByEmployee(testEmployeeId);
      
      expect(Array.isArray(evaluations)).toBe(true);
      
      // 평가 이력이 있는 경우 상세 정보 확인
      evaluations.forEach(evaluation => {
        expect(evaluation.id).toBeDefined();
        expect(evaluation.evaluation_date).toBeDefined();
        expect(evaluation.evaluation_period).toBeDefined();
        expect(evaluation.status).toBeDefined();
      });
    });

    it.skip('should delete evaluation', async () => {
      if (!shouldRunIntegrationTests() || !testEvaluationId) {
        return;
      }

      await expect(
        evaluationService.deleteEvaluation(testEvaluationId)
      ).resolves.not.toThrow();
    });
  });

  describe('평가 항목 관리', () => {
    it.skip('should get all criteria', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const criteria = await evaluationService.getCriteria();
      
      expect(Array.isArray(criteria)).toBe(true);
      if (criteria.length > 0) {
        expect(criteria[0]).toHaveProperty('id');
        expect(criteria[0]).toHaveProperty('name');
        expect(criteria[0]).toHaveProperty('weight');
      }
    });

    it.skip('should create criteria', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const newCriteria = await evaluationService.createCriteria({
        name: '새 평가 항목',
        description: '새로 생성된 평가 항목',
        weight: 1.5,
        category: '리더십',
        is_active: true
      });

      expect(newCriteria).toBeDefined();
      expect(newCriteria.name).toBe('새 평가 항목');
      expect(newCriteria.weight).toBe(1.5);
    });

    it.skip('should update criteria', async () => {
      if (!shouldRunIntegrationTests() || !testCriteriaId) {
        return;
      }

      const updated = await evaluationService.updateCriteria(testCriteriaId, {
        name: '수정된 평가 항목',
        weight: 2.0
      });

      expect(updated.name).toBe('수정된 평가 항목');
      expect(updated.weight).toBe(2.0);
    });
  });
});

