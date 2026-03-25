# Selenium POM Test Framework

A comprehensive Page Object Model (POM) based Selenium test automation framework built with Java 17, TestNG, and WebDriverManager. Tests run against [the-internet.herokuapp.com](https://the-internet.herokuapp.com) to demonstrate various web interaction patterns.

## Project Structure

```
selenium-pom-tests/
├── pom.xml                                    # Maven build configuration
├── src/
│   ├── main/java/com/automation/
│   │   ├── base/
│   │   │   └── BasePage.java                  # Abstract base page with shared methods
│   │   ├── pages/
│   │   │   ├── LoginPage.java                 # Login page object
│   │   │   ├── DropdownPage.java              # Dropdown interactions
│   │   │   ├── FormPage.java                  # Checkbox & input form interactions
│   │   │   ├── TablePage.java                 # Data table operations
│   │   │   ├── ClickPage.java                 # Click operations (single, JS, double)
│   │   │   ├── MouseActionsPage.java          # Hover, right-click, drag & drop
│   │   │   └── KeyboardActionsPage.java       # Key presses & combinations
│   │   └── utils/
│   │       ├── ConfigReader.java              # Singleton config properties reader
│   │       ├── DriverFactory.java             # ThreadLocal WebDriver factory
│   │       ├── WaitUtils.java                 # Explicit wait utilities
│   │       └── ScreenshotUtils.java           # Failure screenshot capture
│   └── test/
│       ├── java/com/automation/tests/
│       │   ├── BaseTest.java                  # Test lifecycle (setup/teardown)
│       │   ├── LoginTest.java                 # 7 login/logout tests
│       │   ├── DropdownTest.java              # 8 dropdown selection tests
│       │   ├── FormTest.java                  # 10 checkbox & input tests
│       │   ├── TableTest.java                 # 12 table operation tests
│       │   ├── ClickTest.java                 # 7 click interaction tests
│       │   ├── MouseActionsTest.java          # 7 mouse action tests
│       │   └── KeyboardActionsTest.java       # 14 keyboard action tests
│       └── resources/
│           ├── testng.xml                     # TestNG suite configuration
│           ├── config.properties              # Test configuration
│           └── log4j2.xml                     # Logging configuration
```

## Operations Covered

| Category     | Page Object             | Operations                                                  |
|-------------|------------------------|-------------------------------------------------------------|
| **Login**    | `LoginPage`            | Enter credentials, submit form, verify success/error, logout |
| **Dropdown** | `DropdownPage`         | Select by text/value/index, read options, verify selection   |
| **Form**     | `FormPage`             | Checkbox toggle/check/uncheck, number input, clear fields    |
| **Table**    | `TablePage`            | Read headers/rows/columns/cells, sort by header, search data |
| **Click**    | `ClickPage`            | Single click, JS click, double click, dynamic element CRUD   |
| **Mouse**    | `MouseActionsPage`     | Hover, right-click, drag & drop                             |
| **Keyboard** | `KeyboardActionsPage`  | Regular keys, special keys, arrow keys, key combinations     |

## Prerequisites

- **Java 17+**
- **Maven 3.8+**
- **Chrome browser** (default) or Firefox/Edge

## Running Tests

```bash
# Run all tests (default: Chrome headless)
cd selenium-pom-tests
mvn clean test

# Run with a specific browser
mvn clean test -Pbrowser=firefox

# Run a specific test class
mvn clean test -Dtest=LoginTest

# Run a specific test method
mvn clean test -Dtest=LoginTest#testValidLogin
```

## Configuration

Edit `src/test/resources/config.properties` to customize:
- **Browser**: `chrome`, `firefox`, or `edge`
- **Headless mode**: `true` / `false`
- **Timeouts**: implicit wait, explicit wait, page load timeout
- **URLs**: base URL and page-specific URLs
- **Screenshots**: path and on-failure toggle

## Key Design Patterns

- **Page Object Model (POM)**: Each page has its own class encapsulating locators and actions
- **Fluent API**: Page methods return `this` for method chaining
- **Factory Pattern**: `DriverFactory` manages WebDriver creation per browser type
- **Singleton**: `ConfigReader` ensures single config instance
- **ThreadLocal**: WebDriver stored in ThreadLocal for parallel test execution
- **Base class inheritance**: `BasePage` provides shared methods; `BaseTest` handles lifecycle

## Reports & Logs

- **Test reports**: `target/surefire-reports/`
- **Logs**: `target/logs/automation.log`
- **Screenshots** (on failure): `target/screenshots/`
