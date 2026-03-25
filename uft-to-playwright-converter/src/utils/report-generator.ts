/**
 * Report Generator - Creates detailed conversion reports in multiple formats.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ConversionSummary,
  AnalysisResult,
} from '../models/types';
import { logger } from './logger';

export class ReportGenerator {
  /**
   * Generate a JSON conversion report.
   */
  static generateJSON(summary: ConversionSummary, outputPath: string): void {
    const report = {
      generatedAt: new Date().toISOString(),
      tool: 'UFT-to-Playwright Converter',
      summary: {
        totalScripts: summary.totalScripts,
        successful: summary.successfulConversions,
        partial: summary.partialConversions,
        failed: summary.failedConversions,
        totalActions: summary.totalActionsConverted,
        totalWarnings: summary.totalWarnings,
        averageConfidence: `${summary.averageConfidence.toFixed(1)}%`,
        duration: `${(summary.durationMs / 1000).toFixed(1)}s`,
      },
      details: summary.details.map(d => ({
        input: d.inputFile,
        output: d.outputFile,
        status: d.status,
        actions: `${d.actionsConverted}/${d.actionsTotal}`,
        confidence: `${d.confidence.toFixed(1)}%`,
        warnings: d.warnings,
        errors: d.errors,
      })),
    };

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    logger.info(`JSON report written to: ${outputPath}`);
  }

  /**
   * Generate an HTML conversion report.
   */
  static generateHTML(summary: ConversionSummary, outputPath: string): void {
    const successRate = summary.totalScripts > 0
      ? ((summary.successfulConversions / summary.totalScripts) * 100).toFixed(1)
      : '0';

    const rows = summary.details
      .map(d => {
        const statusClass = d.status === 'success' ? 'success' : d.status === 'partial' ? 'warning' : 'error';
        return `
        <tr class="${statusClass}">
          <td>${this.escapeHtml(path.basename(d.inputFile))}</td>
          <td>${this.escapeHtml(path.basename(d.outputFile))}</td>
          <td><span class="badge ${statusClass}">${d.status}</span></td>
          <td>${d.actionsConverted}/${d.actionsTotal}</td>
          <td>${d.confidence.toFixed(1)}%</td>
          <td>${d.warnings.length}</td>
          <td>${d.errors.length > 0 ? this.escapeHtml(d.errors[0]) : '-'}</td>
        </tr>`;
      })
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UFT to Playwright Conversion Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #1a1a1a; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 8px 0; color: #666; font-size: 14px; text-transform: uppercase; }
    .card .value { font-size: 32px; font-weight: bold; color: #1a1a1a; }
    .card.success .value { color: #22c55e; }
    .card.warning .value { color: #f59e0b; }
    .card.error .value { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th { background: #1a1a1a; color: white; padding: 12px 16px; text-align: left; font-size: 13px; text-transform: uppercase; }
    td { padding: 10px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
    tr:hover { background: #f9f9f9; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge.success { background: #dcfce7; color: #166534; }
    .badge.warning { background: #fef3c7; color: #92400e; }
    .badge.error { background: #fee2e2; color: #991b1b; }
    tr.success td:first-child { border-left: 3px solid #22c55e; }
    tr.warning td:first-child { border-left: 3px solid #f59e0b; }
    tr.error td:first-child { border-left: 3px solid #ef4444; }
    .footer { text-align: center; color: #999; margin-top: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>UFT to Playwright Conversion Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>

    <div class="summary">
      <div class="card">
        <h3>Total Scripts</h3>
        <div class="value">${summary.totalScripts}</div>
      </div>
      <div class="card success">
        <h3>Successful</h3>
        <div class="value">${summary.successfulConversions}</div>
      </div>
      <div class="card warning">
        <h3>Partial</h3>
        <div class="value">${summary.partialConversions}</div>
      </div>
      <div class="card error">
        <h3>Failed</h3>
        <div class="value">${summary.failedConversions}</div>
      </div>
    </div>

    <div class="summary">
      <div class="card">
        <h3>Success Rate</h3>
        <div class="value">${successRate}%</div>
      </div>
      <div class="card">
        <h3>Avg Confidence</h3>
        <div class="value">${summary.averageConfidence.toFixed(1)}%</div>
      </div>
      <div class="card">
        <h3>Actions Converted</h3>
        <div class="value">${summary.totalActionsConverted}</div>
      </div>
      <div class="card">
        <h3>Duration</h3>
        <div class="value">${(summary.durationMs / 1000).toFixed(1)}s</div>
      </div>
    </div>

    <h2>Conversion Details</h2>
    <table>
      <thead>
        <tr>
          <th>Source Script</th>
          <th>Output File</th>
          <th>Status</th>
          <th>Actions</th>
          <th>Confidence</th>
          <th>Warnings</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="footer">
      UFT-to-Playwright Converter | Duration: ${(summary.durationMs / 1000).toFixed(1)}s
    </div>
  </div>
</body>
</html>`;

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, html);
    logger.info(`HTML report written to: ${outputPath}`);
  }

  /**
   * Generate an analysis report for pre-conversion assessment.
   */
  static generateAnalysisReport(results: AnalysisResult[], outputPath: string): void {
    const totalScripts = results.length;
    const avgConfidence = results.reduce((sum, r) => sum + r.estimatedConversionConfidence, 0) / totalScripts;
    const totalEffort = results.reduce((sum, r) => sum + r.estimatedEffortMinutes, 0);
    const complexityDist = { low: 0, medium: 0, high: 0, 'very-high': 0 };

    for (const r of results) {
      complexityDist[r.complexity]++;
    }

    const objectTypes: Record<string, number> = {};
    const methods: Record<string, number> = {};
    const unsupported = new Set<string>();

    for (const r of results) {
      for (const [type, count] of Object.entries(r.objectTypes)) {
        objectTypes[type] = (objectTypes[type] || 0) + count;
      }
      for (const [method, count] of Object.entries(r.methodsUsed)) {
        methods[method] = (methods[method] || 0) + count;
      }
      for (const pattern of r.unsupportedPatterns) {
        unsupported.add(pattern);
      }
    }

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalScripts,
        averageConfidence: `${avgConfidence.toFixed(1)}%`,
        estimatedTotalEffort: `${(totalEffort / 60).toFixed(1)} hours`,
        complexityDistribution: complexityDist,
      },
      objectTypeUsage: Object.entries(objectTypes)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count })),
      methodUsage: Object.entries(methods)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([method, count]) => ({ method, count })),
      unsupportedPatterns: Array.from(unsupported),
      scriptDetails: results.map(r => ({
        script: r.scriptName,
        lines: r.totalLines,
        actions: r.actionCount,
        complexity: r.complexity,
        confidence: `${r.estimatedConversionConfidence}%`,
        effort: `${r.estimatedEffortMinutes} min`,
        warnings: r.warnings.length,
      })),
    };

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    logger.info(`Analysis report written to: ${outputPath}`);
  }

  /**
   * Print a summary table to the console.
   */
  static printConsoleSummary(summary: ConversionSummary): void {
    console.log('\n' + '='.repeat(70));
    console.log('  UFT to Playwright Conversion Summary');
    console.log('='.repeat(70));
    console.log(`  Total Scripts:     ${summary.totalScripts}`);
    console.log(`  Successful:        ${summary.successfulConversions}`);
    console.log(`  Partial:           ${summary.partialConversions}`);
    console.log(`  Failed:            ${summary.failedConversions}`);
    console.log(`  Actions Converted: ${summary.totalActionsConverted}`);
    console.log(`  Total Warnings:    ${summary.totalWarnings}`);
    console.log(`  Avg Confidence:    ${summary.averageConfidence.toFixed(1)}%`);
    console.log(`  Duration:          ${(summary.durationMs / 1000).toFixed(1)}s`);
    console.log('='.repeat(70) + '\n');
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
