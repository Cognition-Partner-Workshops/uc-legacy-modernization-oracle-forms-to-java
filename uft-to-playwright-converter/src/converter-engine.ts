/**
 * Converter Engine - Main orchestrator that coordinates the full
 * UFT-to-Playwright conversion pipeline.
 *
 * Pipeline:
 * 1. Discover UFT scripts in input directory
 * 2. Parse each script (VBScript parser)
 * 3. Load Object Repository (if available)
 * 4. Analyze scripts (pre-conversion assessment)
 * 5. Transform scripts (UFT actions -> Playwright actions)
 * 6. Generate output files (test specs, page objects, config)
 * 7. Generate conversion report
 */

import * as path from 'path';
import {
  ConversionConfig,
  ConversionSummary,
  ConversionDetail,
  AnalysisResult,
  UFTScript,
} from './models/types';
import { VBScriptParser } from './parsers/vbscript-parser';
import { ObjectRepositoryParser } from './parsers/object-repository-parser';
import { ScriptTransformer } from './transformers/script-transformer';

import { PlaywrightGenerator } from './generators/playwright-generator';
import { PageObjectGenerator } from './generators/page-object-generator';
import { ScriptAnalyzer } from './analyzers/script-analyzer';
import { ReportGenerator } from './utils/report-generator';
import {
  findUFTScripts,
  findObjectRepositories,
  readFileContent,
  writeFileContent,
  ensureDir,
} from './utils/file-utils';
import { logger, enableFileLogging } from './utils/logger';

export class ConverterEngine {
  private config: ConversionConfig;
  private parser: VBScriptParser;
  private orParser: ObjectRepositoryParser;
  private transformer: ScriptTransformer;
  private generator: PlaywrightGenerator;
  private pageObjectGenerator: PageObjectGenerator;
  private analyzer: ScriptAnalyzer;

  constructor(config: ConversionConfig) {
    this.config = config;
    this.parser = new VBScriptParser();
    this.orParser = new ObjectRepositoryParser();
    this.transformer = new ScriptTransformer(config);
    this.generator = new PlaywrightGenerator(config);
    this.pageObjectGenerator = new PageObjectGenerator();
    this.analyzer = new ScriptAnalyzer();
  }

  /**
   * Run the full conversion pipeline.
   */
  async convert(): Promise<ConversionSummary> {
    const startTime = Date.now();

    // Set up logging
    enableFileLogging(path.join(this.config.outputDir, 'conversion.log'));

    logger.info('=== UFT to Playwright Conversion Started ===');
    logger.info(`Input: ${this.config.inputDir}`);
    logger.info(`Output: ${this.config.outputDir}`);

    // Ensure output directory exists
    ensureDir(this.config.outputDir);
    ensureDir(path.join(this.config.outputDir, 'tests'));
    if (this.config.generatePageObjects) {
      ensureDir(path.join(this.config.outputDir, 'tests', 'pages'));
    }

    // Step 1: Discover scripts
    logger.info('Step 1: Discovering UFT scripts...');
    const scriptFiles = await findUFTScripts(this.config.inputDir);
    logger.info(`Found ${scriptFiles.length} UFT scripts`);

    if (scriptFiles.length === 0) {
      logger.warn('No UFT scripts found. Check input directory.');
      return this.createEmptySummary(startTime);
    }

    // Step 2: Load Object Repository (if available)
    logger.info('Step 2: Loading Object Repositories...');
    await this.loadObjectRepositories();

    // Step 3: Parse and convert each script
    logger.info('Step 3: Converting scripts...');
    const details: ConversionDetail[] = [];
    const allPageRefs = new Set<string>();

    for (let i = 0; i < scriptFiles.length; i++) {
      const scriptFile = scriptFiles[i];
      const progress = `[${i + 1}/${scriptFiles.length}]`;
      logger.info(`${progress} Processing: ${path.basename(scriptFile)}`);

      const detail = await this.convertSingleScript(scriptFile);
      details.push(detail);

      // Collect page refs for PO generation
      if (detail.status !== 'failed') {
        const script = this.parseScript(scriptFile);
        if (script) {
          for (const action of script.actions) {
            if (action.parentObject) {
              const pageMatch = action.parentObject.match(/Page\s*\(\s*"([^"]*)"\s*\)/);
              if (pageMatch) allPageRefs.add(pageMatch[1]);
            }
          }
        }
      }
    }

    // Step 4: Generate Page Objects
    if (this.config.generatePageObjects && allPageRefs.size > 0) {
      logger.info('Step 4: Generating Page Objects...');
      this.generatePageObjects(details);
    }

    // Step 5: Generate Playwright config
    logger.info('Step 5: Generating Playwright configuration...');
    const configContent = this.generator.generateConfig();
    writeFileContent(
      path.join(this.config.outputDir, 'playwright.config.ts'),
      configContent
    );

    // Generate tsconfig.json for the output project
    writeFileContent(
      path.join(this.config.outputDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          moduleResolution: 'node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          outDir: './dist',
          rootDir: '.',
          types: ['node'],
        },
        include: ['tests/**/*.ts', 'playwright.config.ts'],
      }, null, 2) + '\n'
    );

    // Step 6: Generate package.json for the output project
    this.generateOutputPackageJson();

    // Build summary
    const summary = this.buildSummary(details, startTime);

    // Step 7: Generate reports
    logger.info('Step 6: Generating reports...');
    ReportGenerator.generateJSON(
      summary,
      path.join(this.config.outputDir, 'reports', 'conversion-report.json')
    );
    ReportGenerator.generateHTML(
      summary,
      path.join(this.config.outputDir, 'reports', 'conversion-report.html')
    );
    ReportGenerator.printConsoleSummary(summary);

    logger.info('=== Conversion Complete ===');
    return summary;
  }

  /**
   * Run analysis-only mode (no conversion, just assessment).
   */
  async analyze(): Promise<AnalysisResult[]> {
    logger.info('=== UFT Script Analysis Started ===');

    const scriptFiles = await findUFTScripts(this.config.inputDir);
    logger.info(`Found ${scriptFiles.length} scripts to analyze`);

    const results: AnalysisResult[] = [];

    for (const scriptFile of scriptFiles) {
      const script = this.parseScript(scriptFile);
      if (script) {
        const result = this.analyzer.analyze(script);
        results.push(result);
      }
    }

    // Generate analysis report
    ensureDir(path.join(this.config.outputDir, 'reports'));
    ReportGenerator.generateAnalysisReport(
      results,
      path.join(this.config.outputDir, 'reports', 'analysis-report.json')
    );

    // Print summary
    const avgConfidence = results.length > 0 ? results.reduce((s, r) => s + r.estimatedConversionConfidence, 0) / results.length : 0;
    const totalEffort = results.reduce((s, r) => s + r.estimatedEffortMinutes, 0);

    console.log('\n' + '='.repeat(60));
    console.log('  UFT Script Analysis Summary');
    console.log('='.repeat(60));
    console.log(`  Scripts Analyzed:     ${results.length}`);
    console.log(`  Avg Confidence:       ${avgConfidence.toFixed(1)}%`);
    console.log(`  Estimated Effort:     ${(totalEffort / 60).toFixed(1)} hours`);
    console.log(`  Complexity: Low=${results.filter(r => r.complexity === 'low').length}, ` +
      `Med=${results.filter(r => r.complexity === 'medium').length}, ` +
      `High=${results.filter(r => r.complexity === 'high').length}, ` +
      `V.High=${results.filter(r => r.complexity === 'very-high').length}`);
    console.log('='.repeat(60) + '\n');

    return results;
  }

  /**
   * Convert a single UFT script file.
   */
  private async convertSingleScript(scriptFile: string): Promise<ConversionDetail> {
    const detail: ConversionDetail = {
      inputFile: scriptFile,
      outputFile: '',
      status: 'failed',
      actionsConverted: 0,
      actionsTotal: 0,
      confidence: 0,
      warnings: [],
      errors: [],
    };

    try {
      // Parse the script
      const script = this.parseScript(scriptFile);
      if (!script) {
        detail.errors.push('Failed to parse script');
        return detail;
      }

      detail.actionsTotal = script.actions.length;

      // Analyze
      const analysis = this.analyzer.analyze(script);
      detail.confidence = analysis.estimatedConversionConfidence;
      detail.warnings = [...analysis.warnings, ...analysis.unsupportedPatterns];

      // Transform
      const testFile = this.transformer.transform(script);

      // Generate output
      const outputContent = this.generator.generateTestFile(testFile);
      const outputPath = path.join(
        this.config.outputDir,
        'tests',
        testFile.fileName
      );

      writeFileContent(outputPath, outputContent);
      detail.outputFile = outputPath;

      // Count converted actions
      let convertedCount = 0;
      for (const block of testFile.testBlocks) {
        for (const action of [...block.actions, ...block.assertions]) {
          if (action.confidence > 0) convertedCount++;
        }
      }
      detail.actionsConverted = convertedCount;

      // Determine status
      if (convertedCount === 0 && detail.actionsTotal > 0) {
        detail.status = 'failed';
      } else if (convertedCount < detail.actionsTotal) {
        detail.status = 'partial';
      } else {
        detail.status = 'success';
      }

      logger.info(
        `  -> ${detail.status}: ${convertedCount}/${detail.actionsTotal} actions, ` +
        `${detail.confidence}% confidence`
      );

      // Print warnings for this script
      if (detail.warnings.length > 0) {
        for (const warning of detail.warnings) {
          logger.warn(`     ⚠ ${warning}`);
        }
      }

      // Print errors for this script
      if (detail.errors.length > 0) {
        for (const error of detail.errors) {
          logger.error(`     ✖ ${error}`);
        }
      }

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      detail.errors.push(errMsg);
      logger.error(`  -> FAILED: ${errMsg}`);
    }

    return detail;
  }

  /**
   * Parse a UFT script file.
   */
  private parseScript(scriptFile: string): UFTScript | null {
    try {
      const content = readFileContent(scriptFile);
      return this.parser.parse(content, scriptFile);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to read/parse ${scriptFile}: ${errMsg}`);
      return null;
    }
  }

  /**
   * Load Object Repository files from the input directory.
   */
  private async loadObjectRepositories(): Promise<void> {
    const orPath = this.config.objectRepositoryPath || this.config.inputDir;
    const orFiles = await findObjectRepositories(orPath);

    if (orFiles.length === 0) {
      logger.info('No Object Repository files found. Using inferred selectors.');
      return;
    }

    for (const orFile of orFiles) {
      try {
        const content = readFileContent(orFile);
        const entries = this.orParser.parse(content);
        this.transformer.loadObjectRepository(entries);
        logger.info(`Loaded OR: ${path.basename(orFile)} (${entries.length} objects)`);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to parse OR ${orFile}: ${errMsg}`);
      }
    }
  }

  /**
   * Generate Page Object files from collected data.
   */
  private generatePageObjects(details: ConversionDetail[]): void {
    // Collect all actions from successfully converted scripts
    const allActions: Array<{ objectType: string; objectName: string; parentObject?: string }> = [];

    for (const detail of details) {
      if (detail.status === 'failed') continue;
      const script = this.parseScript(detail.inputFile);
      if (!script) continue;

      for (const action of script.actions) {
        allActions.push({
          objectType: action.objectType,
          objectName: action.objectName,
          parentObject: action.parentObject,
        });
      }
    }

    const pageObjects = this.pageObjectGenerator.generateFromActions(allActions);

    for (const po of pageObjects) {
      const content = this.generator.generatePageObject(po);
      const outputPath = path.join(
        this.config.outputDir,
        'tests',
        'pages',
        po.fileName
      );
      writeFileContent(outputPath, content);
      logger.info(`Generated Page Object: ${po.fileName}`);
    }
  }

  /**
   * Generate a package.json for the converted Playwright project.
   */
  private generateOutputPackageJson(): void {
    const pkg = {
      name: 'converted-playwright-tests',
      version: '1.0.0',
      description: 'Playwright tests - converted from UFT/QTP scripts',
      scripts: {
        test: 'npx playwright test',
        'test:headed': 'npx playwright test --headed',
        'test:ui': 'npx playwright test --ui',
        'test:debug': 'npx playwright test --debug',
        report: 'npx playwright show-report',
        codegen: 'npx playwright codegen',
      },
      devDependencies: {
        '@playwright/test': '^1.40.0',
        '@types/node': '^20.0.0',
        'typescript': '^5.3.0',
      },
    };

    writeFileContent(
      path.join(this.config.outputDir, 'package.json'),
      JSON.stringify(pkg, null, 2) + '\n'
    );
  }

  /**
   * Build a conversion summary from individual details.
   */
  private buildSummary(details: ConversionDetail[], startTime: number): ConversionSummary {
    const successCount = details.filter(d => d.status === 'success').length;
    const partialCount = details.filter(d => d.status === 'partial').length;
    const failedCount = details.filter(d => d.status === 'failed').length;
    const totalActions = details.reduce((s, d) => s + d.actionsConverted, 0);
    const totalWarnings = details.reduce((s, d) => s + d.warnings.length, 0);
    const avgConfidence = details.length > 0
      ? details.reduce((s, d) => s + d.confidence, 0) / details.length
      : 0;

    return {
      totalScripts: details.length,
      successfulConversions: successCount,
      partialConversions: partialCount,
      failedConversions: failedCount,
      totalActionsConverted: totalActions,
      totalWarnings: totalWarnings,
      averageConfidence: avgConfidence,
      durationMs: Date.now() - startTime,
      details,
    };
  }

  /**
   * Create an empty summary when no scripts are found.
   */
  private createEmptySummary(startTime: number): ConversionSummary {
    return {
      totalScripts: 0,
      successfulConversions: 0,
      partialConversions: 0,
      failedConversions: 0,
      totalActionsConverted: 0,
      totalWarnings: 0,
      averageConfidence: 0,
      durationMs: Date.now() - startTime,
      details: [],
    };
  }
}
