import { Employee, Certification } from '@/types/employee';

export type NotificationType = 'certification_expiring' | 'certification_expired' | 'contract_renewal' | 'birthday';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  relatedData?: {
    certificationName?: string;
    expiryDate?: string;
    daysUntilExpiry?: number;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  read: boolean;
}

/**
 * 생일 알림 체크 및 생성
 */
export function checkBirthdayNotifications(employees: Employee[]): Notification[] {
  const notifications: Notification[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  employees.forEach(employee => {
    if (!employee.birth_date) {
      return; // 생일이 없으면 스킵
    }

    if (employee.status === 'resigned') {
      return; // 퇴사자는 제외
    }

    try {
      const birthDate = new Date(employee.birth_date);
      const birthMonth = birthDate.getMonth();
      const birthDay = birthDate.getDate();

      // 오늘이 생일인 경우
      if (birthMonth === todayMonth && birthDay === todayDate) {
        notifications.push({
          id: `${employee.id}-birthday-today`,
          type: 'birthday',
          title: '🎉 생일 축하',
          message: `오늘은 ${employee.name}님의 생일입니다!`,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeNumber: employee.employee_number,
          relatedData: {
            expiryDate: employee.birth_date,
          },
          priority: 'medium',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
      // 7일 후 생일인 경우
      else {
        const nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntilBirthday = Math.floor((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilBirthday === 7) {
          notifications.push({
            id: `${employee.id}-birthday-7days`,
            type: 'birthday',
            title: '생일 임박 (7일 후)',
            message: `${employee.name}님의 생일이 7일 후입니다.`,
            employeeId: employee.id,
            employeeName: employee.name,
            employeeNumber: employee.employee_number,
            relatedData: {
              expiryDate: employee.birth_date,
              daysUntilExpiry: daysUntilBirthday,
            },
            priority: 'low',
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing birthday for employee ${employee.id}:`, error);
    }
  });

  return notifications;
}

/**
 * 자격증 만료일 체크 및 알림 생성
 */
export function checkCertificationExpiry(employees: Employee[]): Notification[] {
  const notifications: Notification[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  employees.forEach(employee => {
    if (!employee.certifications || employee.certifications.length === 0) {
      return;
    }

    if (employee.status === 'resigned') {
      return; // 퇴사자는 제외
    }

    employee.certifications.forEach((cert: Certification, index: number) => {
      if (!cert.expiry_date) {
        return; // 만료일이 없으면 스킵
      }

      const expiryDate = new Date(cert.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 이미 만료된 경우
      if (daysUntilExpiry < 0) {
        notifications.push({
          id: `${employee.id}-cert-${index}-expired`,
          type: 'certification_expired',
          title: '자격증 만료',
          message: `${employee.name}님의 "${cert.name}" 자격증이 ${Math.abs(daysUntilExpiry)}일 전에 만료되었습니다.`,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeNumber: employee.employee_number,
          relatedData: {
            certificationName: cert.name,
            expiryDate: cert.expiry_date,
            daysUntilExpiry: daysUntilExpiry,
          },
          priority: 'urgent',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
      // 7일 이내 만료 예정
      else if (daysUntilExpiry <= 7) {
        notifications.push({
          id: `${employee.id}-cert-${index}-expiring-7`,
          type: 'certification_expiring',
          title: '자격증 만료 임박 (7일 이내)',
          message: `${employee.name}님의 "${cert.name}" 자격증이 ${daysUntilExpiry}일 후 만료됩니다.`,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeNumber: employee.employee_number,
          relatedData: {
            certificationName: cert.name,
            expiryDate: cert.expiry_date,
            daysUntilExpiry: daysUntilExpiry,
          },
          priority: 'high',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
      // 30일 이내 만료 예정
      else if (daysUntilExpiry <= 30) {
        notifications.push({
          id: `${employee.id}-cert-${index}-expiring-30`,
          type: 'certification_expiring',
          title: '자격증 만료 임박 (30일 이내)',
          message: `${employee.name}님의 "${cert.name}" 자격증이 ${daysUntilExpiry}일 후 만료됩니다.`,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeNumber: employee.employee_number,
          relatedData: {
            certificationName: cert.name,
            expiryDate: cert.expiry_date,
            daysUntilExpiry: daysUntilExpiry,
          },
          priority: 'medium',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    });
  });

  // 우선순위 및 날짜순 정렬
  return notifications.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * 계약 갱신 알림 체크 및 생성
 */
export function checkContractRenewalNotifications(employees: Employee[]): Notification[] {
  const notifications: Notification[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  employees.forEach(employee => {
    if (!employee.contract_renewal_date && !employee.contract_end_date) {
      return; // 계약 갱신일과 종료일이 모두 없으면 스킵
    }

    if (employee.status === 'resigned') {
      return; // 퇴사자는 제외
    }

    // 계약 갱신일이 있으면 그것을 사용, 없으면 계약 종료일 사용
    const renewalDate = employee.contract_renewal_date || employee.contract_end_date;
    if (!renewalDate) return;

    try {
      const renewal = new Date(renewalDate);
      renewal.setHours(0, 0, 0, 0);

      const daysUntilRenewal = Math.floor((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 이미 지난 경우
      if (daysUntilRenewal < 0) {
        notifications.push({
          id: `${employee.id}-contract-expired`,
          type: 'contract_renewal',
          title: '계약 만료',
          message: `${employee.name}님의 계약이 ${Math.abs(daysUntilRenewal)}일 전에 만료되었습니다.`,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeNumber: employee.employee_number,
          relatedData: {
            expiryDate: renewalDate,
            daysUntilExpiry: daysUntilRenewal,
          },
          priority: 'urgent',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
      // 7일 이내 갱신 예정
      else if (daysUntilRenewal <= 7) {
        notifications.push({
          id: `${employee.id}-contract-renewal-7`,
          type: 'contract_renewal',
          title: '계약 갱신 임박 (7일 이내)',
          message: `${employee.name}님의 계약이 ${daysUntilRenewal}일 후 갱신 예정입니다.`,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeNumber: employee.employee_number,
          relatedData: {
            expiryDate: renewalDate,
            daysUntilExpiry: daysUntilRenewal,
          },
          priority: 'high',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
      // 30일 이내 갱신 예정
      else if (daysUntilRenewal <= 30) {
        notifications.push({
          id: `${employee.id}-contract-renewal-30`,
          type: 'contract_renewal',
          title: '계약 갱신 임박 (30일 이내)',
          message: `${employee.name}님의 계약이 ${daysUntilRenewal}일 후 갱신 예정입니다.`,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeNumber: employee.employee_number,
          relatedData: {
            expiryDate: renewalDate,
            daysUntilExpiry: daysUntilRenewal,
          },
          priority: 'medium',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    } catch (error) {
      console.error(`Error processing contract renewal for employee ${employee.id}:`, error);
    }
  });

  return notifications.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * 모든 알림 체크 (자격증 + 생일 + 계약 갱신)
 */
export function checkAllNotifications(employees: Employee[]): Notification[] {
  const certificationNotifications = checkCertificationExpiry(employees);
  const birthdayNotifications = checkBirthdayNotifications(employees);
  const contractNotifications = checkContractRenewalNotifications(employees);
  
  return [...certificationNotifications, ...birthdayNotifications, ...contractNotifications].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * 알림을 localStorage에 저장
 */
export function saveNotificationsToLocalStorage(notifications: Notification[]): void {
  try {
    localStorage.setItem('employee_notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications to localStorage:', error);
  }
}

/**
 * localStorage에서 알림 불러오기
 */
export function loadNotificationsFromLocalStorage(): Notification[] {
  try {
    const stored = localStorage.getItem('employee_notifications');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error);
    return [];
  }
}

/**
 * 알림 읽음 처리
 */
export function markNotificationAsRead(notificationId: string): void {
  const notifications = loadNotificationsFromLocalStorage();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotificationsToLocalStorage(updated);
}

/**
 * 모든 알림 읽음 처리
 */
export function markAllNotificationsAsRead(): void {
  const notifications = loadNotificationsFromLocalStorage();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotificationsToLocalStorage(updated);
}

/**
 * 알림 삭제
 */
export function deleteNotification(notificationId: string): void {
  const notifications = loadNotificationsFromLocalStorage();
  const updated = notifications.filter(n => n.id !== notificationId);
  saveNotificationsToLocalStorage(updated);
}

/**
 * 읽지 않은 알림 개수 가져오기
 */
export function getUnreadNotificationCount(): number {
  const notifications = loadNotificationsFromLocalStorage();
  return notifications.filter(n => !n.read).length;
}

