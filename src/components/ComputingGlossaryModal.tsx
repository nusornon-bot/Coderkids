import React, { useState } from 'react';
import {
  X,
  BookA,
  Search,
  Volume2,
  Sparkles,
  Code2,
  Cpu,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects.ts';

interface GlossaryTerm {
  id: string;
  enTerm: string;
  thTerm: string;
  phonetic: string;
  category: 'algorithm' | 'coding' | 'hardware' | 'security';
  categoryLabel: string;
  definition: string;
  metaphor: string;
  example: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'term_1',
    enTerm: 'Algorithm',
    thTerm: 'อัลกอริทึม (ขั้นตอนวิธี)',
    phonetic: 'แอล-เกอะ-ริ-เธิม',
    category: 'algorithm',
    categoryLabel: 'แนวคิดเชิงคำนวณ',
    definition: 'ชุดลำดับขั้นตอนการแก้ปัญหาหรือการทำงานที่ชัดเจน เป็นขั้นเป็นตอน ตั้งแต่เริ่มต้นจนได้ผลลัพธ์ที่ถูกต้อง',
    metaphor: 'เหมือน "สูตรทำไข่เจียว" ที่ต้องเรียงขั้นตอน ตอกไข่ -> ตีไข่ -> ตั้งกระทะ -> เทลงทอด ถ้าสลับขั้นตอนจะไม่ได้ไข่เจียวแสนอร่อย',
    example: '1. Start -> 2. Forward(10) -> 3. TurnRight(90) -> 4. End',
  },
  {
    id: 'term_2',
    enTerm: 'Variable',
    thTerm: 'ตัวแปร',
    phonetic: 'แว-ริ-อะ-เบิล',
    category: 'coding',
    categoryLabel: 'การเขียนโค้ด',
    definition: 'ชื่อที่ตั้งขึ้นเพื่อใช้เก็บข้อมูลในหน่วยความจำของคอมพิวเตอร์ ซึ่งค่าที่เก็บอยู่นี้สามารถเปลี่ยนแปลงได้ตลอดเวลา',
    metaphor: 'เหมือน "กล่องใส่ของที่แปะป้ายชื่อไว้" เช่น กล่องชื่อ score เราสามารถหยิบแต้มใส่เพิ่มหรือลดลงได้',
    example: 'set [score v] to [0] | change [score v] by (1)',
  },
  {
    id: 'term_3',
    enTerm: 'Loop (Iteration)',
    thTerm: 'การวนซ้ำ (ลูป)',
    phonetic: 'ลูป / อิ-เทอ-เร-ชัน',
    category: 'coding',
    categoryLabel: 'การเขียนโค้ด',
    definition: 'คำสั่งที่สั่งให้คอมพิวเตอร์ทำงานชุดเดิมซ้ำๆ หลายรอบตามจำนวนครั้งที่กำหนด หรือจนกว่าเงื่อนไขจะเป็นจริง',
    metaphor: 'เหมือน "เข็มนาฬิกาที่เดินวนรอบหน้าปัด" หรือการวิ่งรอบสนาม 5 รอบโดยไม่ต้องเขียนคำสั่งวิ่งทีละรอบ',
    example: 'repeat (10) [ move (10) steps ]',
  },
  {
    id: 'term_4',
    enTerm: 'Decomposition',
    thTerm: 'การแยกย่อยปัญหา',
    phonetic: 'ดี-คอม-โพ-ซิ-ชัน',
    category: 'algorithm',
    categoryLabel: 'แนวคิดเชิงคำนวณ',
    definition: 'การแตกปัญหาใหญ่หรือระบบที่ซับซ้อนออกเป็นส่วนย่อยๆ เพื่อให้วิเคราะห์ ทำความเข้าใจ และแก้ไขได้ง่ายขึ้น',
    metaphor: 'เหมือนการต่อตัวต่อเลโก้รูปปราสาท โดยเริ่มจากการต่อกำแพง หอคอย และประตูแยกกันก่อนนำมาประกอบ',
    example: 'สร้างเกม -> แยกทำ: 1. ตัวละครเดิน 2. ระบบนับแต้ม 3. ศัตรู 4. เสียงประกอบ',
  },
  {
    id: 'term_5',
    enTerm: 'Firmware',
    thTerm: 'เฟิร์มแวร์',
    phonetic: 'เฟิร์ม-แวร์',
    category: 'hardware',
    categoryLabel: 'ฮาร์ดแวร์ & IoT',
    definition: 'โปรแกรมซอฟต์แวร์ระดับต่ำที่ถูกบันทึกลงในหน่วยความจำถาวรของชิปฮาร์ดแวร์ เพื่อควบคุมการทำงานของอุปกรณ์โดยตรง',
    metaphor: 'เหมือน "จิตใต้สำนึกของหุ่นยนต์" ที่คอยสั่งให้อวัยวะและเซ็นเซอร์พร้อมทำงานทันทีที่เสียบปลั๊ก',
    example: 'ไฟล์ .HEX ที่เราดาวน์โหลดแฟลชลงไปในบอร์ด Micro:bit V2',
  },
  {
    id: 'term_6',
    enTerm: 'PDPA (Personal Data Protection Act)',
    thTerm: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล',
    phonetic: 'พี-ดี-พี-เอ',
    category: 'security',
    categoryLabel: 'ความปลอดภัยดิจิทัล',
    definition: 'กฎหมายที่ให้ความคุ้มครองข้อมูลที่สามารถระบุตัวตนของบุคคลได้ เพื่อไม่ให้ถูกนำไปใช้โดยไม่ได้รับความยินยอม',
    metaphor: 'เหมือน "กุญแจล็อคบ้านข้อมูลส่วนตัว" ที่คนอื่นจะเปิดดูหรือเอาไปบอกต่อไม่ได้ถ้าเราไม่อนุญาต',
    example: 'ไม่โพสต์ภาพเพื่อนหรือข้อมูลเบอร์โทรศัพท์ลงสาธารณะโดยไม่ได้รับอนุญาต',
  },
  {
    id: 'term_7',
    enTerm: 'Debugging',
    thTerm: 'การดีบัก (การไล่หาและแก้ไขจุดบกพร่อง)',
    phonetic: 'ดี-บัก-กิ้ง',
    category: 'coding',
    categoryLabel: 'การเขียนโค้ด',
    definition: 'กระบวนการค้นหา วิเคราะห์หาสาเหตุ และแก้ไขข้อผิดพลาด (Bug) ที่ทำให้โปรแกรมทำงานผิดเพี้ยนหรือไม่ทำงาน',
    metaphor: 'เหมือน "หมอตรวจคนไข้" ที่ต้องตรวจหาสาเหตุของโรคทีละจุดแล้วให้ยาที่ถูกต้อง ไม่ใช่การเดาสุ่ม',
    example: 'ตรวจหาว่าทำไมตัวละครเดินตกขอบจอ แล้วเพิ่มบล็อก if on edge, bounce',
  },
  {
    id: 'term_8',
    enTerm: 'Accelerometer',
    thTerm: 'เซ็นเซอร์วัดความเร่ง / การสั่นไหว',
    phonetic: 'แอค-เซ-เลอ-รอม-มิ-เทอร์',
    category: 'hardware',
    categoryLabel: 'ฮาร์ดแวร์ & IoT',
    definition: 'เซ็นเซอร์อิเล็กทรอนิกส์ที่วัดความเร่งและการเคลื่อนไหวใน 3 มิติ (แกน X, Y, Z) เช่น การเขย่า การเอียง หรือการตก',
    metaphor: 'เหมือน "น้ำในหูของมนุษย์" ที่คอยบอกว่าตอนนี้ร่างกายกำลังเอียงซ้าย เอียงขวา หรือกำลังสะบัดตัว',
    example: 'input.onGesture(Gesture.Shake, () => { ... })',
  },
];

interface ComputingGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComputingGlossaryModal: React.FC<ComputingGlossaryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpeakTerm = (term: GlossaryTerm) => {
    soundEffects.play('click');
    setSpeakingId(term.id);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(term.enTerm);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeakingId(null), 1000);
    }
  };

  const filteredTerms = GLOSSARY_TERMS.filter((t) => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const matchQuery =
      search.trim() === '' ||
      t.enTerm.toLowerCase().includes(search.toLowerCase()) ||
      t.thTerm.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <BookA className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  พจนานุกรมคำศัพท์วิทยาการคำนวณ (CS Glossary TH/EN) 📖
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  สองภาษา ไทย-อังกฤษ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                รวมคำศัพท์สำคัญพร้อมคำอ่าน คำอธิบายเปรียบเทียบ และตัวอย่างโค้ดที่เข้าใจง่าย
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'algorithm', label: '🧩 แนวคิดเชิงคำนวณ' },
              { id: 'coding', label: '💻 การเขียนโค้ด' },
              { id: 'hardware', label: '📟 ฮาร์ดแวร์ & IoT' },
              { id: 'security', label: '🛡️ ความปลอดภัยดิจิทัล' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  soundEffects.play('click');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหาคำศัพท์ไทย หรือ อังกฤษ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Term Cards Grid */}
        <div className="p-4 sm:p-6 flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTerms.map((term) => (
              <div
                key={term.id}
                className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors">
                        {term.enTerm}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleSpeakTerm(term)}
                        className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                        title="ฟังการออกเสียงภาษาอังกฤษ"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${speakingId === term.id ? 'animate-pulse text-amber-400' : ''}`} />
                      </button>
                    </div>
                    <div className="text-xs text-indigo-300 font-semibold mt-0.5">
                      {term.thTerm} <span className="text-slate-500 font-normal">[{term.phonetic}]</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-400 shrink-0">
                    {term.categoryLabel}
                  </span>
                </div>

                {/* Definition */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {term.definition}
                </p>

                {/* Metaphor / Analogy */}
                <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>เปรียบเทียบให้เห็นภาพ:</span>
                  </div>
                  <p className="text-slate-300 pl-5 leading-relaxed text-[11px]">
                    {term.metaphor}
                  </p>
                </div>

                {/* Code / Visual example */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80 font-mono text-[11px] text-emerald-400">
                  <span className="text-[10px] text-slate-500 font-sans block mb-0.5 font-bold uppercase tracking-wider">
                    ตัวอย่างโค้ดคำสั่ง:
                  </span>
                  {term.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
