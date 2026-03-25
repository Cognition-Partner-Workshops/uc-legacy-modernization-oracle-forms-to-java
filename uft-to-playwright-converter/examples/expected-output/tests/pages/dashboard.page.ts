/**
 * Page Object: DashboardPage
 * Auto-generated from UFT Object Repository
 */

import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  // Selectors
  private readonly welcomeMsg = '#welcome_msg'; // UFT: WebElement("welcome_msg")
  private readonly innertext = '#innertext'; // UFT: GetROProperty("innertext")
  private readonly lnkLogout = '#lnk_logout'; // UFT: Link("lnk_logout")

  constructor(private readonly page: Page) {}

  // Locators
  getWelcomeMsg(): Locator {
    return this.page.locator(this.welcomeMsg);
  }

  getInnertext(): Locator {
    return this.page.locator(this.innertext);
  }

  getLnkLogout(): Locator {
    return this.page.locator(this.lnkLogout);
  }

  // Actions
  async clickLnkLogout(): Promise<void> {
    await this.page.locator(this.lnkLogout).click();
  }

}
