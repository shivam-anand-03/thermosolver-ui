// Heat generation expression f(x, y, z): parse plain or LaTeX input, render it as LaTeX,
// evaluate it for the preview, and write the canonical plain form the API understands
// (the server re-parses that with its own allow-list; see app/engine/expression.py).

export type Ast =
  | { k: 'num'; v: number }
  | { k: 'var'; name: Variable }
  | { k: 'const'; name: 'pi' | 'e' }
  | { k: 'neg'; a: Ast }
  | { k: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Ast; b: Ast }
  | { k: 'fn'; name: Fn; a: Ast }

export type Variable = 'x' | 'y' | 'z' | 'L' | 'W' | 'H'
export type Fn = (typeof FNS)[number]

const FNS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'exp', 'log', 'ln', 'log10', 'sqrt', 'abs'] as const
const FN_IMPL: Record<Fn, (v: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, log: Math.log, ln: Math.log,
  log10: Math.log10, sqrt: Math.sqrt, abs: Math.abs,
}
const VARS: Variable[] = ['x', 'y', 'z', 'L', 'W', 'H']
const NAMES = [...FNS, 'pi', 'e', ...VARS, 'frac'].sort((a, b) => b.length - a.length)
// LaTeX commands that are layout only
const SKIP = new Set(['left', 'right', 'big', 'Big', 'bigl', 'bigr', 'Bigl', 'Bigr', 'displaystyle'])
const TIMES = new Set(['cdot', 'times'])

export class ExprError extends Error {}

type Tok = { t: 'num' | 'name' | 'op'; v: string }

function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  const s = src.replace(/\\[,;:! ]/g, ' ').replace(/·|×/g, '*').replace(/−/g, '-').replace(/π/g, 'pi')
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) { i++; continue }
    const num = /^(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/.exec(s.slice(i))
    if (num) { out.push({ t: 'num', v: num[1] }); i += num[1].length; continue }
    if (c === '\\') {
      const m = /^\\([A-Za-z]+)/.exec(s.slice(i))
      if (!m) throw new ExprError(`Unexpected '\\' at position ${i + 1}.`)
      i += m[0].length
      const cmd = m[1]
      if (SKIP.has(cmd)) continue
      if (TIMES.has(cmd)) { out.push({ t: 'op', v: '*' }); continue }
      if (cmd === 'operatorname') continue
      if (!(NAMES as string[]).includes(cmd)) throw new ExprError(`Unknown command '\\${cmd}'.`)
      out.push({ t: 'name', v: cmd })
      continue
    }
    if (/[A-Za-z]/.test(c)) {
      const m = /^[A-Za-z][A-Za-z0-9]*/.exec(s.slice(i))!
      i += m[0].length
      for (const part of splitIdent(m[0])) out.push({ t: 'name', v: part })
      continue
    }
    if (s.startsWith('**', i)) { out.push({ t: 'op', v: '^' }); i += 2; continue }
    if ('+-*/^(),{}[]|'.includes(c)) {
      out.push({ t: 'op', v: c === '{' || c === '[' ? '(' : c === '}' || c === ']' ? ')' : c })
      i++
      continue
    }
    throw new ExprError(`Unexpected character '${c}' at position ${i + 1}.`)
  }
  return out
}

function splitIdent(id: string): string[] {
  if ((NAMES as string[]).includes(id)) return [id]
  const out: string[] = []
  let i = 0
  outer: while (i < id.length) {
    for (const n of NAMES) {
      if (id.startsWith(n, i)) { out.push(n); i += n.length; continue outer }
    }
    throw new ExprError(`Unknown name '${id}'. Use x, y, z, L, W, H, π, e or a function such as sin.`)
  }
  return out
}

class Parser {
  i = 0
  toks: Tok[]
  constructor(toks: Tok[]) {
    this.toks = toks
  }
  peek() { return this.toks[this.i] }
  take(v?: string) {
    const t = this.toks[this.i]
    if (!t) throw new ExprError(v ? `Missing '${v}'.` : 'The expression ends too early.')
    if (v && t.v !== v) throw new ExprError(`Expected '${v}' but found '${t.v}'.`)
    this.i++
    return t
  }
  expr(): Ast {
    let a = this.term()
    for (let t = this.peek(); t && t.t === 'op' && (t.v === '+' || t.v === '-'); t = this.peek()) {
      this.take()
      a = { k: 'bin', op: t.v as '+' | '-', a, b: this.term() }
    }
    return a
  }
  startsPrimary(t?: Tok) { return !!t && (t.t === 'num' || t.t === 'name' || t.v === '(' || t.v === '|') }
  term(): Ast {
    let a = this.unary()
    for (;;) {
      const t = this.peek()
      if (t && t.t === 'op' && (t.v === '*' || t.v === '/')) { this.take(); a = { k: 'bin', op: t.v, a, b: this.unary() } }
      else if (this.startsPrimary(t) && !(t!.v === '|' && this.inAbs)) a = { k: 'bin', op: '*', a, b: this.power() }
      else return a
    }
  }
  unary(): Ast {
    const t = this.peek()
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) { this.take(); const a = this.unary(); return t.v === '-' ? { k: 'neg', a } : a }
    return this.power()
  }
  power(): Ast {
    const base = this.primary()
    if (this.peek()?.v === '^') { this.take(); return { k: 'bin', op: '^', a: base, b: this.unary() } }
    return base
  }
  inAbs = false
  primary(): Ast {
    const t = this.take()
    if (t.t === 'num') return { k: 'num', v: Number(t.v) }
    if (t.v === '(') { const a = this.expr(); this.take(')'); return a }
    if (t.v === '|') {
      const was = this.inAbs
      this.inAbs = true
      const a = this.expr()
      this.inAbs = was
      this.take('|')
      return { k: 'fn', name: 'abs', a }
    }
    if (t.t === 'name') {
      if (t.v === 'frac') { const a = this.primary(); const b = this.primary(); return { k: 'bin', op: '/', a, b } }
      if ((FNS as readonly string[]).includes(t.v)) {
        // f(x) or, LaTeX style, f x  /  f^2 x is not supported
        const a = this.peek()?.v === '(' ? this.primary() : this.power()
        return { k: 'fn', name: t.v as Fn, a }
      }
      if (t.v === 'pi' || t.v === 'e') return { k: 'const', name: t.v }
      return { k: 'var', name: t.v as Variable }
    }
    throw new ExprError(`Unexpected '${t.v}'.`)
  }
}

export function parseExpression(src: string): Ast {
  if (!src.trim()) throw new ExprError('Type an expression, for example 5e5 sin(pi x / L).')
  if (src.length > 400) throw new ExprError('The expression is longer than 400 characters.')
  const p = new Parser(tokenize(src))
  const ast = p.expr()
  if (p.peek()) throw new ExprError(`Unexpected '${p.peek()!.v}' after a complete expression.`)
  return ast
}

export function evaluate(ast: Ast, env: Record<Variable, number>): number {
  switch (ast.k) {
    case 'num': return ast.v
    case 'var': return env[ast.name]
    case 'const': return ast.name === 'pi' ? Math.PI : Math.E
    case 'neg': return -evaluate(ast.a, env)
    case 'fn': return FN_IMPL[ast.name](evaluate(ast.a, env))
    case 'bin': {
      const a = evaluate(ast.a, env), b = evaluate(ast.b, env)
      return ast.op === '+' ? a + b : ast.op === '-' ? a - b : ast.op === '*' ? a * b : ast.op === '/' ? a / b : Math.pow(a, b)
    }
  }
}

export function variablesOf(ast: Ast, out = new Set<Variable>()): Set<Variable> {
  if (ast.k === 'var') out.add(ast.name)
  if (ast.k === 'neg' || ast.k === 'fn') variablesOf(ast.a, out)
  if (ast.k === 'bin') { variablesOf(ast.a, out); variablesOf(ast.b, out) }
  return out
}

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 } as const
function prec(a: Ast): number {
  if (a.k === 'bin') return PREC[a.op]
  if (a.k === 'neg') return PREC.neg
  if (a.k === 'num' && a.v < 0) return PREC.neg
  return 9
}

function numPlain(v: number): string {
  return String(v).replace('e+', 'e')
}

/** Canonical form for the API: explicit operators, minimal parentheses. */
export function toPlain(a: Ast): string {
  const wrap = (x: Ast, min: number, strict = false) => {
    const s = toPlain(x), p = prec(x)
    return p < min || (strict && p === min) ? `(${s})` : s
  }
  switch (a.k) {
    case 'num': return numPlain(a.v)
    case 'var': return a.name
    case 'const': return a.name
    case 'neg': return `-${wrap(a.a, PREC.neg)}`
    case 'fn': return `${a.name}(${toPlain(a.a)})`
    case 'bin': {
      const p = PREC[a.op]
      if (a.op === '^') return `${wrap(a.a, p, true)}^${wrap(a.b, PREC.neg)}`
      return `${wrap(a.a, p)} ${a.op} ${wrap(a.b, p, a.op === '-' || a.op === '/')}`
    }
  }
}

function numTex(v: number): string {
  if (v !== 0 && (Math.abs(v) >= 1e4 || Math.abs(v) < 1e-3)) {
    const [m, e] = v.toExponential().split('e')
    const mant = Number(Number(m).toPrecision(6))
    return `${mant === 1 ? '' : `${mant}\\times `}10^{${Number(e)}}`
  }
  return String(v)
}

const FN_TEX: Partial<Record<Fn, string>> = { asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', log10: '\\log_{10}' }

export function toLatex(a: Ast): string {
  const wrap = (x: Ast, min: number, strict = false) => {
    const s = toLatex(x), p = prec(x)
    return p < min || (strict && p === min) ? `\\left(${s}\\right)` : s
  }
  switch (a.k) {
    case 'num': return numTex(a.v)
    case 'var': return a.name
    case 'const': return a.name === 'pi' ? '\\pi' : 'e'
    case 'neg': return `-${wrap(a.a, PREC.neg)}`
    case 'fn':
      if (a.name === 'sqrt') return `\\sqrt{${toLatex(a.a)}}`
      if (a.name === 'abs') return `\\left|${toLatex(a.a)}\\right|`
      if (a.name === 'exp') return `e^{${toLatex(a.a)}}`
      return `${FN_TEX[a.name] ?? `\\${a.name}`}\\left(${toLatex(a.a)}\\right)`
    case 'bin': {
      if (a.op === '/') return `\\frac{${toLatex(a.a)}}{${toLatex(a.b)}}`
      if (a.op === '^') return `${wrap(a.a, PREC['^'], true)}^{${toLatex(a.b)}}`
      if (a.op === '*') {
        const l = wrap(a.a, PREC['*']), r = wrap(a.b, PREC['*'])
        const needDot = a.b.k === 'num' || (a.b.k === 'neg') || /^[0-9]/.test(r) || (a.a.k === 'num' && /^-?\d/.test(r))
        return needDot ? `${l}\\cdot ${r}` : `${l}\\,${r}`
      }
      return `${toLatex(a.a)} ${a.op} ${wrap(a.b, PREC[a.op], a.op === '-')}`
    }
  }
}

export interface Analysis {
  ok: boolean
  error?: string
  latex?: string
  plain?: string
  vars?: Set<Variable>
  ast?: Ast
}

export function analyse(src: string): Analysis {
  try {
    const ast = parseExpression(src)
    return { ok: true, ast, latex: toLatex(ast), plain: toPlain(ast), vars: variablesOf(ast) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
