import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types/index.ts';
import {
  FileText,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Lock,
  User,
  School,
  Calendar,
  RefreshCw,
  Eye,
  AlertTriangle,
  Award,
  Check,
  ChevronRight,
  Bookmark,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PDPAPrivacyGeneratorProps {
  currentProfile?: UserProfile;
  addPoints?: (amount: number, reason?: string, category?: string) => void;
  onBackToLab?: () => void;
}

// Preset digital project templates
const PROJECT_PRESETS = [
  {
    id: 'scratch_game',
    label: '🎮 เกม Scratch เพื่อการศึกษา',
    title: 'เกมตะลุยอวกาศผจญภัยบั๊กคำนวณ (Space Bug Hunter)',
    platform: 'Scratch 3.0',
    dataItems: ['nickname', 'score', 'avatar'],
    purpose: 'เพื่อบันทึกและแสดงสถิติคะแนนสูงสุด (Leaderboard) ของผู้เล่นในห้องเรียน และปรับปรุงระบบความยากของด่าน',
    retention: 'ตลอดภาคเรียนที่ 1/2569 (หรือลบข้อมูลเมื่อจบการประเมินวิชา)',
    advisor: 'คุณครูนุสรณ์ อ่อนทอง',
  },
  {
    id: 'microbit_iot',
    label: '🤖 โครงงาน Micro:bit Smart Farm',
    title: 'ระบบเซ็นเซอร์วัดความชื้นและสภาพแวดล้อมห้องเรียนอัจฉริยะ',
    platform: 'Micro:bit V2 & MakeCode',
    dataItems: ['nickname', 'school_class', 'logs'],
    purpose: 'เพื่อบันทึกค่าอุณหภูมิและความชื้น พร้อมระบุชื่อนักเรียนผู้รับผิดชอบการดูแลในแต่ละวัน',
    retention: '30 วันหลังสิ้นสุดการจัดแสดงนิทรรศการวิทยาการคำนวณ',
    advisor: 'คุณครูนุสรณ์ อ่อนทอง',
  },
  {
    id: 'web_app',
    label: '🌐 เว็บแอปพลิเคชันห้องเรียน',
    title: 'ระบบสะสมแต้มความดีและบันทึกการเรียนรู้ออนไลน์ (Coder Kids)',
    platform: 'Web App (HTML/React)',
    dataItems: ['nickname', 'score', 'avatar', 'school_class'],
    purpose: 'เพื่อจัดเก็บความก้าวหน้าการเรียนรู้ การสะสมเหรียญรางวัล และการแสดงผลงานดิจิทัล',
    retention: '1 ปีการศึกษา หรือจนกว่าจะจบหลักสูตร',
    advisor: 'คุณครูผู้ดูแลระบบวิชาวิทยาการคำนวณ',
  },
  {
    id: 'survey_poll',
    label: '📊 แบบสำรวจความคิดเห็นดิจิทัล',
    title: 'แบบสำรวจพฤติกรรมการใช้สื่อสังคมออนไลน์อย่างปลอดภัยในโรงเรียน',
    platform: 'Google Forms / Web Form',
    dataItems: ['nickname', 'school_class', 'survey_ans'],
    purpose: 'เพื่อนำข้อมูลเชิงสถิติไปวิเคราะห์และทำโปสเตอร์รณรงค์ความปลอดภัยดิจิทัล ไม่ระบุตัวตนจริงของผู้ตอบ',
    retention: 'ลบข้อมูลทันทีหลังสรุปผลรายงานเสร็จสิ้น (ภายใน 15 วัน)',
    advisor: 'คุณครูนุสรณ์ อ่อนทอง',
  },
];

export const PDPAPrivacyGenerator: React.FC<PDPAPrivacyGeneratorProps> = ({
  currentProfile,
  addPoints,
  onBackToLab,
}) => {
  // Form State
  const [studentName, setStudentName] = useState(currentProfile?.name || 'ด.ช. กิตติภพ สุริยวงศ์');
  const [studentNickname, setStudentNickname] = useState(currentProfile?.nickname || 'ภพ');
  const [studentId, setStudentId] = useState(currentProfile?.studentId || 'CK-2569-042');
  const [schoolName, setSchoolName] = useState(currentProfile?.school || 'โรงเรียนอนุบาลนราธิวาส');
  const [grade, setGrade] = useState(currentProfile?.grade || 'ประถมศึกษาปีที่ 4/1');
  const [advisorName, setAdvisorName] = useState('คุณครูนุสรณ์ อ่อนทอง');
  const [advisorRole, setAdvisorRole] = useState('ครูผู้สอนกลุ่มสาระวิทยาศาสตร์และเทคโนโลยี');

  const [projectTitle, setProjectTitle] = useState('เกมตะลุยอวกาศผจญภัยบั๊กคำนวณ (Space Bug Hunter)');
  const [projectPlatform, setProjectPlatform] = useState('Scratch 3.0');
  const [docRefNumber, setDocRefNumber] = useState(`PDPA-CK-${new Date().getFullYear() + 543}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customPurpose, setCustomPurpose] = useState('เพื่อบันทึกและแสดงสถิติคะแนนสูงสุด (Leaderboard) ของผู้เล่นในห้องเรียน และปรับปรุงระบบความยากของด่านในวิชาวิทยาการคำนวณ');
  const [retentionPeriod, setRetentionPeriod] = useState('ตลอดภาคเรียนที่ 1/2569 (หรือลบข้อมูลเมื่อจบการประเมินวิชา)');

  // Data items to collect (PDPA Data Categories)
  const [collectedData, setCollectedData] = useState<{ [key: string]: boolean }>({
    nickname: true,
    score: true,
    avatar: true,
    school_class: true,
    photo_video: false,
    voice_audio: false,
    email: false,
    survey_ans: false,
  });

  // Consent Clauses Checkboxes
  const [consentPlayScore, setConsentPlayScore] = useState(true);
  const [consentShowLeaderboard, setConsentShowLeaderboard] = useState(true);
  const [consentMediaPublish, setConsentMediaPublish] = useState(false);
  const [guardianApproval, setGuardianApproval] = useState(true);

  // Signatures
  const [studentSignDate, setStudentSignDate] = useState(new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [guardianName, setGuardianName] = useState('ผู้ปกครอง / ผู้แทนโดยชอบธรรม');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // A4 Printable Document Ref
  const printDocumentRef = useRef<HTMLDivElement>(null);

  // Apply Preset
  const handleApplyPreset = (preset: typeof PROJECT_PRESETS[0]) => {
    setProjectTitle(preset.title);
    setProjectPlatform(preset.platform);
    setCustomPurpose(preset.purpose);
    setRetentionPeriod(preset.retention);
    setAdvisorName(preset.advisor);

    const newItems: { [key: string]: boolean } = {
      nickname: false,
      score: false,
      avatar: false,
      school_class: false,
      photo_video: false,
      voice_audio: false,
      email: false,
      survey_ans: false,
    };
    preset.dataItems.forEach((k) => {
      newItems[k] = true;
    });
    setCollectedData(newItems);
  };

  // Toggle collected data item
  const toggleDataItem = (key: string) => {
    setCollectedData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate PDF handler
  const handleGeneratePDF = async () => {
    if (!printDocumentRef.current) return;
    setIsExportingPdf(true);

    try {
      // High-resolution canvas rendering of the formatted A4 document
      const canvas = await html2canvas(printDocumentRef.current, {
        scale: 2, // 2x retina scale for crisp text
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      const cleanFileName = `PDPA_Consent_Form_${studentName.replace(/\s+/g, '_')}_${docRefNumber}.pdf`;
      pdf.save(cleanFileName);

      setIsGenerated(true);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });

      if (addPoints) {
        addPoints(40, 'สร้างหนังสือยินยอม PDPA สำหรับโครงงานดิจิทัลสำเร็จ', 'safety');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      // Fallback: Trigger print dialog
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Browser Print handler
  const handlePrint = () => {
    window.print();
    if (addPoints) {
      addPoints(20, 'พิมพ์เอกสารยินยอม PDPA สำหรับใช้งานจริง', 'safety');
    }
  };

  // Copy Plain Text Summary
  const handleCopySummary = () => {
    const summary = `
============================================================
เอกสารขอความยินยอมและนโยบายความเป็นส่วนตัว (PDPA Consent Form)
เลขที่เอกสาร: ${docRefNumber}
------------------------------------------------------------
1. ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller):
   ผู้พัฒนาโครงงาน: ${studentName} (${studentNickname})
   ระดับชั้น: ${grade}  รหัสนักเรียน: ${studentId}
   สถานศึกษา: ${schoolName}
   ครูที่ปรึกษา: ${advisorName} (${advisorRole})

2. ข้อมูลเกี่ยวกับโครงงาน:
   ชื่อโครงงาน: ${projectTitle}
   แพลตฟอร์ม: ${projectPlatform}

3. ข้อมูลส่วนบุคคลที่จัดเก็บ:
   ${collectedData.nickname ? '• ชื่อเล่น / ชื่อที่ใช้แสดงในระบบ (Display Name)\n' : ''}${collectedData.score ? '• คะแนนและสถิติการเล่นเกม/การทดสอบ (Score & Statistics)\n' : ''}${collectedData.avatar ? '• รูปตัวละครอวตาร (Avatar)\n' : ''}${collectedData.school_class ? '• ระดับชั้นและห้องเรียน (Grade & Classroom)\n' : ''}${collectedData.photo_video ? '• ภาพถ่ายและภาพเคลื่อนไหว (Photo & Video)\n' : ''}${collectedData.voice_audio ? '• บันทึกเสียงการพูด (Voice & Audio)\n' : ''}${collectedData.email ? '• อีเมลสำหรับส่งเกียรติบัตร (Email Contact)\n' : ''}${collectedData.survey_ans ? '• ผลการตอบแบบสอบถามความคิดเห็น (Survey Responses)\n' : ''}

4. วัตถุประสงค์ในการเก็บรวบรวมและใช้ข้อมูล:
   ${customPurpose}
   * ยืนยันไม่มีการนำข้อมูลไปใช้ในเชิงพาณิชย์ หรือส่งต่อบุคคลภายนอกโดยไม่ได้รับอนุญาต

5. ระยะเวลาการเก็บรักษา:
   ${retentionPeriod}

6. สิทธิของเจ้าของข้อมูล (Data Subject Rights):
   เจ้าของข้อมูลมีสิทธิขอเข้าถึง แก้ไข ลบ หรือเพิกถอนความยินยอมได้ตลอดเวลา โดยติดต่อผู้พัฒนาโครงงานหรือครูที่ปรึกษา

วันที่จัดทำ: ${studentSignDate}
============================================================
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>เครื่องมือสร้างเอกสารกฎหมาย PDPA เพื่อการศึกษา (ป.4 - ม.3)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>PDPA Privacy Policy Generator</span>
              <span className="text-sm font-semibold px-3 py-1 rounded-xl bg-white/20 text-white border border-white/30 hidden sm:inline-block">
                พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
              </span>
            </h1>

            <p className="text-sm text-emerald-50 leading-relaxed">
              ฝึกฝนความเป็น <strong>พลเมืองดิจิทัลที่มีความรับผิดชอบ (Responsible Digital Citizen)</strong> ด้วยการสร้างหนังสือขอความยินยอม
              และนโยบายความเป็นส่วนตัวสำหรับโครงงาน Scratch, Micro:bit, เว็บแอป หรือแบบสอบถามดิจิทัลของนักเรียน พร้อมดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงระดับมืออาชีพ!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onBackToLab && (
              <button
                onClick={onBackToLab}
                className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ย้อนกลับสู่แล็บ PDPA</span>
              </button>
            )}

            <button
              onClick={handleGeneratePDF}
              disabled={isExportingPdf}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>สร้างไฟล์ PDF (Generate PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Live A4 Document Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generator Form Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Buttons */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>เลือกแม่แบบโครงงานสำเร็จรูป (Presets):</span>
              </span>
              <span className="text-[10px] text-slate-400">คลิกเพื่อกรอกอัตโนมัติ</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PROJECT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-left transition-all text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2"
                >
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Student & School Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. ข้อมูลผู้สร้างโครงงาน (Data Controller)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อ-นามสกุล นักเรียนผู้พัฒนาโครงงาน *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="เช่น ด.ช. กิตติภพ สุริยวงศ์"
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-bold text-blue-700 placeholder:text-slate-400 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ชื่อเล่น / ชื่อในทีม</label>
                  <input
                    type="text"
                    value={studentNickname}
                    onChange={(e) => setStudentNickname(e.target.value)}
                    placeholder="เช่น ภพ"
                    style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-blue-700 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">รหัสนักเรียน</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="เช่น CK-2569-042"
                    style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold text-blue-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ระดับชั้น / ห้องเรียน</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="เช่น ประถมศึกษาปีที่ 4/1"
                    style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-blue-700 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">เลขที่อ้างอิงเอกสาร</label>
                  <input
                    type="text"
                    value={docRefNumber}
                    onChange={(e) => setDocRefNumber(e.target.value)}
                    placeholder="PDPA-CK-2569-001"
                    style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">โรงเรียน / สถาบันการศึกษา *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="เช่น โรงเรียนอนุบาลนราธิวาส"
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-blue-700 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ครูที่ปรึกษาโครงงาน</label>
                  <input
                    type="text"
                    value={advisorName}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    placeholder="เช่น คุณครูนุสรณ์ อ่อนทอง"
                    style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ตำแหน่ง / กลุ่มสาระ</label>
                  <input
                    type="text"
                    value={advisorRole}
                    onChange={(e) => setAdvisorRole(e.target.value)}
                    placeholder="กลุ่มสาระวิทยาศาสตร์ฯ"
                    style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-blue-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Digital Project Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              <span>2. ข้อมูลโครงงานดิจิทัล (Digital Project Details)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ชื่อผลงาน / โครงงานดิจิทัล *</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="เช่น เกมกู้ภัยไซเบอร์ Scratch"
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-bold text-blue-700"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">แพลตฟอร์ม / ซอฟต์แวร์ที่ใช้พัฒนา</label>
                <select
                  value={projectPlatform}
                  onChange={(e) => setProjectPlatform(e.target.value)}
                  style={{ color: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-blue-700"
                >
                  <option value="Scratch 3.0">Scratch 3.0 (Block-based Coding)</option>
                  <option value="Micro:bit V2 & MakeCode">Micro:bit V2 &amp; MakeCode (IoT / Hardware)</option>
                  <option value="Web App (HTML/CSS/JS)">Web App (HTML/CSS/JS/React)</option>
                  <option value="Python & Pygame">Python &amp; Pygame</option>
                  <option value="Kids AI / Teachable Machine">Kids AI / Machine Learning Prototype</option>
                  <option value="Google Forms / Digital Survey">Google Forms / แบบสำรวจดิจิทัล</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">วัตถุประสงค์ในการเก็บและประมวลผลข้อมูล</label>
                <textarea
                  rows={2}
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="อธิบายวัตถุประสงค์อย่างชัดเจนและโปร่งใส..."
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-blue-700"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ระยะเวลาการเก็บรักษาข้อมูล (Retention Period)</label>
                <input
                  type="text"
                  value={retentionPeriod}
                  onChange={(e) => setRetentionPeriod(e.target.value)}
                  placeholder="เช่น ตลอดภาคเรียนที่ 1/2569"
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-blue-700"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Data Categories to Collect */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                <span>3. ข้อมูลส่วนบุคคลที่ขอจัดเก็บ (Categories)</span>
              </h3>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                หลัก Data Minimization
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              ตามหลักการ PDPA ควรเก็บเฉพาะข้อมูลที่จำเป็นต่อการทำงานของโครงงานเท่านั้น ไม่เก็บเกินความจำเป็น
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                onClick={() => toggleDataItem('nickname')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                  collectedData.nickname
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input type="checkbox" checked={collectedData.nickname} readOnly className="rounded text-emerald-600" />
                <span>ชื่อเล่น / Display Name</span>
              </label>

              <label
                onClick={() => toggleDataItem('score')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                  collectedData.score
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input type="checkbox" checked={collectedData.score} readOnly className="rounded text-emerald-600" />
                <span>คะแนน / สถิติผลงาน</span>
              </label>

              <label
                onClick={() => toggleDataItem('avatar')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                  collectedData.avatar
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input type="checkbox" checked={collectedData.avatar} readOnly className="rounded text-emerald-600" />
                <span>ภาพตัวละครอวตาร (Avatar)</span>
              </label>

              <label
                onClick={() => toggleDataItem('school_class')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                  collectedData.school_class
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input type="checkbox" checked={collectedData.school_class} readOnly className="rounded text-emerald-600" />
                <span>ระดับชั้น / ห้องเรียน</span>
              </label>

              <label
                onClick={() => toggleDataItem('photo_video')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                  collectedData.photo_video
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input type="checkbox" checked={collectedData.photo_video} readOnly className="rounded text-amber-600" />
                <span>ภาพถ่าย / วิดีโอผู้เล่น ⚠️</span>
              </label>

              <label
                onClick={() => toggleDataItem('voice_audio')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                  collectedData.voice_audio
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input type="checkbox" checked={collectedData.voice_audio} readOnly className="rounded text-amber-600" />
                <span>เสียงบันทึก (Voice / Mic)</span>
              </label>

              <label
                onClick={() => toggleDataItem('email')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                  collectedData.email
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input type="checkbox" checked={collectedData.email} readOnly className="rounded text-emerald-600" />
                <span>อีเมลสำหรับส่งผลคะแนน</span>
              </label>

              <label
                onClick={() => toggleDataItem('survey_ans')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                  collectedData.survey_ans
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input type="checkbox" checked={collectedData.survey_ans} readOnly className="rounded text-emerald-600" />
                <span>คำตอบแบบสอบถามความคิดเห็น</span>
              </label>
            </div>
          </div>

          {/* Section 4: Consent Checkboxes */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>4. เงื่อนไขการขอความยินยอม (Consent Clauses)</span>
            </h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentPlayScore}
                  onChange={(e) => setConsentPlayScore(e.target.checked)}
                  className="rounded text-emerald-600 mt-0.5 shrink-0"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  ยินยอมให้เก็บและประมวลผลข้อมูลการเล่นเกม/คะแนนเพื่อวัตถุประสงค์ในการศึกษา
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentShowLeaderboard}
                  onChange={(e) => setConsentShowLeaderboard(e.target.checked)}
                  className="rounded text-emerald-600 mt-0.5 shrink-0"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  ยินยอมให้แสดงชื่อเล่นและคะแนนบน Leaderboard ภายในห้องเรียน
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentMediaPublish}
                  onChange={(e) => setConsentMediaPublish(e.target.checked)}
                  className="rounded text-emerald-600 mt-0.5 shrink-0"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  (เพิ่มเติม) ยินยอมให้เผยแพร่ภาพถ่าย/วิดีโอนำเสนอผลงานบนสื่อประชาสัมพันธ์ของโรงเรียน
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <input
                  type="checkbox"
                  checked={guardianApproval}
                  onChange={(e) => setGuardianApproval(e.target.checked)}
                  className="rounded text-emerald-600 mt-0.5 shrink-0"
                />
                <span className="text-emerald-900 dark:text-emerald-200 font-semibold">
                  มีช่องให้ผู้ปกครองลงนามยินยอม (สำหรับผู้เยาว์ตาม พ.ร.บ. PDPA มาตรา 20)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 Document Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Bar Above Preview */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>ตัวอย่างเอกสาร A4 จำลอง (Mock Consent Form Preview)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกข้อความ</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์เอกสาร</span>
              </button>

              <button
                onClick={handleGeneratePDF}
                disabled={isExportingPdf}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังส่งออก...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* The A4 Sheet Box (Captured by html2canvas) */}
          <div className="overflow-x-auto pb-4">
            <div
              ref={printDocumentRef}
              style={{
                width: '100%',
                maxWidth: '794px', // standard 96dpi A4 pixel width ~794px
                minHeight: '1080px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: `'Sarabun', 'Prompt', 'Sukhumvit Set', sans-serif`,
              }}
              className="mx-auto bg-white p-8 sm:p-10 rounded-2xl border-2 border-slate-300 shadow-2xl relative text-slate-900 leading-normal"
            >
              {/* Document Header */}
              <div className="border-b-2 border-slate-800 pb-5 mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-emerald-800">
                      THAI PDPA COMPLIANCE · FOR DIGITAL EDUCATION
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-snug">
                      แบบขอความยินยอมและนโยบายความเป็นส่วนตัวสำหรับโครงงานดิจิทัล
                    </h2>
                    <div className="text-xs text-slate-600 font-medium">
                      ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">เลขที่เอกสาร</div>
                  <div className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {docRefNumber}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{studentSignDate}</div>
                </div>
              </div>

              {/* Institution & Creator Badges */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-5">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">สถานศึกษา / โรงเรียน:</span>
                  <span className="font-bold text-slate-900">{schoolName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">ผู้พัฒนาโครงงาน (Data Controller):</span>
                  <span className="font-bold text-slate-900">
                    {studentName} {studentNickname ? `(${studentNickname})` : ''} · {grade}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">ชื่อโครงงานดิจิทัล:</span>
                  <span className="font-bold text-emerald-800">{projectTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">แพลตฟอร์ม &amp; ครูที่ปรึกษา:</span>
                  <span className="font-semibold text-slate-800">
                    {projectPlatform} (ที่ปรึกษา: {advisorName})
                  </span>
                </div>
              </div>

              {/* Body Clauses */}
              <div className="space-y-4 text-xs text-slate-800 text-justify">
                {/* Clause 1 */}
                <div>
                  <div className="font-bold text-slate-950 text-xs flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center text-[10px]">1</span>
                    <span>วัตถุประสงค์ในการเก็บรวบรวมและใช้ข้อมูล (Purpose of Processing)</span>
                  </div>
                  <p className="text-[11px] text-slate-700 pl-5 leading-relaxed">
                    โครงงานนี้จัดทำขึ้นเพื่อการศึกษาในกลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ) 
                    โดยมีวัตถุประสงค์เพื่อ <strong className="text-slate-900">{customPurpose}</strong> 
                    ทั้งนี้ ผู้พัฒนาโครงงานจะไม่นำข้อมูลส่วนบุคคลดังกล่าวไปแสวงหาผลประโยชน์ทางการค้า หรือเปิดเผยแก่บุคคลภายนอกโดยมิชอบ
                  </p>
                </div>

                {/* Clause 2 */}
                <div>
                  <div className="font-bold text-slate-950 text-xs flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center text-[10px]">2</span>
                    <span>ประเภทข้อมูลส่วนบุคคลที่ขอจัดเก็บ (Data Categories)</span>
                  </div>
                  <p className="text-[11px] text-slate-700 pl-5 mb-1.5">
                    ผู้พัฒนาโครงงานยึดหลัก <em>การเก็บข้อมูลเท่าที่จำเป็น (Data Minimization)</em> โดยขอจัดเก็บข้อมูลดังต่อไปนี้:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pl-5 text-[11px]">
                    {collectedData.nickname && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>ชื่อเล่น หรือชื่อตัวละคร (Display Name)</span>
                      </div>
                    )}
                    {collectedData.score && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>คะแนนการเล่นและสถิติการทดสอบ (Score Log)</span>
                      </div>
                    )}
                    {collectedData.avatar && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>รูปภาพตัวละครอวตาร (Avatar)</span>
                      </div>
                    )}
                    {collectedData.school_class && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>ระดับชั้นและห้องเรียน (Grade &amp; Section)</span>
                      </div>
                    )}
                    {collectedData.photo_video && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>ภาพถ่ายหรือภาพเคลื่อนไหวขณะทำกิจกรรม (Photo/Video)</span>
                      </div>
                    )}
                    {collectedData.voice_audio && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>ข้อมูลเสียงบันทึก (Voice / Microphone Data)</span>
                      </div>
                    )}
                    {collectedData.email && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>ที่อยู่อีเมลเพื่อส่งรายงานหรือผลคะแนน</span>
                      </div>
                    )}
                    {collectedData.survey_ans && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>คำตอบแบบสอบถามความคิดเห็น (Survey Responses)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clause 3 */}
                <div>
                  <div className="font-bold text-slate-950 text-xs flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center text-[10px]">3</span>
                    <span>ระยะเวลาการจัดเก็บและความปลอดภัย (Storage &amp; Security)</span>
                  </div>
                  <p className="text-[11px] text-slate-700 pl-5 leading-relaxed">
                    ข้อมูลจะถูกจัดเก็บเป็นระยะเวลา <strong>{retentionPeriod}</strong> หลังจากนั้นข้อมูลจะถูกลบทิ้งหรือทำลายอย่างถาวร 
                    โดยข้อมูลทั้งหมดได้รับการจัดเก็บในระบบที่มีการกำหนดสิทธิ์เข้าถึงอย่างปลอดภัย
                  </p>
                </div>

                {/* Clause 4 */}
                <div>
                  <div className="font-bold text-slate-950 text-xs flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center text-[10px]">4</span>
                    <span>สิทธิของเจ้าของข้อมูลส่วนบุคคล (Data Subject Rights)</span>
                  </div>
                  <p className="text-[11px] text-slate-700 pl-5 leading-relaxed">
                    ตาม พ.ร.บ. PDPA เจ้าของข้อมูลมีสิทธิ: (1) สิทธิขอเข้าถึงและรับสำเนาข้อมูล, (2) สิทธิขอให้แก้ไขข้อมูลให้ถูกต้อง, 
                    (3) สิทธิขอลบหรือทำลายข้อมูล, และ (4) สิทธิขอเพิกถอนความยินยอมได้ตลอดเวลา โดยสามารถแจ้งแก่ผู้พัฒนาโครงงานหรือครูที่ปรึกษา ({advisorName})
                  </p>
                </div>

                {/* Clause 5: Consent Declaration Checkboxes */}
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 mt-3">
                  <div className="font-bold text-emerald-950 text-xs mb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>หนังสือให้ความยินยอม (Consent Agreement)</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded border border-emerald-700 bg-white flex items-center justify-center shrink-0 mt-0.5">
                        {consentPlayScore && <Check className="w-3 h-3 text-emerald-700" />}
                      </div>
                      <span className="text-slate-800">
                        ข้าพเจ้าได้อ่านและเข้าใจข้อความข้างต้นแล้ว และ<strong>ยินยอม</strong>ให้จัดเก็บและประมวลผลข้อมูลตามวัตถุประสงค์ที่ระบุ
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded border border-emerald-700 bg-white flex items-center justify-center shrink-0 mt-0.5">
                        {consentShowLeaderboard && <Check className="w-3 h-3 text-emerald-700" />}
                      </div>
                      <span className="text-slate-800">
                        <strong>ยินยอม</strong>ให้แสดงผลคะแนนและอันดับบนหน้าจอจัดอันดับ (Leaderboard) ของห้องเรียน
                      </span>
                    </div>

                    {consentMediaPublish && (
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded border border-emerald-700 bg-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-700" />
                        </div>
                        <span className="text-slate-800">
                          <strong>ยินยอม</strong>ให้บันทึกภาพถ่ายและวิดีโอเพื่อประกอบการนำเสนอโครงงานเชิงวิชาการ
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature Rows */}
                <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs mt-6 border-t border-slate-200">
                  {/* Signature 1: Student Creator */}
                  <div className="space-y-2">
                    <div className="h-10 flex items-end justify-center">
                      <div className="font-serif italic text-sm text-indigo-900 border-b border-dotted border-slate-400 w-36 pb-1">
                        {studentName}
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-900">({studentName})</div>
                    <div className="text-[10px] text-slate-500">ผู้พัฒนาโครงงาน / ผู้ควบคุมข้อมูล</div>
                  </div>

                  {/* Signature 2: Advisor Teacher */}
                  <div className="space-y-2">
                    <div className="h-10 flex items-end justify-center">
                      <div className="font-serif italic text-sm text-emerald-900 border-b border-dotted border-slate-400 w-36 pb-1">
                        {advisorName}
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-900">({advisorName})</div>
                    <div className="text-[10px] text-slate-500">ครูที่ปรึกษาโครงงาน</div>
                  </div>

                  {/* Signature 3: Guardian (if minor under 10-15 years) */}
                  {guardianApproval && (
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <div className="h-10 flex items-end justify-center">
                        <div className="font-serif italic text-sm text-slate-700 border-b border-dotted border-slate-400 w-36 pb-1">
                          ...................................................
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-900">({guardianName})</div>
                      <div className="text-[10px] text-slate-500">ผู้ปกครอง / ผู้ให้ความยินยอม</div>
                    </div>
                  )}
                </div>

                {/* Official Verification Stamp & Seal */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg border-2 border-emerald-700 text-emerald-800 flex items-center justify-center font-bold text-[9px]">
                      PDPA
                    </div>
                    <span>
                      หลักสูตรวิทยาการคำนวณ มาตรฐาน ว 4.2 สพฐ. &amp; สสวท. · รับรองโดย Coder Kids AI Studio
                    </span>
                  </div>
                  <div className="font-mono text-slate-400">
                    Ref: {docRefNumber}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Callout Box */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="font-bold flex items-center gap-2 text-sm text-amber-950 dark:text-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ความรู้คู่คุณธรรม: ทำไมโครงงาน Scratch &amp; Micro:bit ต้องมี PDPA?</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-800 dark:text-amber-300">
              แม้ว่าจะเป็นโครงงานในห้องเรียน แต่หากมีการจัดเก็บชื่อเพื่อน ภาพถ่าย หรือผลการเล่นเกม ก็ถือเป็นการประมวลผลข้อมูลส่วนบุคคล
              การสร้าง <strong>แบบขอความยินยอม (Consent Form)</strong> จะทำให้นักเรียนเข้าใจสิทธิของตนเอง เคารพสิทธิของเพื่อนร่วมชั้น
              และเป็นพื้นฐานสำคัญของการเป็นนวัตกรดิจิทัลในยุคปัญญาประดิษฐ์!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
