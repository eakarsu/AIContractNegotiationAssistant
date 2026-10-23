import React from 'react';

export default function RecordDetailModal({
  record,
  onClose,
  onNavigate,
}: {
  record: { item: any; detailPath?: string } | null;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}) {
  if (!record || !record.item) return null;
  const { item, detailPath } = record;
  const entries = Object.entries(item).filter(
    ([k, v]) => !['id', 'userId'].includes(k) && (typeof v !== 'object' || v === null)
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {item.title || item.name || item.subject || 'Record Details'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className={
                key === 'content' || key === 'description' || String(value ?? '').length > 80
                  ? 'sm:col-span-2 bg-gray-50 p-3 rounded-lg'
                  : 'bg-gray-50 p-3 rounded-lg'
              }
            >
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
              </div>
              <div className="text-sm text-gray-900 break-words whitespace-pre-wrap">
                {String(value ?? '—')}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              const target = detailPath;
              onClose();
              if (target && onNavigate) onNavigate(target);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
