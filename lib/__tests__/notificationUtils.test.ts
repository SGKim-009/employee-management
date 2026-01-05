import { checkBirthdayNotifications, checkContractRenewalNotifications } from '../notificationUtils';
import { Employee } from '@/types/employee';

describe('notificationUtils', () => {
  describe('checkBirthdayNotifications', () => {
    it('should return empty array when no employees have birthdays', () => {
      const employees: Employee[] = [
        {
          id: '1',
          employee_number: 'EMP001',
          name: '홍길동',
          email: 'hong@example.com',
          position: '개발자',
          rank: '사원',
          company: '테스트 회사',
          department: '개발팀',
          hire_date: '2024-01-01',
          current_salary: 3000000,
          status: 'active',
        },
      ];

      const notifications = checkBirthdayNotifications(employees);
      expect(notifications).toHaveLength(0);
    });

    it('should return notification for employee with birthday today', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      birthDate.setFullYear(1990); // Set year to 1990

      const employees: Employee[] = [
        {
          id: '1',
          employee_number: 'EMP001',
          name: '홍길동',
          email: 'hong@example.com',
          position: '개발자',
          rank: '사원',
          company: '테스트 회사',
          department: '개발팀',
          hire_date: '2024-01-01',
          current_salary: 3000000,
          status: 'active',
          birth_date: birthDate.toISOString().split('T')[0],
        },
      ];

      const notifications = checkBirthdayNotifications(employees);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].type).toBe('birthday');
      expect(notifications[0].employeeName).toBe('홍길동');
    });

    it('should exclude resigned employees', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      birthDate.setFullYear(1990);

      const employees: Employee[] = [
        {
          id: '1',
          employee_number: 'EMP001',
          name: '홍길동',
          email: 'hong@example.com',
          position: '개발자',
          rank: '사원',
          company: '테스트 회사',
          department: '개발팀',
          hire_date: '2024-01-01',
          current_salary: 3000000,
          status: 'resigned',
          birth_date: birthDate.toISOString().split('T')[0],
        },
      ];

      const notifications = checkBirthdayNotifications(employees);
      expect(notifications).toHaveLength(0);
    });
  });

  describe('checkContractRenewalNotifications', () => {
    it('should return empty array when no contracts are expiring', () => {
      const employees: Employee[] = [
        {
          id: '1',
          employee_number: 'EMP001',
          name: '홍길동',
          email: 'hong@example.com',
          position: '개발자',
          rank: '사원',
          company: '테스트 회사',
          department: '개발팀',
          hire_date: '2024-01-01',
          current_salary: 3000000,
          status: 'active',
        },
      ];

      const notifications = checkContractRenewalNotifications(employees);
      expect(notifications).toHaveLength(0);
    });

    it('should return notification for contract expiring soon', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

      const employees: Employee[] = [
        {
          id: '1',
          employee_number: 'EMP001',
          name: '홍길동',
          email: 'hong@example.com',
          position: '개발자',
          rank: '사원',
          company: '테스트 회사',
          department: '개발팀',
          hire_date: '2024-01-01',
          current_salary: 3000000,
          status: 'active',
          contract_end_date: futureDate.toISOString().split('T')[0],
        },
      ];

      const notifications = checkContractRenewalNotifications(employees);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].type).toBe('contract_renewal');
    });

    it('should exclude resigned employees', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const employees: Employee[] = [
        {
          id: '1',
          employee_number: 'EMP001',
          name: '홍길동',
          email: 'hong@example.com',
          position: '개발자',
          rank: '사원',
          company: '테스트 회사',
          department: '개발팀',
          hire_date: '2024-01-01',
          current_salary: 3000000,
          status: 'resigned',
          contract_end_date: futureDate.toISOString().split('T')[0],
        },
      ];

      const notifications = checkContractRenewalNotifications(employees);
      expect(notifications).toHaveLength(0);
    });
  });
});


