import { describe, expect, it } from 'vitest';
import {
  buildFlowchartPythonLines,
  CANVAS_GRID_SIZE,
  decodeShareableFlowchart,
  DEFAULT_FLOWCHART_SIM_INPUTS,
  encodeShareableFlowchart,
  ensureNodeCoordinates,
  evaluateFlowchartTrace,
  FLOWCHART_TEMPLATES,
  parseImportedFlowchartJson,
  snapCoordinate,
  type EditorNode,
} from '../flowchartUtils.ts';

describe('flowchartUtils', () => {
  it('snaps coordinates to 24px grid when enabled and rounds cleanly when disabled', () => {
    expect(snapCoordinate(25, true)).toBe(CANVAS_GRID_SIZE);
    expect(snapCoordinate(37, true)).toBe(CANVAS_GRID_SIZE * 2);
    expect(snapCoordinate(29.6, false)).toBe(30);

    const laidOut = ensureNodeCoordinates(
      [
        { uid: '1', kind: 'start', label: 'เริ่มต้น', x: 101, y: 23 },
        { uid: '2', kind: 'end', label: 'จบ' },
      ],
      true
    );
    expect(laidOut[0].x! % CANVAS_GRID_SIZE).toBe(0);
    expect(laidOut[0].y! % CANVAS_GRID_SIZE).toBe(0);
    expect(laidOut[1].y!).toBeGreaterThan(laidOut[0].y!);
  });

  it('roundtrips Thai flowchart payloads via URL share encoding', () => {
    const encoded = encodeShareableFlowchart({
      v: 1,
      m: 'mission_door',
      t: 'tpl_selection',
      d: 'visual',
      g: 1,
      n: [
        { k: 'start', l: 'เริ่มต้นระบบ', x: 192, y: 24 },
        {
          k: 'decision',
          l: 'คะแนน >= 50?',
          ta: 'สอบผ่าน 🎉',
          fa: 'ลองใหม่ 💪',
          x: 192,
          y: 168,
        },
        { k: 'end', l: 'จบ', x: 192, y: 384 },
      ],
    });

    const decoded = decodeShareableFlowchart(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.missionId).toBe('mission_door');
    expect(decoded?.templateId).toBe('tpl_selection');
    expect(decoded?.nodes).toHaveLength(3);
    expect(decoded?.nodes[1].trueAction).toBe('สอบผ่าน 🎉');
    expect(decoded?.nodes[1].falseAction).toBe('ลองใหม่ 💪');
  });

  it('parses exported JSON files and rejects invalid JSON safely', () => {
    const exportPayload = JSON.stringify({
      app: 'FlowchartGuideEditor',
      version: '1.0',
      missionId: 'mission_free',
      templateId: 'tpl_ipo',
      snapToGrid: true,
      nodes: [
        { step: 1, kind: 'start', label: 'Start', position: { x: 192, y: 24 } },
        { step: 2, kind: 'input', label: 'รับค่าตัวเลข A และ B' },
        { step: 3, kind: 'invalid_kind', label: 'Should be skipped' },
        { step: 4, kind: 'end', label: 'End' },
      ],
    });

    const parsed = parseImportedFlowchartJson(exportPayload);
    expect(parsed).not.toBeNull();
    expect(parsed?.nodes).toHaveLength(3);
    expect(parsed?.templateId).toBe('tpl_ipo');
    expect(parseImportedFlowchartJson('{not valid json')).toBeNull();
    expect(parseImportedFlowchartJson('{"nodes": []}')).toBeNull();
  });

  it('generates nested loop Python code for the Nested Loop Pattern template', () => {
    const nestedTpl = FLOWCHART_TEMPLATES.find((t) => t.id === 'tpl_nested_loop')!;
    const nodes: EditorNode[] = nestedTpl.nodes.map((n, i) => ({
      ...n,
      uid: `n_${i}`,
    }));
    const lines = buildFlowchartPythonLines(nodes, false).map((l) => l.text);
    const code = lines.join('\n');

    expect(code).toContain('while row <= 3:');
    expect(code).toContain('while col <= 4:');
    expect(code).toContain('print("★", end=" ")');
    expect(code).toContain('col += 1');
    expect(code).toContain('row += 1');
  });

  it('dynamically evaluates True/False decision branches based on test inputs', () => {
    const nodes: EditorNode[] = [
      { uid: '1', kind: 'start', label: 'เริ่ม' },
      { uid: '2', kind: 'input', label: 'รับค่าคะแนนสอบ (score)' },
      {
        uid: '3',
        kind: 'decision',
        label: 'คะแนน >= 50 หรือไม่?',
        trueAction: 'แสดง: สอบผ่าน',
        falseAction: 'แสดง: ไม่ผ่าน',
      },
      { uid: '4', kind: 'output', label: 'แสดงผลคะแนน' },
      { uid: '5', kind: 'end', label: 'จบ' },
    ];

    const passTrace = evaluateFlowchartTrace(nodes, {
      ...DEFAULT_FLOWCHART_SIM_INPUTS,
      score: 82,
    });
    expect(passTrace.detectedInputKeys).toContain('score');
    expect(passTrace.stepResults[2].branch).toBe('true');

    const failTrace = evaluateFlowchartTrace(nodes, {
      ...DEFAULT_FLOWCHART_SIM_INPUTS,
      score: 35,
    });
    expect(failTrace.stepResults[2].branch).toBe('false');
  });
});
