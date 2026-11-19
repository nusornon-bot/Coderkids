import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CloudOff,
  Save,
  FolderOpen,
  Trash2,
  CheckCircle2,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import {
  type CloudStudioProjectRecord,
  isCloudFirestoreReadyForUser,
  saveStudioProjectToFirestore,
  listStudioProjectsFromFirestore,
  deleteStudioProjectFromFirestore,
} from '../../services/firestoreService.ts';
import { soundEffects } from '../../utils/soundEffects.ts';

export type StudioProjectType = 'scratch' | 'microbit' | 'python';

interface CloudStudioProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  studioType: StudioProjectType;
  studioLabel: string;
  defaultTitle: string;
  currentPresetId?: string;
  currentCodeContent: string;
  currentBlocksJson?: string;
  onLoadProject: (project: CloudStudioProjectRecord) => void;
}

const LOCAL_STORAGE_PREFIX = 'coderkids_studio_projects_';

function readLocalProjects(studioType: StudioProjectType): CloudStudioProjectRecord[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${studioType}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalProjects(
  studioType: StudioProjectType,
  items: CloudStudioProjectRecord[]
): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${studioType}`, JSON.stringify(items.slice(0, 30)));
  } catch {
    // Ignore storage quota errors
  }
}

export const CloudStudioProjectModal: React.FC<CloudStudioProjectModalProps> = ({
  isOpen,
  onClose,
  studioType,
  studioLabel,
  defaultTitle,
  currentPresetId,
  currentCodeContent,
  currentBlocksJson,
  onLoadProject,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [projects, setProjects] = useState<CloudStudioProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const cloudReady = isCloudFirestoreReadyForUser();

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setStatusMessage(null);
      setPendingDeleteId(null);
      void loadProjectsList();
    }
  }, [isOpen, studioType, defaultTitle]);

  const loadProjectsList = async () => {
    setIsLoading(true);
    const localItems = readLocalProjects(studioType);
    let cloudItems: CloudStudioProjectRecord[] = [];
    if (isCloudFirestoreReadyForUser()) {
      try {
        cloudItems = await listStudioProjectsFromFirestore(studioType);
      } catch {
        cloudItems = [];
      }
    }
    const mergedMap = new Map<string, CloudStudioProjectRecord>();
    for (const c of cloudItems) mergedMap.set(c.id, c);
    for (const l of localItems) {
      if (!mergedMap.has(l.id)) mergedMap.set(l.id, l);
    }
    setProjects(Array.from(mergedMap.values()));
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim() || defaultTitle || 'โปรเจกต์ของฉัน';
    setIsSaving(true);
    setStatusMessage(null);

    const projectId = `sp_${studioType}_${Date.now()}`;
    const nowLabel = new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    let savedToCloud = false;
    if (isCloudFirestoreReadyForUser()) {
      try {
        const resId = await saveStudioProjectToFirestore({
          projectId,
          studioType,
          title: cleanTitle,
          presetId: currentPresetId,
          codeContent: currentCodeContent || '# Coder Kids Project',
          blocksJson: currentBlocksJson,
        });
        savedToCloud = Boolean(resId);
      } catch {
        savedToCloud = false;
      }
    }

    const newRecord: CloudStudioProjectRecord = {
      id: projectId,
      studioType,
      title: cleanTitle,
      presetId: currentPresetId,
      codeContent: currentCodeContent || '# Coder Kids Project',
      blocksJson: currentBlocksJson,
      updatedAtLabel: nowLabel,
      source: savedToCloud ? 'cloud' : 'local',
    };

    const existingLocal = readLocalProjects(studioType).filter((p) => p.id !== projectId);
    writeLocalProjects(studioType, [newRecord, ...existingLocal]);
    setProjects((prev) => [newRecord, ...prev.filter((p) => p.id !== projectId)]);

    soundEffects.play('victory');
    setStatusMessage(
      savedToCloud
        ? `บันทึก "${cleanTitle}" ลง Cloud Firestore และในเครื่องเรียบร้อยแล้ว!`
        : `บันทึก "${cleanTitle}" ลงในเครื่องเรียบร้อยแล้ว! (เข้าสู่ระบบด้วยอีเมลที่ยืนยันแล้วเพื่อซิงค์ Cloud ข้ามเครื่อง)`
    );
    setIsSaving(false);
  };

  const handleDelete = async (item: CloudStudioProjectRecord) => {
    if (pendingDeleteId !== item.id) {
      setPendingDeleteId(item.id);
      return;
    }
    setPendingDeleteId(null);
    if (item.source === 'cloud' && isCloudFirestoreReadyForUser()) {
      try {
        await deleteStudioProjectFromFirestore(item.id);
      } catch {
        // Fallback to removing local copy
      }
    }
    const nextLocal = readLocalProjects(studioType).filter((p) => p.id !== item.id);
    writeLocalProjects(studioType, nextLocal);
    setProjects((prev) => prev.filter((p) => p.id !== item.id));
    soundEffects.play('click');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 via-sky-50 to-white dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              {cloudReady ? <Cloud className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  บันทึก &amp; เปิดโปรเจกต์ — {studioLabel}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cloudReady
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {cloudReady ? (
                    <>
                      <Cloud className="w-3 h-3" /> Cloud Firestore พร้อมใช้งาน
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-3 h-3" /> บันทึกในเครื่อง (Local)
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เก็บโค้ดและบล็อกคำสั่งของคุณไว้กลับมาทำต่อได้ทุกเมื่อ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {/* Save Form */}
          <form
            onSubmit={handleSave}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
          >
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200">
              บันทึกโปรเจกต์ปัจจุบัน
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ตั้งชื่อโปรเจกต์ เช่น เกมแมวเก็บดาว ป.5..."
                maxLength={120}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-extrabold shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : cloudReady ? 'บันทึกลง Cloud' : 'บันทึกในเครื่อง'}</span>
              </button>
            </div>
            {statusMessage && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </form>

          {/* Saved List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-indigo-500" />
                <span>โปรเจกต์ที่บันทึกไว้ ({projects.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => void loadProjectsList()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                กำลังโหลดรายการโปรเจกต์...
              </div>
            ) : projects.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                ยังไม่มีโปรเจกต์ที่บันทึกไว้ ลองตั้งชื่อแล้วกดปุ่มบันทึกด้านบนได้เลย!
              </div>
            ) : (
              <div className="space-y-2.5">
                {projects.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.source === 'cloud'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.source === 'cloud' ? '☁️ Cloud' : '💾 Local'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        อัปเดตล่าสุด: {item.updatedAtLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadProject(item);
                          soundEffects.play('correct');
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        โหลดโปรเจกต์
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                          pendingDeleteId === item.id
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-rose-600'
                        }`}
                        title="ลบโปรเจกต์"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {pendingDeleteId === item.id && <span>ยืนยันลบ</span>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
