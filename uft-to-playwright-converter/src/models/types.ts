/**
 * Core type definitions for the UFT-to-Playwright converter.
 */

/** Represents a parsed UFT action/step */
export interface UFTAction {
  lineNumber: number;
  objectType: string;
  objectName: string;
  method: string;
  arguments: string[];
  rawLine: string;
  parentObject?: string;
  description?: string;
}

/** Represents a parsed UFT script with metadata */
export interface UFTScript {
  filePath: string;
  scriptName: string;
  actions: UFTAction[];
  variables: UFTVariable[];
  functions: UFTFunction[];
  dataTables: UFTDataTable[];
  objectRepository: UFTObjectEntry[];
  recoveryScenarios: string[];
  comments: string[];
  rawContent: string;
}

/** Represents a VBScript variable declaration */
export interface UFTVariable {
  name: string;
  type: string;
  scope: 'local' | 'global';
  initialValue?: string;
  lineNumber: number;
}

/** Represents a VBScript function/sub */
export interface UFTFunction {
  name: string;
  type: 'Function' | 'Sub';
  parameters: string[];
  body: string;
  returnType?: string;
  lineNumber: number;
}

/** Represents a DataTable reference */
export interface UFTDataTable {
  sheetName: string;
  columnName: string;
  lineNumber: number;
  rawExpression: string;
}

/** Represents an object repository entry */
export interface UFTObjectEntry {
  logicalName: string;
  objectType: string;
  properties: Record<string, string>;
  parentHierarchy: string[];
}

/** Represents a converted Playwright action */
export interface PlaywrightAction {
  code: string;
  imports: string[];
  comments: string[];
  isAsync: boolean;
  confidence: number; // 0-100, how confident the conversion is
  originalUFTLine: string;
  warnings: string[];
}

/** Represents a full converted Playwright test file */
export interface PlaywrightTestFile {
  fileName: string;
  testName: string;
  imports: string[];
  beforeEach: string[];
  afterEach: string[];
  testBlocks: PlaywrightTestBlock[];
  pageObjectRefs: string[];
  fixtures: string[];
}

/** Represents a test block within a Playwright file */
export interface PlaywrightTestBlock {
  name: string;
  actions: PlaywrightAction[];
  assertions: PlaywrightAction[];
}

/** Represents a generated Page Object */
export interface PageObject {
  className: string;
  fileName: string;
  url?: string;
  selectors: PageSelector[];
  methods: PageMethod[];
  imports: string[];
}

/** Represents a selector within a Page Object */
export interface PageSelector {
  name: string;
  selector: string;
  selectorType: 'css' | 'xpath' | 'text' | 'role' | 'testId' | 'label' | 'placeholder';
  originalUFTObject?: string;
}

/** Represents a method within a Page Object */
export interface PageMethod {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  returnType: string;
  body: string;
  isAsync: boolean;
}

/** Configuration for the conversion process */
export interface ConversionConfig {
  inputDir: string;
  outputDir: string;
  language: 'typescript' | 'javascript';
  testRunner: 'playwright-test' | 'jest' | 'mocha';
  generatePageObjects: boolean;
  generateFixtures: boolean;
  preserveComments: boolean;
  baseUrl: string;
  browsers: string[];
  parallel: boolean;
  retries: number;
  timeout: number;
  screenshotOnFailure: boolean;
  videoOnFailure: boolean;
  traceOnFailure: boolean;
  objectRepositoryPath?: string;
  dataTablePath?: string;
  mappingOverridesPath?: string;
  reportFormat: 'html' | 'json' | 'junit' | 'list';
}

/** Result of analyzing a UFT script before conversion */
export interface AnalysisResult {
  scriptPath: string;
  scriptName: string;
  totalLines: number;
  actionCount: number;
  functionCount: number;
  variableCount: number;
  dataTableUsage: number;
  objectTypes: Record<string, number>;
  methodsUsed: Record<string, number>;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  estimatedConversionConfidence: number;
  warnings: string[];
  unsupportedPatterns: string[];
  estimatedEffortMinutes: number;
}

/** Batch conversion summary */
export interface ConversionSummary {
  totalScripts: number;
  successfulConversions: number;
  partialConversions: number;
  failedConversions: number;
  totalActionsConverted: number;
  totalWarnings: number;
  averageConfidence: number;
  durationMs: number;
  details: ConversionDetail[];
}

/** Detail for a single script conversion */
export interface ConversionDetail {
  inputFile: string;
  outputFile: string;
  status: 'success' | 'partial' | 'failed';
  actionsConverted: number;
  actionsTotal: number;
  confidence: number;
  warnings: string[];
  errors: string[];
}

/** Mapping override for custom object-to-selector mappings */
export interface MappingOverride {
  uftObjectType: string;
  uftObjectName: string;
  playwrightSelector: string;
  selectorType: PageSelector['selectorType'];
  notes?: string;
}
