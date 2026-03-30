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
import { ActionMapper } from './transformers/action-mapper';
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
  /** Maps library file base name -> converted helper module name */
  private libraryModules: Map<string, string> = new Map();
  /** Maps library file base name -> list of exported function names */
  private libraryFunctions: Map<string, string[]> = new Map();

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

    // Step 2.5: Identify and convert function library files
    logger.info('Step 2.5: Processing function libraries...');
    const { libraries, testScripts } = this.separateLibraries(scriptFiles);
    if (libraries.length > 0) {
      logger.info(`Found ${libraries.length} function library file(s)`);
      ensureDir(path.join(this.config.outputDir, 'tests', 'helpers'));
      for (const libFile of libraries) {
        this.convertLibraryFile(libFile);
      }
    }
    logger.info(`Found ${testScripts.length} test script file(s)`);

    // Step 3: Parse and convert each test script
    logger.info('Step 3: Converting scripts...');
    const details: ConversionDetail[] = [];
    const allPageRefs = new Set<string>();

    for (let i = 0; i < testScripts.length; i++) {
      const scriptFile = testScripts[i];
      const progress = `[${i + 1}/${testScripts.length}]`;
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
        include: ['tests/**/*.ts', 'tests/helpers/**/*.ts', 'playwright.config.ts'],
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

      // Inject library imports based on ExecuteFile/LoadFunctionLibrary/FunctionCall actions
      const libraryImports = this.resolveLibraryImports(script);
      if (libraryImports.length > 0) {
        for (const imp of libraryImports) {
          testFile.imports.push(imp);
        }
      }

      // Generate inline helper functions for script-internal Sub/Function definitions
      if (script.functions.length > 0) {
        const helpers = this.generateInlineHelpers(script);
        if (helpers.length > 0) {
          testFile.helperFunctions = helpers;
          // Ensure Page import is available for helper functions
          if (!testFile.imports.some(i => i.includes('Page'))) {
            testFile.imports.push("import { Page } from '@playwright/test'");
          }
        }
      }

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
   * Separate discovered script files into function libraries and test scripts.
   * A file is considered a library if it contains mostly Function/Sub definitions
   * and few or no direct Browser/Page actions outside of functions.
   */
  private separateLibraries(scriptFiles: string[]): { libraries: string[]; testScripts: string[] } {
    const libraries: string[] = [];
    const testScripts: string[] = [];

    for (const file of scriptFiles) {
      const script = this.parseScript(file);
      if (!script) {
        testScripts.push(file);
        continue;
      }

      // A file is a library if it has functions AND the ratio of functions to
      // top-level actions is high (functions contain the actions, not the top level)
      const hasFunctions = script.functions.length > 0;
      const hasTopLevelActions = script.actions.length > 0;
      const baseName = path.basename(file).toLowerCase();

      // Heuristics for library detection:
      // 1. File name contains "lib", "library", "common", "function", "helper", "util"
      const libraryNamePattern = /(?:lib|library|common|function|helper|util)/i;
      const hasLibraryName = libraryNamePattern.test(baseName);

      // 2. Has functions and few/no top-level actions (actions are inside functions)
      const isMostlyFunctions = hasFunctions && script.functions.length >= 2 && script.actions.length <= 2;

      if (hasLibraryName && hasFunctions) {
        libraries.push(file);
        logger.info(`  Library detected: ${path.basename(file)} (${script.functions.length} functions)`);
      } else if (isMostlyFunctions && !hasTopLevelActions) {
        libraries.push(file);
        logger.info(`  Library detected: ${path.basename(file)} (${script.functions.length} functions, no top-level actions)`);
      } else {
        testScripts.push(file);
      }
    }

    return { libraries, testScripts };
  }

  /**
   * Convert a function library file to a TypeScript helper module.
   * Generates a module in tests/helpers/ with exported async functions.
   */
  private convertLibraryFile(libFile: string): void {
    const script = this.parseScript(libFile);
    if (!script || script.functions.length === 0) {
      logger.warn(`Library file has no functions: ${path.basename(libFile)}`);
      return;
    }

    const baseName = path.basename(libFile).replace(/\.(vbs|qfl|mts|txt)$/i, '');
    const moduleName = baseName
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    const functionNames: string[] = [];
    const lines: string[] = [];

    // Header
    lines.push('/**');
    lines.push(` * Helper module: ${baseName}`);
    lines.push(` * Converted from UFT function library: ${path.basename(libFile)}`);
    lines.push(' * Auto-generated by UFT-to-Playwright Converter');
    lines.push(' */');
    lines.push('');
    lines.push("import { Page, expect } from '@playwright/test';");
    lines.push('');

    // Convert each function
    for (const func of script.functions) {
      const funcName = func.name.charAt(0).toLowerCase() + func.name.slice(1);
      functionNames.push(funcName);

      // Build parameter list - always include 'page' as first param
      const params = ['page: Page'];
      for (const p of func.parameters) {
        const cleanParam = p.replace(/^ByVal\s+|^ByRef\s+/i, '').trim();
        params.push(`${cleanParam}: string`);
      }

      // All library functions use Promise<void> for clean compilation;
    // return values need manual review anyway
    const returnType = 'Promise<void>';

      lines.push(`export async function ${funcName}(${params.join(', ')}): ${returnType} {`);

      // Convert function body — pass function name to detect VBS return value assignments
      const bodyLines = this.convertFunctionBody(func.body, func.name);
      for (const bodyLine of bodyLines) {
        lines.push(`  ${bodyLine}`);
      }

      lines.push('}');
      lines.push('');
    }

    // Write the helper module
    const outputPath = path.join(this.config.outputDir, 'tests', 'helpers', `${moduleName}.ts`);
    writeFileContent(outputPath, lines.join('\n'));
    logger.info(`  Generated helper module: helpers/${moduleName}.ts (${functionNames.length} functions)`);

    // Register the library for import resolution
    const fileBaseName = path.basename(libFile);
    this.libraryModules.set(fileBaseName, moduleName);
    this.libraryFunctions.set(fileBaseName, functionNames);

    // Also register without extension for flexible matching
    const nameNoExt = fileBaseName.replace(/\.(vbs|qfl|mts|txt)$/i, '');
    this.libraryModules.set(nameNoExt, moduleName);
    this.libraryFunctions.set(nameNoExt, functionNames);
  }

  /**
   * Convert VBScript function body to TypeScript lines.
   * @param body - The raw VBScript function body
   * @param functionName - Optional function name to detect VBS return value assignments (FuncName = value)
   */
  private convertFunctionBody(body: string, functionName?: string): string[] {
    const lines = body.split('\n');
    const tsLines: string[] = [];
    const mapper = new ActionMapper();
    const declaredVars = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip comments — add as TS comments
      if (trimmed.startsWith("'")) {
        tsLines.push(`// ${trimmed.substring(1).trim()}`);
        continue;
      }

      // Dim declarations - initialize with empty string to avoid TS2454
      if (/^\s*Dim\s+/i.test(trimmed)) {
        const vars = trimmed.replace(/^\s*Dim\s+/i, '').split(',').map(v => v.trim());
        for (const v of vars) {
          tsLines.push(`let ${v} = '';`);
          declaredVars.add(v.toLowerCase());
        }
        continue;
      }

      // If...Then with UFT object condition (e.g., If Browser("X").Page("Y").Exist(10) Then)
      const ifObjMatch = trimmed.match(/^If\s+(Browser\(.+\))\s+Then\s*$/i);
      if (ifObjMatch) {
        const condAction = this.parser.parseAction(ifObjMatch[1], 0);
        if (condAction) {
          const pwAction = mapper.map(condAction);
          // If the mapped code is a TODO/comment, put it above the if and use a placeholder
          if (pwAction.code.includes('TODO') || pwAction.code.startsWith('//')) {
            tsLines.push(`${pwAction.code}`);
            tsLines.push(`if (true /* TODO: replace with proper condition */) {`);
          } else {
            tsLines.push(`if (await ${pwAction.code}) {`);
          }
        } else {
          tsLines.push(`// TODO: ${ifObjMatch[1]}`);
          tsLines.push(`if (true /* TODO: replace with proper condition */) {`);
        }
        continue;
      }

      // If...Then (generic)
      if (/^If\s+(.+)\s+Then\s*$/i.test(trimmed)) {
        let cond = trimmed.replace(/^If\s+/i, '').replace(/\s+Then\s*$/i, '');
        cond = cond.replace(/\bAnd\b/gi, '&&').replace(/\bOr\b/gi, '||');
        cond = cond.replace(/\bNot\b/gi, '!').replace(/\b<>\b/g, '!==');
        cond = cond.replace(/\bTrue\b/gi, 'true').replace(/\bFalse\b/gi, 'false');
        // Fix single = to === for comparisons (but not assignments)
        cond = cond.replace(/([^=!<>])=([^=])/g, '$1===$2');
        tsLines.push(`if (${cond}) {`);
        continue;
      }

      // ElseIf
      if (/^ElseIf\s+(.+)\s+Then\s*$/i.test(trimmed)) {
        let cond = trimmed.replace(/^ElseIf\s+/i, '').replace(/\s+Then\s*$/i, '');
        cond = cond.replace(/\bAnd\b/gi, '&&').replace(/\bOr\b/gi, '||');
        tsLines.push(`} else if (${cond}) {`);
        continue;
      }

      // Else / End If
      if (/^Else\s*$/i.test(trimmed)) { tsLines.push('} else {'); continue; }
      if (/^End If\s*$/i.test(trimmed)) { tsLines.push('}'); continue; }

      // For...Next
      if (/^For\s+/i.test(trimmed)) {
        const forLine = trimmed.replace(
          /^For\s+(\w+)\s*=\s*(\w+)\s+To\s+(\w+)/i,
          'for (let $1 = $2; $1 <= $3; $1++) {'
        );
        tsLines.push(forLine);
        continue;
      }
      if (/^Next\s*$/i.test(trimmed)) { tsLines.push('}'); continue; }

      // Wait N
      if (/^\s*Wait\s+\d+/i.test(trimmed)) {
        const waitMatch = trimmed.match(/Wait\s+(\d+)/i);
        if (waitMatch) {
          tsLines.push(`await page.waitForTimeout(${waitMatch[1]} * 1000);`);
        }
        continue;
      }

      // Reporter.ReportEvent
      if (/^Reporter\.ReportEvent/i.test(trimmed)) {
        const repMatch = trimmed.match(
          /Reporter\.ReportEvent\s+(mic\w+)\s*,\s*"([^"]*)"\s*,\s*(.+)/i
        );
        if (repMatch) {
          const msgParts = repMatch[3].replace(/"/g, "'").replace(/\s*&\s*/g, ' + ');
          tsLines.push(`console.log('[${repMatch[1]}] ${repMatch[2]}: ' + ${msgParts});`);
        } else {
          tsLines.push(`// ${trimmed}`);
        }
        continue;
      }

      // Try to parse as a UFT action (Browser().Page().WebEdit().Set etc.)
      const action = this.parser.parseAction(trimmed, 0);
      if (action) {
        const pwAction = mapper.map(action);
        const code = pwAction.code.endsWith(';') ? pwAction.code : pwAction.code + ';';
        tsLines.push(code);
        continue;
      }

      // Assignment with UFT object on right side (e.g., varName = Browser(...).GetROProperty(...))
      const assignObjMatch = trimmed.match(/^(\w+)\s*=\s*(Browser\(.+)/i);
      if (assignObjMatch) {
        const objVarName = assignObjMatch[1];
        // Skip VBScript return value assignments (FuncName = value)
        if (functionName && objVarName.toLowerCase() === functionName.toLowerCase()) {
          tsLines.push(`// VBS return value: ${objVarName} = (see above)`);
          continue;
        }
        const alreadyDeclared = declaredVars.has(objVarName.toLowerCase());
        const declKeyword = alreadyDeclared ? '' : 'const ';
        const rhsAction = this.parser.parseAction(assignObjMatch[2], 0);
        if (rhsAction) {
          const pwAction = mapper.map(rhsAction);
          if (pwAction.code.includes('TODO') || pwAction.code.startsWith('//')) {
            tsLines.push(`${pwAction.code}`);
            tsLines.push(`${alreadyDeclared ? '' : 'let '}${objVarName} = '' as string; // TODO: assign from above`);
          } else {
            tsLines.push(`${alreadyDeclared ? '' : 'let '}${objVarName} = await ${pwAction.code};`);
          }
        } else {
          tsLines.push(`// TODO: ${assignObjMatch[2]}`);
          tsLines.push(`${alreadyDeclared ? '' : 'let '}${objVarName} = '' as string; // TODO: assign from above`);
        }
        if (!alreadyDeclared) {
          declaredVars.add(objVarName.toLowerCase());
        }
        continue;
      }

      // Generic assignment
      const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch && !/^(If|ElseIf|For|While|Do|Select)\b/i.test(trimmed)) {
        const varName = assignMatch[1];
        // Skip VBScript return value assignments (FuncName = value)
        if (functionName && varName.toLowerCase() === functionName.toLowerCase()) {
          let retVal = assignMatch[2].trim();
          retVal = retVal.replace(/\bTrue\b/gi, 'true').replace(/\bFalse\b/gi, 'false');
          retVal = retVal.replace(/\bNothing\b/gi, 'null');
          tsLines.push(`// VBS return value: ${varName} = ${retVal}`);
          continue;
        }
        let value = assignMatch[2].trim();
        value = value.replace(/\bTrue\b/gi, 'true').replace(/\bFalse\b/gi, 'false');
        value = value.replace(/\bNothing\b/gi, 'null');
        // Convert VBS string expression to TypeScript
        value = this.convertVbsStringExpression(value);
        // Use assignment if variable was already declared, otherwise use let
        if (declaredVars.has(varName.toLowerCase())) {
          tsLines.push(`${varName} = ${value};`);
        } else {
          tsLines.push(`let ${varName} = ${value};`);
          declaredVars.add(varName.toLowerCase());
        }
        continue;
      }

      // Fallback — pass through with VBS operator conversion
      let tsLine = trimmed;
      tsLine = tsLine.replace(/\bTrue\b/gi, 'true').replace(/\bFalse\b/gi, 'false');
      tsLine = tsLine.replace(/\bAnd\b/gi, '&&').replace(/\bOr\b/gi, '||');
      tsLine = tsLine.replace(/\bNot\b/gi, '!').replace(/\b<>\b/g, '!==');
      tsLine = this.convertVbsStringExpression(tsLine);
      tsLines.push(`// TODO: ${tsLine}`);
    }

    return tsLines;
  }

  /**
   * Convert a VBScript string expression to TypeScript.
   * Handles & concatenation and strings containing single quotes (e.g., SQL queries).
   *
   * VBScript: "select * from t where name ='" & varName & "'"
   * TypeScript: `select * from t where name ='${varName}'`
   */
  private convertVbsStringExpression(value: string): string {
    // Check if the value contains VBScript string concatenation with &
    // Support & with or without surrounding spaces, but not && (which is converted from VBS And)
    const concatPattern = /(?<!&)\s*&(?!&)\s*/;
    const hasConcatenation = concatPattern.test(value);
    // Check if any quoted string segment contains a single quote
    const hasInnerSingleQuotes = /"[^"]*'[^"]*"/.test(value);

    if (hasConcatenation && hasInnerSingleQuotes) {
      // Convert the entire concatenated expression to a template literal
      // Split by & operator, then reassemble as template literal parts
      const parts = value.split(/(?<!&)\s*&(?!&)\s*/);
      let template = '`';
      for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.startsWith('"') && trimmedPart.endsWith('"')) {
          // String literal — extract content (strip outer quotes)
          // Handle VBScript escaped double quotes ("" → ")
          const content = trimmedPart.slice(1, -1).replace(/""/g, '"');
          // Escape backticks inside the content
          template += content.replace(/`/g, '\\`');
        } else {
          // Variable reference — wrap in ${}
          template += '${' + trimmedPart + '}';
        }
      }
      template += '`';
      return template;
    }

    if (hasConcatenation) {
      // Has concatenation but no single quotes — use + operator with single-quoted strings
      value = value.replace(/(?<!&)\s*&(?!&)\s*/g, ' + ');
      value = value.replace(/"([^"]*)"/g, "'$1'");
      return value;
    }

    if (hasInnerSingleQuotes) {
      // Single string (no concatenation) with single quotes inside — keep double quotes
      return value;
    }

    // Simple case — no concatenation, no single quotes — convert to single-quoted strings
    value = value.replace(/"([^"]*)"/g, "'$1'");
    return value;
  }

  /**
   * Generate inline helper functions for script-internal Sub/Function definitions.
   * These are functions defined within the script itself (not from external libraries).
   */
  private generateInlineHelpers(script: UFTScript): string[] {
    const helpers: string[] = [];

    for (const func of script.functions) {
      const funcName = func.name.charAt(0).toLowerCase() + func.name.slice(1);

      // Build parameter list - always include 'page' as first param
      const params = ['page: Page'];
      for (const p of func.parameters) {
        const cleanParam = p.replace(/^ByVal\s+|^ByRef\s+/i, '').trim();
        params.push(`${cleanParam}: string`);
      }

      const lines: string[] = [];
      lines.push(`async function ${funcName}(${params.join(', ')}): Promise<void> {`);

      // Convert function body — pass function name to detect VBS return value assignments
      const bodyLines = this.convertFunctionBody(func.body, func.name);
      for (const bodyLine of bodyLines) {
        lines.push(`  ${bodyLine}`);
      }

      lines.push('}');
      helpers.push(lines.join('\n'));
    }

    return helpers;
  }

  /**
   * Resolve library imports for a script based on ExecuteFile/LoadFunctionLibrary
   * references and FunctionCall actions that match known library functions.
   */
  private resolveLibraryImports(script: UFTScript): string[] {
    const imports: string[] = [];
    const importedModules = new Set<string>();

    // Build set of internal function names (defined in this script itself)
    const internalFunctions = new Set<string>();
    for (const func of script.functions) {
      internalFunctions.add(func.name.toLowerCase());
    }

    // Find ExecuteFile/LoadFunctionLibrary actions to determine which libraries are referenced
    for (const action of script.actions) {
      if (action.objectType === 'Utility' &&
          (action.method === 'ExecuteFile' || action.method === 'LoadFunctionLibrary') &&
          action.arguments.length > 0) {
        const libRef = action.arguments[0].replace(/^"|"$/g, '');
        // Try to match by file name or base name
        const libBaseName = path.basename(libRef);
        const libNameNoExt = libBaseName.replace(/\.(vbs|qfl|mts|txt)$/i, '');

        const moduleName = this.libraryModules.get(libBaseName) || this.libraryModules.get(libNameNoExt);
        const funcNames = this.libraryFunctions.get(libBaseName) || this.libraryFunctions.get(libNameNoExt);

        if (moduleName && funcNames && !importedModules.has(moduleName)) {
          // Exclude functions that are defined internally in the script
          const filteredFuncs = funcNames.filter(f => !internalFunctions.has(f.toLowerCase()));
          if (filteredFuncs.length > 0) {
            imports.push(`import { ${filteredFuncs.join(', ')} } from './helpers/${moduleName}'`);
            importedModules.add(moduleName);
          }
        }
      }
    }

    // Also check FunctionCall actions — if any match a known library function,
    // auto-add the import even without explicit ExecuteFile
    for (const action of script.actions) {
      if (action.objectType === 'FunctionCall') {
        // Skip if this function is defined internally in the script
        if (internalFunctions.has(action.method.toLowerCase())) {
          continue;
        }
        const calledFunc = action.method.charAt(0).toLowerCase() + action.method.slice(1);
        for (const [libKey, funcNames] of this.libraryFunctions) {
          const moduleName = this.libraryModules.get(libKey);
          if (moduleName && funcNames.includes(calledFunc) && !importedModules.has(moduleName)) {
            const filteredFuncs = funcNames.filter(f => !internalFunctions.has(f.toLowerCase()));
            if (filteredFuncs.length > 0) {
              imports.push(`import { ${filteredFuncs.join(', ')} } from './helpers/${moduleName}'`);
              importedModules.add(moduleName);
            }
            break;
          }
        }
      }
    }

    return imports;
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
