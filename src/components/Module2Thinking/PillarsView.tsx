import React, { useState } from 'react';
import {
  Layers,
  Search,
  EyeOff,
  GitBranch,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  ArrowDown,
  Repeat,
  BookOpen,
} from 'lucide-react';

interface PillarsViewProps {
  onOpenFlowchart?: () => void;
  onOpenControlStructures?: () => void;
}

type ControlPatternType = 'sequence' | 'selection' | 'loop';

interface CaseStudyControlMapping {
  type: ControlPatternType;
  badgeText: string;
  roleTitle: string;
  detail: string;
}

interface CaseStudyFlowNode {
  shape: 'terminator' | 'io' | 'process' | 'decision' | 'loopNote';
  text: string;
  trueBranch?: string;
  falseBranch?: string;
  structureTag?: string;
}

interface IntegratedCaseStudy {
  shortTitle: string;
  title: string;
  gradeTag: string;
  structureFormula: string;
  steps: {
    pillar: string;
    color: string;
    content: string;
  }[];
  controlMappings: CaseStudyControlMapping[];
  flowchartNodes: CaseStudyFlowNode[];
}

export const PillarsView: React.FC<PillarsViewProps> = ({ onOpenFlowchart, onOpenControlStructures }) => {
  const [activePillar, setActivePillar] = useState<number>(0);
  const [activeCaseStudy, setActiveCaseStudy] = useState<number>(0);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});

  const pillars = [
    {
      id: 0,
      title: '1. การแยกย่อยปัญหา (Decomposition)',
      shortTitle: 'แยกย่อยปัญหา',
      oneLiner: 'เปรียบเหมือนการหั่นเค้กก้อนโตออกเป็นชิ้นเล็กๆ จะได้กินง่ายและไม่ติดคอ!',
      subtitle: 'แตกปัญหาใหญ่ให้กลายเป็นปัญหาย่อยที่จัดการได้ง่ายทีละส่วน',
      icon: Layers,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      description:
        'เมื่อเราเจอปัญหาหรืองานชิ้นใหญ่ที่ดูยากจนไม่รู้จะเริ่มตรงไหน ให้แบ่งงานใหญ่นั้นออกเป็น "ภารกิจย่อยๆ" ทีละส่วน แล้วค่อยลงมือทำทีละอย่างจนครบ จะทำให้แก้ปัญหาได้เร็วและผิดพลาดน้อยลง',
      dailyExample:
        'การจัดเตรียมตัวไปโรงเรียนตอนเช้า: แยกเป็น 1) ตื่นนอนเก็บที่นอน 2) อาบน้ำแปรงฟัน 3) แต่งชุดนักเรียน 4) กินข้าวเช้า 5) ตรวจเช็กตารางสอนและกระเป๋า',
      codingExample:
        'การสร้างเกมเก็บผลไม้ใน Scratch: แยกพัฒนาเป็น 4 ส่วน คือ 1) บังคับตะกร้าซ้าย-ขวา 2) ทำให้ผลไม้หล่นจากด้านบน 3) นับคะแนนเมื่อรับโดน 4) จับเวลาถอยหลัง 60 วินาที',
      gradeExamples: [
        {
          grade: 'ป.4',
          topic: 'การจัดกระเป๋านักเรียน',
          detail: 'แบ่งเป็นหมวด: 1) สมุดหนังสือตามตารางสอน 2) กล่องดินสอ 3) ขวดน้ำ-ผ้าเช็ดหน้า 4) ใบงานการบ้าน',
        },
        {
          grade: 'ป.5',
          topic: 'การเตรียมทำโครงงานวิทยาศาสตร์',
          detail: 'แบ่งหน้าที่ในกลุ่ม: คนหาข้อมูล, คนเตรียมอุปกรณ์, คนทดลองบันทึกผล, คนทำสไลด์นำเสนอ',
        },
        {
          grade: 'ป.6',
          topic: 'ออกแบบบ้านอัจฉริยะ Micro:bit',
          detail: 'แยกระบบย่อย 3 ระบบ: 1) ระบบไฟเปิดอัตโนมัติเมื่อมืด 2) ระบบเตือนอุณหภูมิร้อน 3) ระบบสัญญาณกันขโมยประตู',
        },
      ],
      quickQuiz: {
        question: 'ข้อใดคือการใช้หลัก "การแยกย่อยปัญหา (Decomposition)" ในการทำความสะอาดห้องเรียน?',
        options: [
          'รีบกวาดพื้นพร้อมกับเช็ดโต๊ะและลบกระดานไปด้วยคนเดียวพร้อมกันทั้งหมด',
          'จดจำเฉพาะสีและขนาดของไม้กวาดโดยไม่ต้องวางแผนลำดับการทำงานใดๆ เลย',
          'แบ่งงานเป็น 4 ส่วน คือ เก็บขยะ กวาดพื้น ถูพื้น และจัดโต๊ะให้เรียบร้อย',
        ],
        correctIndex: 2,
        explanation: 'ถูกต้อง! การแบ่งงานใหญ่เป็นขั้นตอนย่อย 4 ส่วนช่วยให้ทำตามลำดับได้ง่ายและห้องสะอาดเร็วขึ้น',
      },
    },
    {
      id: 1,
      title: '2. การหารูปแบบ (Pattern Recognition)',
      shortTitle: 'หารูปแบบความเหมือน',
      oneLiner: 'เหมือนการจับผิดภาพหรือสังเกตสิ่งที่ซ้ำกัน เพื่อใช้สูตรลัดแก้ปัญหาได้ไวขึ้น!',
      subtitle: 'ค้นหาความเหมือน ความคล้าย หรือพฤติกรรมที่เกิดขึ้นซ้ำๆ',
      icon: Search,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      badgeColor: 'bg-sky-100 text-sky-700',
      description:
        'เมื่อแยกปัญหาออกเป็นส่วนย่อยแล้ว ให้ลองสังเกตว่า "มีอะไรที่เหมือนกันหรือทำซ้ำๆ กันบ้าง?" พอเราเจอรูปแบบ (Pattern) แล้ว เราจะสามารถใช้วิธีแก้เดิมซ้ำได้ หรือใช้บล็อกคำสั่ง Repeat แทนการเขียนซ้ำหลายบรรทัด',
      dailyExample:
        'การพยากรณ์รถติดหน้าโรงเรียน: สังเกตว่าทุกวันจันทร์–ศุกร์ เวลา 07.30–08.00 น. รถจะติดหน้าประตูโรงเรียนเสมอ แต่เสาร์–อาทิตย์ถนนโล่ง จึงออกเดินทางก่อน 07.15 น.',
      codingExample:
        'วาดรูปสี่เหลี่ยมใน Scratch: รูปแบบที่ซ้ำกันคือ "เดินหน้า 100 ก้าว -> หมุนขวา 90 องศา" ซ้ำ 4 รอบ จึงย่อเหลือบล็อก Repeat (4) เพียงชุดเดียว',
      gradeExamples: [
        {
          grade: 'ป.4',
          topic: 'เกมทายลำดับตัวเลขและรูปภาพ',
          detail: 'สังเกตชุดเลข 2, 4, 6, 8, ... จะรู้รูปแบบทันทีว่าเพิ่มขึ้นทีละ +2 ตัวต่อไปคือ 10',
        },
        {
          grade: 'ป.5',
          topic: 'การจัดหมวดหมู่ขยะในโรงเรียน',
          detail: 'ขวดพลาสติก กระป๋อง กล่องนม มีรูปแบบร่วมกันคือ "รีไซเคิลได้" จึงแยกทิ้งลงถังสีเหลืองเหมือนกันทั้งหมด',
        },
        {
          grade: 'ป.6',
          topic: 'การวาดลวดลายเรขาคณิตด้วย Loop',
          detail: 'การวาดรูปหลายเหลี่ยมด้านเท่า (สามเหลี่ยม=หมุน 120°, สี่เหลี่ยม=หมุน 90°, หกเหลี่ยม=หมุน 60°) ใช้สูตรเดียวกันคือ 360 ÷ จำนวนด้าน',
        },
      ],
      quickQuiz: {
        question: 'ถ้าน้องเห็นหุ่นยนต์เดินเป็นขั้นบันได: เดินหน้า 1 -> เลี้ยวขวา -> เดินหน้า 1 -> เลี้ยวซ้าย ทำแบบนี้ 3 รอบ น้องควรใช้แนวคิดใด?',
        options: [
          'Pattern Recognition — จับรูปแบบชุดคำสั่งที่ซ้ำแล้วใส่ในบล็อก Repeat 3 ครั้ง',
          'Decomposition — ลบคำสั่งเดินและเลี้ยวทั้งหมดทิ้งแล้วเขียนโค้ดใหม่ทั้งหมด',
          'Abstraction — ตัดคำสั่งเลี้ยวออกทั้งหมดเพื่อให้หุ่นยนต์เดินตรงไปอย่างเดียว',
        ],
        correctIndex: 0,
        explanation: 'เก่งมาก! เพราะคำสั่งชุดเดิมเกิดขึ้นซ้ำๆ กัน การสังเกตเห็นรูปแบบช่วยให้เราเขียนโค้ดสั้นลงและเป็นระเบียบมากขึ้น',
      },
    },
    {
      id: 2,
      title: '3. การคิดเชิงนามธรรม (Abstraction)',
      shortTitle: 'คัดแยกสิ่งสำคัญ',
      oneLiner: 'เหมือนการใส่แว่นกรองแสง เลือกมองเฉพาะ "สาระสำคัญ" แล้วตัดเรื่องที่ไม่เกี่ยวออก!',
      subtitle: 'คัดกรองเฉพาะข้อมูลที่จำเป็น ละทิ้งรายละเอียดปลีกย่อย',
      icon: EyeOff,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badgeColor: 'bg-amber-100 text-amber-800',
      description:
        'ปัญหาในชีวิตจริงมักมีรายละเอียดเยอะแยะเต็มไปหมด การคิดเชิงนามธรรมช่วยให้เราโฟกัสเฉพาะข้อมูลที่ "จำเป็นต่อการแก้ปัญหานี้เท่านั้น" และตัดสิ่งที่ไม่เกี่ยวข้องออกไปชั่วคราว เพื่อไม่ให้สับสน',
      dailyExample:
        'แผนผังเส้นทางเดินรถไฟฟ้า (BTS/MRT): แสดงเฉพาะชื่อสถานีและสีของสายรถไฟ แต่ตัดภาพตึก ต้นไม้ ร้านค้า และไฟจราจรบนถนนออกไป ทำให้ผู้โดยสารดูเส้นทางเข้าใจทันทีใน 5 วินาที',
      codingExample:
        'ตัวแปร score ในเกม: โปรแกรมเก็บเฉพาะตัวเลขคะแนน (เช่น 50) โดยไม่ต้องสนว่าผู้เล่นเก็บเหรียญจากมุมซ้ายหรือขวา หรือตัวละครใส่หมวกสีอะไร',
      gradeExamples: [
        {
          grade: 'ป.4',
          topic: 'การวาดแผนที่จากบ้านมาโรงเรียน',
          detail: 'วาดเฉพาะถนนสายหลัก สี่แยก และป้ายโรงเรียน ไม่จำเป็นต้องวาดสุนัขหรือต้นไม้ทุกต้นข้างทาง',
        },
        {
          grade: 'ป.5',
          topic: 'การจัดทำตารางเรียนประจำวัน',
          detail: 'สนใจเฉพาะ วัน เวลา และชื่อวิชา ไม่ต้องเขียนรายละเอียดว่าหน้าปกหนังสือเรียนเป็นสีอะไร',
        },
        {
          grade: 'ป.6',
          topic: 'บัตรประจำตัวนักเรียน (Student ID)',
          detail: 'เลือกเก็บข้อมูลสำคัญสำหรับระบบห้องสมุด ได้แก่ รหัสนักเรียน ชื่อ-สกุล และชั้นเรียน โดยไม่ต้องเก็บข้อมูลอาหารจานโปรด',
        },
      ],
      quickQuiz: {
        question: 'เมื่อคุณครูให้วาดภาพประกอบ "คู่มือหนีไฟในโรงเรียน" ข้อมูลใดที่ไม่จำเป็นและควรตัดออกตามหลัก Abstraction?',
        options: [
          'ตำแหน่งประตูทางออกหนีไฟและลูกศรชี้เส้นทางไปยังจุดรวมพล',
          'สีของผ้าม่านหน้าต่างและลวดลายกระเบื้องในแต่ละห้องเรียน',
          'ตำแหน่งที่ตั้งของถังดับเพลิงและปุ่มกดสัญญาณเตือนไฟไหม้',
        ],
        correctIndex: 1,
        explanation: 'ถูกต้อง! สีผ้าม่านและลายกระเบื้องไม่ช่วยในการหนีไฟ ควรตัดออกเพื่อให้เห็นเส้นทางหนีไฟและจุดรวมพลชัดเจนที่สุด',
      },
    },
    {
      id: 3,
      title: '4. การออกแบบอัลกอริทึม (Algorithm Design)',
      shortTitle: 'ออกแบบขั้นตอน',
      oneLiner: 'เหมือนการเขียน "สูตรลับทำอาหาร" ที่บอกลำดับ 1-2-3 ชัดเจน ใครทำตามก็ได้ผลลัพธ์เป๊ะ!',
      subtitle: 'พัฒนาขั้นตอนวิธีแก้ปัญหาเป็นลำดับชัดเจนทั้งแบบข้อความและผังงาน (Flowchart)',
      icon: GitBranch,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      description:
        'อัลกอริทึม คือ ลำดับขั้นตอนการทำงานที่ชัดเจน ถูกต้อง และมีจุดสิ้นสุด สามารถถ่ายทอดออกมาได้ 3 แบบหลัก คือ 1) ข้อความบรรยาย 2) รหัสลำลอง (Pseudocode) และ 3) ผังงาน (Flowchart)',
      dailyExample:
        'อัลกอริทึมการข้ามถนนที่ทางม้าลาย: 1) หยุดยืนรอริมฟุตบาท 2) มองขวา-มองซ้าย-มองขวา 3) ตรวจสอบว่าไม่มีรถวิ่งมา ถ้าไม่มี -> เดินข้ามอย่างรวดเร็ว, ถ้ามี -> รอจนรถหยุด',
      codingExample:
        'Micro:bit สัญญาณไฟอัตโนมัติ: "เริ่มต้น -> อ่านค่าแสง -> ถ้าแสง < 50 ให้เปิดไฟ LED -> ไม่งั้นปิดไฟ LED -> วนกลับไปอ่านค่าแสงใหม่"',
      gradeExamples: [
        {
          grade: 'ป.4',
          topic: 'สูตรการชงโอวัลตินร้อน (ลำดับ Sequence)',
          detail: '1) ตักผงโอวัลตินใส่แก้ว 2) เทน้ำร้อน 3) คนให้ละลาย 4) ถ้าชอบหวานให้เติมน้ำตาล -> ดื่มได้',
        },
        {
          grade: 'ป.5',
          topic: 'ระบบคัดกรองส่วนสูงขึ้นเครื่องเล่น (ทางเลือก If-Else)',
          detail: 'รับค่าส่วนสูง -> ถ้าส่วนสูง >= 120 ซม. แสดง "ขึ้นเล่นได้" มิฉะนั้นแสดง "ต้องมีผู้ปกครองดูแล"',
        },
        {
          grade: 'ป.6',
          topic: 'เกมทายตัวเลขลับ 1–100 (วนซ้ำ Loop)',
          detail: 'ทำซ้ำจนกว่าจะทายถูก: รับเลขที่ทาย -> ถ้ามากกว่าบอก "มากไป" ถ้าน้อยกว่าบอก "น้อยไป" ถ้าเท่ากันบอก "ถูกต้อง!"',
        },
      ],
      quickQuiz: {
        question: 'ข้อใดคือลักษณะของ "อัลกอริทึมที่ดี" สำหรับสั่งงานคอมพิวเตอร์หรือหุ่นยนต์?',
        options: [
          'เขียนคำสั่งสั้นๆ กว้างๆ เช่น เดินไปตรงโน้นนิดนึง แล้วให้หุ่นยนต์เดาเอง',
          'สลับลำดับขั้นตอนไหนขึ้นก่อนหรือหลังก็ได้โดยไม่ต้องคำนึงถึงผลลัพธ์เลย',
          'บอกลำดับขั้นตอนชัดเจน แน่นอน ตรวจสอบเงื่อนไขครบ และได้ผลลัพธ์ถูกต้อง',
        ],
        correctIndex: 2,
        explanation: 'ถูกต้องเลย! คอมพิวเตอร์เดาใจคนไม่ได้ จึงต้องเขียนขั้นตอนให้ชัดเจน ระบุจำนวนก้าวหรือเงื่อนไขเป็นตัวเลขที่แน่นอน',
      },
    },
  ];

  const integratedCaseStudies: IntegratedCaseStudy[] = [
    {
      shortTitle: '🥪 แซนด์วิชปิกนิก',
      title: '🥪 กรณีศึกษาที่ 1: ภารกิจเตรียมแซนด์วิชปิกนิกให้เพื่อน 5 คน',
      gradeTag: 'ป.4–ป.5 · ชีวิตประจำวัน',
      structureFormula: 'ลำดับ (Sequence) + วนซ้ำ (Repeat 5) + ทางเลือก (If-Else)',
      steps: [
        {
          pillar: '1. แยกย่อยปัญหา (Decomposition)',
          color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900',
          content: 'แบ่งงานทำแซนด์วิชเป็น 4 ส่วน: เตรียมขนมปัง, เตรียมไส้ทูน่า/ไข่, ทาซอส, และตัดใส่กล่อง',
        },
        {
          pillar: '2. หารูปแบบ (Pattern)',
          color: 'border-sky-200 bg-sky-50/70 text-sky-900',
          content: 'ทุกชิ้นใช้ขั้นตอนเหมือนกัน: ขนมปังแผ่นล่าง -> ทาซอส -> วางไส้ -> ประกบขนมปังแผ่นบน (ทำซ้ำ 5 ชุด)',
        },
        {
          pillar: '3. คิดเชิงนามธรรม (Abstraction)',
          color: 'border-amber-200 bg-amber-50/70 text-amber-900',
          content: 'โฟกัสแค่รสชาติและแพ้อาหารของเพื่อน ไม่ต้องกังวลว่าจานรองขนมปังลายดอกไม้หรือลายจุด',
        },
        {
          pillar: '4. ออกแบบอัลกอริทึม (Algorithm)',
          color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
          content: 'เขียนลำดับทำซ้ำ 5 รอบ พร้อมเงื่อนไข: "ถ้าเพื่อนแพ้มายองเนส -> ไม่ใส่ซอส"',
        },
      ],
      controlMappings: [
        {
          type: 'sequence',
          badgeText: '1. ลำดับ (Sequence)',
          roleTitle: 'วางขนมปัง → ใส่ไส้ → ประกบแผ่นบน → ใส่กล่อง',
          detail: 'ทำเรียงทีละขั้นตอนตามลำดับ ถ้าสลับไปตัดกล่องก่อนใส่ไส้จะเละทันที',
        },
        {
          type: 'selection',
          badgeText: '2. ทางเลือก (Selection / If-Else)',
          roleTitle: 'ตรวจเงื่อนไข: แพ้มายองเนสหรือไม่?',
          detail: 'ถ้าแพ้ → งดซอส (ทำฝั่งใช่) มิฉะนั้น → ทาซอสปกติ (ทำฝั่งไม่ใช่)',
        },
        {
          type: 'loop',
          badgeText: '3. การวนซ้ำ (Loop · Repeat 5)',
          roleTitle: 'ทำขั้นตอนเดิมซ้ำจนครบ 5 กล่อง',
          detail: 'ใช้ตัวนับชิ้นที่ 1 ถึง 5 แทนการเขียนขั้นตอนซ้ำยาวๆ ถึง 5 ชุด',
        },
      ],
      flowchartNodes: [
        { shape: 'terminator', text: 'เริ่มต้น (Start) · กำหนด จำนวนชิ้น = 1' },
        { shape: 'process', text: 'วางขนมปังแผ่นล่างบนจานสะอาด', structureTag: 'Sequence' },
        {
          shape: 'decision',
          text: '◇ เพื่อนคนที่ {i} แพ้มายองเนส?',
          trueBranch: '✅ ใช่: ข้ามการทาซอส',
          falseBranch: '❌ ไม่ใช่: ทาซอส 1 ช้อน',
          structureTag: 'Selection',
        },
        { shape: 'process', text: 'วางไส้ + ประกบขนมปัง + ใส่กล่อง', structureTag: 'Sequence' },
        {
          shape: 'loopNote',
          text: '◇ ทำครบ 5 กล่องหรือยัง? (ถ้ายัง → เพิ่มจำนวน +1 ⤴️ วนกลับ)',
          structureTag: 'Loop (Repeat 5)',
        },
        { shape: 'terminator', text: 'จบการทำงาน (End) · พร้อมไปปิกนิก!' },
      ],
    },
    {
      shortTitle: '♻️ เกมแยกขยะ',
      title: '♻️ กรณีศึกษาที่ 2: โครงงานเกม Scratch แยกขยะรักษ์โลกในโรงเรียน',
      gradeTag: 'ป.5–ป.6 · เกม Scratch',
      structureFormula: 'วนซ้ำตลอด (Forever Loop) + ทางเลือก (If-Else) + ลำดับ (Sequence)',
      steps: [
        {
          pillar: '1. แยกย่อยปัญหา (Decomposition)',
          color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900',
          content: 'แยกระบบเกม: 1) ถังขยะ 4 สี 2) ขยะตกลงมาแบบสุ่ม 3) ระบบตรวจคะแนน 4) เสียงเอฟเฟกต์',
        },
        {
          pillar: '2. หารูปแบบ (Pattern)',
          color: 'border-sky-200 bg-sky-50/70 text-sky-900',
          content: 'ขยะทุกชิ้นตกลงมาจากด้านบนหน้าจอ (change y by -5) เหมือนกัน จึงสร้างแม่แบบโค้ด Clone ใช้ซ้ำได้',
        },
        {
          pillar: '3. คิดเชิงนามธรรม (Abstraction)',
          color: 'border-amber-200 bg-amber-50/70 text-amber-900',
          content: 'แทนชนิดขยะด้วยตัวแปร type ("recycle", "organic", "general", "hazard") เพื่อเช็กกับสีถังขยะได้ทันที',
        },
        {
          pillar: '4. ออกแบบอัลกอริทึม (Algorithm)',
          color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
          content: 'วางผัง Flowchart: แตะถังขยะ -> ถ้ารหัสขยะตรงสีถัง บวก +10 คะแนน มิฉะนั้น ลบ -1 หัวใจ',
        },
      ],
      controlMappings: [
        {
          type: 'loop',
          badgeText: '3. การวนซ้ำ (Forever Loop)',
          roleTitle: 'ขยะลอยลงมาและตรวจการชนตลอดเวลาที่เล่น',
          detail: 'ตราบใดที่หัวใจ > 0 โปรแกรมจะสุ่มขยะตกลงมาเรื่อยๆ ไม่มีหยุด',
        },
        {
          type: 'selection',
          badgeText: '2. ทางเลือก (Selection / If-Else)',
          roleTitle: 'เช็กรหัส type ของขยะตรงกับสีถังหรือไม่',
          detail: 'ตรงสี → +10 คะแนน + เสียงปิ๊ง | ไม่ตรงสี → -1 หัวใจ + เสียงเตือน',
        },
        {
          type: 'sequence',
          badgeText: '1. ลำดับ (Sequence)',
          roleTitle: 'ตั้งค่าเริ่มเกม → เล่นซ้ำ → ลบโคลนขยะ',
          detail: 'เริ่มเกมต้องเซ็ต score = 0 และ lives = 3 ก่อนเข้าลูปเล่นเกมเสมอ',
        },
      ],
      flowchartNodes: [
        { shape: 'terminator', text: 'เริ่มต้น (Start) · score = 0, lives = 3' },
        { shape: 'io', text: 'สุ่มขยะตกลงมา + ผู้เล่นขยับถังรับ', structureTag: 'Sequence' },
        {
          shape: 'decision',
          text: '◇ ชนิดขยะตรงกับสีถังหรือไม่?',
          trueBranch: '✅ ใช่: บวก +10 คะแนน',
          falseBranch: '❌ ไม่ใช่: ลบ -1 หัวใจ',
          structureTag: 'Selection',
        },
        {
          shape: 'loopNote',
          text: '◇ หัวใจ > 0 หรือไม่? (ถ้าใช่ → ⤴️ วนสุ่มขยะชิ้นถัดไป)',
          structureTag: 'Loop (Forever / Until)',
        },
        { shape: 'terminator', text: 'จบเกม (End) · แสดงคะแนนรวม!' },
      ],
    },
    {
      shortTitle: '🌱 รดน้ำอัตโนมัติ',
      title: '🌱 กรณีศึกษาที่ 3: ระบบรดน้ำต้นไม้อัตโนมัติ Micro:bit ในแปลงผัก',
      gradeTag: 'ป.5–ป.6 · Micro:bit / IoT',
      structureFormula: 'วนซ้ำตลอด (Forever Loop) + ทางเลือก (If-Else)',
      steps: [
        {
          pillar: '1. แยกย่อยปัญหา (Decomposition)',
          color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900',
          content: 'แบ่งระบบเป็น 3 ส่วน: 1) เซนเซอร์วัดความชื้นดิน 2) สมองกล Micro:bit ตัดสินใจ 3) ปั๊มน้ำขนาดเล็ก',
        },
        {
          pillar: '2. หารูปแบบ (Pattern)',
          color: 'border-sky-200 bg-sky-50/70 text-sky-900',
          content: 'ไม่ว่าจะเป็นผักคะน้าหรือกวางตุ้ง ระบบทำงานรูปแบบเดิมคือ "อ่านค่าความชื้น -> เปรียบเทียบเกณฑ์ -> สั่งปั๊ม"',
        },
        {
          pillar: '3. คิดเชิงนามธรรม (Abstraction)',
          color: 'border-amber-200 bg-amber-50/70 text-amber-900',
          content: 'สนใจแค่ตัวเลขความชื้นดิน (moisture 0–100) โดยตัดเรื่องสีของกระถางหรือชื่อชนิดปุ๋ยออกไปก่อน',
        },
        {
          pillar: '4. ออกแบบอัลกอริทึม (Algorithm)',
          color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
          content: 'อ่านค่า moisture -> ถ้า < 40 ให้เปิดปั๊มน้ำ 3 วินาที มิฉะนั้นปิดปั๊ม -> รอ 10 วินาทีแล้วตรวจซ้ำ',
        },
      ],
      controlMappings: [
        {
          type: 'sequence',
          badgeText: '1. ลำดับ (Sequence)',
          roleTitle: 'อ่านค่าเซนเซอร์ → แสดงผลบนจอ LED → รอเวลาพัก',
          detail: 'ต้องอ่านค่าจากเซนเซอร์ก่อนจึงจะนำไปเปรียบเทียบในเงื่อนไขได้',
        },
        {
          type: 'selection',
          badgeText: '2. ทางเลือก (Selection / If-Else)',
          roleTitle: 'ตัดสินใจเปิด/ปิดปั๊มจากค่าความชื้น (moisture < 40)',
          detail: 'ดินแห้ง (<40) → เปิดปั๊มรดน้ำ | ดินชุ่มชื้นแล้ว → ปิดปั๊มประหยัดน้ำ',
        },
        {
          type: 'loop',
          badgeText: '3. การวนซ้ำ (Forever Loop)',
          roleTitle: 'เฝ้าตรวจความชื้นดินอัตโนมัติตลอดทั้งวัน',
          detail: 'ใช้บล็อก forever ทำให้ต้นไม้ได้รับน้ำพอดีแม้ในวันหยุดเสาร์-อาทิตย์',
        },
      ],
      flowchartNodes: [
        { shape: 'terminator', text: 'เริ่มต้น (Start) · เปิดระบบ IoT' },
        { shape: 'io', text: 'อ่านค่าความชื้นดิน (moisture)', structureTag: 'Sequence / Input' },
        {
          shape: 'decision',
          text: '◇ moisture < 40% หรือไม่?',
          trueBranch: '✅ ใช่: เปิดปั๊มน้ำ 3 วินาที',
          falseBranch: '❌ ไม่ใช่: ปิดปั๊มน้ำ',
          structureTag: 'Selection',
        },
        {
          shape: 'loopNote',
          text: 'หน่วงเวลา 10 วินาที → ⤴️ วนกลับไปอ่านค่าความชื้นใหม่',
          structureTag: 'Loop (Forever)',
        },
        { shape: 'terminator', text: 'จบการทำงานเมื่อปิดสวิตช์ (End)' },
      ],
    },
    {
      shortTitle: '🚦 ไฟจราจรโรงเรียน',
      title: '🚦 กรณีศึกษาที่ 4: สัญญาณไฟคนข้ามถนนอัจฉริยะหน้าโรงเรียน',
      gradeTag: 'ป.4–ป.5 · ความปลอดภัย',
      structureFormula: 'ทางเลือก (Selection) + ลำดับ (Sequence) + วนซ้ำ (Loop)',
      steps: [
        {
          pillar: '1. แยกย่อยปัญหา (Decomposition)',
          color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900',
          content: 'แบ่งอุปกรณ์เป็น 3 ส่วน: 1) ปุ่มกดสำหรับนักเรียน 2) ชุดไฟสีเขียว-เหลือง-แดง 3) เสียงติ๊ดเตือนคนข้าม',
        },
        {
          pillar: '2. หารูปแบบ (Pattern)',
          color: 'border-sky-200 bg-sky-50/70 text-sky-900',
          content: 'ทุกครั้งที่มีคนกดปุ่ม ลำดับการสลับไฟจะเหมือนเดิมเป๊ะ: เขียวรถ → เหลือง 3 วิ → แดงรถ + เขียวคนข้าม',
        },
        {
          pillar: '3. คิดเชิงนามธรรม (Abstraction)',
          color: 'border-amber-200 bg-amber-50/70 text-amber-900',
          content: 'สนแค่ค่า buttonPressed (ถูกกด=True / ไม่ถูกกด=False) ไม่ต้องสนว่าคนกดใส่เสื้อสีอะไรหรือสูงเท่าไหร่',
        },
        {
          pillar: '4. ออกแบบอัลกอริทึม (Algorithm)',
          color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
          content: 'ตรวจปุ่มกด -> ถ้ากดปุ่ม: สลับไฟรถเป็นเหลือง-แดง + เปิดไฟเขียวคนข้าม 10 วิ -> มิฉะนั้น: ให้รถวิ่งต่อ',
        },
      ],
      controlMappings: [
        {
          type: 'selection',
          badgeText: '2. ทางเลือก (Selection / If-Else)',
          roleTitle: 'ตรวจสอบว่ามีนักเรียนกดปุ่มขอข้ามถนนหรือไม่',
          detail: 'กดปุ่ม → เข้าสู่ลำดับหยุดรถให้คนข้าม | ไม่กด → ไฟเขียวรถวิ่งปกติ',
        },
        {
          type: 'sequence',
          badgeText: '1. ลำดับ (Sequence)',
          roleTitle: 'เปลี่ยนไฟเหลือง (3 วิ) → ไฟแดงรถ + ไฟเขียวคนข้าม (10 วิ)',
          detail: 'ห้ามข้ามจากไฟเขียวรถไปไฟเขียวคนข้ามทันที ต้องมีไฟเหลืองเตือนก่อนเสมอ',
        },
        {
          type: 'loop',
          badgeText: '3. การวนซ้ำ (Repeat 10 + Forever)',
          roleTitle: 'นับถอยหลัง 10 วินาทีขณะข้าม และรอรับการกดปุ่มรอบใหม่',
          detail: 'ส่งเสียงเตือนสั้นๆ ซ้ำ 10 ครั้งก่อนกลับสู่สถานะปกติ',
        },
      ],
      flowchartNodes: [
        { shape: 'terminator', text: 'เริ่มต้น (Start) · ไฟรถ=เขียว, ไฟคน=แดง' },
        { shape: 'io', text: 'รับค่าการกดปุ่มขอข้ามถนน', structureTag: 'Input' },
        {
          shape: 'decision',
          text: '◇ มีคนกดปุ่มหรือไม่?',
          trueBranch: '✅ ใช่: ไฟเหลือง 3 วิ → แดงรถ',
          falseBranch: '❌ ไม่ใช่: รถวิ่งต่อตามปกติ',
          structureTag: 'Selection',
        },
        { shape: 'process', text: 'เปิดไฟเขียวคนข้าม + นับถอยหลัง 10 วิ', structureTag: 'Sequence + Repeat 10' },
        {
          shape: 'loopNote',
          text: '⤴️ วนกลับไปรอตรวจปุ่มกดใหม่อย่างต่อเนื่อง',
          structureTag: 'Loop (Forever)',
        },
        { shape: 'terminator', text: 'จบการทำงานเมื่อปิดระบบ (End)' },
      ],
    },
    {
      shortTitle: '🧮 บอททายสูตรคูณ',
      title: '🧮 กรณีศึกษาที่ 5: บอทผู้ช่วยทบทวนสูตรคูณ 10 ข้อ (Scratch Quiz)',
      gradeTag: 'ป.4–ป.6 · คณิตศาสตร์ & เกม',
      structureFormula: 'วนซ้ำ (Repeat 10) + ลำดับ (Sequence) + ทางเลือก (If-Else)',
      steps: [
        {
          pillar: '1. แยกย่อยปัญหา (Decomposition)',
          color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900',
          content: 'แบ่งระบบควิซเป็น: 1) สุ่มโจทย์ a × b 2) รับคำตอบผู้เล่น 3) ตรวจถูก-ผิดและเพิ่มคะแนน 4) สรุปผลท้ายเกม',
        },
        {
          pillar: '2. หารูปแบบ (Pattern)',
          color: 'border-sky-200 bg-sky-50/70 text-sky-900',
          content: 'ทั้ง 10 ข้อทำรูปแบบเดียวกันหมด: สุ่มเลข a, b -> ถามคำตอบ -> เทียบกับ (a × b) จึงใช้บล็อก Repeat (10) ได้',
        },
        {
          pillar: '3. คิดเชิงนามธรรม (Abstraction)',
          color: 'border-amber-200 bg-amber-50/70 text-amber-900',
          content: 'ใช้ตัวแปรแค่ 3 ตัว: a, b และ score ไม่ต้องเก็บข้อความตกแต่งยาวๆ เพื่อคำนวณได้รวดเร็ว',
        },
        {
          pillar: '4. ออกแบบอัลกอริทึม (Algorithm)',
          color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
          content: 'วนซ้ำ 10 รอบ: สุ่ม a,b -> รับค่า answer -> ถ้า answer = a*b ให้ +1 คะแนน มิฉะนั้นเฉลยคำตอบ -> จบเกมโชว์ score',
        },
      ],
      controlMappings: [
        {
          type: 'loop',
          badgeText: '3. การวนซ้ำ (Repeat 10)',
          roleTitle: 'ถามคำถามสูตรคูณครบทั้ง 10 ข้ออัตโนมัติ',
          detail: 'เขียนชุดโค้ดถามคำถามเพียง 1 ชุด แล้วสั่ง repeat (10) แทนการก๊อปปี้ 10 รอบ',
        },
        {
          type: 'sequence',
          badgeText: '1. ลำดับ (Sequence)',
          roleTitle: 'สุ่มเลข → แสดงคำถาม → รับคำตอบ → ตรวจผล',
          detail: 'ต้องรับคำตอบจากผู้เล่นก่อน จึงจะคำนวณตรวจว่าถูกหรือผิดได้',
        },
        {
          type: 'selection',
          badgeText: '2. ทางเลือก (Selection / If-Else)',
          roleTitle: 'ตรวจ answer == a × b',
          detail: 'ตอบถูก → ชม "เก่งมาก!" และบวก +1 คะแนน | ตอบผิด → เฉลยคำตอบที่ถูกต้อง',
        },
      ],
      flowchartNodes: [
        { shape: 'terminator', text: 'เริ่มต้น (Start) · score = 0, ข้อที่ = 1' },
        { shape: 'process', text: 'สุ่มตัวเลข a, b และถาม: "a × b = ?"', structureTag: 'Sequence' },
        { shape: 'io', text: 'รับคำตอบจากผู้เล่น (answer)', structureTag: 'Input' },
        {
          shape: 'decision',
          text: '◇ answer = a × b หรือไม่?',
          trueBranch: '✅ ใช่: บวก +1 คะแนน',
          falseBranch: '❌ ไม่ใช่: แสดงเฉลย (a × b)',
          structureTag: 'Selection',
        },
        {
          shape: 'loopNote',
          text: '◇ ครบ 10 ข้อหรือยัง? (ถ้ายัง → ข้อที่ +1 ⤴️ วนถามข้อถัดไป)',
          structureTag: 'Loop (Repeat 10)',
        },
        { shape: 'terminator', text: 'จบการทำงาน (End) · แสดงผล score / 10' },
      ],
    },
  ];

  const current = pillars[activePillar];
  const Icon = current.icon;
  const selectedAns = selectedQuizAnswers[current.id];
  const activeStudy = integratedCaseStudies[activeCaseStudy] || integratedCaseStudies[0];

  const getControlCardColor = (type: ControlPatternType) => {
    if (type === 'sequence') return 'bg-indigo-50 border-indigo-200 text-indigo-950';
    if (type === 'selection') return 'bg-amber-50 border-amber-200 text-amber-950';
    return 'bg-emerald-50 border-emerald-200 text-emerald-950';
  };

  const getControlBadgeColor = (type: ControlPatternType) => {
    if (type === 'sequence') return 'bg-indigo-600 text-white';
    if (type === 'selection') return 'bg-amber-500 text-white';
    return 'bg-emerald-600 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Main Interactive 4 Pillars Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="mb-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              พื้นฐานการคิด (ป.4 – ป.6 มาตรฐาน ว 4.2)
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              4 เสาหลักการคิดเชิงคำนวณ (Computational Thinking)
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              ทักษะการแก้ปัญหาอย่างเป็นขั้นตอน ช่วยให้คิดอย่างมีตรรกะ เข้าใจง่ายทั้งในชีวิตประจำวันและการเขียนโปรแกรม
            </p>
          </div>
          {onOpenFlowchart && (
            <button
              onClick={onOpenFlowchart}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <span>ดูตัวอย่างผังงาน Flowchart ป.4–ป.6</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Pillar switcher buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {pillars.map((p) => {
            const PIcon = p.icon;
            const isSelected = activePillar === p.id;
            const isQuizSolved = selectedQuizAnswers[p.id] === p.quickQuiz.correctIndex;
            return (
              <button
                key={p.id}
                onClick={() => setActivePillar(p.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    <PIcon className="w-4 h-4" />
                  </span>
                  <div className="flex items-center gap-1">
                    {isQuizSolved && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isSelected && <ChevronRight className="w-4 h-4 text-sky-400" />}
                  </div>
                </div>
                <div className="text-xs font-bold leading-snug">
                  {p.id + 1}. {p.shortTitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Showcase */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${current.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900">{current.title}</h4>
              <p className="text-xs text-slate-500 font-medium">{current.subtitle}</p>
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span>จำง่ายๆ: {current.oneLiner}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
            {current.description}
          </p>

          {/* Daily & Coding Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span>☕ ตัวอย่างในชีวิตประจำวัน</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{current.dailyExample}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-indigo-200">
              <div className="text-xs font-bold text-indigo-700 mb-1.5 flex items-center gap-1.5">
                <span>💻 ตัวอย่างในการเขียนโปรแกรม (Scratch / Micro:bit)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{current.codingExample}</p>
            </div>
          </div>

          {/* Grade-by-Grade Examples (ป.4 - ป.6) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>ตัวอย่างเพิ่มเติมตามระดับชั้น (ป.4 – ป.6)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {current.gradeExamples.map((ex, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${current.badgeColor}`}>
                      {ex.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{ex.topic}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{ex.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Mini-Quiz Check */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ลองทดสอบความเข้าใจเสาหลักที่ {current.id + 1}:</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mb-3">{current.quickQuiz.question}</p>
            <div className="space-y-2">
              {current.quickQuiz.options.map((opt, idx) => {
                const isChosen = selectedAns === idx;
                const isCorrect = idx === current.quickQuiz.correctIndex;
                let btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                if (selectedAns !== undefined) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                  } else if (isChosen) {
                    btnStyle = 'bg-rose-50 border-rose-300 text-rose-800';
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedQuizAnswers((prev) => ({ ...prev, [current.id]: idx }))}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                  >
                    <span>
                      {['ก.', 'ข.', 'ค.'][idx]} {opt}
                    </span>
                    {selectedAns !== undefined && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {selectedAns !== undefined && isChosen && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedAns !== undefined && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs border ${
                  selectedAns === current.quickQuiz.correctIndex
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <span className="font-bold">คำอธิบาย: </span>
                {current.quickQuiz.explanation}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated 4 Pillars Case Study + Control Structures & Flowchart Bridge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              ตัวอย่างบูรณาการครบ 4 ขั้นตอนในเรื่องเดียว (5 กรณีศึกษา)
            </span>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
              ดูวิธีใช้ 4 เสาหลักร่วมกัน พร้อมเชื่อมโยงสู่ผังงาน Flowchart และโครงสร้างควบคุม
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {integratedCaseStudies.map((cs, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveCaseStudy(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activeCaseStudy === idx
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                เรื่องที่ {idx + 1}: {cs.shortTitle}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold text-slate-900">{activeStudy.title}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold">
              โครงสร้างที่ใช้: {activeStudy.structureFormula}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
              {activeStudy.gradeTag}
            </span>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {activeStudy.steps.map((st, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${st.color} flex flex-col justify-between`}>
              <div>
                <div className="text-xs font-bold mb-1.5">{st.pillar}</div>
                <p className="text-xs leading-relaxed opacity-90">{st.content}</p>
              </div>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider opacity-60">
                ขั้นตอนที่ {idx + 1} / 4
              </div>
            </div>
          ))}
        </div>

        {/* Bridge to Control Structures & Visual Flowchart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-5 border-t border-slate-100 items-start">
          {/* Left: Control Structure Breakdown */}
          <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-indigo-600" />
                <span>เชื่อมโยงสู่รูปแบบโครงสร้างควบคุม (Control Structures)</span>
              </div>
              {onOpenControlStructures && (
                <button
                  type="button"
                  onClick={onOpenControlStructures}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <span>เปิดบทเรียน 3 โครงสร้าง</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              เมื่อเรานำขั้นตอนที่ 4 (Algorithm) มาเขียนโค้ดจริง จะเห็นว่าเรื่องนี้ประกอบด้วยโครงสร้างควบคุมหลักดังนี้:
            </p>

            <div className="space-y-2.5">
              {activeStudy.controlMappings.map((cm, idx) => (
                <div key={idx} className={`p-3 rounded-xl border ${getControlCardColor(cm.type)} space-y-1`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getControlBadgeColor(cm.type)}`}>
                      {cm.badgeText}
                    </span>
                    <span className="text-xs font-bold">{cm.roleTitle}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">{cm.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Linked Mini Flowchart Diagram */}
          <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                <span>ภาพผังงาน Flowchart เชื่อมโยงของกรณีศึกษานี้</span>
              </div>
              {onOpenFlowchart && (
                <button
                  type="button"
                  onClick={onOpenFlowchart}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <span>ลองลากวางผังงานนี้</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="w-full max-w-sm flex flex-col items-center space-y-1.5">
              {activeStudy.flowchartNodes.map((node, idx) => (
                <React.Fragment key={idx}>
                  {node.shape === 'terminator' && (
                    <div className="px-5 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold text-center">
                      {node.text}
                    </div>
                  )}

                  {node.shape === 'io' && (
                    <div className="w-full px-4 py-2 rounded-lg -skew-x-6 bg-sky-100 border-2 border-sky-400 text-sky-950 text-xs font-bold text-center">
                      <div className="skew-x-6 flex flex-col items-center gap-0.5">
                        <span>{node.text}</span>
                        {node.structureTag && (
                          <span className="text-[9px] font-semibold text-sky-700 uppercase">
                            [{node.structureTag}]
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {node.shape === 'process' && (
                    <div className="w-full px-4 py-2 rounded-xl bg-white border-2 border-indigo-400 text-slate-900 text-xs font-semibold text-center shadow-xs">
                      <div>{node.text}</div>
                      {node.structureTag && (
                        <div className="text-[9px] font-bold text-indigo-600 mt-0.5">[{node.structureTag}]</div>
                      )}
                    </div>
                  )}

                  {node.shape === 'decision' && (
                    <div className="w-full space-y-2">
                      <div className="w-full px-4 py-2.5 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-100 text-amber-950 text-xs font-bold text-center">
                        <div>{node.text}</div>
                        {node.structureTag && (
                          <div className="text-[9px] font-bold text-amber-700 mt-0.5">[{node.structureTag}]</div>
                        )}
                      </div>
                      {(node.trueBranch || node.falseBranch) && (
                        <div className="grid grid-cols-2 gap-2 w-full">
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] font-bold text-center">
                            {node.trueBranch}
                          </div>
                          <div className="p-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-[11px] font-bold text-center">
                            {node.falseBranch}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {node.shape === 'loopNote' && (
                    <div className="w-full px-4 py-2 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-[11px] font-bold text-center">
                      <div>{node.text}</div>
                      {node.structureTag && (
                        <div className="text-[9px] font-bold text-emerald-700 mt-0.5">[{node.structureTag}]</div>
                      )}
                    </div>
                  )}

                  {idx < activeStudy.flowchartNodes.length - 1 && (
                    <ArrowDown className="w-4 h-4 text-slate-400" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
