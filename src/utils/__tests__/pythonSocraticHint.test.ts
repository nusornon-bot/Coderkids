import { describe, it, expect } from 'vitest';
import { generateSocraticCodeHint } from '../pythonSocraticHint';

describe('generateSocraticCodeHint', () => {
  it('detects missing colon on Python if/for/while statements', () => {
    const result = generateSocraticCodeHint('score = 80\nif score >= 50\n    print("Pass")', 'SyntaxError');
    expect(result.errorCategory).toContain('ทวิภาค');
    expect(result.headline).toContain('บรรทัดที่ 2');
  });

  it('detects unmatched parentheses', () => {
    const result = generateSocraticCodeHint('print("Hello Coder Kids"', 'SyntaxError');
    expect(result.errorCategory).toContain('วงเล็บ');
    expect(result.stepByStepHints.some((h) => h.includes('เกินมา'))).toBe(true);
  });

  it('detects unclosed string quotes', () => {
    const result = generateSocraticCodeHint('name = "Coder\nprint(name)', 'SyntaxError');
    expect(result.errorCategory).toContain('คำพูด');
    expect(result.headline).toContain('บรรทัดที่ 1');
  });

  it('detects single = instead of == inside if condition', () => {
    const result = generateSocraticCodeHint('x = 5\nif x = 5:\n    print(x)', 'SyntaxError');
    expect(result.errorCategory).toContain('==');
    expect(result.headline).toContain('บรรทัดที่ 2');
  });

  it('detects ZeroDivisionError', () => {
    const result = generateSocraticCodeHint('a = 10 / 0\nprint(a)', 'ZeroDivisionError: division by zero');
    expect(result.errorCategory).toContain('ZeroDivisionError');
  });

  it('detects NameError / undefined variable', () => {
    const result = generateSocraticCodeHint('print(myScore)', 'NameError: name "myScore" is not defined');
    expect(result.errorCategory).toContain('NameError');
  });

  it('returns constructive Socratic coaching when code has no errors', () => {
    const result = generateSocraticCodeHint('for i in range(3):\n    print(i)', '');
    expect(result.errorCategory).toContain('Code Coach');
    expect(result.stepByStepHints.length).toBeGreaterThan(0);
  });
});
