/**
 * VBScript Parser - Parses UFT/QTP VBScript test scripts into structured AST.
 *
 * Handles:
 * - Object method calls (Browser().Page().WebEdit().Set)
 * - Variable declarations (Dim, Set)
 * - Function/Sub definitions
 * - DataTable references
 * - Comments and descriptions
 * - Control flow (If/Then/Else, For/Next, Do/Loop, While/Wend, Select Case)
 * - Error handling (On Error Resume Next)
 * - Descriptive Programming
 */

import {
  UFTAction,
  UFTScript,
  UFTVariable,
  UFTFunction,
  UFTDataTable,
} from '../models/types';
import { logger } from '../utils/logger';

export class VBScriptParser {
  private lines: string[] = [];
  private currentLine = 0;

  /**
   * Parse a complete UFT VBScript file into structured data.
   */
  parse(content: string, filePath: string): UFTScript {
    this.lines = content.split(/\r?\n/);
    this.currentLine = 0;

    const scriptName = filePath
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      ?.replace(/\.(vbs|txt|qfl|mts)$/i, '') || 'UnknownScript';

    const script: UFTScript = {
      filePath,
      scriptName,
      actions: [],
      variables: [],
      functions: [],
      dataTables: [],
      objectRepository: [],
      recoveryScenarios: [],
      comments: [],
      rawContent: content,
    };

    logger.info(`Parsing script: ${scriptName} (${this.lines.length} lines)`);

    for (this.currentLine = 0; this.currentLine < this.lines.length; this.currentLine++) {
      const line = this.lines[this.currentLine].trim();
      const lineNum = this.currentLine + 1;

      if (!line || line === '') continue;

      // Skip line continuations (handle them with previous line)
      if (line === '_') continue;

      // Resolve line continuations
      const rawFullLine = this.resolveLineContinuation(this.currentLine);

      // Comments
      if (rawFullLine.startsWith("'") || rawFullLine.toUpperCase().startsWith('REM ')) {
        script.comments.push(rawFullLine);
        continue;
      }

      // Strip inline VBScript comments (  'comment after code)
      const fullLine = this.stripInlineComment(rawFullLine);

      // Variable declarations
      const variables = this.parseVariables(fullLine, lineNum);
      if (variables.length > 0) {
        script.variables.push(...variables);
        continue;
      }

      // Function/Sub definitions
      if (this.isFunctionStart(fullLine)) {
        const func = this.parseFunction(lineNum);
        if (func) script.functions.push(func);
        continue;
      }

      // DataTable references
      const dataTableRefs = this.parseDataTableReferences(fullLine, lineNum);
      script.dataTables.push(...dataTableRefs);

      // UFT object actions (Browser, Dialog, Window, SwfWindow, etc.)
      const action = this.parseAction(fullLine, lineNum);
      if (action) {
        script.actions.push(action);
        continue;
      }

      // Recovery scenario registration
      if (fullLine.toUpperCase().includes('RECOVERY')) {
        script.recoveryScenarios.push(fullLine);
      }
    }

    logger.info(
      `Parsed ${script.actions.length} actions, ${script.functions.length} functions, ` +
      `${script.variables.length} variables from ${scriptName}`
    );

    return script;
  }

  /**
   * Resolve VBScript line continuations (lines ending with _)
   */
  private resolveLineContinuation(startLine: number): string {
    let result = this.lines[startLine].trim();

    while (result.endsWith(' _') || result.endsWith('_')) {
      result = result.replace(/\s*_$/, '');
      startLine++;
      if (startLine < this.lines.length) {
        this.currentLine = startLine;
        result += ' ' + this.lines[startLine].trim();
      } else {
        break;
      }
    }

    return result;
  }

  /**
   * Parse variable declarations (Dim, Set, Const).
   * Returns an array to handle Dim with multiple comma-separated variables.
   */
  private parseVariables(line: string, lineNumber: number): UFTVariable[] {
    // Dim varName, varName2
    const dimMatch = line.match(/^\s*Dim\s+(.+)/i);
    if (dimMatch) {
      const names = dimMatch[1].split(',').map(n => n.trim()).filter(n => n.length > 0);
      return names.map(name => ({
        name,
        type: 'Variant' as const,
        scope: 'local' as const,
        lineNumber,
      }));
    }

    // Set varName = ...
    const setMatch = line.match(/^\s*Set\s+(\w+)\s*=\s*(.+)/i);
    if (setMatch) {
      return [{
        name: setMatch[1],
        type: 'Object',
        scope: 'local',
        initialValue: setMatch[2].trim(),
        lineNumber,
      }];
    }

    // Const NAME = value
    const constMatch = line.match(/^\s*Const\s+(\w+)\s*=\s*(.+)/i);
    if (constMatch) {
      return [{
        name: constMatch[1],
        type: 'Const',
        scope: 'global',
        initialValue: constMatch[2].trim(),
        lineNumber,
      }];
    }

    // Simple assignment: varName = value (not Set, not comparison in If)
    const assignMatch = line.match(/^(\w+)\s*=\s*(.+)/i);
    if (assignMatch && !this.isControlFlow(line) && !this.isObjectCall(line)) {
      return [{
        name: assignMatch[1],
        type: 'Variant',
        scope: 'local',
        initialValue: assignMatch[2].trim(),
        lineNumber,
      }];
    }

    return [];
  }

  /**
   * Check if a line starts a Function or Sub definition
   */
  private isFunctionStart(line: string): boolean {
    return /^\s*(Public\s+|Private\s+)?(Function|Sub)\s+/i.test(line);
  }

  /**
   * Parse a Function or Sub definition, including its body
   */
  private parseFunction(startLineNumber: number): UFTFunction | null {
    const startLine = this.lines[this.currentLine].trim();
    const match = startLine.match(
      /^\s*(?:Public\s+|Private\s+)?(Function|Sub)\s+(\w+)\s*\(?(.*?)\)?\s*$/i
    );

    if (!match) return null;

    const funcType = match[1] as 'Function' | 'Sub';
    const funcName = match[2];
    const params = match[3]
      ? match[3].split(',').map(p => p.trim()).filter(Boolean)
      : [];

    // Collect body until End Function/Sub
    const bodyLines: string[] = [];
    const endPattern = new RegExp(`^\\s*End\\s+${funcType}\\s*$`, 'i');

    this.currentLine++;
    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine].trim();
      if (endPattern.test(line)) break;
      bodyLines.push(line);
      this.currentLine++;
    }

    return {
      name: funcName,
      type: funcType,
      parameters: params,
      body: bodyLines.join('\n'),
      lineNumber: startLineNumber,
    };
  }

  /**
   * Parse DataTable references from a line
   */
  private parseDataTableReferences(line: string, lineNumber: number): UFTDataTable[] {
    const refs: UFTDataTable[] = [];

    // DataTable("column", dtGlobalSheet)
    // DataTable.Value("column", "sheet")
    // DataTable("column", "sheet")
    const pattern = /DataTable(?:\.Value)?\s*\(\s*"([^"]+)"\s*(?:,\s*(?:"([^"]+)"|(\w+)))?\s*\)/gi;
    let match;

    while ((match = pattern.exec(line)) !== null) {
      refs.push({
        columnName: match[1],
        sheetName: match[2] || match[3] || 'Global',
        lineNumber,
        rawExpression: match[0],
      });
    }

    return refs;
  }

  /**
   * Parse a UFT object action from a line of code.
   * Handles patterns like:
   *   Browser("name").Page("name").WebEdit("name").Set "value"
   *   Window("name").WinButton("name").Click
   *   Browser("name").Page("name").WebTable("name").GetCellData(row, col)
   */
  parseAction(line: string, lineNumber: number): UFTAction | null {
    // Detect assignment pattern: varName = Browser(...)...
    // Extract the variable name if present, and parse the RHS as the action
    let assignTo: string | undefined;
    let actionLine = line;
    const assignMatch = line.match(/^(\w+)\s*=\s*((?:Browser|Dialog|Window|SwfWindow|JavaWindow|WpfWindow)\s*\(.+)/i);
    if (assignMatch) {
      assignTo = assignMatch[1];
      actionLine = assignMatch[2];
    }

    // Match UFT object hierarchy patterns
    // e.g., Browser("B").Page("P").WebEdit("E").Set "value"
    const objectPattern =
      /^(?:.*?\b)?(Browser|Dialog|Window|SwfWindow|JavaWindow|WpfWindow)\s*\(\s*"([^"]*)"\s*\)/i;

    if (!objectPattern.test(actionLine)) {
      // Also try descriptive programming: Browser("micclass:=Browser")
      const descProgPattern =
        /^(?:.*?\b)?(Browser|Dialog|Window|SwfWindow|JavaWindow|WpfWindow)\s*\(\s*"(\w+:=.*?)"\s*\)/i;
      if (!descProgPattern.test(actionLine)) {
        // Check for standalone object methods like Reporter.ReportEvent, SystemUtil, etc.
        return this.parseUtilityAction(line, lineNumber);
      }
    }

    // Extract the full object chain and final method call
    const chainParts = this.parseObjectChain(actionLine);
    if (!chainParts || chainParts.length === 0) return null;

    const lastPart = chainParts[chainParts.length - 1];
    const parentParts = chainParts.slice(0, -1);

    // Extract the object type and name from the last chain element
    const objMatch = lastPart.match(/^(\w+)\s*\(\s*"([^"]*)"\s*\)/);
    const objectType = objMatch ? objMatch[1] : lastPart.split('.')[0];
    const objectName = objMatch ? objMatch[2] : '';

    // Extract method and arguments from the last element
    // Handles both parenthesized args: .Exist(10), .GetCellData(1, 2)
    // and space-separated args: .Set "value"
    const methodWithParenMatch = lastPart.match(/\.(\w+)\(([^)]*)\)/);
    const methodWithSpaceMatch = lastPart.match(/\.(\w+)(?:\s+(.*))?$/);
    let method: string;
    let args: string[];

    if (methodWithParenMatch) {
      method = methodWithParenMatch[1];
      args = methodWithParenMatch[2] ? this.parseArguments(methodWithParenMatch[2]) : [];
    } else if (methodWithSpaceMatch) {
      method = methodWithSpaceMatch[1];
      args = methodWithSpaceMatch[2] ? this.parseArguments(methodWithSpaceMatch[2]) : [];
    } else {
      method = 'Click'; // Default for bare object references
      args = [];
    }

    return {
      lineNumber,
      objectType,
      objectName,
      method,
      arguments: args,
      rawLine: line,
      parentObject: parentParts.length > 0 ? parentParts.join('.') : undefined,
      assignTo,
    };
  }

  /**
   * Parse the object chain from a UFT line.
   * "Browser("B").Page("P").WebEdit("E").Set "val""
   * => ["Browser(\"B\")", "Page(\"P\")", "WebEdit(\"E\").Set \"val\""]
   */
  private parseObjectChain(line: string): string[] | null {
    const parts: string[] = [];

    // Known UFT methods that take parenthesized arguments and should NOT
    // be treated as object segments in the chain.
    const methodNames = new Set([
      'GetROProperty', 'CheckProperty', 'WaitProperty',
      'GetCellData', 'GetCellProperty', 'ChildItem',
      'Exist', 'GetItemsCount', 'GetRowCount',
      'SetSecure', 'FireEvent',
    ]);

    // Match each ObjectType("Name") segment
    const segmentPattern = /(\w+)\s*\(\s*"([^"]*)"\s*\)/g;
    let match;
    let lastIndex = 0;

    while ((match = segmentPattern.exec(line)) !== null) {
      // If this segment name is a known method, treat it as a method call
      // on the previous object rather than a new object segment
      if (methodNames.has(match[1])) {
        // Append as ".MethodName(...)" to the last part
        if (parts.length > 0) {
          const methodAndRest = line.substring(match.index - 1); // include the dot
          parts[parts.length - 1] += methodAndRest.substring(0, match[0].length + 1);
          lastIndex = match.index + match[0].length;
        }
        break; // Method calls are always at the end of the chain
      }
      parts.push(match[0]);
      lastIndex = match.index + match[0].length;
    }

    if (parts.length === 0) return null;

    // Append any trailing method call to the last part
    const remainder = line.substring(lastIndex).trim();
    if (remainder.startsWith('.')) {
      parts[parts.length - 1] += remainder;
    }

    return parts;
  }

  /**
   * Parse utility/standalone actions like Reporter, SystemUtil, Wait, etc.
   */
  private parseUtilityAction(line: string, lineNumber: number): UFTAction | null {
    // Reporter.ReportEvent micPass, "Step", "Description"
    // Support both simple strings and concatenated expressions in the third argument
    const reporterMatch = line.match(
      /Reporter\.ReportEvent\s+(mic\w+)\s*,\s*"([^"]*)"\s*,\s*(.+)/i
    );
    if (reporterMatch) {
      return {
        lineNumber,
        objectType: 'Reporter',
        objectName: 'Reporter',
        method: 'ReportEvent',
        arguments: [reporterMatch[1], '"' + reporterMatch[2] + '"', reporterMatch[3].trim()],
        rawLine: line,
      };
    }

    // Wait N
    const waitMatch = line.match(/^\s*Wait\s+(\d+)/i);
    if (waitMatch) {
      return {
        lineNumber,
        objectType: 'Utility',
        objectName: 'Wait',
        method: 'Wait',
        arguments: [waitMatch[1]],
        rawLine: line,
      };
    }

    // SystemUtil.Run "application"
    const sysUtilMatch = line.match(/SystemUtil\.Run\s+("[^"]*")/i);
    if (sysUtilMatch) {
      return {
        lineNumber,
        objectType: 'SystemUtil',
        objectName: 'SystemUtil',
        method: 'Run',
        arguments: [sysUtilMatch[1]],
        rawLine: line,
      };
    }

    // MsgBox
    const msgBoxMatch = line.match(/MsgBox\s+(.*)/i);
    if (msgBoxMatch) {
      return {
        lineNumber,
        objectType: 'Utility',
        objectName: 'MsgBox',
        method: 'MsgBox',
        arguments: [msgBoxMatch[1].trim()],
        rawLine: line,
      };
    }

    // Print / WScript.Echo
    const printMatch = line.match(/(?:Print|WScript\.Echo)\s+(.*)/i);
    if (printMatch) {
      return {
        lineNumber,
        objectType: 'Utility',
        objectName: 'Print',
        method: 'Print',
        arguments: [printMatch[1].trim()],
        rawLine: line,
      };
    }

    // ExecuteFile
    const execFileMatch = line.match(/ExecuteFile\s+("[^"]*")/i);
    if (execFileMatch) {
      return {
        lineNumber,
        objectType: 'Utility',
        objectName: 'ExecuteFile',
        method: 'ExecuteFile',
        arguments: [execFileMatch[1]],
        rawLine: line,
      };
    }

    // LoadFunctionLibrary "path\to\library.vbs"
    const loadLibMatch = line.match(/LoadFunctionLibrary\s+("[^"]*")/i);
    if (loadLibMatch) {
      return {
        lineNumber,
        objectType: 'Utility',
        objectName: 'LoadFunctionLibrary',
        method: 'LoadFunctionLibrary',
        arguments: [loadLibMatch[1]],
        rawLine: line,
      };
    }

    // Call FuncName(args) or Call FuncName
    const callMatch = line.match(/^\s*Call\s+(\w+)\s*(?:\((.*)\))?\s*$/i);
    if (callMatch) {
      const funcArgs = callMatch[2] ? this.parseArguments(callMatch[2]) : [];
      return {
        lineNumber,
        objectType: 'FunctionCall',
        objectName: callMatch[1],
        method: callMatch[1],
        arguments: funcArgs,
        rawLine: line,
      };
    }

    // Standalone function call: FuncName(args) or FuncName "arg" (without Call keyword)
    // Only match if line starts with a word followed by ( and is NOT a known keyword
    const standaloneFuncMatch = line.match(/^\s*(\w+)\s*\((.*)\)\s*$/i);
    if (standaloneFuncMatch) {
      const funcName = standaloneFuncMatch[1];
      const keywords = new Set(['If', 'ElseIf', 'For', 'While', 'Do', 'Select', 'Case', 'Dim', 'Set', 'Const', 'ReDim', 'Exit', 'End', 'Function', 'Sub', 'Public', 'Private']);
      if (!keywords.has(funcName) && !this.isObjectCall(line)) {
        const funcArgs = this.parseArguments(standaloneFuncMatch[2]);
        return {
          lineNumber,
          objectType: 'FunctionCall',
          objectName: funcName,
          method: funcName,
          arguments: funcArgs,
          rawLine: line,
        };
      }
    }

    return null;
  }

  /**
   * Parse method arguments from a string.
   * Handles quoted strings, numbers, and variable references.
   */
  private parseArguments(argString: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let parenDepth = 0;

    for (let i = 0; i < argString.length; i++) {
      const char = argString[i];

      if (char === '"' && argString[i - 1] !== '\\') {
        inQuotes = !inQuotes;
        current += char;
      } else if (!inQuotes && char === '(') {
        parenDepth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        parenDepth--;
        current += char;
      } else if (!inQuotes && parenDepth === 0 && char === ',') {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
  }

  /**
   * Strip inline VBScript comments from a line.
   * In VBScript, ' starts a comment but only when it's outside a string literal.
   * e.g., `itest = icount-1  'script start` → `itest = icount-1`
   * but   `msg = "it's fine"` should NOT strip anything.
   */
  private stripInlineComment(line: string): string {
    let inString = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inString = !inString;
      } else if (char === "'" && !inString) {
        // Found an inline comment — strip it and trailing whitespace
        return line.substring(0, i).trimEnd();
      }
    }
    return line;
  }

  /**
   * Check if a line is a control flow statement (not a variable assignment)
   */
  private isControlFlow(line: string): boolean {
    return /^\s*(If|ElseIf|For|While|Do|Select|Case)\b/i.test(line);
  }

  /**
   * Check if a line contains a UFT object call
   */
  private isObjectCall(line: string): boolean {
    return /\b(Browser|Dialog|Window|Page|Frame|WebEdit|WebButton|WebList)\s*\(/i.test(line);
  }
}
