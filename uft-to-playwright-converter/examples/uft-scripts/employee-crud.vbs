' ============================================
' Test Script: Employee CRUD Operations
' Application: HRMS Web Application
' Author: QA Team
' Date: 2024-02-20
' ============================================

Option Explicit

Dim empNumber, empName, searchResult

' Navigate to application and login
SystemUtil.Run "http://localhost:3000"
Wait 2
Browser("HRMS").Page("Login").WebEdit("txt_username").Set "admin@company.com"
Browser("HRMS").Page("Login").WebEdit("txt_password").SetSecure "5a4b3c2d1e"
Browser("HRMS").Page("Login").WebButton("btn_login").Click
Browser("HRMS").Page("Dashboard").Sync

' Navigate to Employee Management
Browser("HRMS").Page("Dashboard").Link("lnk_employees").Click
Browser("HRMS").Page("Employee List").Sync

' ---- CREATE EMPLOYEE ----
Browser("HRMS").Page("Employee List").WebButton("btn_add_employee").Click
Browser("HRMS").Page("Employee Form").Sync

' Fill employee form
Browser("HRMS").Page("Employee Form").WebEdit("txtFirstName").Set DataTable("FirstName", dtGlobalSheet)
Browser("HRMS").Page("Employee Form").WebEdit("txtLastName").Set DataTable("LastName", dtGlobalSheet)
Browser("HRMS").Page("Employee Form").WebEdit("txtEmail").Set DataTable("Email", dtGlobalSheet)
Browser("HRMS").Page("Employee Form").WebEdit("txtHireDate").Set DataTable("HireDate", dtGlobalSheet)
Browser("HRMS").Page("Employee Form").WebList("ddlDepartment").Select DataTable("Department", dtGlobalSheet)
Browser("HRMS").Page("Employee Form").WebList("ddlJobTitle").Select DataTable("JobTitle", dtGlobalSheet)
Browser("HRMS").Page("Employee Form").WebEdit("txtSalary").Set DataTable("Salary", dtGlobalSheet)
Browser("HRMS").Page("Employee Form").WebRadioGroup("rdEmploymentType").Select "FULL_TIME"
Browser("HRMS").Page("Employee Form").WebCheckBox("chkActive").Set "ON"

' Save employee
Browser("HRMS").Page("Employee Form").WebButton("btnSave").Click
Wait 2

' Verify creation success
If Browser("HRMS").Page("Employee Form").WebElement("success_msg").Exist(5) Then
    empNumber = Browser("HRMS").Page("Employee Form").WebElement("emp_number").GetROProperty("innertext")
    Reporter.ReportEvent micPass, "Create Employee", "Employee created successfully. Number: " & empNumber
Else
    Reporter.ReportEvent micFail, "Create Employee", "Failed to create employee"
End If

' ---- READ EMPLOYEE ----
Browser("HRMS").Page("Employee Form").Link("lnk_employees").Click
Browser("HRMS").Page("Employee List").Sync

' Search for the created employee
Browser("HRMS").Page("Employee List").WebEdit("txtSearch").Set DataTable("LastName", dtGlobalSheet)
Browser("HRMS").Page("Employee List").WebButton("btnSearch").Click
Wait 2

' Verify search results
Dim rowCount
rowCount = Browser("HRMS").Page("Employee List").WebTable("tblEmployees").GetRowCount
If rowCount > 1 Then
    searchResult = Browser("HRMS").Page("Employee List").WebTable("tblEmployees").GetCellData(2, 3)
    If InStr(searchResult, DataTable("LastName", dtGlobalSheet)) > 0 Then
        Reporter.ReportEvent micPass, "Search Employee", "Employee found in search results"
    Else
        Reporter.ReportEvent micFail, "Search Employee", "Employee not found. Got: " & searchResult
    End If
Else
    Reporter.ReportEvent micFail, "Search Employee", "No results found"
End If

' ---- UPDATE EMPLOYEE ----
Browser("HRMS").Page("Employee List").WebTable("tblEmployees").ChildItem(2, 8, "WebButton", 0).Click
Browser("HRMS").Page("Employee Form").Sync

' Update department
Browser("HRMS").Page("Employee Form").WebList("ddlDepartment").Select "Engineering"
Browser("HRMS").Page("Employee Form").WebEdit("txtSalary").Set "95000"
Browser("HRMS").Page("Employee Form").WebButton("btnSave").Click
Wait 2

If Browser("HRMS").Page("Employee Form").WebElement("success_msg").Exist(5) Then
    Reporter.ReportEvent micPass, "Update Employee", "Employee updated successfully"
Else
    Reporter.ReportEvent micFail, "Update Employee", "Failed to update employee"
End If

' ---- DELETE EMPLOYEE ----
Browser("HRMS").Page("Employee Form").Link("lnk_employees").Click
Browser("HRMS").Page("Employee List").Sync
Browser("HRMS").Page("Employee List").WebEdit("txtSearch").Set DataTable("LastName", dtGlobalSheet)
Browser("HRMS").Page("Employee List").WebButton("btnSearch").Click
Wait 2

' Click delete button
Browser("HRMS").Page("Employee List").WebTable("tblEmployees").ChildItem(2, 9, "WebButton", 0).Click
Wait 1

' Confirm deletion dialog
Browser("HRMS").Dialog("Confirm").WebButton("btn_yes").Click
Wait 2

If Browser("HRMS").Page("Employee List").WebElement("delete_success_msg").Exist(5) Then
    Reporter.ReportEvent micPass, "Delete Employee", "Employee deleted successfully"
Else
    Reporter.ReportEvent micFail, "Delete Employee", "Failed to delete employee"
End If

' Logout and close
Browser("HRMS").Page("Employee List").Link("lnk_logout").Click
Browser("HRMS").Close
