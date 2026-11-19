export interface SocraticHintResult {
  errorCategory: string;
  headline: string;
  socraticQuestion: string;
  stepByStepHints: string[];
  checkSnippet?: string;
}

/**
 * Analyzes student Python/JS code and runtime/syntax error output to produce
 * a friendly, scaffolding Socratic hint in Thai (no direct copy-paste answer dump)
 * tailored for Grade 4-6 learners (มาตรฐาน ว 4.2).
 */
export function generateSocraticCodeHint(
  code: string,
  errorOutput: string,
  language: 'python' | 'javascript' = 'python'
): SocraticHintResult {
  const err = (errorOutput || '').trim();
  const lines = (code || '').split('\n');

  // 1. Check for missing colon on Python if / for / while / def / else / elif
  if (language === 'python') {
    const missingColonIdx = lines.findIndex((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return false;
      return /^(if|elif|else|for|while|def)\b/.test(trimmed) && !trimmed.endsWith(':');
    });
    if (missingColonIdx !== -1) {
      return {
        errorCategory: 'SyntaxError (ลืมเครื่องหมายทวิภาค :)',
        headline: `เอ๊ะ! ลองสังเกตที่บรรทัดที่ ${missingColonIdx + 1} ดูหน่อยนะ`,
        socraticQuestion:
          'ในภาษา Python เมื่อเราเขียนคำสั่งเงื่อนไข (if/else) หรือวนซ้ำ (for/while) ตอนท้ายบรรทัดต้องปิดด้วยเครื่องหมายอะไรเอ่ย?',
        stepByStepHints: [
          `มองไปที่ท้ายบรรทัดที่ ${missingColonIdx + 1}: "${lines[missingColonIdx].trim()}"`,
          'ภาษา Python ต้องมีเครื่องหมายทวิภาค ( : ) ปิดท้ายหัวข้อ if / elif / else / for / while เสมอ',
          'ลองเติม : ไว้ท้ายบรรทัดนั้น แล้วกดรันใหม่อีกครั้งดูสิ!',
        ],
        checkSnippet: 'ตัวอย่างโครงสร้าง: if score >= 50:',
      };
    }

    // 2. Check for unmatched quotes or parentheses
    let openParens = 0;
    for (const ch of code) {
      if (ch === '(') openParens++;
      if (ch === ')') openParens--;
    }
    if (openParens !== 0) {
      return {
        errorCategory: 'SyntaxError (วงเล็บเปิด-ปิดไม่ครบคู่)',
        headline: 'วงเล็บเปิด "(" กับวงเล็บปิด ")" มีจำนวนไม่เท่ากันนะ!',
        socraticQuestion:
          'ลองนับวงเล็บเปิด "(" และวงเล็บปิด ")" ในคำสั่ง print(...) หรือสูตรคำนวณดูสิว่าขาดตัวไหนไป?',
        stepByStepHints: [
          openParens > 0
            ? `ตอนนี้มีวงเล็บเปิดเกินมา ${openParens} ตัว ลองหาวงเล็บปิด ")" ที่หายไป`
            : `ตอนนี้มีวงเล็บปิดเกินมา ${Math.abs(openParens)} ตัว ลองลบตัวที่เกินออก`,
          'ทุกครั้งที่พิมพ์ print( ให้รีบเช็กว่ามี ) ปิดท้ายข้อความหรือตัวแปรครบคู่',
        ],
        checkSnippet: 'ตัวอย่าง: print("สวัสดี Coder Kids!")',
      };
    }

    // Check unclosed double/single quotes on a line
    const badQuoteIdx = lines.findIndex((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return false;
      const dq = (trimmed.match(/"/g) || []).length;
      const sq = (trimmed.match(/'/g) || []).length;
      return dq % 2 !== 0 || sq % 2 !== 0;
    });
    if (badQuoteIdx !== -1) {
      return {
        errorCategory: 'SyntaxError (เครื่องหมายคำพูดไม่ครบคู่)',
        headline: `บรรทัดที่ ${badQuoteIdx + 1} เหมือนจะมีเครื่องหมายคำพูดเปิดไว้แต่ยังไม่ปิดนะ!`,
        socraticQuestion:
          'ข้อความ (String) ใน Python ต้องมีเครื่องหมายคำพูด "..." หรือ \'...\' ครอบไว้ทั้งด้านหน้าและด้านหลังใช่ไหมเอ่ย?',
        stepByStepHints: [
          `ตรวจดูบรรทัดที่ ${badQuoteIdx + 1}: "${lines[badQuoteIdx].trim()}"`,
          'สังเกตว่าเปิดด้วย " ก็ต้องปิดด้วย " (หรือเปิดด้วย \' ก็ปิดด้วย \')',
          'เติมเครื่องหมายคำพูดที่หายไปแล้วลองรันใหม่เลย!',
        ],
      };
    }

    // 3. Check single '=' inside if condition instead of '=='
    const singleEqIfIdx = lines.findIndex((line) => {
      const trimmed = line.trim();
      return /^(if|elif)\s+[^=!<>]+=\s*[^=]/.test(trimmed);
    });
    if (singleEqIfIdx !== -1) {
      return {
        errorCategory: 'Logic / Syntax (ใช้ = แทน == ในเงื่อนไข)',
        headline: `ดูบรรทัดที่ ${singleEqIfIdx + 1} สิ! ในเงื่อนไข if เราใช้ "=" หรือ "==" กันนะ?`,
        socraticQuestion:
          'รู้ไหมว่า "=" ตัวเดียวแปลว่ากำหนดค่าให้ตัวแปร แล้วถ้าอยาก "เปรียบเทียบว่าเท่ากันหรือไม่" ต้องใช้เครื่องหมายอะไร?',
        stepByStepHints: [
          'เครื่องหมาย = (1 ตัว) ใช้เก็บค่า เช่น score = 10',
          'เครื่องหมาย == (2 ตัว) ใช้เปรียบเทียบใน if เช่น if score == 10:',
          `ลองเปลี่ยน = เป็น == ในบรรทัดที่ ${singleEqIfIdx + 1} แล้วทดสอบดูนะ`,
        ],
      };
    }
  }

  // 4. Runtime / error message pattern matching
  const lowerErr = err.toLowerCase();
  if (lowerErr.includes('zerodivision') || /\/\s*0\b/.test(code)) {
    return {
      errorCategory: 'ZeroDivisionError (หารด้วยศูนย์ไม่ได้)',
      headline: 'คอมพิวเตอร์คำนวณการหารด้วยเลข 0 ไม่ได้นะ!',
      socraticQuestion:
        'ในคณิตศาสตร์ ถ้าเราแบ่งขนมให้เพื่อน 0 คน จะแบ่งได้ไหม? ลองตรวจดูตัวหารในโค้ดของน้องสิว่ามีค่าเป็น 0 อยู่หรือเปล่า',
      stepByStepHints: [
        'ตรวจสอบเครื่องหมายหาร (/) ในโค้ดของคุณว่าตัวเลขหรือตัวแปรด้านหลังเป็น 0 หรือไม่',
        'ใช้เงื่อนไข if ตัวหาร != 0: ดักไว้ก่อนทำการหารจะช่วยป้องกันโปรแกรมพังได้!',
      ],
    };
  }

  if (
    lowerErr.includes('not defined') ||
    lowerErr.includes('nameerror') ||
    lowerErr.includes('referenceerror')
  ) {
    return {
      errorCategory: 'NameError (ไม่รู้จักชื่อตัวแปรหรือคำสั่ง)',
      headline: 'คอมพิวเตอร์หาชื่อตัวแปรหรือคำสั่งนี้ไม่เจอ!',
      socraticQuestion:
        'น้องได้ประกาศ/กำหนดค่าให้ตัวแปรนี้ไว้บรรทัดด้านบนก่อนนำมาใช้หรือยัง? และสะกดตัวพิมพ์เล็ก-พิมพ์ใหญ่ตรงกันเป๊ะไหม?',
      stepByStepHints: [
        'ชื่อตัวแปรในโค้ดแยกตัวพิมพ์เล็ก-ใหญ่ เช่น score กับ Score ถือเป็นคนละตัวกัน',
        'ตรวจสอบว่ากำหนดค่าตัวแปร (เช่น score = 0) ไว้ก่อนบรรทัดที่เรียกใช้งานแล้ว',
        'ตรวจคำสะกดของคำสั่งพื้นฐาน เช่น print(...) หรือ range(...)',
      ],
    };
  }

  if (lowerErr.includes('indent') || lowerErr.includes('indentation')) {
    return {
      errorCategory: 'IndentationError (การเยื้องย่อหน้าไม่สม่ำเสมอ)',
      headline: 'เรื่องการเว้นวรรคย่อหน้า (Indentation) สำคัญมากในภาษา Python!',
      socraticQuestion:
        'คำสั่งที่อยู่ข้างใน if หรือ for ต้องขยับเว้นวรรคเข้าไปด้านขวาเท่าๆ กันกี่ช่องเอ่ย?',
      stepByStepHints: [
        'หลังบรรทัดที่มีเครื่องหมาย : (เช่น if ...: หรือ for ...:) บรรทัดถัดไปต้องเว้นวรรคเข้าไป 2 หรือ 4 ช่องให้เท่ากันทุกบรรทัด',
        'อย่าผสมการกด Tab กับ Space ปนกันในบล็อกเดียวกัน',
      ],
    };
  }

  if (err) {
    return {
      errorCategory: 'Debugging Check (ตรวจหาบั๊กทีละขั้น)',
      headline: 'เจอจุดผิดพลาดเล็กน้อย มาเป็นนักสืบหาบั๊ก (Debugger) กัน!',
      socraticQuestion:
        'จากข้อความแจ้งเตือนด้านล่าง น้องคิดว่าเป็นปัญหาที่ "การสะกดคำสั่ง/สัญลักษณ์" หรือ "ลำดับการทำงานของตัวแปร" มากกว่ากัน?',
      stepByStepHints: [
        `อ่านข้อความแจ้งเตือนให้ชัด: "${err.slice(0, 140)}"`,
        'ลองเช็กบรรทัดที่เพิ่งแก้ไขล่าสุดว่าสะกดคำสั่ง, เครื่องหมาย : , วงเล็บ () และเครื่องหมายคำพูด "" ครบไหม',
        'ลองใส่ print("เช็กจุดที่ 1") เพื่อดูว่าโปรแกรมรันมาถึงบรรทัดไหนแล้ว',
      ],
    };
  }

  // 5. No error — constructive Socratic coaching
  return {
    errorCategory: 'Code Coach (ชวนคิดต่อยอดโค้ด)',
    headline: 'โค้ดของคุณดูเรียบร้อย ไม่มี Syntax Error ที่ชัดเจนแล้ว!',
    socraticQuestion:
      'ถ้าเราลองเปลี่ยนค่าตัวแปรเริ่มต้น หรือเพิ่มเงื่อนไข if-else ใหม่ ผลลัพธ์ในหน้าจอ Output จะเปลี่ยนไปอย่างไรนะ?',
    stepByStepHints: [
      'ลองทำนายผลลัพธ์ในใจก่อนกดปุ่ม "รันโค้ด" แล้วเทียบกับผลลัพธ์จริง (ทักษะ Trace & Predict)',
      'ลองเพิ่มตัวแปรใหม่หรือใช้ลูป for i in range(5): เพื่อลดการเขียนคำสั่ง print ซ้ำๆ',
      'อย่าลืมกดปุ่ม "บันทึก Cloud" เพื่อเก็บผลงานไว้เปิดดูรอบหน้าด้วยนะ!',
    ],
  };
}
