// 평가 항목 타입
export interface EvaluationCriteria {
  id: string;
  name: string;
  description?: string;
  weight: number;
  category?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 평가 타입
export interface Evaluation {
  id: string;
  employee_id: string;
  evaluator_id?: string;
  evaluation_period: string;
  evaluation_date: string;
  overall_score?: number;
  overall_comment?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  // 조인된 데이터
  employee?: {
    id: string;
    name: string;
    department: string;
    position: string;
  };
  evaluator?: {
    id: string;
    email: string;
  };
  scores?: EvaluationScore[];
}

// 평가 점수 타입
export interface EvaluationScore {
  id: string;
  evaluation_id: string;
  criteria_id: string;
  score: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
  // 조인된 데이터
  criteria?: EvaluationCriteria;
}

// 평가 폼 데이터 타입
export interface EvaluationFormData {
  employee_id: string;
  evaluation_period: string;
  evaluation_date: string;
  overall_comment?: string;
  scores: {
    criteria_id: string;
    score: number;
    comment?: string;
  }[];
}

// 평가 통계 타입
export interface EvaluationStats {
  employee_id: string;
  employee_name: string;
  total_evaluations: number;
  average_score: number;
  latest_evaluation_date?: string;
  latest_score?: number;
  scores_by_category: {
    category: string;
    average_score: number;
  }[];
}


