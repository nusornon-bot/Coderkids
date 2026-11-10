import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Star,
  FileText,
  Link as LinkIcon,
  Sparkles,
  Award,
  Send,
  Eye,
  Trash2,
  MessageSquare,
  FolderGit2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';
import { UserProfile } from '../types/index.ts';

export interface HomeworkSubmission {
  id: string;
  topic: string;
  title: string;
  studentName: string;
  studentClass: string;
  imageUrl?: string;
  projectUrl?: string;
  reflection: string;
  submittedAt: string;
  status: 'pending' | 'graded';
  gradeScore?: number; // 1-5 stars
  teacherFeedback?: string;
}

interface HomeworkDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  onAwardPoints?: (amount: number, reason: string) => void;
}

const INITIAL_SUBMISSIONS: HomeworkSubmission[] = [
  {
    id: 'sub_1',
    topic: 'ผังงาน (Flowchart) การแก้ปัญหาในชีวิตประจำวัน',
    title: 'ผังงานการต้มไข่และการคัดแยกขยะในโรงเรียน',
    studentName: 'ด.ช. พณสร ไทยจินดา',
    studentClass: 'ป.4/1',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    reflection: 'ได้ฝึกใช้สัญลักษณ์สี่เหลี่ยมผืนผ้าสำหรับการประมวลผล และสี่เหลี่ยมข้าวหลามตัดสำหรับการตัดสินใจครับ',
    submittedAt: '09/11/2026 08:45 น.',
    status: 'graded',
    gradeScore: 5,
    teacherFeedback: 'ยอดเยี่ยมมาก! ผังงานมีจุดเริ่มต้น-สิ้นสุดครบถ้วน ลำดับขั้นตอนถูกต้องตามมาตรฐาน สพฐ.',
  },
  {
    id: 'sub_2',
    topic: 'โปรเจกต์ Scratch บล็อกคำสั่งนับคะแนน',
    title: 'เกมแมวเก็บปลาหลบปูยักษ์ (พร้อมตัวนับคะแนน)',
    studentName: 'ด.ญ. กัญญาพัชร มณีโชติ',
    studentClass: 'ป.5/2',
    projectUrl: 'https://scratch.mit.edu/projects/sample-game',
    reflection: 'ได้สร้างตัวแปร score และใช้ลูป forever พร้อม if touching color ครับ',
    submittedAt: '08/11/2026 14:20 น.',
    status: 'graded',
    gradeScore: 5,
    teacherFeedback: 'เกมสนุกและโค้ดสะอาดมาก มีการใช้ตัวแปรได้ถูกต้องและมีระบบเช็คเงื่อนไขชนะ-แพ้',
  },
];

const ASSIGNMENT_TOPICS = [
  'ผังงาน (Flowchart) การแก้ปัญหาในชีวิตประจำวัน',
  'ใบงาน Unplugged วิทยาการคำนวณ (A4)',
  'โปรเจกต์ Scratch บล็อกคำสั่งนับคะแนน',
  'โค้ด Micro:bit วัดอุณหภูมิ & ส่งสัญญาณเตือน',
  'โครงงานสะเต็มศึกษา STEM 5E Project Canvas',
  'การออกแบบโปสเตอร์ความปลอดภัยดิจิทัล & PDPA',
];

export const HomeworkDropzone: React.FC<HomeworkDropzoneProps> = ({
  isOpen,
  onClose,
  profile,
  onAwardPoints,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'portfolio' | 'teacher'>('submit');
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>(() => {
    const saved = localStorage.getItem('coderkids_homework_submissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading homework:', e);
      }
    }
    return INITIAL_SUBMISSIONS;
  });

  // Form states
  const [topic, setTopic] = useState(ASSIGNMENT_TOPICS[0]);
  const [title, setTitle] = useState('');
  const [studentName, setStudentName] = useState(profile?.name || 'ด.ช. พณสร ไทยจินดา');
  const [studentClass, setStudentClass] = useState(profile?.grade || 'ประถมศึกษาปีที่ 4/1');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [projectUrl, setProjectUrl] = useState('');
  const [reflection, setReflection] = useState('');

  // Selected submission preview modal
  const [viewingSubmission, setViewingSubmission] = useState<HomeworkSubmission | null>(null);

  // Teacher grading states
  const [gradingScore, setGradingScore] = useState<number>(5);
  const [gradingFeedback, setGradingFeedback] = useState<string>('ตรวจแล้ว ผลงานเรียบร้อยและถูกต้องตามเกณฑ์');

  useEffect(() => {
    localStorage.setItem('coderkids_homework_submissions', JSON.stringify(submissions));
  }, [submissions]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        soundEffects.play('click');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSub: HomeworkSubmission = {
      id: `sub_${Date.now()}`,
      topic,
      title: title.trim(),
      studentName: studentName.trim(),
      studentClass: studentClass.trim(),
      imageUrl: imagePreview || undefined,
      projectUrl: projectUrl.trim() || undefined,
      reflection: reflection.trim(),
      submittedAt: new Date().toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'pending',
    };

    setSubmissions([newSub, ...submissions]);
    soundEffects.play('victory');
    confetti({ particleCount: 60, spread: 60 });

    if (onAwardPoints) {
      onAwardPoints(20, `ส่งการบ้าน/ผลงานวิชาการ: "${title.trim()}" (+20 EXP)`);
    }

    // Reset Form
    setTitle('');
    setImagePreview(null);
    setProjectUrl('');
    setReflection('');
    setActiveTab('portfolio');
  };

  const handleGradeSubmission = (subId: string) => {
    const updated = submissions.map((sub) => {
      if (sub.id === subId) {
        return {
          ...sub,
          status: 'graded' as const,
          gradeScore: gradingScore,
          teacherFeedback: gradingFeedback,
        };
      }
      return sub;
    });

    setSubmissions(updated);
    setViewingSubmission(null);
    soundEffects.play('correct');
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleDelete = (id: string) => {
    setSubmissions(submissions.filter((s) => s.id !== id));
    soundEffects.play('click');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <FolderGit2 className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  กล่องส่งการบ้าน &amp; แฟ้มผลงาน (Homework Dropzone)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  สพฐ. ว 4.2
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ถ่ายรูปส่งใบงานกระดาษ แนบภาพผลงาน Scratch และรับข้อเสนอแนะ 2 Stars 1 Wish จากครู
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('submit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'submit'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📤 ส่งงานใหม่
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'portfolio'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📁 แฟ้มผลงาน ({submissions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'teacher'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                👨‍🏫 คุณครูตรวจงาน
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activeTab === 'submit' && (
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
                  <strong>คำแนะนำการส่งงาน:</strong> นักเรียนสามารถถ่ายรูปสมุดการบ้าน ใบงานที่ทำเสร็จแล้ว หรือแคปภาพหน้าจอโปรแกรม Scratch มาแนบส่งได้เลย เมื่อส่งงานสำเร็จจะได้รับแต้ม +20 EXP ทันที!
                </div>
              </div>

              {/* Assignment Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  หัวข้องาน / ชิ้นงานที่ส่ง *
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {ASSIGNMENT_TOPICS.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อผลงาน / คำอธิบายสั้น ๆ *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ผังงานระบบรดน้ำต้นไม้อัตโนมัติ, โปรเจกต์เกม Scratch ป.4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Student info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ-สกุล นักเรียน *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ระดับชั้น / ห้องเรียน *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* File / Camera Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  รูปถ่ายใบงาน / ภาพหน้าจอผลงาน (คลิกเพื่อถ่ายรูปหรือเลือกไฟล์)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl hover:border-teal-500 transition-colors bg-slate-50 dark:bg-slate-800/40 relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {imagePreview ? (
                    <div className="relative text-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 rounded-xl object-contain mx-auto shadow-md"
                      />
                      <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-bold">
                        ✓ เลือกรูปภาพเรียบร้อย (คลิกเพื่อเปลี่ยนรูปใหม่)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-xs">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        <span>คลิกเพื่อเปิดกล้องถ่ายรูป หรืออัปโหลดไฟล์รูปภาพ</span>
                      </div>
                      <p className="text-[11px] text-slate-400">รองรับไฟล์ PNG, JPG, JPEG (ขนาดไม่เกิน 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Project link optional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  หรือ แนบลิงก์ผลงาน Scratch / MakeCode / Google Drive (ไม่บังคับ)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="https://scratch.mit.edu/projects/..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Student reflection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  สิ่งที่ได้เรียนรู้จากการทำชิ้นงานนี้ (สะท้อนคิด)
                </label>
                <textarea
                  rows={2}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="เขียนเล่าความประทับใจ หรือสิ่งที่ได้เรียนรู้จากการทำชิ้นงานนี้..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>ส่งการบ้าน &amp; บันทึกลงแฟ้มผลงาน (+20 EXP)</span>
              </button>
            </form>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    แฟ้มผลงานดิจิทัลของนักเรียน (Digital Portfolio)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    แสดงรายการชิ้นงานที่ส่งแล้ว พร้อมคะแนนดาวและข้อเสนอแนะจากคุณครู
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('submit')}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ส่งงานเพิ่ม</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                        {sub.topic}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          sub.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {sub.status === 'graded' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ตรวจแล้ว ⭐ {sub.gradeScore}/5</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>รอคุณครูตรวจ</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {sub.title}
                    </h5>

                    {sub.imageUrl && (
                      <div className="h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                        <img
                          src={sub.imageUrl}
                          alt={sub.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => setViewingSubmission(sub)}
                        />
                      </div>
                    )}

                    {sub.reflection && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">
                        "{sub.reflection}"
                      </p>
                    )}

                    {sub.teacherFeedback && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>ฟีดแบ็กจากคุณครู:</span>
                        </div>
                        <p>{sub.teacherFeedback}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{sub.studentName} ({sub.studentClass})</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingSubmission(sub)}
                          className="text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูรายละเอียด</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                          title="ลบชิ้นงานนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'teacher' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    👨‍🏫 โต๊ะตรวจการบ้านของคุณครู (Teacher Grading Desk)
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    ตรวจผลงาน ให้คะแนนดาว 1-5 ดาว และเขียนคำติชมแบบ 2 Stars 1 Wish
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-800 rounded-xl text-indigo-700 dark:text-indigo-300 shadow-xs">
                  รอตรวจ: {submissions.filter((s) => s.status === 'pending').length} รายการ
                </span>
              </div>

              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {sub.topic}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {sub.studentName} ({sub.studentClass})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sub.submittedAt}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {sub.title}
                      </h5>
                      {sub.reflection && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          สะท้อนคิด: {sub.reflection}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingSubmission(sub);
                          setGradingScore(sub.gradeScore || 5);
                          setGradingFeedback(sub.teacherFeedback || 'ตรวจแล้ว ดีมากครับ');
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        <span>{sub.status === 'graded' ? 'แก้ไขคะแนน' : 'ตรวจและให้คะแนน'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submission Details & Grading Modal */}
        {viewingSubmission && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => setViewingSubmission(null)}
          >
            <div
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[88vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  {viewingSubmission.topic}
                </span>
                <button
                  type="button"
                  onClick={() => setViewingSubmission(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {viewingSubmission.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  โดย {viewingSubmission.studentName} ({viewingSubmission.studentClass}) • {viewingSubmission.submittedAt}
                </p>
              </div>

              {viewingSubmission.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                  <img
                    src={viewingSubmission.imageUrl}
                    alt={viewingSubmission.title}
                    className="w-full max-h-72 object-contain"
                  />
                </div>
              )}

              {viewingSubmission.projectUrl && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    🔗 {viewingSubmission.projectUrl}
                  </span>
                  <a
                    href={viewingSubmission.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-teal-600 hover:underline shrink-0 ml-2"
                  >
                    เปิดดูชิ้นงาน
                  </a>
                </div>
              )}

              {viewingSubmission.reflection && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold block mb-1">สิ่งที่นักเรียนได้เรียนรู้:</span>
                  "{viewingSubmission.reflection}"
                </div>
              )}

              {/* Teacher Grading Panel inside viewing modal */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>แบบประเมินและให้คะแนนคุณครู</span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    คะแนนดาว (1-5):
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setGradingScore(star)}
                        className="cursor-pointer transition-transform hover:scale-110 p-0.5"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= gradingScore
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ข้อคิดเห็น / คำแนะนำแบบ 2 Stars 1 Wish:
                  </label>
                  <textarea
                    rows={2}
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleGradeSubmission(viewingSubmission.id)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  บันทึกการตรวจและส่งข้อเสนอแนะ ให้นักเรียน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
          <span>โรงเรียนอนุบาลนราธิวาส • แฟ้มสะสมงานดิจิทัลตามมาตรฐาน ว 4.2</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
