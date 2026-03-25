package com.automation.tests;

import com.automation.utils.DriverFactory;
import com.automation.utils.ScreenshotUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.WebDriver;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

/**
 * Base test class that all test classes should extend.
 * Handles WebDriver lifecycle: initialization before each test
 * and cleanup (with optional failure screenshot) after each test.
 */
public abstract class BaseTest {

    protected WebDriver driver;
    protected final Logger logger = LogManager.getLogger(this.getClass());

    @BeforeMethod
    public void setUp() {
        driver = DriverFactory.initDriver();
        logger.info("Test setup complete - WebDriver initialized");
    }

    @AfterMethod
    public void tearDown(ITestResult result) {
        if (result.getStatus() == ITestResult.FAILURE) {
            logger.error("Test FAILED: {}", result.getName());
            ScreenshotUtils.captureScreenshot(driver, result.getName());
        } else if (result.getStatus() == ITestResult.SUCCESS) {
            logger.info("Test PASSED: {}", result.getName());
        } else {
            logger.warn("Test SKIPPED: {}", result.getName());
        }
        DriverFactory.quitDriver();
        logger.info("Test teardown complete - WebDriver quit");
    }
}
