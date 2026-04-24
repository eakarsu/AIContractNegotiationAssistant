export default function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded w-20" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex gap-6 items-center">
            <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0" />
            {Array.from({ length: cols - 1 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded flex-1" style={{ maxWidth: j === 0 ? '200px' : '100px' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
