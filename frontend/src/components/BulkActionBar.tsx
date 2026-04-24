import { Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionBar({ selectedCount, onDelete, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="w-px h-5 bg-gray-600" />
      <button
        onClick={onDelete}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm"
      >
        <Trash2 size={14} /> Delete
      </button>
      <button onClick={onClear} className="p-1.5 hover:bg-gray-700 rounded-lg transition">
        <X size={16} />
      </button>
    </div>
  );
}
