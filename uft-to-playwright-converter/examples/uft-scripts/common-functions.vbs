' UFT Common Function Library
' This file contains reusable functions used across multiple UFT test scripts.
' Referenced via ExecuteFile or LoadFunctionLibrary in .mts and .vbs scripts.

' ============================================================
' Function: Login
' Purpose:  Perform login with given credentials
' ============================================================
Public Function Login(username, password)
    Browser("HRMS").Page("Login").WebEdit("txtUsername").Set username
    Browser("HRMS").Page("Login").WebEdit("txtPassword").SetSecure password
    Browser("HRMS").Page("Login").WebButton("btnLogin").Click
    Wait 2

    If Browser("HRMS").Page("Dashboard").Exist(10) Then
        Login = True
        Reporter.ReportEvent micPass, "Login", "Login successful for user: " & username
    Else
        Login = False
        Reporter.ReportEvent micFail, "Login", "Login failed for user: " & username
    End If
End Function

' ============================================================
' Sub: Logout
' Purpose: Perform logout from the application
' ============================================================
Public Sub Logout()
    Browser("HRMS").Page("Dashboard").Link("lnkLogout").Click
    Wait 1

    If Browser("HRMS").Page("Login").Exist(10) Then
        Reporter.ReportEvent micPass, "Logout", "Logout successful"
    Else
        Reporter.ReportEvent micFail, "Logout", "Logout failed"
    End If
End Sub

' ============================================================
' Function: SearchEmployee
' Purpose:  Search for an employee by name and return result count
' ============================================================
Public Function SearchEmployee(empName)
    Dim strtosql
    strtosql = "select count(*) from employees where employees.name ='" & empName & "' and employees.status ='active'"

    Browser("HRMS").Page("Employee List").WebEdit("txtSearch").Set empName
    Browser("HRMS").Page("Employee List").WebButton("btnSearch").Click
    Wait 2

    If Browser("HRMS").Page("Employee List").WebTable("tblResults").Exist(10) Then
        SearchEmployee = Browser("HRMS").Page("Employee List").WebTable("tblResults").GetROProperty("rows")
    Else
        SearchEmployee = 0
    End If
End Function

' ============================================================
' Function: VerifyPageTitle
' Purpose:  Verify the current page title matches expected
' ============================================================
Public Function VerifyPageTitle(expectedTitle)
    Dim actualTitle
    actualTitle = Browser("HRMS").GetROProperty("title")

    If actualTitle = expectedTitle Then
        VerifyPageTitle = True
        Reporter.ReportEvent micPass, "VerifyPageTitle", "Title matches: " & expectedTitle
    Else
        VerifyPageTitle = False
        Reporter.ReportEvent micFail, "VerifyPageTitle", "Expected: " & expectedTitle & " but got: " & actualTitle
    End If
End Function

' ============================================================
' Sub: TakeScreenshot
' Purpose:  Capture a screenshot for reporting
' ============================================================
Public Sub TakeScreenshot(screenshotName)
    Browser("HRMS").Page("Dashboard").CaptureBitmap "C:\Screenshots\" & screenshotName & ".png"
    Reporter.ReportEvent micDone, "Screenshot", "Screenshot saved: " & screenshotName
End Sub
