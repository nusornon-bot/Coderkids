import type { ExamSetMeta } from './onetTypes.ts';
import {
  SET_11_QUESTIONS,
  SET_12_QUESTIONS,
  SET_13_QUESTIONS,
  SET_14_QUESTIONS,
  SET_15_QUESTIONS,
} from './onetExtraSetsData11to15.ts';
import {
  SET_16_QUESTIONS,
  SET_17_QUESTIONS,
  SET_18_QUESTIONS,
  SET_19_QUESTIONS,
  SET_20_QUESTIONS,
} from './onetExtraSetsData16to20.ts';

export const EXTRA_ONET_EXAM_SETS: ExamSetMeta[] = [
  {
    id: 'set11',
    setNumber: 11,
    title: 'ชุดที่ 11: สถานะเริ่มต้น เงื่อนไขเบื้องต้น & สิทธิพื้นฐานดิจิทัล',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (ระบบล็อกเกอร์ การเดินทาง PDPA & มารยาทดิจิทัล)',
    badgeText: 'ชุดที่ 11 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'มาตรฐาน (Standard)',
    timeMinutes: 15,
    questions: SET_11_QUESTIONS,
  },
  {
    id: 'set12',
    setNumber: 12,
    title: 'ชุดที่ 12: อัลกอริทึมจัดตารางงาน เส้นทางเดินรถ & ความปลอดภัยบัญชีออนไลน์',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (ลำดับคิว เส้นทางรถ OTP, Phishing & CC BY-NC)',
    badgeText: 'ชุดที่ 12 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'เข้มข้น (Intermediate)',
    timeMinutes: 15,
    questions: SET_12_QUESTIONS,
  },
  {
    id: 'set13',
    setNumber: 13,
    title: 'ชุดที่ 13: การสื่อสารระหว่างตัวละคร เงื่อนไขซ้อน & จริยธรรมงานกลุ่มออนไลน์',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (Broadcast, Nested If, สิทธิ์ไฟล์คลาวด์ & มัลแวร์)',
    badgeText: 'ชุดที่ 13 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'เข้มข้น (Intermediate)',
    timeMinutes: 15,
    questions: SET_13_QUESTIONS,
  },
  {
    id: 'set14',
    setNumber: 14,
    title: 'ชุดที่ 14: ระบบอัตโนมัติในโรงเรียน การตัดสินใจหลายเงื่อนไข & PDPA',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (เครื่องตากผ้าอัตโนมัติ คิวบริการ & รอยเท้าดิจิทัล)',
    badgeText: 'ชุดที่ 14 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'เข้มข้น (Intermediate)',
    timeMinutes: 15,
    questions: SET_14_QUESTIONS,
  },
  {
    id: 'set15',
    setNumber: 15,
    title: 'ชุดที่ 15: การสังเคราะห์เงื่อนไขแบบวนซ้ำ การค้นหาแบบแบ่งครึ่ง & การรับมือภัยไซเบอร์',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (Binary Search, ลูปสะสมค่า & Wi-Fi สาธารณะ)',
    badgeText: 'ชุดที่ 15 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'ท้าทาย O-NET & สสวท. (Advanced)',
    timeMinutes: 15,
    questions: SET_15_QUESTIONS,
  },
  {
    id: 'set16',
    setNumber: 16,
    title: 'ชุดที่ 16: ตารางตรรกะ การเพิ่มประสิทธิภาพทรัพยากร & การรู้เท่าทัน Deepfake',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (จัดสรรเรือขนของ ทัวร์นาเมนต์ & เสียง AI ปลอม)',
    badgeText: 'ชุดที่ 16 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'ท้าทาย O-NET & สสวท. (Advanced)',
    timeMinutes: 15,
    questions: SET_16_QUESTIONS,
  },
  {
    id: 'set17',
    setNumber: 17,
    title: 'ชุดที่ 17: วิเคราะห์สถานการณ์ Scratch/Flowchart เชิงตรรกะ & ลิขสิทธิ์-รอยเท้าดิจิทัล',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (พิกัด เขาวงกต ลำดับเงื่อนไข & ความปลอดภัยข้อมูลส่วนตัว)',
    badgeText: 'ชุดที่ 17 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'ท้าทาย O-NET & สสวท. (Advanced)',
    timeMinutes: 15,
    questions: SET_17_QUESTIONS,
  },
  {
    id: 'set18',
    setNumber: 18,
    title: 'ชุดที่ 18: นวัตกรรมสมองกลฝังตัวเชิงสถานการณ์ เงื่อนไขพลังงาน & สุขภาวะดิจิทัล',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (โดรนสำรวจ ระบบดับไฟอัตโนมัติ & กฎ 20-20-20)',
    badgeText: 'ชุดที่ 18 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'ท้าทาย O-NET & สสวท. (Advanced)',
    timeMinutes: 15,
    questions: SET_18_QUESTIONS,
  },
  {
    id: 'set19',
    setNumber: 19,
    title: 'ชุดที่ 19: โจทย์สังเคราะห์สหวิทยาการ (ตรรกะ คณิตศาสตร์ เวลา & กฎหมายดิจิทัล)',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (ค.ร.น. โรงเรือน สลับค่าตัวแปร & PDPA ข้อมูลอ่อนไหว)',
    badgeText: 'ชุดที่ 19 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'ท้าทาย O-NET & สสวท. (Advanced)',
    timeMinutes: 15,
    questions: SET_19_QUESTIONS,
  },
  {
    id: 'set20',
    setNumber: 20,
    title: 'ชุดที่ 20: โค้งสุดท้าย O-NET ป.6 เชิงวิเคราะห์-สังเคราะห์เข้มข้น',
    subtitle:
      'วิเคราะห์สถานการณ์เน้นตัวชี้วัดต้องรู้ ว 4.2 ป.4/1, ป.6/1 และ ป.6/4 (ตารางซัก-อบผ้า โปรโมชัน 2FA & พลเมืองดิจิทัล)',
    badgeText: 'ชุดที่ 20 • 10 ข้อ (50 คะแนน)',
    focusIndicators: ['ว 4.2 ป.4/1 (ต้องรู้)', 'ว 4.2 ป.6/1 (ต้องรู้)', 'ว 4.2 ป.6/4 (ต้องรู้)'],
    difficulty: 'ท้าทาย O-NET & สสวท. (Advanced)',
    timeMinutes: 15,
    questions: SET_20_QUESTIONS,
  },
];
