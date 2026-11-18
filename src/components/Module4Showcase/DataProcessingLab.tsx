import React, { useState, useMemo } from 'react';
import {
  Table,
  BarChart3,
  MapPin,
  FileSpreadsheet,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Globe,
  Presentation,
  RotateCcw,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects.ts';

interface DataProcessingLabProps {
  addPoints: (points: number, reason?: string) => void;
  onComplete?: () => void;
}

interface LunchMenuRow {
  day: string;
  menu: string;
  category: 'ข้าว/จานเดียว' | 'ก๋วยเตี๋ยว' | 'เมนูสุขภาพ';
  calories: number;
  sugarGram: number;
  priceBaht: number;
  studentVotes: number;
}

const INITIAL_LUNCH_DATA: LunchMenuRow[] = [
  { day: 'จันทร์', menu: 'ข้าวผัดไข่ + แกงจืดเต้าหู้ตำลึง', category: 'ข้าว/จานเดียว', calories: 520, sugarGram: 4, priceBaht: 30, studentVotes: 42 },
  { day: 'อังคาร', menu: 'ก๋วยเตี๋ยวหมูสับผักรวม', category: 'ก๋วยเตี๋ยว', calories: 410, sugarGram: 3, priceBaht: 30, studentVotes: 38 },
  { day: 'พุธ', menu: 'ข้าวขาหมูเพิ่มหนัง + น้ำอัดลมหวาน', category: 'ข้าว/จานเดียว', calories: 790, sugarGram: 28, priceBaht: 45, studentVotes: 55 },
  { day: 'พฤหัสบดี', menu: 'ข้าวกล้องปลาแซลมอนย่าง + ผัดผักบุ้ง', category: 'เมนูสุขภาพ', calories: 480, sugarGram: 2, priceBaht: 40, studentVotes: 31 },
  { day: 'ศุกร์', menu: 'ข้าวราดแกงเขียวหวานไก่ + ผลไม้สด', category: 'เมนูสุขภาพ', calories: 510, sugarGram: 5, priceBaht: 35, studentVotes: 44 },
];

const MAP_LOCATIONS = [
  {
    id: 'loc_a',
    name: 'จุด A: หน้าโรงอาหารฝั่งทิศตะวันออก',
    footTraffic: 'สูงมาก (320 คน/วัน)',
    shade: 'มีหลังคาบังแดด-ฝน',
    distanceFromTrashPoint: '15 เมตร (ใกล้จุดคัดแยกเดิม)',
    suitability: 'เหมาะสมที่สุด (ติดตั้งจุดรับขยะรีไซเคิลอัจฉริยะ)',
    isBest: true,
    reason: 'มีนักเรียนเดินผ่านมากที่สุด มีหลังคาปกป้องอุปกรณ์เซ็นเซอร์ Micro:bit และสะดวกต่อการเก็บขน',
  },
  {
    id: 'loc_b',
    name: 'จุด B: กลางสนามฟุตบอล',
    footTraffic: 'ปานกลาง (110 คน/วัน)',
    shade: 'กลางแจ้ง ไม่มีหลังคา',
    distanceFromTrashPoint: '90 เมตร',
    suitability: 'ไม่เหมาะสม (ตากแดดตากฝน เสี่ยงวงจรเสียหาย)',
    isBest: false,
    reason: 'กลางแจ้งไม่มีหลังคา ทำให้บอร์ดและเซนเซอร์เปียกฝน และกีดขวางพื้นที่ออกกำลังกาย',
  },
  {
    id: 'loc_c',
    name: 'จุด C: หลังอาคารเก็บพัสดุ',
    footTraffic: 'ต่ำมาก (15 คน/วัน)',
    shade: 'มีร่มไม้',
    distanceFromTrashPoint: '120 เมตร',
    suitability: 'ไม่เหมาะสม (คนเดินผ่านน้อยและไกลจุดรวมขยะ)',
    isBest: false,
    reason: 'จุดสำรวจพบว่ามีผู้ใช้งานน้อยมาก ไม่คุ้มค่าต่อการวางจุดคัดแยกหลัก',
  },
];

const SOFTWARE_TASKS = [
  {
    id: 'sw_calc',
    task: 'ต้องการเก็บข้อมูลรายรับ-รายจ่าย และคำนวณผลรวมค่าอาหารกลางวัน 5 วัน พร้อมสร้างกราฟแท่งเปรียบเทียบ',
    options: ['โปรแกรมตารางทำงาน (Spreadsheet / Excel / Google Sheets)', 'โปรแกรมวาดภาพระบายสี (Paint)', 'โปรแกรมแก้ไขข้อความอย่างง่าย (Notepad)'],
    correctIdx: 0,
  },
  {
    id: 'sw_poster',
    task: 'ต้องการจัดทำโปสเตอร์หรือสไลด์นำเสนอสรุปผลเมนูอาหารสุขภาพหน้าชั้นเรียนให้น่าสนใจ',
    options: ['เครื่องคิดเลข (Calculator)', 'โปรแกรมนำเสนอ / ออกแบบ (PowerPoint / Google Slides / Canva)', 'โปรแกรมบีบอัดไฟล์ (WinRAR)'],
    correctIdx: 1,
  },
  {
    id: 'sw_survey',
    task: 'ต้องการสำรวจความคิดเห็นเพื่อนนักเรียนทั้งโรงเรียน 300 คนอย่างรวดเร็วและได้กราฟสรุปผลอัตโนมัติ (ป.5/4)',
    options: ['บริการแบบสอบถามออนไลน์ (Google Forms / Microsoft Forms)', 'ส่งจดหมายกระดาษทีละบ้าน', 'พิมพ์ลงในสมุดโน้ตทีละคน'],
    correctIdx: 0,
  },
];

const DATA_COMPLEX_QUIZ = {
  question: 'พิจารณาหลักการรวบรวม ประมวลผล และนำเสนอข้อมูล (ป.4/4 & ป.5/4) แล้วระบุว่าแต่ละข้อ "ถูกต้อง" หรือ "ไม่ถูกต้อง"',
  statements: [
    {
      text: 'การเรียงลำดับข้อมูล (Sorting) และจัดกลุ่มข้อมูลในโปรแกรมตารางทำงาน ช่วยให้เปรียบเทียบหาเมนูที่มีน้ำตาลน้อยที่สุดได้รวดเร็วขึ้น',
      isTrue: true,
    },
    {
      text: 'หากต้องการสำรวจพื้นที่และจัดทำแผนที่จุดติดตั้งถังขยะในโรงเรียน ควรเก็บข้อมูลจริงทั้งจำนวนคนเดินผ่าน สภาพหลังคา และระยะทางประกอบการตัดสินใจ',
      isTrue: true,
    },
    {
      text: 'การเลือกทางเลือกที่ดีที่สุดในการแก้ปัญหา ต้องยึดเฉพาะรายการที่ราคาถูกที่สุดเพียงอย่างเดียว โดยไม่ต้องสนคุณค่าหรือความเหมาะสม',
      isTrue: false,
    },
    {
      text: 'เราสามารถเผยแพร่และนำเสนอข้อมูลผลการสำรวจต่อสาธารณะอย่างเป็นระบบผ่านทาง Blog หรือหน้าเว็บ (Web Page) เพื่อสื่อสารให้ผู้อื่นเข้าใจง่ายได้',
      isTrue: true,
    },
  ],
  explanation:
    'การสร้างทางเลือก (ป.4/4) ต้องเทียบหลายเกณฑ์ทั้งคุณค่า โภชนาการ/ความปลอดภัย และราคา ไม่ดูแค่ราคาอย่างเดียว ส่วนการสำรวจและนำเสนอผ่านตาราง/Blog/Web Page ตรงตาม ป.5/4',
};

export const DataProcessingLab: React.FC<DataProcessingLabProps> = ({ addPoints, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'survey' | 'blog' | 'quiz'>('spreadsheet');

  // Spreadsheet controls (ป.4/4)
  const [categoryFilter, setCategoryFilter] = useState<string>('ทั้งหมด');
  const [sortBy, setSortBy] = useState<'day' | 'calories' | 'sugarGram' | 'studentVotes'>('day');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedAlternative, setSelectedAlternative] = useState<'healthy' | 'junk'>('healthy');

  // Local Survey Map & Poll (ป.5/4)
  const [selectedLocId, setSelectedLocId] = useState<string>('loc_a');
  const [pollVotes, setPollVotes] = useState<{ label: string; votes: number }[]>([
    { label: 'เมนูข้าวกล้อง + ปลา + ผัก', votes: 48 },
    { label: 'ก๋วยเตี๋ยวหมูผักรวม', votes: 36 },
    { label: 'ของทอด + น้ำอัดลม', votes: 22 },
  ]);

  // Software task matcher
  const [swAnswers, setSwAnswers] = useState<Record<string, number>>({});

  // Live Student Blog / Web Page Builder (ป.5/4)
  const [blogTitle, setBlogTitle] = useState<string>('รายงานผลสำรวจเมนูอาหารกลางวัน 5 วัน เพื่อสุขภาพเด็ก ป.6');
  const [blogAuthor, setBlogAuthor] = useState<string>('ทีมนักสำรวจข้อมูล ป.6/1');
  const [blogSummary, setBlogSummary] = useState<string>(
    'จากการเก็บข้อมูลเมนูอาหาร 5 วันด้วยตารางทำงาน พบว่าเมนูวันพุธมีน้ำตาลสูงถึง 28 กรัม จึงเสนอทางเลือกเปลี่ยนเป็นน้ำเปล่าและเพิ่มผลไม้สด ทำให้ค่าเฉลี่ยพลังงานสมดุลขึ้น!'
  );

  // Complex quiz
  const [quizAns, setQuizAns] = useState<Record<number, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [rewarded, setRewarded] = useState<boolean>(false);

  const filteredAndSortedRows = useMemo(() => {
    const base =
      categoryFilter === 'ทั้งหมด'
        ? INITIAL_LUNCH_DATA
        : INITIAL_LUNCH_DATA.filter((r) => r.category === categoryFilter);

    if (sortBy === 'day') return base;
    return [...base].sort((a, b) => (sortAsc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]));
  }, [categoryFilter, sortBy, sortAsc]);

  const totals = useMemo(() => {
    const count = filteredAndSortedRows.length || 1;
    const sumCal = filteredAndSortedRows.reduce((acc, r) => acc + r.calories, 0);
    const sumSugar = filteredAndSortedRows.reduce((acc, r) => acc + r.sugarGram, 0);
    const sumVotes = filteredAndSortedRows.reduce((acc, r) => acc + r.studentVotes, 0);
    return {
      sumCal,
      avgCal: Math.round(sumCal / count),
      sumSugar,
      avgSugar: (sumSugar / count).toFixed(1),
      sumVotes,
    };
  }, [filteredAndSortedRows]);

  const toggleSort = (col: 'calories' | 'sugarGram' | 'studentVotes') => {
    soundEffects.play('click');
    if (sortBy === col) {
      setSortAsc((v) => !v);
    } else {
      setSortBy(col);
      setSortAsc(true);
    }
  };

  const handleVotePoll = (idx: number) => {
    soundEffects.play('click');
    setPollVotes((prev) => prev.map((p, i) => (i === idx ? { ...p, votes: p.votes + 1 } : p)));
  };

  const totalPollVotes = pollVotes.reduce((a, b) => a + b.votes, 0) || 1;

  const handleCheckQuiz = () => {
    setQuizSubmitted(true);
    const ok = DATA_COMPLEX_QUIZ.statements.every((st, i) => quizAns[i] === st.isTrue);
    if (ok) {
      soundEffects.play('correct');
      if (!rewarded) {
        setRewarded(true);
        addPoints(25, 'ผ่านแบบประเมินการรวบรวมและประมวลผลข้อมูล ป.4/4–ป.5/4');
        onComplete?.();
      }
    } else {
      soundEffects.play('error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-400">
            <FileSpreadsheet className="w-4 h-4" />
            <span>มาตรฐาน ว 4.2 ป.4/4 &amp; ป.5/4</span>
            <span aria-hidden="true">·</span>
            <span>รวบรวม ประมวลผล และนำเสนอข้อมูลด้วยซอฟต์แวร์หลากหลาย</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            ห้องปฏิบัติการจัดการข้อมูล ตารางทำงาน &amp; นำเสนอผ่าน Blog/Web
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            ฝึกเก็บและประมวลผลข้อมูลอาหารกลางวัน 5 วัน (จัดกลุ่ม เรียงลำดับ หาผลรวม/ค่าเฉลี่ย) วิเคราะห์แบบสอบถาม &amp; แผนที่สำรวจพื้นที่ และสร้างหน้า Blog นำเสนอข้อมูล
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('spreadsheet')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === 'spreadsheet'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            1. ตารางอาหารกลางวัน 5 วัน (ป.4/4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('survey')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === 'survey'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            2. แบบสอบถาม &amp; แผนที่พื้นที่ (ป.5/4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blog')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === 'blog'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            3. ซอฟต์แวร์ &amp; Blog/Web (ป.5/4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            4. โจทย์ O-NET เชิงซ้อน
          </button>
        </div>
      </div>

      {/* TAB 1: SPREADSHEET & ALTERNATIVE EVALUATION (ป.4/4) */}
      {activeTab === 'spreadsheet' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">จัดกลุ่มข้อมูล (Filter):</span>
              {['ทั้งหมด', 'ข้าว/จานเดียว', 'ก๋วยเตี๋ยว', 'เมนูสุขภาพ'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setCategoryFilter(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                    categoryFilter === cat
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">เรียงลำดับ (Sort):</span>
              <button
                type="button"
                onClick={() => toggleSort('calories')}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer flex items-center gap-1"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                <span>พลังงาน {sortBy === 'calories' ? (sortAsc ? '↑' : '↓') : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSort('sugarGram')}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer flex items-center gap-1"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                <span>น้ำตาล {sortBy === 'sugarGram' ? (sortAsc ? '↑' : '↓') : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSort('studentVotes')}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer flex items-center gap-1"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                <span>ผลโหวต {sortBy === 'studentVotes' ? (sortAsc ? '↑' : '↓') : ''}</span>
              </button>
            </div>
          </div>

          {/* Interactive Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                  <th className="py-3 px-4">วัน</th>
                  <th className="py-3 px-4">เมนูอาหารกลางวัน</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4 text-right">พลังงาน (kcal)</th>
                  <th className="py-3 px-4 text-right">น้ำตาล (กรัม)</th>
                  <th className="py-3 px-4 text-right">ราคา (บาท)</th>
                  <th className="py-3 px-4 text-right">โหวตชอบ (คน)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredAndSortedRows.map((row) => (
                  <tr key={row.day} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{row.day}</td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{row.menu}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {row.calories}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        row.sugarGram > 15 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {row.sugarGram} g
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{row.priceBaht}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">{row.studentVotes}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-purple-50/70 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800 font-bold text-slate-900 dark:text-white">
                  <td colSpan={3} className="py-3 px-4">
                    สรุปผลรวม &amp; ค่าเฉลี่ยอัตโนมัติ (SUM / AVERAGE) · {filteredAndSortedRows.length} วัน
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    รวม {totals.sumCal} (เฉลี่ย {totals.avgCal})
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    รวม {totals.sumSugar}g (เฉลี่ย {totals.avgSugar}g)
                  </td>
                  <td className="py-3 px-4 text-right font-mono">—</td>
                  <td className="py-3 px-4 text-right font-mono text-purple-700 dark:text-purple-300">
                    รวม {totals.sumVotes} โหวต
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Alternative Creation & Comparison (ป.4/4) */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-purple-600" />
              <span>สร้างและประเมินทางเลือกเมนูอาหารวันพุธ (เปรียบเทียบข้อมูลเพื่อตัดสินใจ · ป.4/4):</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('correct');
                  setSelectedAlternative('healthy');
                  addPoints(10, 'ประเมินและเลือกทางเลือกเมนูสุขภาพถูกต้อง (ป.4/4)');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedAlternative === 'healthy'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="font-bold">ทางเลือก A (แนะนำ): ข้าวอบอกไก่ + ผักลวก + น้ำเปล่า (490 kcal, น้ำตาล 3g, 35 บาท)</div>
                <p className="mt-1 opacity-85">ได้สารอาหารครบ 5 หมู่ ลดน้ำตาลลง 25 กรัม และประหยัดงบประมาณได้ 10 บาท</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('error');
                  setSelectedAlternative('junk');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedAlternative === 'junk'
                    ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="font-bold">ทางเลือก B: ข้าวขาหมูเพิ่มหนัง + น้ำอัดลมหวาน (790 kcal, น้ำตาล 28g, 45 บาท)</div>
                <p className="mt-1 opacity-85">แม้ผลโหวตความชอบจะสูง แต่ไขมันและน้ำตาลเกินมาตรฐานเด็กประถม</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ONLINE POLL & LOCAL SURVEY MAP (ป.5/4) */}
      {activeTab === 'survey' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Online Poll */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>จำลองแบบสำรวจความคิดเห็นออนไลน์ (ป.5/4)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              ลองกดโหวตเพื่อดูการประมวลผลกราฟสถิติแบบเรียลไทม์ (รวม {totalPollVotes} คำตอบ):
            </p>
            <div className="space-y-3">
              {pollVotes.map((item, idx) => {
                const pct = Math.round((item.votes / totalPollVotes) * 100);
                return (
                  <div key={item.label} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => handleVotePoll(idx)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold cursor-pointer shrink-0"
                      >
                        +1 โหวต
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 w-16 text-right">
                        {item.votes} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Local Area Survey Map & Location Analysis */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>สำรวจข้อมูลพื้นที่จริงและแผนที่โรงเรียน เพื่อเลือกจุดวางถังขยะคัดแยกอัจฉริยะ (ป.5/4)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MAP_LOCATIONS.map((loc) => {
                const selected = selectedLocId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      soundEffects.play(loc.isBest ? 'correct' : 'click');
                      setSelectedLocId(loc.id);
                    }}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer space-y-1.5 ${
                      selected
                        ? loc.isBest
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-200'
                          : 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">{loc.name}</div>
                    <div className="text-[11px] opacity-85">คนเดินผ่าน: {loc.footTraffic}</div>
                    <div className="text-[11px] opacity-85">สภาพพื้นที่: {loc.shade}</div>
                    <div className="text-[11px] opacity-85">ระยะห่าง: {loc.distanceFromTrashPoint}</div>
                  </button>
                );
              })}
            </div>

            {(() => {
              const activeLoc = MAP_LOCATIONS.find((l) => l.id === selectedLocId) || MAP_LOCATIONS[0];
              return (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    activeLoc.isBest
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="font-bold">ผลการประเมิน {activeLoc.name}: {activeLoc.suitability}</div>
                  <p className="mt-1 opacity-90">{activeLoc.reason}</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: SOFTWARE MATCHER & BLOG/WEB PAGE BUILDER */}
      {activeTab === 'blog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Software Selection Exercise */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Presentation className="w-4 h-4 text-indigo-600" />
              <span>เลือกใช้ซอฟต์แวร์ให้เหมาะกับลักษณะงาน (ป.4/4 &amp; ป.5/4)</span>
            </div>
            <div className="space-y-4">
              {SOFTWARE_TASKS.map((item, qIdx) => {
                const picked = swAnswers[item.id];
                return (
                  <div key={item.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {qIdx + 1}. {item.task}
                    </div>
                    <div className="space-y-1.5">
                      {item.options.map((opt, oIdx) => {
                        const isPicked = picked === oIdx;
                        const isRight = oIdx === item.correctIdx;
                        let cls = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400';
                        if (picked !== undefined) {
                          if (isRight) cls = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
                          else if (isPicked) cls = 'bg-rose-50 border-rose-300 text-rose-900';
                        }
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => {
                              soundEffects.play(oIdx === item.correctIdx ? 'correct' : 'error');
                              setSwAnswers((prev) => ({ ...prev, [item.id]: oIdx }));
                              if (oIdx === item.correctIdx) {
                                addPoints(5, 'เลือกใช้ซอฟต์แวร์เหมาะสมกับงานข้อมูล');
                              }
                            }}
                            className={`w-full text-left p-2.5 rounded-lg border text-[11px] cursor-pointer flex items-center justify-between gap-2 ${cls}`}
                          >
                            <span>{opt}</span>
                            {picked !== undefined && isRight && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            {picked !== undefined && isPicked && !isRight && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini Blog / Web Page Presentation Preview (ป.5/4) */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>จำลองสร้าง Blog / เว็บเพจนำเสนอผลการสำรวจข้อมูล (ป.5/4)</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">หัวข้อบทความ Blog / Web Page:</label>
                <input
                  type="text"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ผู้จัดทำ / แหล่งข้อมูล:</label>
                <input
                  type="text"
                  value={blogAuthor}
                  onChange={(e) => setBlogAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">สรุปผลการวิเคราะห์ข้อมูล:</label>
                <textarea
                  rows={3}
                  value={blogSummary}
                  onChange={(e) => setBlogSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* Live Web Page Preview */}
            <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span>https://school-data-blog.local/nutrition-report</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[11px] text-purple-600 font-bold">Student Data Blog · {blogAuthor}</div>
                <h5 className="text-sm font-black text-slate-900 dark:text-white">{blogTitle}</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{blogSummary}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="text-slate-400">พลังงานเฉลี่ย</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">{totals.avgCal} kcal</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="text-slate-400">น้ำตาลเฉลี่ย</div>
                    <div className="font-mono font-bold text-emerald-600">{totals.avgSugar} g</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="text-slate-400">เสียงโหวต</div>
                    <div className="font-mono font-bold text-indigo-600">{totals.sumVotes} คน</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLEX CHOICE CHECKPOINT */}
      {activeTab === 'quiz' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-indigo-600">
                แบบฝึกหัดเลือกตอบเชิงซ้อน O-NET (ป.4/4 &amp; ป.5/4)
              </span>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {DATA_COMPLEX_QUIZ.question}
              </h4>
            </div>
            {quizSubmitted && (
              <button
                type="button"
                onClick={() => {
                  setQuizAns({});
                  setQuizSubmitted(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ทำใหม่</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold">
                  <th className="py-3 px-4">ข้อความที่พิจารณา</th>
                  <th className="py-3 px-4 text-center w-28">ถูกต้อง</th>
                  <th className="py-3 px-4 text-center w-28">ไม่ถูกต้อง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {DATA_COMPLEX_QUIZ.statements.map((st, idx) => {
                  const val = quizAns[idx];
                  const isOk = quizSubmitted && val === st.isTrue;
                  const isBad = quizSubmitted && val !== st.isTrue;
                  return (
                    <tr key={idx} className={isOk ? 'bg-emerald-50/70' : isBad ? 'bg-rose-50/70' : ''}>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                        <strong className="mr-1.5">{idx + 1}.</strong>
                        {st.text}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => setQuizAns((prev) => ({ ...prev, [idx]: true }))}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                            val === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          ถูกต้อง
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => setQuizAns((prev) => ({ ...prev, [idx]: false }))}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                            val === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          ไม่ถูกต้อง
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {quizSubmitted ? (
              <div className="flex-1 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong>เฉลย:</strong> {DATA_COMPLEX_QUIZ.explanation}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500">เลือกคำตอบครบ 4 ข้อย่อยแล้วกดตรวจคำตอบ</span>
            )}

            {!quizSubmitted && (
              <button
                type="button"
                disabled={DATA_COMPLEX_QUIZ.statements.some((_, idx) => quizAns[idx] === undefined)}
                onClick={handleCheckQuiz}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>ตรวจคำตอบเชิงซ้อน</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
