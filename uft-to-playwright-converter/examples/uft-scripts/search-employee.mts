' UFT Script: Search Employee (.mts format)
' This is a UFT action script stored as .mts
' Uses common function library for Login/Logout

' Load common function library
ExecuteFile "common-functions.vbs"

' Login using library function
Call Login("admin", "encrypted_pwd")

' Navigate to Employee Search
Browser("HRMS").Page("Dashboard").Link("lnkEmployees").Click
Wait 1

' Search using library function
resultCount = SearchEmployee("John")

' Verify results
Browser("HRMS").Page("Employee List").WebTable("tblResults").Exist(10)
rowCount = Browser("HRMS").Page("Employee List").WebTable("tblResults").GetROProperty("rows")

' Select first result
Browser("HRMS").Page("Employee List").WebTable("tblResults").ChildItem(1, 1, "WebButton", 0).Click
Wait 1

' Verify employee details loaded
empName = Browser("HRMS").Page("Employee Form").WebElement("emp_name").GetROProperty("innertext")

' Update phone number
Browser("HRMS").Page("Employee Form").WebEdit("txtPhone").Set "555-1234"
Browser("HRMS").Page("Employee Form").WebButton("btnSave").Click
Wait 2

' Verify success message
Browser("HRMS").Page("Employee Form").WebElement("msgSuccess").Exist(5)

' Verify page title using library function
Call VerifyPageTitle("Employee Details - HRMS")

' Logout using library function
Call Logout()
