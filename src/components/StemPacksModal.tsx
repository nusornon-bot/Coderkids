import React, { useState } from 'react';
import {
  Rocket,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  FileText,
  Printer,
  X,
  Play,
  RotateCcw,
  Zap,
  Activity,
  Sliders,
  Droplets,
  Bell,
  Footprints,
  Download,
  BookOpen,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects.ts';

interface StemPacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardPoints?: (points: number, reason: string) => void;
}

interface StemProjectDetail {
  id: string;
  title: string;
  subtitle: string;
  grade: string;
  icon: string;
  badgeColor: string;
  science: string;
  technology: string;
  engineering: string;
  math: string;
  hardware: string[];
  simulationState: {
    label: string;
    actionLabel: string;
    unit: string;
    defaultVal: number;
    threshold: number;
    mode?: 'increase_until_threshold' | 'toggle_low' | 'toggle_high' | 'counter';
    step?: number;
    activeText?: string;
    idleText?: string;
  };
  flowchartSteps: string[];
  pythonCode: string;
}

const STEM_PACKS: StemProjectDetail[] = [
  {
    id: 'smart_farm',
    title: '🌱 แปลงผักอัจฉริยะ (Smart Farm & Auto Watering)',
    subtitle: 'ตรวจวัดความชื้นในดินและสั่งปั๊มน้ำจิ๋วทำงานอัตโนมัติด้วย Micro:bit V2',
    grade: 'ป.5 - ว 4.2 ป.5/2',
    icon: '🌱',
    badgeColor: 'emerald',
    science: 'การดูดซึมน้ำของรากพืช ปัจจัยที่มีผลต่อการคายน้ำ และโครงสร้างดินร่วน/ดินทราย',
    technology: 'เซ็นเซอร์วัดความชื้นชนิดความต้านทาน (Soil Moisture Sensor) และรีเลย์ 5V',
    engineering: 'การออกแบบหัวจ่ายน้ำหยดแบบประหยัดน้ำและกล่องกันน้ำสำหรับวงจรไฟฟ้า',
    math: 'การเทียบอัตราส่วนค่าสัญญาณ Analog (0-1023) ให้เป็นร้อยละความชื้นดิน (%)',
    hardware: ['บอร์ด Micro:bit V2', 'Moisture Sensor (ขั้ว P0)', 'ปั๊มน้ำ 5V + ท่อสายยาง', 'สายไฟ Jumper'],
    simulationState: {
      label: 'ระดับความชื้นในดิน',
      actionLabel: '💧 รดน้ำต้นไม้จำลอง',
      unit: '%',
      defaultVal: 22,
      threshold: 40,
    },
    flowchartSteps: [
      '1. เริ่มต้น (Start) วนซ้ำทุก 2 วินาที',
      '2. อ่านค่าสัญญาณจากขา P0 เก็บลงตัวแปร moisture',
      '3. ตรวจสอบ: moisture < 40% หรือไม่?',
      '4. ถ้าจริง (Yes): สั่งเปิดปั๊มน้ำ (P1=1) และแสดงหน้าเศร้า ☹️',
      '5. ถ้าเท็จ (No): สั่งปิดปั๊มน้ำ (P1=0) และแสดงหน้ายิ้ม 😊',
    ],
    pythonCode: `from microbit import *

while True:
    moisture = pin0.read_analog()
    percent = (moisture / 1023) * 100
    
    if percent < 40:
        pin1.write_digital(1) # เปิดปั๊มน้ำ
        display.show(Image.SAD)
    else:
        pin1.write_digital(0) # ปิดปั๊มน้ำ
        display.show(Image.HAPPY)
    sleep(2000)`,
  },
  {
    id: 'pedometer',
    title: '🏃‍♂️ สายรัดข้อมือนับก้าวเพื่อสุขภาพ (Smart Pedometer)',
    subtitle: 'ตรวจจับแรงสั่นสะเทือนด้วยเซ็นเซอร์ Accelerometer 3 แกน คำนวณแคลอรี',
    grade: 'ป.4 - ว 4.2 ป.4/2',
    icon: '🏃‍♂️',
    badgeColor: 'cyan',
    science: 'ระบบการไหลเวียนโลหิตและการเผาผลาญพลังงาน (Metabolism) ในร่างกายมนุษย์',
    technology: 'เซ็นเซอร์วัดความเร่ง 3 แกน (Accelerometer: X, Y, Z) ภายใน Micro:bit',
    engineering: 'การออกแบบสายรัดข้อมือตามหลักสรีรศาสตร์ (Ergonomics) และป้องกันเหงื่อ',
    math: 'การนับสะสมตัวแปร Step count และสูตรคำนวณแคลอรี: Calories = Steps * 0.04 kcal',
    hardware: ['บอร์ด Micro:bit V2', 'สายรัดข้อมือซิลิโคน', 'กล่องแบตเตอรี่ AAA 2 ก้อน'],
    simulationState: {
      label: 'จำนวนก้าวเดินสะสม',
      actionLabel: '👟 เขย่า/เดินจำลอง',
      unit: 'ก้าว',
      defaultVal: 120,
      threshold: 500,
    },
    flowchartSteps: [
      '1. เมื่อเปิดเครื่อง: กำหนด steps = 0',
      '2. เมื่อตรวจพบการสั่น (on shake):',
      '3. steps = steps + 1',
      '4. แสดงจำนวนก้าวบนหน้าจอ LED 5x5',
      '5. เมื่อกดปุ่ม A: แสดงแคลอรี (steps * 0.04)',
    ],
    pythonCode: `from microbit import *

steps = 0

while True:
    if accelerometer.was_gesture('shake'):
        steps += 1
        display.show(steps)
    if button_a.is_pressed():
        calories = steps * 0.04
        display.scroll(str(calories) + " kcal")`,
  },
  {
    id: 'laser_alarm',
    title: '🚨 สัญญาณเตือนภัยกันขโมย (Laser Security Alarm)',
    subtitle: 'ตรวจจับลำแสงและตรวจวัดระดับความสว่าง ป้องกันผู้บุกรุกพร้อมไซเรน',
    grade: 'ป.6 - ว 4.2 ป.6/2',
    icon: '🚨',
    badgeColor: 'rose',
    science: 'คุณสมบัติของแสง การเดินทางเป็นเส้นตรง และการถูกบดบังทำให้เกิดเงามืด',
    technology: 'เซ็นเซอร์วัดแสง (Light Level) และตัวกำเนิดเสียงลำโพง (Buzzer Speaker)',
    engineering: 'การวางแนวลำแสงให้ครอบคลุมช่องทางเข้าประตู-หน้าต่างห้องปฏิบัติการ',
    math: 'การกำหนดค่าขีดจำกัด (Threshold) และช่วงเวลาความถี่สัญญาณเตือน (Hz / ms)',
    hardware: ['บอร์ด Micro:bit V2', 'หลอดเลเซอร์พอยเตอร์ 5V', 'โฟโตทรานซิสเตอร์ / Light Sensor', 'ลำโพง Buzzer'],
    simulationState: {
      label: 'ระดับแสงตกกระทบเซ็นเซอร์',
      actionLabel: '🖐️ แกล้งเดินตัดลำแสง',
      unit: 'Lux',
      defaultVal: 85,
      threshold: 30,
    },
    flowchartSteps: [
      '1. เริ่มต้นระบบรักษาความปลอดภัย (Armed)',
      '2. อ่านค่าระดับแสง (light_level)',
      '3. ตรวจสอบ: ลำแสงถูกตัดขาดหรือไม่ (light_level < 30)?',
      '4. ถ้าถูกตัด: ส่งเสียงไซเรนเตือน 1000Hz และเปิดไฟกระพริบฉุกเฉิน',
      '5. เมื่อกดปุ่ม A+B พร้อมกัน: ปลดล็อคระบบเตือนภัย',
    ],
    pythonCode: `from microbit import *
import music

armed = True

while True:
    light = display.read_light_level()
    if armed and light < 30:
        display.show(Image.SKULL)
        music.play(music.BA_DING)
    elif button_a.is_pressed() and button_b.is_pressed():
        armed = not armed # เปิด/ปิดระบบ`,
  },
  {
    id: 'flood_beacon',
    title: '🌊 ทุ่นเตือนภัยน้ำท่วมไร้สาย (Smart Flood Warning)',
    subtitle: 'ตรวจจับระดับน้ำหลากในชุมชนและส่งคลื่นวิทยุแจ้งเตือนบ้านเรือนทันที',
    grade: 'ป.6 - ว 4.2 ป.6/2',
    icon: '🌊',
    badgeColor: 'blue',
    science: 'การไหลของน้ำ พลังงานศักย์-จลน์ และกลไกการลอยตัวของวัตถุ (Archimedes)',
    technology: 'เซ็นเซอร์ระดับน้ำ (Water Level Sensor) และวิทยุสื่อสารไร้สาย Micro:bit Radio',
    engineering: 'ออกแบบทุ่นลอยกันน้ำพร้อมท่อป้องกันคลื่นซัดเพื่อให้เซ็นเซอร์อ่านค่าได้เสถียร',
    math: 'ความสูงระดับน้ำวิกฤต (ซม.) และการเปรียบเทียบค่ามากกว่า threshold',
    hardware: ['Micro:bit V2 x 2 บอร์ด', 'Water Level Sensor (Pin P0)', 'กล่องทุ่นลอยกันน้ำ'],
    simulationState: {
      label: 'ระดับน้ำในคลองจำลอง',
      actionLabel: '🌧️ จำลองน้ำเพิ่มสูงขึ้น',
      unit: 'ซม.',
      defaultVal: 35,
      threshold: 80,
      mode: 'toggle_high',
      step: 20,
      activeText: 'น้ำเกินขีดอันตราย! ส่งสัญญาณเตือนอพยพ (ALERT)',
      idleText: 'ระดับน้ำอยู่ในเกณฑ์ปลอดภัย (NORMAL)',
    },
    flowchartSteps: [
      '1. กำหนดคลื่นวิทยุ radio.set_group(88)',
      '2. อ่านค่าระดับน้ำจากขา P0 แปลงเป็นเซนติเมตร',
      '3. ตรวจสอบ: water_cm >= 80 ซม. หรือไม่?',
      '4. ถ้าจริง: ส่ง radio.send("FLOOD") และร้องเสียงเตือนไซเรน',
      '5. ถ้าเท็จ: แสดงไอคอนติ๊กถูก ✅ สถานะปลอดภัย',
    ],
    pythonCode: `from microbit import *
import radio

radio.on()
radio.config(group=88)

while True:
    level = pin0.read_analog() * 100 // 1023
    if level >= 80:
        radio.send("FLOOD")
        display.show(Image.SURPRISED)
    else:
        display.show(Image.YES)
    sleep(1000)`,
  },
  {
    id: 'air_guard',
    title: '🌫️ สถานีวัดฝุ่น PM2.5 อัจฉริยะ (Smart Air Quality Guard)',
    subtitle: 'วัดความหนาแน่นของฝุ่นละอองในอากาศ แจ้งเตือนธงสีเขียว-เหลือง-แดงหน้าเสาธง',
    grade: 'ป.6 - ว 4.2 ป.6/1',
    icon: '🌫️',
    badgeColor: 'teal',
    science: 'องค์ประกอบของอากาศ อนุภาคฝุ่น PM2.5 และผลกระทบต่อระบบทางเดินหายใจ',
    technology: 'เซ็นเซอร์แสงอินฟราเรดวัดฝุ่นละออง (Optical Dust Sensor) และหลอด LED 3 สี',
    engineering: 'ออกแบบช่องดักลมและพัดลมดูดอากาศจิ๋วเข้าสู่ห้องวัดแสงให้แม่นยำ',
    math: 'ช่วงดัชนีคุณภาพอากาศ (AQI) และหน่วยวัดไมโครกรัมต่อลูกบาศก์เมตร (µg/m³)',
    hardware: ['Micro:bit V2', 'Optical Dust Sensor (P0)', 'ชุด LED จราจร 3 สี'],
    simulationState: {
      label: 'ค่าฝุ่น PM2.5 จำลอง',
      actionLabel: '💨 จำลองค่าฝุ่นเปลี่ยนแปลง',
      unit: 'µg/m³',
      defaultVal: 24,
      threshold: 50,
      mode: 'toggle_high',
      step: 18,
      activeText: 'ค่าฝุ่นเกินมาตรฐาน! งดกิจกรรมกลางแจ้ง (MASK ON)',
      idleText: 'อากาศสดใส เหมาะทำกิจกรรมกลางแจ้ง (GOOD)',
    },
    flowchartSteps: [
      '1. อ่านค่าความขุ่นมัวของฝุ่นจาก Dust Sensor',
      '2. แปลงค่าเป็นหน่วย µg/m³',
      '3. ถ้าเกิน 50 µg/m³: เปิดไฟแดงและแจ้งเตือนสวมหน้ากาก',
      '4. ถ้าไม่เกิน: เปิดไฟเขียวและแสดงหน้ายิ้ม',
    ],
    pythonCode: `from microbit import *

while True:
    pm25 = pin0.read_analog() // 8
    if pm25 >= 50:
        pin1.write_digital(1) # ไฟแดง
        display.scroll("MASK")
    else:
        pin1.write_digital(0)
        display.show(Image.HAPPY)
    sleep(2000)`,
  },
  {
    id: 'smart_bin',
    title: '🗑️ ถังขยะเปิด-ปิดอัตโนมัติ (Touchless Ultrasonic Bin)',
    subtitle: 'ตรวจจับมือที่ยื่นเข้ามาทิ้งขยะด้วยคลื่นเสียง Ultrasonic แล้วหมุน Servo เปิดฝา',
    grade: 'ป.5 - ว 4.2 ป.5/2',
    icon: '🗑️',
    badgeColor: 'sky',
    science: 'การสะท้อนของคลื่นเสียงความถี่สูง (Ultrasound) เหมือนค้างคาวใช้บอกตำแหน่ง',
    technology: 'HC-SR04 Ultrasonic Sensor และ Micro Servo SG90',
    engineering: 'คำนวณจุดยึดก้านโยกServo ให้เปิดฝาได้กว้าง 90 องศาโดยไม่ติดขัด',
    math: 'สูตรคำนวณระยะทางจากเวลาสะท้อนกลับ: Distance = (Time × 340 m/s) / 2',
    hardware: ['Micro:bit V2', 'Ultrasonic HC-SR04', 'Servo Motor SG90'],
    simulationState: {
      label: 'ระยะห่างจากมือถึงฝาถัง',
      actionLabel: '✋ ยื่นมือเข้าใกล้ถังขยะ',
      unit: 'ซม.',
      defaultVal: 45,
      threshold: 15,
      mode: 'toggle_low',
      step: 15,
      activeText: 'พบมือระยะใกล้! หมุน Servo เปิดฝาถัง 90° (OPEN)',
      idleText: 'ฝาถังขยะปิดสนิท ป้องกันกลิ่น (CLOSED)',
    },
    flowchartSteps: [
      '1. ส่งคลื่นเสียง Ultrasonic ออกไปและจับเวลาสะท้อนกลับ',
      '2. คำนวณระยะห่างเป็นเซนติเมตร (distance)',
      '3. ถ้า distance < 15 ซม.: หมุน Servo ไปที่ 90° รอ 3 วินาที',
      '4. ครบเวลา: หมุน Servo กลับที่ 0° เพื่อปิดฝา',
    ],
    pythonCode: `from microbit import *

while True:
    # จำลองการวัดระยะห่าง Ultrasonic
    dist = pin0.read_analog() // 10
    if dist < 15:
        pin1.write_analog(128) # เปิดฝา 90 องศา
        sleep(3000)
    else:
        pin1.write_analog(26)  # ปิดฝา 0 องศา`,
  },
  {
    id: 'solar_tracker',
    title: '☀️ แผงโซลาร์เซลล์หันตามดวงอาทิตย์ (Dual-Sensor Solar Tracker)',
    subtitle: 'เปรียบเทียบค่าแสงซ้าย-ขวาแล้วหมุนแผงรับแสงอาทิตย์ให้ผลิตไฟฟ้าได้สูงสุดตลอดวัน',
    grade: 'ป.6 - ว 4.2 ป.6/2',
    icon: '☀️',
    badgeColor: 'amber',
    science: 'การเคลื่อนที่ปรากฏของดวงอาทิตย์บนท้องฟ้าและการเปลี่ยนพลังงานแสงเป็นพลังงานไฟฟ้า',
    technology: 'Photoresistor LDR 2 ตัว, Servo Motor และแผ่นโซลาร์เซลล์',
    engineering: 'สร้างฉากกั้นแสงตรงกลางระหว่างเซ็นเซอร์ซ้าย-ขวาเพื่อสร้างความต่างค่าแสง',
    math: 'การเปรียบเทียบผลต่างค่าตัวแปร |Light_Left - Light_Right| > 20',
    hardware: ['Micro:bit V2', 'LDR เซ็นเซอร์แสง x 2', 'Micro Servo Motor'],
    simulationState: {
      label: 'ความเข้มพลังงานไฟฟ้าที่ผลิตได้',
      actionLabel: '🔄 ปรับมุมรับแสงตามอาทิตย์',
      unit: '%',
      defaultVal: 48,
      threshold: 85,
      mode: 'increase_until_threshold',
      step: 20,
      activeText: 'มุมรับแสงตั้งฉาก 90° ประสิทธิภาพสูงสุด! (MAX POWER)',
      idleText: 'กำลังหมุนปรับองศาแผงโซลาร์เซลล์ (TRACKING)',
    },
    flowchartSteps: [
      '1. อ่านค่าแสงซ้าย (P0) และขวา (P1)',
      '2. เปรียบเทียบค่าแสงทั้งสองด้าน',
      '3. ถ้าซ้ายสว่างกว่า: หมุน Servo ไปทางซ้าย +5 องศา',
      '4. ถ้าขวาและซ้ายเท่ากัน: หยุดนิ่งเพื่อรับพลังงานเต็มที่',
    ],
    pythonCode: `from microbit import *

angle = 90
while True:
    left = pin0.read_analog()
    right = pin1.read_analog()
    if left - right > 30:
        angle = max(0, angle - 5)
    elif right - left > 30:
        angle = min(180, angle + 5)
    sleep(200)`,
  },
  {
    id: 'posture_coach',
    title: '🪑 เข็มขัดเตือนท่านั่งหลังตรง (Smart Posture Coach)',
    subtitle: 'ตรวจจับมุมเอียงการก้มตัวขณะอ่านหนังสือ ป้องกันอาการปวดหลังในวัยเรียน',
    grade: 'ป.5 - ว 4.2 ป.5/1',
    icon: '🪑',
    badgeColor: 'indigo',
    science: 'โครงสร้างกระดูกสันหลังและแรงกดทับของหมอนรองกระดูกเมื่อนั่งผิดท่า',
    technology: 'เซ็นเซอร์ตรวจจับมุมเอียง Accelerometer Pitch Angle และลำโพงแจ้งเตือน',
    engineering: 'ออกแบบตัวล็อกติดกับคอเสื้อด้านหลังที่มีน้ำหนักเบาและสวมใส่สบาย',
    math: 'การวัดมุมเอียงเป็นองศา (Degrees: 0° ถึง ±90°) และการใช้ค่าสัมบูรณ์ |angle|',
    hardware: ['Micro:bit V2', 'แบตเตอรี่ 3V น้ำหนักเบา', 'คลิปหนีบเสื้อ'],
    simulationState: {
      label: 'มุมเอียงของลำตัวขณะนั่งเรียน',
      actionLabel: '🧘 ทดสอบปรับท่านั่ง/ก้มตัว',
      unit: '°',
      defaultVal: 38,
      threshold: 25,
      mode: 'toggle_high',
      step: 15,
      activeText: 'ก้มตัวมากเกินไป! โปรดยืดหลังตรง (POSTURE ALERT)',
      idleText: 'ท่านั่งหลังตรง สง่างาม ปลอดภัย! (GOOD POSTURE)',
    },
    flowchartSteps: [
      '1. อ่านค่าความเอียงแกน Y ของ Accelerometer',
      '2. คำนวณเป็นมุมก้มตัว (องศา)',
      '3. ถ้ามุมเอียง > 25°: ส่งเสียงติ๊ดเบาๆ และแสดงลูกศรชี้ขึ้น',
      '4. ถ้านั่งตรง: แสดงรูปหัวใจให้กำลังใจ',
    ],
    pythonCode: `from microbit import *
import music

while True:
    y = accelerometer.get_y()
    if abs(y) > 400:
        display.show(Image.ARROW_N)
        music.pitch(440, 200)
    else:
        display.show(Image.HEART)
    sleep(500)`,
  },
  {
    id: 'sound_noise_meter',
    title: '🔇 เครื่องวัดเสียงรบกวนในห้องสมุด (Smart Library Noise Meter)',
    subtitle: 'ใช้ไมโครโฟนวัดระดับความดังเสียงในห้องเรียนและเปลี่ยนไฟสัญญาณเตือนให้ลดเสียง',
    grade: 'ป.4 - ว 4.2 ป.4/2',
    icon: '🔇',
    badgeColor: 'purple',
    science: 'ลักษณะของคลื่นเสียง แอมพลิจูด และผลกระทบของมลพิษทางเสียงต่อสมาธิ',
    technology: 'ไมโครโฟน MEMS ในตัว Micro:bit V2 และหน้าจอ LED Matrix 5x5',
    engineering: 'ออกแบบป้ายตั้งโต๊ะรูปใบหน้าแสดงอารมณ์ตามระดับเสียงในห้องสมุด',
    math: 'ระดับความเข้มเสียง (0-255 หน่วย) และการหาค่าเฉลี่ยเคลื่อนที่ (Moving Average)',
    hardware: ['Micro:bit V2 (มีไมโครโฟนในตัว)', 'ป้ายตั้งโต๊ะอะคริลิกหรือกระดาษแข็ง'],
    simulationState: {
      label: 'ความดังเสียงในห้องสมุด',
      actionLabel: '🗣️ จำลองเสียงพูดคุยดังขึ้น/เงียบลง',
      unit: 'dB',
      defaultVal: 42,
      threshold: 65,
      mode: 'toggle_high',
      step: 20,
      activeText: 'เสียงดังเกินกำหนด! กรุณาใช้เสียงกระซิบ (QUIET PLEASE)',
      idleText: 'บรรยากาศเงียบสงบ เหมาะกับการอ่านหนังสือ (QUIET)',
    },
    flowchartSteps: [
      '1. อ่านค่าความดังจากไมโครโฟนในตัว Micro:bit V2',
      '2. เปรียบเทียบกับค่าขีดจำกัดความเงียบ (Threshold)',
      '3. ถ้าระดับเสียงเกิน 65 dB: แสดงหน้าบึ้งและส่งเสียงเตือนเบาๆ',
      '4. ถ้าระดับเสียงปกติ: แสดงจุดยิ้มสีเขียวสงบ',
    ],
    pythonCode: `from microbit import *

while True:
    sound = microphone.sound_level()
    if sound > 140:
        display.show(Image.ANGRY)
        sleep(1000)
    else:
        display.show(Image.HAPPY)
    sleep(200)`,
  },
  {
    id: 'smart_temp_fan',
    title: '🌬️ พัดลมห้องเรียนอัจฉริยะประหยัดไฟ (Smart Auto Fan)',
    subtitle: 'ตรวจวัดอุณหภูมิห้องเรียนอัตโนมัติ หากอากาศร้อนเกิน 30°C ให้สั่งพัดลมหมุนทันที',
    grade: 'ป.5 - ว 4.2 ป.5/2',
    icon: '🌬️',
    badgeColor: 'emerald',
    science: 'การถ่ายโอนความร้อน (Heat Transfer) และการระบายความร้อนด้วยการพาความร้อน',
    technology: 'เซ็นเซอร์วัดอุณหภูมิใน CPU ของ Micro:bit และมอเตอร์พัดลม DC 5V',
    engineering: 'ติดตั้งใบพัดขนาดเล็กอย่างสมดุลในโครงกันกระแทกที่ปลอดภัยสำหรับเด็ก',
    math: 'หน่วยวัดอุณหภูมิองศาเซลเซียส (°C) และการเปรียบเทียบช่วงอุณหภูมิ',
    hardware: ['Micro:bit V2', 'โมดูลรีเลย์/มอเตอร์พัดลม USB 5V'],
    simulationState: {
      label: 'อุณหภูมิห้องเรียนปัจจุบัน',
      actionLabel: '🌡️ จำลองอากาศร้อน/เย็นลง',
      unit: '°C',
      defaultVal: 33,
      threshold: 30,
      mode: 'toggle_high',
      step: 3,
      activeText: 'อุณหภูมิสูงกว่า 30°C! พัดลมกำลังทำงาน (FAN ON)',
      idleText: 'ห้องเย็นสบาย ปิดพัดลมประหยัดไฟ (FAN OFF)',
    },
    flowchartSteps: [
      '1. อ่านค่าอุณหภูมิห้องจาก temperature()',
      '2. ตรวจสอบ: temp >= 30°C หรือไม่?',
      '3. ถ้าจริง: สั่งมอเตอร์พัดลมหมุน (Pin P0 = 1)',
      '4. ถ้าไม่ถึง 30°C: หยุดพัดลมเพื่อประหยัดพลังงาน',
    ],
    pythonCode: `from microbit import *

while True:
    temp = temperature()
    if temp >= 30:
        pin0.write_digital(1) # เปิดพัดลม
        display.show("F")
    else:
        pin0.write_digital(0) # ปิดพัดลม
        display.show(temp)
    sleep(1000)`,
  },
];

export const StemPacksModal: React.FC<StemPacksModalProps> = ({
  isOpen,
  onClose,
  onRewardPoints,
}) => {
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [simValue, setSimValue] = useState<number>(STEM_PACKS[0].simulationState.defaultVal);
  const [isSimActive, setIsSimActive] = useState(false);

  const currentPack = STEM_PACKS[selectedPackIndex];

  if (!isOpen) return null;

  // Handle Simulation Trigger
  const handleTriggerSim = () => {
    soundEffects.play('click');
    const sim = currentPack.simulationState;
    const step = sim.step || 15;
    const mode =
      sim.mode ||
      (currentPack.id === 'smart_farm'
        ? 'increase_until_threshold'
        : currentPack.id === 'pedometer'
        ? 'counter'
        : 'toggle_low');

    if (mode === 'increase_until_threshold') {
      const newVal = Math.min(100, simValue + step);
      setSimValue(newVal);
      if (newVal >= sim.threshold) {
        soundEffects.play('correct');
      }
    } else if (mode === 'counter') {
      const newVal = simValue + step;
      setSimValue(newVal);
      soundEffects.play('click');
      if (newVal >= sim.threshold) {
        soundEffects.play('victory');
      }
    } else if (mode === 'toggle_high') {
      const isCurrentlyHigh = simValue >= sim.threshold;
      const nextVal = isCurrentlyHigh ? Math.max(0, sim.threshold - step) : sim.threshold + step;
      setSimValue(nextVal);
      soundEffects.play(nextVal >= sim.threshold ? 'error' : 'correct');
    } else {
      // toggle_low (e.g., laser_alarm or smart_bin)
      const isCurrentlyLow = simValue < sim.threshold;
      const nextVal = isCurrentlyLow ? sim.threshold + step : Math.max(0, sim.threshold - step);
      setSimValue(nextVal);
      soundEffects.play(nextVal < sim.threshold ? 'error' : 'correct');
    }
  };

  const handleResetSim = () => {
    setSimValue(currentPack.simulationState.defaultVal);
    soundEffects.play('click');
  };

  const handleDownloadWorksheet = () => {
    soundEffects.play('badge');
    const content = `ใบงานโครงงานสะเต็มศึกษา (STEM Project Worksheet)
ชื่อโครงงาน: ${currentPack.title}
ระดับชั้น: ${currentPack.grade}
----------------------------------------
[S] วิทยาศาสตร์: ${currentPack.science}
[T] เทคโนโลยี: ${currentPack.technology}
[E] วิศวกรรมศาสตร์: ${currentPack.engineering}
[M] คณิตศาสตร์: ${currentPack.math}
----------------------------------------
อุปกรณ์ที่ต้องเตรียม:
${currentPack.hardware.map((h, i) => `${i + 1}. ${h}`).join('\n')}
----------------------------------------
ขั้นตอนอัลกอริทึม:
${currentPack.flowchartSteps.join('\n')}
----------------------------------------
ตัวอย่างโค้ดโปรแกรม:
${currentPack.pythonCode}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STEM_Worksheet_${currentPack.id}.txt`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-3xl bg-slate-900 border border-indigo-500/30 text-white shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg">
              <Rocket className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                  คลังโครงงานบูรณาการสะเต็ม (STEM Project Packs) 🔬
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  S-T-E-M บูรณาการ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ผสานวิทยาศาสตร์ เทคโนโลยี วิศวกรรมศาสตร์ และคณิตศาสตร์ เข้ากับการเขียนโค้ดตามตัวชี้วัด ว 4.2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Selector Pills */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {STEM_PACKS.map((pack, idx) => (
            <button
              key={pack.id}
              onClick={() => {
                setSelectedPackIndex(idx);
                setSimValue(pack.simulationState.defaultVal);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                selectedPackIndex === idx
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{pack.icon}</span>
              <span>{pack.title}</span>
            </button>
          ))}
        </div>

        {/* Main Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Project Banner & Grade Standard */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                {currentPack.grade}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{currentPack.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{currentPack.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadWorksheet}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>ดาวน์โหลดใบงาน 5E</span>
              </button>
            </div>
          </div>

          {/* 4 Pillars of STEM Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>[S] Science วิทยาศาสตร์</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{currentPack.science}</p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>[T] Technology เทคโนโลยี</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{currentPack.technology}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>[E] Engineering วิศวกรรม</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{currentPack.engineering}</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1">
              <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>[M] Mathematics คณิตศาสตร์</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{currentPack.math}</p>
            </div>
          </div>

          {/* Virtual Circuit Simulator & Interactive Tester */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h4 className="font-bold text-sm text-white">
                  ตัวจำลองวงจรและการทดสอบอินเทอร์แอคทีฟ (Virtual Hardware Lab)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                จำลองการทำงานจริงของบอร์ดและเซ็นเซอร์โดยไม่ต้องเชื่อมต่อสายไฟจริง
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Interactive Meter Gauge */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400">{currentPack.simulationState.label}</div>
                <div className="text-3xl font-black font-mono text-cyan-400">
                  {simValue} {currentPack.simulationState.unit}
                </div>
                <div className="text-[10px] text-slate-500">
                  เกณฑ์จุดเปลี่ยน (Threshold): {currentPack.simulationState.threshold} {currentPack.simulationState.unit}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400">สถานะอุปกรณ์เอาต์พุต (Actuator)</div>
                {currentPack.id === 'smart_farm' ? (
                  simValue < currentPack.simulationState.threshold ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold animate-pulse">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span>ปั๊มน้ำกำลังทำงาน (ON)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>ดินชุ่มชื้นพอดี (OFF)</span>
                    </div>
                  )
                ) : currentPack.id === 'pedometer' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                    <Footprints className="w-4 h-4 text-cyan-400" />
                    <span>เผาผลาญ {(simValue * 0.04).toFixed(1)} kcal</span>
                  </div>
                ) : currentPack.simulationState.mode === 'toggle_high' ? (
                  simValue >= currentPack.simulationState.threshold ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold animate-pulse">
                      <Bell className="w-4 h-4 text-rose-400" />
                      <span>{currentPack.simulationState.activeText || 'แจ้งเตือนทำงาน (ACTIVE)'}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{currentPack.simulationState.idleText || 'สภาวะปกติ (NORMAL)'}</span>
                    </div>
                  )
                ) : currentPack.simulationState.mode === 'increase_until_threshold' ? (
                  simValue >= currentPack.simulationState.threshold ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{currentPack.simulationState.activeText || 'ถึงเป้าหมายสูงสุด (READY)'}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
                      <Activity className="w-4 h-4 text-amber-400" />
                      <span>{currentPack.simulationState.idleText || 'กำลังปรับค่า (CALIBRATING)'}</span>
                    </div>
                  )
                ) : simValue < currentPack.simulationState.threshold ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold animate-bounce">
                    <Bell className="w-4 h-4 text-rose-400" />
                    <span>{currentPack.simulationState.activeText || 'ไซเรนเตือนภัยดัง! (ALARM)'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{currentPack.simulationState.idleText || 'ระบบตรวจการณ์ปกติ (SECURE)'}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleTriggerSim}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-cyan-600/30 flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{currentPack.simulationState.actionLabel}</span>
                </button>
                <button
                  onClick={handleResetSim}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตค่าจำลอง</span>
                </button>
              </div>
            </div>
          </div>

          {/* Flowchart vs Code Snippet Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flowchart */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Layers className="w-4 h-4" />
                <span>ผังงานอัลกอริทึม (Algorithmic Flowchart)</span>
              </div>
              <div className="space-y-2">
                {currentPack.flowchartSteps.map((st, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Python Code */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span>โค้ดตัวอย่าง Python for Micro:bit</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">main.py</span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-indigo-300 font-mono overflow-x-auto leading-relaxed">
                {currentPack.pythonCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>💡 สามารถใช้ร่วมกับ MakeCode Simulator ในแล็บเขียนโค้ดของ Coder Kids ได้ทันที</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
