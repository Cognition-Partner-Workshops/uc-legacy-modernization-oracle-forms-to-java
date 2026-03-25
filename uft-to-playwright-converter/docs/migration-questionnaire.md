# UFT to Playwright Migration - Discovery Questionnaire

## Purpose

Before converting 800 UFT scripts to Playwright, a thorough discovery phase is critical. Use this questionnaire to gather information about the existing UFT test suite, the application under test, and organizational requirements.

---

## Section 1: UFT Script Inventory & Structure

### 1.1 Script Organization
- [ ] How are the 800 scripts organized? (by module, by feature, by sprint, flat?)
- [ ] What is the folder/directory structure of the UFT scripts?
- [ ] Are scripts stored in ALM/Quality Center, file system, or version control?
- [ ] Is there a naming convention for scripts? If so, document it.
- [ ] Are there shared action libraries? How many? What do they contain?

### 1.2 Script Types
- [ ] How many scripts use **Linear scripting** (record & playback)?
- [ ] How many use **Modular scripting** (reusable actions)?
- [ ] How many use **Data-driven scripting** (parameterized with DataTable)?
- [ ] How many use **Keyword-driven** (BPT/Business Process Testing)?
- [ ] How many use **Hybrid** approaches?

### 1.3 Script Complexity
- [ ] Average number of steps per script?
- [ ] Average number of actions per script?
- [ ] Maximum script complexity (lines of VBScript)?
- [ ] Are there scripts with more than 500 lines of code?
- [ ] How many scripts use conditional logic (If/Then/Else)?
- [ ] How many scripts use loops (For/While)?

### 1.4 Object Repository
- [ ] Are Object Repositories **shared** or **local** (per-action)?
- [ ] Total number of objects across all repositories?
- [ ] What object identification strategies are used? (Name, CSS, XPath, RegEx, Visual?)
- [ ] Are there **Descriptive Programming** usages? How extensively?
- [ ] Object types breakdown: WebEdit, WebButton, WebList, WebTable, WebElement, etc.

---

## Section 2: Application Under Test (AUT)

### 2.1 Application Type
- [ ] Is the AUT a **web application**, **desktop application**, or **hybrid**?
- [ ] If web: What browsers are supported? (Chrome, Firefox, Edge, Safari)
- [ ] If web: Is it a Single Page Application (SPA) or traditional multi-page?
- [ ] What frontend framework? (React, Angular, Vue, jQuery, plain HTML, Oracle Forms, etc.)
- [ ] Does the app use iFrames? Shadow DOM? Web Components?

### 2.2 Application Architecture
- [ ] What is the application URL structure?
- [ ] How many distinct pages/screens does the AUT have?
- [ ] Does the app have dynamic content loading (AJAX, WebSocket)?
- [ ] Are there file upload/download scenarios?
- [ ] Are there popup windows or modal dialogs?
- [ ] Does the app use browser alerts (alert, confirm, prompt)?

### 2.3 Authentication & Authorization
- [ ] What authentication mechanism? (Form-based, SSO, LDAP, OAuth, MFA?)
- [ ] How many user roles need testing?
- [ ] Are test credentials managed centrally?
- [ ] Is there session timeout handling in the scripts?

### 2.4 Test Environments
- [ ] How many test environments exist? (Dev, QA, Staging, UAT, Pre-prod)
- [ ] Are environment URLs parameterized in UFT scripts?
- [ ] Do environments require VPN or special network access?
- [ ] Are test databases refreshed between runs?

---

## Section 3: UFT Technical Details

### 3.1 VBScript Patterns
- [ ] List all VBScript functions used across scripts (custom utility functions)
- [ ] Are there external VBScript libraries (.vbs files) loaded?
- [ ] How is error handling done? (On Error Resume Next, Recovery Scenarios?)
- [ ] Are there COM object interactions (Excel, Word, Outlook, databases)?
- [ ] Are there WScript.Shell or FileSystemObject usages?
- [ ] Are there database interactions (ADODB connections)?

### 3.2 Data Sources
- [ ] Where does test data come from? (DataTable, Excel, CSV, Database, XML, JSON?)
- [ ] How many external data files are used?
- [ ] Are data files environment-specific?
- [ ] Is test data generated dynamically or static?
- [ ] Are there data cleanup/teardown steps?

### 3.3 Synchronization
- [ ] What wait mechanisms are used? (Wait, WaitProperty, Sync, Exist?)
- [ ] Are there hard-coded waits (Wait N seconds)?
- [ ] Average wait timeout values?
- [ ] Are there polling loops for element readiness?

### 3.4 Reporting & Logging
- [ ] What reporting mechanism? (UFT built-in, custom HTML, ALM integration?)
- [ ] Are screenshots captured on failure? On every step?
- [ ] Are custom log files generated?
- [ ] Is there integration with external reporting tools?

### 3.5 Recovery Scenarios
- [ ] How many Recovery Scenarios are defined?
- [ ] What triggers them? (popup, object state, test run error, app crash?)
- [ ] What recovery actions are taken?

### 3.6 Environment Variables & Parameters
- [ ] Are UFT environment variables used? (Built-in or user-defined?)
- [ ] Are test parameters passed from ALM/external sources?
- [ ] Is there a configuration file for test settings?

---

## Section 4: Integration Points

### 4.1 CI/CD Integration
- [ ] Are UFT scripts integrated with CI/CD? (Jenkins, Azure DevOps, GitHub Actions?)
- [ ] What is the current execution trigger? (Manual, scheduled, on-commit?)
- [ ] What is the average execution time for the full suite?
- [ ] What is the expected Playwright execution environment? (CI runners, Docker, cloud?)

### 4.2 Test Management
- [ ] Is HP ALM / Quality Center used for test management?
- [ ] Are test results pushed to a dashboard or reporting system?
- [ ] Is there defect tracking integration? (Jira, ServiceNow, etc.)
- [ ] Are there test execution schedules?

### 4.3 External Dependencies
- [ ] Do scripts interact with APIs directly (REST/SOAP)?
- [ ] Do scripts interact with databases for validation?
- [ ] Do scripts interact with message queues or middleware?
- [ ] Are there file system operations (read/write files, FTP)?
- [ ] Are there email verification steps (Outlook, SMTP)?

---

## Section 5: Migration Requirements

### 5.1 Target Framework Decisions
- [ ] Playwright language preference: **TypeScript** (recommended), JavaScript, Python, Java, C#?
- [ ] Page Object Model (POM) architecture desired?
- [ ] Test runner preference: Playwright Test (recommended), Jest, Mocha?
- [ ] Parallel execution requirements?
- [ ] Cross-browser testing requirements?

### 5.2 Priority & Phasing
- [ ] Which modules/features are highest priority for migration?
- [ ] Can scripts be migrated in batches? What batch size?
- [ ] Are there scripts that can be deprecated (redundant, obsolete)?
- [ ] What is the target completion date?
- [ ] Will UFT and Playwright run in parallel during transition?

### 5.3 Quality Gates
- [ ] What is the acceptable pass rate for converted scripts on first run?
- [ ] How will functional equivalence be validated?
- [ ] Who will review and approve converted scripts?
- [ ] Are there performance benchmarks for script execution time?

### 5.4 Team & Skills
- [ ] How many team members will work on migration?
- [ ] Current team experience with Playwright/TypeScript?
- [ ] Is training needed before migration begins?
- [ ] Who are the SMEs for each application module?

---

## Section 6: Non-Functional Requirements

### 6.1 Maintainability
- [ ] Code review process for converted scripts?
- [ ] Coding standards and linting rules?
- [ ] Documentation requirements for converted tests?

### 6.2 Scalability
- [ ] Expected growth in test scripts post-migration?
- [ ] Need for API testing alongside UI testing?
- [ ] Need for visual regression testing?
- [ ] Need for accessibility testing?

### 6.3 Infrastructure
- [ ] Where will Playwright tests execute? (Local, CI, Selenium Grid, cloud?)
- [ ] Browser versions to support?
- [ ] OS platforms to support?
- [ ] Network/firewall considerations?
