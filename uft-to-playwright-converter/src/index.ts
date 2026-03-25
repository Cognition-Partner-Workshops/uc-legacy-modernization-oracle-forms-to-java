#!/usr/bin/env node
/**
 * UFT to Playwright Converter - CLI Entry Point
 *
 * Commands:
 *   convert  - Convert UFT scripts to Playwright tests
 *   analyze  - Analyze UFT scripts without converting (pre-migration assessment)
 *
 * Usage:
 *   npx uft2playwright convert --input ./uft-scripts --output ./playwright-tests
 *   npx uft2playwright analyze --input ./uft-scripts --output ./analysis-report
 */

import { Command } from 'commander';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { ConverterEngine } from './converter-engine';
import { ConversionConfig } from './models/types';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('uft2playwright')
  .description('Convert UFT/QTP VBScript test scripts to Playwright TypeScript tests')
  .version('1.0.0');

// ==================== CONVERT command ====================
program
  .command('convert')
  .description('Convert UFT scripts to Playwright test files')
  .requiredOption('-i, --input <dir>', 'Input directory containing UFT scripts')
  .requiredOption('-o, --output <dir>', 'Output directory for Playwright tests')
  .option('-c, --config <file>', 'Path to YAML/JSON config file')
  .option('--base-url <url>', 'Base URL for the application under test', 'http://localhost:3000')
  .option('--browsers <browsers>', 'Comma-separated list of browsers', 'chromium')
  .option('--no-page-objects', 'Skip Page Object generation')
  .option('--no-fixtures', 'Skip fixture generation')
  .option('--preserve-comments', 'Include original UFT lines as comments', true)
  .option('--parallel', 'Enable parallel test execution', false)
  .option('--retries <n>', 'Number of test retries', '2')
  .option('--timeout <ms>', 'Action timeout in milliseconds', '30000')
  .option('--screenshot-on-failure', 'Capture screenshots on failure', true)
  .option('--video-on-failure', 'Record video on failure', false)
  .option('--trace-on-failure', 'Record trace on failure', true)
  .option('--or-path <dir>', 'Path to Object Repository files')
  .option('--data-path <dir>', 'Path to external test data files')
  .option('--mapping-overrides <file>', 'Path to custom mapping overrides YAML')
  .option('--report-format <format>', 'Report format: html, json, junit, list', 'html')
  .action(async (options) => {
    try {
      const config = buildConfig(options);
      const engine = new ConverterEngine(config);
      const summary = await engine.convert();

      if (summary.failedConversions > 0) {
        logger.warn(`${summary.failedConversions} scripts failed to convert. Check the report for details.`);
      }

      console.log(`\nConversion report: ${path.join(config.outputDir, 'reports', 'conversion-report.html')}`);
      console.log(`Output directory: ${config.outputDir}\n`);

      process.exit(summary.failedConversions > 0 ? 1 : 0);
    } catch (error) {
      logger.error(`Conversion failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// ==================== ANALYZE command ====================
program
  .command('analyze')
  .description('Analyze UFT scripts without converting (pre-migration assessment)')
  .requiredOption('-i, --input <dir>', 'Input directory containing UFT scripts')
  .option('-o, --output <dir>', 'Output directory for analysis report', './analysis-output')
  .action(async (options) => {
    try {
      const config = buildConfig({
        ...options,
        output: options.output || './analysis-output',
        baseUrl: 'http://localhost:3000',
        browsers: 'chromium',
        preserveComments: true,
        parallel: false,
        retries: '0',
        timeout: '30000',
        screenshotOnFailure: false,
        videoOnFailure: false,
        traceOnFailure: false,
        reportFormat: 'json',
      });

      const engine = new ConverterEngine(config);
      const results = await engine.analyze();

      const totalEffort = results.reduce((s, r) => s + r.estimatedEffortMinutes, 0);
      console.log(`\nEstimated total effort: ${(totalEffort / 60).toFixed(1)} hours`);
      console.log(`Analysis report: ${path.join(config.outputDir, 'reports', 'analysis-report.json')}\n`);
    } catch (error) {
      logger.error(`Analysis failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Build a ConversionConfig from CLI options and optional config file.
 */
function buildConfig(options: Record<string, unknown>): ConversionConfig {
  // Start with defaults
  let config: ConversionConfig = {
    inputDir: path.resolve(options.input as string),
    outputDir: path.resolve(options.output as string),
    language: 'typescript',
    testRunner: 'playwright-test',
    generatePageObjects: options.pageObjects !== false,
    generateFixtures: options.fixtures !== false,
    preserveComments: options.preserveComments as boolean ?? true,
    baseUrl: (options.baseUrl as string) || 'http://localhost:3000',
    browsers: ((options.browsers as string) || 'chromium').split(',').map(b => b.trim()),
    parallel: options.parallel as boolean ?? false,
    retries: parseInt(options.retries as string || '2', 10),
    timeout: parseInt(options.timeout as string || '30000', 10),
    screenshotOnFailure: options.screenshotOnFailure as boolean ?? true,
    videoOnFailure: options.videoOnFailure as boolean ?? false,
    traceOnFailure: options.traceOnFailure as boolean ?? true,
    objectRepositoryPath: options.orPath as string | undefined,
    dataTablePath: options.dataPath as string | undefined,
    mappingOverridesPath: options.mappingOverrides as string | undefined,
    reportFormat: (options.reportFormat as 'html' | 'json' | 'junit' | 'list') || 'html',
  };

  // Merge with config file if provided
  if (options.config) {
    const configFile = path.resolve(options.config as string);
    if (fs.existsSync(configFile)) {
      const fileContent = fs.readFileSync(configFile, 'utf8');
      const fileConfig = configFile.endsWith('.json')
        ? JSON.parse(fileContent)
        : yaml.load(fileContent) as Record<string, unknown>;

      config = { ...config, ...fileConfig } as ConversionConfig;
      logger.info(`Loaded config from: ${configFile}`);
    } else {
      logger.warn(`Config file not found: ${configFile}`);
    }
  }

  return config;
}

// Parse and execute
program.parse();
