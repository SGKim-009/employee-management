import { supabase } from './supabaseClient';
import { Evaluation, EvaluationCriteria, EvaluationScore, EvaluationFormData, EvaluationStats } from '@/types/evaluation';

export const evaluationService = {
  // 평가 항목 목록 조회
  async getCriteria(): Promise<EvaluationCriteria[]> {
    const { data, error } = await supabase
      .from('evaluation_criteria')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 평가 항목 생성
  async createCriteria(criteria: Omit<EvaluationCriteria, 'id' | 'created_at' | 'updated_at'>): Promise<EvaluationCriteria> {
    const { data, error } = await supabase
      .from('evaluation_criteria')
      .insert([criteria])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 평가 항목 수정
  async updateCriteria(id: string, updates: Partial<EvaluationCriteria>): Promise<EvaluationCriteria> {
    const { data, error } = await supabase
      .from('evaluation_criteria')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 평가 생성
  async createEvaluation(formData: EvaluationFormData, evaluatorId?: string): Promise<Evaluation> {
    // 전체 점수 계산 (가중 평균)
    const criteria = await this.getCriteria();
    const criteriaMap = new Map(criteria.map(c => [c.id, c]));
    
    let totalWeightedScore = 0;
    let totalWeight = 0;

    formData.scores.forEach(score => {
      const criterion = criteriaMap.get(score.criteria_id);
      if (criterion) {
        totalWeightedScore += score.score * criterion.weight;
        totalWeight += criterion.weight;
      }
    });

    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // 평가 생성
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert([{
        employee_id: formData.employee_id,
        evaluator_id: evaluatorId,
        evaluation_period: formData.evaluation_period,
        evaluation_date: formData.evaluation_date,
        overall_score: overallScore,
        overall_comment: formData.overall_comment,
        status: 'draft'
      }])
      .select()
      .single();

    if (evalError) throw evalError;

    // 평가 점수 생성
    if (formData.scores.length > 0) {
      const scores = formData.scores.map(score => ({
        evaluation_id: evaluation.id,
        criteria_id: score.criteria_id,
        score: score.score,
        comment: score.comment
      }));

      const { error: scoresError } = await supabase
        .from('evaluation_scores')
        .insert(scores);

      if (scoresError) throw scoresError;
    }

    return await this.getEvaluationById(evaluation.id);
  },

  // 평가 조회 (ID로)
  async getEvaluationById(id: string): Promise<Evaluation> {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        employee:employees(id, name, department, position)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // 평가 점수 조회
    const { data: scores, error: scoresError } = await supabase
      .from('evaluation_scores')
      .select(`
        *,
        criteria:evaluation_criteria(*)
      `)
      .eq('evaluation_id', id);

    if (scoresError) throw scoresError;
    if (!data) throw new Error('Evaluation not found');

    return {
      ...(data as Record<string, any>),
      scores: scores || []
    } as Evaluation;
  },

  // 직원별 평가 목록 조회
  async getEvaluationsByEmployee(employeeId: string): Promise<Evaluation[]> {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        employee:employees(id, name, department, position)
      `)
      .eq('employee_id', employeeId)
      .order('evaluation_date', { ascending: false });

    if (error) throw error;

    // 각 평가의 점수 조회
    const evaluationsWithScores = await Promise.all(
      (data || []).map(async (evaluation: any) => {
        const { data: scores } = await supabase
          .from('evaluation_scores')
          .select(`
            *,
            criteria:evaluation_criteria(*)
          `)
          .eq('evaluation_id', evaluation.id);

        return {
          ...evaluation,
          scores: scores || []
        } as Evaluation;
      })
    );

    return evaluationsWithScores;
  },

  // 평가 수정
  async updateEvaluation(id: string, formData: Partial<EvaluationFormData>, evaluatorId?: string): Promise<Evaluation> {
    // 전체 점수 재계산 (점수가 변경된 경우)
    let overallScore: number | undefined;
    if (formData.scores && formData.scores.length > 0) {
      const criteria = await this.getCriteria();
      const criteriaMap = new Map(criteria.map(c => [c.id, c]));
      
      let totalWeightedScore = 0;
      let totalWeight = 0;

      formData.scores.forEach(score => {
        const criterion = criteriaMap.get(score.criteria_id);
        if (criterion) {
          totalWeightedScore += score.score * criterion.weight;
          totalWeight += criterion.weight;
        }
      });

      overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    }

    // 평가 업데이트
    const updateData: any = {};
    if (formData.evaluation_period) updateData.evaluation_period = formData.evaluation_period;
    if (formData.evaluation_date) updateData.evaluation_date = formData.evaluation_date;
    if (formData.overall_comment !== undefined) updateData.overall_comment = formData.overall_comment;
    if (overallScore !== undefined) updateData.overall_score = overallScore;

    const { error: evalError } = await supabase
      .from('evaluations')
      .update(updateData)
      .eq('id', id);

    if (evalError) throw evalError;

    // 평가 점수 업데이트
    if (formData.scores && formData.scores.length > 0) {
      // 기존 점수 삭제
      await supabase
        .from('evaluation_scores')
        .delete()
        .eq('evaluation_id', id);

      // 새 점수 삽입
      const scores = formData.scores.map(score => ({
        evaluation_id: id,
        criteria_id: score.criteria_id,
        score: score.score,
        comment: score.comment
      }));

      const { error: scoresError } = await supabase
        .from('evaluation_scores')
        .insert(scores);

      if (scoresError) throw scoresError;
    }

    return await this.getEvaluationById(id);
  },

  // 평가 삭제
  async deleteEvaluation(id: string): Promise<void> {
    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 평가 상태 변경
  async updateEvaluationStatus(id: string, status: Evaluation['status']): Promise<Evaluation> {
    const { data, error } = await supabase
      .from('evaluations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return await this.getEvaluationById(id);
  },

  // 평가 통계 조회
  async getEvaluationStats(employeeId: string): Promise<EvaluationStats> {
    const evaluations = await this.getEvaluationsByEmployee(employeeId);
    
    if (evaluations.length === 0) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, name')
        .eq('id', employeeId)
        .single();

      return {
        employee_id: employeeId,
        employee_name: employee?.name || '',
        total_evaluations: 0,
        average_score: 0,
        scores_by_category: []
      };
    }

    const totalEvaluations = evaluations.length;
    const totalScore = evaluations.reduce((sum, evaluation) => sum + (evaluation.overall_score || 0), 0);
    const averageScore = totalScore / totalEvaluations;

    // 카테고리별 평균 점수 계산
    const categoryScores: { [category: string]: { total: number; count: number } } = {};
    
    evaluations.forEach(evaluation => {
      evaluation.scores?.forEach(score => {
        const category = score.criteria?.category || '기타';
        if (!categoryScores[category]) {
          categoryScores[category] = { total: 0, count: 0 };
        }
        categoryScores[category].total += score.score;
        categoryScores[category].count += 1;
      });
    });

    const scoresByCategory = Object.entries(categoryScores).map(([category, data]) => ({
      category,
      average_score: data.count > 0 ? data.total / data.count : 0
    }));

    const latestEvaluation = evaluations[0];

    return {
      employee_id: employeeId,
      employee_name: latestEvaluation.employee?.name || '',
      total_evaluations: totalEvaluations,
      average_score: averageScore,
      latest_evaluation_date: latestEvaluation.evaluation_date,
      latest_score: latestEvaluation.overall_score,
      scores_by_category: scoresByCategory
    };
  }
};


