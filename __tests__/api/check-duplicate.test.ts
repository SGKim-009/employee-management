/**
 * API 통합 테스트: /api/employees/check-duplicate
 */

// Next.js 환경 설정
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(public url: string, public init?: any) {}
    async json() {
      return JSON.parse(this.init?.body || '{}');
    }
  } as any;
}

describe('API: /api/employees/check-duplicate', () => {
  const API_URL = '/api/employees/check-duplicate';

  // Mock Next.js request/response
  const createMockRequest = (body: any) => {
    return new Request('http://localhost/api/employees/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/employees/check-duplicate', () => {
    it('should return 400 if field is missing', async () => {
      // Mock employeeService
      jest.doMock('@/lib/supabaseClient', () => ({
        employeeService: {
          checkEmployeeNumberExists: jest.fn(),
          checkEmailExists: jest.fn(),
        },
      }));

      const { POST } = await import('@/app/api/employees/check-duplicate/route');
      const request = createMockRequest({ value: 'test@example.com' });

      const result = await POST(request as any);
      const data = await result.json();

      expect(result.status).toBe(400);
      expect(data.error).toContain('필드와 값이 필요합니다');
    });

    it('should return 400 if value is missing', async () => {
      jest.doMock('@/lib/supabaseClient', () => ({
        employeeService: {
          checkEmployeeNumberExists: jest.fn(),
          checkEmailExists: jest.fn(),
        },
      }));

      const { POST } = await import('@/app/api/employees/check-duplicate/route');
      const request = createMockRequest({ field: 'email' });

      const result = await POST(request as any);
      const data = await result.json();

      expect(result.status).toBe(400);
      expect(data.error).toContain('필드와 값이 필요합니다');
    });

    it('should return 400 for unsupported field', async () => {
      jest.doMock('@/lib/supabaseClient', () => ({
        employeeService: {
          checkEmployeeNumberExists: jest.fn(),
          checkEmailExists: jest.fn(),
        },
      }));

      const { POST } = await import('@/app/api/employees/check-duplicate/route');
      const request = createMockRequest({ field: 'invalid_field', value: 'test' });

      const result = await POST(request as any);
      const data = await result.json();

      expect(result.status).toBe(400);
      expect(data.error).toContain('지원하지 않는 필드');
    });

    it('should handle employee_number check', async () => {
      // Mock employeeService
      const mockCheckEmployeeNumberExists = jest.fn().mockResolvedValue(false);
      jest.doMock('@/lib/supabaseClient', () => ({
        employeeService: {
          checkEmployeeNumberExists: mockCheckEmployeeNumberExists,
        },
      }));

      const { POST } = await import('@/app/api/employees/check-duplicate/route');
      const request = createMockRequest({ 
        field: 'employee_number', 
        value: 'EMP001' 
      });

      const result = await POST(request as any);
      const data = await result.json();

      expect(result.status).toBe(200);
      expect(data).toHaveProperty('exists');
    });

    it('should handle email check', async () => {
      // Mock employeeService
      const mockCheckEmailExists = jest.fn().mockResolvedValue(true);
      jest.doMock('@/lib/supabaseClient', () => ({
        employeeService: {
          checkEmailExists: mockCheckEmailExists,
        },
      }));

      const { POST } = await import('@/app/api/employees/check-duplicate/route');
      const request = createMockRequest({ 
        field: 'email', 
        value: 'test@example.com' 
      });

      const result = await POST(request as any);
      const data = await result.json();

      expect(result.status).toBe(200);
      expect(data).toHaveProperty('exists');
    });

    it('should handle errors gracefully', async () => {
      // Mock error
      jest.doMock('@/lib/supabaseClient', () => ({
        employeeService: {
          checkEmployeeNumberExists: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const { POST } = await import('@/app/api/employees/check-duplicate/route');
      const request = createMockRequest({ 
        field: 'employee_number', 
        value: 'EMP001' 
      });

      const result = await POST(request as any);
      const data = await result.json();

      expect(result.status).toBe(500);
      expect(data.error).toContain('오류가 발생했습니다');
    });
  });
});

