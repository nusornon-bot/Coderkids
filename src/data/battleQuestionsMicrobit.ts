import type { BattleQuestionItem } from './battleQuestionBank.ts';

/**
 * คลังข้อสอบ Micro:bit มาตรฐาน ว 4.2 ป.4–ป.6 (จำนวน 72 ข้อ)
 * - ง่าย (Easy): 24 ข้อ (กระจายคำตอบถูก A=6, B=6, C=6, D=6)
 * - ปานกลาง (Medium): 24 ข้อ (กระจายคำตอบถูก A=6, B=6, C=6, D=6)
 * - ยาก (Hard): 24 ข้อ (กระจายคำตอบถูก A=6, B=6, C=6, D=6)
 */
export const MICROBIT_BATTLE_QUESTIONS: BattleQuestionItem[] = [
  // =========================================================================
  // MICRO:BIT — ง่าย (Easy) x 24
  // correctIndex pattern: [3, 1, 2, 0, 1, 3, 0, 2, 2, 0, 3, 1, 0, 2, 1, 3, 1, 0, 2, 3, 3, 1, 2, 0]
  // =========================================================================
  {
    id: 'microbit_easy_01',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากให้รูปหัวใจแสดงแค่ครั้งเดียวตอนเปิดเครื่อง Micro:bit',
    codeSnippet:
      'basic.forever(() => {\n  basic.showIcon(IconNames.Heart)\n  basic.showString("HI")\n})\n// ข้อความวิ่งวนซ้ำไม่ยอมหยุด!',
    options: [
      'ถอดสาย USB ออกทันที',
      'เปลี่ยนชื่อไอคอนเป็น Happy',
      'เพิ่มคำสั่ง basic.pause(10)',
      'ย้ายคำสั่งไปไว้ในบล็อก [on start (เมื่อเริ่มต้น)] แทน forever',
    ],
    correctIndex: 3,
    explanation:
      'บล็อก on start ทำงานเพียงครั้งเดียวเมื่อเปิดบอร์ด ส่วน forever จะวนทำงานซ้ำไปเรื่อยๆ ตลอดเวลา',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_02',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'Micro:bit ไฟหัวใจติดค้าง ไม่ยอมกะพริบ!',
    codeSnippet:
      'basic.forever(() => {\n  basic.showIcon(IconNames.Heart)\n  basic.pause(500)\n  // ขาดคำสั่งดับหน้าจอ LED\n})',
    options: [
      'เปลี่ยน pause เป็น 10000 มิลลิวินาที',
      'เพิ่ม basic.clearScreen() และ basic.pause(500) ต่อท้าย',
      'ห้ามใช้ basic.pause ใน forever',
      'กดปุ่ม Reset ทุกรอบ',
    ],
    correctIndex: 1,
    explanation:
      'การทำให้ไฟกะพริบต้องสลับระหว่างเปิดไฟ (showIcon) -> รอ (pause) -> ดับไฟ (clearScreen) -> รอ (pause)',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_03',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ต้องการกดปุ่ม A แล้วให้ Micro:bit แสดงหน้ายิ้ม',
    codeSnippet:
      '// ควรเลือกบล็อกเหตุการณ์ (Input) ใดในการรับค่าการกดปุ่ม A?',
    options: [
      'input.onGesture(Gesture.Shake, () => { ... })',
      'basic.showNumber(10)',
      'input.onButtonPressed(Button.A, () => { basic.showIcon(IconNames.Happy) })',
      'radio.sendNumber(1)',
    ],
    correctIndex: 2,
    explanation:
      'input.onButtonPressed(Button.A, ...) ใช้ตรวจจับเหตุการณ์เมื่อผู้ใช้กดปุ่ม A บนบอร์ด Micro:bit',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_04',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'หน้าจอ LED ของ Micro:bit มีจำนวนหลอดไฟกี่ดวง?',
    codeSnippet:
      '// เมทริกซ์ LED ด้านหน้าบอร์ด Micro:bit\n// แถว (Row) = 0 ถึง 4\n// หลัก (Column) = 0 ถึง 4',
    options: [
      '25 ดวง (ตาราง 5 × 5)',
      '16 ดวง (ตาราง 4 × 4)',
      '9 ดวง (ตาราง 3 × 3)',
      '100 ดวง (ตาราง 10 × 10)',
    ],
    correctIndex: 0,
    explanation:
      'บอร์ด Micro:bit มีจอแสดงผล LED แบบเมทริกซ์ขนาด 5 แถว × 5 หลัก รวม 25 ดวง โดยพิกัดเริ่มนับจาก (0, 0) มุมบนซ้าย',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_05',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากทำลูกเต๋าดิจิทัล เมื่อเขย่าบอร์ดแล้วสุ่มเลข 1 ถึง 6',
    codeSnippet:
      'input.onGesture(Gesture.Shake, () => {\n  basic.showNumber(randint(1, 3))\n})\n// ทอยยังไงก็ไม่เคยออกแต้ม 4, 5, 6 เลย!',
    options: [
      'เปลี่ยน Gesture.Shake เป็น Button.B',
      'แก้ช่วงการสุ่มจาก randint(1, 3) เป็น randint(1, 6)',
      'ลบคำสั่ง basic.showNumber ออก',
      'เปลี่ยน randint(1, 3) เป็น randint(0, 1)',
    ],
    correctIndex: 1,
    explanation:
      'ลูกเต๋าปกติมี 6 หน้า (1–6) จึงต้องใช้ฟังก์ชันสุ่ม randint(1, 6) เพื่อให้สุ่มครอบคลุมทุกแต้ม',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_06',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากให้บอร์ดหยุดรอ 2 วินาที ต้องใส่ตัวเลขเท่าไหร่ใน basic.pause()?',
    codeSnippet:
      'basic.showIcon(IconNames.Yes)\nbasic.pause(2)  // ทำไมไฟหายเร็วมาก แทบมองไม่ทัน!',
    options: [
      'ต้องใส่ 20',
      'ต้องใส่ 200',
      'ต้องใส่ 0.2',
      'ต้องใส่ 2000 เพราะหน่วยของ pause คือมิลลิวินาที (1 วินาที = 1000 ms)',
    ],
    correctIndex: 3,
    explanation:
      'ฟังก์ชัน basic.pause(ms) รับหน่วยเป็นมิลลิวินาที (milliseconds) ดังนั้น 2 วินาที = 2,000 มิลลิวินาที',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_07',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ต้องการให้ชื่อเล่นภาษาอังกฤษ "TON" เลื่อนแสดงบนหน้าจอ LED ของ Micro:bit',
    codeSnippet: '// ควรเลือกใช้คำสั่งใดในหมวด Basic?',
    options: [
      'basic.showString("TON")',
      'basic.showNumber("TON")',
      'basic.clearScreen()',
      'basic.pause(1000)',
    ],
    correctIndex: 0,
    explanation:
      'คำสั่ง basic.showString("...") ใช้สำหรับแสดงข้อความตัวอักษรเลื่อนผ่านหน้าจอ LED ส่วน showNumber ใช้กับตัวเลข',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_08',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากตรวจจับการกดปุ่ม A และปุ่ม B พร้อมกันทั้งสองปุ่ม',
    codeSnippet: '// ใน MakeCode บล็อก on button pressed รองรับตัวเลือกใด?',
    options: [
      'Button.C',
      'Button.Space',
      'Button.AB (กด A+B พร้อมกัน)',
      'Gesture.LogoDown',
    ],
    correctIndex: 2,
    explanation:
      'Micro:bit รองรับเหตุการณ์กดปุ่ม 3 รูปแบบคือ Button.A, Button.B และ Button.AB (กดปุ่ม A และ B พร้อมกัน)',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_09',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ไฟล์โปรแกรมที่ดาวน์โหลดจาก MakeCode เพื่อนำลงบอร์ด Micro:bit มีนามสกุลใด?',
    codeSnippet: '// ลากไฟล์วางลงไดรฟ์ MICROBIT ที่เชื่อมต่อผ่านสาย USB',
    options: [
      '.mp3',
      '.docx',
      '.hex',
      '.jpg',
    ],
    correctIndex: 2,
    explanation:
      'MakeCode จะคอมไพล์โปรแกรมเป็นไฟล์นามสกุล .hex สำหรับแฟลชลงหน่วยความจำของบอร์ด Micro:bit',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_10',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากวาดภาพจรวดเองบนตาราง LED 5×5 โดยเลือกติ๊กจุดสว่างทีละช่อง',
    codeSnippet: '// ควรเลือกใช้บล็อกใดในหมวด Basic?',
    options: [
      'basic.showLeds(...) (แสดงรูปไฟ LED 5×5 ที่กำหนดเอง)',
      'basic.showNumber(55)',
      'input.temperature()',
      'radio.setGroup(5)',
    ],
    correctIndex: 0,
    explanation:
      'บล็อก basic.showLeds เปิดให้เราออกแบบลวดลายจุดไฟ LED 5×5 ได้อิสระตามจินตนาการ',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_11',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ปุ่ม Reset บนบอร์ด Micro:bit อยู่บริเวณใดและมีหน้าที่อะไร?',
    codeSnippet: '// ใช้เมื่อต้องการเริ่มรันโปรแกรมตั้งแต่บล็อก on start ใหม่',
    options: [
      'อยู่ข้างปุ่ม A ใช้ปรับความสว่างหน้าจอ',
      'อยู่บนสาย USB ใช้ลบไฟล์ทั้งหมดทิ้ง',
      'อยู่ตรงกลางไฟ LED ใช้เปลี่ยนเพลง',
      'อยู่ด้านหลังบอร์ด ใช้รีสตาร์ทให้โปรแกรมเริ่มทำงานใหม่ตั้งแต่ต้น',
    ],
    correctIndex: 3,
    explanation:
      'ปุ่ม Reset อยู่ด้านหลังบอร์ดใกล้ช่อง USB เมื่อกดแล้วบอร์ดจะเริ่มรันโปรแกรมใหม่ตั้งแต่บล็อก on start โดยไม่ลบโค้ด',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_12',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากให้บอร์ดเล่นทำนองเพลงฉลองเมื่อกดปุ่ม B',
    codeSnippet: 'input.onButtonPressed(Button.B, () => {\n  // ควรใช้หมวดคำสั่งใด?\n})',
    options: [
      'หมวด Radio (คลื่นวิทยุ)',
      'หมวด Music เช่น music.startMelody(...) หรือ music.playTone(...)',
      'หมวด Logic (ตรรกะ)',
      'หมวด Led (หน้าจอไฟ)',
    ],
    correctIndex: 1,
    explanation:
      'หมวด Music ใน MakeCode มีคำสั่งเล่นโน้ตและทำนองเพลงสำเร็จรูป ซึ่งบอร์ด Micro:bit V2 มีลำโพงในตัวเล่นเสียงได้ทันที',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_13',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ต้องการแสดงอุณหภูมิห้องปัจจุบันเป็นตัวเลขบนหน้าจอ Micro:bit',
    codeSnippet: 'input.onButtonPressed(Button.A, () => {\n  // อ่านค่าจากเซนเซอร์วัดอุณหภูมิ\n})',
    options: [
      'basic.showNumber(input.temperature())',
      'basic.showString("temperature")',
      'basic.showNumber(input.lightLevel())',
      'basic.showIcon(IconNames.Umbrella)',
    ],
    correctIndex: 0,
    explanation:
      'input.temperature() จะอ่านค่าอุณหภูมิเป็นองศาเซลเซียส (°C) แล้วส่งให้ basic.showNumber() แสดงผลเป็นตัวเลข',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_14',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากทำลูกศรชี้ไปทางซ้ายเมื่อเอียงบอร์ดไปทางซ้าย',
    codeSnippet: '// ควรเลือกท่าทาง (Gesture) ใดในบล็อก on shake / on gesture?',
    options: [
      'Gesture.Shake (เขย่า)',
      'Gesture.TiltRight (เอียงขวา)',
      'Gesture.TiltLeft (เอียงซ้าย)',
      'Gesture.ScreenDown (คว่ำหน้าจอ)',
    ],
    correctIndex: 2,
    explanation:
      'Micro:bit มีเซนเซอร์ตรวจจับความเร่ง (Accelerometer) จึงตรวจจับท่าทางเอียงซ้ายได้ด้วย Gesture.TiltLeft',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_15',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ขาเชื่อมต่อทองแดงขนาดใหญ่ด้านล่างบอร์ด (Edge Connector) ที่มีตัวเลข 0, 1, 2 เรียกว่าอะไร?',
    codeSnippet: '// บริเวณด้านล่างบอร์ดมีขา [0] [1] [2] [3V] [GND]',
    options: [
      'ปุ่มกดเสริม',
      'ขา Pin (P0, P1, P2) สำหรับต่ออุปกรณ์ไฟฟ้าหรือเซนเซอร์ภายนอก',
      'เสาสัญญาณ Wi-Fi',
      'ช่องใส่ถ่านไฟฉาย',
    ],
    correctIndex: 1,
    explanation:
      'ขา P0, P1, P2 คือขา Input/Output (Pins) สำหรับหนีบปากจระเข้เชื่อมต่อกับหลอดไฟ LED, ลำโพง, มอเตอร์ หรือเซนเซอร์ภายนอก',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_16',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'บน Micro:bit V2 มีโลโก้สีทองด้านบนหน้าจอ สามารถใช้งานแบบใดได้?',
    codeSnippet: '// input.onLogoEvent(TouchButtonEvent.Pressed, () => { ... })',
    options: [
      'ใช้ชาร์จแบตเตอรี่ด้วยแสงอาทิตย์',
      'ใช้เป็นเลนส์กล้องถ่ายรูป',
      'ใช้เปิดฝาหลังบอร์ด',
      'ใช้เป็นปุ่มสัมผัส (Touch Logo) รับเหตุการณ์เมื่อนิ้วแตะได้',
    ],
    correctIndex: 3,
    explanation:
      'Micro:bit V2 เพิ่มความสามารถให้โลโก้ด้านหน้าเป็นปุ่มระบบสัมผัสแบบ Capacitive Touch ที่เขียนโค้ดรับเหตุการณ์แตะได้',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_17',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'คำสั่ง basic.showArrow(ArrowNames.North) จะแสดงภาพใดบนหน้าจอ LED?',
    codeSnippet: 'basic.showArrow(ArrowNames.North)',
    options: [
      'ลูกศรชี้ลงล่าง (ทิศใต้)',
      'ลูกศรชี้ขึ้นด้านบน (ทิศเหนือ)',
      'รูปหัวใจดวงใหญ่',
      'ตัวเลข 0',
    ],
    correctIndex: 1,
    explanation:
      'ArrowNames.North คือทิศเหนือ ซึ่งบนหน้าจอ LED 5×5 จะแสดงเป็นรูปลูกศรชี้ขึ้นด้านบน',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_18',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ต้องการสั่งดับไฟ LED ทุกดวงบนหน้าจอ Micro:bit ทันที ควรใช้คำสั่งใด?',
    codeSnippet: 'input.onButtonPressed(Button.B, () => {\n  // ล้างหน้าจอให้มืดสนิท\n})',
    options: [
      'basic.clearScreen()',
      'basic.showNumber(0)',
      'music.stopAllSounds()',
      'led.setBrightness(255)',
    ],
    correctIndex: 0,
    explanation:
      'basic.clearScreen() จะปิดไฟ LED ทั้ง 25 ดวงทันที ต่างจาก showNumber(0) ที่ยังแสดงไฟเป็นรูปเลขศูนย์',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_19',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'เมื่อต้องการทดสอบโค้ด Micro:bit โดยยังไม่มีบอร์ดจริงอยู่ในมือ ควรทำอย่างไรใน MakeCode?',
    codeSnippet: '// หน้าต่างด้านซ้ายของเว็บไซต์ Microsoft MakeCode',
    options: [
      'เขียนโค้ดไม่ได้เลยจนกว่าจะซื้อบอร์ดจริง',
      'ต้องพิมพ์โค้ดลงในกระดาษแล้วสแกน',
      'กดทดลองรันบนบอร์ดจำลอง (Simulator) ด้านซ้ายของหน้าจอได้ทันที',
      'ต้องต่ออินเทอร์เน็ตความเร็ว 10 Gbps เท่านั้น',
    ],
    correctIndex: 2,
    explanation:
      'MakeCode มี Simulator บอร์ดจำลองที่ทดลองกดปุ่ม เขย่า ปรับแสง อุณหภูมิ และจำลองคลื่นวิทยุ 2 เครื่องได้เสมือนบอร์ดจริง',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_20',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ไฟ LED ดวงที่มุมบนซ้ายสุดของหน้าจอ Micro:bit มีพิกัด (x, y) คือเท่าไร?',
    codeSnippet: '// led.plot(x, y) จุดไฟมุมบนซ้ายสุด',
    options: [
      '(1, 1)',
      '(4, 4)',
      '(5, 0)',
      '(0, 0)',
    ],
    correctIndex: 3,
    explanation:
      'ระบบพิกัดจอ LED ของ Micro:bit เริ่มนับจาก (0, 0) ที่มุมบนซ้าย โดย x เพิ่มไปทางขวา (0–4) และ y เพิ่มลงด้านล่าง (0–4)',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_21',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากให้บอร์ด Micro:bit ส่งเสียงเตือนเมื่อเราปรบมือเสียงดัง (Micro:bit V2) ต้องใช้เซนเซอร์ใด?',
    codeSnippet: 'input.onSound(DetectedSound.Loud, () => {\n  basic.showIcon(IconNames.Surprised)\n})',
    options: [
      'เซนเซอร์เข็มทิศ (Compass)',
      'เซนเซอร์อุณหภูมิ (Thermometer)',
      'ปุ่มกด A และ B',
      'ไมโครโฟนในตัว (Microphone) ตรวจจับระดับเสียงดัง',
    ],
    correctIndex: 3,
    explanation:
      'Micro:bit V2 มีไมโครโฟนในตัว สามารถตรวจจับเหตุการณ์เสียงดัง/เงียบ (onSound) และอ่านค่าระดับเสียง (soundLevel) ได้',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_22',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากแสดงตัวเลข 1, 2, 3 เรียงกันห่างกันตัวละ 1 วินาที ควรใช้คำสั่งใดคั่นระหว่างแต่ละตัวเลข?',
    codeSnippet:
      'basic.showNumber(1)\n// รอ 1 วินาที\nbasic.showNumber(2)\n// รอ 1 วินาที\nbasic.showNumber(3)',
    options: [
      'basic.pause(1)',
      'basic.pause(1000)',
      'basic.clearScreen()',
      'basic.showString("1s")',
    ],
    correctIndex: 1,
    explanation:
      '1 วินาที เท่ากับ 1,000 มิลลิวินาที จึงต้องใช้ basic.pause(1000) คั่นระหว่างการแสดงแต่ละตัวเลข',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_23',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ขาเชื่อมต่อ GND และ 3V ด้านล่างบอร์ด Micro:bit มีไว้เพื่ออะไร?',
    codeSnippet: '// บนแถบทองแดงมี [0] [1] [2] [3V] [GND]',
    options: [
      'ใช้เชื่อมต่ออินเทอร์เน็ตความเร็วสูง',
      'ใช้พิมพ์เอกสารออกเครื่องปริ้นเตอร์',
      'ใช้จ่ายไฟเลี้ยง (3 โวลต์) และสายกราวด์ (ขั้วลบ) ให้กับวงจรและเซนเซอร์ที่ต่อเพิ่ม',
      'ใช้บันทึกเสียงเพลง MP3',
    ],
    correctIndex: 2,
    explanation:
      '3V คือขั้วไฟบวก 3 โวลต์ และ GND (Ground) คือขั้วลบ/สายดิน สำหรับต่อวงจรไฟฟ้าให้ครบวงจรเมื่อใช้อุปกรณ์ภายนอก',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_24',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากให้ Micro:bit สุ่มแสดง "หัว (H)" หรือ "ก้อย (T)" เหมือนการโยนเหรียญ ควรสุ่มเลขช่วงใด?',
    codeSnippet:
      'let coin = randint(?, ?)\nif (coin == 0) { basic.showString("H") }\nelse { basic.showString("T") }',
    options: [
      'randint(0, 1) เพราะมีผลลัพธ์เป็นไปได้ 2 ค่าเท่าๆ กันคือ 0 กับ 1',
      'randint(0, 10)',
      'randint(1, 6)',
      'randint(1, 1)',
    ],
    correctIndex: 0,
    explanation:
      'การโยนเหรียญมี 2 หน้าที่มีโอกาสออกเท่ากัน จึงใช้ randint(0, 1) (หรือ 1 ถึง 2) ให้ 0 แทนหัว และ 1 แทนก้อย',
    source: 'builtin',
  },

  // =========================================================================
  // MICRO:BIT — ปานกลาง (Medium) x 24
  // correctIndex pattern: [1, 2, 0, 3, 2, 1, 3, 0, 0, 3, 2, 1, 3, 0, 1, 2, 2, 3, 0, 1, 0, 1, 3, 2]
  // =========================================================================
  {
    id: 'microbit_medium_01',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'Micro:bit 2 เครื่องส่งสัญญาณวิทยุ (Radio) หากันไม่ติด!',
    codeSnippet:
      '// เครื่องส่ง: radio.setGroup(7)\n// เครื่องรับ: radio.setGroup(1)\nradio.sendString("SOS")',
    options: [
      'คลื่นวิทยุของ Micro:bit ส่งได้ไม่เกิน 1 เซนติเมตร',
      'เลข Group ของเครื่องส่ง (7) และเครื่องรับ (1) ไม่ตรงกัน ต้องตั้งให้เหมือนกัน',
      'ต้องปิดไฟหน้าจอ LED ก่อนส่งวิทยุ',
      'Micro:bit ส่งข้อความภาษาอังกฤษไม่ได้',
    ],
    correctIndex: 1,
    explanation:
      'การสื่อสารไร้สายด้วย Radio เหมือนการจูนช่องวิทยุสื่อสาร เครื่องส่งและเครื่องรับต้องตั้ง radio.setGroup() เป็นเลขช่องเดียวกัน',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_02',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'เครื่องนับก้าวเดิน (Step Counter) เขย่าแล้วเลขไม่เพิ่มจาก 0!',
    codeSnippet:
      'let steps = 0\ninput.onGesture(Gesture.Shake, () => {\n  steps = 1\n  basic.showNumber(steps)\n})',
    options: [
      'ต้องเปลี่ยนชื่อตัวแปร steps เป็น x',
      'ต้องลบ let steps = 0 ออก',
      'ต้องใช้ steps += 1 (change steps by 1) ไม่ใช่ steps = 1 ที่ตั้งค่าทับเป็น 1 ทุกครั้ง',
      'ต้องกดปุ่ม A พร้อมเขย่าทุกครั้ง',
    ],
    correctIndex: 2,
    explanation:
      'คำสั่ง steps = 1 คือการกำหนดค่าใหม่ทับเป็น 1 ตลอด หากต้องการนับสะสมต้องใช้ steps += 1 (บวกเพิ่มทีละ 1)',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_03',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ไฟเปิดอัตโนมัติในห้องมืด แต่กลับติดตอนแดดจ้าแทน!',
    codeSnippet:
      'basic.forever(() => {\n  if (input.lightLevel() > 100) {\n    basic.showLeds("# # # # # ...")\n  } else {\n    basic.clearScreen()\n  }\n})',
    options: [
      'ค่าแสงน้อยคือมืด ต้องเปลี่ยนเงื่อนไขจาก > 100 เป็น < 100 (หรือ < 50)',
      'เซนเซอร์แสงของ Micro:bit วัดได้เฉพาะอุณหภูมิ',
      'ต้องเปลี่ยน > 100 เป็น == 255',
      'ต้องเอาคำสั่ง else ออก',
    ],
    correctIndex: 0,
    explanation:
      'input.lightLevel() คืนค่า 0 (มืดสนิท) ถึง 255 (สว่างมาก) ดังนั้นถ้าอยากให้ไฟติดตอนมืดต้องเช็ก lightLevel() < ค่าเกณฑ์',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_04',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'อยากจุดไฟ LED ดวงตรงกลางเป๊ะของหน้าจอ 5×5 ต้องใช้พิกัดใด?',
    codeSnippet:
      '// led.plot(x, y) โดย x คือคอลัมน์ (0..4) และ y คือแถว (0..4)\nled.plot(?, ?)',
    options: [
      'led.plot(3, 3)',
      'led.plot(0, 0)',
      'led.plot(5, 5)',
      'led.plot(2, 2)',
    ],
    correctIndex: 3,
    explanation:
      'พิกัด LED เริ่มนับที่ 0, 1, 2, 3, 4 ดังนั้นตำแหน่งกึ่งกลางทั้งแกน x และแกน y คือ (2, 2)',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_05',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ระบบเตือนอากาศร้อน (> 35°C) ส่งเสียงเตือนไม่หยุดแม้ยังไม่ร้อน!',
    codeSnippet:
      'basic.forever(() => {\n  if (input.temperature() < 35) {\n    music.playTone(523, 200)\n  }\n})',
    options: [
      'ต้องใช้ input.compassHeading() แทนอุณหภูมิ',
      'ห้ามใช้ music.playTone ร่วมกับ if',
      'เครื่องหมายเปรียบเทียบกลับด้าน ต้องใช้ input.temperature() > 35',
      'ต้องเปลี่ยน 35 เป็น 0',
    ],
    correctIndex: 2,
    explanation:
      'เครื่องหมาย < 35 แปลว่าอุณหภูมิต่ำกว่า 35 องศา (อากาศปกติ) จึงดังตลอด ต้องเปลี่ยนเป็น > 35 เพื่อแจ้งเตือนเมื่อร้อนเกินกำหนด',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_06',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'เกมเป่ายิ้งฉุบ Micro:bit เมื่อสุ่มได้เลข 3 แต่ไม่แสดงกรรไกร!',
    codeSnippet:
      'let hand = randint(1, 3)\nif (hand == 1) { /* ค้อน */ }\nelse if (hand == 2) { /* กระดาษ */ }\n// ลืมกรณี hand == 3!',
    options: [
      'เปลี่ยน randint(1, 3) เป็น randint(1, 2)',
      'เพิ่มบล็อก else { /* แสดงรูปกรรไกร */ } เพื่อรองรับค่า 3',
      'เพิ่มตัวแปร hand อีกตัว',
      'ลบบล็อก if ออกทั้งหมด',
    ],
    correctIndex: 1,
    explanation:
      'เมื่อมีทางเลือก 3 ทาง (1, 2, 3) โครงสร้างเงื่อนไขควรครอบคลุมครบด้วย if / else if / else เพื่อไม่ให้กรณีที่ 3 หายไป',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_07',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ต้องการแสดงระดับความดังเสียงเป็นกราฟแท่งอัตโนมัติบนหน้าจอ LED 5×5',
    codeSnippet:
      'basic.forever(() => {\n  // แสดงกราฟแท่งจากค่า input.soundLevel() ที่มีค่าสูงสุด 255\n})',
    options: [
      'basic.showString("BAR")',
      'radio.sendNumber(255)',
      'led.unplot(0, 0)',
      'led.plotBarGraph(input.soundLevel(), 255)',
    ],
    correctIndex: 3,
    explanation:
      'คำสั่ง led.plotBarGraph(ค่าปัจจุบัน, ค่าสูงสุด) จะวาดกราฟแท่งไฟ LED ขึ้น–ลงตามระดับสัญญาณเซนเซอร์โดยอัตโนมัติ',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_08',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'อยากจุดไฟ LED พิกัด (2, 2) แล้วดับเฉพาะดวงนั้นดวงเดียวโดยไม่ดับดวงอื่น',
    codeSnippet: 'led.plot(0, 0)\nled.plot(2, 2)\nbasic.pause(500)\n// ดับเฉพาะ (2, 2)',
    options: [
      'led.unplot(2, 2)',
      'basic.clearScreen()',
      'led.plot(2, 2)',
      'basic.pause(0)',
    ],
    correctIndex: 0,
    explanation:
      'led.unplot(x, y) จะดับไฟเฉพาะพิกัดที่ระบุ ทำให้ดวงอื่นเช่น (0, 0) ยังสว่างอยู่ ต่างจาก clearScreen() ที่ดับทั้งจอ',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_09',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'เครื่องรับสัญญาณวิทยุไม่ได้รับข้อความเลย ทั้งที่ตั้ง radio.setGroup(5) ตรงกันแล้ว!',
    codeSnippet:
      '// เครื่องส่ง:\nradio.sendString("HELLO")\n// เครื่องรับ:\nradio.onReceivedNumber((receivedNumber) => {\n  basic.showNumber(receivedNumber)\n})',
    options: [
      'ชนิดข้อมูลไม่ตรงกัน เครื่องส่งส่ง String แต่เครื่องรับรอรับ Number ต้องใช้ radio.onReceivedString',
      'ต้องเปลี่ยนเลข Group เป็น 500',
      'ต้องเขย่าเครื่องรับขณะส่ง',
      'ข้อความ "HELLO" ยาวเกินไป',
    ],
    correctIndex: 0,
    explanation:
      'การรับ–ส่งวิทยุต้องจับคู่ชนิดข้อมูลให้ตรงกัน: sendString คู่กับ onReceivedString และ sendNumber คู่กับ onReceivedNumber',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_10',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'สร้างเครื่องนับจำนวนคนเข้าห้องสมุด: กด A บวก 1, กด B ลบ 1 แต่ไม่อยากให้จำนวนติดลบ!',
    codeSnippet:
      'input.onButtonPressed(Button.B, () => {\n  // ควรเพิ่มเงื่อนไขใดก่อนสั่ง count -= 1?\n})',
    options: [
      'if (count < 0) { count -= 1 }',
      'if (count == 0) { count -= 1 }',
      'count = -1',
      'if (count > 0) { count -= 1 }',
    ],
    correctIndex: 3,
    explanation:
      'การตรวจ if (count > 0) ก่อนลดค่า จะรับประกันว่าเมื่อจำนวนเหลือ 0 แล้วจะไม่ถูกลบจนกลายเป็น -1',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_11',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ทำไมบอร์ด Micro:bit ถึงวัดความสว่าง (lightLevel) ได้ทั้งที่ไม่ได้ต่อเซนเซอร์แสงเพิ่ม?',
    codeSnippet: 'let light = input.lightLevel()',
    options: [
      'เพราะดึงข้อมูลสภาพอากาศจากอินเทอร์เน็ต',
      'เพราะวัดจากความดังของไมโครโฟน',
      'เพราะบอร์ดใช้หลอดไฟ LED 5×5 ด้านหน้าทำหน้าที่ตรวจจับแสงกลับด้านได้ด้วย',
      'เพราะวัดจากอุณหภูมิของปุ่ม A',
    ],
    correctIndex: 2,
    explanation:
      'Micro:bit ออกแบบอย่างชาญฉลาดให้เมทริกซ์ LED 5×5 ทำหน้าที่ได้ทั้งแสดงผลและเป็นเซนเซอร์วัดความสว่างแสง (0–255)',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_12',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ต้องการสั่งให้ไฟ LED ดวงที่ (4, 0) วิ่งไปทางซ้ายทีละช่องจนถึง (0, 0)',
    codeSnippet:
      'for (let x = 4; x >= 0; x--) {\n  led.plot(x, 0)\n  basic.pause(200)\n  // ควรทำอะไรก่อนเลื่อนไปช่องถัดไปเพื่อไม่ให้ไฟค้างเป็นหางยาว?\n}',
    options: [
      'led.plot(0, 4)',
      'led.unplot(x, 0) (หรือ basic.clearScreen())',
      'radio.sendNumber(x)',
      'music.playTone(262, 100)',
    ],
    correctIndex: 1,
    explanation:
      'ถ้าไม่สั่งดับไฟดวงเดิมด้วย led.unplot(x, 0) ก่อนเปลี่ยนค่า x ไฟจะติดค้างทุกดวงแทนที่จะเห็นเป็นจุดวิ่ง',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_13',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'อยากต่อเซอร์โวมอเตอร์ (Servo) ที่ขา P0 เพื่อเปิดไม้กั้นรถอัตโนมัติหมุนไปที่มุม 90 องศา',
    codeSnippet: '// ใช้คำสั่งในหมวด Pins -> Servo',
    options: [
      'pins.digitalReadPin(DigitalPin.P0)',
      'basic.showNumber(90)',
      'radio.setGroup(90)',
      'pins.servoWritePin(AnalogPin.P0, 90)',
    ],
    correctIndex: 3,
    explanation:
      'คำสั่ง pins.servoWritePin(AnalogPin.P0, 90) ส่งสัญญาณ PWM ควบคุมแขนเซอร์โวให้หมุนไปที่องศาที่ต้องการ (0°–180°)',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_14',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ต้องการลดความสว่างของหน้าจอ LED ลงครึ่งหนึ่งเพื่อประหยัดแบตเตอรี่ในห้องมืด',
    codeSnippet: '// ค่าความสว่างสูงสุดของ LED คือ 255',
    options: [
      'led.setBrightness(128)',
      'led.setBrightness(0)',
      'basic.pause(128)',
      'input.lightLevel()',
    ],
    correctIndex: 0,
    explanation:
      'led.setBrightness() รับค่า 0 (มืดสนิท) ถึง 255 (สว่างสุด) ดังนั้นความสว่างประมาณครึ่งหนึ่งคือ 128',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_15',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ทำเกมจับเวลา: กด A เริ่มจำเวลา, กด B แสดงเวลาที่ผ่านไปเป็นมิลลิวินาที ควรอ่านเวลาจากคำสั่งใด?',
    codeSnippet:
      'let start = 0\ninput.onButtonPressed(Button.A, () => { start = ? })\ninput.onButtonPressed(Button.B, () => { basic.showNumber(? - start) })',
    options: [
      'input.temperature()',
      'input.runningTime()',
      'basic.pause(1000)',
      'randint(1, 1000)',
    ],
    correctIndex: 1,
    explanation:
      'input.runningTime() คืนค่าเวลาตั้งแต่เปิดเครื่องในหน่วยมิลลิวินาที นำมาลบกับเวลาเริ่มต้น (start) จะได้ระยะเวลาที่ผ่านไปแม่นยำ',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_16',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ระบบนับถอยหลังปล่อยจรวด 5 -> 4 -> 3 -> 2 -> 1 แต่โค้ดนี้กลับนับ 0, 1, 2, 3, 4 แทน!',
    codeSnippet:
      'for (let i = 0; i < 5; i++) {\n  basic.showNumber(i)\n}',
    options: [
      'แก้เป็น basic.showNumber(i + 1)',
      'แก้เป็น basic.showNumber(i * 5)',
      'แก้เป็น basic.showNumber(5 - i) เพื่อให้ได้ 5, 4, 3, 2, 1',
      'เปลี่ยนลูปเป็น forever',
    ],
    correctIndex: 2,
    explanation:
      'เมื่อ i วิ่งจาก 0, 1, 2, 3, 4 ค่าของ (5 - i) จะเท่ากับ 5, 4, 3, 2, 1 เรียงถอยหลังได้ถูกต้องพอดี',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_17',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ต้องการสั่งเปิดหลอดไฟ LED ภายนอกที่ต่อกับขา P1 แบบดิจิทัล (เปิดสุด/ปิดสุด)',
    codeSnippet: '// ส่งสัญญาณไฟฟ้าลอจิก HIGH (1) ออกที่ขา P1',
    options: [
      'pins.digitalReadPin(DigitalPin.P1)',
      'led.plot(1, 0)',
      'pins.digitalWritePin(DigitalPin.P1, 1)',
      'radio.sendNumber(1)',
    ],
    correctIndex: 2,
    explanation:
      'pins.digitalWritePin(DigitalPin.P1, 1) คือการส่งสัญญาณขาออก (Output) ค่า 1 เพื่อจ่ายไฟเปิดอุปกรณ์ และค่า 0 เพื่อปิด',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_18',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'เมื่อนำแม่เหล็กมาใกล้บอร์ด Micro:bit อยากให้แสดงคำเตือน "MAGNET!" ต้องใช้เซนเซอร์ใด?',
    codeSnippet: '// วัดความเข้มสนามแม่เหล็กในหน่วยไมโครเทสลา (µT)',
    options: [
      'input.lightLevel()',
      'input.temperature()',
      'input.soundLevel()',
      'input.magneticForce(Dimension.Strength)',
    ],
    correctIndex: 3,
    explanation:
      'Micro:bit มีเซนเซอร์สนามแม่เหล็ก (Magnetometer) สามารถอ่านความแรงสนามแม่เหล็กด้วย input.magneticForce(Dimension.Strength)',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_19',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'คำสั่ง led.toggle(2, 2) มีการทำงานอย่างไรเมื่อถูกเรียกซ้ำๆ?',
    codeSnippet:
      'input.onButtonPressed(Button.A, () => {\n  led.toggle(2, 2)\n})',
    options: [
      'สลับสถานะไฟที่พิกัด (2, 2): ถ้าดับอยู่จะเปิด และถ้าเปิดอยู่จะดับ',
      'เปิดไฟทุกดวงทั้งหน้าจอพร้อมกัน',
      'เลื่อนจุดไฟไปทางขวาทีละ 2 ช่อง',
      'ลบโปรแกรมออกจากบอร์ด',
    ],
    correctIndex: 0,
    explanation:
      'toggle แปลว่าสลับสถานะ (เปิด <-> ปิด) ทำให้กดปุ่ม A ครั้งแรกไฟติด กดอีกครั้งไฟดับได้ด้วยคำสั่งเดียว',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_20',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'เมื่อเปิดใช้งานเข็มทิศ (Compass) เป็นครั้งแรก หน้าจอ Micro:bit ขึ้นข้อความ "TILT TO FILL SCREEN" เพราะเหตุใด?',
    codeSnippet: 'let heading = input.compassHeading()',
    options: [
      'บอร์ดเสียต้องส่งซ่อม',
      'บอร์ดกำลังให้ผู้ใช้ปรับเทียบเข็มทิศ (Calibrate) โดยเอียงบอร์ดให้ไฟติดครบ 25 ดวงเพื่อให้วัดทิศแม่นยำ',
      'แบตเตอรี่ใกล้หมดต้องรีบชาร์จ',
      'โค้ดมีข้อผิดพลาดทางไวยากรณ์ (Syntax Error)',
    ],
    correctIndex: 1,
    explanation:
      'การปรับเทียบเข็มทิศ (Calibration) เป็นขั้นตอนปกติของ Micro:bit เพื่อให้เซนเซอร์แม่เหล็กเรียนรู้ทิศทางสนามแม่เหล็กโลกในสถานที่นั้น',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_21',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'อยากตรวจสอบว่า "กำลังกดปุ่ม A ค้างไว้" ภายในลูป basic.forever() ควรใช้คำสั่งใด?',
    codeSnippet:
      'basic.forever(() => {\n  if ( ? ) {\n    led.plot(0, 2)\n  } else {\n    led.unplot(0, 2)\n  }\n})',
    options: [
      'input.buttonIsPressed(Button.A)',
      'input.onButtonPressed(Button.A, ...)',
      'basic.showString("A")',
      'radio.setGroup(1)',
    ],
    correctIndex: 0,
    explanation:
      'input.buttonIsPressed(Button.A) คืนค่าจริง/เท็จ (Boolean) เพื่อนำไปวางในเงื่อนไข if เพื่อเช็กสถานะปุ่มขณะนั้นได้ทันที',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_22',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ต้องการทำสวิตช์สัมผัสผลไม้ (Conductive Touch) เมื่อจับขา P0 กับ GND พร้อมกันให้เสียงดัง',
    codeSnippet: '// ใช้เหตุการณ์ตรวจจับการสัมผัสที่ขา P0',
    options: [
      'pins.servoWritePin(AnalogPin.P0, 0)',
      'input.onPinPressed(TouchPin.P0, () => { music.playTone(440, 300) })',
      'basic.showArrow(ArrowNames.East)',
      'led.setBrightness(0)',
    ],
    correctIndex: 1,
    explanation:
      'input.onPinPressed(TouchPin.P0, ...) ตรวจจับกระแสไฟฟ้าอ่อนๆ เมื่อวงจรระหว่างขา P0 กับ GND ครบวงจรผ่านตัวนำไฟฟ้า เช่น กล้วยหรือฟอยล์',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_23',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ในเกมเก็บดาวด้วยตัวละคร Sprite บน Micro:bit (หมวด Game): คำสั่ง game.createSprite(2, 4) ทำหน้าที่อะไร?',
    codeSnippet: 'let player = game.createSprite(2, 4)',
    options: [
      'เพิ่มคะแนนให้ผู้เล่น 24 แต้ม',
      'ตั้งเวลาเล่นเกม 24 วินาที',
      'ลบไฟ LED แถวที่ 4 ทิ้งทั้งหมด',
      'สร้างจุดตัวละคร (LED Sprite) ไว้ที่ตำแหน่งแถวล่างตรงกลาง พิกัด x=2, y=4',
    ],
    correctIndex: 3,
    explanation:
      'หมวด Game ของ Micro:bit ช่วยสร้างตัวละครจุด LED (Sprite) ที่สั่ง move, turn, และตรวจ isTouching ได้สะดวกเหมือนเกมย่อส่วน',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_24',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ต้องการเปลี่ยนค่าตัวแปร score เป็น 0 ทุกครั้งเมื่อเขย่าบอร์ดเพื่อเริ่มเกมใหม่',
    codeSnippet:
      'let score = 0\ninput.onButtonPressed(Button.A, () => { score += 1 })\n// ต้องการรีเซ็ต score ตอนเขย่า',
    options: [
      'input.onGesture(Gesture.Shake, () => { score += 0 })',
      'input.onGesture(Gesture.Shake, () => { score -= 1 })',
      'input.onGesture(Gesture.Shake, () => { score = 0; basic.showNumber(score) })',
      'input.onGesture(Gesture.Shake, () => { basic.clearScreen() })',
    ],
    correctIndex: 2,
    explanation:
      'การรีเซ็ตต้องใช้การกำหนดค่า score = 0 (ไม่ใช้ += 0 ซึ่งไม่เปลี่ยนค่าเดิม) แล้วแสดงเลข 0 ยืนยันบนหน้าจอ',
    source: 'builtin',
  },

  // =========================================================================
  // MICRO:BIT — ยาก (Hard) x 24
  // correctIndex pattern: [2, 3, 1, 0, 0, 2, 3, 1, 1, 0, 3, 2, 0, 1, 2, 3, 3, 0, 1, 2, 1, 2, 0, 3]
  // =========================================================================
  {
    id: 'microbit_hard_01',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'เข็มทิศดิจิทัลไม่ชี้ทิศเหนือเมื่อหมุนบอร์ดไปที่ 350 องศา!',
    codeSnippet:
      'let deg = input.compassHeading()\nif (deg < 45) {\n  basic.showString("N")\n}\n// แต่ช่วง 315°–360° ก็คือทิศเหนือเหมือนกัน!',
    options: [
      'ต้องใช้ (deg < 45 && deg > 315) ด้วย AND',
      'ต้องเปลี่ยน 45 เป็น 180',
      'ต้องใช้เงื่อนไข (deg < 45 || deg > 315) ด้วยตัวดำเนินการ OR (||)',
      'เข็มทิศมีค่าสูงสุดแค่ 100 องศา',
    ],
    correctIndex: 2,
    explanation:
      'ทิศเหนืออยู่รอบ 0°/360° จึงกินช่วง 0°–44° หรือ 316°–360° ต้องเชื่อมด้วย OR (||) เพราะตัวเลขเดียวไม่สามารถทั้ง < 45 และ > 315 พร้อมกันได้',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_02',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'สั่งจุด LED วิ่งไล่ครบทุกดวงทั้ง 25 ดวงด้วย Nested Loop แต่แถวสุดท้ายหาย!',
    codeSnippet:
      'for (let y = 0; y < 4; y++) {\n  for (let x = 0; x < 5; x++) {\n    led.plot(x, y)\n  }\n}',
    options: [
      'ต้องแก้ x < 5 เป็น x < 4',
      'ต้องสลับ x กับ y ใน led.plot',
      'Micro:bit ไม่รองรับลูปซ้อนลูป',
      'ลูปนอก y < 4 ทำงานแค่แถว 0–3 ต้องแก้เป็น y < 5 (หรือ y <= 4) เพื่อให้ครบ 5 แถว',
    ],
    correctIndex: 3,
    explanation:
      'แถว y มี index 0, 1, 2, 3, 4 (รวม 5 แถว) เงื่อนไข y < 4 จะหยุดที่ 3 (Off-by-one bug) ต้องแก้เป็น y < 5',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_03',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ต่อปั๊มน้ำอัตโนมัติวัดความชื้นดินที่ขา Pin 0 แต่ค่าอ่านได้ไม่คงที่!',
    codeSnippet:
      '// เซนเซอร์ความชื้นดินแบบ Analog ส่งค่า 0–1023\nlet moisture = pins.digitalReadPin(DigitalPin.P0)',
    options: [
      'ต้องเปลี่ยนไปใช้ขา GND แทน P0',
      'ต้องใช้ pins.analogReadPin(AnalogPin.P0) เพราะ digitalRead อ่านได้แค่ 0 หรือ 1',
      'ต้องใช้ radio.receiveNumber() แทน',
      'Analog Pin อ่านได้เฉพาะค่าลบ',
    ],
    correctIndex: 1,
    explanation:
      'Digital Read อ่านได้เพียง 2 สถานะ (0/1) ส่วนเซนเซอร์ที่ให้ค่าระดับละเอียด 0–1023 ต้องใช้ Analog Read (analogReadPin)',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_04',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ระบบสัญญาณกันขโมยตั้งค่าให้เริ่มทำงานเมื่อกดปุ่ม A แต่กดแล้วไม่จับความเคลื่อนไหว!',
    codeSnippet:
      'let armed = false\ninput.onButtonPressed(Button.A, () => { armed = true })\ninput.onGesture(Gesture.Shake, () => {\n  if (armed = false) { music.playTone(880, 500) }\n})',
    options: [
      'ใน if ใช้เครื่องหมาย = (กำหนดค่า) แทน == และควรเช็ก if (armed == true)',
      'ห้ามใช้ตัวแปรชนิด Boolean (true/false)',
      'ต้องลบ input.onButtonPressed ออก',
      'ต้องตั้งค่า armed เริ่มต้นเป็น 100',
    ],
    correctIndex: 0,
    explanation:
      'การใช้ = ในเงื่อนไขเป็นการกำหนดค่าทับแทนการเปรียบเทียบ และเงื่อนไขควรตรวจว่าเปิดระบบแล้ว (armed == true)',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_05',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ระบบโหวตในห้องเรียนผ่าน Radio: นักเรียน 1 คนกดปุ่ม A รัวๆ เพื่อปั๊มคะแนน!',
    codeSnippet:
      '// เครื่องนักเรียน:\ninput.onButtonPressed(Button.A, () => {\n  radio.sendString("VOTE_A")\n})',
    options: [
      'เพิ่มตัวแปร Flag เช่น let voted = false แล้วเช็ก if (!voted) ส่งโหวตและตั้ง voted = true',
      'ลดความสว่างหน้าจอ LED ลง',
      'เปลี่ยนข้อความเป็น "VOTE_B"',
      'เปลี่ยนไปใช้ปุ่ม B แทน',
    ],
    correctIndex: 0,
    explanation:
      'การใช้ตัวแปรสถานะ (State Flag) เช่น voted = true หลังส่งครั้งแรก จะป้องกันการโหวตซ้ำได้อย่างมีประสิทธิภาพ',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_06',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'บันทึกข้อมูล Data Logger แต่อุณหภูมิเฉลี่ยคำนวณผิดพลาด!',
    codeSnippet:
      'let sum = 0\nlet count = 0\n// เมื่อเก็บข้อมูล 5 ครั้ง:\nlet avg = sum / 10  // ทำไมค่าเฉลี่ยต่ำกว่าความจริงครึ่งหนึ่ง?',
    options: [
      'ต้องนำ sum คูณ 10 แทนการหาร',
      'ต้องตั้งค่า sum เริ่มต้นเป็น 100',
      'ตัวหารควรเป็นตัวแปร count (จำนวนครั้งที่เก็บจริง) และควรดัก count > 0 ก่อนหาร',
      'ห้ามใช้เครื่องหมาย / ใน Micro:bit',
    ],
    correctIndex: 2,
    explanation:
      'ค่าเฉลี่ย = ผลรวม ÷ จำนวนข้อมูลจริง (sum / count) ไม่ควรฮาร์ดโค้ดเลข 10 และควรตรวจสอบ count > 0 เพื่อป้องกันหารด้วยศูนย์',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_07',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ต้องการแปลงค่าเซนเซอร์ความชื้นดิน (0–1023) ให้เป็นเปอร์เซ็นต์ (0–100%) เพื่อแสดงผล',
    codeSnippet:
      'let raw = pins.analogReadPin(AnalogPin.P0)\n// ฟังก์ชันใดในหมวด Math ช่วยแปลงช่วงตัวเลข (Mapping) ได้ตรงที่สุด?',
    options: [
      'Math.abs(raw)',
      'randint(0, 100)',
      'raw + 100',
      'Math.map(raw, 0, 1023, 0, 100)',
    ],
    correctIndex: 3,
    explanation:
      'Math.map(value, fromLow, fromHigh, toLow, toHigh) จะเทียบสัดส่วนเชิงเส้นจากช่วง 0–1023 ไปเป็น 0–100 ให้โดยอัตโนมัติ',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_08',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ทำระบบส่งข้อมูลเซนเซอร์ผ่านวิทยุหลายค่า (อุณหภูมิ + ความชื้น) แต่เครื่องรับแยกไม่ออกว่าเลขไหนคือค่าอะไร!',
    codeSnippet:
      '// เครื่องส่ง:\nradio.sendNumber(input.temperature())\nradio.sendNumber(input.lightLevel())',
    options: [
      'ต้องส่งค่าเป็นเลขลบทั้งหมด',
      'เปลี่ยนมาใช้ radio.sendValue("temp", input.temperature()) และ radio.sendValue("light", input.lightLevel()) คู่กับ onReceivedValue',
      'ต้องซื้อบอร์ดเพิ่มเป็น 4 เครื่อง',
      'ต้องรอ 10 นาทีระหว่างส่งแต่ละค่า',
    ],
    correctIndex: 1,
    explanation:
      'radio.sendValue(name, value) ส่งข้อมูลแบบคู่ ชื่อ–ค่า (Key-Value) ทำให้เครื่องรับตรวจสอบชื่อ name เพื่อแยกจัดการแต่ละเซนเซอร์ได้อย่างแม่นยำ',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_09',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ทำระบบค้นหาสมบัติ (Treasure Hunt) ด้วยคลื่นวิทยุ: ยิ่งเดินเข้าใกล้กล่องสมบัติ ไฟยิ่งติดหลายดวง!',
    codeSnippet:
      'radio.onReceivedNumber((n) => {\n  // อ่านค่าความแรงสัญญาณวิทยุที่รับได้ (RSSI: ประมาณ -128 ถึง -42)\n  let strength = ?\n})',
    options: [
      'input.lightLevel()',
      'radio.receivedPacket(RadioPacketProperty.SignalStrength)',
      'input.compassHeading()',
      'pins.analogReadPin(AnalogPin.P0)',
    ],
    correctIndex: 1,
    explanation:
      'SignalStrength (RSSI) บอกความแรงคลื่นวิทยุ ยิ่งอยู่ใกล้ตัวส่งค่ายิ่งสูง (ใกล้ -42 dBm) ยิ่งไกลค่ายิ่งต่ำ (ใกล้ -128 dBm)',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_10',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ปั๊มน้ำอัตโนมัติทำงานติด–ดับรัวๆ ตลอดเวลาเมื่อความชื้นดินอยู่แถวๆ ค่าเกณฑ์ 400!',
    codeSnippet:
      'if (moisture < 400) { pins.digitalWritePin(DigitalPin.P1, 1) }\nelse { pins.digitalWritePin(DigitalPin.P1, 0) }',
    options: [
      'ใช้หลัก Hysteresis: เปิดปั๊มเมื่อ moisture < 350 และปิดปั๊มเมื่อ moisture > 450 (มีช่วงกันสั่นตรงกลาง)',
      'ลด basic.pause ให้เหลือ 0 มิลลิวินาที',
      'เปลี่ยนเกณฑ์ 400 เป็น 401',
      'ตัดสายไฟปั๊มน้ำออก',
    ],
    correctIndex: 0,
    explanation:
      'การกำหนดค่าเกณฑ์เปิด–ปิดให้ต่างกัน (Hysteresis เช่น <350 เปิด, >450 ปิด) จะป้องกันอาการรีเลย์/ปั๊มน้ำกระพริบเปิด–ปิดถี่ๆ จากสัญญาณรบกวน',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_11',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ระบบห้องเรียนมีบอร์ดหลายกลุ่มเล่นวิทยุพร้อมกันในห้อง ทำอย่างไรไม่ให้สัญญาณตีกันข้ามกลุ่ม?',
    codeSnippet: '// ทุกกลุ่มตั้ง radio.setGroup(1) และส่งกำลังสูงสุดเหมือนกันหมด',
    options: [
      'ให้ปิดไฟห้องเรียนทั้งหมด',
      'ให้ทุกคนกดปุ่ม Reset พร้อมกัน',
      'ให้หันหน้าจอ LED ชนกัน',
      'กำหนด radio.setGroup() ให้แต่ละกลุ่มใช้เลขช่องไม่ซ้ำกัน (0–255) และลดกำลังส่งด้วย radio.setTransmitPower() ตามความเหมาะสม',
    ],
    correctIndex: 3,
    explanation:
      'Micro:bit รองรับช่องสัญญาณ Radio มากถึง 256 ช่อง (0–255) การแยก Group และปรับระดับกำลังส่ง (0–7) ช่วยลดการรบกวนในห้องเรียนได้สมบูรณ์',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_12',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'เขียนโค้ดขยับจุด LED ด้วยปุ่ม A (ซ้าย) และ B (ขวา) แต่พอกดซ้ำๆ จุดไฟหลุดหายไปนอกจอ!',
    codeSnippet:
      'let x = 2\ninput.onButtonPressed(Button.B, () => {\n  led.unplot(x, 2)\n  x += 1  // พอกดเกิน 4 ค่า x เป็น 5, 6 หลุดขอบจอ!\n  led.plot(x, 2)\n})',
    options: [
      'ให้เพิ่ม x ทีละ 2 แทน 1',
      'ให้ลบตัวแปร x ทิ้ง',
      'เพิ่มเงื่อนไขคุมขอบเขต if (x < 4) { x += 1 } (หรือ Math.constrain(x + 1, 0, 4))',
      'ให้เปลี่ยน led.plot เป็น led.unplot',
    ],
    correctIndex: 2,
    explanation:
      'หน้าจอ Micro:bit มีคอลัมน์ 0 ถึง 4 เท่านั้น การจำกัดขอบเขต (Boundary Check) ด้วย if (x < 4) หรือ Math.constrain จะกันไม่ให้พิกัดหลุดจอ',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_13',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ต้องการหรี่ความสว่างหลอด LED ภายนอกที่ขา P0 ให้ค่อยๆ สว่างขึ้นจาก 0 ถึง 1023',
    codeSnippet:
      'for (let level = 0; level <= 1023; level += 10) {\n  // ส่งสัญญาณ Analog PWM ออกทางขา P0\n  basic.pause(20)\n}',
    options: [
      'pins.analogWritePin(AnalogPin.P0, level)',
      'pins.digitalWritePin(DigitalPin.P0, level)',
      'pins.analogReadPin(AnalogPin.P0)',
      'led.setBrightness(level)',
    ],
    correctIndex: 0,
    explanation:
      'pins.analogWritePin ส่งสัญญาณ PWM ระดับ 0–1023 ออกทางขา Pin ช่วยปรับความสว่างหลอดไฟหรือความเร็วมอเตอร์ได้อย่างนุ่มนวล',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_14',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ระบบล็อกตู้เซฟด้วยรหัส 3 ปุ่ม (A-B-A) ใช้ตัวแปรข้อความ code เก็บลำดับการกด แต่พอครบ 3 ตัวไม่รีเซ็ตให้ลองใหม่!',
    codeSnippet:
      'let code = ""\ninput.onButtonPressed(Button.A, () => { code = code + "A" })\n// ถ้า code.length >= 3 แล้วรหัสผิด ควรทำอย่างไร?',
    options: [
      'เพิ่มตัวอักษร "X" ต่อท้ายไปเรื่อยๆ',
      'แสดงไอคอน X แล้วล้างค่า code = "" เพื่อรับรหัสชุดใหม่ตั้งแต่ตัวแรก',
      'เปลี่ยนตัวแปร code เป็นตัวเลข 0',
      'ลบปุ่ม B ออกจากโปรแกรม',
    ],
    correctIndex: 1,
    explanation:
      'เมื่อความยาวรหัสครบตามกำหนดแล้วไม่ตรงกับ "ABA" ต้องรีเซ็ตสตริงกลับเป็นค่าว่าง ("") เพื่อไม่ให้สตริงยาวขึ้นเรื่อยๆ จนปลดล็อกไม่ได้อีกเลย',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_15',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'สร้างเครื่องวัดระดับน้ำดิจิทัล (Spirit Level): ให้จุดไฟอยู่ตรงกลางเมื่อบอร์ดวางราบสนิท',
    codeSnippet:
      'let tiltX = input.acceleration(Dimension.X)\n// ค่า acceleration แกน X อยู่ช่วงประมาณ -1023 (เอียงซ้ายสุด) ถึง +1023 (เอียงขวาสุด)',
    options: [
      'เมื่อวางราบสนิท tiltX จะมีค่าประมาณ 1023',
      'เมื่อวางราบสนิท tiltX จะมีค่าประมาณ -1023',
      'เมื่อวางราบสนิท tiltX จะมีค่าใกล้เคียง 0 (เช่น ช่วง -150 ถึง +150)',
      'ค่า acceleration มีค่าคงที่เท่ากับ 500 เสมอ',
    ],
    correctIndex: 2,
    explanation:
      'เมื่อวางบอร์ดขนานกับพื้น แรงโน้มถ่วงจะลงในแกน Z ทำให้ความเร่งในแกน X และ Y มีค่าใกล้ 0 จึงใช้ตรวจความสมดุลแนวนอนได้',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_16',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ใน Array เก็บค่าอุณหภูมิรายชั่วโมง let temps = [28, 31, 34, 30] ต้องการอ่านค่าชั่วโมงที่ 3 (34°C)',
    codeSnippet: 'let temps = [28, 31, 34, 30]\nbasic.showNumber(temps[?])',
    options: [
      'temps[3]',
      'temps[4]',
      'temps[1]',
      'temps[2] (เพราะ Index ของ Array เริ่มนับจาก 0)',
    ],
    correctIndex: 3,
    explanation:
      'Array ใน MakeCode / JavaScript เริ่มนับตำแหน่ง (Index) จาก 0: index 0=28, index 1=31, index 2=34, index 3=30',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_17',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ส่งข้อมูลอุณหภูมิจาก Micro:bit ไปพล็อตกราฟเรียลไทม์บนคอมพิวเตอร์ผ่านสาย USB ควรใช้หมวดคำสั่งใด?',
    codeSnippet: '// ส่งค่าตัวเลขพร้อมชื่อกราฟไปยังหน้าจอ Show Data (Device) ใน MakeCode',
    options: [
      'radio.sendString("USB")',
      'basic.showNumber(input.temperature())',
      'music.playTone(440, 100)',
      'serial.writeValue("temp", input.temperature())',
    ],
    correctIndex: 3,
    explanation:
      'คำสั่ง serial.writeValue("ชื่อ", ค่า) จะส่งข้อมูลผ่านพอร์ต USB Serial ให้ MakeCode พล็อตเป็นกราฟและส่งออก CSV ได้ทันที',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_18',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ทำระบบไฟจราจรอัตโนมัติ (เขียว -> เหลือง -> แดง) แต่อยากให้กดปุ่ม A แล้วขอข้ามถนนได้ทันทีโดยไม่ต้องรอวนจบรอบยาว',
    codeSnippet:
      'basic.forever(() => {\n  // ไฟเขียว\n  basic.pause(15000)  // ล็อกลูปนาน 15 วินาที กดปุ่มแล้วต้องรออีกนาน!\n})',
    options: [
      'แบ่งการรอเป็นช่วงสั้นๆ หรือเช็กตัวแปร Flag (เช่น pedestrianRequest) ด้วยลูปย่อยร่วมกับ input.runningTime()',
      'เปลี่ยน basic.pause(15000) เป็น basic.pause(60000)',
      'ลบไฟเหลืองและไฟแดงออกทั้งหมด',
      'ให้ผู้ใช้ถอดสายไฟแล้วเสียบใหม่แทนการกดปุ่ม',
    ],
    correctIndex: 0,
    explanation:
      'การหน่วงเวลายาวแบบ Blocking pause ทำให้ระบบตอบสนองช้า การแบ่งตรวจเงื่อนไขเป็นช่วงสั้นๆ หรือใช้เวลาเทียบกับ runningTime() จะทำให้ระบบตอบสนองทันที',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_19',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ต้องการป้องกันการโหวตซ้ำจากนักเรียนคนเดียวกันฝั่ง "เครื่องรับของคุณครู" โดยให้บอร์ดส่งหมายเลขประจำเครื่องมาด้วย',
    codeSnippet:
      '// เครื่องส่ง:\nradio.setTransmitSerialNumber(true)\n// เครื่องรับจะอ่านหมายเลขเฉพาะของบอร์ดผู้ส่งด้วยคำสั่งใด?',
    options: [
      'input.temperature()',
      'radio.receivedPacket(RadioPacketProperty.SerialNumber)',
      'control.deviceName()',
      'led.brightness()',
    ],
    correctIndex: 1,
    explanation:
      'บอร์ด Micro:bit ทุกตัวมี Serial Number เฉพาะตัว เมื่อเปิด setTransmitSerialNumber(true) เครื่องรับสามารถเก็บ Serial Number ลง Array เพื่อกันโหวตซ้ำได้แม่นยำ',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_20',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'เขียนฟังก์ชันวาดกรอบสี่เหลี่ยมรอบขอบจอ LED 5×5 แต่ไม่อยากจุดไฟซ้ำด้านใน (พิกัด 1..3)',
    codeSnippet:
      'for (let y = 0; y < 5; y++) {\n  for (let x = 0; x < 5; x++) {\n    if ( ? ) { led.plot(x, y) }\n  }\n}',
    options: [
      'x == 2 && y == 2',
      'x > 0 && x < 4 && y > 0 && y < 4',
      'x == 0 || x == 4 || y == 0 || y == 4',
      'x == y',
    ],
    correctIndex: 2,
    explanation:
      'ขอบของตาราง 5×5 คือคอลัมน์ซ้ายสุด (x==0), ขวาสุด (x==4), แถวบนสุด (y==0), หรือแถวล่างสุด (y==4) จึงเชื่อมทั้ง 4 เงื่อนไขด้วย OR (||)',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_21',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ในโปรแกรมไฟกะพริบฉุกเฉิน: ทำไมลูป while (alarmOn) ที่ไม่มี basic.pause() ด้านในจึงอาจทำให้ปุ่มหยุดทำงานช้าลง?',
    codeSnippet:
      'while (alarmOn) {\n  led.toggle(2, 2)\n  // ไม่มี basic.pause() เลย!\n}',
    options: [
      'เพราะ while ใช้ได้เฉพาะกับตัวเลขเท่านั้น',
      'เพราะลูปทำงานแน่นต่อเนื่อง 100% จน CPU แทบไม่มีจังหวะสลับไปจัดการ Event อื่น และไฟกะพริบเร็วจนตาแยกไม่ออก',
      'เพราะ led.toggle ใช้ได้ครั้งเดียวต่อวัน',
      'เพราะตัวแปร alarmOn ต้องตั้งชื่อเป็น x เท่านั้น',
    ],
    correctIndex: 1,
    explanation:
      'ในระบบฝังตัว (Embedded) ควรใส่ basic.pause() เล็กน้อยในลูป while เพื่อให้ระบบสลับงาน (Yield) ไปรับเหตุการณ์ปุ่มกดและให้ตามนุษย์มองเห็นไฟกะพริบได้',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_22',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ต้องการสุ่มไฟ LED 1 ดวงบนหน้าจอที่ "ยังไม่ติดไฟ" เพื่อสร้างเกมจุดไฟสะสมให้ครบ 25 ดวง',
    codeSnippet:
      'let rx = randint(0, 4)\nlet ry = randint(0, 4)\n// คำสั่งใดใช้ตรวจว่าพิกัด (rx, ry) เปิดไฟอยู่แล้วหรือไม่?',
    options: [
      'led.plot(rx, ry)',
      'led.unplot(rx, ry)',
      'led.point(rx, ry) (คืนค่า true ถ้าติดอยู่, false ถ้าดับอยู่)',
      'basic.showNumber(rx)',
    ],
    correctIndex: 2,
    explanation:
      'led.point(x, y) คืนค่า Boolean บอกสถานะของหลอด LED ที่พิกัดนั้น ทำให้เขียนเงื่อนไขตรวจหาช่องว่างได้แม่นยำ',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_23',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'สร้างหุ่นยนต์หลบสิ่งกีดขวางด้วยเซนเซอร์อัลตราโซนิก: ถ้าเจอสิ่งกีดขวาง < 15 ซม. ให้หยุด ถอยหลัง และเลี้ยวขวา',
    codeSnippet:
      'if (distance < 15) {\n  // ลำดับขั้นตอนอัลกอริทึมใดปลอดภัยและถูกต้องที่สุด?\n}',
    options: [
      'หยุดมอเตอร์ -> ถอยหลัง 300ms -> หมุนขวา 400ms -> แล้วค่อยเดินหน้าต่อ',
      'เดินหน้าความเร็วสูงสุดทันทีโดยไม่ต้องหยุด',
      'ปิดสวิตช์บอร์ดแล้วรอคนมาหยิบ',
      'หมุนขวาตลอดไปโดยไม่ตรวจสอบเซนเซอร์อีกเลย',
    ],
    correctIndex: 0,
    explanation:
      'ลำดับ Stop -> Reverse -> Turn ช่วยลดแรงกระแทกและเว้นระยะห่างจากสิ่งกีดขวางก่อนเปลี่ยนทิศทาง ทำให้หุ่นยนต์ไม่ติดมุม',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_24',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ทำระบบเก็บข้อมูล Data Logger ลงหน่วยความจำแฟลชของ Micro:bit V2 เพื่อถอดบอร์ดไปเก็บค่านอกสถานที่โดยไม่ต่อคอมฯ',
    codeSnippet: '// ใช้ส่วนเสริม (Extension) ใดใน MakeCode สำหรับบันทึกข้อมูลแบบตารางลงในบอร์ด V2?',
    options: [
      'ส่วนเสริม Neopixel',
      'ส่วนเสริม Servo',
      'ส่วนเสริม Radio',
      'ส่วนเสริม datalogger (datalogger.log(datalogger.createCV("temp", input.temperature())))',
    ],
    correctIndex: 3,
    explanation:
      'Micro:bit V2 รองรับส่วนเสริม datalogger ที่บันทึกข้อมูลเป็นไฟล์ MY_DATA.HTM ลงในตัวบอร์ด เก็บข้อมูลได้แม้นำออกไปใช้งานด้วยแบตเตอรี่นอกห้องเรียน',
    source: 'builtin',
  },
];
