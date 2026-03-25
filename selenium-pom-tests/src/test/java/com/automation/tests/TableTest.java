package com.automation.tests;

import com.automation.pages.TablePage;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.List;

/**
 * Test class for Table operations.
 * Covers: reading headers, row/column data, cell data extraction,
 * column sorting, and searching within table data.
 */
public class TableTest extends BaseTest {

    private TablePage tablePage;

    @BeforeMethod
    public void initPage() {
        tablePage = new TablePage(driver);
        tablePage.open();
    }

    @Test(priority = 1, description = "Verify tables page loads correctly")
    public void testTablesPageHeading() {
        Assert.assertEquals(tablePage.getPageHeading(), "Data Tables",
                "Page heading should be 'Data Tables'");
    }

    @Test(priority = 2, description = "Verify both tables are displayed")
    public void testBothTablesDisplayed() {
        Assert.assertTrue(tablePage.isTable1Displayed(), "Table 1 should be displayed");
        Assert.assertTrue(tablePage.isTable2Displayed(), "Table 2 should be displayed");
    }

    @Test(priority = 3, description = "Verify Table 1 headers")
    public void testTable1Headers() {
        List<String> headers = tablePage.getTable1Headers();
        Assert.assertTrue(headers.size() > 0, "Table 1 should have headers");
        Assert.assertTrue(headers.contains("Last Name"), "Table 1 should have 'Last Name' header");
        Assert.assertTrue(headers.contains("First Name"), "Table 1 should have 'First Name' header");
        Assert.assertTrue(headers.contains("Email"), "Table 1 should have 'Email' header");
    }

    @Test(priority = 4, description = "Verify Table 1 has data rows")
    public void testTable1RowCount() {
        int rowCount = tablePage.getTable1RowCount();
        Assert.assertTrue(rowCount > 0, "Table 1 should have at least one data row");
        logger.info("Table 1 has {} data rows", rowCount);
    }

    @Test(priority = 5, description = "Verify Table 1 column count matches headers")
    public void testTable1ColumnCount() {
        int colCount = tablePage.getTable1ColumnCount();
        List<String> headers = tablePage.getTable1Headers();
        Assert.assertEquals(colCount, headers.size(),
                "Column count should match the number of headers");
    }

    @Test(priority = 6, description = "Read and verify cell data from Table 1")
    public void testTable1CellData() {
        String cellData = tablePage.getTable1CellData(1, 0);
        Assert.assertNotNull(cellData, "Cell data should not be null");
        Assert.assertFalse(cellData.isEmpty(), "Cell data should not be empty");
        logger.info("Table 1, Row 1, Col 0: {}", cellData);
    }

    @Test(priority = 7, description = "Read entire column data from Table 1")
    public void testTable1ColumnData() {
        List<String> lastNames = tablePage.getTable1ColumnData(0);
        Assert.assertTrue(lastNames.size() > 0, "Last Name column should have data");
        for (String name : lastNames) {
            Assert.assertNotNull(name, "Column value should not be null");
        }
        logger.info("Last Names: {}", lastNames);
    }

    @Test(priority = 8, description = "Read entire row data from Table 1")
    public void testTable1RowData() {
        List<String> rowData = tablePage.getTable1RowData(0);
        Assert.assertTrue(rowData.size() > 0, "Row data should have values");
        logger.info("Row 0 data: {}", rowData);
    }

    @Test(priority = 9, description = "Sort Table 1 by clicking Last Name header")
    public void testTable1SortByLastName() {
        List<String> beforeSort = tablePage.getTable1ColumnData(0);
        tablePage.clickTable1HeaderByText("Last Name");
        List<String> afterSort = tablePage.getTable1ColumnData(0);

        logger.info("Before sort: {}", beforeSort);
        logger.info("After sort: {}", afterSort);

        Assert.assertNotNull(afterSort, "Sorted column should have data");
    }

    @Test(priority = 10, description = "Search for a value in Table 1")
    public void testSearchInTable1() {
        List<String> lastNames = tablePage.getTable1ColumnData(0);
        if (!lastNames.isEmpty()) {
            String searchValue = lastNames.get(0);
            int foundIndex = tablePage.searchInTable1Column(0, searchValue);
            Assert.assertNotEquals(foundIndex, -1,
                    "Should find '" + searchValue + "' in the Last Name column");
            logger.info("Found '{}' at row index {}", searchValue, foundIndex);
        }
    }

    @Test(priority = 11, description = "Verify Table 2 headers")
    public void testTable2Headers() {
        List<String> headers = tablePage.getTable2Headers();
        Assert.assertTrue(headers.size() > 0, "Table 2 should have headers");
    }

    @Test(priority = 12, description = "Verify Table 2 has data rows")
    public void testTable2RowCount() {
        int rowCount = tablePage.getTable2RowCount();
        Assert.assertTrue(rowCount > 0, "Table 2 should have at least one data row");
    }
}
