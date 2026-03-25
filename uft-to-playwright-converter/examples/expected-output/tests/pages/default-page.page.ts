/**
 * Page Object: DefaultPage
 * Auto-generated from UFT Object Repository
 */

import { Page, Locator } from '@playwright/test';

export class DefaultPage {
  // Selectors
  private readonly systemUtil = '#SystemUtil'; // UFT: SystemUtil("SystemUtil")
  private readonly wait = '#Wait'; // UFT: Utility("Wait")
  private readonly dashboard = '#Dashboard'; // UFT: Page("Dashboard")
  private readonly reporter = '#Reporter'; // UFT: Reporter("Reporter")
  private readonly hRMS = '#HRMS'; // UFT: Browser("HRMS")

  constructor(private readonly page: Page) {}

  // Locators
  getSystemUtil(): Locator {
    return this.page.locator(this.systemUtil);
  }

  getWait(): Locator {
    return this.page.locator(this.wait);
  }

  getDashboard(): Locator {
    return this.page.locator(this.dashboard);
  }

  getReporter(): Locator {
    return this.page.locator(this.reporter);
  }

  getHRMS(): Locator {
    return this.page.locator(this.hRMS);
  }

}
