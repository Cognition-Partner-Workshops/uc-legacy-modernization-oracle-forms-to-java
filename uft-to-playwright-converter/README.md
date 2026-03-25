# UFT to Playwright Converter

Automated tool for converting UFT/QTP VBScript test scripts to Playwright TypeScript tests. Designed to handle large-scale migrations (800+ scripts) with batch processing, detailed reporting, and Page Object Model generation.

## Features

- **VBScript Parser**: Parses UFT scripts including object hierarchies, functions, variables, DataTable references, and control flow
- **Object Repository Parser**: Reads UFT Object Repository exports (XML, TSR) and converts objects to Playwright selectors
- **Action Mapper**: Comprehensive mapping of 50+ UFT object methods to Playwright equivalents (WebEdit, WebButton, WebList, WebTable, Link, Dialog, etc.)
- **Page Object Generator**: Auto-generates Page Object Model classes from script analysis or Object Repository
- **Script Analyzer**: Pre-conversion assessment with complexity scoring, confidence estimation, and effort projection
- **Batch Converter**: Processes hundreds of scripts with detailed HTML/JSON reports
- **Custom Overrides**: YAML-based mapping overrides for project-specific selectors

## Quick Start

```bash
# Install dependencies
cd uft-to-playwright-converter
npm install

# Build the project
npm run build

# Analyze scripts (pre-migration assessment)
npm run analyze -- --input ./path/to/uft-scripts --output ./analysis-output

# Convert scripts
npm run convert -- --input ./path/to/uft-scripts --output ./playwright-output
```

## Commands

### `analyze` - Pre-Migration Assessment
Analyzes UFT scripts without converting them. Produces a report with complexity distribution, effort estimates, and unsupported pattern detection.

```bash
npx uft2playwright analyze --input ./uft-scripts --output ./analysis-report
```

### `convert` - Full Conversion
Converts UFT scripts to Playwright TypeScript test files with Page Objects, configuration, and reports.

```bash
npx uft2playwright convert \
  --input ./uft-scripts \
  --output ./playwright-tests \
  --base-url http://localhost:3000 \
  --browsers chromium,firefox \
  --config ./config/default-config.yaml
```

#### Options

| Option | Description | Default |
|---|---|---|
| `-i, --input <dir>` | Input directory with UFT scripts | (required) |
| `-o, --output <dir>` | Output directory for Playwright tests | (required) |
| `-c, --config <file>` | YAML/JSON config file | - |
| `--base-url <url>` | Application base URL | `http://localhost:3000` |
| `--browsers <list>` | Comma-separated browser list | `chromium` |
| `--no-page-objects` | Skip Page Object generation | `false` |
| `--preserve-comments` | Include original UFT lines as comments | `true` |
| `--or-path <dir>` | Path to Object Repository files | - |
| `--mapping-overrides <file>` | Custom selector mappings YAML | - |
| `--report-format <fmt>` | Report format (html/json/junit/list) | `html` |
| `--parallel` | Enable parallel test execution | `false` |
| `--retries <n>` | Test retry count | `2` |
| `--timeout <ms>` | Action timeout | `30000` |

## Project Structure

```
uft-to-playwright-converter/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── converter-engine.ts         # Main orchestrator
│   ├── models/
│   │   └── types.ts                # TypeScript type definitions
│   ├── parsers/
│   │   ├── vbscript-parser.ts      # UFT VBScript parser
│   │   └── object-repository-parser.ts  # OR file parser
│   ├── transformers/
│   │   ├── action-mapper.ts        # UFT-to-Playwright action mapping
│   │   └── script-transformer.ts   # Script transformation logic
│   ├── generators/
│   │   ├── playwright-generator.ts # Playwright test file generator
│   │   └── page-object-generator.ts # Page Object class generator
│   ├── analyzers/
│   │   └── script-analyzer.ts      # Pre-conversion analysis
│   └── utils/
│       ├── logger.ts               # Logging utility
│       ├── file-utils.ts           # File I/O utilities
│       └── report-generator.ts     # HTML/JSON report generator
├── config/
│   ├── default-config.yaml         # Default configuration
│   └── mapping-overrides-example.yaml  # Example custom mappings
├── examples/
│   └── uft-scripts/               # Example UFT scripts
│       ├── login-test.vbs
│       ├── employee-crud.vbs
│       └── leave-request.vbs
├── tests/                          # Unit tests
│   ├── vbscript-parser.test.ts
│   ├── action-mapper.test.ts
│   └── script-analyzer.test.ts
├── docs/
│   ├── migration-plan.md           # Full migration plan for 800 scripts
│   └── migration-questionnaire.md  # Discovery questionnaire
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Supported UFT Object Mappings

| UFT Object | UFT Method | Playwright Equivalent | Confidence |
|---|---|---|---|
| Browser | Navigate | `page.goto()` | 95% |
| Browser | Close | `page.close()` | 90% |
| Browser | Back/Forward | `page.goBack()`/`page.goForward()` | 95% |
| Browser | Sync | `page.waitForLoadState()` | 85% |
| WebEdit | Set | `page.locator().fill()` | 95% |
| WebEdit | SetSecure | `page.locator().fill()` | 85% |
| WebEdit | Type | `page.locator().pressSequentially()` | 90% |
| WebButton | Click | `page.locator().click()` | 95% |
| WebList | Select | `page.locator().selectOption()` | 90% |
| WebCheckBox | Set ON/OFF | `page.locator().check()`/`.uncheck()` | 90% |
| WebRadioGroup | Select | `page.locator().check()` | 80% |
| WebTable | GetCellData | `page.locator('tr').nth().locator('td').nth().textContent()` | 75% |
| WebTable | GetRowCount | `page.locator('tr').count()` | 80% |
| WebElement | Click | `page.locator().click()` | 90% |
| WebElement | Hover | `page.locator().hover()` | 90% |
| Link | Click | `page.locator().click()` | 95% |
| Dialog | Click | `page.on('dialog', ...)` | 80% |
| Reporter | ReportEvent | `console.log()` / `expect()` | 70% |
| Wait | N seconds | `page.waitForTimeout()` | 90% |
| SystemUtil | Run | `page.goto()` | 70% |
| * | Exist | `page.locator().isVisible()` | 85% |
| * | GetROProperty | `page.locator().getAttribute()` | 80% |
| * | CheckProperty | `expect().toHaveAttribute()` | 75% |
| * | WaitProperty | `page.locator().waitFor()` | 80% |

## Custom Mapping Overrides

Create a YAML file to map UFT object names to specific Playwright selectors:

```yaml
overrides:
  - uftObjectType: WebEdit
    uftObjectName: txt_username
    playwrightSelector: "#username"
    selectorType: css

  - uftObjectType: WebButton
    uftObjectName: btn_login
    playwrightSelector: "button[type='submit']"
    selectorType: css
```

Use with: `--mapping-overrides ./config/my-mappings.yaml`

## Migration Workflow

See `docs/migration-plan.md` for the complete 12-week plan to migrate 800 scripts. The high-level process is:

1. **Analyze** - Run the analyzer to assess all scripts
2. **Configure** - Set up mapping overrides and project config
3. **Convert** - Batch-convert scripts by module
4. **Review** - Fix TODO items and update selectors
5. **Validate** - Run converted tests and stabilize
6. **Deploy** - Integrate into CI/CD pipeline

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- convert --input ./examples/uft-scripts --output ./test-output

# Run tests
npm test

# Lint
npm run lint

# Build for production
npm run build
```

## License

MIT
