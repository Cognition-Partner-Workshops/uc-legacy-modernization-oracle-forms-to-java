import { type Page, type Locator } from '@playwright/test';

/**
 * Employee Page Object Model
 *
 * Replaces: UFT Object Repository entries for HRMS_EMPLOYEE form
 * Maps form blocks (EMPLOYEE_HEADER, EMPLOYEE_DETAIL, SALARY, HISTORY) to POM locators
 *
 * UFT legacy:
 *   Browser("HRMS").Page("Employee").WebEdit("first_name").Set "JANE"
 *   Browser("HRMS").Page("Employee").WebList("department").Select "Engineering"
 *   Browser("HRMS").Page("Employee").WebButton("Save").Click
 */
export class EmployeePage {
  readonly page: Page;

  /* Employee List View */
  readonly employeeTable: Locator;
  readonly employeeRows: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly addEmployeeButton: Locator;
  readonly statusFilter: Locator;
  readonly departmentFilter: Locator;

  /* Employee Form — Create/Edit */
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneWorkInput: Locator;
  readonly phoneMobileInput: Locator;
  readonly hireDateInput: Locator;
  readonly departmentSelect: Locator;
  readonly jobTitleSelect: Locator;
  readonly managerSelect: Locator;
  readonly locationSelect: Locator;
  readonly employmentTypeSelect: Locator;
  readonly genderSelect: Locator;
  readonly startingSalaryInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  /* Employee Detail View */
  readonly employeeNumber: Locator;
  readonly employmentStatus: Locator;
  readonly activeFlag: Locator;
  readonly editButton: Locator;
  readonly transferButton: Locator;
  readonly terminateButton: Locator;
  readonly salaryHistoryTab: Locator;
  readonly employmentHistoryTab: Locator;
  readonly directReportsTab: Locator;

  /* Transfer Dialog */
  readonly transferDeptSelect: Locator;
  readonly transferDateInput: Locator;
  readonly transferReasonInput: Locator;
  readonly confirmTransferButton: Locator;

  /* Termination Dialog */
  readonly terminationDateInput: Locator;
  readonly terminationReasonSelect: Locator;
  readonly terminationNotesInput: Locator;
  readonly confirmTerminateButton: Locator;

  /* Validation Messages */
  readonly validationErrors: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    /* Employee List View */
    this.employeeTable = page.locator('table[data-testid="employee-table"]');
    this.employeeRows = page.locator('table[data-testid="employee-table"] tbody tr');
    this.searchInput = page.getByPlaceholder('Search by name...');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.addEmployeeButton = page.getByRole('button', { name: 'Add Employee' });
    this.statusFilter = page.getByLabel('Status');
    this.departmentFilter = page.getByLabel('Department');

    /* Employee Form */
    this.firstNameInput = page.getByLabel('First Name');
    this.lastNameInput = page.getByLabel('Last Name');
    this.emailInput = page.getByLabel('Email');
    this.phoneWorkInput = page.getByLabel('Work Phone');
    this.phoneMobileInput = page.getByLabel('Mobile Phone');
    this.hireDateInput = page.getByLabel('Hire Date');
    this.departmentSelect = page.getByLabel('Department', { exact: true });
    this.jobTitleSelect = page.getByLabel('Job Title');
    this.managerSelect = page.getByLabel('Manager');
    this.locationSelect = page.getByLabel('Location');
    this.employmentTypeSelect = page.getByLabel('Employment Type');
    this.genderSelect = page.getByLabel('Gender');
    this.startingSalaryInput = page.getByLabel('Starting Salary');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });

    /* Employee Detail View */
    this.employeeNumber = page.locator('[data-testid="emp-number"]');
    this.employmentStatus = page.locator('[data-testid="employment-status"]');
    this.activeFlag = page.locator('[data-testid="active-flag"]');
    this.editButton = page.getByRole('button', { name: 'Edit' });
    this.transferButton = page.getByRole('button', { name: 'Transfer' });
    this.terminateButton = page.getByRole('button', { name: 'Terminate' });
    this.salaryHistoryTab = page.getByRole('tab', { name: 'Salary History' });
    this.employmentHistoryTab = page.getByRole('tab', { name: 'Employment History' });
    this.directReportsTab = page.getByRole('tab', { name: 'Direct Reports' });

    /* Transfer Dialog */
    this.transferDeptSelect = page.getByLabel('New Department');
    this.transferDateInput = page.getByLabel('Effective Date');
    this.transferReasonInput = page.getByLabel('Reason');
    this.confirmTransferButton = page.getByRole('button', { name: 'Confirm Transfer' });

    /* Termination Dialog */
    this.terminationDateInput = page.getByLabel('Termination Date');
    this.terminationReasonSelect = page.getByLabel('Termination Reason');
    this.terminationNotesInput = page.getByLabel('Notes');
    this.confirmTerminateButton = page.getByRole('button', { name: 'Confirm Termination' });

    /* Validation / Success */
    this.validationErrors = page.locator('[data-testid="validation-errors"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
  }

  /** Navigate to employee list */
  async goto() {
    await this.page.goto('/employees');
  }

  /**
   * Create a new employee via the form
   * Replaces: UFT HRMS_EMPLOYEE form insert mode + PRE-INSERT trigger
   *
   * UFT equivalent:
   *   Browser("HRMS").Page("Employee").WebButton("Add").Click
   *   Browser("HRMS").Page("Employee").WebEdit("first_name").Set data.firstName
   *   ... (for each field)
   *   Browser("HRMS").Page("Employee").WebButton("Save").Click
   */
  async createEmployee(data: {
    firstName: string;
    lastName: string;
    email: string;
    hireDate: string;
    deptId: string;
    jobId: string;
    managerEmpId?: string;
    locationCode?: string;
    employmentType?: string;
    gender?: string;
    startingSalary: string;
  }) {
    await this.addEmployeeButton.click();
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.hireDateInput.fill(data.hireDate);
    await this.departmentSelect.selectOption(data.deptId);
    await this.jobTitleSelect.selectOption(data.jobId);

    if (data.managerEmpId) {
      await this.managerSelect.selectOption(data.managerEmpId);
    }
    if (data.locationCode) {
      await this.locationSelect.selectOption(data.locationCode);
    }
    if (data.employmentType) {
      await this.employmentTypeSelect.selectOption(data.employmentType);
    }
    if (data.gender) {
      await this.genderSelect.selectOption(data.gender);
    }

    await this.startingSalaryInput.fill(data.startingSalary);
    await this.saveButton.click();
  }

  /**
   * Search for an employee by name
   * Replaces:
   *   Browser("HRMS").Page("Employee").WebEdit("search").Set name
   *   Browser("HRMS").Page("Employee").WebButton("Search").Click
   */
  async searchEmployee(name: string) {
    await this.searchInput.fill(name);
    await this.searchButton.click();
  }

  /**
   * Click on an employee row to view details
   * Replaces: Browser("HRMS").Page("Employee").WebTable("results").ChildItem(row, ...).Click
   */
  async selectEmployeeByName(name: string) {
    await this.page.getByRole('link', { name }).click();
  }

  /**
   * Transfer employee to another department
   * Replaces: UFT HRMS_EMPLOYEE form transfer action
   */
  async transferEmployee(deptId: string, effectiveDate: string, reason: string) {
    await this.transferButton.click();
    await this.transferDeptSelect.selectOption(deptId);
    await this.transferDateInput.fill(effectiveDate);
    await this.transferReasonInput.fill(reason);
    await this.confirmTransferButton.click();
  }

  /**
   * Terminate an employee
   * Replaces: UFT HRMS_EMPLOYEE form termination action
   */
  async terminateEmployee(terminationDate: string, reason: string, notes?: string) {
    await this.terminateButton.click();
    await this.terminationDateInput.fill(terminationDate);
    await this.terminationReasonSelect.selectOption(reason);
    if (notes) {
      await this.terminationNotesInput.fill(notes);
    }
    await this.confirmTerminateButton.click();
  }

  /**
   * Get the count of rows in the employee table
   * Replaces: WebTable("results").RowCount
   */
  async getTableRowCount(): Promise<number> {
    return this.employeeRows.count();
  }

  /**
   * Get cell data from the employee table
   * Replaces: WebTable("results").GetCellData(row, col)
   */
  async getCellData(rowIndex: number, colIndex: number): Promise<string | null> {
    return this.employeeRows.nth(rowIndex).locator('td').nth(colIndex).textContent();
  }
}
