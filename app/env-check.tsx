'use client';

import { useEffect } from 'react';
import { showToast } from '@/lib/toast';

// 환경 변수 검증 (클라이언트 사이드)
export function EnvCheck() {
  useEffect(() => {
    // Next.js에서 NEXT_PUBLIC_ 환경 변수는 빌드 타임에 주입되므로 직접 접근
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const missingVars: string[] = [];
    
    if (!url || url.trim() === '' || url === 'your_supabase_project_url') {
      missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    }
    
    if (!key || key.trim() === '' || key === 'your_supabase_anon_key') {
      missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      console.error('현재 환경 변수 값:');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', url || '(없음)');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? '(설정됨)' : '(없음)');
      console.error('해결 방법:');
      console.error('1. .env.local 파일이 프로젝트 루트에 있는지 확인');
      console.error('2. 파일 이름이 정확히 .env.local인지 확인 (.env.local.txt 아님)');
      console.error('3. 환경 변수 값에 따옴표나 공백이 없는지 확인');
      console.error('4. 개발 서버를 재시작했는지 확인 (Ctrl + C 후 npm run dev)');
      console.error('5. .next 폴더를 삭제하고 다시 시작 (Remove-Item -Recurse -Force .next)');
      
      showToast.error(
        `필수 환경 변수가 누락되었습니다: ${missingVars.join(', ')}\n` +
        '브라우저 콘솔(F12)에서 자세한 해결 방법을 확인하세요.'
      );
    } else {
      // 환경 변수가 모두 설정된 경우 성공 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 모든 필수 환경 변수가 설정되었습니다.');
      }
    }
  }, []);

  return null;
}

