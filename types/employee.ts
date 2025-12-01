export interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  hire_date: string;
  phone?: string;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

export type NewEmployee = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;