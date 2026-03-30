/**
 * Action Mapper - Maps UFT object methods to Playwright equivalents.
 *
 * Comprehensive mapping from UFT/QTP object types and methods
 * to Playwright API calls, covering:
 * - Web objects (Browser, Page, WebEdit, WebButton, WebList, WebTable, etc.)
 * - Dialog handling
 * - Synchronization methods
 * - Verification/checkpoint methods
 * - Utility actions (Reporter, SystemUtil, Wait)
 */

import { UFTAction, PlaywrightAction } from '../models/types';
import { logger } from '../utils/logger';

/** Mapping entry from UFT method to Playwright code */
interface MethodMapping {
  playwright: string;
  isAsync: boolean;
  imports: string[];
  needsSelector: boolean;
  confidence: number;
  argTransform?: (args: string[]) => string[];
  notes?: string;
}

/** Map of UFT ObjectType -> Method -> Playwright mapping */
type MappingTable = Record<string, Record<string, MethodMapping>>;

export class ActionMapper {
  private mappings: MappingTable;
  private customOverrides: Map<string, MethodMapping> = new Map();

  constructor() {
    this.mappings = this.buildMappingTable();
  }

  /**
   * Add custom mapping overrides for project-specific objects.
   */
  addOverride(objectType: string, method: string, mapping: MethodMapping): void {
    const key = `${objectType}.${method}`;
    this.customOverrides.set(key, mapping);
  }

  /**
   * Map a UFT action to a Playwright action.
   */
  map(action: UFTAction, selector?: string): PlaywrightAction {
    // Handle control flow actions (If/ElseIf/Else/End If/For/Next/While/etc.)
    if (action.objectType === 'ControlFlow') {
      return this.convertControlFlow(action);
    }

    // Check custom overrides first
    const overrideKey = `${action.objectType}.${action.method}`;
    const override = this.customOverrides.get(overrideKey);
    if (override) {
      return this.applyMapping(action, override, selector);
    }

    // Look up in mapping table
    const objectMappings = this.mappings[action.objectType];
    if (!objectMappings) {
      return this.createUnmappedAction(action, `Unsupported object type: ${action.objectType}`);
    }

    const methodMapping = objectMappings[action.method] || objectMappings['_default'];
    if (!methodMapping) {
      return this.createUnmappedAction(
        action,
        `Unsupported method: ${action.objectType}.${action.method}`
      );
    }

    return this.applyMapping(action, methodMapping, selector);
  }

  /**
   * Apply a mapping to generate Playwright code.
   */
  private applyMapping(
    action: UFTAction,
    mapping: MethodMapping,
    selector?: string
  ): PlaywrightAction {
    let code = mapping.playwright;
    const warnings: string[] = [];

    // Replace selector placeholder
    const sel = selector || this.inferSelector(action);
    code = code.replace('{{SELECTOR}}', sel);

    // Replace method name placeholder (for FunctionCall mappings)
    if (code.includes('{{METHOD}}')) {
      const camelMethod = action.method.charAt(0).toLowerCase() + action.method.slice(1);
      code = code.replace('{{METHOD}}', camelMethod);
    }

    // Replace argument placeholders
    const args = mapping.argTransform
      ? mapping.argTransform(action.arguments)
      : action.arguments;

    // Replace {{ARGS}} placeholder with all arguments joined
    if (code.includes('{{ARGS}}')) {
      const quotedArgs = args.map(a => {
        const trimmed = a.trim();
        // If already quoted, convert to single-quoted TS string
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          const inner = trimmed.slice(1, -1).replace(/'/g, "\\'");
          return `'${inner}'`;
        }
        // Numbers pass through as-is
        if (/^\d+$/.test(trimmed)) return trimmed;
        // Variable references pass through as-is
        return trimmed;
      });
      const argsStr = quotedArgs.length > 0 ? quotedArgs.join(', ') : '';
      code = code.replace('{{ARGS}}', argsStr);
      // Clean up empty args: (page, ) -> (page)
      code = code.replace(/,\s*\)/g, ')');
    }

    for (let i = 0; i < args.length; i++) {
      const cleaned = this.cleanArgument(args[i]);
      // Replace ALL occurrences of the placeholder (some templates use the same arg twice)
      const argPattern = new RegExp(`\\{\\{ARG${i}\\}\\}`, 'g');
      code = code.replace(argPattern, cleaned);
    }

    // Replace remaining unfilled placeholders
    code = code.replace(/\{\{ARG\d+\}\}/g, '');

    // Detect VBScript variables used in numeric positions like .nth(varName)
    // and replace with a placeholder so generated TypeScript compiles
    code = code.replace(/\.nth\(([a-zA-Z_]\w*)\)/g, (match, varName) => {
      warnings.push(`VBScript variable '${varName}' used as index. Replace with actual value or loop variable.`);
      return `.nth(0 /* TODO: replace '${varName}' with actual index */)`;
    });

    // Clean up trailing commas or empty parens
    code = code.replace(/,\s*\)/g, ')');
    code = code.replace(/\(\s*,/g, '(');

    if (mapping.confidence < 80) {
      warnings.push(`Low confidence mapping (${mapping.confidence}%): ${action.objectType}.${action.method}`);
    }

    if (mapping.notes) {
      warnings.push(`Note: ${mapping.notes}`);
    }

    return {
      code,
      imports: [...mapping.imports],
      comments: action.description ? [`// ${action.description}`] : [],
      isAsync: mapping.isAsync,
      confidence: mapping.confidence,
      originalUFTLine: action.rawLine,
      warnings,
    };
  }

  /**
   * Create a placeholder for unmapped actions.
   */
  private createUnmappedAction(action: UFTAction, reason: string): PlaywrightAction {
    logger.warn(`Unmapped action at line ${action.lineNumber}: ${reason}`);

    return {
      code: `// TODO: Manual conversion needed - ${reason}\n// Original: ${action.rawLine}`,
      imports: [],
      comments: [`// UNMAPPED: ${action.rawLine}`],
      isAsync: false,
      confidence: 0,
      originalUFTLine: action.rawLine,
      warnings: [reason],
    };
  }

  /**
   * Infer a Playwright selector from UFT action properties.
   */
  private inferSelector(action: UFTAction): string {
    if (!action.objectName) return `'[data-testid="unknown"]'`;

    // If object name looks like an ID
    if (/^[a-zA-Z_]\w*$/.test(action.objectName) && !action.objectName.includes(' ')) {
      return `'#${action.objectName}'`;
    }

    // If it looks like text content
    if (action.objectName.includes(' ') || /^[A-Z]/.test(action.objectName)) {
      // Use role-based selector for buttons
      if (['WebButton', 'WinButton'].includes(action.objectType)) {
        const safeName = action.objectName.replace(/'/g, "\\'");
        return `page.getByRole('button', { name: '${safeName}' })`;
      }
      if (action.objectType === 'Link') {
        const safeName = action.objectName.replace(/'/g, "\\'");
        return `page.getByRole('link', { name: '${safeName}' })`;
      }
      const safeName = action.objectName.replace(/'/g, "\\'");
      return `page.getByText('${safeName}')`;
    }

    return `'#${action.objectName}'`;
  }

  /**
   * Clean a VBScript argument value for use in TypeScript.
   * Handles VBScript string concatenation with & operator.
   */
  /** VBScript Reporter event type constants → string literals */
  private static readonly VBS_CONSTANTS: Record<string, string> = {
    micpass: "'micPass'",
    micfail: "'micFail'",
    micdone: "'micDone'",
    micwarning: "'micWarning'",
    micinfo: "'micInfo'",
  };

  /**
   * Convert a VBScript control flow action to TypeScript.
   * Handles If/ElseIf/Else/End If/For/Next/While/Wend/Do/Loop/Select/Case/Exit.
   */
  private convertControlFlow(action: UFTAction): PlaywrightAction {
    const vbsLine = action.arguments.length > 0 ? action.arguments[0] : action.rawLine;
    let code = '';

    switch (action.method) {
      case 'If': {
        let cond = vbsLine.replace(/^\s*If\s+/i, '').replace(/\s+Then\s*$/i, '');
        cond = this.convertVbsCondition(cond);
        code = `if (${cond}) {`;
        break;
      }
      case 'IfSingleLine': {
        // If condition Then statement
        const match = vbsLine.match(/^\s*If\s+(.+?)\s+Then\s+(.+)/i);
        if (match) {
          let cond = this.convertVbsCondition(match[1]);
          let stmt = match[2].trim();
          // Convert common statements
          stmt = this.convertVbsStatement(stmt);
          code = `if (${cond}) { ${stmt} }`;
        } else {
          code = `// TODO: ${vbsLine}`;
        }
        break;
      }
      case 'ElseIf': {
        let cond = vbsLine.replace(/^\s*ElseIf\s+/i, '').replace(/\s+Then\s*$/i, '');
        cond = this.convertVbsCondition(cond);
        code = `} else if (${cond}) {`;
        break;
      }
      case 'Else':
        code = '} else {';
        break;
      case 'EndIf':
        code = '}';
        break;
      case 'For': {
        const forLine = vbsLine.replace(
          /^\s*For\s+(\w+)\s*=\s*(.+?)\s+To\s+(\S+)(?:\s+Step\s+(\S+))?\s*$/i,
          (_, varName, start, end, step) => {
            const s = step ? step : '1';
            const op = (s.startsWith('-')) ? '>=' : '<=';
            const inc = (s === '1') ? `${varName}++` : `${varName} += ${s}`;
            return `for (let ${varName} = ${start}; ${varName} ${op} ${end}; ${inc}) {`;
          }
        );
        code = forLine;
        break;
      }
      case 'ForEach': {
        const feMatch = vbsLine.match(/^\s*For\s+Each\s+(\w+)\s+In\s+(.+)/i);
        if (feMatch) {
          code = `for (const ${feMatch[1]} of ${feMatch[2].trim()}) {`;
        } else {
          code = `// TODO: ${vbsLine}`;
        }
        break;
      }
      case 'Next':
        code = '}';
        break;
      case 'While': {
        let cond = vbsLine.replace(/^\s*While\s+/i, '').trim();
        cond = this.convertVbsCondition(cond);
        code = `while (${cond}) {`;
        break;
      }
      case 'Wend':
        code = '}';
        break;
      case 'Do': {
        const doMatch = vbsLine.match(/^\s*Do\s+(While|Until)\s+(.+)/i);
        if (doMatch) {
          let cond = this.convertVbsCondition(doMatch[2].trim());
          if (doMatch[1].toLowerCase() === 'until') {
            cond = `!(${cond})`;
          }
          code = `while (${cond}) {`;
        } else {
          // Bare "Do" — becomes do { ... } while
          code = 'do {';
        }
        break;
      }
      case 'Loop': {
        const loopMatch = vbsLine.match(/^\s*Loop\s+(While|Until)\s+(.+)/i);
        if (loopMatch) {
          let cond = this.convertVbsCondition(loopMatch[2].trim());
          if (loopMatch[1].toLowerCase() === 'until') {
            cond = `!(${cond})`;
          }
          code = `} while (${cond});`;
        } else {
          code = '}';
        }
        break;
      }
      case 'SelectCase': {
        const scMatch = vbsLine.match(/^\s*Select\s+Case\s+(.+)/i);
        code = scMatch ? `switch (${scMatch[1].trim()}) {` : `// TODO: ${vbsLine}`;
        break;
      }
      case 'Case': {
        const caseStr = vbsLine.replace(/^\s*Case\s+/i, '').trim();
        if (/^Else$/i.test(caseStr)) {
          code = 'default:';
        } else if (caseStr.startsWith('"')) {
          const inner = caseStr.slice(1, -1).replace(/'/g, "\\'");
          code = `case '${inner}':`;
        } else {
          code = `case ${caseStr}:`;
        }
        break;
      }
      case 'EndSelect':
        code = '}';
        break;
      case 'Exit': {
        const exitMatch = vbsLine.match(/^\s*Exit\s+(For|Do|Function|Sub)\s*$/i);
        if (exitMatch) {
          const kind = exitMatch[1].toLowerCase();
          code = (kind === 'for' || kind === 'do') ? 'break;' : 'return;';
        } else {
          code = 'break;';
        }
        break;
      }
      default:
        code = `// TODO: ${vbsLine}`;
    }

    return {
      code,
      imports: [],
      comments: [],
      isAsync: false,
      confidence: 90,
      originalUFTLine: action.rawLine,
      warnings: [],
    };
  }

  /**
   * Convert a VBScript condition expression to TypeScript.
   * Converts all VBScript operators to their TypeScript equivalents.
   */
  private convertVbsCondition(cond: string): string {
    // Check if the entire condition (or a part) is a UFT object chain like Browser(...).Page(...).WebElement(...).Exist(10)
    const uftPattern = /Browser\s*\([^)]*\)(?:\.\w+\s*\([^)]*\))+/g;
    cond = cond.replace(uftPattern, (match) => {
      // Convert UFT object chain to Playwright equivalent
      return this.convertUftObjectChainInCondition(match);
    });

    // Convert VBScript InStr function calls (handles nested parens like DataTable(...))
    cond = ActionMapper.convertInStr(cond);

    cond = cond.replace(/\bAnd\b/gi, '&&');
    cond = cond.replace(/\bOr\b/gi, '||');
    cond = cond.replace(/\bNot\b/gi, '!');
    cond = cond.replace(/<>/g, '!==');
    cond = cond.replace(/\bMod\b/gi, '%');
    cond = cond.replace(/\bIs\b/gi, '===');
    cond = cond.replace(/\bTrue\b/gi, 'true');
    cond = cond.replace(/\bFalse\b/gi, 'false');
    cond = cond.replace(/\bNothing\b/gi, 'null');
    cond = cond.replace(/\bEmpty\b/gi, "''");
    // Fix single = to === for comparisons, respecting string literals
    cond = ActionMapper.replaceEqualsOutsideStrings(cond);
    // Integer division \ -> /
    cond = cond.replace(/\\/g, '/');
    // Exponentiation ^ -> **
    cond = cond.replace(/\^/g, '**');
    // Convert VBS string expressions (handle VBS "" escape sequences)
    cond = cond.replace(/"((?:[^"]|"")*)"/g, (_, content) => `'${content.replace(/""/g, '"')}'`);
    return cond;
  }

  /**
   * Convert a UFT object chain (e.g., Browser("X").Page("Y").WebElement("Z").Exist(10))
   * into a Playwright equivalent for use inside conditions.
   */
  private convertUftObjectChainInCondition(chain: string): string {
    // Extract method call at the end (e.g., .Exist(10), .GetROProperty("innertext"))
    const methodMatch = chain.match(/\.(\w+)\s*\(([^)]*)\)\s*$/);
    if (!methodMatch) return `/* TODO: ${chain} */`;

    const method = methodMatch[1];
    const methodArg = methodMatch[2].trim();

    // Extract object name from the chain (last object before the method)
    // e.g., Browser("X").Page("Y").WebElement("Z") → find "Z" and type "WebElement"
    const objectParts = chain.substring(0, chain.length - methodMatch[0].length);
    const lastObjMatch = objectParts.match(/\.(\w+)\s*\(\s*"([^"]*)"\s*\)\s*$/);
    const objectName = lastObjMatch ? lastObjMatch[2] : 'unknown';
    const objectType = lastObjMatch ? lastObjMatch[1] : 'WebElement';

    // Build a selector
    const selector = `'#${objectName}'`;

    switch (method.toLowerCase()) {
      case 'exist':
        return `await page.locator(${selector}).count() > 0`;
      case 'getroproperty': {
        const prop = methodArg.replace(/"/g, '').replace(/'/g, '');
        if (prop === 'innertext' || prop === 'text') {
          return `await page.locator(${selector}).innerText()`;
        }
        if (prop === 'value') {
          return `await page.locator(${selector}).inputValue()`;
        }
        return `await page.locator(${selector}).getAttribute('${prop}')`;
      }
      case 'checkproperty':
      case 'verifyproperty':
        return `await page.locator(${selector}).getAttribute(${methodArg})`;
      default:
        return `/* TODO: ${chain} */`;
    }
  }

  /**
   * Convert a simple VBScript statement to TypeScript (for single-line If).
   */
  /**
   * Convert VBScript InStr() calls to TypeScript equivalents.
   * Handles nested function calls like InStr(x, DataTable("Y", z)) > 0.
   */
  static convertInStr(expr: string): string {
    // Find InStr( with proper nesting
    const instrRegex = /\bInStr\s*\(/gi;
    let match;
    let result = expr;
    let offset = 0;

    while ((match = instrRegex.exec(expr)) !== null) {
      const funcStart = match.index;
      const argsStart = funcStart + match[0].length;

      // Find matching closing paren
      let depth = 1;
      let i = argsStart;
      while (i < expr.length && depth > 0) {
        if (expr[i] === '(') depth++;
        else if (expr[i] === ')') depth--;
        i++;
      }
      const argsEnd = i - 1; // index of closing paren
      const argsStr = expr.substring(argsStart, argsEnd);

      // Split args at top-level comma (not inside nested parens)
      const args: string[] = [];
      let argDepth = 0;
      let argStart = 0;
      for (let j = 0; j < argsStr.length; j++) {
        if (argsStr[j] === '(') argDepth++;
        else if (argsStr[j] === ')') argDepth--;
        else if (argsStr[j] === ',' && argDepth === 0) {
          args.push(argsStr.substring(argStart, j).trim());
          argStart = j + 1;
        }
      }
      args.push(argsStr.substring(argStart).trim());

      if (args.length >= 2) {
        const strArg = args[0];
        let searchArg = args[1];
        // Convert VBS strings to TS
        searchArg = searchArg.replace(/^"(.*)"$/, "'$1'");

        // Check if followed by > 0
        const afterInStr = expr.substring(argsEnd + 1).trim();
        const gtZeroMatch = afterInStr.match(/^\s*>\s*0/);

        let replacement: string;
        if (gtZeroMatch) {
          replacement = `${strArg}.includes(${searchArg})`;
          const fullEnd = argsEnd + 1 + expr.substring(argsEnd + 1).indexOf('0') + 1;
          const original = expr.substring(funcStart, fullEnd);
          result = result.substring(0, funcStart + offset) + replacement + result.substring(funcStart + offset + original.length);
          offset += replacement.length - original.length;
        } else {
          replacement = `${strArg}.indexOf(${searchArg})`;
          const original = expr.substring(funcStart, argsEnd + 1);
          result = result.substring(0, funcStart + offset) + replacement + result.substring(funcStart + offset + original.length);
          offset += replacement.length - original.length;
        }
      }
    }
    return result;
  }

  /**
   * Replace VBScript = with === for comparisons, but only outside string literals.
   */
  static replaceEqualsOutsideStrings(expr: string): string {
    let result = '';
    let inString = false;
    let quoteChar = '';
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        quoteChar = ch;
        result += ch;
      } else if (inString && ch === quoteChar) {
        inString = false;
        result += ch;
      } else if (!inString && ch === '=' &&
                 (i === 0 || (expr[i - 1] !== '=' && expr[i - 1] !== '!' && expr[i - 1] !== '<' && expr[i - 1] !== '>')) &&
                 (i + 1 >= expr.length || expr[i + 1] !== '=')) {
        result += '===';
      } else {
        result += ch;
      }
    }
    return result;
  }

  private convertVbsStatement(stmt: string): string {
    // Assignment: varName = value
    const assignMatch = stmt.match(/^(\w+)\s*=\s*(.+)/);
    if (assignMatch) {
      let value = assignMatch[2].trim();
      value = value.replace(/\bTrue\b/gi, 'true').replace(/\bFalse\b/gi, 'false');
      value = value.replace(/\bNothing\b/gi, 'null');
      value = value.replace(/"([^"]*)"/g, "'$1'");
      return `${assignMatch[1]} = ${value};`;
    }
    // Exit For/Do/Function/Sub
    if (/^Exit\s+(For|Do)\s*$/i.test(stmt)) return 'break;';
    if (/^Exit\s+(Function|Sub)\s*$/i.test(stmt)) return 'return;';
    return `// TODO: ${stmt}`;
  }

  private cleanArgument(arg: string): string {
    if (!arg) return "''";

    let cleaned = arg.trim();

    // Convert known VBScript constants to string literals
    const lower = cleaned.toLowerCase();
    if (ActionMapper.VBS_CONSTANTS[lower]) {
      return ActionMapper.VBS_CONSTANTS[lower];
    }

    // Check if the argument contains VBScript & concatenation
    // (outside of a simple quoted string)
    const concatPattern = /(?<!&)\s*&(?!&)\s*/;
    if (concatPattern.test(cleaned)) {
      return this.convertVbsConcatToTs(cleaned);
    }

    // Convert VBScript double-quoted strings to JS single-quoted strings
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      const inner = cleaned.slice(1, -1).replace(/'/g, "\\'");
      return "'" + inner + "'";
    }

    return cleaned;
  }

  /**
   * Convert a VBScript string expression with & concatenation to TypeScript.
   * e.g. '"hello " & name & "!"' -> '`hello ${name}!`'
   */
  private convertVbsConcatToTs(value: string): string {
    const parts = value.split(/(?<!&)\s*&(?!&)\s*/);
    const hasInnerSingleQuotes = /"[^"]*'[^"]*"/.test(value);

    if (hasInnerSingleQuotes) {
      // Use template literal to avoid quote conflicts
      let template = '`';
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          const content = trimmed.slice(1, -1).replace(/""/g, '"').replace(/`/g, '\\`');
          template += content;
        } else {
          template += '${' + trimmed + '}';
        }
      }
      template += '`';
      return template;
    }

    // Use + concatenation with single-quoted strings
    const tsParts = parts.map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        const inner = trimmed.slice(1, -1).replace(/'/g, "\\'");
        return "'" + inner + "'";
      }
      return trimmed;
    });
    return tsParts.join(' + ');
  }

  /**
   * Build the comprehensive UFT-to-Playwright mapping table.
   */
  private buildMappingTable(): MappingTable {
    return {
      // ==================== WEB OBJECTS ====================

      Browser: {
        Navigate: {
          playwright: "await page.goto({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 95,
        },
        Close: {
          playwright: 'await page.close()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 90,
        },
        Back: {
          playwright: 'await page.goBack()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 95,
        },
        Forward: {
          playwright: 'await page.goForward()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 95,
        },
        Refresh: {
          playwright: 'await page.reload()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 95,
        },
        FullScreen: {
          playwright: "// Browser FullScreen - handled via viewport\nawait page.setViewportSize({ width: 1920, height: 1080 })",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 70,
        },
        Sync: {
          playwright: "await page.waitForLoadState('networkidle')",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 85,
        },
        ClearCache: {
          playwright: '// ClearCache - clear browser context storage\nawait context.clearCookies()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 70,
          notes: 'Playwright clears cache via context. May need context.clearPermissions() too.',
        },
      },

      Page: {
        Sync: {
          playwright: "await page.waitForLoadState('networkidle')",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 85,
        },
        CheckProperty: {
          playwright: "await expect(page).toHaveTitle(new RegExp({{ARG1}}))",
          isAsync: true,
          imports: ['expect'],
          needsSelector: false,
          confidence: 60,
          notes: 'Property check depends on which property. May need adjustment.',
        },
      },

      WebEdit: {
        Set: {
          playwright: "await page.locator({{SELECTOR}}).fill({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 95,
        },
        SetSecure: {
          playwright: "await page.locator({{SELECTOR}}).fill({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
          notes: 'SetSecure uses encrypted values in UFT. Replace with actual test credential.',
        },
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 95,
        },
        Type: {
          playwright: "await page.locator({{SELECTOR}}).pressSequentially({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        CheckProperty: {
          playwright: "await expect(page.locator({{SELECTOR}})).toHaveAttribute({{ARG0}}, {{ARG1}})",
          isAsync: true,
          imports: ['expect'],
          needsSelector: true,
          confidence: 75,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        WaitProperty: {
          playwright: 'await page.locator({{SELECTOR}}).waitFor({ state: \'visible\', timeout: {{ARG2}} })',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
      },

      WebButton: {
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 95,
        },
        Submit: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
          notes: 'UFT Submit maps to click in Playwright. Form submission is automatic.',
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        CheckProperty: {
          playwright: "await expect(page.locator({{SELECTOR}})).toHaveAttribute({{ARG0}}, {{ARG1}})",
          isAsync: true,
          imports: ['expect'],
          needsSelector: true,
          confidence: 75,
        },
        WaitProperty: {
          playwright: "await page.locator({{SELECTOR}}).waitFor({ state: 'visible', timeout: {{ARG2}} })",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
      },

      WebList: {
        Select: {
          playwright: "await page.locator({{SELECTOR}}).selectOption({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        GetItemsCount: {
          playwright: "await page.locator({{SELECTOR}}).locator('option').count()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
      },

      WebCheckBox: {
        Set: {
          playwright: 'await page.locator({{SELECTOR}}).{{ARG0}}()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
          argTransform: (args: string[]): string[] => {
            const val = (args[0] || '').replace(/"/g, '').trim().toUpperCase();
            return [val === 'OFF' ? 'uncheck' : 'check'];
          },
        },
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        GetROProperty: {
          playwright: 'await page.locator({{SELECTOR}}).isChecked()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
      },

      WebRadioGroup: {
        Select: {
          playwright: 'await page.locator({{SELECTOR}}).locator(`[value=${{{ARG0}}}]`).check()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 75,
        },
      },

      WebTable: {
        GetCellData: {
          playwright: "await page.locator({{SELECTOR}}).locator('tr').nth({{ARG0}}).locator('td').nth({{ARG1}}).textContent()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 75,
          notes: 'UFT table indices are 1-based; Playwright nth() is 0-based. Adjust indices.',
        },
        GetRowCount: {
          playwright: "await page.locator({{SELECTOR}}).locator('tr').count()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        ChildItem: {
          playwright: "await page.locator({{SELECTOR}}).locator('tr').nth({{ARG0}}).locator('td').nth({{ARG1}}).locator({{ARG2}}).click()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 60,
          notes: 'ChildItem mapping varies greatly. Manual review recommended.',
        },
        GetCellProperty: {
          playwright: "await page.locator({{SELECTOR}}).locator('tr').nth({{ARG0}}).locator('td').nth({{ARG1}}).getAttribute({{ARG2}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 65,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 75,
          notes: 'WebTable GetROProperty - property name may need adjustment for Playwright.',
        },
      },

      Link: {
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 95,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
      },

      Image: {
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
      },

      WebElement: {
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        Set: {
          playwright: "await page.locator({{SELECTOR}}).fill({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        Hover: {
          playwright: 'await page.locator({{SELECTOR}}).hover()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        FireEvent: {
          playwright: "await page.locator({{SELECTOR}}).dispatchEvent({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 75,
        },
        DragDrop: {
          playwright: '// TODO: Implement drag and drop\n// await page.locator({{SELECTOR}}).dragTo(page.locator(targetSelector))',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 40,
          notes: 'DragDrop requires manual implementation with target selector.',
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        WaitProperty: {
          playwright: "await page.locator({{SELECTOR}}).waitFor({ state: 'visible', timeout: {{ARG2}} })",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
      },

      Frame: {
        // Frame handling - switch to frame context
        Click: {
          playwright: "await page.frameLocator({{SELECTOR}}).locator('body').click()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 70,
          notes: 'Frame handling in Playwright uses frameLocator. May need adjustment.',
        },
      },

      // ==================== DIALOG OBJECTS ====================

      Dialog: {
        Click: {
          playwright: "page.on('dialog', dialog => dialog.accept())",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 80,
        },
        SetText: {
          playwright: "page.on('dialog', dialog => dialog.accept({{ARG0}}))",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 75,
        },
        Exist: {
          playwright: '// Dialog exist check - use page.on("dialog") event handler',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 60,
        },
      },

      // ==================== UTILITY OBJECTS ====================

      Reporter: {
        ReportEvent: {
          playwright: "// Assertion: {{ARG1}} - {{ARG2}}\nconsole.log(`[${{{ARG0}}}] ${{{ARG1}}}: ` + {{ARG2}})",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 70,
          notes: 'Reporter events can be replaced with test.info() or expect() assertions.',
        },
      },

      Utility: {
        Wait: {
          playwright: 'await page.waitForTimeout({{ARG0}} * 1000)',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 90,
          notes: 'Consider replacing hard waits with waitForSelector or waitForLoadState.',
        },
        MsgBox: {
          playwright: "console.log('MsgBox: ' + {{ARG0}})",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 50,
          notes: 'MsgBox is a debug tool. Remove or convert to console.log in tests.',
        },
        Print: {
          playwright: 'console.log({{ARG0}})',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 85,
        },
        ExecuteFile: {
          playwright: "// Function library '{{ARG0}}' loaded - see helpers/ folder for converted functions",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 80,
          notes: 'ExecuteFile loads a function library. Functions are converted to helpers/ modules.',
        },
        LoadFunctionLibrary: {
          playwright: "// Function library '{{ARG0}}' loaded - see helpers/ folder for converted functions",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 80,
          notes: 'LoadFunctionLibrary loads a function library. Functions are converted to helpers/ modules.',
        },
      },

      // ==================== FUNCTION CALLS ====================
      // VBScript Call statements and standalone function calls
      FunctionCall: {
        _default: {
          playwright: 'await {{METHOD}}(page, {{ARGS}});',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 75,
          notes: 'Function call from library. Import will be auto-generated.',
        },
      },

      SystemUtil: {
        Run: {
          playwright: "await page.goto({{ARG0}})",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 70,
          notes: 'SystemUtil.Run usually opens a URL. Adjust if it launches a desktop app.',
        },
      },

      // ==================== WINDOW/DESKTOP OBJECTS ====================
      // These are typically not convertible to Playwright (web-only)
      // but we provide helpful TODO comments

      Window: {
        Click: {
          playwright: '// TODO: Desktop Window interaction not supported in Playwright\n// Consider using a desktop automation tool or API calls instead\n// Original: {{SELECTOR}}.Click',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
          notes: 'Desktop Window objects cannot be automated with Playwright. Use Electron or API testing.',
        },
        Close: {
          playwright: '// TODO: Desktop Window.Close - not supported in Playwright',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
        },
        Activate: {
          playwright: '// TODO: Desktop Window.Activate - not supported in Playwright',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
        },
      },

      WinButton: {
        Click: {
          playwright: '// TODO: Desktop WinButton.Click - not supported in Playwright\n// Original: {{SELECTOR}}.Click',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
        },
      },

      WinEdit: {
        Set: {
          playwright: "// TODO: Desktop WinEdit.Set - not supported in Playwright\n// Original: {{SELECTOR}}.Set {{ARG0}}",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
        },
      },
    };
  }

  /**
   * Get a list of all supported UFT object types.
   */
  getSupportedObjectTypes(): string[] {
    return Object.keys(this.mappings);
  }

  /**
   * Get all supported methods for a given object type.
   */
  getSupportedMethods(objectType: string): string[] {
    const objectMappings = this.mappings[objectType];
    return objectMappings ? Object.keys(objectMappings) : [];
  }
}
