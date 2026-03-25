package com.automation.utils;

import org.apache.commons.io.FileUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for capturing and saving screenshots during test execution.
 */
public final class ScreenshotUtils {

    private static final Logger logger = LogManager.getLogger(ScreenshotUtils.class);
    private static final String SCREENSHOT_PATH =
            ConfigReader.getInstance().getProperty("screenshot.path", "target/screenshots/");

    private ScreenshotUtils() {
        // Prevent instantiation
    }

    /**
     * Captures a screenshot and saves it with a timestamped filename.
     *
     * @param driver   the WebDriver instance
     * @param testName the name of the test for the screenshot filename
     * @return the absolute path of the saved screenshot
     */
    public static String captureScreenshot(WebDriver driver, String testName) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = testName + "_" + timestamp + ".png";
        String filePath = SCREENSHOT_PATH + fileName;

        try {
            File sourceFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            File destFile = new File(filePath);
            FileUtils.copyFile(sourceFile, destFile);
            logger.info("Screenshot saved: {}", destFile.getAbsolutePath());
            return destFile.getAbsolutePath();
        } catch (IOException e) {
            logger.error("Failed to capture screenshot: {}", e.getMessage());
            return null;
        }
    }
}
