import { ActionMapper } from '../src/transformers/action-mapper';
import { UFTAction } from '../src/models/types';

describe('ActionMapper', () => {
  let mapper: ActionMapper;

  beforeEach(() => {
    mapper = new ActionMapper();
  });

  function createAction(overrides: Partial<UFTAction> = {}): UFTAction {
    return {
      lineNumber: 1,
      objectType: 'WebEdit',
      objectName: 'username',
      method: 'Set',
      arguments: ['"admin"'],
      rawLine: 'Browser("App").Page("Main").WebEdit("username").Set "admin"',
      ...overrides,
    };
  }

  describe('map', () => {
    it('should map WebEdit.Set to page.locator().fill()', () => {
      const action = createAction({
        objectType: 'WebEdit',
        method: 'Set',
        arguments: ['"admin"'],
      });

      const result = mapper.map(action, "'#username'");

      expect(result.code).toContain('fill');
      expect(result.code).toContain('#username');
      expect(result.isAsync).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should map WebButton.Click to page.locator().click()', () => {
      const action = createAction({
        objectType: 'WebButton',
        objectName: 'loginBtn',
        method: 'Click',
        arguments: [],
      });

      const result = mapper.map(action, "'#loginBtn'");

      expect(result.code).toContain('click()');
      expect(result.isAsync).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should map WebList.Select to page.locator().selectOption()', () => {
      const action = createAction({
        objectType: 'WebList',
        method: 'Select',
        arguments: ['"Engineering"'],
      });

      const result = mapper.map(action, "'#department'");

      expect(result.code).toContain('selectOption');
      expect(result.isAsync).toBe(true);
    });

    it('should map Browser.Navigate to page.goto()', () => {
      const action = createAction({
        objectType: 'Browser',
        method: 'Navigate',
        arguments: ['"http://localhost:3000"'],
      });

      const result = mapper.map(action);

      expect(result.code).toContain('page.goto');
      expect(result.isAsync).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should map Browser.Close to page.close()', () => {
      const action = createAction({
        objectType: 'Browser',
        method: 'Close',
        arguments: [],
      });

      const result = mapper.map(action);

      expect(result.code).toContain('page.close()');
    });

    it('should map Wait to page.waitForTimeout()', () => {
      const action = createAction({
        objectType: 'Utility',
        objectName: 'Wait',
        method: 'Wait',
        arguments: ['5'],
      });

      const result = mapper.map(action);

      expect(result.code).toContain('waitForTimeout');
      expect(result.code).toContain('5');
    });

    it('should handle unmapped object types with TODO comment', () => {
      const action = createAction({
        objectType: 'UnknownObject',
        method: 'DoSomething',
        arguments: [],
      });

      const result = mapper.map(action);

      expect(result.code).toContain('TODO');
      expect(result.confidence).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle unmapped methods with TODO comment', () => {
      const action = createAction({
        objectType: 'WebEdit',
        method: 'UnknownMethod',
        arguments: [],
      });

      const result = mapper.map(action);

      expect(result.code).toContain('TODO');
      expect(result.confidence).toBe(0);
    });

    it('should map WebElement.Hover to page.locator().hover()', () => {
      const action = createAction({
        objectType: 'WebElement',
        method: 'Hover',
        arguments: [],
      });

      const result = mapper.map(action, "'#menu'");

      expect(result.code).toContain('hover()');
    });

    it('should map Link.Click to page.locator().click()', () => {
      const action = createAction({
        objectType: 'Link',
        objectName: 'Employees',
        method: 'Click',
        arguments: [],
      });

      const result = mapper.map(action);

      expect(result.code).toContain('click()');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should map Browser.Sync to waitForLoadState', () => {
      const action = createAction({
        objectType: 'Browser',
        method: 'Sync',
        arguments: [],
      });

      const result = mapper.map(action);

      expect(result.code).toContain('waitForLoadState');
    });
  });

  describe('getSupportedObjectTypes', () => {
    it('should return a list of supported object types', () => {
      const types = mapper.getSupportedObjectTypes();

      expect(types).toContain('Browser');
      expect(types).toContain('WebEdit');
      expect(types).toContain('WebButton');
      expect(types).toContain('WebList');
      expect(types).toContain('WebTable');
      expect(types).toContain('Link');
      expect(types).toContain('Reporter');
    });
  });

  describe('addOverride', () => {
    it('should use custom override when mapped', () => {
      mapper.addOverride('WebEdit', 'Set', {
        playwright: "await page.locator('[data-test=\"{{SELECTOR}}\"]').fill('{{ARG0}}')",
        isAsync: true,
        imports: [],
        needsSelector: true,
        confidence: 100,
      });

      const action = createAction({
        objectType: 'WebEdit',
        method: 'Set',
        arguments: ['"test"'],
      });

      const result = mapper.map(action, 'username');

      expect(result.code).toContain('data-test');
      expect(result.confidence).toBe(100);
    });
  });
});
