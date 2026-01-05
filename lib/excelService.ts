import * as XLSX from 'xlsx';
import { Employee, NewEmployee } from '@/types/employee';
import { employeeService } from './supabaseClient';

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
  importedEmployees: Employee[];
}

/**
 * 엑셀 파일 파싱
 */
export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 첫 번째 시트 사용
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        resolve(jsonData);
      } catch (error) {
        reject(new Error(`엑셀 파일 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 엑셀 데이터를 Employee 형식으로 변환
 */
function mapExcelRowToEmployee(row: any, rowIndex: number): { employee: Partial<NewEmployee> | null; error: string | null } {
  try {
    // 필수 필드 검증
    if (!row['이름'] && !row['name']) {
      return { employee: null, error: '이름이 없습니다' };
    }
    if (!row['이메일'] && !row['email']) {
      return { employee: null, error: '이메일이 없습니다' };
    }
    if (!row['부서'] && !row['department']) {
      return { employee: null, error: '부서가 없습니다' };
    }
    if (!row['직급'] && !row['rank']) {
      return { employee: null, error: '직급이 없습니다' };
    }
    if (!row['직책'] && !row['position']) {
      return { employee: null, error: '직책이 없습니다' };
    }
    if (!row['입사일'] && !row['hire_date']) {
      return { employee: null, error: '입사일이 없습니다' };
    }

    // 급여 파싱
    let salary = 0;
    const salaryStr = row['급여'] || row['salary'] || row['current_salary'] || '0';
    if (salaryStr) {
      const parsed = parseFloat(String(salaryStr).replace(/,/g, ''));
      if (!isNaN(parsed)) {
        salary = parsed;
      }
    }

    // 날짜 형식 변환 (YYYY-MM-DD)
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return '';
      // Excel 날짜 번호인 경우
      if (typeof dateStr === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dateStr * 86400000);
        return date.toISOString().split('T')[0];
      }
      // 문자열 날짜인 경우
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return dateStr;
    };

    const employee: Partial<NewEmployee> = {
      employee_number: row['사원번호'] || row['employee_number'] || undefined,
      name: row['이름'] || row['name'] || '',
      email: (row['이메일'] || row['email'] || '').toLowerCase(),
      phone: row['전화번호'] || row['phone'] || undefined,
      company: row['회사'] || row['company'] || '',
      department: row['부서'] || row['department'] || '',
      team: row['팀'] || row['team'] || undefined,
      position: row['직책'] || row['position'] || '',
      rank: row['직급'] || row['rank'] || '',
      hire_date: formatDate(row['입사일'] || row['hire_date'] || ''),
      resignation_date: row['퇴사일'] || row['resignation_date'] ? formatDate(row['퇴사일'] || row['resignation_date']) : undefined,
      current_salary: salary,
      salary_type: (row['급여타입'] || row['salary_type'] || 'annual') as 'annual' | 'hourly',
      resident_number: row['주민등록번호'] || row['resident_number'] || undefined,
      address: row['주소'] || row['address'] || undefined,
      birth_date: row['생년월일'] || row['birth_date'] ? formatDate(row['생년월일'] || row['birth_date']) : undefined,
      education_level: row['학력'] || row['education_level'] || undefined,
      education_school: row['학교'] || row['education_school'] || undefined,
      education_major: row['전공'] || row['education_major'] || undefined,
      education_graduation_year: row['졸업년도'] || row['education_graduation_year'] ? parseInt(row['졸업년도'] || row['education_graduation_year']) : undefined,
      status: row['상태'] || row['status'] || 'active',
      notes: row['메모'] || row['notes'] || undefined,
    };

    return { employee: employee as Partial<NewEmployee>, error: null };
  } catch (error) {
    return { 
      employee: null, 
      error: `데이터 변환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    };
  }
}

/**
 * 엑셀 데이터 임포트
 */
export async function importEmployeesFromExcel(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    importedEmployees: [],
  };

  try {
    // 엑셀 파일 파싱
    const excelData = await parseExcelFile(file);
    
    if (excelData.length === 0) {
      result.errors.push({
        row: 0,
        message: '엑셀 파일에 데이터가 없습니다.',
      });
      return result;
    }

    // 각 행을 Employee로 변환하고 임포트
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      const rowNumber = i + 2; // 엑셀 행 번호 (헤더 제외, 1-based)
      
      const { employee, error } = mapExcelRowToEmployee(row, rowNumber);
      
      if (error || !employee) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          message: error || '데이터 변환 실패',
          data: row,
        });
        continue;
      }

      try {
        // 필수 필드 검증
        if (!employee.name || !employee.email || !employee.department || !employee.rank || !employee.position || !employee.hire_date) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            message: '필수 필드가 누락되었습니다.',
            data: employee,
          });
          continue;
        }

        // 중복 체크 (이메일)
        const emailExists = await employeeService.checkEmailExists(employee.email);
        if (emailExists) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            message: `이메일 중복: ${employee.email}`,
            data: employee,
          });
          continue;
        }

        // 사원번호 중복 체크 (있는 경우)
        if (employee.employee_number) {
          const empNumExists = await employeeService.checkEmployeeNumberExists(employee.employee_number);
          if (empNumExists) {
            result.failed++;
            result.errors.push({
              row: rowNumber,
              message: `사원번호 중복: ${employee.employee_number}`,
              data: employee,
            });
            continue;
          }
        }

        // 직원 생성
        const createdEmployee = await employeeService.create(employee as NewEmployee);
        result.success++;
        result.importedEmployees.push(createdEmployee);
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          message: error.message || '직원 생성 실패',
          data: employee,
        });
      }
    }

    return result;
  } catch (error: any) {
    result.errors.push({
      row: 0,
      message: error.message || '엑셀 파일 처리 실패',
    });
    return result;
  }
}

/**
 * 직원 목록을 엑셀 형식으로 익스포트
 */
export function exportEmployeesToExcel(employees: Employee[]): void {
  // 엑셀 데이터 준비
  const excelData = employees.map(emp => ({
    '사원번호': emp.employee_number || '',
    '이름': emp.name,
    '이메일': emp.email,
    '전화번호': emp.phone || '',
    '회사': emp.company || '',
    '부서': emp.department,
    '팀': emp.team || '',
    '직급': emp.rank,
    '직책': emp.position,
    '입사일': emp.hire_date,
    '퇴사일': emp.resignation_date || '',
    '상태': emp.status,
    '급여': emp.current_salary,
    '급여타입': emp.salary_type === 'hourly' ? '시급' : '연봉',
    '주민등록번호': emp.resident_number || '',
    '주소': emp.address || '',
    '생년월일': emp.birth_date || '',
    '학력': emp.education_level || '',
    '학교': emp.education_school || '',
    '전공': emp.education_major || '',
    '졸업년도': emp.education_graduation_year || '',
    '메모': emp.notes || '',
  }));

  // 워크북 생성
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '직원 목록');

  // 파일 다운로드
  const fileName = `employee-list-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * 엑셀 임포트 템플릿 생성
 */
export function generateExcelTemplate(): void {
  const templateData = [{
    '사원번호': 'EMP001',
    '이름': '홍길동',
    '이메일': 'hong@example.com',
    '전화번호': '010-1234-5678',
    '회사': '회사명',
    '부서': '개발팀',
    '팀': '백엔드팀',
    '직급': '대리',
    '직책': '소프트웨어 엔지니어',
    '입사일': '2024-01-01',
    '퇴사일': '',
    '상태': 'active',
    '급여': '50000000',
    '급여타입': '연봉',
    '주민등록번호': '',
    '주소': '',
    '생년월일': '1990-01-01',
    '학력': '대졸',
    '학교': '서울대학교',
    '전공': '컴퓨터공학',
    '졸업년도': '2015',
    '메모': '',
  }];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '직원 목록');

  XLSX.writeFile(workbook, 'employee-import-template.xlsx');
}


