import { ScriptAnalyzer } from '../src/analyzers/script-analyzer';
import { UFTScript } from '../src/models/types';

describe('ScriptAnalyzer', () => {
  let analyzer: ScriptAnalyzer;

  beforeEach(() => {
    analyzer = new ScriptAnalyzer();
  });

  function createScript(overrides: Partial<UFTScript> = {}): UFTScript {
    return {
      filePath: '/test/script.vbs',
      scriptName: 'TestScript',
      actions: [],
      variables: [],
      functions: [],
      dataTables: [],
      objectRepository: [],
      recoveryScenarios: [],
      comments: [],
      rawContent: '',
      ...overrides,
    };
  }

  it('should classify a simple script as low complexity', () => {
    const script = createScript({
      rawContent: 'Browser("App").Page("Main").WebButton("ok").Click\n'.repeat(5),
      actions: Array(5).fill({
        lineNumber: 1,
        objectType: 'WebButton',
        objectName: 'ok',
        method: 'Click',
        arguments: [],
        rawLine: 'Browser("App").Page("Main").WebButton("ok").Click',
      }),
    });

    const result = analyzer.analyze(script);

    expect(result.complexity).toBe('low');
    expect(result.estimatedConversionConfidence).toBeGreaterThanOrEqual(80);
  });

  it('should classify a complex script as high or very-high complexity', () => {
    const manyActions = Array(120).fill({
      lineNumber: 1,
      objectType: 'WebEdit',
      objectName: 'field',
      method: 'Set',
      arguments: ['"value"'],
      rawLine: 'Browser("App").Page("Main").WebEdit("field").Set "value"',
    });

    const script = createScript({
      rawContent: 'If x Then\nEnd If\n'.repeat(15) + 'For i = 1 To 10\nNext\n'.repeat(8),
      actions: manyActions,
      functions: Array(8).fill({
        name: 'TestFunc',
        type: 'Function' as const,
        parameters: [],
        body: 'test',
        lineNumber: 1,
      }),
      dataTables: Array(12).fill({
        sheetName: 'Global',
        columnName: 'Col',
        lineNumber: 1,
        rawExpression: 'DataTable("Col", dtGlobalSheet)',
      }),
    });

    const result = analyzer.analyze(script);

    expect(['high', 'very-high']).toContain(result.complexity);
  });

  it('should detect desktop objects as unsupported', () => {
    const script = createScript({
      rawContent: 'Window("App").WinButton("OK").Click\nWinEdit("Name").Set "Test"',
      actions: [
        {
          lineNumber: 1,
          objectType: 'WinButton',
          objectName: 'OK',
          method: 'Click',
          arguments: [],
          rawLine: 'Window("App").WinButton("OK").Click',
        },
      ],
    });

    const result = analyzer.analyze(script);

    expect(result.unsupportedPatterns.some(p => p.includes('Desktop'))).toBe(true);
    expect(result.estimatedConversionConfidence).toBeLessThan(80);
  });

  it('should detect COM object usage as unsupported', () => {
    const script = createScript({
      rawContent: 'Set objExcel = CreateObject("Excel.Application")',
    });

    const result = analyzer.analyze(script);

    expect(result.unsupportedPatterns.some(p => p.includes('COM'))).toBe(true);
  });

  it('should warn about hard-coded waits', () => {
    const script = createScript({
      rawContent: 'Wait 5\nWait 10\nWait 3',
    });

    const result = analyzer.analyze(script);

    expect(result.warnings.some(w => w.includes('Wait'))).toBe(true);
  });

  it('should provide effort estimate in minutes', () => {
    const script = createScript({
      rawContent: 'Browser("App").Page("Main").WebButton("ok").Click',
      actions: Array(10).fill({
        lineNumber: 1,
        objectType: 'WebButton',
        objectName: 'ok',
        method: 'Click',
        arguments: [],
        rawLine: 'click',
      }),
    });

    const result = analyzer.analyze(script);

    expect(result.estimatedEffortMinutes).toBeGreaterThan(0);
    expect(typeof result.estimatedEffortMinutes).toBe('number');
  });

  it('should count object types correctly', () => {
    const script = createScript({
      actions: [
        { lineNumber: 1, objectType: 'WebEdit', objectName: 'a', method: 'Set', arguments: [], rawLine: '' },
        { lineNumber: 2, objectType: 'WebEdit', objectName: 'b', method: 'Set', arguments: [], rawLine: '' },
        { lineNumber: 3, objectType: 'WebButton', objectName: 'c', method: 'Click', arguments: [], rawLine: '' },
      ],
      rawContent: '',
    });

    const result = analyzer.analyze(script);

    expect(result.objectTypes['WebEdit']).toBe(2);
    expect(result.objectTypes['WebButton']).toBe(1);
  });
});
