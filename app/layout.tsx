import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navigation from '@/components/Navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { EnvCheck } from './env-check';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '인사관리 시스템',
  description: 'Supabase와 Next.js로 구축한 직원 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 스킵 링크 (접근성) */}
        <a href="#main-content" className="skip-link">
          메인 콘텐츠로 건너뛰기
        </a>
        <EnvCheck />
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            disableTransitionOnChange={false}
          >
            <AuthProvider>
              <Sidebar />
              <Header />
              <div className="lg:ml-64 mt-16">
                <main id="main-content" tabIndex={-1} className="p-4 lg:p-6">
                  {children}
                </main>
              </div>
              <Toaster position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}