import { createClient } from '@supabase/supabase-js';
import { Employee, SalaryHistory, PositionHistory } from '@/types/employee';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const employeeService = {
  // 모든 직원 조회 (페이지네이션 및 검색 지원)
  async getAll(page: number = 1, pageSize: number = 9, searchTerm: string = '') {
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 검색 필터
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,rank.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`);
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

  // 새 직원 추가
  async create(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single();
    
    if (error) throw error;
    
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
    
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // 급여 변동 이력 추가
    if (updates.current_salary && updates.current_salary !== oldEmployee.current_salary) {
      await this.addSalaryHistory({
        employee_id: id,
        previous_salary: oldEmployee.current_salary,
        new_salary: updates.current_salary,
        change_date: new Date().toISOString().split('T')[0],
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
  }
};