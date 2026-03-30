/**
 * Action Mapper - Maps UFT object methods to Playwright equivalents.
 *
 * Comprehensive mapping from UFT/QTP object types and methods
 * to Playwright API calls, covering:
 * - Web objects (Browser, Page, WebEdit, WebButton, WebList, WebTable, etc.)
 * - Dialog handling
 * - Synchronization methods
 * - Verification/checkpoint methods
 * - Utility actions (Reporter, SystemUtil, Wait)
 */

import { UFTAction, PlaywrightAction } from '../models/types';
import { logger } from '../utils/logger';

/** Mapping entry from UFT method to Playwright code */
interface MethodMapping {
  playwright: string;
  isAsync: boolean;
  imports: string[];
  needsSelector: boolean;
  confidence: number;
  argTransform?: (args: string[]) => string[];
  notes?: string;
}

/** Map of UFT ObjectType -> Method -> Playwright mapping */
type MappingTable = Record<string, Record<string, MethodMapping>>;

export class ActionMapper {
  private mappings: MappingTable;
  private customOverrides: Map<string, MethodMapping> = new Map();

  constructor() {
    this.mappings = this.buildMappingTable();
  }

  /**
   * Add custom mapping overrides for project-specific objects.
   */
  addOverride(objectType: string, method: string, mapping: MethodMapping): void {
    const key = `${objectType}.${method}`;
    this.customOverrides.set(key, mapping);
  }

  /**
   * Map a UFT action to a Playwright action.
   */
  map(action: UFTAction, selector?: string): PlaywrightAction {
    // Check custom overrides first
    const overrideKey = `${action.objectType}.${action.method}`;
    const override = this.customOverrides.get(overrideKey);
    if (override) {
      return this.applyMapping(action, override, selector);
    }

    // Look up in mapping table
    const objectMappings = this.mappings[action.objectType];
    if (!objectMappings) {
      return this.createUnmappedAction(action, `Unsupported object type: ${action.objectType}`);
    }

    const methodMapping = objectMappings[action.method];
    if (!methodMapping) {
      return this.createUnmappedAction(
        action,
        `Unsupported method: ${action.objectType}.${action.method}`
      );
    }

    return this.applyMapping(action, methodMapping, selector);
  }

  /**
   * Apply a mapping to generate Playwright code.
   */
  private applyMapping(
    action: UFTAction,
    mapping: MethodMapping,
    selector?: string
  ): PlaywrightAction {
    let code = mapping.playwright;
    const warnings: string[] = [];

    // Replace selector placeholder
    const sel = selector || this.inferSelector(action);
    code = code.replace('{{SELECTOR}}', sel);

    // Replace argument placeholders
    const args = mapping.argTransform
      ? mapping.argTransform(action.arguments)
      : action.arguments;

    for (let i = 0; i < args.length; i++) {
      const cleaned = this.cleanArgument(args[i]);
      code = code.replace(`{{ARG${i}}}`, cleaned);
    }

    // Replace remaining unfilled placeholders
    code = code.replace(/\{\{ARG\d+\}\}/g, '');

    // Detect VBScript variables used in numeric positions like .nth(varName)
    // and replace with a placeholder so generated TypeScript compiles
    code = code.replace(/\.nth\(([a-zA-Z_]\w*)\)/g, (match, varName) => {
      warnings.push(`VBScript variable '${varName}' used as index. Replace with actual value or loop variable.`);
      return `.nth(0 /* TODO: replace '${varName}' with actual index */)`;
    });

    // Clean up trailing commas or empty parens
    code = code.replace(/,\s*\)/g, ')');
    code = code.replace(/\(\s*,/g, '(');

    if (mapping.confidence < 80) {
      warnings.push(`Low confidence mapping (${mapping.confidence}%): ${action.objectType}.${action.method}`);
    }

    if (mapping.notes) {
      warnings.push(`Note: ${mapping.notes}`);
    }

    return {
      code,
      imports: [...mapping.imports],
      comments: action.description ? [`// ${action.description}`] : [],
      isAsync: mapping.isAsync,
      confidence: mapping.confidence,
      originalUFTLine: action.rawLine,
      warnings,
    };
  }

  /**
   * Create a placeholder for unmapped actions.
   */
  private createUnmappedAction(action: UFTAction, reason: string): PlaywrightAction {
    logger.warn(`Unmapped action at line ${action.lineNumber}: ${reason}`);

    return {
      code: `// TODO: Manual conversion needed - ${reason}\n// Original: ${action.rawLine}`,
      imports: [],
      comments: [`// UNMAPPED: ${action.rawLine}`],
      isAsync: false,
      confidence: 0,
      originalUFTLine: action.rawLine,
      warnings: [reason],
    };
  }

  /**
   * Infer a Playwright selector from UFT action properties.
   */
  private inferSelector(action: UFTAction): string {
    if (!action.objectName) return `'[data-testid="unknown"]'`;

    // If object name looks like an ID
    if (/^[a-zA-Z_]\w*$/.test(action.objectName) && !action.objectName.includes(' ')) {
      return `'#${action.objectName}'`;
    }

    // If it looks like text content
    if (action.objectName.includes(' ') || /^[A-Z]/.test(action.objectName)) {
      // Use role-based selector for buttons
      if (['WebButton', 'WinButton'].includes(action.objectType)) {
        return `page.getByRole('button', { name: '${action.objectName}' })`;
      }
      if (action.objectType === 'Link') {
        return `page.getByRole('link', { name: '${action.objectName}' })`;
      }
      return `page.getByText('${action.objectName}')`;
    }

    return `'#${action.objectName}'`;
  }

  /**
   * Clean a VBScript argument value for use in TypeScript.
   */
  private cleanArgument(arg: string): string {
    if (!arg) return '';

    // Remove surrounding quotes if present
    let cleaned = arg.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    return cleaned;
  }

  /**
   * Build the comprehensive UFT-to-Playwright mapping table.
   */
  private buildMappingTable(): MappingTable {
    return {
      // ==================== WEB OBJECTS ====================

      Browser: {
        Navigate: {
          playwright: "await page.goto('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 95,
        },
        Close: {
          playwright: 'await page.close()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 90,
        },
        Back: {
          playwright: 'await page.goBack()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 95,
        },
        Forward: {
          playwright: 'await page.goForward()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 95,
        },
        Refresh: {
          playwright: 'await page.reload()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 95,
        },
        FullScreen: {
          playwright: "// Browser FullScreen - handled via viewport\nawait page.setViewportSize({ width: 1920, height: 1080 })",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 70,
        },
        Sync: {
          playwright: "await page.waitForLoadState('networkidle')",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 85,
        },
        ClearCache: {
          playwright: '// ClearCache - clear browser context storage\nawait context.clearCookies()',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 70,
          notes: 'Playwright clears cache via context. May need context.clearPermissions() too.',
        },
      },

      Page: {
        Sync: {
          playwright: "await page.waitForLoadState('networkidle')",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 85,
        },
        CheckProperty: {
          playwright: "await expect(page).toHaveTitle(/{{ARG1}}/)",
          isAsync: true,
          imports: ['expect'],
          needsSelector: false,
          confidence: 60,
          notes: 'Property check depends on which property. May need adjustment.',
        },
      },

      WebEdit: {
        Set: {
          playwright: "await page.locator({{SELECTOR}}).fill('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 95,
        },
        SetSecure: {
          playwright: "await page.locator({{SELECTOR}}).fill('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
          notes: 'SetSecure uses encrypted values in UFT. Replace with actual test credential.',
        },
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 95,
        },
        Type: {
          playwright: "await page.locator({{SELECTOR}}).pressSequentially('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        CheckProperty: {
          playwright: "await expect(page.locator({{SELECTOR}})).toHaveAttribute('{{ARG0}}', '{{ARG1}}')",
          isAsync: true,
          imports: ['expect'],
          needsSelector: true,
          confidence: 75,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        WaitProperty: {
          playwright: 'await page.locator({{SELECTOR}}).waitFor({ state: \'visible\', timeout: {{ARG2}} })',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
      },

      WebButton: {
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 95,
        },
        Submit: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
          notes: 'UFT Submit maps to click in Playwright. Form submission is automatic.',
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        CheckProperty: {
          playwright: "await expect(page.locator({{SELECTOR}})).toHaveAttribute('{{ARG0}}', '{{ARG1}}')",
          isAsync: true,
          imports: ['expect'],
          needsSelector: true,
          confidence: 75,
        },
        WaitProperty: {
          playwright: "await page.locator({{SELECTOR}}).waitFor({ state: 'visible', timeout: {{ARG2}} })",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
      },

      WebList: {
        Select: {
          playwright: "await page.locator({{SELECTOR}}).selectOption('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        GetItemsCount: {
          playwright: "await page.locator({{SELECTOR}}).locator('option').count()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
      },

      WebCheckBox: {
        Set: {
          playwright: 'await page.locator({{SELECTOR}}).{{ARG0}}()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
          argTransform: (args: string[]): string[] => {
            const val = (args[0] || '').replace(/"/g, '').trim().toUpperCase();
            return [val === 'OFF' ? 'uncheck' : 'check'];
          },
        },
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        GetROProperty: {
          playwright: 'await page.locator({{SELECTOR}}).isChecked()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
      },

      WebRadioGroup: {
        Select: {
          playwright: "await page.locator({{SELECTOR}}).locator(`[value='{{ARG0}}']`).check()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 75,
        },
      },

      WebTable: {
        GetCellData: {
          playwright: "await page.locator({{SELECTOR}}).locator('tr').nth({{ARG0}}).locator('td').nth({{ARG1}}).textContent()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 75,
          notes: 'UFT table indices are 1-based; Playwright nth() is 0-based. Adjust indices.',
        },
        GetRowCount: {
          playwright: "await page.locator({{SELECTOR}}).locator('tr').count()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        ChildItem: {
          playwright: "await page.locator({{SELECTOR}}).locator('tr').nth({{ARG0}}).locator('td').nth({{ARG1}}).locator('{{ARG2}}').click()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 60,
          notes: 'ChildItem mapping varies greatly. Manual review recommended.',
        },
        GetCellProperty: {
          playwright: "await page.locator({{SELECTOR}}).locator('tr').nth({{ARG0}}).locator('td').nth({{ARG1}}).getAttribute('{{ARG2}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 65,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 75,
          notes: 'WebTable GetROProperty - property name may need adjustment for Playwright.',
        },
      },

      Link: {
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 95,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
      },

      Image: {
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
      },

      WebElement: {
        Click: {
          playwright: 'await page.locator({{SELECTOR}}).click()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        Set: {
          playwright: "await page.locator({{SELECTOR}}).fill('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        GetROProperty: {
          playwright: "await page.locator({{SELECTOR}}).getAttribute('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
        Hover: {
          playwright: 'await page.locator({{SELECTOR}}).hover()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 90,
        },
        FireEvent: {
          playwright: "await page.locator({{SELECTOR}}).dispatchEvent('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 75,
        },
        DragDrop: {
          playwright: '// TODO: Implement drag and drop\n// await page.locator({{SELECTOR}}).dragTo(page.locator(targetSelector))',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 40,
          notes: 'DragDrop requires manual implementation with target selector.',
        },
        Exist: {
          playwright: 'await page.locator({{SELECTOR}}).isVisible()',
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 85,
        },
        WaitProperty: {
          playwright: "await page.locator({{SELECTOR}}).waitFor({ state: 'visible', timeout: {{ARG2}} })",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 80,
        },
      },

      Frame: {
        // Frame handling - switch to frame context
        Click: {
          playwright: "await page.frameLocator({{SELECTOR}}).locator('body').click()",
          isAsync: true,
          imports: [],
          needsSelector: true,
          confidence: 70,
          notes: 'Frame handling in Playwright uses frameLocator. May need adjustment.',
        },
      },

      // ==================== DIALOG OBJECTS ====================

      Dialog: {
        Click: {
          playwright: "page.on('dialog', dialog => dialog.accept())",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 80,
        },
        SetText: {
          playwright: "page.on('dialog', dialog => dialog.accept('{{ARG0}}'))",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 75,
        },
        Exist: {
          playwright: '// Dialog exist check - use page.on("dialog") event handler',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 60,
        },
      },

      // ==================== UTILITY OBJECTS ====================

      Reporter: {
        ReportEvent: {
          playwright: "// Assertion: {{ARG1}} - {{ARG2}}\nconsole.log('[{{ARG0}}] {{ARG1}}: {{ARG2}}')",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 70,
          notes: 'Reporter events can be replaced with test.info() or expect() assertions.',
        },
      },

      Utility: {
        Wait: {
          playwright: 'await page.waitForTimeout({{ARG0}} * 1000)',
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 90,
          notes: 'Consider replacing hard waits with waitForSelector or waitForLoadState.',
        },
        MsgBox: {
          playwright: "console.log('MsgBox: ' + {{ARG0}})",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 50,
          notes: 'MsgBox is a debug tool. Remove or convert to console.log in tests.',
        },
        Print: {
          playwright: 'console.log({{ARG0}})',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 85,
        },
        ExecuteFile: {
          playwright: "// TODO: ExecuteFile('{{ARG0}}') - Import the converted module\nimport { /* functions */ } from './{{ARG0}}'",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 30,
          notes: 'ExecuteFile needs manual import of converted module.',
        },
      },

      SystemUtil: {
        Run: {
          playwright: "await page.goto('{{ARG0}}')",
          isAsync: true,
          imports: [],
          needsSelector: false,
          confidence: 70,
          notes: 'SystemUtil.Run usually opens a URL. Adjust if it launches a desktop app.',
        },
      },

      // ==================== WINDOW/DESKTOP OBJECTS ====================
      // These are typically not convertible to Playwright (web-only)
      // but we provide helpful TODO comments

      Window: {
        Click: {
          playwright: '// TODO: Desktop Window interaction not supported in Playwright\n// Consider using a desktop automation tool or API calls instead\n// Original: {{SELECTOR}}.Click',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
          notes: 'Desktop Window objects cannot be automated with Playwright. Use Electron or API testing.',
        },
        Close: {
          playwright: '// TODO: Desktop Window.Close - not supported in Playwright',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
        },
        Activate: {
          playwright: '// TODO: Desktop Window.Activate - not supported in Playwright',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
        },
      },

      WinButton: {
        Click: {
          playwright: '// TODO: Desktop WinButton.Click - not supported in Playwright\n// Original: {{SELECTOR}}.Click',
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
        },
      },

      WinEdit: {
        Set: {
          playwright: "// TODO: Desktop WinEdit.Set - not supported in Playwright\n// Original: {{SELECTOR}}.Set '{{ARG0}}'",
          isAsync: false,
          imports: [],
          needsSelector: false,
          confidence: 10,
        },
      },
    };
  }

  /**
   * Get a list of all supported UFT object types.
   */
  getSupportedObjectTypes(): string[] {
    return Object.keys(this.mappings);
  }

  /**
   * Get all supported methods for a given object type.
   */
  getSupportedMethods(objectType: string): string[] {
    const objectMappings = this.mappings[objectType];
    return objectMappings ? Object.keys(objectMappings) : [];
  }
}
