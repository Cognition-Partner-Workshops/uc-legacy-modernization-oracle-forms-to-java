' UFT Script: Search Employee (.mts format)
' This is a UFT action script stored as .mts

' Login first
Browser("HRMS").Page("Login").WebEdit("txtUsername").Set "admin"
Browser("HRMS").Page("Login").WebEdit("txtPassword").SetSecure "encrypted_pwd"
Browser("HRMS").Page("Login").WebButton("btnLogin").Click
Wait 2

' Navigate to Employee Search
Browser("HRMS").Page("Dashboard").Link("lnkEmployees").Click
Wait 1

' Search by name
Browser("HRMS").Page("Employee List").WebEdit("txtSearch").Set "John"
Browser("HRMS").Page("Employee List").WebButton("btnSearch").Click
Wait 2

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

' Logout
Browser("HRMS").Page("Employee Form").Link("lnkLogout").Click
