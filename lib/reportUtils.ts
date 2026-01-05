import { Employee } from '@/types/employee';

export interface ReportData {
  generatedAt: string;
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    resignedEmployees: number;
    recentHires: number;
    recentResignations: number;
  };
  departmentDistribution: Record<string, number>;
  rankDistribution: Record<string, number>;
  employees: Employee[];
}

/**
 * 리포트 데이터 생성
 */
export function generateReportData(
  employees: Employee[],
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    resignedEmployees: number;
    departmentDistribution: Record<string, number>;
    rankDistribution: Record<string, number>;
    recentHires: number;
    recentResignations: number;
  }
): ReportData {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalEmployees: stats.totalEmployees,
      activeEmployees: stats.activeEmployees,
      inactiveEmployees: stats.inactiveEmployees,
      resignedEmployees: stats.resignedEmployees,
      recentHires: stats.recentHires,
      recentResignations: stats.recentResignations,
    },
    departmentDistribution: stats.departmentDistribution,
    rankDistribution: stats.rankDistribution,
    employees: employees,
  };
}

/**
 * CSV 형식으로 리포트 다운로드
 */
export function downloadReportAsCSV(reportData: ReportData) {
  const headers = [
    '사원번호',
    '이름',
    '이메일',
    '전화번호',
    '부서',
    '직급',
    '직책',
    '입사일',
    '상태',
    '퇴사일',
    '현재 급여',
    '학력',
    '학교',
    '전공',
    '졸업년도',
  ];

  const rows = reportData.employees.map(emp => [
    emp.employee_number || '',
    emp.name || '',
    emp.email || '',
    emp.phone || '',
    emp.department || '',
    emp.rank || '',
    emp.position || '',
    emp.hire_date || '',
    emp.status || '',
    emp.resignation_date || '',
    emp.current_salary?.toString() || '',
    emp.education_level || '',
    emp.education_school || '',
    emp.education_major || '',
    emp.education_graduation_year?.toString() || '',
  ]);

  // CSV 형식으로 변환 (BOM 추가로 한글 깨짐 방지)
  const csvContent = [
    '\uFEFF' + headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Blob 생성 및 다운로드
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `employee-report-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * JSON 형식으로 리포트 다운로드
 */
export function downloadReportAsJSON(reportData: ReportData) {
  const jsonContent = JSON.stringify(reportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `employee-report-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 텍스트 형식으로 리포트 다운로드
 */
export function downloadReportAsText(reportData: ReportData) {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('인사관리 시스템 리포트');
  lines.push('='.repeat(60));
  lines.push(`생성일시: ${new Date(reportData.generatedAt).toLocaleString('ko-KR')}`);
  lines.push('');
  
  lines.push('📊 요약 통계');
  lines.push('-'.repeat(60));
  lines.push(`전체 직원: ${reportData.summary.totalEmployees}명`);
  lines.push(`재직 중: ${reportData.summary.activeEmployees}명`);
  lines.push(`휴직 중: ${reportData.summary.inactiveEmployees}명`);
  lines.push(`퇴사자: ${reportData.summary.resignedEmployees}명`);
  lines.push(`최근 30일 입사: ${reportData.summary.recentHires}명`);
  lines.push(`최근 30일 퇴사: ${reportData.summary.recentResignations}명`);
  lines.push('');
  
  lines.push('🏢 부서별 분포');
  lines.push('-'.repeat(60));
  Object.entries(reportData.departmentDistribution)
    .sort(([, a], [, b]) => b - a)
    .forEach(([dept, count]) => {
      lines.push(`${dept}: ${count}명`);
    });
  lines.push('');
  
  lines.push('👔 직급별 분포');
  lines.push('-'.repeat(60));
  Object.entries(reportData.rankDistribution)
    .sort(([, a], [, b]) => b - a)
    .forEach(([rank, count]) => {
      lines.push(`${rank}: ${count}명`);
    });
  lines.push('');
  
  lines.push('👥 직원 목록');
  lines.push('-'.repeat(60));
  reportData.employees.forEach((emp, index) => {
    lines.push(`${index + 1}. ${emp.name} (${emp.employee_number})`);
    lines.push(`   부서: ${emp.department || '-'} | 직급: ${emp.rank || '-'} | 상태: ${emp.status || '-'}`);
    if (emp.email) lines.push(`   이메일: ${emp.email}`);
    if (emp.phone) lines.push(`   전화: ${emp.phone}`);
    lines.push('');
  });
  
  const textContent = lines.join('\n');
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `employee-report-${new Date().toISOString().split('T')[0]}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * CSV 리포트 생성 (테스트용 - 문자열 반환)
 */
export function generateCSVReport(reportData: ReportData): string {
  const headers = [
    '사원번호',
    '이름',
    '이메일',
    '전화번호',
    '부서',
    '직급',
    '직책',
    '입사일',
    '상태',
    '퇴사일',
    '현재 급여',
    '학력',
    '학교',
    '전공',
    '졸업년도',
  ];

  const rows = reportData.employees.map(emp => [
    emp.employee_number || '',
    emp.name || '',
    emp.email || '',
    emp.phone || '',
    emp.department || '',
    emp.rank || '',
    emp.position || '',
    emp.hire_date || '',
    emp.status || '',
    emp.resignation_date || '',
    emp.current_salary?.toString() || '',
    emp.education_level || '',
    emp.education_school || '',
    emp.education_major || '',
    emp.education_graduation_year?.toString() || '',
  ]);

  const csvContent = [
    '\uFEFF' + headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * JSON 리포트 생성 (테스트용 - 문자열 반환)
 */
export function generateJSONReport(reportData: ReportData): string {
  return JSON.stringify(reportData, null, 2);
}

/**
 * 텍스트 리포트 생성 (테스트용 - 문자열 반환)
 */
export function generateTextReport(reportData: ReportData): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('인사관리 시스템 리포트');
  lines.push('='.repeat(60));
  lines.push(`생성일시: ${new Date(reportData.generatedAt).toLocaleString('ko-KR')}`);
  lines.push('');
  
  lines.push('📊 요약 통계');
  lines.push('-'.repeat(60));
  lines.push(`전체 직원: ${reportData.summary.totalEmployees}명`);
  lines.push(`재직 중: ${reportData.summary.activeEmployees}명`);
  lines.push(`휴직 중: ${reportData.summary.inactiveEmployees}명`);
  lines.push(`퇴사자: ${reportData.summary.resignedEmployees}명`);
  lines.push(`최근 30일 입사: ${reportData.summary.recentHires}명`);
  lines.push(`최근 30일 퇴사: ${reportData.summary.recentResignations}명`);
  lines.push('');
  
  lines.push('🏢 부서별 분포');
  lines.push('-'.repeat(60));
  Object.entries(reportData.departmentDistribution)
    .sort(([, a], [, b]) => b - a)
    .forEach(([dept, count]) => {
      lines.push(`${dept}: ${count}명`);
    });
  lines.push('');
  
  lines.push('👔 직급별 분포');
  lines.push('-'.repeat(60));
  Object.entries(reportData.rankDistribution)
    .sort(([, a], [, b]) => b - a)
    .forEach(([rank, count]) => {
      lines.push(`${rank}: ${count}명`);
    });
  lines.push('');
  
  lines.push('👥 직원 목록');
  lines.push('-'.repeat(60));
  reportData.employees.forEach((emp, index) => {
    lines.push(`${index + 1}. ${emp.name} (${emp.employee_number})`);
    lines.push(`   부서: ${emp.department || '-'} | 직급: ${emp.rank || '-'} | 상태: ${emp.status || '-'}`);
    if (emp.email) lines.push(`   이메일: ${emp.email}`);
    if (emp.phone) lines.push(`   전화: ${emp.phone}`);
    lines.push('');
  });
  
  return lines.join('\n');
}
