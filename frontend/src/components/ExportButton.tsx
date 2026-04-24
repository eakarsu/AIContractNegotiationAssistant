import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Printer } from 'lucide-react';

interface ExportButtonProps {
  onExportCSV: () => void;
  onPrint?: () => void;
}

export default function ExportButton({ onExportCSV, onPrint }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <Download size={16} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <button
            onClick={() => { onExportCSV(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <FileText size={16} /> CSV Download
          </button>
          <button
            onClick={() => { (onPrint || (() => window.print()))(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Printer size={16} /> Print / PDF
          </button>
        </div>
      )}
    </div>
  );
}
