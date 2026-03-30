/**
 * Script Transformer - Orchestrates the transformation of parsed UFT scripts
 * into Playwright test structures.
 *
 * Handles:
 * - Converting UFT actions to Playwright actions via ActionMapper
 * - Transforming VBScript control flow to TypeScript
 * - Mapping DataTable usage to test data patterns
 * - Generating Page Object references
 * - Handling function/sub conversions
 */

import {
  UFTScript,
  UFTAction,
  UFTFunction,
  UFTVariable,
  UFTDataTable,
  PlaywrightTestFile,
  PlaywrightTestBlock,
  PlaywrightAction,
  ConversionConfig,
  UFTObjectEntry,
} from '../models/types';
import { ActionMapper } from './action-mapper';
import { ObjectRepositoryParser } from '../parsers/object-repository-parser';
import { logger } from '../utils/logger';

export class ScriptTransformer {
  private actionMapper: ActionMapper;
  private objectRepository: Map<string, UFTObjectEntry> = new Map();

  constructor(private config: ConversionConfig) {
    this.actionMapper = new ActionMapper();
  }

  /**
   * Load object repository entries for selector resolution.
   */
  loadObjectRepository(entries: UFTObjectEntry[]): void {
    for (const entry of entries) {
      const key = `${entry.objectType}:${entry.logicalName}`;
      this.objectRepository.set(key, entry);
    }
    logger.info(`Loaded ${entries.length} Object Repository entries`);
  }

  /**
   * Transform a parsed UFT script into a Playwright test file structure.
   */
  transform(script: UFTScript): PlaywrightTestFile {
    logger.info(`Transforming script: ${script.scriptName}`);

    // Collect variable names from Dim/Set/assignment so createTestBlocks knows
    // which variables will be pre-declared (avoids duplicate let declarations)
    const preDeclaredVars = new Set<string>();
    for (const v of script.variables) {
      preDeclaredVars.add(v.name.toLowerCase());
    }

    const testBlocks = this.createTestBlocks(script, preDeclaredVars);

    // Inject VBScript variable declarations (from Dim/Set/assignment) into the first test block
    if (script.variables.length > 0 && testBlocks.length > 0) {
      const varDeclarations = this.transformVariables(script.variables);

      if (varDeclarations.length > 0) {
        const varActions: PlaywrightAction[] = varDeclarations.map(decl => ({
          code: decl,
          imports: [],
          comments: ['// VBScript variable declaration'],
          isAsync: false,
          confidence: 100,
          originalUFTLine: '',
          warnings: [],
        }));
        // Prepend variable declarations to the first test block's actions
        testBlocks[0].actions = [...varActions, ...testBlocks[0].actions];
      }
    }

    const imports = this.collectImports(testBlocks);
    const beforeEach = this.generateBeforeEach(script);
    const afterEach = this.generateAfterEach(script);
    const pageObjectRefs = this.extractPageObjectRefs(script);

    const testFile: PlaywrightTestFile = {
      fileName: this.toFileName(script.scriptName),
      testName: this.toTestName(script.scriptName),
      imports,
      beforeEach,
      afterEach,
      testBlocks,
      pageObjectRefs,
      fixtures: [],
    };

    return testFile;
  }

  /**
   * Create test blocks from UFT script actions.
   * Groups actions into logical test steps.
   */
  private createTestBlocks(script: UFTScript, preDeclaredVars?: Set<string>): PlaywrightTestBlock[] {
    const blocks: PlaywrightTestBlock[] = [];
    let currentActions: PlaywrightAction[] = [];
    let currentAssertions: PlaywrightAction[] = [];
    const blockName = script.scriptName;
    let blockIndex = 1;
    // Track variables assigned via assignTo to avoid const redeclaration
    // Pre-populate with variables from Dim declarations that will be injected
    const assignedVars = new Set<string>(preDeclaredVars || []);

    for (const action of script.actions) {
      // Check if this action is an assertion/verification
      const isAssertion = this.isAssertionAction(action);

      // Resolve selector from object repository
      const selector = this.resolveSelector(action);

      // Map the UFT action to Playwright
      const pwAction = this.actionMapper.map(action, selector);

      // If this action is an assignment (varName = Browser(...)...), wrap the code
      if (action.assignTo && pwAction.code && !pwAction.code.startsWith('//')) {
        const varName = action.assignTo;
        // Strip trailing semicolons from the code before wrapping
        let codeNoSemicolon = pwAction.code.replace(/;\s*$/, '');
        // Avoid double-await: if the code already starts with 'await ', strip it
        const awaitPrefix = codeNoSemicolon.startsWith('await ') ? '' : 'await ';
        // Track declared variables to use let (not const) for re-assignments
        if (!assignedVars.has(varName.toLowerCase())) {
          assignedVars.add(varName.toLowerCase());
          pwAction.code = `let ${varName} = ${awaitPrefix}${codeNoSemicolon};`;
        } else {
          pwAction.code = `${varName} = ${awaitPrefix}${codeNoSemicolon};`;
        }
      }

      // Add original line as comment if configured
      if (this.config.preserveComments) {
        pwAction.comments.push(`// UFT Line ${action.lineNumber}: ${action.rawLine}`);
      }

      if (isAssertion) {
        currentAssertions.push(pwAction);
      } else {
        // Check if this is a natural break point (navigation, new form, etc.)
        if (this.isNewTestBoundary(action) && currentActions.length > 0) {
          blocks.push({
            name: `${blockName} - Step ${blockIndex}`,
            actions: [...currentActions],
            assertions: [...currentAssertions],
          });
          currentActions = [];
          currentAssertions = [];
          blockIndex++;
        }
        currentActions.push(pwAction);
      }
    }

    // Add remaining actions as final block
    if (currentActions.length > 0 || currentAssertions.length > 0) {
      blocks.push({
        name: blockName + (blockIndex > 1 ? ` - Step ${blockIndex}` : ''),
        actions: currentActions,
        assertions: currentAssertions,
      });
    }

    // If no blocks were created, create a single empty block
    if (blocks.length === 0) {
      blocks.push({
        name: blockName,
        actions: [],
        assertions: [],
      });
    }

    return blocks;
  }

  /**
   * Check if a UFT action is an assertion/verification.
   */
  private isAssertionAction(action: UFTAction): boolean {
    const assertionMethods = [
      'CheckProperty',
      'Check',
      'Verify',
      'VerifyProperty',
      'GetROProperty',
      'Exist',
      'GetCellData', // Often used for verification
    ];

    // Reporter.ReportEvent with micPass/micFail is an assertion
    if (action.objectType === 'Reporter' && action.method === 'ReportEvent') {
      return true;
    }

    return assertionMethods.includes(action.method);
  }

  /**
   * Check if a UFT action represents a natural test boundary.
   */
  private isNewTestBoundary(action: UFTAction): boolean {
    // Navigation or new browser/page opening
    if (action.objectType === 'Browser' && ['Navigate'].includes(action.method)) {
      return true;
    }
    if (action.objectType === 'SystemUtil' && action.method === 'Run') {
      return true;
    }
    return false;
  }

  /**
   * Resolve a Playwright selector for a UFT action using the Object Repository.
   */
  private resolveSelector(action: UFTAction): string | undefined {
    if (!action.objectName) return undefined;

    // Look up in object repository
    const key = `${action.objectType}:${action.objectName}`;
    const orEntry = this.objectRepository.get(key);

    if (orEntry) {
      const selector = ObjectRepositoryParser.toPlaywrightSelector(orEntry);
      return `'${selector}'`;
    }

    return undefined;
  }

  /**
   * Collect all unique imports needed by the test blocks.
   */
  private collectImports(blocks: PlaywrightTestBlock[]): string[] {
    const importSet = new Set<string>();

    // Always need test and expect from Playwright
    importSet.add("import { test, expect } from '@playwright/test'");

    for (const block of blocks) {
      for (const action of [...block.actions, ...block.assertions]) {
        for (const imp of action.imports) {
          if (imp === 'expect') {
            // Already included in base import
          } else {
            importSet.add(imp);
          }
        }
      }
    }

    return Array.from(importSet);
  }

  /**
   * Generate beforeEach hooks from script patterns.
   */
  private generateBeforeEach(script: UFTScript): string[] {
    const hooks: string[] = [];

    // Check if script starts with navigation
    const firstNavAction = script.actions.find(
      a => a.objectType === 'Browser' && a.method === 'Navigate'
    );
    if (firstNavAction && firstNavAction.arguments.length > 0) {
      const url = firstNavAction.arguments[0].replace(/"/g, '');
      hooks.push(`await page.goto('${url}');`);
    } else if (this.config.baseUrl) {
      hooks.push(`await page.goto('${this.config.baseUrl}');`);
    }

    return hooks;
  }

  /**
   * Generate afterEach hooks.
   */
  private generateAfterEach(_script: UFTScript): string[] {
    // By default, Playwright handles cleanup via contexts
    return [];
  }

  /**
   * Extract unique page/screen references for Page Object generation.
   */
  private extractPageObjectRefs(script: UFTScript): string[] {
    const refs = new Set<string>();

    for (const action of script.actions) {
      if (action.parentObject) {
        // Extract Page name from parent hierarchy
        const pageMatch = action.parentObject.match(/Page\s*\(\s*"([^"]*)"\s*\)/);
        if (pageMatch) {
          refs.add(pageMatch[1]);
        }
      }
    }

    return Array.from(refs);
  }

  /**
   * Transform VBScript variables to TypeScript declarations.
   * Deduplicates variables — only declares each variable once using the last assigned value.
   */
  transformVariables(variables: UFTVariable[]): string[] {
    // Deduplicate: keep the last assignment for each variable name
    const varMap = new Map<string, UFTVariable>();
    for (const v of variables) {
      const key = v.name.toLowerCase();
      const existing = varMap.get(key);
      // If variable already exists, update with the latest value (if it has one)
      if (existing) {
        if (v.initialValue) {
          varMap.set(key, v);
        }
        // else keep the existing entry (Dim declaration or earlier assignment)
      } else {
        varMap.set(key, v);
      }
    }

    const dedupedVars = Array.from(varMap.values());

    // Sort: declarations without initial values first, then literals (numbers, booleans, strings),
    // then expressions that may reference other variables. This avoids TS2448 "used before declaration".
    const varNames = new Set(dedupedVars.map(v => v.name.toLowerCase()));
    dedupedVars.sort((a, b) => {
      const aRefOther = a.initialValue ? this.referencesOtherVar(a.initialValue, a.name, varNames) : false;
      const bRefOther = b.initialValue ? this.referencesOtherVar(b.initialValue, b.name, varNames) : false;
      if (aRefOther && !bRefOther) return 1;
      if (!aRefOther && bRefOther) return -1;
      return 0;
    });

    return dedupedVars.map(v => {
      const keyword = v.type === 'Const' ? 'const' : 'let';
      if (v.initialValue) {
        const tsValue = this.vbToTsValue(v.initialValue);
        // Use ': any' annotation to accept reassignment from Playwright methods (string|null|number)
        return `${keyword} ${this.toCamelCase(v.name)}: any = ${tsValue};`;
      }
      // Use 'any' type to accept string, number, null from Playwright methods
      return `${keyword} ${this.toCamelCase(v.name)}: any;`;
    });
  }

  /**
   * Transform VBScript functions to TypeScript functions.
   */
  transformFunctions(functions: UFTFunction[]): string[] {
    return functions.map(func => {
      const params = func.parameters
        .map(p => `${this.toCamelCase(p)}: string`)
        .join(', ');

      const asyncPrefix = this.containsAsyncOps(func.body) ? 'async ' : '';
      const returnType = func.type === 'Function' ? ': Promise<string>' : ': Promise<void>';

      const body = this.transformFunctionBody(func.body);

      return [
        `${asyncPrefix}function ${this.toCamelCase(func.name)}(${params})${returnType} {`,
        ...body.map(line => `  ${line}`),
        '}',
      ].join('\n');
    });
  }

  /**
   * Transform DataTable references to test data patterns.
   */
  transformDataTables(dataTables: UFTDataTable[]): string {
    if (dataTables.length === 0) return '';

    const sheets = new Map<string, string[]>();
    for (const dt of dataTables) {
      const cols = sheets.get(dt.sheetName) || [];
      if (!cols.includes(dt.columnName)) {
        cols.push(dt.columnName);
      }
      sheets.set(dt.sheetName, cols);
    }

    const lines: string[] = [
      '// Test data - migrated from UFT DataTable',
      '// Replace with actual test data or use CSV/JSON fixtures',
    ];

    for (const [sheet, columns] of sheets) {
      lines.push(`const ${this.toCamelCase(sheet)}Data = {`);
      for (const col of columns) {
        lines.push(`  ${this.toCamelCase(col)}: 'TODO: Add test data',`);
      }
      lines.push('};');
    }

    return lines.join('\n');
  }

  /**
   * Transform VBScript function body to TypeScript.
   */
  private transformFunctionBody(body: string): string[] {
    const lines = body.split('\n');
    const tsLines: string[] = [];
    const declaredVars = new Set<string>();

    for (const line of lines) {
      let trimmed = line.trim();
      if (!trimmed) continue;

      // Skip comments — add as TS comments
      if (trimmed.startsWith("'")) {
        tsLines.push(`// ${trimmed.substring(1).trim()}`);
        continue;
      }

      // Strip inline VBScript comments ('comment after code)
      trimmed = ScriptTransformer.stripVbsInlineComment(trimmed);
      if (!trimmed) continue;

      // Dim declarations - convert to let with empty string default
      const dimMatch = trimmed.match(/^\s*Dim\s+(.+)/i);
      if (dimMatch) {
        const vars = dimMatch[1].split(',').map((v: string) => v.trim());
        for (const v of vars) {
          tsLines.push(`let ${v} = '';`);
          declaredVars.add(v.toLowerCase());
        }
        continue;
      }

      // Generic assignment - check for duplicates
      const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch && !/^(If|ElseIf|For|While|Do|Select|End|Else|Next|Wend|Loop|Case)\b/i.test(trimmed)) {
        const varName = assignMatch[1];
        let value = assignMatch[2].trim();
        value = ScriptTransformer.convertVbsStringExpr(value);
        value = value.replace(/\bTrue\b/gi, 'true').replace(/\bFalse\b/gi, 'false');
        value = value.replace(/\bNothing\b/gi, 'null');
        if (declaredVars.has(varName.toLowerCase())) {
          tsLines.push(`${varName} = ${value};`);
        } else {
          tsLines.push(`const ${varName} = ${value};`);
          declaredVars.add(varName.toLowerCase());
        }
        continue;
      }

      // Transform common VBScript patterns
      let tsLine = trimmed;

      // If...Then...Else
      tsLine = tsLine.replace(/^If\s+(.+)\s+Then\s*$/i, 'if ($1) {');
      tsLine = tsLine.replace(/^ElseIf\s+(.+)\s+Then\s*$/i, '} else if ($1) {');
      tsLine = tsLine.replace(/^Else\s*$/i, '} else {');
      tsLine = tsLine.replace(/^End If\s*$/i, '}');

      // For...Next
      tsLine = tsLine.replace(
        /^For\s+(\w+)\s*=\s*(\w+)\s+To\s+(\w+)/i,
        'for (let $1 = $2; $1 <= $3; $1++)'
      );
      tsLine = tsLine.replace(/^Next\s*$/i, '}');

      // While...Wend
      tsLine = tsLine.replace(/^While\s+(.+)/i, 'while ($1) {');
      tsLine = tsLine.replace(/^Wend\s*$/i, '}');

      // Do While...Loop
      tsLine = tsLine.replace(/^Do\s+While\s+(.+)/i, 'while ($1) {');
      tsLine = tsLine.replace(/^Loop\s*$/i, '}');

      // Select Case
      tsLine = tsLine.replace(/^Select\s+Case\s+(.+)/i, 'switch ($1) {');
      tsLine = tsLine.replace(/^Case\s+"([^"]+)"/i, "case '$1':");
      tsLine = tsLine.replace(/^Case\s+(\w+)/i, 'case $1:');
      tsLine = tsLine.replace(/^Case\s+Else/i, 'default:');
      tsLine = tsLine.replace(/^End\s+Select/i, '}');

      // VBScript operators
      tsLine = tsLine.replace(/\bAnd\b/gi, '&&');
      tsLine = tsLine.replace(/\bOr\b/gi, '||');
      tsLine = tsLine.replace(/\bNot\b/gi, '!');
      tsLine = tsLine.replace(/<>/g, '!==');
      tsLine = tsLine.replace(/\bMod\b/gi, '%');
      tsLine = tsLine.replace(/\bIs\b/gi, '===');
      tsLine = tsLine.replace(/\bTrue\b/gi, 'true').replace(/\bFalse\b/gi, 'false');
      tsLine = tsLine.replace(/([^=!<>])=([^=])/g, '$1===$2');
      tsLine = tsLine.replace(/\\/g, '/');
      tsLine = tsLine.replace(/\^/g, '**');

      // Convert VBS string expressions (handle & concatenation and strings with single quotes)
      tsLine = ScriptTransformer.convertVbsStringExpr(tsLine);

      tsLines.push(tsLine);
    }

    return tsLines;
  }

  /**
   * Convert VBScript value to TypeScript equivalent.
   */
  private vbToTsValue(value: string): string {
    // Boolean
    if (value.toLowerCase() === 'true') return 'true';
    if (value.toLowerCase() === 'false') return 'false';

    // Nothing/Null
    if (value.toLowerCase() === 'nothing' || value.toLowerCase() === 'null') return 'null';
    if (value.toLowerCase() === 'empty') return "''";

    // Numbers
    if (/^-?\d+(\.\d+)?$/.test(value)) return value;

    // String expressions (handle & concatenation and strings with single quotes)
    if (value.includes('"')) {
      return ScriptTransformer.convertVbsStringExpr(value);
    }

    // Arithmetic/complex expressions — if it contains operators, parentheses, or spaces,
    // pass through as-is (not a simple variable name)
    if (/[+\-*\/\\\s()><!=]/.test(value)) {
      // Convert VBScript operators
      let expr = value;
      expr = expr.replace(/\bAnd\b/gi, '&&');
      expr = expr.replace(/\bOr\b/gi, '||');
      expr = expr.replace(/\bNot\b/gi, '!');
      expr = expr.replace(/\bMod\b/gi, '%');
      expr = expr.replace(/<>/g, '!==');
      expr = expr.replace(/\bIs\b/gi, '===');
      expr = expr.replace(/\\/g, '/');
      expr = expr.replace(/\^/g, '**');
      return expr;
    }

    // Simple variable reference
    return this.toCamelCase(value);
  }

  /**
   * Convert a VBScript string expression to TypeScript.
   * Handles & concatenation and strings containing single quotes (e.g., SQL queries).
   */
  static convertVbsStringExpr(value: string): string {
    // Support & with or without surrounding spaces, but not && (which is converted from VBS And)
    const concatPattern = /(?<!&)\s*&(?!&)\s*/;
    const hasConcatenation = concatPattern.test(value);
    const hasInnerSingleQuotes = /"[^"]*'[^"]*"/.test(value);

    if (hasConcatenation && hasInnerSingleQuotes) {
      // Convert to template literal to avoid quote conflicts
      const parts = value.split(/(?<!&)\s*&(?!&)\s*/);
      let template = '`';
      for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.startsWith('"') && trimmedPart.endsWith('"')) {
          const content = trimmedPart.slice(1, -1).replace(/""/g, '"');
          template += content.replace(/`/g, '\\`');
        } else {
          template += '${' + trimmedPart + '}';
        }
      }
      template += '`';
      return template;
    }

    if (hasConcatenation) {
      value = value.replace(/(?<!&)\s*&(?!&)\s*/g, ' + ');
      // Replace VBS double-quoted strings with single-quoted, handling "" escape sequences
      value = value.replace(/"((?:[^"]|"")*)"/g, (_, inner) => {
        const unescaped = inner.replace(/""/g, '"');
        return "'" + unescaped.replace(/'/g, "\\'") + "'";
      });
      return value;
    }

    if (hasInnerSingleQuotes) {
      // Use template literal to safely handle single quotes without concatenation
      value = value.replace(/"((?:[^"]|"")*)"/g, (_, inner) => {
        const unescaped = inner.replace(/""/g, '"');
        return '`' + unescaped.replace(/`/g, '\\`') + '`';
      });
      return value;
    }

    // Replace VBS double-quoted strings with single-quoted, handling "" escape sequences
    value = value.replace(/"((?:[^"]|"")*)"/g, (_, inner) => {
      const unescaped = inner.replace(/""/g, '"');
      return "'" + unescaped.replace(/'/g, "\\'") + "'";
    });
    return value;
  }

  /**
   * Check if a VBScript initial value expression references another variable
   * from the same variable set (excluding itself).
   */
  private referencesOtherVar(value: string, ownName: string, varNames: Set<string>): boolean {
    // Extract identifiers from the expression
    const identifiers = value.match(/\b[a-zA-Z_]\w*\b/g) || [];
    for (const id of identifiers) {
      if (id.toLowerCase() !== ownName.toLowerCase() && varNames.has(id.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Strip inline VBScript comments from a line.
   * In VBScript, ' starts a comment when outside a string literal.
   */
  static stripVbsInlineComment(line: string): string {
    let inString = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inString = !inString;
      } else if (char === "'" && !inString) {
        return line.substring(0, i).trimEnd();
      }
    }
    return line;
  }

  /**
   * Check if function body contains async operations.
   */
  private containsAsyncOps(body: string): boolean {
    return /\b(Browser|Page|WebEdit|WebButton|WebList|WebTable|WebElement|Dialog|Wait)\b/i.test(body);
  }

  /**
   * Convert a UFT script name to a TypeScript file name.
   */
  private toFileName(scriptName: string): string {
    return scriptName
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() + '.spec.ts';
  }

  /**
   * Convert a UFT script name to a test name.
   */
  private toTestName(scriptName: string): string {
    return scriptName
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase();
  }

  /**
   * Convert a name to camelCase.
   */
  private toCamelCase(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }
}
