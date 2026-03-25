package com.automation.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * Utility class providing explicit wait methods for common Selenium operations.
 */
public final class WaitUtils {

    private static final Logger logger = LogManager.getLogger(WaitUtils.class);
    private static final int DEFAULT_TIMEOUT = ConfigReader.getInstance().getIntProperty("explicit.wait", 15);

    private WaitUtils() {
        // Prevent instantiation
    }

    public static WebElement waitForVisibility(WebDriver driver, WebElement element) {
        return waitForVisibility(driver, element, DEFAULT_TIMEOUT);
    }

    public static WebElement waitForVisibility(WebDriver driver, WebElement element, int timeoutSeconds) {
        logger.debug("Waiting for element visibility: {}", element);
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.visibilityOf(element));
    }

    public static WebElement waitForClickable(WebDriver driver, WebElement element) {
        return waitForClickable(driver, element, DEFAULT_TIMEOUT);
    }

    public static WebElement waitForClickable(WebDriver driver, WebElement element, int timeoutSeconds) {
        logger.debug("Waiting for element to be clickable: {}", element);
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.elementToBeClickable(element));
    }

    public static WebElement waitForPresence(WebDriver driver, By locator) {
        return waitForPresence(driver, locator, DEFAULT_TIMEOUT);
    }

    public static WebElement waitForPresence(WebDriver driver, By locator, int timeoutSeconds) {
        logger.debug("Waiting for element presence: {}", locator);
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.presenceOfElementLocated(locator));
    }

    public static List<WebElement> waitForAllVisible(WebDriver driver, By locator) {
        return waitForAllVisible(driver, locator, DEFAULT_TIMEOUT);
    }

    public static List<WebElement> waitForAllVisible(WebDriver driver, By locator, int timeoutSeconds) {
        logger.debug("Waiting for all elements visible: {}", locator);
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.visibilityOfAllElementsLocatedBy(locator));
    }

    public static boolean waitForUrlContains(WebDriver driver, String urlFragment) {
        return waitForUrlContains(driver, urlFragment, DEFAULT_TIMEOUT);
    }

    public static boolean waitForUrlContains(WebDriver driver, String urlFragment, int timeoutSeconds) {
        logger.debug("Waiting for URL to contain: {}", urlFragment);
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.urlContains(urlFragment));
    }

    public static boolean waitForTextPresent(WebDriver driver, WebElement element, String text) {
        return waitForTextPresent(driver, element, text, DEFAULT_TIMEOUT);
    }

    public static boolean waitForTextPresent(WebDriver driver, WebElement element, String text, int timeoutSeconds) {
        logger.debug("Waiting for text '{}' in element: {}", text, element);
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.textToBePresentInElement(element, text));
    }

    public static WebElement waitForVisibilityOfLocator(WebDriver driver, By locator) {
        return waitForVisibilityOfLocator(driver, locator, DEFAULT_TIMEOUT);
    }

    public static WebElement waitForVisibilityOfLocator(WebDriver driver, By locator, int timeoutSeconds) {
        logger.debug("Waiting for visibility of locator: {}", locator);
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.visibilityOfElementLocated(locator));
    }
}
