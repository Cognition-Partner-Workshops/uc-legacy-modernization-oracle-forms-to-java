package com.automation.base;

import com.automation.utils.ConfigReader;
import com.automation.utils.WaitUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.Select;

import java.util.ArrayList;
import java.util.List;

/**
 * Base page class providing common methods for all page objects.
 * All page classes should extend this class to inherit shared functionality.
 */
public abstract class BasePage {

    protected final WebDriver driver;
    protected final Actions actions;
    protected final ConfigReader config;
    protected final Logger logger;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.actions = new Actions(driver);
        this.config = ConfigReader.getInstance();
        this.logger = LogManager.getLogger(this.getClass());
        PageFactory.initElements(driver, this);
    }

    // ===================== Navigation =====================

    public void navigateTo(String url) {
        driver.get(url);
        logger.info("Navigated to: {}", url);
    }

    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    public String getPageTitle() {
        return driver.getTitle();
    }

    public void refreshPage() {
        driver.navigate().refresh();
        logger.info("Page refreshed");
    }

    // ===================== Element Interactions =====================

    protected void click(WebElement element) {
        WaitUtils.waitForClickable(driver, element);
        element.click();
        logger.debug("Clicked on element: {}", element);
    }

    protected void type(WebElement element, String text) {
        WaitUtils.waitForVisibility(driver, element);
        element.clear();
        element.sendKeys(text);
        logger.debug("Typed '{}' into element: {}", text, element);
    }

    protected String getText(WebElement element) {
        WaitUtils.waitForVisibility(driver, element);
        return element.getText();
    }

    protected String getAttribute(WebElement element, String attribute) {
        WaitUtils.waitForVisibility(driver, element);
        return element.getAttribute(attribute);
    }

    protected boolean isDisplayed(WebElement element) {
        try {
            return element.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    protected boolean isEnabled(WebElement element) {
        try {
            return element.isEnabled();
        } catch (Exception e) {
            return false;
        }
    }

    protected boolean isSelected(WebElement element) {
        try {
            return element.isSelected();
        } catch (Exception e) {
            return false;
        }
    }

    // ===================== Dropdown Operations =====================

    protected void selectByVisibleText(WebElement dropdown, String text) {
        WaitUtils.waitForVisibility(driver, dropdown);
        new Select(dropdown).selectByVisibleText(text);
        logger.debug("Selected '{}' by visible text from dropdown", text);
    }

    protected void selectByValue(WebElement dropdown, String value) {
        WaitUtils.waitForVisibility(driver, dropdown);
        new Select(dropdown).selectByValue(value);
        logger.debug("Selected '{}' by value from dropdown", value);
    }

    protected void selectByIndex(WebElement dropdown, int index) {
        WaitUtils.waitForVisibility(driver, dropdown);
        new Select(dropdown).selectByIndex(index);
        logger.debug("Selected index {} from dropdown", index);
    }

    protected String getSelectedOption(WebElement dropdown) {
        WaitUtils.waitForVisibility(driver, dropdown);
        return new Select(dropdown).getFirstSelectedOption().getText();
    }

    protected List<String> getAllDropdownOptions(WebElement dropdown) {
        WaitUtils.waitForVisibility(driver, dropdown);
        List<WebElement> options = new Select(dropdown).getOptions();
        List<String> optionTexts = new ArrayList<>();
        for (WebElement option : options) {
            optionTexts.add(option.getText());
        }
        return optionTexts;
    }

    // ===================== Mouse Actions =====================

    protected void hoverOverElement(WebElement element) {
        WaitUtils.waitForVisibility(driver, element);
        actions.moveToElement(element).perform();
        logger.debug("Hovered over element: {}", element);
    }

    protected void doubleClickElement(WebElement element) {
        WaitUtils.waitForClickable(driver, element);
        actions.doubleClick(element).perform();
        logger.debug("Double-clicked element: {}", element);
    }

    protected void rightClickElement(WebElement element) {
        WaitUtils.waitForClickable(driver, element);
        actions.contextClick(element).perform();
        logger.debug("Right-clicked element: {}", element);
    }

    protected void dragAndDrop(WebElement source, WebElement target) {
        WaitUtils.waitForVisibility(driver, source);
        WaitUtils.waitForVisibility(driver, target);
        actions.dragAndDrop(source, target).perform();
        logger.debug("Dragged element from source to target");
    }

    protected void clickAndHold(WebElement element) {
        WaitUtils.waitForVisibility(driver, element);
        actions.clickAndHold(element).perform();
        logger.debug("Click and hold on element: {}", element);
    }

    protected void releaseElement(WebElement element) {
        actions.release(element).perform();
        logger.debug("Released element: {}", element);
    }

    // ===================== Keyboard Actions =====================

    protected void sendKeysToElement(WebElement element, CharSequence... keys) {
        WaitUtils.waitForVisibility(driver, element);
        element.sendKeys(keys);
        logger.debug("Sent keys to element: {}", element);
    }

    protected void performKeyboardAction(CharSequence... keys) {
        actions.sendKeys(keys).perform();
        logger.debug("Performed keyboard action");
    }

    // ===================== Table Operations =====================

    protected int getTableRowCount(WebElement table) {
        List<WebElement> rows = table.findElements(By.tagName("tr"));
        return rows.size();
    }

    protected int getTableColumnCount(WebElement table) {
        List<WebElement> headers = table.findElements(By.tagName("th"));
        if (headers.isEmpty()) {
            List<WebElement> firstRowCells = table.findElements(By.cssSelector("tr:first-child td"));
            return firstRowCells.size();
        }
        return headers.size();
    }

    protected String getCellData(WebElement table, int row, int col) {
        List<WebElement> rows = table.findElements(By.tagName("tr"));
        if (row >= rows.size()) {
            throw new IndexOutOfBoundsException("Row index " + row + " out of bounds. Table has " + rows.size() + " rows.");
        }
        List<WebElement> cells = rows.get(row).findElements(By.tagName("td"));
        if (cells.isEmpty()) {
            cells = rows.get(row).findElements(By.tagName("th"));
        }
        if (col >= cells.size()) {
            throw new IndexOutOfBoundsException("Column index " + col + " out of bounds. Row has " + cells.size() + " columns.");
        }
        return cells.get(col).getText();
    }

    protected List<String> getColumnData(WebElement table, int col) {
        List<WebElement> rows = table.findElements(By.tagName("tr"));
        List<String> columnData = new ArrayList<>();
        for (WebElement row : rows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (col < cells.size()) {
                columnData.add(cells.get(col).getText());
            }
        }
        return columnData;
    }

    protected List<String> getRowData(WebElement table, int rowIndex) {
        List<WebElement> rows = table.findElements(By.tagName("tr"));
        if (rowIndex >= rows.size()) {
            throw new IndexOutOfBoundsException("Row index " + rowIndex + " out of bounds.");
        }
        List<WebElement> cells = rows.get(rowIndex).findElements(By.tagName("td"));
        List<String> rowData = new ArrayList<>();
        for (WebElement cell : cells) {
            rowData.add(cell.getText());
        }
        return rowData;
    }

    protected List<String> getTableHeaders(WebElement table) {
        List<WebElement> headers = table.findElements(By.tagName("th"));
        List<String> headerTexts = new ArrayList<>();
        for (WebElement header : headers) {
            headerTexts.add(header.getText());
        }
        return headerTexts;
    }

    // ===================== JavaScript Operations =====================

    protected void scrollToElement(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", element);
        logger.debug("Scrolled to element: {}", element);
    }

    protected void jsClick(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
        logger.debug("JavaScript clicked on element: {}", element);
    }

    protected Object executeScript(String script, Object... args) {
        return ((JavascriptExecutor) driver).executeScript(script, args);
    }
}
