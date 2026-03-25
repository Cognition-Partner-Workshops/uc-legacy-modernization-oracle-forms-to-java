package com.automation.utils;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

import java.time.Duration;

/**
 * Factory class for WebDriver creation and management.
 * Uses ThreadLocal to support parallel test execution.
 */
public final class DriverFactory {

    private static final Logger logger = LogManager.getLogger(DriverFactory.class);
    private static final ThreadLocal<WebDriver> driverThreadLocal = new ThreadLocal<>();

    private DriverFactory() {
        // Prevent instantiation
    }

    /**
     * Initializes WebDriver based on the configured browser type.
     * Supports Chrome, Firefox, and Edge browsers with headless mode.
     */
    public static WebDriver initDriver() {
        ConfigReader config = ConfigReader.getInstance();
        String browser = System.getProperty("browser", config.getProperty("browser", "chrome"));
        boolean headless = config.getBooleanProperty("headless", false);
        int implicitWait = config.getIntProperty("implicit.wait", 10);
        int pageLoadTimeout = config.getIntProperty("page.load.timeout", 30);

        WebDriver driver;

        switch (browser.toLowerCase()) {
            case "firefox":
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions firefoxOptions = new FirefoxOptions();
                if (headless) {
                    firefoxOptions.addArguments("--headless");
                }
                firefoxOptions.addArguments("--width=1920", "--height=1080");
                driver = new FirefoxDriver(firefoxOptions);
                break;

            case "edge":
                WebDriverManager.edgedriver().setup();
                EdgeOptions edgeOptions = new EdgeOptions();
                if (headless) {
                    edgeOptions.addArguments("--headless");
                }
                edgeOptions.addArguments("--window-size=1920,1080");
                driver = new EdgeDriver(edgeOptions);
                break;

            case "chrome":
            default:
                WebDriverManager.chromedriver().setup();
                ChromeOptions chromeOptions = new ChromeOptions();
                if (headless) {
                    chromeOptions.addArguments("--headless=new");
                }
                chromeOptions.addArguments(
                        "--window-size=1920,1080",
                        "--disable-gpu",
                        "--no-sandbox",
                        "--disable-dev-shm-usage"
                );
                driver = new ChromeDriver(chromeOptions);
                break;
        }

        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(implicitWait));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(pageLoadTimeout));
        driver.manage().window().maximize();

        driverThreadLocal.set(driver);
        logger.info("WebDriver initialized: browser={}, headless={}", browser, headless);
        return driver;
    }

    /**
     * Returns the WebDriver instance for the current thread.
     */
    public static WebDriver getDriver() {
        return driverThreadLocal.get();
    }

    /**
     * Quits the WebDriver and removes it from ThreadLocal storage.
     */
    public static void quitDriver() {
        WebDriver driver = driverThreadLocal.get();
        if (driver != null) {
            driver.quit();
            driverThreadLocal.remove();
            logger.info("WebDriver quit and removed from ThreadLocal");
        }
    }
}
