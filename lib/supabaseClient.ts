import { createClient } from '@supabase/supabase-js';
import { Employee, SalaryHistory, PositionHistory } from '@/types/employee';
import { env } from '@/lib/env';

// 환경 변수 검증 (개발 환경에서만)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('@/lib/env').validateEnv();
  } catch (error) {
    console.warn('환경 변수 검증 경고:', error);
  }
}

export const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const employeeService = {
  // 모든 직원 조회 (페이지네이션, 검색, 필터, 정렬 지원)
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
  ) {
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' });

    // 🆕 재직/퇴사 필터
    if (!includeResigned) {
      query = query.neq('status', 'resigned');
    } else {
      query = query.eq('status', 'resigned');
    }

    // 고급 필터
    if (filters) {
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.rank) {
        query = query.eq('rank', filters.rank);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.hireDateFrom) {
        query = query.gte('hire_date', filters.hireDateFrom);
      }
      if (filters.hireDateTo) {
        query = query.lte('hire_date', filters.hireDateTo);
      }
    }

    // 검색 필터
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,rank.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,employee_number.ilike.%${searchTerm}%`);
    }

    // 정렬
    if (sortBy) {
      query = query.order(sortBy.field, { ascending: sortBy.order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      data: data as Employee[],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  // 특정 직원 조회
  async getById(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Employee;
  },

  // 🆕 사원번호 중복 확인
  async checkEmployeeNumberExists(employeeNumber: string, excludeId?: string) {
    // 빈 값이면 false 반환
    if (!employeeNumber || employeeNumber.trim() === '') {
      return false;
    }
    
    let query = supabase
      .from('employees')
      .select('id')
      .eq('employee_number', employeeNumber.trim());
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking employee number:', error);
      throw error;
    }
    
    return data && data.length > 0;
  },

  // 🆕 이메일 중복 확인
  async checkEmailExists(email: string, excludeId?: string) {
    // 빈 값이면 false 반환
    if (!email || email.trim() === '') {
      return false;
    }
    
    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();
    
    // 디버깅: 쿼리 전 로그
    console.log('[checkEmailExists] 입력 이메일:', trimmedEmail);
    console.log('[checkEmailExists] 정규화된 이메일:', normalizedEmail);
    console.log('[checkEmailExists] excludeId:', excludeId);
    
    // 모든 이메일을 가져와서 JavaScript에서 대소문자 구분 없이 비교
    // (Supabase PostgREST의 or 필터가 복잡하므로, 더 확실한 방법 사용)
    let query = supabase
      .from('employees')
      .select('id, email');
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[checkEmailExists] 쿼리 에러:', error);
      throw error;
    }
    
    console.log('[checkEmailExists] 전체 이메일 조회 결과:', data);
    
    // JavaScript에서 대소문자 구분 없이 비교
    const exists = data?.some(emp => {
      if (!emp.email) return false;
      const empEmailLower = emp.email.trim().toLowerCase();
      const searchEmailLower = normalizedEmail;
      const matches = empEmailLower === searchEmailLower;
      if (matches) {
        console.log('[checkEmailExists] 매칭된 이메일 발견:', emp.email, '===', trimmedEmail);
      }
      return matches;
    }) || false;
    
    console.log('[checkEmailExists] 최종 결과 (exists):', exists);
    
    return exists;
  },

  // 새 직원 추가
  async create(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
    // 서버 사이드 중복 체크
    if (employee.employee_number && employee.employee_number.trim() !== '') {
      const numberExists = await this.checkEmployeeNumberExists(employee.employee_number);
      if (numberExists) {
        throw new Error('이미 사용 중인 사원번호입니다.');
      }
    }
    
    if (employee.email && employee.email.trim() !== '') {
      const emailExists = await this.checkEmailExists(employee.email);
      if (emailExists) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }
    }
    
    // 이메일을 소문자로 정규화하여 저장 (대소문자 구분 없이 비교하기 위해)
    const normalizedEmployee = {
      ...employee,
      email: employee.email ? employee.email.trim().toLowerCase() : employee.email
    };
    
    const { data, error } = await supabase
      .from('employees')
      .insert([normalizedEmployee])
      .select()
      .single();
    
    if (error) {
      // 중복 키 에러 처리
      if (error.code === '23505') {
        if (error.message.includes('employee_number')) {
          throw new Error('이미 사용 중인 사원번호입니다.');
        } else if (error.message.includes('email')) {
          throw new Error('이미 사용 중인 이메일입니다.');
        }
      }
      throw error;
    }
    
    // 최초 인사 기록 추가
    await this.addPositionHistory({
      employee_id: data.id,
      new_position: employee.position,
      new_rank: employee.rank,
      new_department: employee.department,
      change_date: employee.hire_date,
      change_reason: '최초 입사'
    });
    
    return data as Employee;
  },

  // 직원 정보 업데이트
  async update(id: string, updates: Partial<Employee>) {
    // 기존 직원 정보 가져오기
    const oldEmployee = await this.getById(id);
    
    // 서버 사이드 중복 체크 (변경된 경우만)
    if (updates.employee_number && updates.employee_number.trim() !== '') {
      if (updates.employee_number !== oldEmployee.employee_number) {
        const numberExists = await this.checkEmployeeNumberExists(updates.employee_number, id);
        if (numberExists) {
          throw new Error('이미 사용 중인 사원번호입니다.');
        }
      }
    }
    
    if (updates.email && updates.email.trim() !== '') {
      const normalizedEmail = updates.email.trim().toLowerCase();
      if (normalizedEmail !== oldEmployee.email?.toLowerCase()) {
        const emailExists = await this.checkEmailExists(normalizedEmail, id);
        if (emailExists) {
          throw new Error('이미 사용 중인 이메일입니다.');
        }
        // 이메일을 소문자로 정규화하여 업데이트
        updates.email = normalizedEmail;
      }
    }
    
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      // 중복 키 에러 처리
      if (error.code === '23505') {
        if (error.message.includes('employee_number')) {
          throw new Error('이미 사용 중인 사원번호입니다.');
        } else if (error.message.includes('email')) {
          throw new Error('이미 사용 중인 이메일입니다.');
        }
      }
      throw error;
    }
    
    // 급여 변동 이력 추가
    if (updates.current_salary && updates.current_salary !== oldEmployee.current_salary) {
      const now = new Date();
      await this.addSalaryHistory({
        employee_id: id,
        previous_salary: oldEmployee.current_salary,
        new_salary: updates.current_salary,
        change_date: now.toISOString().split('T')[0],
        change_year_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        change_reason: '급여 조정'
      });
    }
    
    // 인사 변동 이력 추가
    if (
      (updates.position && updates.position !== oldEmployee.position) ||
      (updates.rank && updates.rank !== oldEmployee.rank) ||
      (updates.department && updates.department !== oldEmployee.department)
    ) {
      await this.addPositionHistory({
        employee_id: id,
        previous_position: oldEmployee.position,
        new_position: updates.position || oldEmployee.position,
        previous_rank: oldEmployee.rank,
        new_rank: updates.rank || oldEmployee.rank,
        previous_department: oldEmployee.department,
        new_department: updates.department || oldEmployee.department,
        change_date: new Date().toISOString().split('T')[0],
        change_reason: '인사 발령'
      });
    }
    
    return data as Employee;
  },

  // 직원 삭제
  async delete(id: string) {
    // 프로필 이미지 삭제
    const employee = await this.getById(id);
    if (employee.profile_image_url) {
      const fileName = employee.profile_image_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('employee-profiles').remove([fileName]);
      }
    }
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // 프로필 이미지 업로드
  async uploadProfileImage(file: File, employeeId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('employee-profiles')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('employee-profiles')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  },

  // 급여 변동 이력 추가
  async addSalaryHistory(history: Omit<SalaryHistory, 'id' | 'created_at'>) {
    const { error } = await supabase
      .from('salary_history')
      .insert([history]);
    
    if (error) throw error;
  },

  // 급여 변동 이력 조회
  async getSalaryHistory(employeeId: string) {
    const { data, error } = await supabase
      .from('salary_history')
      .select('*')
      .eq('employee_id', employeeId)
      .order('change_date', { ascending: false });
    
    if (error) throw error;
    return data as SalaryHistory[];
  },

  // 🆕 급여 변동 이력 수정
  async updateSalaryHistory(id: string, updates: Partial<SalaryHistory>) {
    const { data, error } = await supabase
      .from('salary_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as SalaryHistory;
  },

  // 🆕 급여 변동 이력 삭제
  async deleteSalaryHistory(id: string) {
    const { error } = await supabase
      .from('salary_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // 인사 변동 이력 추가
  async addPositionHistory(history: Omit<PositionHistory, 'id' | 'created_at'>) {
    const { error } = await supabase
      .from('position_history')
      .insert([history]);
    
    if (error) throw error;
  },

  // 인사 변동 이력 조회
  async getPositionHistory(employeeId: string) {
    const { data, error } = await supabase
      .from('position_history')
      .select('*')
      .eq('employee_id', employeeId)
      .order('change_date', { ascending: false });
    
    if (error) throw error;
    return data as PositionHistory[];
  },

  // 고유한 부서 목록 조회
  async getUniqueDepartments() {
    const { data, error } = await supabase
      .from('employees')
      .select('department')
      .not('department', 'is', null);
    
    if (error) throw error;
    
    const uniqueDepartments = Array.from(new Set(data.map((e: { department: string }) => e.department).filter(Boolean))).sort();
    return uniqueDepartments as string[];
  },

  // 고유한 직급 목록 조회
  async getUniqueRanks() {
    const { data, error } = await supabase
      .from('employees')
      .select('rank')
      .not('rank', 'is', null);
    
    if (error) throw error;
    
    const uniqueRanks = Array.from(new Set(data.map((e: { rank: string }) => e.rank).filter(Boolean))).sort();
    return uniqueRanks as string[];
  },
};