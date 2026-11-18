import { describe, expect, it } from 'vitest';
import { runPythonCode } from '../pythonRunner.ts';
import {
  buildFlowchartPythonLines,
  FLOWCHART_TEMPLATES,
  type EditorNode,
} from '../../components/Module2Thinking/flowchartUtils.ts';

describe('runPythonCode sandbox interpreter', () => {
  it('executes multiplication table for-loop with f-strings', () => {
    const code = `
number = 3
for i in range(1, 4):
    result = number * i
    print(f"{number} x {i} = {result}")
`;
    const res = runPythonCode(code);
    expect(res.ok).toBe(true);
    expect(res.output).toBe('3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9');
  });

  it('executes if / elif / else grading logic', () => {
    const code = `
score = 74
if score >= 80:
    grade = "4"
elif score >= 70:
    grade = "3"
else:
    grade = "1"
print("เกรด", grade)
`;
    const res = runPythonCode(code);
    expect(res.ok).toBe(true);
    expect(res.output).toBe('เกรด 3');
  });

  it('executes nested while loops generated from Nested Loop Pattern flowchart', () => {
    const nestedTpl = FLOWCHART_TEMPLATES.find((t) => t.id === 'tpl_nested_loop')!;
    const nodes: EditorNode[] = nestedTpl.nodes.map((n, i) => ({
      ...n,
      uid: `n_${i}`,
    }));
    const generatedCode = buildFlowchartPythonLines(nodes, false)
      .map((l) => l.text)
      .join('\n');

    const res = runPythonCode(generatedCode);
    expect(res.ok).toBe(true);
    expect(res.lines[0]).toBe('★ ★ ★ ★ ');
    expect(res.lines[1]).toBe('★ ★ ★ ★ ');
    expect(res.lines[2]).toBe('★ ★ ★ ★ ');
  });

  it('supports bin(), slicing, .zfill(), and list summation', () => {
    const code = `
decimal_num = 25
binary_str = bin(decimal_num)[2:].zfill(8)
print(binary_str)
cart = [10, 20, 30]
total = 0
for p in cart:
    total += p
print(total, len(cart))
`;
    const res = runPythonCode(code);
    expect(res.ok).toBe(true);
    expect(res.lines).toEqual(['00011001', '60 3']);
  });

  it('protects against infinite while loops and reports Thai error diagnostics', () => {
    const infiniteCode = `
count = 1
while count <= 5:
    print("stuck")
`;
    const res = runPythonCode(infiniteCode, { maxLoopIterations: 20 });
    expect(res.ok).toBe(false);
    expect(res.errorMessage).toContain('วนซ้ำเกิน 20 รอบ');
  });
});
