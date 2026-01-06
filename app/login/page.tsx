'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { showToast } from '@/lib/toast';
import { LogIn, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        showToast.error(error.message || '로그인에 실패했습니다.');
      } else {
        showToast.success('로그인되었습니다.');
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      showToast.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽: 로그인 폼 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* 로고 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-sm opacity-90"></div>
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-gray-100">HR Portal</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Welcome back</h1>
            <p className="text-gray-600 dark:text-gray-400">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. EMP-12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                Keep me logged in
              </label>
              <Link href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">OR</span>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Contact HR
              </Link>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
            © 2024 HR Portal Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* 오른쪽: 마케팅 정보 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm">
            <div className="w-8 h-8 bg-white rounded"></div>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-center">Secure & Efficient HR Management</h2>
          <p className="text-xl text-white/90 text-center mb-12 max-w-md">
            Streamline your workforce management, access payroll, and manage benefits all in one secure platform.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-2">
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">✓</span>
              <span>Payroll</span>
            </div>
            <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-2">
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">✓</span>
              <span>Benefits</span>
            </div>
            <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-2">
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">✓</span>
              <span>Time Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





