'use client';

import React, { useMemo } from 'react';
import { Employee } from '@/types/employee';
import Image from 'next/image';
import { User, Mail, Phone, Building2 } from 'lucide-react';

interface OrgNode {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  children?: OrgNode[];
}

interface OrgChartProps {
  employees: Employee[];
  rootEmployeeId?: string;
}

// 간단한 조직도 컴포넌트 (react-organizational-chart 대신 커스텀 구현)
function OrgChartNode({ node, level = 0 }: { node: OrgNode; level?: number }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* 노드 카드 */}
      <div className="relative group">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 min-w-[200px] border-2 border-blue-500 hover:border-blue-600 transition-all hover:shadow-lg">
          {/* 프로필 이미지 */}
          <div className="flex justify-center mb-2">
            {node.profileImageUrl ? (
              <Image
                src={node.profileImageUrl}
                alt={node.name}
                width={60}
                height={60}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-[60px] h-[60px] rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <User size={30} className="text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>

          {/* 이름 */}
          <h3 className="text-center font-semibold text-gray-800 dark:text-gray-200 mb-1">
            {node.name}
          </h3>

          {/* 직책 */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-1">
            {node.position}
          </p>

          {/* 부서 */}
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-500 mb-2">
            <Building2 size={12} />
            <span>{node.department}</span>
          </div>

          {/* 연락처 정보 (호버 시 표시) */}
          <div className="hidden group-hover:block absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 z-10 border border-gray-200 dark:border-gray-700">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail size={12} />
                <span>{node.email}</span>
              </div>
              {node.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone size={12} />
                  <span>{node.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 자식 노드들 */}
      {hasChildren && (
        <div className="mt-4 flex gap-4 justify-center">
          {node.children!.map((child) => (
            <div key={child.id} className="flex flex-col items-center">
              {/* 연결선 */}
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mb-4"></div>
              <OrgChartNode node={child} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart({ employees, rootEmployeeId }: OrgChartProps) {
  // 조직도 트리 구조 생성
  const orgTree = useMemo(() => {
    if (employees.length === 0) return null;

    // 직원 맵 생성 (빠른 조회를 위해)
    const employeeMap = new Map<string, Employee>();
    employees.forEach((emp) => {
      employeeMap.set(emp.id, emp);
    });

    // 루트 노드 찾기 (manager_id가 없는 직원 또는 지정된 rootEmployeeId)
    let rootEmployee: Employee | undefined;
    
    if (rootEmployeeId) {
      rootEmployee = employeeMap.get(rootEmployeeId);
    } else {
      // manager_id가 없는 직원 중 첫 번째를 루트로 선택
      rootEmployee = employees.find((emp) => !emp.manager_id);
    }

    if (!rootEmployee) {
      // 루트가 없으면 첫 번째 직원을 루트로 사용
      rootEmployee = employees[0];
    }

    // 트리 구조 생성 함수
    const buildTree = (employee: Employee): OrgNode => {
      const node: OrgNode = {
        id: employee.id,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        email: employee.email,
        phone: employee.phone,
        profileImageUrl: employee.profile_image_url,
        children: [],
      };

      // 이 직원의 하위 직원들 찾기 (manager_id가 이 직원의 id인 경우)
      const subordinates = employees.filter((emp) => emp.manager_id === employee.id);
      
      if (subordinates.length > 0) {
        node.children = subordinates.map((sub) => buildTree(sub));
      }

      return node;
    };

    return buildTree(rootEmployee);
  }, [employees, rootEmployeeId]);

  if (!orgTree) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">조직도 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-center">
        <OrgChartNode node={orgTree} />
      </div>
    </div>
  );
}

