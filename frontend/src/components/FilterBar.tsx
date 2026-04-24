import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterOption {
  label: string;
  field: string;
  type: 'select' | 'date' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export default function FilterBar({ filters, values, onChange }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = Object.values(values).filter(Boolean).length;

  const updateFilter = (field: string, value: string) => {
    onChange({ ...values, [field]: value });
  };

  const clearAll = () => {
    const cleared: Record<string, string> = {};
    filters.forEach(f => (cleared[f.field] = ''));
    onChange(cleared);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <Filter size={16} />
          <span className="font-medium">Filters</span>
          {activeCount > 0 && (
            <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            {filters.map(filter => (
              <div key={filter.field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{filter.label}</label>
                {filter.type === 'select' ? (
                  <select
                    value={values[filter.field] || ''}
                    onChange={e => updateFilter(filter.field, e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    {filter.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={values[filter.field] || ''}
                    onChange={e => updateFilter(filter.field, e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type="text"
                    value={values[filter.field] || ''}
                    onChange={e => updateFilter(filter.field, e.target.value)}
                    placeholder={filter.placeholder}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
