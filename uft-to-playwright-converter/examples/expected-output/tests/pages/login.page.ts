/**
 * Page Object: LoginPage
 * Auto-generated from UFT Object Repository
 */

import { Page, Locator } from '@playwright/test';

export class LoginPage {
  // Selectors
  private readonly txtUsername = '#txt_username'; // UFT: WebEdit("txt_username")
  private readonly txtPassword = '#txt_password'; // UFT: WebEdit("txt_password")
  private readonly btnLogin = '#btn_login'; // UFT: WebButton("btn_login")
  private readonly errorMsg = '#error_msg'; // UFT: WebElement("error_msg")

  constructor(private readonly page: Page) {}

  // Locators
  getTxtUsername(): Locator {
    return this.page.locator(this.txtUsername);
  }

  getTxtPassword(): Locator {
    return this.page.locator(this.txtPassword);
  }

  getBtnLogin(): Locator {
    return this.page.locator(this.btnLogin);
  }

  getErrorMsg(): Locator {
    return this.page.locator(this.errorMsg);
  }

  // Actions
  async fillTxtUsername(value: string): Promise<void> {
    await this.page.locator(this.txtUsername).fill(value);
  }

  async fillTxtPassword(value: string): Promise<void> {
    await this.page.locator(this.txtPassword).fill(value);
  }

  async clickBtnLogin(): Promise<void> {
    await this.page.locator(this.btnLogin).click();
  }

}
