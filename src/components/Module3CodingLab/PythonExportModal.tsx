import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Play,
  FileCode2,
  Terminal,
  Cpu,
} from 'lucide-react';

interface ExportModeOption {
  value: string;
  label: string;
  description: string;
}

interface PythonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceName: string;
  projectTitle: string;
  fileName: string;
  modes: ExportModeOption[];
  activeMode: string;
  onChangeMode: (mode: string) => void;
  includeComments: boolean;
  onToggleComments: (val: boolean) => void;
  rawCode: string;
  extraToggleLabel?: string;
  extraToggleChecked?: boolean;
  onChangeExtraToggle?: (val: boolean) => void;
  onOpenPythonLab?: (code: string, title: string) => void;
  canRunInPlayground: boolean;
}

export const PythonExportModal: React.FC<PythonExportModalProps> = ({
  isOpen,
  onClose,
  sourceName,
  projectTitle,
  fileName,
  modes,
  activeMode,
  onChangeMode,
  includeComments,
  onToggleComments,
  rawCode,
  extraToggleLabel,
  extraToggleChecked,
  onChangeExtraToggle,
  onOpenPythonLab,
  canRunInPlayground,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const lineCount = rawCode ? rawCode.split('\n').length : 0;

  const handleCopy = async () => {
    let ok = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(rawCode);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      const ta = document.createElement('textarea');
      ta.value = rawCode;
      ta.setAttribute('readonly', '');
      ta.className = 'fixed -left-[9999px] top-0 opacity-0';
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPy = () => {
    const blob = new Blob([`${rawCode}\n`], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.py') ? fileName : `${fileName}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeModeMeta = modes.find((m) => m.value === activeMode) || modes[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Export to Python"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 shrink-0">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-sky-300 font-semibold">
                <span>Export to Python</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300 truncate">{sourceName}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold truncate">{projectTitle}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode & Options Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {modes.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onChangeMode(m.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMode === m.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-indigo-400'
                }`}
              >
                {m.value === 'playground' ? (
                  <Terminal className="w-3.5 h-3.5" />
                ) : (
                  <Cpu className="w-3.5 h-3.5" />
                )}
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 font-medium select-none">
              <input
                type="checkbox"
                checked={includeComments}
                onChange={(e) => onToggleComments(e.target.checked)}
                className="accent-indigo-600 rounded cursor-pointer"
              />
              <span>แนบคำอธิบาย #</span>
            </label>

            {extraToggleLabel && onChangeExtraToggle && (
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 font-medium select-none">
                <input
                  type="checkbox"
                  checked={Boolean(extraToggleChecked)}
                  onChange={(e) => onChangeExtraToggle(e.target.checked)}
                  className="accent-indigo-600 rounded cursor-pointer"
                />
                <span>{extraToggleLabel}</span>
              </label>
            )}
          </div>
        </div>

        {/* Mode Hint */}
        {activeModeMeta && (
          <div className="px-5 py-2 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2">
            <span>{activeModeMeta.description}</span>
            <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0">
              {fileName} · {lineCount} บรรทัด
            </span>
          </div>
        )}

        {/* Raw Clean Script Display */}
        <div className="p-4 sm:p-5 bg-slate-950 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-slate-400">
            <span>RAW PYTHON 3 SCRIPT (คัดลอกหรือส่งไปแก้ไขต่อได้ทันที)</span>
            <span className="text-emerald-400">UTF-8 · Clean Indentation</span>
          </div>
          <textarea
            readOnly
            value={rawCode}
            spellCheck={false}
            rows={13}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Raw exported Python script"
            className="w-full flex-1 min-h-[240px] p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none selection:bg-indigo-600 selection:text-white"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกสคริปต์แล้ว!' : 'คัดลอก Raw Python'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด .py</span>
            </button>
          </div>

          {onOpenPythonLab && canRunInPlayground && (
            <button
              type="button"
              onClick={() => {
                onOpenPythonLab(rawCode, `${sourceName}: ${projectTitle}`);
                onClose();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>เปิดรันใน Junior Code Playground</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
