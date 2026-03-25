/**
 * Page Object Generator - Creates Playwright Page Object classes from
 * UFT Object Repository entries and script analysis.
 *
 * Groups objects by their parent Page/Form and generates:
 * - Selector properties
 * - Locator getter methods
 * - Common action methods (fill, click, select)
 */

import {
  UFTObjectEntry,
  PageObject,
  PageSelector,
  PageMethod,
} from '../models/types';
import { ObjectRepositoryParser } from '../parsers/object-repository-parser';
import { logger } from '../utils/logger';

export class PageObjectGenerator {
  /**
   * Generate Page Objects from Object Repository entries.
   * Groups objects by their parent Page and creates one PO per page.
   */
  generateFromObjectRepository(entries: UFTObjectEntry[]): PageObject[] {
    // Group entries by parent page
    const pageGroups = this.groupByPage(entries);
    const pageObjects: PageObject[] = [];

    for (const [pageName, objects] of pageGroups) {
      const pageObject = this.createPageObject(pageName, objects);
      pageObjects.push(pageObject);
      logger.info(`Generated Page Object: ${pageObject.className} with ${pageObject.selectors.length} selectors`);
    }

    return pageObjects;
  }

  /**
   * Generate Page Objects from UFT script actions (when no OR is available).
   * Infers page structure from the object hierarchy in scripts.
   */
  generateFromActions(
    actions: Array<{ objectType: string; objectName: string; parentObject?: string }>
  ): PageObject[] {
    // Group by inferred page
    const pageMap = new Map<string, Map<string, string>>();

    for (const action of actions) {
      let pageName = 'DefaultPage';

      if (action.parentObject) {
        const pageMatch = action.parentObject.match(/Page\s*\(\s*"([^"]*)"\s*\)/);
        if (pageMatch) {
          pageName = pageMatch[1];
        }
      }

      if (!pageMap.has(pageName)) {
        pageMap.set(pageName, new Map());
      }

      const objects = pageMap.get(pageName)!;
      if (action.objectName && !objects.has(action.objectName)) {
        objects.set(action.objectName, action.objectType);
      }
    }

    const pageObjects: PageObject[] = [];

    for (const [pageName, objects] of pageMap) {
      const selectors: PageSelector[] = [];

      for (const [objName, objType] of objects) {
        selectors.push({
          name: this.toPropertyName(objName),
          selector: this.inferSelector(objName, objType),
          selectorType: this.inferSelectorType(objName),
          originalUFTObject: `${objType}("${objName}")`,
        });
      }

      const className = this.toClassName(pageName);
      const methods = this.generateMethods(selectors);

      pageObjects.push({
        className,
        fileName: this.toFileName(pageName),
        selectors,
        methods,
        imports: [],
      });
    }

    return pageObjects;
  }

  /**
   * Group Object Repository entries by their parent Page.
   */
  private groupByPage(entries: UFTObjectEntry[]): Map<string, UFTObjectEntry[]> {
    const groups = new Map<string, UFTObjectEntry[]>();

    for (const entry of entries) {
      // Skip Browser and Page objects themselves
      if (['Browser', 'Page'].includes(entry.objectType)) continue;

      // Find parent page in hierarchy
      let pageName = 'DefaultPage';
      for (const parent of entry.parentHierarchy) {
        if (parent.startsWith('Page:')) {
          pageName = parent.replace('Page:', '');
          break;
        }
      }

      if (!groups.has(pageName)) {
        groups.set(pageName, []);
      }
      groups.get(pageName)!.push(entry);
    }

    return groups;
  }

  /**
   * Create a PageObject from a page name and its child objects.
   */
  private createPageObject(pageName: string, objects: UFTObjectEntry[]): PageObject {
    const selectors: PageSelector[] = objects.map(obj => ({
      name: this.toPropertyName(obj.logicalName),
      selector: ObjectRepositoryParser.toPlaywrightSelector(obj),
      selectorType: this.determineSelectorType(obj),
      originalUFTObject: `${obj.objectType}("${obj.logicalName}")`,
    }));

    const methods = this.generateMethods(selectors);

    return {
      className: this.toClassName(pageName),
      fileName: this.toFileName(pageName),
      selectors,
      methods,
      imports: [],
    };
  }

  /**
   * Generate common action methods based on selectors and their types.
   */
  private generateMethods(selectors: PageSelector[]): PageMethod[] {
    const methods: PageMethod[] = [];

    for (const sel of selectors) {
      const originalType = sel.originalUFTObject?.match(/^(\w+)/)?.[1] || '';

      switch (originalType) {
        case 'WebEdit':
          methods.push({
            name: `fill${this.toPascalCase(sel.name)}`,
            parameters: [{ name: 'value', type: 'string' }],
            returnType: 'Promise<void>',
            body: `await this.page.locator(this.${sel.name}).fill(value);`,
            isAsync: true,
          });
          break;

        case 'WebButton':
        case 'Link':
        case 'Image':
          methods.push({
            name: `click${this.toPascalCase(sel.name)}`,
            parameters: [],
            returnType: 'Promise<void>',
            body: `await this.page.locator(this.${sel.name}).click();`,
            isAsync: true,
          });
          break;

        case 'WebList':
          methods.push({
            name: `select${this.toPascalCase(sel.name)}`,
            parameters: [{ name: 'value', type: 'string' }],
            returnType: 'Promise<void>',
            body: `await this.page.locator(this.${sel.name}).selectOption(value);`,
            isAsync: true,
          });
          break;

        case 'WebCheckBox':
          methods.push({
            name: `toggle${this.toPascalCase(sel.name)}`,
            parameters: [{ name: 'checked', type: 'boolean' }],
            returnType: 'Promise<void>',
            body: `if (checked) {\n  await this.page.locator(this.${sel.name}).check();\n} else {\n  await this.page.locator(this.${sel.name}).uncheck();\n}`,
            isAsync: true,
          });
          break;

        case 'WebTable':
          methods.push({
            name: `get${this.toPascalCase(sel.name)}CellData`,
            parameters: [
              { name: 'row', type: 'number' },
              { name: 'col', type: 'number' },
            ],
            returnType: 'Promise<string | null>',
            body: `return await this.page.locator(this.${sel.name}).locator('tr').nth(row).locator('td').nth(col).textContent();`,
            isAsync: true,
          });
          break;
      }
    }

    return methods;
  }

  /**
   * Determine the best selector type for an OR entry.
   */
  private determineSelectorType(entry: UFTObjectEntry): PageSelector['selectorType'] {
    const props = entry.properties;
    if (props['data-testid'] || props['data-test-id']) return 'testId';
    if (props['html id']) return 'css';
    if (props['name']) return 'css';
    if (props['aria-label']) return 'label';
    if (props['xpath']) return 'xpath';
    if (props['innertext'] || props['text']) return 'text';
    return 'css';
  }

  /**
   * Infer a selector from object name and type (when no OR is available).
   */
  private inferSelector(objName: string, objType: string): string {
    // If name looks like an HTML id
    if (/^[a-zA-Z_]\w*$/.test(objName) && !objName.includes(' ')) {
      return `#${objName}`;
    }

    // For buttons and links, use text-based selector
    if (['WebButton', 'Link'].includes(objType)) {
      return `text=${objName}`;
    }

    // Default to a data-testid placeholder
    return `[data-testid="${objName}"]`;
  }

  /**
   * Infer selector type from object name patterns.
   */
  private inferSelectorType(objName: string): PageSelector['selectorType'] {
    if (/^[a-zA-Z_]\w*$/.test(objName)) return 'css';
    if (objName.includes(' ')) return 'text';
    return 'css';
  }

  // ==================== String utilities ====================

  private toPropertyName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, char => char.toLowerCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  private toClassName(name: string): string {
    const pascal = name
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, char => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
    return pascal.endsWith('Page') ? pascal : pascal + 'Page';
  }

  private toFileName(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase() + '.page.ts';
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, char => char.toUpperCase());
  }
}
