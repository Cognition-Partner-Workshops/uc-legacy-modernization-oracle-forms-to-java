import { type Page, type Locator } from '@playwright/test';

/**
 * Performance Page Object Model
 *
 * Replaces: UFT Object Repository entries for HRMS_PERFORMANCE form
 * Maps review cycles, self-assessments, manager reviews, and goals
 */
export class PerformancePage {
  readonly page: Page;

  /* Review Cycles */
  readonly cyclesTable: Locator;
  readonly cycleRows: Locator;

  /* Reviews */
  readonly reviewsTab: Locator;
  readonly reviewsList: Locator;
  readonly selfAssessmentButton: Locator;
  readonly ratingSelect: Locator;
  readonly commentsInput: Locator;
  readonly submitReviewButton: Locator;

  /* Goals */
  readonly goalsTab: Locator;
  readonly addGoalButton: Locator;
  readonly goalTitleInput: Locator;
  readonly goalDescriptionInput: Locator;
  readonly goalTargetDateInput: Locator;
  readonly goalProgressSlider: Locator;
  readonly saveGoalButton: Locator;

  /* Messages */
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    /* Review Cycles */
    this.cyclesTable = page.locator('table[data-testid="cycles-table"]');
    this.cycleRows = page.locator('table[data-testid="cycles-table"] tbody tr');

    /* Reviews */
    this.reviewsTab = page.getByRole('tab', { name: 'My Reviews' });
    this.reviewsList = page.locator('[data-testid="reviews-list"]');
    this.selfAssessmentButton = page.getByRole('button', { name: 'Self Assessment' });
    this.ratingSelect = page.getByLabel('Rating');
    this.commentsInput = page.getByLabel('Comments');
    this.submitReviewButton = page.getByRole('button', { name: 'Submit' });

    /* Goals */
    this.goalsTab = page.getByRole('tab', { name: 'Goals' });
    this.addGoalButton = page.getByRole('button', { name: 'Add Goal' });
    this.goalTitleInput = page.getByLabel('Goal Title');
    this.goalDescriptionInput = page.getByLabel('Description');
    this.goalTargetDateInput = page.getByLabel('Target Date');
    this.goalProgressSlider = page.locator('[data-testid="goal-progress"]');
    this.saveGoalButton = page.getByRole('button', { name: 'Save Goal' });

    /* Messages */
    this.successMessage = page.locator('[data-testid="success-message"]');
  }

  /** Navigate to performance module */
  async goto() {
    await this.page.goto('/performance');
  }

  /** Submit a self-assessment */
  async submitSelfAssessment(rating: string, comments: string) {
    await this.selfAssessmentButton.click();
    await this.ratingSelect.selectOption(rating);
    await this.commentsInput.fill(comments);
    await this.submitReviewButton.click();
  }

  /** Add a new goal */
  async addGoal(title: string, description: string, targetDate: string) {
    await this.goalsTab.click();
    await this.addGoalButton.click();
    await this.goalTitleInput.fill(title);
    await this.goalDescriptionInput.fill(description);
    await this.goalTargetDateInput.fill(targetDate);
    await this.saveGoalButton.click();
  }
}
