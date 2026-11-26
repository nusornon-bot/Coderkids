import {
  extractFeaturesFromRgba,
  type MlClassDef,
  type MlMissionId,
  type MlSampleItem,
  type MlTestGalleryItem,
} from '../utils/kidsMlEngine.ts';

export interface MlMissionConfig {
  id: MlMissionId;
  title: string;
  shortTitle: string;
  subtitle: string;
  xpReward: number;
  xpUniqueKey: string;
  xpReason: string;
  classes: MlClassDef[];
  presetTraining: Array<{
    id: string;
    classId: string;
    name: string;
    artKey: string;
  }>;
  presetTestGallery: Array<{
    id: string;
    expectedClassId: string;
    name: string;
    hint: string;
    artKey: string;
  }>;
}

export const ML_MISSIONS: Record<MlMissionId, MlMissionConfig> = {
  waste_sorting: {
    id: 'waste_sorting',
    title: 'ภารกิจที่ 1: หุ่นยนต์คัดแยกขยะอัจฉริยะ (Smart Waste Classifier)',
    shortTitle: 'คัดแยกขยะรีไซเคิล',
    subtitle: 'สอน AI แยกภาพขยะรีไซเคิล ขยะอินทรีย์ และขยะอันตราย เพื่อเปิดฝาถังขยะสีเหลือง เขียว และแดงได้อัตโนมัติ',
    xpReward: 20,
    xpUniqueKey: 'kids_ai_lab_train_waste',
    xpReason: 'ฝึกสอนโมเดล AI คัดแยกขยะรีไซเคิลสำเร็จใน Kids AI Lab',
    classes: [
      {
        id: 'recycle',
        name: 'ขยะรีไซเคิล (ถังเหลือง)',
        shortName: 'รีไซเคิล',
        accentHex: '#d97706',
        badgeText: 'ถังสีเหลือง',
        description: 'ขวดพลาสติก กระป๋องโลหะ กล่องกระดาษ ขวดแก้วที่นำไปแปรรูปใหม่ได้',
      },
      {
        id: 'organic',
        name: 'ขยะอินทรีย์ (ถังเขียว)',
        shortName: 'อินทรีย์',
        accentHex: '#059669',
        badgeText: 'ถังสีเขียว',
        description: 'เศษผลไม้ เปลือกผัก ใบไม้ที่ย่อยสลายตามธรรมชาติเป็นปุ๋ยหมักได้',
      },
      {
        id: 'hazardous',
        name: 'ขยะอันตราย (ถังแดง)',
        shortName: 'อันตราย',
        accentHex: '#e11d48',
        badgeText: 'ถังสีแดง',
        description: 'ถ่านไฟฉาย หลอดไฟ กระป๋องสเปรย์ แบตเตอรี่ที่มีสารพิษหรือติดไฟได้',
      },
    ],
    presetTraining: [
      { id: 'w_tr_1', classId: 'recycle', name: 'ขวดพลาสติก PET', artKey: 'plastic_bottle' },
      { id: 'w_tr_2', classId: 'recycle', name: 'กระป๋องอลูมิเนียม', artKey: 'aluminum_can' },
      { id: 'w_tr_3', classId: 'recycle', name: 'กล่องกระดาษลัง', artKey: 'cardboard_box' },
      { id: 'w_tr_4', classId: 'recycle', name: 'ขวดแก้วใส', artKey: 'glass_bottle' },
      { id: 'w_tr_5', classId: 'organic', name: 'เปลือกกล้วยหอม', artKey: 'banana' },
      { id: 'w_tr_6', classId: 'organic', name: 'เศษแอปเปิ้ล', artKey: 'apple_core' },
      { id: 'w_tr_7', classId: 'organic', name: 'ใบไม้แห้ง', artKey: 'leaf' },
      { id: 'w_tr_8', classId: 'organic', name: 'เศษผักกาดเขียว', artKey: 'leafy_cabbage' },
      { id: 'w_tr_9', classId: 'hazardous', name: 'ถ่านไฟฉายเก่า', artKey: 'battery' },
      { id: 'w_tr_10', classId: 'hazardous', name: 'หลอดไฟเสีย', artKey: 'light_bulb' },
      { id: 'w_tr_11', classId: 'hazardous', name: 'กระป๋องสเปรย์', artKey: 'spray_can' },
      { id: 'w_tr_12', classId: 'hazardous', name: 'ขวดน้ำยาเคมี', artKey: 'chemical_bottle' },
    ],
    presetTestGallery: [
      {
        id: 'w_ts_1',
        expectedClassId: 'recycle',
        name: 'แก้วน้ำพลาสติกใส',
        hint: 'ทรงแก้วพลาสติกใส สามารถล้างแล้วรีไซเคิลเป็นเส้นใยพลาสติกได้',
        artKey: 'plastic_cup',
      },
      {
        id: 'w_ts_2',
        expectedClassId: 'organic',
        name: 'เปลือกแตงโมสด',
        hint: 'เศษผลไม้สีเขียวแดง ย่อยสลายในถังขยะอินทรีย์ได้ 100%',
        artKey: 'watermelon',
      },
      {
        id: 'w_ts_3',
        expectedClassId: 'hazardous',
        name: 'แบตเตอรี่มือถือบวม',
        hint: 'มีเซลล์ลิเธียมและสัญลักษณ์อันตราย ห้ามทิ้งรวมกับขยะทั่วไป',
        artKey: 'swollen_battery',
      },
      {
        id: 'w_ts_4',
        expectedClassId: 'recycle',
        name: 'กล่องนมกระดาษ UHT',
        hint: 'กล่องทรงสี่เหลี่ยม ทำจากเยื่อกระดาษเคลือบ รีไซเคิลเป็นแผ่นหลังคาได้',
        artKey: 'milk_carton',
      },
      {
        id: 'w_ts_5',
        expectedClassId: 'organic',
        name: 'เปลือกส้มสด',
        hint: 'เศษเปลือกผลไม้ธรรมชาติ ย่อยสลายทำน้ำหมักชีวภาพได้',
        artKey: 'orange',
      },
      {
        id: 'w_ts_6',
        expectedClassId: 'hazardous',
        name: 'กระป๋องยาฆ่าแมลง',
        hint: 'มีสัญลักษณ์หัวกะโหลกสารเคมีตกค้าง ต้องแยกทิ้งถังแดง',
        artKey: 'pesticide_can',
      },
    ],
  },

  fruits_veggies: {
    id: 'fruits_veggies',
    title: 'ภารกิจที่ 2: สายพานคัดแยกผักและผลไม้ (Fruit & Vegetable Inspector)',
    shortTitle: 'จำแนกผักและผลไม้',
    subtitle: 'ฝึกโมเดล AI จำแนกผลไม้สด ผักใบเขียว และพืชหัว/ผักผล จากสีสันและรูปทรงภาพจริงบนสายพาน',
    xpReward: 20,
    xpUniqueKey: 'kids_ai_lab_train_produce',
    xpReason: 'ฝึกสอนโมเดล AI จำแนกผักและผลไม้สำเร็จใน Kids AI Lab',
    classes: [
      {
        id: 'fruit',
        name: 'ผลไม้สด (Fruits)',
        shortName: 'ผลไม้',
        accentHex: '#e11d48',
        badgeText: 'กลุ่มผลไม้',
        description: 'แอปเปิ้ล กล้วยหอม ส้ม แตงโม สตรอว์เบอร์รี สีสันสดใส ทรงโค้งมน',
      },
      {
        id: 'leafy',
        name: 'ผักใบเขียว (Leafy Greens)',
        shortName: 'ผักใบเขียว',
        accentHex: '#059669',
        badgeText: 'กลุ่มผักใบ',
        description: 'กะหล่ำปลี บรอกโคลี ผักบุ้ง คะน้า อุดมด้วยคลอโรฟิลล์สีเขียว',
      },
      {
        id: 'root_pod',
        name: 'พืชหัวและผักผล (Root & Pod)',
        shortName: 'พืชหัว/ผักผล',
        accentHex: '#ea580c',
        badgeText: 'พืชหัว/ผักผล',
        description: 'แครอท มะเขือเทศ ฟักทอง พริกหยวก ทรงเรียวหรือเป็นพู',
      },
    ],
    presetTraining: [
      { id: 'f_tr_1', classId: 'fruit', name: 'แอปเปิ้ลแดง', artKey: 'red_apple' },
      { id: 'f_tr_2', classId: 'fruit', name: 'กล้วยหอมสุก', artKey: 'banana' },
      { id: 'f_tr_3', classId: 'fruit', name: 'ส้มสายน้ำผึ้ง', artKey: 'orange' },
      { id: 'f_tr_4', classId: 'fruit', name: 'สตรอว์เบอร์รี', artKey: 'strawberry' },
      { id: 'f_tr_5', classId: 'leafy', name: 'กะหล่ำปลีสด', artKey: 'leafy_cabbage' },
      { id: 'f_tr_6', classId: 'leafy', name: 'บรอกโคลี', artKey: 'broccoli' },
      { id: 'f_tr_7', classId: 'leafy', name: 'ผักคะน้าใบเขียว', artKey: 'kale' },
      { id: 'f_tr_8', classId: 'leafy', name: 'ผักกาดเขียว', artKey: 'lettuce' },
      { id: 'f_tr_9', classId: 'root_pod', name: 'แครอทหัวส้ม', artKey: 'carrot' },
      { id: 'f_tr_10', classId: 'root_pod', name: 'มะเขือเทศสุก', artKey: 'tomato' },
      { id: 'f_tr_11', classId: 'root_pod', name: 'ฟักทองผลใหญ่', artKey: 'pumpkin' },
      { id: 'f_tr_12', classId: 'root_pod', name: 'หัวหอมใหญ่', artKey: 'onion' },
    ],
    presetTestGallery: [
      {
        id: 'f_ts_1',
        expectedClassId: 'fruit',
        name: 'แตงโมผ่าซีก',
        hint: 'เนื้อสีแดงฉ่ำ เปลือกเขียว มีเมล็ด เป็นผลไม้ให้ความสดชื่น',
        artKey: 'watermelon',
      },
      {
        id: 'f_ts_2',
        expectedClassId: 'leafy',
        name: 'ผักสลัดกรีนโอ๊ค',
        hint: 'พุ่มใบหยักสีเขียวอ่อน ใช้ใบในการปรุงอาหารเป็นหลัก',
        artKey: 'green_oak',
      },
      {
        id: 'f_ts_3',
        expectedClassId: 'root_pod',
        name: 'พริกหยวกส้ม',
        hint: 'ผักผลทรงพูสีส้มสว่าง มีขั้วสีเขียวด้านบน',
        artKey: 'bell_pepper',
      },
      {
        id: 'f_ts_4',
        expectedClassId: 'fruit',
        name: 'มะม่วงสุกสีทอง',
        hint: 'ผลไม้เขตร้อนรูปทรงรี สีเหลืองทองสดใส',
        artKey: 'mango',
      },
      {
        id: 'f_ts_5',
        expectedClassId: 'leafy',
        name: 'กวางตุ้งฮ่องเต้',
        hint: 'ก้านอวบและใบสีเขียวเข้มเป็นพุ่ม',
        artKey: 'bok_choy',
      },
      {
        id: 'f_ts_6',
        expectedClassId: 'root_pod',
        name: 'ข้าวโพดหวาน',
        hint: 'ฝักสีเหลืองทองเรียวเป็นแถว หุ้มด้วยกาบเขียว',
        artKey: 'corn',
      },
    ],
  },

  custom_lab: {
    id: 'custom_lab',
    title: 'ภารกิจที่ 3: ห้องทดลองสร้างโมเดลอิสระ (Custom Teachable Studio)',
    shortTitle: 'สร้างคลาสสอน AI เอง',
    subtitle: 'กำหนดหมวดหมู่เองแล้ววาดภาพ อัปโหลดรูปภาพ หรือถ่ายผ่านเว็บแคม เพื่อฝึกสอน AI ด้วยข้อมูลของคุณเอง',
    xpReward: 25,
    xpUniqueKey: 'kids_ai_lab_train_custom',
    xpReason: 'สร้างและฝึกสอนโมเดล AI ด้วยตนเองสำเร็จใน Kids AI Lab',
    classes: [
      {
        id: 'custom_a',
        name: 'หมวด A: ดวงอาทิตย์ / ทรงกลม',
        shortName: 'หมวด A',
        accentHex: '#0284c7',
        badgeText: 'คลาสที่ 1',
        description: 'ลองวาดหรืออัปโหลดภาพที่มีลักษณะเด่นของหมวด A',
      },
      {
        id: 'custom_b',
        name: 'หมวด B: ต้นไม้ / ใบไม้เขียว',
        shortName: 'หมวด B',
        accentHex: '#059669',
        badgeText: 'คลาสที่ 2',
        description: 'ลองวาดหรืออัปโหลดภาพที่มีลักษณะเด่นของหมวด B',
      },
      {
        id: 'custom_c',
        name: 'หมวด C: บ้าน / ทรงสี่เหลี่ยม',
        shortName: 'หมวด C',
        accentHex: '#7c3aed',
        badgeText: 'คลาสที่ 3',
        description: 'ลองวาดหรืออัปโหลดภาพที่มีลักษณะเด่นของหมวด C',
      },
    ],
    presetTraining: [
      { id: 'c_tr_1', classId: 'custom_a', name: 'ตัวอย่าง ดวงอาทิตย์ 1', artKey: 'shape_sun' },
      { id: 'c_tr_2', classId: 'custom_a', name: 'ตัวอย่าง ทรงกลมสีส้ม', artKey: 'orange' },
      { id: 'c_tr_3', classId: 'custom_b', name: 'ตัวอย่าง ต้นไม้เขียว 1', artKey: 'shape_tree' },
      { id: 'c_tr_4', classId: 'custom_b', name: 'ตัวอย่าง ใบไม้', artKey: 'leaf' },
      { id: 'c_tr_5', classId: 'custom_c', name: 'ตัวอย่าง บ้านหลังคาแดง', artKey: 'shape_house' },
      { id: 'c_tr_6', classId: 'custom_c', name: 'ตัวอย่าง กล่องสี่เหลี่ยม', artKey: 'cardboard_box' },
    ],
    presetTestGallery: [
      {
        id: 'c_ts_1',
        expectedClassId: 'custom_a',
        name: 'ภาพทดสอบทรงกลมแสงจ้า',
        hint: 'รูปทรงกลมโทนสีส้มเหลืองบริเวณกึ่งกลางภาพ',
        artKey: 'shape_sun',
      },
      {
        id: 'c_ts_2',
        expectedClassId: 'custom_b',
        name: 'ภาพทดสอบต้นไม้',
        hint: 'พุ่มใบสามเหลี่ยมสีเขียวและลำต้นสีน้ำตาล',
        artKey: 'shape_tree',
      },
      {
        id: 'c_ts_3',
        expectedClassId: 'custom_c',
        name: 'ภาพทดสอบบ้านทรงเหลี่ยม',
        hint: 'โครงสร้างสี่เหลี่ยมและหลังคาจั่วเรขาคณิต',
        artKey: 'shape_house',
      },
    ],
  },
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Renders an authentic 2D raster illustration of an object onto a square canvas,
 * then extracts both a crisp PNG data URL and the real 72-d pixel feature vector.
 */
export function renderPresetArtSample(
  artKey: string,
  size: number = 96
): { dataUrl: string; features: number[] } {
  if (typeof document === 'undefined') {
    return {
      dataUrl: '',
      features: buildFallbackSyntheticFeatures(artKey),
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      dataUrl: '',
      features: buildFallbackSyntheticFeatures(artKey),
    };
  }

  // Clean off-white lab background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);

  const s = size / 96;
  ctx.save();
  ctx.scale(s, s);

  switch (artKey) {
    case 'plastic_bottle': {
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, 32, 26, 32, 56, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0ea5e9';
      drawRoundedRect(ctx, 32, 46, 32, 16, 2);
      ctx.fill();
      ctx.fillStyle = '#0369a1';
      drawRoundedRect(ctx, 40, 14, 16, 12, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(38, 31, 5, 42);
      break;
    }
    case 'aluminum_can': {
      const grad = ctx.createLinearGradient(30, 20, 66, 20);
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(0.45, '#e2e8f0');
      grad.addColorStop(1, '#64748b');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, 30, 20, 36, 58, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(31, 38, 34, 18);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(34, 17, 28, 5);
      break;
    }
    case 'cardboard_box': {
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, 18, 28, 60, 48, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(19, 28, 58, 12);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(42, 28, 12, 34);
      break;
    }
    case 'glass_bottle': {
      ctx.fillStyle = '#a7f3d0';
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, 33, 34, 30, 48, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(41, 14, 14, 22);
      ctx.strokeRect(41, 14, 14, 22);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(38, 40, 4, 34);
      break;
    }
    case 'plastic_cup': {
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(28, 28);
      ctx.lineTo(68, 28);
      ctx.lineTo(60, 80);
      ctx.lineTo(36, 80);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(48, 28);
      ctx.lineTo(58, 10);
      ctx.stroke();
      break;
    }
    case 'milk_carton': {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, 30, 28, 36, 52, 3);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30, 28);
      ctx.lineTo(48, 15);
      ctx.lineTo(66, 28);
      ctx.closePath();
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(32, 46, 32, 16);
      break;
    }
    case 'banana': {
      ctx.strokeStyle = '#ca8a04';
      ctx.fillStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(22, 62);
      ctx.quadraticCurveTo(48, 82, 76, 30);
      ctx.quadraticCurveTo(60, 58, 22, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(72, 24, 6, 8);
      break;
    }
    case 'apple_core':
    case 'red_apple': {
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(48, 52, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (artKey === 'apple_core') {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(36, 36, 24, 32);
      }
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(58, 24, 10, 5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(48, 28);
      ctx.lineTo(48, 16);
      ctx.stroke();
      break;
    }
    case 'leaf': {
      ctx.fillStyle = '#65a30d';
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(22, 68);
      ctx.quadraticCurveTo(28, 20, 76, 22);
      ctx.quadraticCurveTo(72, 70, 22, 68);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(16, 74);
      ctx.lineTo(66, 30);
      ctx.stroke();
      break;
    }
    case 'leafy_cabbage':
    case 'lettuce':
    case 'green_oak': {
      const mainColor = artKey === 'green_oak' ? '#4ade80' : artKey === 'lettuce' ? '#22c55e' : '#16a34a';
      ctx.fillStyle = mainColor;
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(48, 52, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(42, 48, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(56, 52, 13, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'broccoli':
    case 'kale':
    case 'bok_choy': {
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(42, 54, 12, 26);
      ctx.fillStyle = '#15803d';
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 2;
      [
        [36, 40, 14],
        [60, 40, 14],
        [48, 30, 16],
        [48, 46, 14],
      ].forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      break;
    }
    case 'battery':
    case 'swollen_battery': {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, 30, 24, 36, 54, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(30, 24, 36, 18);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(40, 16, 16, 8);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(50, 46);
      ctx.lineTo(42, 58);
      ctx.lineTo(50, 58);
      ctx.lineTo(46, 70);
      ctx.lineTo(58, 54);
      ctx.lineTo(50, 54);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'light_bulb': {
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(48, 40, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      drawRoundedRect(ctx, 38, 60, 20, 18, 3);
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(38, 32);
      ctx.lineTo(58, 50);
      ctx.moveTo(58, 32);
      ctx.lineTo(38, 50);
      ctx.stroke();
      break;
    }
    case 'spray_can':
    case 'pesticide_can':
    case 'chemical_bottle': {
      ctx.fillStyle = artKey === 'chemical_bottle' ? '#f43f5e' : '#b91c1c';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, 32, 30, 32, 50, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      drawRoundedRect(ctx, 40, 16, 16, 14, 2);
      ctx.fill();
      // Warning diamond
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(48, 40);
      ctx.lineTo(60, 54);
      ctx.lineTo(48, 68);
      ctx.lineTo(36, 54);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'orange': {
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(48, 50, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(54, 22, 8, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'strawberry': {
      ctx.fillStyle = '#e11d48';
      ctx.strokeStyle = '#9f1239';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(48, 78);
      ctx.quadraticCurveTo(20, 54, 28, 32);
      ctx.quadraticCurveTo(48, 22, 68, 32);
      ctx.quadraticCurveTo(76, 54, 48, 78);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(36, 20, 24, 10);
      ctx.fillStyle = '#fef08a';
      [
        [40, 44],
        [54, 44],
        [47, 56],
        [42, 64],
        [52, 64],
      ].forEach(([x, y]) => ctx.fillRect(x, y, 3, 4));
      break;
    }
    case 'watermelon': {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(48, 44, 30, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(48, 44, 24, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      [
        [38, 52],
        [48, 58],
        [58, 52],
      ].forEach(([x, y]) => ctx.fillRect(x, y, 3, 5));
      break;
    }
    case 'mango': {
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(48, 50, 20, 28, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#15803d';
      ctx.fillRect(54, 18, 8, 8);
      break;
    }
    case 'carrot': {
      ctx.fillStyle = '#ea580c';
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(34, 28);
      ctx.lineTo(62, 28);
      ctx.lineTo(48, 82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(40, 14, 16, 14);
      break;
    }
    case 'tomato':
    case 'bell_pepper': {
      ctx.fillStyle = artKey === 'tomato' ? '#ef4444' : '#f97316';
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, 24, 30, 48, 44, 16);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#15803d';
      ctx.fillRect(44, 18, 8, 12);
      break;
    }
    case 'pumpkin':
    case 'onion': {
      ctx.fillStyle = artKey === 'pumpkin' ? '#d97706' : '#c084fc';
      ctx.strokeStyle = artKey === 'pumpkin' ? '#78350f' : '#7e22ce';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(48, 54, 28, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(45, 22, 6, 12);
      break;
    }
    case 'corn': {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(48, 46, 13, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(34, 48);
      ctx.lineTo(48, 80);
      ctx.lineTo(62, 48);
      ctx.fill();
      break;
    }
    case 'shape_sun': {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(48, 48, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      for (let a = 0; a < 8; a += 1) {
        const rad = (a * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(48 + Math.cos(rad) * 27, 48 + Math.sin(rad) * 27);
        ctx.lineTo(48 + Math.cos(rad) * 36, 48 + Math.sin(rad) * 36);
        ctx.stroke();
      }
      break;
    }
    case 'shape_tree': {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(42, 58, 12, 24);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(48, 14);
      ctx.lineTo(74, 60);
      ctx.lineTo(22, 60);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'shape_house': {
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(24, 44, 48, 36);
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(48, 16);
      ctx.lineTo(78, 44);
      ctx.lineTo(18, 44);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(41, 56, 14, 24);
      break;
    }
    default: {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(48, 48, 24, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();

  const imgData = ctx.getImageData(0, 0, size, size);
  const features = extractFeaturesFromRgba(imgData.data, size, size);
  const dataUrl = canvas.toDataURL('image/png');
  return { dataUrl, features };
}

/**
 * Fallback deterministic feature vector when running in Node/SSR without DOM Canvas.
 */
function buildFallbackSyntheticFeatures(artKey: string): number[] {
  const vec = new Array(72).fill(0.05);
  let hash = 0;
  for (let i = 0; i < artKey.length; i += 1) {
    hash = (hash * 31 + artKey.charCodeAt(i)) >>> 0;
  }
  vec[hash % 48] = 0.7;
  vec[48 + (hash % 12)] = 0.6;
  const norm = Math.sqrt(vec.reduce((a, v) => a + v * v, 0)) || 1;
  return vec.map((v) => Number((v / norm).toFixed(5)));
}

/**
 * Extracts ML features and a thumbnail Data URL from any HTMLCanvasElement (e.g., Drawing Pad or Webcam capture).
 */
export function extractSampleFromCanvas(sourceCanvas: HTMLCanvasElement): {
  dataUrl: string;
  features: number[];
} {
  const sampleSize = 96;
  const off = document.createElement('canvas');
  off.width = sampleSize;
  off.height = sampleSize;
  const ctx = off.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', features: new Array(72).fill(0) };
  }
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, sampleSize, sampleSize);
  ctx.drawImage(sourceCanvas, 0, 0, sampleSize, sampleSize);
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  return {
    dataUrl: off.toDataURL('image/png'),
    features: extractFeaturesFromRgba(imgData.data, sampleSize, sampleSize),
  };
}

/**
 * Loads an uploaded image File into an HTMLCanvasElement, scales it cleanly (center-cropped square),
 * and extracts its real pixel feature vector + PNG thumbnail.
 */
export async function extractSampleFromImageFile(file: File): Promise<{
  dataUrl: string;
  features: number[];
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ภาพได้'));
      el.src = objectUrl;
    });

    const sampleSize = 96;
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, sampleSize, sampleSize);

    // Center-fit aspect-preserving draw
    const scale = Math.min(sampleSize / img.width, sampleSize / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const dx = (sampleSize - drawW) / 2;
    const dy = (sampleSize - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);

    const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      features: extractFeaturesFromRgba(imgData.data, sampleSize, sampleSize),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Materializes preset training and test gallery items with real canvas-extracted features.
 */
export function buildMissionAssets(missionId: MlMissionId): {
  classes: MlClassDef[];
  trainingSamples: MlSampleItem[];
  testGallery: MlTestGalleryItem[];
} {
  const mission = ML_MISSIONS[missionId];
  const trainingSamples: MlSampleItem[] = mission.presetTraining.map((item) => {
    const rendered = renderPresetArtSample(item.artKey, 96);
    return {
      id: item.id,
      classId: item.classId,
      name: item.name,
      dataUrl: rendered.dataUrl,
      features: rendered.features,
      source: 'preset',
    };
  });

  const testGallery: MlTestGalleryItem[] = mission.presetTestGallery.map((item) => {
    const rendered = renderPresetArtSample(item.artKey, 96);
    return {
      id: item.id,
      expectedClassId: item.expectedClassId,
      name: item.name,
      hint: item.hint,
      dataUrl: rendered.dataUrl,
      features: rendered.features,
    };
  });

  return {
    classes: mission.classes.map((c) => ({ ...c })),
    trainingSamples,
    testGallery,
  };
}
