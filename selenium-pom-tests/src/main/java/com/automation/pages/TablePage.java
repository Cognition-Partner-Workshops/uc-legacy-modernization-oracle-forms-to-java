package com.automation.pages;

import com.automation.base.BasePage;
import com.automation.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.util.ArrayList;
import java.util.List;

/**
 * Page Object for the Data Tables page (the-internet.herokuapp.com/tables).
 * Demonstrates table operations: reading headers, row/column data,
 * sorting by column header click, and searching within table cells.
 */
public class TablePage extends BasePage {

    // ===================== Locators =====================

    @FindBy(id = "table1")
    private WebElement table1;

    @FindBy(id = "table2")
    private WebElement table2;

    @FindBy(css = "#table1 thead th")
    private List<WebElement> table1Headers;

    @FindBy(css = "#table1 tbody tr")
    private List<WebElement> table1Rows;

    @FindBy(css = "#table2 thead th")
    private List<WebElement> table2Headers;

    @FindBy(css = "#table2 tbody tr")
    private List<WebElement> table2Rows;

    @FindBy(css = "h3")
    private WebElement pageHeading;

    // ===================== Constructor =====================

    public TablePage(WebDriver driver) {
        super(driver);
    }

    // ===================== Navigation =====================

    /**
     * Navigates to the Tables page.
     */
    public TablePage open() {
        navigateTo(config.getProperty("tables.url"));
        return this;
    }

    // ===================== Table 1 Operations =====================

    /**
     * Returns the headers of Table 1.
     */
    public List<String> getTable1Headers() {
        return getTableHeaders(table1);
    }

    /**
     * Returns the number of data rows in Table 1 (excluding header).
     */
    public int getTable1RowCount() {
        return table1Rows.size();
    }

    /**
     * Returns the number of columns in Table 1.
     */
    public int getTable1ColumnCount() {
        return table1Headers.size();
    }

    /**
     * Returns cell data from Table 1 at the specified row and column.
     * Row index starts at 1 (first data row), column index starts at 0.
     */
    public String getTable1CellData(int row, int col) {
        return getCellData(table1, row, col);
    }

    /**
     * Returns all data from a specific column in Table 1.
     */
    public List<String> getTable1ColumnData(int col) {
        return getColumnData(table1, col);
    }

    /**
     * Returns all data from a specific row in Table 1.
     */
    public List<String> getTable1RowData(int row) {
        List<WebElement> cells = table1Rows.get(row).findElements(By.tagName("td"));
        List<String> rowData = new ArrayList<>();
        for (WebElement cell : cells) {
            rowData.add(cell.getText());
        }
        return rowData;
    }

    /**
     * Clicks a column header in Table 1 to trigger sorting.
     */
    public TablePage clickTable1Header(int colIndex) {
        if (colIndex < table1Headers.size()) {
            click(table1Headers.get(colIndex));
            logger.info("Clicked header at index {} in Table 1", colIndex);
        }
        return this;
    }

    /**
     * Clicks a column header in Table 1 by header text.
     */
    public TablePage clickTable1HeaderByText(String headerText) {
        for (WebElement header : table1Headers) {
            if (header.getText().equals(headerText)) {
                click(header);
                logger.info("Clicked header '{}' in Table 1", headerText);
                return this;
            }
        }
        throw new RuntimeException("Header '" + headerText + "' not found in Table 1");
    }

    /**
     * Searches for a value in a specific column of Table 1.
     * Returns the row index (0-based) if found, or -1 if not found.
     */
    public int searchInTable1Column(int colIndex, String searchText) {
        List<String> columnData = getTable1ColumnData(colIndex);
        for (int i = 0; i < columnData.size(); i++) {
            if (columnData.get(i).equals(searchText)) {
                return i;
            }
        }
        return -1;
    }

    // ===================== Table 2 Operations =====================

    /**
     * Returns the headers of Table 2.
     */
    public List<String> getTable2Headers() {
        return getTableHeaders(table2);
    }

    /**
     * Returns the number of data rows in Table 2.
     */
    public int getTable2RowCount() {
        return table2Rows.size();
    }

    /**
     * Returns cell data from Table 2 at the specified row and column.
     */
    public String getTable2CellData(int row, int col) {
        return getCellData(table2, row, col);
    }

    /**
     * Clicks a column header in Table 2 to trigger sorting.
     */
    public TablePage clickTable2Header(int colIndex) {
        if (colIndex < table2Headers.size()) {
            click(table2Headers.get(colIndex));
            logger.info("Clicked header at index {} in Table 2", colIndex);
        }
        return this;
    }

    // ===================== Verification Methods =====================

    public String getPageHeading() {
        return getText(pageHeading);
    }

    public boolean isTable1Displayed() {
        return isDisplayed(table1);
    }

    public boolean isTable2Displayed() {
        return isDisplayed(table2);
    }
}
