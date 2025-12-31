import { NextRequest, NextResponse } from 'next/server';
import { employeeService } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { field, value, excludeId } = body;

    console.log('[check-duplicate API] 요청 받음:', { field, value, excludeId });

    if (!field || !value) {
      return NextResponse.json(
        { error: '필드와 값이 필요합니다' },
        { status: 400 }
      );
    }

    let exists = false;

    if (field === 'employee_number') {
      exists = await employeeService.checkEmployeeNumberExists(value, excludeId);
      console.log('[check-duplicate API] 사원번호 중복 확인 결과:', exists);
    } else if (field === 'email') {
      exists = await employeeService.checkEmailExists(value, excludeId);
      console.log('[check-duplicate API] 이메일 중복 확인 결과:', exists);
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 필드입니다' },
        { status: 400 }
      );
    }

    console.log('[check-duplicate API] 최종 응답:', { exists });
    return NextResponse.json({ exists });
  } catch (error) {
    console.error('[check-duplicate API] 에러:', error);
    return NextResponse.json(
      { error: '중복 확인 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

