import { generateReportData, generateCSVReport, generateJSONReport, generateTextReport } from '../reportUtils';
import { Employee } from '@/types/employee';

describe('reportUtils', () => {
  const mockEmployees: Employee[] = [
    {
      id: '1',
      employee_number: 'EMP001',
      name: '홍길동',
      email: 'hong@example.com',
      department: '개발팀',
      position: '시니어 개발자',
      status: 'active',
    },
    {
      id: '2',
      employee_number: 'EMP002',
      name: '김철수',
      email: 'kim@example.com',
      department: '마케팅팀',
      position: '마케터',
      status: 'active',
    },
  ];

  const mockStats = {
    totalEmployees: 2,
    activeEmployees: 2,
    inactiveEmployees: 0,
    resignedEmployees: 0,
    departmentDistribution: { '개발팀': 1, '마케팅팀': 1 },
    rankDistribution: { '시니어 개발자': 1, '마케터': 1 },
    recentHires: 0,
    recentResignations: 0,
  };

  describe('generateReportData', () => {
    it('should generate report data with correct structure', () => {
      const reportData = generateReportData(mockEmployees, mockStats);

      expect(reportData).toHaveProperty('generatedAt');
      expect(reportData).toHaveProperty('summary');
      expect(reportData).toHaveProperty('departmentDistribution');
      expect(reportData).toHaveProperty('rankDistribution');
      expect(reportData).toHaveProperty('employees');
      expect(reportData.summary.totalEmployees).toBe(2);
      expect(reportData.employees).toHaveLength(2);
    });

    it('should include generatedAt timestamp', () => {
      const reportData = generateReportData(mockEmployees, mockStats);
      const timestamp = new Date(reportData.generatedAt);

      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('generateCSVReport', () => {
    it('should generate CSV report with correct format', () => {
      const reportData = generateReportData(mockEmployees, mockStats);
      const csv = generateCSVReport(reportData);

      expect(csv).toContain('이름');
      expect(csv).toContain('사원번호');
      expect(csv).toContain('이메일');
      expect(csv).toContain('부서');
      expect(csv).toContain('홍길동');
      expect(csv).toContain('EMP001');
    });

    it('should handle empty employees array', () => {
      const emptyReportData = generateReportData([], {
        ...mockStats,
        totalEmployees: 0,
        activeEmployees: 0,
      });
      const csv = generateCSVReport(emptyReportData);

      expect(csv).toContain('이름');
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('generateJSONReport', () => {
    it('should generate valid JSON report', () => {
      const reportData = generateReportData(mockEmployees, mockStats);
      const json = generateJSONReport(reportData);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('generatedAt');
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('employees');
    });
  });

  describe('generateTextReport', () => {
    it('should generate text report with summary', () => {
      const reportData = generateReportData(mockEmployees, mockStats);
      const text = generateTextReport(reportData);

      expect(text).toContain('인사관리 시스템 리포트');
      expect(text).toContain('전체 직원');
      expect(text).toContain('2');
    });

    it('should include department distribution', () => {
      const reportData = generateReportData(mockEmployees, mockStats);
      const text = generateTextReport(reportData);

      expect(text).toContain('부서별 분포');
    });
  });
});


