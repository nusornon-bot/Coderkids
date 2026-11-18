/**
 * Automated clean Python 3 script exporter for ScratchStudio & MicrobitSimulator.
 * Produces raw, standalone, clean Python 3 scripts (with optional educational comments)
 * designed for immediate execution inside JuniorCodePlayground or standard Python environments.
 */

export interface ScratchBlockExportInput {
  id: string;
  category: string;
  name: string;
  code: string;
}

export type ScratchPythonExportMode = 'playground' | 'turtle';

export interface ScratchPythonExportOptions {
  mode?: ScratchPythonExportMode;
  includeComments?: boolean;
  inputValA?: number;
  inputValB?: number;
}

export type MicrobitPythonExportMode = 'playground' | 'micropython';

export interface MicrobitPythonExportOptions {
  presetId: string;
  mode?: MicrobitPythonExportMode;
  includeComments?: boolean;
  temperature?: number;
  lightLevel?: number;
  counterValue?: number;
  leds?: boolean[][];
  useCustomLedMatrix?: boolean;
}

function escapePyString(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatLedMatrixRows(leds: boolean[][]): string[] {
  return leds.map((row) => `    "${row.map((on) => (on ? '#' : '.')).join(' ')}"`);
}

export function exportScratchBlocksToPython(
  blocks: ScratchBlockExportInput[],
  options: ScratchPythonExportOptions = {}
): string {
  const mode: ScratchPythonExportMode = options.mode ?? 'playground';
  const includeComments = options.includeComments ?? false;
  const inputValA = Number.isFinite(options.inputValA) ? Number(options.inputValA) : 12;
  const inputValB = Number.isFinite(options.inputValB) ? Number(options.inputValB) : 18;

  if (blocks.length === 0) {
    return 'print("No Scratch blocks to export yet.")';
  }

  const cmt = (th: string) => (includeComments ? `  # ${th}` : '');
  const lines: string[] = [];

  if (mode === 'turtle') {
    const usesTurtle = blocks.some(
      (b) =>
        b.category === 'motion' ||
        b.category === 'pen' ||
        b.code.startsWith('repeat') ||
        b.code === 'hide' ||
        b.code === 'show' ||
        b.code === 'bounce'
    );
    const usesTime = blocks.some((b) => b.code.startsWith('wait:'));
    const usesRandom = blocks.some((b) => b.code === 'goto:random' || b.code === 'random_color');
    const usesScore = blocks.some((b) => b.code.startsWith('score:'));
    const usesCostume = blocks.some((b) => b.code === 'next_costume');
    const usesVarAb = blocks.some(
      (b) => b.code === 'var_even_odd' || b.code === 'var_bmi_check' || b.code === 'var_lcm_loop'
    );
    const hasExplicitReadAb = blocks.some((b) => b.code === 'var_read_ab');

    if (usesTurtle) lines.push('import turtle');
    if (usesTime) lines.push('import time');
    if (usesRandom) lines.push('import random');
    if (usesTurtle || usesTime || usesRandom) lines.push('');

    if (usesTurtle) {
      lines.push(`t = turtle.Turtle()${cmt('สร้างตัวละครเต่า (แทนแมวส้ม)')}`);
      lines.push('t.speed(3)');
    }
    if (usesScore) lines.push('score = 0');
    if (usesCostume) lines.push('costume = 0');
    if (usesVarAb && !hasExplicitReadAb) {
      lines.push(`A = ${inputValA}`);
      lines.push(`B = ${inputValB}`);
    }
    if (usesTurtle || usesScore || usesCostume || (usesVarAb && !hasExplicitReadAb)) {
      lines.push('');
    }

    const formatTurtleBlock = (block: ScratchBlockExportInput, indent = ''): string[] => {
      const out: string[] = [];
      const add = (text: string) => out.push(`${indent}${text}`);

      if (block.code === 'start') {
        if (includeComments) add('# เมื่อคลิก ธงเขียว');
      } else if (block.code === 'erase_all') {
        add(`t.clear()${cmt('ลบรอยวาดทั้งหมด')}`);
      } else if (block.code === 'pen_down') {
        add(`t.pendown()${cmt('จรดปากกา')}`);
      } else if (block.code === 'pen_up') {
        add(`t.penup()${cmt('ยกปากกา')}`);
      } else if (block.code === 'hide') {
        add(`t.hideturtle()${cmt('ซ่อนตัวละคร')}`);
      } else if (block.code === 'show') {
        add(`t.showturtle()${cmt('แสดงตัวละคร')}`);
      } else if (block.code.startsWith('goto:')) {
        const target = block.code.split(':')[1] || '0,0';
        if (target === 'random') {
          add(`t.goto(random.randint(-130, 130), random.randint(-90, 90))`);
        } else {
          const parts = target.split(',');
          const gx = parseInt(parts[0], 10) || 0;
          const gy = parseInt(parts[1], 10) || 0;
          add(`t.goto(${gx}, ${gy})`);
        }
      } else if (block.code.startsWith('point:')) {
        const deg = parseInt(block.code.split(':')[1], 10);
        const scratchDeg = Number.isNaN(deg) ? 90 : deg;
        const turtleDeg = (90 - scratchDeg + 360) % 360;
        add(`t.setheading(${turtleDeg})`);
      } else if (block.code.startsWith('move:')) {
        const steps = parseInt(block.code.split(':')[1], 10) || 10;
        add(`t.forward(${steps})`);
      } else if (block.code.startsWith('turn:')) {
        const deg = parseInt(block.code.split(':')[1], 10) || 90;
        add(deg >= 0 ? `t.right(${deg})` : `t.left(${Math.abs(deg)})`);
      } else if (block.code.startsWith('set_color:')) {
        const hex = block.code.split(':')[1] || '#2563eb';
        add(`t.pencolor("${hex}")`);
      } else if (block.code === 'random_color') {
        add('t.pencolor(random.choice(["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#9333ea"]))');
      } else if (block.code.startsWith('set_size:')) {
        const sz = parseInt(block.code.split(':')[1], 10) || 4;
        add(`t.pensize(${sz})`);
      } else if (block.code.startsWith('say:')) {
        add(`print("${escapePyString(block.code.slice(4))}")`);
      } else if (block.code.startsWith('wait:')) {
        const ms = parseInt(block.code.split(':')[1], 10) || 500;
        add(`time.sleep(${Number((ms / 1000).toFixed(2))})`);
      } else if (block.code.startsWith('score:')) {
        const pts = parseInt(block.code.split(':')[1], 10) || 10;
        add(`score += ${pts}`);
      } else if (block.code === 'next_costume') {
        add('costume = (costume + 1) % 2');
      } else if (block.code === 'bounce') {
        add('t.right(180)');
      } else if (block.code === 'sound_meow') {
        add('print("Meow!")');
      } else if (block.code === 'sound_chime') {
        add('print("Chime!")');
      } else if (block.code === 'var_read_ab') {
        add(`A = ${inputValA}`);
        add(`B = ${inputValB}`);
      } else if (block.code === 'var_even_odd') {
        add('if A % 2 == 0:');
        add('    print(f"{A} เป็น เลขคู่ (Even)")');
        add('else:');
        add('    print(f"{A} เป็น เลขคี่ (Odd)")');
      } else if (block.code === 'var_bmi_check') {
        add('height_m = B / 100');
        add('bmi = round(A / (height_m ** 2), 1)');
        add('if bmi < 18.5:');
        add('    status = "ผอม (ควรเพิ่มสารอาหาร)"');
        add('elif bmi < 23:');
        add('    status = "สมส่วนดีมาก!"');
        add('else:');
        add('    status = "น้ำหนักเกินเกณฑ์"');
        add('print("BMI =", bmi, "->", status)');
      } else if (block.code === 'var_lcm_loop') {
        add('lcm = max(A, B)');
        add('while not (lcm % A == 0 and lcm % B == 0):');
        add('    lcm += 1');
        add('print("ค.ร.น. (LCM) =", lcm)');
      } else if (block.code.startsWith('broadcast:')) {
        const msg = escapePyString(block.code.slice(10) || 'ภารกิจสำเร็จ!');
        add(`broadcast_message = "${msg}"`);
        add('print("Broadcast:", broadcast_message)');
      }
      return out;
    };

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.code.startsWith('repeat_walk:')) {
        const parts = block.code.split(':');
        const count = parseInt(parts[1], 10) || 5;
        const steps = parseInt(parts[2], 10) || 10;
        lines.push(`for i in range(${count}):`);
        lines.push(`    t.forward(${steps})`);
      } else if (block.code === 'repeat_square:4') {
        lines.push('for i in range(4):');
        lines.push('    t.forward(80)');
        lines.push('    t.right(90)');
      } else if (block.code === 'repeat_triangle:3') {
        lines.push('for i in range(3):');
        lines.push('    t.forward(90)');
        lines.push('    t.right(120)');
      } else if (block.code === 'repeat_star:5') {
        lines.push('for i in range(5):');
        lines.push('    t.forward(75)');
        lines.push('    t.right(144)');
      } else if (block.code === 'repeat_circle:36') {
        lines.push('for i in range(36):');
        lines.push('    t.forward(7)');
        lines.push('    t.right(10)');
      } else if (block.code === 'repeat_pinwheel:8') {
        lines.push('for i in range(8):');
        lines.push('    t.forward(55)');
        lines.push('    t.right(135)');
      } else if (block.code === 'repeat_spiral:18') {
        lines.push(
          'colors = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#9333ea", "#eab308", "#ec4899", "#06b6d4"]'
        );
        lines.push('for s in range(18):');
        lines.push('    t.pencolor(colors[s % len(colors)])');
        lines.push('    t.forward(10 + s * 4)');
        lines.push('    t.right(60)');
      } else if (block.code.startsWith('repeat:')) {
        const count = parseInt(block.code.split(':')[1], 10) || 4;
        const remaining = blocks.slice(i + 1);
        const loopActions: ScratchBlockExportInput[] = [];
        for (const sub of remaining) {
          const isLoopable =
            sub.code.startsWith('move:') ||
            sub.code.startsWith('turn:') ||
            sub.code.startsWith('point:') ||
            sub.code.startsWith('wait:') ||
            sub.code === 'next_costume' ||
            sub.code === 'random_color' ||
            sub.code.startsWith('set_size:');
          if (!isLoopable) break;
          loopActions.push(sub);
          if (loopActions.length >= 5) break;
        }
        lines.push(`for i in range(${count}):`);
        if (loopActions.length > 0) {
          for (const sub of loopActions) {
            lines.push(...formatTurtleBlock(sub, '    '));
          }
          i += loopActions.length;
        } else {
          const turnAngle = Number((360 / Math.max(1, count)).toFixed(1));
          const sideLength =
            count === 4 ? 80 : count >= 20 ? 12 : count >= 10 ? 25 : count >= 6 ? 50 : 75;
          lines.push(`    t.forward(${sideLength})`);
          lines.push(`    t.right(${turnAngle})`);
        }
      } else {
        lines.push(...formatTurtleBlock(block, ''));
      }
    }

    if (usesTurtle) {
      lines.push('');
      lines.push('turtle.done()');
    }

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  // Default mode: 'playground' -> 100% pure runnable Python 3 for JuniorCodePlayground
  const usesRandom = blocks.some((b) => b.code === 'goto:random' || b.code === 'random_color');
  const usesStageState = blocks.some(
    (b) =>
      b.category === 'motion' ||
      b.category === 'pen' ||
      b.code.startsWith('repeat') ||
      b.code === 'hide' ||
      b.code === 'show' ||
      b.code === 'bounce'
  );
  const usesScore = blocks.some((b) => b.code.startsWith('score:'));
  const usesCostume = blocks.some((b) => b.code === 'next_costume');
  const usesVarAb = blocks.some(
    (b) => b.code === 'var_even_odd' || b.code === 'var_bmi_check' || b.code === 'var_lcm_loop'
  );
  const hasExplicitReadAb = blocks.some((b) => b.code === 'var_read_ab');

  if (usesRandom) {
    lines.push('import random');
    lines.push('');
  }
  if (usesStageState) {
    lines.push(`x = -40${cmt('พิกัดเริ่มต้นแกน X')}`);
    lines.push(`y = 40${cmt('พิกัดเริ่มต้นแกน Y')}`);
    lines.push('heading = 90');
    lines.push('pen_down = False');
    lines.push('pen_color = "#2563eb"');
    lines.push('pen_size = 5');
    lines.push('sprite_visible = True');
  }
  if (usesScore) lines.push('score = 0');
  if (usesCostume) lines.push('costume = 0');
  if (usesVarAb && !hasExplicitReadAb) {
    lines.push(`A = ${inputValA}`);
    lines.push(`B = ${inputValB}`);
  }
  if (usesStageState || usesScore || usesCostume || (usesVarAb && !hasExplicitReadAb)) {
    lines.push('');
  }

  const formatPlaygroundBlock = (block: ScratchBlockExportInput, indent = ''): string[] => {
    const out: string[] = [];
    const add = (text: string) => out.push(`${indent}${text}`);

    if (block.code === 'start') {
      if (includeComments) add('# เมื่อคลิก ธงเขียว');
    } else if (block.code === 'erase_all') {
      add(`print("🧹 ลบรอยวาดทั้งหมดบนเวที")`);
    } else if (block.code === 'pen_down') {
      add(`pen_down = True${cmt('จรดปากกา')}`);
    } else if (block.code === 'pen_up') {
      add(`pen_down = False${cmt('ยกปากกา')}`);
    } else if (block.code === 'hide') {
      add('sprite_visible = False');
    } else if (block.code === 'show') {
      add('sprite_visible = True');
    } else if (block.code.startsWith('goto:')) {
      const target = block.code.split(':')[1] || '0,0';
      if (target === 'random') {
        add('x = random.randint(-130, 130)');
        add('y = random.randint(-90, 90)');
      } else {
        const parts = target.split(',');
        const gx = parseInt(parts[0], 10) || 0;
        const gy = parseInt(parts[1], 10) || 0;
        add(`x = ${gx}`);
        add(`y = ${gy}`);
      }
      add('print(f"📍 ย้ายไปพิกัด ({x}, {y}) | ปากกา={pen_down}")');
    } else if (block.code.startsWith('point:')) {
      const deg = parseInt(block.code.split(':')[1], 10);
      const scratchDeg = Number.isNaN(deg) ? 90 : deg;
      add(`heading = ${scratchDeg}`);
    } else if (block.code.startsWith('move:')) {
      const steps = parseInt(block.code.split(':')[1], 10) || 10;
      add(`x += ${steps}`);
      add(`print(f"🚶 เดินหน้า ${steps} ก้าว (ทิศ {heading}°)")`);
    } else if (block.code.startsWith('turn:')) {
      const deg = parseInt(block.code.split(':')[1], 10) || 90;
      add(`heading = (heading + ${deg}) % 360`);
      add(`print(f"↻ หมุน ${deg}° -> ทิศทางใหม่ {heading}°")`);
    } else if (block.code.startsWith('set_color:')) {
      const hex = block.code.split(':')[1] || '#2563eb';
      add(`pen_color = "${hex}"`);
    } else if (block.code === 'random_color') {
      add('palette = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#9333ea"]');
      add('pen_color = random.choice(palette)');
    } else if (block.code.startsWith('set_size:')) {
      const sz = parseInt(block.code.split(':')[1], 10) || 4;
      add(`pen_size = ${sz}`);
    } else if (block.code.startsWith('say:')) {
      add(`print("💬 ${escapePyString(block.code.slice(4))}")`);
    } else if (block.code.startsWith('wait:')) {
      const ms = parseInt(block.code.split(':')[1], 10) || 500;
      add(`print("⏳ รอ ${Number((ms / 1000).toFixed(2))} วินาที")`);
    } else if (block.code.startsWith('score:')) {
      const pts = parseInt(block.code.split(':')[1], 10) || 10;
      add(`score += ${pts}`);
      add('print("⭐ คะแนนสะสม =", score)');
    } else if (block.code === 'next_costume') {
      add('costume = (costume + 1) % 2');
    } else if (block.code === 'bounce') {
      add('heading = (heading + 180) % 360');
    } else if (block.code === 'sound_meow') {
      add('print("🐱 Meow!")');
    } else if (block.code === 'sound_chime') {
      add('print("✨ Chime!")');
    } else if (block.code === 'var_read_ab') {
      add(`A = ${inputValA}`);
      add(`B = ${inputValB}`);
      add('print(f"อ่านค่าตัวแปร A = {A}, B = {B}")');
    } else if (block.code === 'var_even_odd') {
      add('if A % 2 == 0:');
      add('    print(f"{A} เป็น เลขคู่ (Even)")');
      add('else:');
      add('    print(f"{A} เป็น เลขคี่ (Odd)")');
    } else if (block.code === 'var_bmi_check') {
      add('height_m = B / 100');
      add('bmi = round(A / (height_m ** 2), 1)');
      add('if bmi < 18.5:');
      add('    status = "ผอม (ควรเพิ่มสารอาหาร)"');
      add('elif bmi < 23:');
      add('    status = "สมส่วนดีมาก!"');
      add('else:');
      add('    status = "น้ำหนักเกินเกณฑ์"');
      add('print("BMI =", bmi, "->", status)');
    } else if (block.code === 'var_lcm_loop') {
      add('lcm = max(A, B)');
      add('while not (lcm % A == 0 and lcm % B == 0):');
      add('    lcm += 1');
      add('print("ค.ร.น. (LCM) =", lcm)');
    } else if (block.code.startsWith('broadcast:')) {
      const msg = escapePyString(block.code.slice(10) || 'ภารกิจสำเร็จ!');
      add(`broadcast_message = "${msg}"`);
      add('print("📡 ส่งสัญญาณ Broadcast:", broadcast_message)');
      add('print("🤖 หุ่นยนต์ได้รับสาร:", broadcast_message)');
    }
    return out;
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.code.startsWith('repeat_walk:')) {
      const parts = block.code.split(':');
      const count = parseInt(parts[1], 10) || 5;
      const steps = parseInt(parts[2], 10) || 10;
      lines.push(`for i in range(1, ${count + 1}):`);
      lines.push(`    x += ${steps}`);
      lines.push(`    print(f"รอบที่ {i}: เดินหน้า ${steps} ก้าว -> x = {x}")`);
    } else if (block.code === 'repeat_square:4') {
      lines.push('for side in range(1, 5):');
      lines.push('    heading = (heading + 90) % 360');
      lines.push('    print(f"วาดด้านที่ {side}/4: เดิน 80 ก้าว, หมุน 90° -> ทิศ {heading}°")');
    } else if (block.code === 'repeat_triangle:3') {
      lines.push('for side in range(1, 4):');
      lines.push('    heading = (heading + 120) % 360');
      lines.push('    print(f"วาดด้านที่ {side}/3: เดิน 90 ก้าว, หมุน 120° -> ทิศ {heading}°")');
    } else if (block.code === 'repeat_star:5') {
      lines.push('for tip in range(1, 6):');
      lines.push('    heading = (heading + 144) % 360');
      lines.push('    print(f"วาดแฉกที่ {tip}/5: เดิน 75 ก้าว, หมุน 144° -> ทิศ {heading}°")');
    } else if (block.code === 'repeat_circle:36') {
      lines.push('for step in range(1, 37):');
      lines.push('    heading = (heading + 10) % 360');
      lines.push('print(f"วาดวงกลมครบ 36 รอบ (มุมรวม 360°) -> ทิศสุดท้าย {heading}°")');
    } else if (block.code === 'repeat_pinwheel:8') {
      lines.push('for blade in range(1, 9):');
      lines.push('    heading = (heading + 135) % 360');
      lines.push('    print(f"วาดแฉกกังหัน {blade}/8 -> ทิศ {heading}°")');
    } else if (block.code === 'repeat_spiral:18') {
      lines.push(
        'colors = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#9333ea", "#eab308", "#ec4899", "#06b6d4"]'
      );
      lines.push('for s in range(18):');
      lines.push('    step_len = 10 + s * 4');
      lines.push('    pen_color = colors[s % len(colors)]');
      lines.push('    heading = (heading + 60) % 360');
      lines.push('    print(f"เส้นที่ {s + 1}: ยาว {step_len} สี {pen_color}")');
    } else if (block.code.startsWith('repeat:')) {
      const count = parseInt(block.code.split(':')[1], 10) || 4;
      const remaining = blocks.slice(i + 1);
      const loopActions: ScratchBlockExportInput[] = [];
      for (const sub of remaining) {
        const isLoopable =
          sub.code.startsWith('move:') ||
          sub.code.startsWith('turn:') ||
          sub.code.startsWith('point:') ||
          sub.code.startsWith('wait:') ||
          sub.code === 'next_costume' ||
          sub.code === 'random_color' ||
          sub.code.startsWith('set_size:');
        if (!isLoopable) break;
        loopActions.push(sub);
        if (loopActions.length >= 5) break;
      }

      lines.push(`for i in range(1, ${count + 1}):${cmt(`ทำซ้ำ ${count} รอบ`)}`);
      if (loopActions.length > 0) {
        for (const sub of loopActions) {
          lines.push(...formatPlaygroundBlock(sub, '    '));
        }
        i += loopActions.length;
      } else {
        const turnAngle = Number((360 / Math.max(1, count)).toFixed(1));
        const sideLength =
          count === 4 ? 80 : count >= 20 ? 12 : count >= 10 ? 25 : count >= 6 ? 50 : 75;
        lines.push(`    heading = (heading + ${turnAngle}) % 360`);
        lines.push(
          `    print(f"รอบที่ {i}/${count}: เดิน ${sideLength} ก้าว, หมุน ${turnAngle}° -> ทิศ {heading}°")`
        );
      }
    } else {
      lines.push(...formatPlaygroundBlock(block, ''));
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function exportMicrobitToPython(options: MicrobitPythonExportOptions): string {
  const mode: MicrobitPythonExportMode = options.mode ?? 'playground';
  const includeComments = options.includeComments ?? false;
  const temperature = Number.isFinite(options.temperature) ? Number(options.temperature) : 27;
  const lightLevel = Number.isFinite(options.lightLevel) ? Number(options.lightLevel) : 128;
  const counterValue = Number.isFinite(options.counterValue) ? Number(options.counterValue) : 0;
  const leds = options.leds;
  const useCustomLedMatrix = Boolean(options.useCustomLedMatrix && leds && leds.length === 5);

  const cmt = (th: string) => (includeComments ? `  # ${th}` : '');

  if (useCustomLedMatrix && leds) {
    if (mode === 'micropython') {
      const microRows = leds
        .map((row) => row.map((on) => (on ? '9' : '0')).join(''))
        .join(':');
      return [
        'from microbit import *',
        '',
        `custom_icon = Image("${microRows}")${cmt('ภาพไอคอน LED 5x5 ที่ออกแบบเอง')}`,
        'display.show(custom_icon)',
      ].join('\n');
    }
    return [
      `led_matrix = [${cmt('ตารางไฟ LED 5x5 (# = เปิด, . = ปิด)')}`,
      ...formatLedMatrixRows(leds).map((row, idx, arr) =>
        idx < arr.length - 1 ? `${row},` : row
      ),
      ']',
      '',
      'print("=== Micro:bit 5x5 Custom LED Matrix ===")',
      'for row in led_matrix:',
      '    print(row)',
    ].join('\n');
  }

  if (mode === 'micropython') {
    switch (options.presetId) {
      case 'heart':
        return [
          'from microbit import *',
          'import music',
          '',
          'while True:',
          '    if button_a.was_pressed():',
          `        display.show(Image.HEART)${cmt('แสดงหัวใจดวงโต')}`,
          '        music.pitch(523, 250)',
          '        sleep(300)',
          `        display.show(Image.HEART_SMALL)${cmt('สลับหัวใจดวงเล็ก')}`,
          '        music.pitch(659, 250)',
          '        sleep(300)',
          '        display.show(Image.HEART)',
        ].join('\n');

      case 'dice':
        return [
          'from microbit import *',
          'import random',
          'import music',
          '',
          'while True:',
          '    if accelerometer.was_gesture("shake"):',
          '        music.pitch(880, 150)',
          `        roll = random.randint(1, 6)${cmt('สุ่มแต้มลูกเต๋า 1-6')}`,
          '        display.show(roll)',
        ].join('\n');

      case 'tally':
        return [
          'from microbit import *',
          'import music',
          '',
          `count = ${counterValue}`,
          'display.show(count)',
          '',
          'while True:',
          '    if button_a.is_pressed() and button_b.is_pressed():',
          '        count = 0',
          '        display.show(count)',
          '        music.pitch(700, 250)',
          '        sleep(300)',
          '    elif button_a.was_pressed():',
          '        count += 1',
          '        display.show(count)',
          '        music.pitch(440, 150)',
          '    elif button_b.was_pressed():',
          '        if count > 0:',
          '            count -= 1',
          '        display.show(count)',
          '        music.pitch(330, 150)',
        ].join('\n');

      case 'temp':
        return [
          'from microbit import *',
          'import music',
          '',
          'while True:',
          `    temp = temperature()${cmt('อ่านค่าอุณหภูมิจากชิป Micro:bit')}`,
          '    if temp >= 32:',
          '        display.show(Image.SAD)',
          '        music.pitch(300, 500)',
          '    else:',
          '        display.show(temp)',
          '    sleep(1000)',
        ].join('\n');

      case 'rps':
      default:
        return [
          'from microbit import *',
          'import random',
          'import music',
          '',
          'while True:',
          '    if accelerometer.was_gesture("shake"):',
          '        music.pitch(880, 150)',
          '        tool = random.randint(1, 3)',
          '        if tool == 1:',
          `            display.show(Image.SQUARE)${cmt('ค้อน')}`,
          '        elif tool == 2:',
          `            display.show(Image.SQUARE_SMALL)${cmt('กระดาษ')}`,
          '        else:',
          `            display.show(Image.SCISSORS)${cmt('กรรไกร')}`,
        ].join('\n');
    }
  }

  // Default mode: 'playground' -> 100% pure runnable Python 3 for JuniorCodePlayground
  switch (options.presetId) {
    case 'heart':
      return [
        `big_heart = [${cmt('ไอคอนหัวใจดวงโต 5x5')}`,
        '    ". # . # .",',
        '    "# # # # #",',
        '    "# # # # #",',
        '    ". # # # .",',
        '    ". . # . ."',
        ']',
        `small_heart = [${cmt('ไอคอนหัวใจดวงเล็ก 5x5')}`,
        '    ". . . . .",',
        '    ". # . # .",',
        '    ". # # # .",',
        '    ". . # . .",',
        '    ". . . . ."',
        ']',
        '',
        'for beat in range(1, 3):',
        '    print(f"💓 จังหวะที่ {beat}: แสดงหัวใจโต (โน้ต C5 = 523 Hz)")',
        '    for row in big_heart:',
        '        print(row)',
        '    print("💓 สลับหัวใจเล็ก (โน้ต E5 = 659 Hz)")',
        '    for row in small_heart:',
        '        print(row)',
      ].join('\n');

    case 'dice':
      return [
        'import random',
        '',
        `roll = random.randint(1, 6)${cmt('สุ่มแต้มลูกเต๋า 1 ถึง 6 เมื่อเขย่าบอร์ด')}`,
        'print("📳 เขย่าบอร์ด Micro:bit! เล่นเสียงปี๊บ 880 Hz")',
        'print(f"🎲 แต้มลูกเต๋าที่สุ่มได้ = {roll}")',
      ].join('\n');

    case 'tally':
      return [
        `count = ${counterValue}${cmt('ค่าตัวนับเริ่มต้น')}`,
        'button_events = ["A", "A", "B", "A", "AB"]',
        'print("ค่าเริ่มต้นตัวนับ:", count)',
        '',
        'for btn in button_events:',
        '    if btn == "A":',
        '        count += 1',
        '        print(f"กดปุ่ม A (+1) -> count = {count}")',
        '    elif btn == "B":',
        '        if count > 0:',
        '            count -= 1',
        '        print(f"กดปุ่ม B (-1) -> count = {count}")',
        '    elif btn == "AB":',
        '        count = 0',
        '        print("กดปุ่ม A+B -> รีเซ็ต count = 0")',
      ].join('\n');

    case 'temp':
      return [
        `temp = ${temperature}${cmt('ค่าจากเซ็นเซอร์อุณหภูมิ (°C)')}`,
        `light_level = ${lightLevel}${cmt('ค่าความสว่าง (0-255)')}`,
        'print(f"🌡️ อุณหภูมิที่อ่านได้ = {temp} °C")',
        'print(f"☀️ ระดับความสว่าง = {light_level} / 255")',
        '',
        'if temp >= 32:',
        '    print("⚠️ แจ้งเตือน: อุณหภูมิสูงเกินเกณฑ์! แสดงไอคอน Sad :( และส่งเสียง 300 Hz")',
        'else:',
        '    print(f"✅ อุณหภูมิปกติ: แสดงตัวเลข {temp} °C บนหน้าจอ LED")',
        '',
        'if light_level < 50:',
        '    print("💡 แสงน้อยกว่า 50 -> เปิดไฟส่องสว่างอัตโนมัติ")',
      ].join('\n');

    case 'rps':
    default:
      return [
        'import random',
        '',
        'print("📳 เขย่าบอร์ด Micro:bit เพื่อเล่นเป่ายิ้งฉุบ...")',
        `tool = random.randint(1, 3)${cmt('1=ค้อน, 2=กระดาษ, 3=กรรไกร')}`,
        'if tool == 1:',
        '    print("✊ ออก: ค้อน (Rock)")',
        'elif tool == 2:',
        '    print("✋ ออก: กระดาษ (Paper)")',
        'else:',
        '    print("✌️ ออก: กรรไกร (Scissors)")',
      ].join('\n');
  }
}
