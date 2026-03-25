/**
 * Object Repository Parser - Parses UFT Object Repository files (.tsr, .bdb, XML exports).
 *
 * UFT Object Repositories store test object definitions with identification properties.
 * This parser extracts object definitions so they can be mapped to Playwright selectors.
 */

import { UFTObjectEntry } from '../models/types';
import { logger } from '../utils/logger';

/** Supported OR export formats */
type ORFormat = 'xml' | 'tsr-text' | 'auto';

export class ObjectRepositoryParser {
  /**
   * Parse an Object Repository file into structured entries.
   * Supports XML export format and text-based TSR dumps.
   */
  parse(content: string, format: ORFormat = 'auto'): UFTObjectEntry[] {
    const detectedFormat = format === 'auto' ? this.detectFormat(content) : format;

    switch (detectedFormat) {
      case 'xml':
        return this.parseXMLFormat(content);
      case 'tsr-text':
        return this.parseTextFormat(content);
      default:
        logger.warn('Unknown OR format, attempting text parse');
        return this.parseTextFormat(content);
    }
  }

  /**
   * Detect the format of the OR content.
   */
  private detectFormat(content: string): ORFormat {
    const trimmed = content.trim();
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<ObjectRepository') || trimmed.startsWith('<qtpRep')) {
      return 'xml';
    }
    return 'tsr-text';
  }

  /**
   * Parse XML-formatted Object Repository export.
   *
   * Expected structure:
   * <ObjectRepository>
   *   <Object Class="Browser" Name="MyApp">
   *     <Properties>
   *       <Property Name="title" Value="My Application" />
   *     </Properties>
   *     <ChildObjects>
   *       <Object Class="Page" Name="HomePage">
   *         <ChildObjects>
   *           <Object Class="WebEdit" Name="username">
   *             <Properties>
   *               <Property Name="html id" Value="txtUsername" />
   *               <Property Name="name" Value="username" />
   *             </Properties>
   *           </Object>
   *         </ChildObjects>
   *       </Object>
   *     </ChildObjects>
   *   </Object>
   * </ObjectRepository>
   */
  private parseXMLFormat(content: string): UFTObjectEntry[] {
    const entries: UFTObjectEntry[] = [];

    // Simple regex-based XML parsing (no external dependency needed)
    this.parseXMLObjects(content, [], entries);

    logger.info(`Parsed ${entries.length} objects from XML Object Repository`);
    return entries;
  }

  /**
   * Recursively parse Object elements from XML content.
   */
  private parseXMLObjects(
    content: string,
    parentHierarchy: string[],
    entries: UFTObjectEntry[]
  ): void {
    // Match Object elements
    const objectPattern = /<Object\s+(?:Class|MicClass)="(\w+)"\s+Name="([^"]*)"[^>]*>([\s\S]*?)<\/Object>/gi;
    let match;

    while ((match = objectPattern.exec(content)) !== null) {
      const objectClass = match[1];
      const objectName = match[2];
      const innerContent = match[3];

      // Extract properties
      const properties: Record<string, string> = {};
      const propPattern = /<Property\s+Name="([^"]*)"\s+Value="([^"]*)"\s*\/>/gi;
      let propMatch;

      while ((propMatch = propPattern.exec(innerContent)) !== null) {
        properties[propMatch[1]] = propMatch[2];
      }

      const currentHierarchy = [...parentHierarchy, `${objectClass}:${objectName}`];

      entries.push({
        logicalName: objectName,
        objectType: objectClass,
        properties,
        parentHierarchy: [...parentHierarchy],
      });

      // Recurse into ChildObjects
      const childMatch = innerContent.match(/<ChildObjects>([\s\S]*?)<\/ChildObjects>/i);
      if (childMatch) {
        this.parseXMLObjects(childMatch[1], currentHierarchy, entries);
      }
    }
  }

  /**
   * Parse text-formatted Object Repository dump.
   *
   * Expected format:
   * [Browser: MyApp]
   *   title = My Application
   *   [Page: HomePage]
   *     [WebEdit: username]
   *       html id = txtUsername
   *       name = username
   */
  private parseTextFormat(content: string): UFTObjectEntry[] {
    const entries: UFTObjectEntry[] = [];
    const lines = content.split(/\r?\n/);
    const hierarchyStack: string[] = [];
    let currentEntry: UFTObjectEntry | null = null;
    let currentIndent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Object header: [ObjectType: ObjectName]
      const headerMatch = trimmed.match(/^\[(\w+):\s*([^\]]+)\]/);
      if (headerMatch) {
        // Calculate indent level
        const indent = line.length - line.trimStart().length;

        // Pop hierarchy stack to match indent
        while (hierarchyStack.length > 0 && indent <= currentIndent) {
          hierarchyStack.pop();
          currentIndent = Math.max(0, currentIndent - 2);
        }

        currentEntry = {
          logicalName: headerMatch[2].trim(),
          objectType: headerMatch[1],
          properties: {},
          parentHierarchy: [...hierarchyStack],
        };

        entries.push(currentEntry);
        hierarchyStack.push(`${headerMatch[1]}:${headerMatch[2].trim()}`);
        currentIndent = indent;
        continue;
      }

      // Property line: key = value
      const propMatch = trimmed.match(/^(\w[\w\s]*?)\s*=\s*(.+)/);
      if (propMatch && currentEntry) {
        currentEntry.properties[propMatch[1].trim()] = propMatch[2].trim();
      }
    }

    logger.info(`Parsed ${entries.length} objects from text Object Repository`);
    return entries;
  }

  /**
   * Convert UFT object properties to best-effort Playwright selectors.
   */
  static toPlaywrightSelector(entry: UFTObjectEntry): string {
    const props = entry.properties;

    // Priority order for selector generation:
    // 1. data-testid or test ID attributes
    if (props['data-testid']) return `[data-testid="${props['data-testid']}"]`;
    if (props['data-test-id']) return `[data-test-id="${props['data-test-id']}"]`;

    // 2. HTML id
    if (props['html id']) return `#${props['html id']}`;

    // 3. name attribute
    if (props['name']) return `[name="${props['name']}"]`;

    // 4. aria-label or accessible name
    if (props['aria-label']) return `[aria-label="${props['aria-label']}"]`;

    // 5. CSS selector from class
    if (props['html tag'] && props['class']) {
      return `${props['html tag']}.${props['class'].replace(/\s+/g, '.')}`;
    }

    // 6. XPath
    if (props['xpath']) return `xpath=${props['xpath']}`;

    // 7. Text content
    if (props['innertext'] || props['text']) {
      const text = props['innertext'] || props['text'];
      return `text=${text}`;
    }

    // 8. Type-specific fallback
    if (props['html tag']) {
      const tag = props['html tag'];
      if (props['value']) return `${tag}[value="${props['value']}"]`;
      if (props['type']) return `${tag}[type="${props['type']}"]`;
      return tag;
    }

    // 9. Use logical name as last resort
    return `[data-testid="${entry.logicalName}"]`;
  }
}
