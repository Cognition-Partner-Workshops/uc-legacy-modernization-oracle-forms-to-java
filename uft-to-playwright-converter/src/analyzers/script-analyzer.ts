/**
 * Script Analyzer - Analyzes UFT scripts before conversion to provide
 * complexity estimates, conversion confidence, and effort projections.
 *
 * Use this for pre-migration assessment of the 800 scripts.
 */

import { UFTScript, AnalysisResult } from '../models/types';
import { logger } from '../utils/logger';

export class ScriptAnalyzer {
  /**
   * Analyze a parsed UFT script and produce an assessment.
   */
  analyze(script: UFTScript): AnalysisResult {
    const objectTypes = this.countObjectTypes(script);
    const methodsUsed = this.countMethods(script);
    const unsupportedPatterns = this.detectUnsupportedPatterns(script);
    const warnings = this.detectWarnings(script);
    const complexity = this.assessComplexity(script);
    const confidence = this.estimateConfidence(script, unsupportedPatterns);
    const effort = this.estimateEffort(script, complexity, confidence);

    const result: AnalysisResult = {
      scriptPath: script.filePath,
      scriptName: script.scriptName,
      totalLines: script.rawContent.split('\n').length,
      actionCount: script.actions.length,
      functionCount: script.functions.length,
      variableCount: script.variables.length,
      dataTableUsage: script.dataTables.length,
      objectTypes,
      methodsUsed,
      complexity,
      estimatedConversionConfidence: confidence,
      warnings,
      unsupportedPatterns,
      estimatedEffortMinutes: effort,
    };

    logger.debug(
      `Analysis: ${script.scriptName} - Complexity: ${complexity}, ` +
      `Confidence: ${confidence}%, Effort: ${effort}min`
    );

    return result;
  }

  /**
   * Count object types used in the script.
   */
  private countObjectTypes(script: UFTScript): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const action of script.actions) {
      counts[action.objectType] = (counts[action.objectType] || 0) + 1;
    }
    return counts;
  }

  /**
   * Count methods used across all actions.
   */
  private countMethods(script: UFTScript): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const action of script.actions) {
      const key = `${action.objectType}.${action.method}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  /**
   * Detect patterns that cannot be automatically converted.
   */
  private detectUnsupportedPatterns(script: UFTScript): string[] {
    const patterns: string[] = [];
    const content = script.rawContent.toLowerCase();

    // Desktop automation objects
    if (content.includes('winbutton') || content.includes('winedit') || content.includes('winlist')) {
      patterns.push('Desktop/Win32 objects (WinButton, WinEdit, WinList) - not supported in Playwright');
    }

    // Java objects
    if (content.includes('javawindow') || content.includes('javabutton') || content.includes('javaedit')) {
      patterns.push('Java AWT/Swing objects - not supported in Playwright');
    }

    // SAP objects
    if (content.includes('sapguisession') || content.includes('sapguiwindow')) {
      patterns.push('SAP GUI objects - not supported in Playwright');
    }

    // Mainframe/Terminal
    if (content.includes('tescreen') || content.includes('tefield')) {
      patterns.push('Terminal Emulator (mainframe) objects - not supported in Playwright');
    }

    // COM/ActiveX
    if (content.includes('createobject')) {
      patterns.push('COM/ActiveX object creation via CreateObject');
    }

    // File system operations
    if (content.includes('filesystemobject') || content.includes('scripting.filesystemobject')) {
      patterns.push('FileSystemObject operations - convert to Node.js fs module');
    }

    // Excel automation
    if (content.includes('excel.application')) {
      patterns.push('Excel COM automation - convert to xlsx/exceljs library');
    }

    // Database connections
    if (content.includes('adodb.connection') || content.includes('adodb.recordset')) {
      patterns.push('ADODB database connections - convert to database client library');
    }

    // Outlook automation
    if (content.includes('outlook.application')) {
      patterns.push('Outlook COM automation - convert to email API/library');
    }

    // WScript.Shell
    if (content.includes('wscript.shell')) {
      patterns.push('WScript.Shell - convert to Node.js child_process');
    }

    // Recovery scenarios
    if (script.recoveryScenarios.length > 0) {
      patterns.push(`Recovery Scenarios (${script.recoveryScenarios.length}) - convert to try/catch or Playwright auto-waiting`);
    }

    // On Error Resume Next
    if (content.includes('on error resume next')) {
      patterns.push('On Error Resume Next - convert to try/catch blocks');
    }

    // Environment variables (UFT-specific)
    if (content.includes('environment(') || content.includes('environment.value(')) {
      patterns.push('UFT Environment variables - convert to process.env or Playwright config');
    }

    // Descriptive Programming
    const descProgCount = (content.match(/micclass\s*:=/gi) || []).length;
    if (descProgCount > 0) {
      patterns.push(`Descriptive Programming (${descProgCount} occurrences) - convert to Playwright selectors`);
    }

    return patterns;
  }

  /**
   * Detect potential warnings/issues in the script.
   */
  private detectWarnings(script: UFTScript): string[] {
    const warnings: string[] = [];
    const content = script.rawContent;

    // Hard-coded waits
    const waitMatches = content.match(/\bWait\s+\d+/gi) || [];
    if (waitMatches.length > 0) {
      warnings.push(`${waitMatches.length} hard-coded Wait statements - replace with Playwright auto-waiting`);
    }

    // SetSecure (encrypted passwords)
    const secureMatches = content.match(/\.SetSecure\s+/gi) || [];
    if (secureMatches.length > 0) {
      warnings.push(`${secureMatches.length} SetSecure calls - need to replace encrypted values with test credentials`);
    }

    // Very long functions
    for (const func of script.functions) {
      const lineCount = func.body.split('\n').length;
      if (lineCount > 100) {
        warnings.push(`Function '${func.name}' is ${lineCount} lines - consider breaking into smaller functions`);
      }
    }

    // Data-driven scripts
    if (script.dataTables.length > 10) {
      warnings.push(`Heavy DataTable usage (${script.dataTables.length} references) - need to convert to Playwright test data strategy`);
    }

    // Multiple browser instances
    const browserOpenCount = (content.match(/SystemUtil\.Run/gi) || []).length;
    if (browserOpenCount > 1) {
      warnings.push(`${browserOpenCount} SystemUtil.Run calls - may need multiple browser contexts`);
    }

    // Image-based identification
    if (content.toLowerCase().includes('insight') || content.toLowerCase().includes('bitmap')) {
      warnings.push('Image/bitmap-based object identification detected - not supported in Playwright');
    }

    return warnings;
  }

  /**
   * Assess script complexity based on multiple factors.
   */
  private assessComplexity(script: UFTScript): 'low' | 'medium' | 'high' | 'very-high' {
    let score = 0;

    // Line count
    const lineCount = script.rawContent.split('\n').length;
    if (lineCount > 500) score += 3;
    else if (lineCount > 200) score += 2;
    else if (lineCount > 50) score += 1;

    // Action count
    if (script.actions.length > 100) score += 3;
    else if (script.actions.length > 50) score += 2;
    else if (script.actions.length > 20) score += 1;

    // Function count (custom logic)
    if (script.functions.length > 10) score += 2;
    else if (script.functions.length > 5) score += 1;

    // DataTable usage
    if (script.dataTables.length > 10) score += 2;
    else if (script.dataTables.length > 0) score += 1;

    // Control flow complexity (nested logic in raw content)
    const ifCount = (script.rawContent.match(/\bIf\b/gi) || []).length;
    const loopCount = (script.rawContent.match(/\b(For|While|Do)\b/gi) || []).length;
    if (ifCount + loopCount > 20) score += 3;
    else if (ifCount + loopCount > 10) score += 2;
    else if (ifCount + loopCount > 5) score += 1;

    // Unique object types (more types = more complexity)
    const uniqueTypes = new Set(script.actions.map(a => a.objectType)).size;
    if (uniqueTypes > 8) score += 2;
    else if (uniqueTypes > 4) score += 1;

    if (score >= 10) return 'very-high';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Estimate conversion confidence (0-100%).
   */
  private estimateConfidence(script: UFTScript, unsupportedPatterns: string[]): number {
    let confidence = 100;

    // Reduce for unsupported patterns
    confidence -= unsupportedPatterns.length * 10;

    // Reduce for desktop objects
    const desktopActions = script.actions.filter(a =>
      ['Window', 'WinButton', 'WinEdit', 'WinList', 'WinObject',
       'JavaWindow', 'JavaButton', 'JavaEdit',
       'SwfWindow', 'WpfWindow'].includes(a.objectType)
    ).length;
    if (desktopActions > 0) {
      const desktopRatio = desktopActions / Math.max(script.actions.length, 1);
      confidence -= desktopRatio * 60;
    }

    // Reduce for unknown methods
    const knownMethods = new Set([
      'Set', 'Click', 'Select', 'Navigate', 'Close', 'Back', 'Forward',
      'Refresh', 'Sync', 'GetROProperty', 'CheckProperty', 'Exist',
      'WaitProperty', 'SetSecure', 'Type', 'Submit', 'Hover',
      'GetCellData', 'GetRowCount', 'FireEvent', 'DragDrop',
      'ReportEvent', 'Wait', 'Run', 'GetItemsCount',
    ]);

    const unknownMethods = script.actions.filter(a => !knownMethods.has(a.method)).length;
    if (unknownMethods > 0) {
      const unknownRatio = unknownMethods / Math.max(script.actions.length, 1);
      confidence -= unknownRatio * 30;
    }

    // Reduce for heavy COM usage
    const comUsage = (script.rawContent.match(/CreateObject/gi) || []).length;
    if (comUsage > 0) confidence -= Math.min(comUsage * 5, 30);

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Estimate conversion effort in minutes.
   * Includes automated conversion + manual review/fix time.
   */
  private estimateEffort(
    script: UFTScript,
    complexity: string,
    confidence: number
  ): number {
    // Base effort by complexity
    const baseEffort: Record<string, number> = {
      'low': 5,
      'medium': 15,
      'high': 30,
      'very-high': 60,
    };

    let effort = baseEffort[complexity] || 15;

    // Add time for manual review based on confidence
    // Lower confidence = more manual work
    const manualFactor = (100 - confidence) / 100;
    effort += effort * manualFactor * 2;

    // Add time for function conversion
    effort += script.functions.length * 3;

    // Add time for DataTable migration
    effort += script.dataTables.length * 2;

    return Math.round(effort);
  }
}
