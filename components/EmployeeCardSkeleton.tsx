export default function EmployeeCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 animate-pulse">
      <div className="flex items-start gap-4">
        {/* 프로필 이미지 스켈레톤 */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0"></div>
        
        {/* 정보 영역 */}
        <div className="flex-1 space-y-3">
          {/* 이름 */}
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          
          {/* 직책/부서 */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          
          {/* 연락처 정보 */}
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
      
      {/* 버튼 영역 스켈레톤 */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <div className="h-8 bg-gray-200 rounded flex-1"></div>
        <div className="h-8 bg-gray-200 rounded flex-1"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
}

