/**
 * 환경 변수 검증 및 타입 안전한 접근을 위한 유틸리티
 */

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}\n` +
      '`.env.local` 파일을 확인하거나 `.env.example`을 참고하세요.'
    );
  }
}

// 환경 변수 타입 안전 접근
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const;





