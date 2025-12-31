'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './auth';

export type UserRole = 'admin' | 'hr' | 'viewer' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    async function fetchRole() {
      if (!user) return; // 추가 null 체크
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // PGRST116: No rows returned (역할이 없는 경우)
          if (error.code === 'PGRST116') {
            console.warn('User role not found. User ID:', user.id);
            console.warn('Please create a role for this user in the user_roles table.');
            setRole(null);
          } else {
            console.error('Error fetching user role:', error);
            setRole(null);
          }
        } else {
          setRole(data?.role as UserRole || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  return { role, loading };
}

// 권한 체크 함수
export function hasPermission(role: UserRole, action: 'read' | 'write' | 'delete'): boolean {
  if (!role) return false;

  switch (role) {
    case 'admin':
      return true; // 모든 권한
    case 'hr':
      return action !== 'delete'; // 읽기/쓰기만
    case 'viewer':
      return action === 'read'; // 읽기만
    default:
      return false;
  }
}

