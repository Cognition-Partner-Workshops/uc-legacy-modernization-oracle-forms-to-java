' ============================================
' Test Script: Login Functionality
' Application: HRMS Web Application
' Author: QA Team
' Date: 2024-01-15
' ============================================

' Launch the application
SystemUtil.Run "http://localhost:3000"
Wait 3

' Login with valid credentials
Browser("HRMS").Page("Login").WebEdit("txt_username").Set "admin@company.com"
Browser("HRMS").Page("Login").WebEdit("txt_password").SetSecure "5a4b3c2d1e"
Browser("HRMS").Page("Login").WebButton("btn_login").Click

' Wait for dashboard to load
Browser("HRMS").Page("Dashboard").Sync

' Verify successful login
If Browser("HRMS").Page("Dashboard").WebElement("welcome_msg").Exist(10) Then
    Reporter.ReportEvent micPass, "Login Test", "Login successful - Dashboard loaded"
Else
    Reporter.ReportEvent micFail, "Login Test", "Login failed - Dashboard not loaded"
End If

' Verify user name is displayed
Dim userName
userName = Browser("HRMS").Page("Dashboard").WebElement("welcome_msg").GetROProperty("innertext")

If InStr(userName, "Admin") > 0 Then
    Reporter.ReportEvent micPass, "User Name", "User name displayed correctly: " & userName
Else
    Reporter.ReportEvent micFail, "User Name", "User name not found. Got: " & userName
End If

' Test logout
Browser("HRMS").Page("Dashboard").Link("lnk_logout").Click
Wait 2

' Verify logout
If Browser("HRMS").Page("Login").WebEdit("txt_username").Exist(5) Then
    Reporter.ReportEvent micPass, "Logout Test", "Logout successful - Login page displayed"
Else
    Reporter.ReportEvent micFail, "Logout Test", "Logout failed"
End If

' Test invalid login
Browser("HRMS").Page("Login").WebEdit("txt_username").Set "invalid@company.com"
Browser("HRMS").Page("Login").WebEdit("txt_password").Set "wrong_password"
Browser("HRMS").Page("Login").WebButton("btn_login").Click
Wait 2

' Verify error message
If Browser("HRMS").Page("Login").WebElement("error_msg").Exist(5) Then
    Reporter.ReportEvent micPass, "Invalid Login", "Error message displayed for invalid credentials"
Else
    Reporter.ReportEvent micFail, "Invalid Login", "Error message not displayed"
End If

' Close browser
Browser("HRMS").Close
