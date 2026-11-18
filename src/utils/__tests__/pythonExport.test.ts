import { describe, it, expect } from 'vitest';
import {
  exportScratchBlocksToPython,
  exportMicrobitToPython,
  ScratchBlockExportInput,
} from '../pythonExport.ts';
import { runPythonCode } from '../pythonRunner.ts';

describe('pythonExport & Junior Code Playground compatibility', () => {
  it('exports clean raw Scratch geometry blocks and executes them cleanly in runPythonCode', () => {
    const blocks: ScratchBlockExportInput[] = [
      { id: '1', category: 'events', name: 'เมื่อคลิก ธงเขียว', code: 'start' },
      { id: '2', category: 'pen', name: 'จรดปากกา', code: 'pen_down' },
      { id: '3', category: 'control', name: 'ทำซ้ำ (4) รอบ', code: 'repeat:4' },
      { id: '4', category: 'looks', name: 'พูดว่า', code: 'say:วาดสี่เหลี่ยมสำเร็จ' },
    ];

    const rawCode = exportScratchBlocksToPython(blocks, {
      mode: 'playground',
      includeComments: false,
    });

    expect(rawCode).not.toContain('# เมื่อคลิก');
    expect(rawCode).toContain('for i in range(1, 5):');

    const res = runPythonCode(rawCode);
    expect(res.ok).toBe(true);
    expect(res.output).toContain('รอบที่ 4/4');
    expect(res.output).toContain('วาดสี่เหลี่ยมสำเร็จ');
  });

  it('exports Scratch logic & math blocks (BMI, LCM, Even/Odd, Broadcast) and runs them in Python sandbox', () => {
    const lcmBlocks: ScratchBlockExportInput[] = [
      { id: '1', category: 'variables', name: 'อ่านค่า A, B', code: 'var_read_ab' },
      { id: '2', category: 'variables', name: 'หา ค.ร.น.', code: 'var_lcm_loop' },
    ];
    const lcmCode = exportScratchBlocksToPython(lcmBlocks, {
      mode: 'playground',
      inputValA: 12,
      inputValB: 18,
    });
    const lcmRes = runPythonCode(lcmCode);
    expect(lcmRes.ok).toBe(true);
    expect(lcmRes.output).toContain('ค.ร.น. (LCM) = 36');

    const bmiBlocks: ScratchBlockExportInput[] = [
      { id: '1', category: 'variables', name: 'อ่านค่า A, B', code: 'var_read_ab' },
      { id: '2', category: 'variables', name: 'ตรวจความสมส่วน', code: 'var_bmi_check' },
      { id: '3', category: 'variables', name: 'Broadcast', code: 'broadcast:ผ่านเกณฑ์' },
    ];
    const bmiCode = exportScratchBlocksToPython(bmiBlocks, {
      mode: 'playground',
      inputValA: 45,
      inputValB: 150,
    });
    const bmiRes = runPythonCode(bmiCode);
    expect(bmiRes.ok).toBe(true);
    expect(bmiRes.output).toContain('BMI = 20');
    expect(bmiRes.output).toContain('หุ่นยนต์ได้รับสาร: ผ่านเกณฑ์');
  });

  it('exports Scratch blocks in turtle mode when requested', () => {
    const blocks: ScratchBlockExportInput[] = [
      { id: '1', category: 'pen', name: 'จรดปากกา', code: 'pen_down' },
      { id: '2', category: 'control', name: 'ทำซ้ำ (4) รอบ', code: 'repeat:4' },
    ];
    const turtleCode = exportScratchBlocksToPython(blocks, {
      mode: 'turtle',
      includeComments: false,
    });
    expect(turtleCode).toContain('import turtle');
    expect(turtleCode).toContain('t = turtle.Turtle()');
    expect(turtleCode).toContain('turtle.done()');
  });

  it('exports all Micro:bit presets as clean runnable Python 3 scripts for Junior Code Playground', () => {
    const presets = ['heart', 'dice', 'tally', 'temp', 'rps'];
    for (const presetId of presets) {
      const code = exportMicrobitToPython({
        presetId,
        mode: 'playground',
        includeComments: false,
        temperature: 35,
        lightLevel: 40,
        counterValue: 2,
      });
      expect(code).not.toContain('  # ');
      const res = runPythonCode(code);
      expect(res.ok).toBe(true);
      expect(res.lines.length).toBeGreaterThan(0);
    }

    const tempCode = exportMicrobitToPython({
      presetId: 'temp',
      mode: 'playground',
      temperature: 36,
      lightLevel: 30,
    });
    const tempRes = runPythonCode(tempCode);
    expect(tempRes.ok).toBe(true);
    expect(tempRes.output).toContain('แจ้งเตือน: อุณหภูมิสูงเกินเกณฑ์');
    expect(tempRes.output).toContain('เปิดไฟส่องสว่างอัตโนมัติ');
  });

  it('exports custom Micro:bit 5x5 LED matrix and MicroPython hardware scripts cleanly', () => {
    const customLeds = [
      [true, false, false, false, true],
      [false, true, false, true, false],
      [false, false, true, false, false],
      [false, true, false, true, false],
      [true, false, false, false, true],
    ];
    const customPlayground = exportMicrobitToPython({
      presetId: 'heart',
      mode: 'playground',
      leds: customLeds,
      useCustomLedMatrix: true,
    });
    const customRes = runPythonCode(customPlayground);
    expect(customRes.ok).toBe(true);
    expect(customRes.output).toContain('# . . . #');

    const microPy = exportMicrobitToPython({
      presetId: 'heart',
      mode: 'micropython',
      leds: customLeds,
      useCustomLedMatrix: true,
    });
    expect(microPy).toContain('from microbit import *');
    expect(microPy).toContain('Image("90009:09090:00900:09090:90009")');
  });
});
