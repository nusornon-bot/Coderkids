import React, { useState, useMemo } from 'react';
import {
  Search,
  Globe,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  BookOpen,
  Sparkles,
  Award,
  RotateCcw,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects.ts';

interface InternetSearchLabProps {
  addPoints: (points: number, reason?: string) => void;
  onComplete?: () => void;
}

interface MockSearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  fileType: 'html' | 'pdf';
  isAd: boolean;
  trustLevel: 'high' | 'medium' | 'low';
  author: string;
  publishedYear: number;
  snippet: string;
  keywords: string[];
  trustReason: string;
}

const SEARCH_DATASET: MockSearchResult[] = [
  {
    id: 'res_ad1',
    title: 'โฆษณา: เครื่องกรองน้ำวิเศษดื่มแล้วรักษาได้ทุกโรค ลด 80% วันนี้!',
    url: 'https://super-miracle-shop.example.com/promo',
    domain: 'super-miracle-shop.example.com',
    fileType: 'html',
    isAd: true,
    trustLevel: 'low',
    author: 'ไม่ระบุผู้เขียน (เพจขายสินค้า)',
    publishedYear: 2026,
    snippet: 'การันตีหายขาดใน 3 วัน ไม่ต้องไปหาหมอ กดสั่งซื้อด่วนจำนวนจำกัด รีวิว 100% พลังงานควอนตัมบำบัดน้ำดื่ม',
    keywords: ['น้ำดื่ม', 'สุขภาพ', 'เครื่องกรองน้ำ', 'รักษาโรค', 'ประหยัดพลังงาน'],
    trustReason: 'เป็นโฆษณา (Sponsored) ที่กล่าวอ้างเกินจริง ไม่มีงานวิจัยรองรับ และไม่ระบุผู้เขียนหรือหน่วยงานรับรอง',
  },
  {
    id: 'res_gov1',
    title: 'แนวทางการดื่มน้ำสะอาดและโภชนาการสำหรับเด็กวัยเรียน (PDF)',
    url: 'https://nutrition.anamai.moph.go.th/water-guide-2568.pdf',
    domain: 'anamai.moph.go.th',
    fileType: 'pdf',
    isAd: false,
    trustLevel: 'high',
    author: 'กรมอนามัย กระทรวงสาธารณสุข',
    publishedYear: 2025,
    snippet: 'เด็กประถมควรดื่มน้ำสะอาดวันละ 6–8 แก้ว หลีกเลี่ยงเครื่องดื่มรสหวานจัดเพื่อลดความเสี่ยงฟันผุและโรคอ้วน',
    keywords: ['น้ำดื่ม', 'สุขภาพ', 'เด็กประถม', 'โภชนาการ', 'กรมอนามัย'],
    trustReason: 'โดเมนราชการ (.go.th) จากกรมอนามัย มีปีที่เผยแพร่ชัดเจน ระบุผู้รับผิดชอบและอ้างอิงข้อมูลทางวิชาการ',
  },
  {
    id: 'res_ac1',
    title: 'เอกสารประกอบการเรียน: พลังงานแสงอาทิตย์และการอนุรักษ์พลังงาน ป.6',
    url: 'https://science.ipst.ac.th/docs/solar-energy-p6.pdf',
    domain: 'ipst.ac.th',
    fileType: 'pdf',
    isAd: false,
    trustLevel: 'high',
    author: 'สสวท. (สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี)',
    publishedYear: 2025,
    snippet: 'พลังงานแสงอาทิตย์เป็นพลังงานสะอาดที่เปลี่ยนแสงอาทิตย์เป็นไฟฟ้าด้วยโซลาร์เซลล์ ช่วยลดการใช้เชื้อเพลิงฟอสซิล',
    keywords: ['พลังงานแสงอาทิตย์', 'โซลาร์เซลล์', 'อนุรักษ์พลังงาน', 'วิทยาศาสตร์'],
    trustReason: 'โดเมนสถาบันการศึกษา (.ac.th) โดย สสวท. เนื้อหาตรงตามหลักสูตรและตรวจสอบได้',
  },
  {
    id: 'res_go2',
    title: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) ฉบับเข้าใจง่ายสำหรับเยาวชน',
    url: 'https://www.pdpc.or.th/youth-pdpa-guide',
    domain: 'pdpc.or.th',
    fileType: 'html',
    isAd: false,
    trustLevel: 'high',
    author: 'สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)',
    publishedYear: 2025,
    snippet: 'สิทธิของเจ้าของข้อมูลส่วนบุคคล การขอความยินยอมก่อนถ่ายภาพและเผยแพร่บนสื่อออนไลน์สำหรับนักเรียน',
    keywords: ['pdpa', 'ข้อมูลส่วนบุคคล', 'กฎหมาย', 'ความปลอดภัยออนไลน์'],
    trustReason: 'เว็บไซต์ทางการของหน่วยงานกำกับดูแลกฎหมาย PDPA โดยตรง ข้อมูลถูกต้องและเป็นปัจจุบัน',
  },
  {
    id: 'res_blog1',
    title: 'รวมไอเดียประหยัดไฟฟ้าในบ้าน ทำได้ง่าย ๆ ด้วยวิธีธรรมชาติ',
    url: 'https://eco-living-blog.example.org/save-energy',
    domain: 'eco-living-blog.example.org',
    fileType: 'html',
    isAd: false,
    trustLevel: 'medium',
    author: 'ชมรมรักษ์โลกอาสา',
    publishedYear: 2024,
    snippet: 'ปิดสวิตช์และถอดปลั๊กเครื่องใช้ไฟฟ้าเมื่อไม่ใช้งาน ตั้งอุณหภูมิแอร์ที่ 26 องศาเซลเซียส และเปิดหน้าต่างรับลม',
    keywords: ['อนุรักษ์พลังงาน', 'ประหยัดไฟฟ้า', 'พลังงานแสงอาทิตย์', 'สิ่งแวดล้อม'],
    trustReason: 'บทความให้ความรู้ทั่วไปที่สมเหตุสมผล แต่ควรตรวจสอบเทียบกับข้อมูลจากหน่วยงานด้านพลังงานเพิ่มเติม',
  },
  {
    id: 'res_fake1',
    title: 'แชร์ด่วน! ดื่มน้ำมะนาวร้อนกับเกลือทุกเช้า รักษาอาการปวดท้องและไวรัสได้ 100%',
    url: 'https://forward-news-24h.example.net/lemon-cure',
    domain: 'forward-news-24h.example.net',
    fileType: 'html',
    isAd: false,
    trustLevel: 'low',
    author: 'แอดมินข่าวไว (ไม่มีแหล่งอ้างอิง)',
    publishedYear: 2019,
    snippet: 'มีคนแชร์ต่อกันเยอะมาก ลองทำตามดูได้เลย ไม่ต้องไปโรงพยาบาล ประหยัดเงินและหายทันใจแน่นอน',
    keywords: ['น้ำดื่ม', 'สุขภาพ', 'รักษาโรค'],
    trustReason: 'เว็บข่าวลือ ไม่มีชื่อแพทย์/สถาบันอ้างอิง ใช้คำชวนเชื่อ "100% แชร์ด่วน" และข้อมูลเก่าตั้งแต่ปี 2019',
  },
];

const OPERATOR_GUIDE = [
  {
    op: '"..."',
    name: 'อัญประกาศ (Exact Match)',
    example: '"พลังงานแสงอาทิตย์"',
    usage: 'ค้นหาคำหรือวลีนี้เรียงติดกันตรงตัว ไม่แยกคำ',
  },
  {
    op: '-',
    name: 'เครื่องหมายลบ (Exclude)',
    example: 'พลังงาน -โฆษณา',
    usage: 'ตัดผลลัพธ์ที่มีคำด้านหลังเครื่องหมายลบออก',
  },
  {
    op: 'OR',
    name: 'หรือ (OR ตัวพิมพ์ใหญ่)',
    example: 'PDPA OR ข้อมูลส่วนบุคคล',
    usage: 'ค้นหาหน้าเว็บที่มีคำใดคำหนึ่งหรือทั้งสองคำ',
  },
  {
    op: 'site:',
    name: 'เจาะจงเว็บไซต์/โดเมน',
    example: 'site:go.th น้ำดื่ม',
    usage: 'ค้นหาเฉพาะจากเว็บราชการ (.go.th) หรือสถาบันศึกษา (.ac.th)',
  },
  {
    op: 'filetype:',
    name: 'เจาะจงชนิดไฟล์',
    example: 'filetype:pdf พลังงานแสงอาทิตย์',
    usage: 'ค้นหาเฉพาะเอกสาร เช่น ไฟล์ PDF, PPT, DOC',
  },
];

interface CrossCheckCase {
  id: string;
  topic: string;
  sources: {
    name: string;
    domain: string;
    date: string;
    claim: string;
    evidence: string;
    isReliable: boolean;
  }[];
  summaryOptions: string[];
  bestSummaryIdx: number;
  explanation: string;
}

const CROSS_CHECK_CASES: CrossCheckCase[] = [
  {
    id: 'case_energy',
    topic: 'กรณีศึกษา 1: การประหยัดไฟฟ้าและพลังงานแสงอาทิตย์ในโรงเรียน',
    sources: [
      {
        name: 'สสวท. (ipst.ac.th)',
        domain: 'สถาบันวิชาการ (.ac.th)',
        date: 'พ.ศ. 2568',
        claim: 'แผงโซลาร์เซลล์เปลี่ยนพลังงานแสงเป็นไฟฟ้าได้จริง เหมาะกับอาคารเรียนที่รับแดดช่วงกลางวัน',
        evidence: 'มีสูตรคำนวณกำลังไฟฟ้าและตัวอย่างโรงเรียนต้นแบบ',
        isReliable: true,
      },
      {
        name: 'การไฟฟ้าฝ่ายผลิต (egat.co.th)',
        domain: 'รัฐวิสาหกิจ (.co.th ทางการ)',
        date: 'พ.ศ. 2568',
        claim: 'การล้างแอร์สม่ำเสมอและตั้งอุณหภูมิ 26°C พร้อมติดฉลากเบอร์ 5 ลดค่าไฟได้ 10–15%',
        evidence: 'อ้างอิงสถิติทดสอบจริงในห้องปฏิบัติการ',
        isReliable: true,
      },
      {
        name: 'เพจขายอุปกรณ์เสียบปลั๊กประหยัดไฟ (shop-fast.net)',
        domain: 'เว็บร้านค้าทั่วไป (.net)',
        date: 'ไม่ระบุวันที่',
        claim: 'เสียบกล่องวิเศษนี้ที่ปลั๊กไฟบ้าน ลดค่าไฟทันที 90% ภายใน 1 เดือน!',
        evidence: 'มีแต่คำรีวิวไม่มีชื่อผู้เชี่ยวชาญหรือเอกสารรับรอง',
        isReliable: false,
      },
    ],
    summaryOptions: [
      'ควรซื้อกล่องเสียบปลั๊กประหยัดไฟมาติดทุกห้องเรียนเพราะลดค่าไฟได้ถึง 90% ทันที',
      'โรงเรียนสามารถลดค่าไฟอย่างยั่งยืนได้ด้วยการตั้งแอร์ 26°C ใช้ฉลากเบอร์ 5 และเสริมด้วยโซลาร์เซลล์ในช่วงกลางวัน',
      'แผงโซลาร์เซลล์ใช้ได้เฉพาะตอนกลางคืนและไม่สามารถผลิตไฟฟ้าได้จริง',
    ],
    bestSummaryIdx: 1,
    explanation:
      'การสรุปใจความสำคัญ (บูรณาการภาษาไทย) ต้องยึดข้อเท็จจริงที่สอดคล้องกันจากแหล่งที่น่าเชื่อถือหลายแหล่ง (สสวท. และ กฟผ.) และตัดคำโฆษณาเกินจริงออก',
  },
  {
    id: 'case_health',
    topic: 'กรณีศึกษา 2: การดื่มน้ำและดูแลสุขภาพในฤดูร้อน',
    sources: [
      {
        name: 'กรมอนามัย (anamai.moph.go.th)',
        domain: 'หน่วยงานราชการ (.go.th)',
        date: 'พ.ศ. 2568',
        claim: 'เด็กวัยเรียนควรจิบน้ำสะอาดบ่อย ๆ วันละ 6–8 แก้ว เพื่อป้องกันภาวะขาดน้ำและลดน้ำตาลจากน้ำอัดลม',
        evidence: 'คำแนะนำโดยนักโภชนาการและกุมารแพทย์',
        isReliable: true,
      },
      {
        name: 'คณะแพทยศาสตร์ (.ac.th)',
        domain: 'มหาวิทยาลัย (.ac.th)',
        date: 'พ.ศ. 2568',
        claim: 'หากออกกำลังกายกลางแจ้งควรพักดื่มน้ำสะอาดในที่ร่ม ไม่ควรดื่มน้ำเย็นจัดรวดเดียวปริมาณมากเกินไป',
        evidence: 'เผยแพร่ในวารสารสุขภาพประชาชน',
        isReliable: true,
      },
      {
        name: 'ข้อความลูกโซ่แชร์ต่อ (forward-news.net)',
        domain: 'เว็บข่าวลือไม่ระบุผู้เขียน',
        date: 'พ.ศ. 2562',
        claim: 'ดื่มน้ำมะนาวผสมเกลือ 1 แก้วรักษาโรคไวรัสและอาการปวดท้องได้ 100% ไม่ต้องพบแพทย์',
        evidence: 'ไม่มีชื่อผู้เขียนและไม่มีผลวิจัยทางการแพทย์',
        isReliable: false,
      },
    ],
    summaryOptions: [
      'เด็กวัยเรียนควรจิบน้ำสะอาดวันละ 6–8 แก้วอย่างสม่ำเสมอ โดยเฉพาะช่วงอากาศร้อนหรือหลังออกกำลังกาย และลดเครื่องดื่มหวาน',
      'เมื่อมีอาการเจ็บป่วยไม่ควรพบแพทย์ ให้ดื่มน้ำมะนาวผสมเกลือแทนเพราะรักษาได้ทุกโรค 100%',
      'ไม่ควรดื่มน้ำในเวลากลางวันเลยเพราะอาจทำให้เกิดภาวะขาดน้ำได้',
    ],
    bestSummaryIdx: 0,
    explanation:
      'ข้อมูลจากกรมอนามัยและคณะแพทยศาสตร์สอดคล้องกันและเป็นปัจจุบัน ส่วนข้อความลูกโซ่ที่อ้างว่ารักษาได้ 100% ไม่น่าเชื่อถือ',
  },
];

interface ComplexEvalStatement {
  text: string;
  isTrue: boolean;
}

const COMPLEX_EVAL_QUIZ: {
  id: string;
  question: string;
  statements: ComplexEvalStatement[];
  explanation: string;
}[] = [
  {
    id: 'ce_search_1',
    question:
      'พิจารณาข้อความเกี่ยวกับเทคนิคการสืบค้นข้อมูลและการจัดอันดับของ Search Engine แล้วระบุว่าแต่ละข้อ "ถูกต้อง" หรือ "ไม่ถูกต้อง"',
    statements: [
      {
        text: 'การพิมพ์ site:ac.th ตามด้วยคำค้น ช่วยจำกัดผลการค้นหาให้อยู่ในเว็บไซต์ของสถาบันการศึกษาได้',
        isTrue: true,
      },
      {
        text: 'ผลลัพธ์ที่แสดงอยู่บนสุดและมีคำว่า "โฆษณา (Ad / Sponsored)" คือข้อมูลที่มีความน่าเชื่อถือทางวิชาการมากที่สุดเสมอ',
        isTrue: false,
      },
      {
        text: 'เครื่องหมาย - (ลบ) เช่น พลังงาน -ขาย ช่วยตัดคำที่ไม่ต้องการออกจากผลการค้นหาได้',
        isTrue: true,
      },
      {
        text: 'การตรวจสอบความน่าเชื่อถือที่ดี ควรเทียบข้อมูลอย่างน้อย 2 แหล่งขึ้นไป ดูชื่อผู้เขียน ปีที่เผยแพร่ และแหล่งอ้างอิง',
        isTrue: true,
      },
    ],
    explanation:
      'อันดับบนสุดที่มีป้าย "โฆษณา" เกิดจากการจ่ายเงินโปรโมต ไม่ได้แปลว่าน่าเชื่อถือที่สุด ส่วน site:, - และการตรวจเทียบหลายแหล่งช่วยเพิ่มคุณภาพการค้นหาอย่างมาก',
  },
];

export const InternetSearchLab: React.FC<InternetSearchLabProps> = ({ addPoints, onComplete }) => {
  const [activeSection, setActiveSection] = useState<'simulator' | 'crosscheck' | 'assessment'>('simulator');
  const [query, setQuery] = useState<string>('พลังงานแสงอาทิตย์ site:ac.th');
  const [hideAdsNotice, setHideAdsNotice] = useState<boolean>(false);
  const [inspectedResultId, setInspectedResultId] = useState<string | null>(null);
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);
  const [selectedSummary, setSelectedSummary] = useState<Record<string, number>>({});
  const [complexChoices, setComplexChoices] = useState<Record<number, boolean>>({});
  const [complexSubmitted, setComplexSubmitted] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  // Real interactive query parser supporting "", -, OR, site:, filetype:
  const filteredResults = useMemo(() => {
    const raw = query.trim();
    if (!raw) return SEARCH_DATASET;

    let working = raw;
    let siteFilter = '';
    let fileTypeFilter = '';
    const excludedTerms: string[] = [];
    const exactPhrases: string[] = [];

    // Extract site:xxx
    const siteMatch = working.match(/site:([^\s]+)/i);
    if (siteMatch) {
      siteFilter = siteMatch[1].toLowerCase();
      working = working.replace(siteMatch[0], '');
    }

    // Extract filetype:xxx
    const ftMatch = working.match(/filetype:([^\s]+)/i);
    if (ftMatch) {
      fileTypeFilter = ftMatch[1].toLowerCase();
      working = working.replace(ftMatch[0], '');
    }

    // Extract "..."
    const phraseMatches = working.match(/"([^"]+)"/g);
    if (phraseMatches) {
      phraseMatches.forEach((p) => {
        exactPhrases.push(p.replace(/"/g, '').toLowerCase());
        working = working.replace(p, '');
      });
    }

    // Extract -word
    const excludeMatches = working.match(/-([^\s]+)/g);
    if (excludeMatches) {
      excludeMatches.forEach((ex) => {
        excludedTerms.push(ex.slice(1).toLowerCase());
        working = working.replace(ex, '');
      });
    }

    // Remaining OR groups or normal keywords
    const orGroups = working
      .split(/\s+OR\s+/)
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);

    const scored = SEARCH_DATASET.map((item) => {
      const hay = `${item.title} ${item.snippet} ${item.domain} ${item.author} ${item.keywords.join(' ')}`.toLowerCase();

      if (siteFilter && !item.domain.toLowerCase().includes(siteFilter)) return null;
      if (fileTypeFilter && item.fileType.toLowerCase() !== fileTypeFilter) return null;
      if (excludedTerms.some((ex) => hay.includes(ex))) return null;
      if (exactPhrases.some((ph) => !hay.includes(ph))) return null;

      let matchScore = 0;
      if (orGroups.length > 0) {
        const matchedAnyGroup = orGroups.some((grp) => {
          const words = grp.split(/\s+/).filter(Boolean);
          const groupMatch = words.every((w) => hay.includes(w));
          if (groupMatch) matchScore += words.length * 10;
          return groupMatch;
        });
        if (!matchedAnyGroup) return null;
      } else {
        matchScore = 10;
      }

      // Ranking logic: Ads appear on top unless filtered, followed by keyword relevance & domain authority
      const rankBoost = item.isAd ? 100 : item.trustLevel === 'high' ? 20 : item.trustLevel === 'medium' ? 5 : 0;
      return { item, rank: matchScore + rankBoost };
    }).filter((x): x is { item: MockSearchResult; rank: number } => x !== null);

    return scored.sort((a, b) => b.rank - a.rank).map((x) => x.item);
  }, [query]);

  const currentCase = CROSS_CHECK_CASES[activeCaseIdx];

  const handleApplyPresetQuery = (preset: string) => {
    soundEffects.play('click');
    setQuery(preset);
    setInspectedResultId(null);
  };

  const handleSelectSummary = (caseId: string, idx: number) => {
    soundEffects.play('click');
    setSelectedSummary((prev) => ({ ...prev, [caseId]: idx }));
    const targetCase = CROSS_CHECK_CASES.find((c) => c.id === caseId);
    if (targetCase && idx === targetCase.bestSummaryIdx) {
      soundEffects.play('correct');
      addPoints(15, 'สรุปใจความสำคัญจากการสืบค้นหลายแหล่งถูกต้อง (ป.6/3)');
    }
  };

  const handleCheckComplex = () => {
    setComplexSubmitted(true);
    const quiz = COMPLEX_EVAL_QUIZ[0];
    const allRight = quiz.statements.every((st, idx) => complexChoices[idx] === st.isTrue);
    if (allRight) {
      soundEffects.play('correct');
      if (!rewardClaimed) {
        setRewardClaimed(true);
        addPoints(25, 'ผ่านแบบประเมินเลือกตอบเชิงซ้อน การสืบค้นข้อมูล ป.6/3');
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
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Search className="w-4 h-4" />
            <span>มาตรฐาน ว 4.2 ป.6/3</span>
            <span aria-hidden="true">·</span>
            <span>บูรณาการทักษะสรุปความ (ภาษาไทย)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            ห้องแล็บสืบค้นข้อมูลขั้นสูง &amp; ประเมินความน่าเชื่อถือ
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            ฝึกใช้ Search Operators (&quot; &quot;, -, OR, site:, filetype:) เข้าใจการจัดอันดับของ Search Engine เทียบข้อมูลหลายแหล่ง และสรุปใจความสำคัญ
          </p>
        </div>

        {/* Sub-view Switcher */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('simulator')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'simulator'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            1. ทดลอง Search Operators
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('crosscheck')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'crosscheck'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            2. เทียบหลายแหล่ง &amp; สรุปความ
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('assessment')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'assessment'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            3. โจทย์เลือกตอบเชิงซ้อน O-NET
          </button>
        </div>
      </div>

      {/* SECTION 1: SEARCH ENGINE SIMULATOR */}
      {activeSection === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 cols: Interactive Search Engine Box + Results */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                พิมพ์คำค้นหาพร้อมตัวดำเนินการ (Search Query Simulator):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='เช่น น้ำดื่ม -โฆษณา site:go.th หรือ filetype:pdf พลังงาน'
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyPresetQuery('')}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  ดูทั้งหมด
                </button>
              </div>

              {/* Quick Query Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium mr-1">ลองคลิกคำสั่งตัวอย่าง:</span>
                {[
                  { label: '"น้ำดื่ม" -โฆษณา', q: '"น้ำดื่ม" -โฆษณา' },
                  { label: 'site:go.th น้ำดื่ม', q: 'site:go.th น้ำดื่ม' },
                  { label: 'filetype:pdf', q: 'filetype:pdf' },
                  { label: 'PDPA OR พลังงานแสงอาทิตย์', q: 'PDPA OR พลังงานแสงอาทิตย์' },
                  { label: 'สุขภาพ (ดูผลรวม Ads)', q: 'สุขภาพ' },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPresetQuery(p.q)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-slate-700 dark:text-slate-300 font-mono text-[11px] cursor-pointer transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ranking & Ad Awareness Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600 dark:text-slate-400">
              <span>
                พบผลลัพธ์ <strong className="text-slate-900 dark:text-white font-mono">{filteredResults.length}</strong> รายการ
                (เรียงลำดับตาม Ad / ความเกี่ยวข้อง / ความน่าเชื่อถือโดเมน)
              </span>
              <button
                type="button"
                onClick={() => setHideAdsNotice((v) => !v)}
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{hideAdsNotice ? 'ซ่อนคำอธิบายอันดับ' : 'เข้าใจหลักจัดอันดับ (Ranking)'}</span>
              </button>
            </div>

            {hideAdsNotice && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold">ทำไมเว็บบางอันอยู่บนสุดใน Search Engine?</div>
                <p className="leading-relaxed">
                  1) <strong>โฆษณา (Ad/Sponsored):</strong> จ่ายค่าโฆษณาจึงขึ้นอันดับแรก แต่ไม่การันตีความถูกต้อง
                  2) <strong>SEO &amp; Keyword Match:</strong> เนื้อหาตรงคำค้นมากที่สุด
                  3) <strong>Authority:</strong> เว็บไซต์ทางการเช่น .go.th หรือ .ac.th มักได้รับคะแนนความน่าเชื่อถือสูง
                </p>
              </div>
            )}

            {/* Search Results List */}
            <div className="space-y-3">
              {filteredResults.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขตัวดำเนินการ ลองปรับคำค้น หรือกด &quot;ดูทั้งหมด&quot;
                </div>
              ) : (
                filteredResults.map((res, idx) => {
                  const isInspected = inspectedResultId === res.id;
                  return (
                    <div
                      key={res.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        res.isAd
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/70'
                          : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-mono font-bold text-slate-400">อันดับ #{idx + 1}</span>
                            {res.isAd && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold text-[10px]">
                                โฆษณา (Sponsored)
                              </span>
                            )}
                            {res.fileType === 'pdf' && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-0.5">
                                <FileText className="w-3 h-3" /> PDF
                              </span>
                            )}
                            <span className="truncate font-mono">{res.url}</span>
                          </div>
                          <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
                            <span>{res.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {res.snippet}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                            <span>ผู้เผยแพร่: {res.author}</span>
                            <span aria-hidden="true">·</span>
                            <span>ปี {res.publishedYear + 543}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.play('click');
                            setInspectedResultId(isInspected ? null : res.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          {isInspected ? 'ซ่อนการประเมิน' : 'ตรวจสอบแหล่งที่มา'}
                        </button>
                      </div>

                      {isInspected && (
                        <div
                          className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                            res.trustLevel === 'high'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : res.trustLevel === 'medium'
                              ? 'bg-sky-50 border-sky-200 text-sky-900'
                              : 'bg-rose-50 border-rose-200 text-rose-900'
                          }`}
                        >
                          {res.trustLevel === 'high' ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-bold">
                              ระดับความน่าเชื่อถือ:{' '}
                              {res.trustLevel === 'high'
                                ? 'สูง (ใช้อ้างอิงได้)'
                                : res.trustLevel === 'medium'
                                ? 'ปานกลาง (ควรตรวจเทียบเพิ่ม)'
                                : 'ต่ำ / ควรระวัง (ไม่ควรอ้างอิง)'}
                            </div>
                            <p className="mt-0.5 opacity-90">{res.trustReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right 5 cols: Search Operators Reference Deck */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>คู่มือ 5 ตัวดำเนินการค้นหา (Search Operators)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                คลิกที่การ์ดเพื่อใส่ตัวดำเนินการลงในช่องค้นหาและสังเกตการเปลี่ยนแปลงของผลลัพธ์ทันที
              </p>

              <div className="space-y-2.5">
                {OPERATOR_GUIDE.map((item) => (
                  <button
                    key={item.op}
                    type="button"
                    onClick={() => handleApplyPresetQuery(item.example)}
                    className="w-full text-left p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {item.op}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 group-hover:text-emerald-600">
                        ทดลองใช้ →
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {item.usage}
                    </div>
                    <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                      ตัวอย่าง: {item.example}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MULTI-SOURCE CROSS CHECK & THAI SUMMARIZATION */}
      {activeSection === 'crosscheck' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {CROSS_CHECK_CASES.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setActiveCaseIdx(idx);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    activeCaseIdx === idx
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {c.topic}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Sources Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentCase.sources.map((src, sIdx) => (
              <div
                key={sIdx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{src.name}</span>
                    <span className="text-slate-500 font-mono">{src.date}</span>
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">
                    ประเภทโดเมน: {src.domain}
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    &quot;{src.claim}&quot;
                  </p>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>หลักฐาน:</strong> {src.evidence}
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border ${
                    src.isReliable
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {src.isReliable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>แหล่งข้อมูลน่าเชื่อถือ (ใช้อ้างอิงได้)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>ควรตัดออก (ขาดความน่าเชื่อถือ)</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summarization Selection */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-950 dark:text-indigo-200">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>ภารกิจบูรณาการภาษาไทย: เลือกข้อความสรุปใจความสำคัญจากแหล่งข้อมูลที่เชื่อถือได้</span>
            </div>
            <div className="space-y-2">
              {currentCase.summaryOptions.map((opt, idx) => {
                const picked = selectedSummary[currentCase.id];
                const isPicked = picked === idx;
                const isCorrect = idx === currentCase.bestSummaryIdx;
                let cls = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
                if (picked !== undefined) {
                  if (isCorrect) {
                    cls = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
                  } else if (isPicked) {
                    cls = 'bg-rose-50 border-rose-300 text-rose-900';
                  }
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSummary(currentCase.id, idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-3 ${cls}`}
                  >
                    <span>{idx + 1}. {opt}</span>
                    {picked !== undefined && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {picked !== undefined && isPicked && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selectedSummary[currentCase.id] !== undefined && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-xs text-slate-700 dark:text-slate-300">
                <strong>หลักการสรุป:</strong> {currentCase.explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: O-NET COMPLEX CHOICE EVALUATION */}
      {activeSection === 'assessment' && (
        <div className="space-y-5">
          {COMPLEX_EVAL_QUIZ.map((quiz) => (
            <div
              key={quiz.id}
              className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    รูปแบบข้อสอบ O-NET · เลือกตอบเชิงซ้อน (Complex Choice)
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {quiz.question}
                  </h4>
                </div>
                {complexSubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      setComplexChoices({});
                      setComplexSubmitted(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ทำใหม่</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      <th className="py-3 px-4">ข้อความที่ต้องพิจารณา</th>
                      <th className="py-3 px-4 text-center w-28">ถูกต้อง</th>
                      <th className="py-3 px-4 text-center w-28">ไม่ถูกต้อง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {quiz.statements.map((st, idx) => {
                      const val = complexChoices[idx];
                      const isCorrect = complexSubmitted && val === st.isTrue;
                      const isWrong = complexSubmitted && val !== st.isTrue;
                      return (
                        <tr
                          key={idx}
                          className={
                            isCorrect
                              ? 'bg-emerald-50/70'
                              : isWrong
                              ? 'bg-rose-50/70'
                              : ''
                          }
                        >
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200 leading-relaxed">
                            <span className="font-bold mr-1.5">{idx + 1}.</span>
                            {st.text}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              disabled={complexSubmitted}
                              onClick={() => setComplexChoices((prev) => ({ ...prev, [idx]: true }))}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                                val === true
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600'
                              }`}
                            >
                              ถูกต้อง
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              disabled={complexSubmitted}
                              onClick={() => setComplexChoices((prev) => ({ ...prev, [idx]: false }))}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                                val === false
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600'
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
                {complexSubmitted ? (
                  <div className="flex-1 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>คำอธิบาย:</strong> {quiz.explanation}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">
                    เลือกคำตอบครบทั้ง {quiz.statements.length} ข้อย่อยแล้วกดตรวจคำตอบ
                  </span>
                )}

                {!complexSubmitted && (
                  <button
                    type="button"
                    disabled={quiz.statements.some((_, idx) => complexChoices[idx] === undefined)}
                    onClick={handleCheckComplex}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>ตรวจคำตอบเลือกตอบเชิงซ้อน</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
