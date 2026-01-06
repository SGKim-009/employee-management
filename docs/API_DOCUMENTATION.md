# API 문서

인사관리 시스템의 API 엔드포인트 및 서비스 함수 문서입니다.

---

## 📋 목차

1. [개요](#개요)
2. [인증](#인증)
3. [API 엔드포인트](#api-엔드포인트)
4. [서비스 함수](#서비스-함수)
5. [에러 처리](#에러-처리)
6. [예시](#예시)

---

## 개요

이 시스템은 주로 Supabase를 백엔드로 사용하며, 일부 기능은 Next.js API Routes를 통해 제공됩니다.

### 기본 URL

- **로컬 개발**: `http://localhost:3000`
- **프로덕션**: 배포된 도메인 URL

### 데이터 형식

- **요청**: JSON
- **응답**: JSON

---

## 인증

대부분의 API는 Supabase 인증을 사용합니다. 요청 시 인증 토큰이 자동으로 포함됩니다.

### 인증 방법

1. Supabase 클라이언트가 자동으로 인증 토큰을 관리
2. RLS (Row Level Security) 정책에 따라 접근 제어
3. 역할 기반 접근 제어 (admin, hr, viewer)

---

## API 엔드포인트

### 1. 중복 확인 API

#### `POST /api/employees/check-duplicate`

사원번호 또는 이메일 중복을 확인합니다.

**요청 본문**:
```json
{
  "field": "employee_number" | "email",
  "value": "string",
  "excludeId": "string" (선택사항, 수정 시 현재 직원 ID 제외)
}
```

**응답**:
```json
{
  "exists": boolean
}
```

**상태 코드**:
- `200`: 성공
- `400`: 잘못된 요청 (필드 또는 값 누락, 지원하지 않는 필드)
- `500`: 서버 오류

**예시**:
```typescript
// 사원번호 중복 확인
const response = await fetch('/api/employees/check-duplicate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    field: 'employee_number',
    value: 'EMP001',
  }),
});

const data = await response.json();
console.log(data.exists); // true 또는 false
```

---

## 서비스 함수

### Employee Service

`lib/supabaseClient.ts`의 `employeeService` 객체를 통해 제공됩니다.

#### 1. `getAll()`

모든 직원을 조회합니다 (페이지네이션, 검색, 필터, 정렬 지원).

**시그니처**:
```typescript
async getAll(
  page: number = 1,
  pageSize: number = 9,
  searchTerm: string = '',
  includeResigned: boolean = false,
  filters?: {
    department?: string;
    rank?: string;
    status?: 'active' | 'inactive' | 'resigned';
    hireDateFrom?: string;
    hireDateTo?: string;
  },
  sortBy?: {
    field: 'name' | 'hire_date' | 'current_salary' | 'department' | 'created_at';
    order: 'asc' | 'desc';
  }
): Promise<{
  data: Employee[];
  count: number;
  totalPages: number;
  currentPage: number;
}>
```

**예시**:
```typescript
import { employeeService } from '@/lib/supabaseClient';

// 첫 페이지, 9개씩
const result = await employeeService.getAll(1, 9);

// 검색 포함
const result = await employeeService.getAll(1, 9, '홍길동');

// 필터 포함
const result = await employeeService.getAll(1, 9, '', false, {
  department: '개발팀',
  rank: '과장',
});

// 정렬 포함
const result = await employeeService.getAll(1, 9, '', false, {}, {
  field: 'hire_date',
  order: 'desc',
});
```

#### 2. `getById()`

ID로 직원을 조회합니다.

**시그니처**:
```typescript
async getById(id: string): Promise<Employee>
```

**예시**:
```typescript
const employee = await employeeService.getById('employee-id');
```

#### 3. `create()`

새 직원을 등록합니다.

**시그니처**:
```typescript
async create(
  employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>
): Promise<Employee>
```

**예시**:
```typescript
const newEmployee = await employeeService.create({
  employee_number: 'EMP001',
  name: '홍길동',
  email: 'hong@example.com',
  department: '개발팀',
  rank: '과장',
  position: '팀장',
  hire_date: '2024-01-01',
  status: 'active',
});
```

**에러**:
- `이미 사용 중인 사원번호입니다.`: 사원번호 중복
- `이미 사용 중인 이메일입니다.`: 이메일 중복

#### 4. `update()`

직원 정보를 수정합니다.

**시그니처**:
```typescript
async update(id: string, updates: Partial<Employee>): Promise<Employee>
```

**예시**:
```typescript
const updated = await employeeService.update('employee-id', {
  department: '마케팅팀',
  rank: '부장',
});
```

**에러**:
- `이미 사용 중인 사원번호입니다.`: 사원번호 중복
- `이미 사용 중인 이메일입니다.`: 이메일 중복

#### 5. `delete()`

직원을 삭제합니다.

**시그니처**:
```typescript
async delete(id: string): Promise<void>
```

**예시**:
```typescript
await employeeService.delete('employee-id');
```

**권한**: admin 역할만 가능

#### 6. `checkEmployeeNumberExists()`

사원번호 중복을 확인합니다.

**시그니처**:
```typescript
async checkEmployeeNumberExists(
  employeeNumber: string,
  excludeId?: string
): Promise<boolean>
```

**예시**:
```typescript
const exists = await employeeService.checkEmployeeNumberExists('EMP001');
```

#### 7. `checkEmailExists()`

이메일 중복을 확인합니다.

**시그니처**:
```typescript
async checkEmailExists(
  email: string,
  excludeId?: string
): Promise<boolean>
```

**예시**:
```typescript
const exists = await employeeService.checkEmailExists('hong@example.com');
```

---

### File Service

`lib/fileService.ts`에서 제공됩니다.

#### 1. `uploadEmployeeFile()`

직원 파일을 업로드합니다.

**시그니처**:
```typescript
async uploadEmployeeFile(
  employeeId: string,
  file: File,
  fileType: 'document' | 'resume' | 'contract' | 'other',
  description?: string,
  expiryDate?: string
): Promise<EmployeeFile>
```

**예시**:
```typescript
import { uploadEmployeeFile } from '@/lib/fileService';

const file = await uploadEmployeeFile(
  'employee-id',
  fileObject,
  'resume',
  '최신 이력서',
);
```

#### 2. `getEmployeeFiles()`

직원의 파일 목록을 조회합니다.

**시그니처**:
```typescript
async getEmployeeFiles(
  employeeId: string,
  fileType?: 'document' | 'resume' | 'contract' | 'other'
): Promise<EmployeeFile[]>
```

**예시**:
```typescript
// 모든 파일
const files = await getEmployeeFiles('employee-id');

// 이력서만
const resumes = await getEmployeeFiles('employee-id', 'resume');
```

#### 3. `downloadFile()`

파일을 다운로드합니다.

**시그니처**:
```typescript
async downloadFile(filePath: string): Promise<Blob>
```

**예시**:
```typescript
const blob = await downloadFile('path/to/file.pdf');
const url = URL.createObjectURL(blob);
```

#### 4. `deleteFile()`

파일을 삭제합니다.

**시그니처**:
```typescript
async deleteFile(fileId: string): Promise<void>
```

**예시**:
```typescript
await deleteFile('file-id');
```

#### 5. `setResumeAsLatestVersion()`

이력서를 최신 버전으로 설정합니다.

**시그니처**:
```typescript
async setResumeAsLatestVersion(fileId: string): Promise<void>
```

**예시**:
```typescript
await setResumeAsLatestVersion('file-id');
```

#### 6. `updateContractExpiryDate()`

계약서 만료일을 업데이트합니다.

**시그니처**:
```typescript
async updateContractExpiryDate(
  fileId: string,
  expiryDate: string
): Promise<void>
```

**예시**:
```typescript
await updateContractExpiryDate('file-id', '2025-12-31');
```

---

### Excel Service

`lib/excelService.ts`에서 제공됩니다.

#### 1. `parseExcelFile()`

엑셀 파일을 파싱합니다.

**시그니처**:
```typescript
function parseExcelFile(file: File): Promise<any[]>
```

**예시**:
```typescript
import { parseExcelFile } from '@/lib/excelService';

const rows = await parseExcelFile(file);
```

#### 2. `importEmployeesFromExcel()`

엑셀 파일에서 직원 데이터를 임포트합니다.

**시그니처**:
```typescript
async function importEmployeesFromExcel(
  file: File
): Promise<ImportResult>
```

**반환 타입**:
```typescript
interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
  importedEmployees: Employee[];
}
```

**예시**:
```typescript
import { importEmployeesFromExcel } from '@/lib/excelService';

const result = await importEmployeesFromExcel(file);
console.log(`성공: ${result.success}, 실패: ${result.failed}`);
```

#### 3. `exportEmployeesToExcel()`

직원 목록을 엑셀 파일로 익스포트합니다.

**시그니처**:
```typescript
function exportEmployeesToExcel(employees: Employee[]): void
```

**예시**:
```typescript
import { exportEmployeesToExcel } from '@/lib/excelService';

exportEmployeesToExcel(employees);
// 파일이 자동으로 다운로드됩니다
```

#### 4. `generateExcelTemplate()`

엑셀 임포트 템플릿을 생성합니다.

**시그니처**:
```typescript
function generateExcelTemplate(): void
```

**예시**:
```typescript
import { generateExcelTemplate } from '@/lib/excelService';

generateExcelTemplate();
// 템플릿 파일이 자동으로 다운로드됩니다
```

---

### Notification Service

`lib/notificationUtils.ts`에서 제공됩니다.

#### 1. `checkAllNotifications()`

모든 알림을 확인합니다 (자격증 만료, 생일, 계약 갱신).

**시그니처**:
```typescript
async function checkAllNotifications(): Promise<Notification[]>
```

**예시**:
```typescript
import { checkAllNotifications } from '@/lib/notificationUtils';

const notifications = await checkAllNotifications();
```

#### 2. `checkCertificationExpiryNotifications()`

자격증 만료 알림을 확인합니다.

**시그니처**:
```typescript
async function checkCertificationExpiryNotifications(): Promise<Notification[]>
```

#### 3. `checkBirthdayNotifications()`

생일 알림을 확인합니다.

**시그니처**:
```typescript
async function checkBirthdayNotifications(): Promise<Notification[]>
```

#### 4. `checkContractRenewalNotifications()`

계약 갱신 알림을 확인합니다.

**시그니처**:
```typescript
async function checkContractRenewalNotifications(): Promise<Notification[]>
```

---

### Report Service

`lib/reportUtils.ts`에서 제공됩니다.

#### 1. `generateCSVReport()`

CSV 리포트를 생성합니다.

**시그니처**:
```typescript
function generateCSVReport(employees: Employee[]): string
```

**예시**:
```typescript
import { generateCSVReport } from '@/lib/reportUtils';

const csv = generateCSVReport(employees);
// CSV 문자열 반환
```

#### 2. `generateJSONReport()`

JSON 리포트를 생성합니다.

**시그니처**:
```typescript
function generateJSONReport(employees: Employee[]): string
```

#### 3. `generateTextReport()`

텍스트 리포트를 생성합니다.

**시그니처**:
```typescript
function generateTextReport(employees: Employee[]): string
```

---

## 에러 처리

### 일반적인 에러

모든 서비스 함수는 에러를 throw할 수 있습니다. try-catch로 처리하세요.

```typescript
try {
  const employee = await employeeService.create(newEmployee);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // 사용자에게 에러 메시지 표시
  }
}
```

### HTTP 상태 코드

- `200`: 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

### Supabase 에러

Supabase 에러는 `error` 객체에 포함됩니다:

```typescript
const { data, error } = await supabase.from('employees').select('*');

if (error) {
  console.error('Supabase 에러:', error.message);
  console.error('에러 코드:', error.code);
}
```

---

## 예시

### 전체 워크플로우 예시

```typescript
import { employeeService } from '@/lib/supabaseClient';
import { uploadEmployeeFile } from '@/lib/fileService';

// 1. 직원 등록
const newEmployee = await employeeService.create({
  employee_number: 'EMP001',
  name: '홍길동',
  email: 'hong@example.com',
  department: '개발팀',
  rank: '과장',
  position: '팀장',
  hire_date: '2024-01-01',
  status: 'active',
});

// 2. 파일 업로드
const file = await uploadEmployeeFile(
  newEmployee.id,
  resumeFile,
  'resume',
  '최신 이력서',
);

// 3. 직원 조회
const employee = await employeeService.getById(newEmployee.id);

// 4. 직원 수정
const updated = await employeeService.update(newEmployee.id, {
  rank: '부장',
});

// 5. 직원 삭제 (admin만 가능)
await employeeService.delete(newEmployee.id);
```

### 엑셀 임포트 예시

```typescript
import { importEmployeesFromExcel } from '@/lib/excelService';

const handleFileUpload = async (file: File) => {
  try {
    const result = await importEmployeesFromExcel(file);
    
    console.log(`성공: ${result.success}명`);
    console.log(`실패: ${result.failed}명`);
    
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        console.error(`행 ${error.row}: ${error.message}`);
      });
    }
  } catch (error) {
    console.error('임포트 실패:', error);
  }
};
```

### 알림 확인 예시

```typescript
import { checkAllNotifications } from '@/lib/notificationUtils';

const loadNotifications = async () => {
  try {
    const notifications = await checkAllNotifications();
    
    // 읽지 않은 알림 개수
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // 우선순위별 정렬
    const sorted = notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  } catch (error) {
    console.error('알림 로드 실패:', error);
  }
};
```

---

## 참고사항

1. **인증**: 모든 API는 Supabase 인증을 사용합니다
2. **RLS**: Row Level Security 정책에 따라 접근이 제어됩니다
3. **역할**: admin, hr, viewer 역할에 따라 권한이 다릅니다
4. **에러 처리**: 항상 try-catch로 에러를 처리하세요
5. **타입 안정성**: TypeScript 타입을 활용하여 타입 안정성을 보장하세요

---

**최종 업데이트**: 2024년




