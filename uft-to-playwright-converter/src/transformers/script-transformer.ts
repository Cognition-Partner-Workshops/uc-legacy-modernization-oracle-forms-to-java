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

    const testBlocks = this.createTestBlocks(script);
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
  private createTestBlocks(script: UFTScript): PlaywrightTestBlock[] {
    const blocks: PlaywrightTestBlock[] = [];
    let currentActions: PlaywrightAction[] = [];
    let currentAssertions: PlaywrightAction[] = [];
    const blockName = script.scriptName;
    let blockIndex = 1;

    for (const action of script.actions) {
      // Check if this action is an assertion/verification
      const isAssertion = this.isAssertionAction(action);

      // Resolve selector from object repository
      const selector = this.resolveSelector(action);

      // Map the UFT action to Playwright
      const pwAction = this.actionMapper.map(action, selector);

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
   */
  transformVariables(variables: UFTVariable[]): string[] {
    return variables.map(v => {
      const keyword = v.type === 'Const' ? 'const' : 'let';
      if (v.initialValue) {
        const tsValue = this.vbToTsValue(v.initialValue);
        return `${keyword} ${this.toCamelCase(v.name)} = ${tsValue};`;
      }
      return `${keyword} ${this.toCamelCase(v.name)}: string;`;
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

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

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
      tsLine = tsLine.replace(/\b<>\b/g, '!==');
      tsLine = tsLine.replace(/\bMod\b/gi, '%');

      // String concatenation (& to +)
      tsLine = tsLine.replace(/\s+&\s+/g, ' + ');

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

    // Already quoted strings
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.replace(/"/g, "'").replace(/^'|'$/g, "'");
    }

    // Everything else - treat as variable reference
    return this.toCamelCase(value);
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
