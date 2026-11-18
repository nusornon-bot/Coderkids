/**
 * Pure, sandboxed Python 3 educational interpreter for Coder Kids (ป.4–ป.6).
 * Executes a safe subset of Python without eval() or new Function():
 * - Comments, variable assignments (+=, -=, *=)
 * - Numbers, strings, booleans, lists, arithmetic, comparisons, boolean ops, ternary
 * - f-strings f"...{expr}..."
 * - Built-ins: print(..., end=...), input(...), int(), float(), str(), len(), abs(), round(), range(), bin(), random.randint()
 * - String slicing [a:b] and .zfill()/.upper()/.lower()/.strip()
 * - if / elif / else, for ... in ..., while ... (guarded by maxLoopIterations)
 */

export interface PythonRunOptions {
  inputs?: string[];
  maxLoopIterations?: number;
  maxSteps?: number;
}

export interface PythonRunResult {
  ok: boolean;
  output: string;
  lines: string[];
  errorLine?: number;
  errorMessage?: string;
  stepsExecuted: number;
}

type PyValue = number | string | boolean | null | PyValue[];

class PythonRuntimeError extends Error {
  lineNumber: number;
  constructor(message: string, lineNumber: number) {
    super(message);
    this.lineNumber = lineNumber;
  }
}

interface ParsedLine {
  lineNumber: number;
  indent: number;
  raw: string;
}

type AstNode =
  | { type: 'assign'; line: number; name: string; op: '=' | '+=' | '-=' | '*='; expr: string }
  | { type: 'expr'; line: number; expr: string }
  | { type: 'import'; line: number }
  | { type: 'pass'; line: number }
  | {
      type: 'if';
      line: number;
      branches: Array<{ cond: string | null; body: AstNode[]; line: number }>;
    }
  | { type: 'for'; line: number; varName: string; iterExpr: string; body: AstNode[] }
  | { type: 'while'; line: number; cond: string; body: AstNode[] };

function stripInlineComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === '#' && !inSingle && !inDouble) {
      return line.slice(0, i);
    }
  }
  return line;
}

function preprocessLines(code: string): ParsedLine[] {
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  const result: ParsedLine[] = [];

  for (let idx = 0; idx < rawLines.length; idx++) {
    const rawWithoutComment = stripInlineComment(rawLines[idx]);
    const trimmed = rawWithoutComment.trim();
    if (!trimmed) continue;

    const leadingMatch = rawWithoutComment.match(/^([ \t]*)/);
    const leading = leadingMatch ? leadingMatch[1].replace(/\t/g, '    ') : '';
    result.push({
      lineNumber: idx + 1,
      indent: leading.length,
      raw: trimmed,
    });
  }

  return result;
}

function parseBlock(
  lines: ParsedLine[],
  startIdx: number,
  expectedIndent: number
): { nodes: AstNode[]; nextIdx: number } {
  const nodes: AstNode[] = [];
  let i = startIdx;

  while (i < lines.length) {
    const cur = lines[i];
    if (cur.indent < expectedIndent) {
      break;
    }
    if (cur.indent > expectedIndent) {
      throw new PythonRuntimeError(
        `การเยื้องบรรทัด (Indentation) ไม่สอดคล้องกันที่บรรทัด ${cur.lineNumber}`,
        cur.lineNumber
      );
    }

    const text = cur.raw;

    if (text.startsWith('elif ') || text.startsWith('else:') || text === 'else :') {
      break;
    }

    if (/^(import\s+|from\s+)/.test(text)) {
      nodes.push({ type: 'import', line: cur.lineNumber });
      i += 1;
      continue;
    }

    if (text === 'pass') {
      nodes.push({ type: 'pass', line: cur.lineNumber });
      i += 1;
      continue;
    }

    if (text.startsWith('if ') && text.endsWith(':')) {
      const branches: Array<{ cond: string | null; body: AstNode[]; line: number }> = [];
      const firstCond = text.slice(3, -1).trim();
      i += 1;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PythonRuntimeError(
          `หลังคำสั่ง if ต้องมีคำสั่งเยื้องเข้าไปในบล็อก (บรรทัด ${cur.lineNumber})`,
          cur.lineNumber
        );
      }
      const childIndent = lines[i].indent;
      const firstBody = parseBlock(lines, i, childIndent);
      branches.push({ cond: firstCond, body: firstBody.nodes, line: cur.lineNumber });
      i = firstBody.nextIdx;

      while (i < lines.length && lines[i].indent === expectedIndent) {
        const nextText = lines[i].raw;
        if (nextText.startsWith('elif ') && nextText.endsWith(':')) {
          const elifLine = lines[i].lineNumber;
          const elifCond = nextText.slice(5, -1).trim();
          i += 1;
          if (i >= lines.length || lines[i].indent <= expectedIndent) {
            throw new PythonRuntimeError(
              `หลังคำสั่ง elif ต้องมีคำสั่งเยื้องเข้าไปในบล็อก (บรรทัด ${elifLine})`,
              elifLine
            );
          }
          const elifBody = parseBlock(lines, i, lines[i].indent);
          branches.push({ cond: elifCond, body: elifBody.nodes, line: elifLine });
          i = elifBody.nextIdx;
        } else if (/^else\s*:$/.test(nextText)) {
          const elseLine = lines[i].lineNumber;
          i += 1;
          if (i >= lines.length || lines[i].indent <= expectedIndent) {
            throw new PythonRuntimeError(
              `หลังคำสั่ง else: ต้องมีคำสั่งเยื้องเข้าไปในบล็อก (บรรทัด ${elseLine})`,
              elseLine
            );
          }
          const elseBody = parseBlock(lines, i, lines[i].indent);
          branches.push({ cond: null, body: elseBody.nodes, line: elseLine });
          i = elseBody.nextIdx;
          break;
        } else {
          break;
        }
      }

      nodes.push({ type: 'if', line: cur.lineNumber, branches });
      continue;
    }

    const forMatch = text.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+):$/);
    if (forMatch) {
      i += 1;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PythonRuntimeError(
          `หลังคำสั่ง for ต้องมีคำสั่งเยื้องเข้าไปในลูป (บรรทัด ${cur.lineNumber})`,
          cur.lineNumber
        );
      }
      const bodyRes = parseBlock(lines, i, lines[i].indent);
      nodes.push({
        type: 'for',
        line: cur.lineNumber,
        varName: forMatch[1],
        iterExpr: forMatch[2].trim(),
        body: bodyRes.nodes,
      });
      i = bodyRes.nextIdx;
      continue;
    }

    if (text.startsWith('while ') && text.endsWith(':')) {
      const cond = text.slice(6, -1).trim();
      i += 1;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PythonRuntimeError(
          `หลังคำสั่ง while ต้องมีคำสั่งเยื้องเข้าไปในลูป (บรรทัด ${cur.lineNumber})`,
          cur.lineNumber
        );
      }
      const bodyRes = parseBlock(lines, i, lines[i].indent);
      nodes.push({
        type: 'while',
        line: cur.lineNumber,
        cond,
        body: bodyRes.nodes,
      });
      i = bodyRes.nextIdx;
      continue;
    }

    const assignMatch = text.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+=|-=|\*=|=)\s*(.+)$/);
    if (assignMatch && !assignMatch[3].startsWith('=')) {
      nodes.push({
        type: 'assign',
        line: cur.lineNumber,
        name: assignMatch[1],
        op: assignMatch[2] as '=' | '+=' | '-=' | '*=',
        expr: assignMatch[3].trim(),
      });
      i += 1;
      continue;
    }

    nodes.push({ type: 'expr', line: cur.lineNumber, expr: text });
    i += 1;
  }

  return { nodes, nextIdx: i };
}

function splitTopLevelArgs(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      current += ch;
      escaped = true;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble) {
      if (ch === '(') depthParen++;
      else if (ch === ')') depthParen--;
      else if (ch === '[') depthBracket++;
      else if (ch === ']') depthBracket--;
      else if (ch === '{') depthBrace++;
      else if (ch === '}') depthBrace--;
      else if (ch === ',' && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim().length > 0) {
    parts.push(current.trim());
  }
  return parts;
}

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string; isF: boolean }
  | { kind: 'id'; value: string }
  | { kind: 'op'; value: string }
  | { kind: 'punc'; value: string };

function tokenizeExpr(expr: string, line: number): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // f-string or plain string
    if (
      (ch === 'f' || ch === 'F') &&
      (expr[i + 1] === '"' || expr[i + 1] === "'")
    ) {
      const quote = expr[i + 1];
      i += 2;
      let str = '';
      let closed = false;
      while (i < expr.length) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          const next = expr[i + 1];
          str += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
          continue;
        }
        if (expr[i] === quote) {
          closed = true;
          i++;
          break;
        }
        str += expr[i++];
      }
      if (!closed) {
        throw new PythonRuntimeError(`ยังไม่ได้ปิดเครื่องหมายคำพูด ${quote} ในบรรทัด ${line}`, line);
      }
      tokens.push({ kind: 'str', value: str, isF: true });
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      let closed = false;
      while (i < expr.length) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          const next = expr[i + 1];
          str += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
          continue;
        }
        if (expr[i] === quote) {
          closed = true;
          i++;
          break;
        }
        str += expr[i++];
      }
      if (!closed) {
        throw new PythonRuntimeError(`ยังไม่ได้ปิดเครื่องหมายคำพูด ${quote} ในบรรทัด ${line}`, line);
      }
      tokens.push({ kind: 'str', value: str, isF: false });
      continue;
    }

    if (/\d/.test(ch) || (ch === '.' && /\d/.test(expr[i + 1] || ''))) {
      let numStr = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        numStr += expr[i++];
      }
      const parsed = Number(numStr);
      if (!Number.isFinite(parsed)) {
        throw new PythonRuntimeError(`รูปแบบตัวเลขไม่ถูกต้อง "${numStr}"`, line);
      }
      tokens.push({ kind: 'num', value: parsed });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let id = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        id += expr[i++];
      }
      if (id === 'and' || id === 'or' || id === 'not' || id === 'if' || id === 'else') {
        tokens.push({ kind: 'op', value: id });
      } else {
        tokens.push({ kind: 'id', value: id });
      }
      continue;
    }

    const two = expr.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '//', '**'].includes(two)) {
      tokens.push({ kind: 'op', value: two });
      i += 2;
      continue;
    }

    if ('+-*/%<>='.includes(ch)) {
      tokens.push({ kind: 'op', value: ch });
      i++;
      continue;
    }

    if ('()[].,:'.includes(ch)) {
      tokens.push({ kind: 'punc', value: ch });
      i++;
      continue;
    }

    throw new PythonRuntimeError(`พบสัญลักษณ์ที่ไม่รู้จัก "${ch}" ที่บรรทัด ${line}`, line);
  }
  return tokens;
}

function toPythonBool(val: PyValue): boolean {
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'string') return val.length > 0;
  if (typeof val === 'number') return val !== 0;
  return Boolean(val);
}

function toPythonString(val: PyValue): string {
  if (val === null) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (Array.isArray(val)) {
    return `[${val.map((v) => (typeof v === 'string' ? `'${v}'` : toPythonString(v))).join(', ')}]`;
  }
  return String(val);
}

interface EvalContext {
  env: Record<string, PyValue>;
  inputQueue: string[];
  outputBuffer: string[];
  currentLineText: string;
  flushOutputLine: () => void;
}

function pickDefaultInput(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/y\/n/.test(lower)) return 'y';
  if (/อุณหภูมิ|temp/.test(lower)) return '32';
  if (/ความชื้น|moisture/.test(lower)) return '25';
  if (/คะแนน|score/.test(lower)) return '75';
  if (/ค่า a\b/i.test(lower)) return '12';
  if (/ค่า b\b/i.test(lower)) return '8';
  return '10';
}

function evalExpression(expr: string, ctx: EvalContext, line: number): PyValue {
  const tokens = tokenizeExpr(expr, line);
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const evalFString = (template: string): string => {
    let out = '';
    let idx = 0;
    while (idx < template.length) {
      if (template[idx] === '{') {
        if (template[idx + 1] === '{') {
          out += '{';
          idx += 2;
          continue;
        }
        let depth = 1;
        let end = idx + 1;
        while (end < template.length && depth > 0) {
          if (template[end] === '{') depth++;
          else if (template[end] === '}') depth--;
          end++;
        }
        if (depth !== 0) {
          throw new PythonRuntimeError(`วงเล็บปีกกา { } ใน f-string ไม่สมดุล (บรรทัด ${line})`, line);
        }
        const innerExpr = template.slice(idx + 1, end - 1).trim();
        const innerVal = evalExpression(innerExpr, ctx, line);
        out += toPythonString(innerVal);
        idx = end;
      } else if (template[idx] === '}' && template[idx + 1] === '}') {
        out += '}';
        idx += 2;
      } else {
        out += template[idx++];
      }
    }
    return out;
  };

  function parseTernary(): PyValue {
    const val = parseOr();
    const t = peek();
    if (t && t.kind === 'op' && t.value === 'if') {
      consume();
      const cond = parseOr();
      const elseTok = consume();
      if (!elseTok || elseTok.kind !== 'op' || elseTok.value !== 'else') {
        throw new PythonRuntimeError(`คำสั่งเงื่อนไขแบบย่อ (if ... else ...) ขาด else ที่บรรทัด ${line}`, line);
      }
      const falseVal = parseTernary();
      return toPythonBool(cond) ? val : falseVal;
    }
    return val;
  }

  function parseOr(): PyValue {
    let left = parseAnd();
    while (peek()?.kind === 'op' && peek()?.value === 'or') {
      consume();
      const right = parseAnd();
      left = toPythonBool(left) ? left : right;
    }
    return left;
  }

  function parseAnd(): PyValue {
    let left = parseNot();
    while (peek()?.kind === 'op' && peek()?.value === 'and') {
      consume();
      const right = parseNot();
      left = toPythonBool(left) ? right : left;
    }
    return left;
  }

  function parseNot(): PyValue {
    if (peek()?.kind === 'op' && peek()?.value === 'not') {
      consume();
      return !toPythonBool(parseNot());
    }
    return parseComparison();
  }

  function parseComparison(): PyValue {
    let left = parseAddSub();
    while (
      peek()?.kind === 'op' &&
      ['==', '!=', '<', '<=', '>', '>='].includes(peek()!.value as string)
    ) {
      const op = consume().value as string;
      const right = parseAddSub();
      if (op === '==') left = left === right;
      else if (op === '!=') left = left !== right;
      else if (typeof left === 'number' && typeof right === 'number') {
        if (op === '<') left = left < right;
        else if (op === '<=') left = left <= right;
        else if (op === '>') left = left > right;
        else if (op === '>=') left = left >= right;
      } else if (typeof left === 'string' && typeof right === 'string') {
        if (op === '<') left = left < right;
        else if (op === '<=') left = left <= right;
        else if (op === '>') left = left > right;
        else if (op === '>=') left = left >= right;
      } else {
        throw new PythonRuntimeError(
          `ไม่สามารถเปรียบเทียบ ${typeof left} กับ ${typeof right} ได้ (บรรทัด ${line})`,
          line
        );
      }
    }
    return left;
  }

  function parseAddSub(): PyValue {
    let left = parseMulDiv();
    while (peek()?.kind === 'op' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value as string;
      const right = parseMulDiv();
      if (op === '+') {
        if (typeof left === 'string' && typeof right === 'string') {
          left = left + right;
        } else if (typeof left === 'number' && typeof right === 'number') {
          left = left + right;
        } else if (Array.isArray(left) && Array.isArray(right)) {
          left = [...left, ...right];
        } else {
          throw new PythonRuntimeError(
            `ไม่สามารถนำข้อมูลต่างชนิดมาบวกกันได้โดยตรง (บรรทัด ${line})`,
            line
          );
        }
      } else {
        if (typeof left !== 'number' || typeof right !== 'number') {
          throw new PythonRuntimeError(`การลบ (-) ใช้ได้เฉพาะตัวเลข (บรรทัด ${line})`, line);
        }
        left = left - right;
      }
    }
    return left;
  }

  function parseMulDiv(): PyValue {
    let left = parseUnary();
    while (
      peek()?.kind === 'op' &&
      ['*', '/', '//', '%'].includes(peek()!.value as string)
    ) {
      const op = consume().value as string;
      const right = parseUnary();
      if (op === '*' && typeof left === 'string' && typeof right === 'number') {
        left = left.repeat(Math.max(0, Math.min(200, Math.floor(right))));
        continue;
      }
      if (typeof left !== 'number' || typeof right !== 'number') {
        throw new PythonRuntimeError(`ตัวดำเนินการ ${op} ใช้ได้เฉพาะตัวเลข (บรรทัด ${line})`, line);
      }
      if (op === '*') left = left * right;
      else if (op === '/') {
        if (right === 0) throw new PythonRuntimeError(`หารด้วยศูนย์ไม่ได้ (ZeroDivisionError)`, line);
        left = left / right;
      } else if (op === '//') {
        if (right === 0) throw new PythonRuntimeError(`หารด้วยศูนย์ไม่ได้ (ZeroDivisionError)`, line);
        left = Math.floor(left / right);
      } else if (op === '%') {
        if (right === 0) throw new PythonRuntimeError(`หารเอาเศษด้วยศูนย์ไม่ได้`, line);
        left = ((left % right) + right) % right;
      }
    }
    return left;
  }

  function parseUnary(): PyValue {
    if (peek()?.kind === 'op' && (peek()!.value === '-' || peek()!.value === '+')) {
      const op = consume().value;
      const val = parseUnary();
      if (typeof val !== 'number') {
        throw new PythonRuntimeError(`เครื่องหมาย ${op} ใช้ได้เฉพาะตัวเลข`, line);
      }
      return op === '-' ? -val : val;
    }
    return parsePower();
  }

  function parsePower(): PyValue {
    const base = parsePostfix();
    if (peek()?.kind === 'op' && peek()!.value === '**') {
      consume();
      const exp = parseUnary();
      if (typeof base !== 'number' || typeof exp !== 'number') {
        throw new PythonRuntimeError(`การยกกำลัง (**) ใช้ได้เฉพาะตัวเลข`, line);
      }
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseCallArgs(): { positional: PyValue[]; kwargs: Record<string, PyValue> } {
    // Reconstruct raw tokens inside (...) so keyword args & nested calls work cleanly
    const positional: PyValue[] = [];
    const kwargs: Record<string, PyValue> = {};
    if (peek()?.kind === 'punc' && peek()!.value === ')') {
      consume();
      return { positional, kwargs };
    }
    while (pos < tokens.length) {
      // Check kwarg: id '=' ...
      if (
        peek()?.kind === 'id' &&
        tokens[pos + 1]?.kind === 'op' &&
        tokens[pos + 1]?.value === '='
      ) {
        const kwName = String(consume().value);
        consume(); // '='
        kwargs[kwName] = parseTernary();
      } else {
        positional.push(parseTernary());
      }
      const next = peek();
      if (next?.kind === 'punc' && next.value === ',') {
        consume();
        continue;
      }
      if (next?.kind === 'punc' && next.value === ')') {
        consume();
        break;
      }
      throw new PythonRuntimeError(`รูปแบบอาร์กิวเมนต์ของฟังก์ชันไม่ถูกต้อง (บรรทัด ${line})`, line);
    }
    return { positional, kwargs };
  }

  function invokeBuiltinOrMethod(
    fnName: string,
    positional: PyValue[],
    kwargs: Record<string, PyValue>,
    target?: PyValue
  ): PyValue {
    if (target !== undefined) {
      if (typeof target === 'string') {
        if (fnName === 'zfill') {
          const width = Math.max(0, Math.min(128, Number(positional[0] ?? 0)));
          return target.padStart(width, '0');
        }
        if (fnName === 'upper') return target.toUpperCase();
        if (fnName === 'lower') return target.toLowerCase();
        if (fnName === 'strip') return target.trim();
      }
      if (fnName === 'randint' && positional.length >= 2) {
        const min = Math.ceil(Number(positional[0]));
        const max = Math.floor(Number(positional[1]));
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      throw new PythonRuntimeError(`ไม่รู้จักเมธอด .${fnName}() ในบรรทัด ${line}`, line);
    }

    switch (fnName) {
      case 'print': {
        const sep = typeof kwargs.sep === 'string' ? kwargs.sep : ' ';
        const end = typeof kwargs.end === 'string' ? kwargs.end : '\n';
        const text = positional.map(toPythonString).join(sep);
        const combined = text + end;
        const segments = combined.split('\n');
        for (let sIdx = 0; sIdx < segments.length; sIdx++) {
          ctx.currentLineText += segments[sIdx];
          if (sIdx < segments.length - 1) {
            ctx.flushOutputLine();
          }
        }
        return null;
      }
      case 'input': {
        const prompt = positional[0] !== undefined ? toPythonString(positional[0]) : '';
        if (ctx.inputQueue.length > 0) {
          return ctx.inputQueue.shift()!;
        }
        return pickDefaultInput(prompt);
      }
      case 'int': {
        const v = positional[0] ?? 0;
        const n = typeof v === 'boolean' ? (v ? 1 : 0) : parseInt(String(v), 10);
        if (!Number.isFinite(n)) {
          throw new PythonRuntimeError(`ไม่สามารถแปลง "${String(v)}" เป็นจำนวนเต็ม int()`, line);
        }
        return n;
      }
      case 'float': {
        const v = positional[0] ?? 0;
        const n = typeof v === 'boolean' ? (v ? 1 : 0) : parseFloat(String(v));
        if (!Number.isFinite(n)) {
          throw new PythonRuntimeError(`ไม่สามารถแปลง "${String(v)}" เป็นทศนิยม float()`, line);
        }
        return n;
      }
      case 'str':
        return positional.length > 0 ? toPythonString(positional[0]) : '';
      case 'len': {
        const v = positional[0];
        if (typeof v === 'string' || Array.isArray(v)) return v.length;
        throw new PythonRuntimeError(`len() ใช้กับข้อความหรือลิสต์เท่านั้น (บรรทัด ${line})`, line);
      }
      case 'abs':
        return Math.abs(Number(positional[0] ?? 0));
      case 'round':
        return Math.round(Number(positional[0] ?? 0));
      case 'bin': {
        const n = Math.trunc(Number(positional[0] ?? 0));
        return n < 0 ? `-0b${Math.abs(n).toString(2)}` : `0b${n.toString(2)}`;
      }
      case 'range': {
        let start = 0;
        let stop = 0;
        let step = 1;
        if (positional.length === 1) {
          stop = Number(positional[0]);
        } else if (positional.length === 2) {
          start = Number(positional[0]);
          stop = Number(positional[1]);
        } else if (positional.length >= 3) {
          start = Number(positional[0]);
          stop = Number(positional[1]);
          step = Number(positional[2]);
        }
        if (step === 0) throw new PythonRuntimeError(`range() step ต้องไม่เป็น 0`, line);
        const items: number[] = [];
        if (step > 0) {
          for (let k = start; k < stop && items.length < 1000; k += step) items.push(k);
        } else {
          for (let k = start; k > stop && items.length < 1000; k += step) items.push(k);
        }
        return items;
      }
      default:
        throw new PythonRuntimeError(`ไม่รู้จักฟังก์ชัน ${fnName}() ที่บรรทัด ${line}`, line);
    }
  }

  function parsePostfix(): PyValue {
    let val = parsePrimary();

    while (peek()) {
      const next = peek()!;
      if (next.kind === 'punc' && next.value === '.') {
        consume(); // '.'
        const member = consume();
        if (!member || member.kind !== 'id') {
          throw new PythonRuntimeError(`คาดหวังชื่อเมธอดหลัง '.' (บรรทัด ${line})`, line);
        }
        if (peek()?.kind === 'punc' && peek()!.value === '(') {
          consume(); // '('
          const { positional, kwargs } = parseCallArgs();
          val = invokeBuiltinOrMethod(member.value, positional, kwargs, val);
          continue;
        }
        throw new PythonRuntimeError(`ไม่รู้จักคุณสมบัติ .${member.value}`, line);
      }

      if (next.kind === 'punc' && next.value === '[') {
        consume(); // '['
        let startIdx: number | undefined;
        let endIdx: number | undefined;
        let isSlice = false;

        if (!(peek()?.kind === 'punc' && peek()!.value === ':')) {
          const first = parseTernary();
          if (typeof first !== 'number') {
            throw new PythonRuntimeError(`ดัชนี (index) ต้องเป็นตัวเลข`, line);
          }
          startIdx = Math.trunc(first);
        }

        if (peek()?.kind === 'punc' && peek()!.value === ':') {
          isSlice = true;
          consume(); // ':'
          if (!(peek()?.kind === 'punc' && peek()!.value === ']')) {
            const second = parseTernary();
            if (typeof second !== 'number') {
              throw new PythonRuntimeError(`ขอบเขต slice ต้องเป็นตัวเลข`, line);
            }
            endIdx = Math.trunc(second);
          }
        }

        const close = consume();
        if (!close || close.kind !== 'punc' || close.value !== ']') {
          throw new PythonRuntimeError(`ยังไม่ได้ปิดวงเล็บ ] ที่บรรทัด ${line}`, line);
        }

        if (typeof val !== 'string' && !Array.isArray(val)) {
          throw new PythonRuntimeError(`ไม่สามารถอ้างอิงดัชนีจากค่าชนิดนี้ได้`, line);
        }

        if (isSlice) {
          val = val.slice(startIdx ?? 0, endIdx);
        } else {
          const idx = startIdx ?? 0;
          const resolved = idx < 0 ? val.length + idx : idx;
          if (resolved < 0 || resolved >= val.length) {
            throw new PythonRuntimeError(`ดัชนี ${idx} เกินขนาดข้อมูล (IndexError)`, line);
          }
          val = val[resolved];
        }
        continue;
      }

      break;
    }

    return val;
  }

  function parsePrimary(): PyValue {
    const t = peek();
    if (!t) {
      throw new PythonRuntimeError(`นิพจน์ไม่สมบูรณ์ที่บรรทัด ${line}`, line);
    }

    if (t.kind === 'num') {
      consume();
      return t.value;
    }

    if (t.kind === 'str') {
      consume();
      return t.isF ? evalFString(t.value) : t.value;
    }

    if (t.kind === 'punc' && t.value === '(') {
      consume();
      const inner = parseTernary();
      const close = consume();
      if (!close || close.kind !== 'punc' || close.value !== ')') {
        throw new PythonRuntimeError(`วงเล็บ ( ) ไม่ครบคู่ที่บรรทัด ${line}`, line);
      }
      return inner;
    }

    if (t.kind === 'punc' && t.value === '[') {
      consume();
      const arr: PyValue[] = [];
      if (!(peek()?.kind === 'punc' && peek()!.value === ']')) {
        while (pos < tokens.length) {
          arr.push(parseTernary());
          if (peek()?.kind === 'punc' && peek()!.value === ',') {
            consume();
            if (peek()?.kind === 'punc' && peek()!.value === ']') break;
            continue;
          }
          break;
        }
      }
      const close = consume();
      if (!close || close.kind !== 'punc' || close.value !== ']') {
        throw new PythonRuntimeError(`วงเล็บ [ ] ไม่ครบคู่ที่บรรทัด ${line}`, line);
      }
      return arr;
    }

    if (t.kind === 'id') {
      consume();
      if (t.value === 'True') return true;
      if (t.value === 'False') return false;
      if (t.value === 'None') return null;

      if (peek()?.kind === 'punc' && peek()!.value === '(') {
        consume(); // '('
        const { positional, kwargs } = parseCallArgs();
        return invokeBuiltinOrMethod(t.value, positional, kwargs);
      }

      if (t.value === 'random') {
        return '__module_random__';
      }

      if (!(t.value in ctx.env)) {
        throw new PythonRuntimeError(`ยังไม่เคยประกาศตัวแปร "${t.value}" (NameError)`, line);
      }
      return ctx.env[t.value];
    }

    throw new PythonRuntimeError(`ไวยากรณ์ไม่ถูกต้องใกล้ "${String(t.value)}" (บรรทัด ${line})`, line);
  }

  const value = parseTernary();
  if (pos < tokens.length) {
    throw new PythonRuntimeError(
      `พบคำสั่งเกินความจำเป็น "${String(tokens[pos].value)}" ที่บรรทัด ${line}`,
      line
    );
  }
  return value;
}

export function runPythonCode(
  code: string,
  options?: PythonRunOptions
): PythonRunResult {
  const maxLoopIterations = options?.maxLoopIterations ?? 500;
  const maxSteps = options?.maxSteps ?? 2000;
  let stepsExecuted = 0;

  const ctx: EvalContext = {
    env: {},
    inputQueue: [...(options?.inputs ?? [])],
    outputBuffer: [],
    currentLineText: '',
    flushOutputLine: () => {
      ctx.outputBuffer.push(ctx.currentLineText);
      ctx.currentLineText = '';
    },
  };

  try {
    const parsedLines = preprocessLines(code);
    if (parsedLines.length === 0) {
      return {
        ok: true,
        output: '(ไม่มีคำสั่งให้ประมวลผล)',
        lines: [],
        stepsExecuted: 0,
      };
    }

    const baseIndent = parsedLines[0].indent;
    if (baseIndent !== 0) {
      throw new PythonRuntimeError(
        `คำสั่งแรกสุดไม่ควรเยื้องย่อหน้าเข้าด้านใน (บรรทัด ${parsedLines[0].lineNumber})`,
        parsedLines[0].lineNumber
      );
    }

    const { nodes, nextIdx } = parseBlock(parsedLines, 0, 0);
    if (nextIdx < parsedLines.length) {
      const bad = parsedLines[nextIdx];
      throw new PythonRuntimeError(
        `คำสั่ง "${bad.raw}" ไม่อยู่ในโครงสร้างที่ถูกต้อง (บรรทัด ${bad.lineNumber})`,
        bad.lineNumber
      );
    }

    const execBlock = (block: AstNode[]) => {
      for (const node of block) {
        stepsExecuted++;
        if (stepsExecuted > maxSteps) {
          throw new PythonRuntimeError(
            `หยุดการทำงานอัตโนมัติ: จำนวนขั้นตอนรวมเกิน ${maxSteps} ขั้น`,
            node.line
          );
        }

        if (node.type === 'import' || node.type === 'pass') {
          continue;
        }

        if (node.type === 'expr') {
          evalExpression(node.expr, ctx, node.line);
          continue;
        }

        if (node.type === 'assign') {
          const val = evalExpression(node.expr, ctx, node.line);
          if (node.op === '=') {
            ctx.env[node.name] = val;
          } else {
            const prev = ctx.env[node.name];
            if (typeof prev !== 'number' || typeof val !== 'number') {
              throw new PythonRuntimeError(
                `ไม่สามารถใช้ ${node.op} กับตัวแปร "${node.name}" ได้ (บรรทัด ${node.line})`,
                node.line
              );
            }
            if (node.op === '+=') ctx.env[node.name] = prev + val;
            else if (node.op === '-=') ctx.env[node.name] = prev - val;
            else if (node.op === '*=') ctx.env[node.name] = prev * val;
          }
          continue;
        }

        if (node.type === 'if') {
          for (const branch of node.branches) {
            if (
              branch.cond === null ||
              toPythonBool(evalExpression(branch.cond, ctx, branch.line))
            ) {
              execBlock(branch.body);
              break;
            }
          }
          continue;
        }

        if (node.type === 'for') {
          const iterVal = evalExpression(node.iterExpr, ctx, node.line);
          const items: PyValue[] = Array.isArray(iterVal)
            ? iterVal
            : typeof iterVal === 'string'
            ? Array.from(iterVal)
            : (() => {
                throw new PythonRuntimeError(
                  `ไม่สามารถวนลูป for บนค่าที่ไม่ใช่ลำดับ (บรรทัด ${node.line})`,
                  node.line
                );
              })();

          let count = 0;
          for (const item of items) {
            count++;
            if (count > maxLoopIterations) {
              throw new PythonRuntimeError(
                `หยุดการทำงานอัตโนมัติ: ลูป for วนซ้ำเกิน ${maxLoopIterations} รอบ`,
                node.line
              );
            }
            ctx.env[node.varName] = item;
            execBlock(node.body);
          }
          continue;
        }

        if (node.type === 'while') {
          let count = 0;
          while (toPythonBool(evalExpression(node.cond, ctx, node.line))) {
            count++;
            if (count > maxLoopIterations) {
              throw new PythonRuntimeError(
                `หยุดการทำงานอัตโนมัติ: ลูป while วนซ้ำเกิน ${maxLoopIterations} รอบ (อาจลืมอัปเดตตัวนับ เช่น count += 1)`,
                node.line
              );
            }
            execBlock(node.body);
          }
        }
      }
    };

    execBlock(nodes);

    if (ctx.currentLineText.length > 0) {
      ctx.flushOutputLine();
    }

    const lines = ctx.outputBuffer;
    return {
      ok: true,
      output: lines.length > 0 ? lines.join('\n') : '(โปรแกรมทำงานสำเร็จ · ไม่มีข้อความ print ออกหน้าจอ)',
      lines,
      stepsExecuted,
    };
  } catch (err) {
    if (ctx.currentLineText.length > 0) {
      ctx.flushOutputLine();
    }
    const lineNo = err instanceof PythonRuntimeError ? err.lineNumber : undefined;
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรันโค้ด Python';
    const prefix = ctx.outputBuffer.length > 0 ? `${ctx.outputBuffer.join('\n')}\n\n` : '';
    return {
      ok: false,
      output: `${prefix}❌ [Python Error${lineNo ? ` บรรทัด ${lineNo}` : ''}] ${msg}`,
      lines: ctx.outputBuffer,
      errorLine: lineNo,
      errorMessage: msg,
      stepsExecuted,
    };
  }
}

export { splitTopLevelArgs };
