' ============================================
' Test Script: Leave Request Workflow
' Application: HRMS Web Application
' Author: QA Team
' Date: 2024-03-10
' ============================================

Option Explicit

Dim leaveBalance, requestId

' Shared function to login
Sub LoginAsUser(username, password)
    Browser("HRMS").Page("Login").WebEdit("txt_username").Set username
    Browser("HRMS").Page("Login").WebEdit("txt_password").Set password
    Browser("HRMS").Page("Login").WebButton("btn_login").Click
    Browser("HRMS").Page("Dashboard").Sync
End Sub

' Shared function to logout
Sub Logout()
    Browser("HRMS").Page("Dashboard").Link("lnk_logout").Click
    Wait 1
End Sub

' Function to get leave balance
Function GetLeaveBalance(leaveType)
    Browser("HRMS").Page("Leave").WebList("ddlLeaveType").Select leaveType
    Wait 1
    GetLeaveBalance = Browser("HRMS").Page("Leave").WebElement("txtBalance").GetROProperty("innertext")
End Function

' ---- START TEST ----
SystemUtil.Run "http://localhost:3000"
Wait 2

' Step 1: Login as employee
Call LoginAsUser("jessica.nguyen@company.com", "test_password_123")

' Step 2: Navigate to Leave Management
Browser("HRMS").Page("Dashboard").Link("lnk_leave").Click
Browser("HRMS").Page("Leave").Sync

' Step 3: Check current leave balance
leaveBalance = GetLeaveBalance("PTO")
Reporter.ReportEvent micPass, "Leave Balance", "Current PTO balance: " & leaveBalance

' Step 4: Submit leave request
Browser("HRMS").Page("Leave").WebButton("btn_new_request").Click
Browser("HRMS").Page("Leave Request Form").Sync

Browser("HRMS").Page("Leave Request Form").WebList("ddlLeaveType").Select "PTO"
Browser("HRMS").Page("Leave Request Form").WebEdit("txtStartDate").Set "08/12/2024"
Browser("HRMS").Page("Leave Request Form").WebEdit("txtEndDate").Set "08/16/2024"
Browser("HRMS").Page("Leave Request Form").WebCheckBox("chkHalfDay").Set "OFF"
Browser("HRMS").Page("Leave Request Form").WebEdit("txtReason").Set "Summer vacation - family trip"
Browser("HRMS").Page("Leave Request Form").WebButton("btnSubmit").Click
Wait 2

' Verify submission
If Browser("HRMS").Page("Leave Request Form").WebElement("success_msg").Exist(5) Then
    requestId = Browser("HRMS").Page("Leave Request Form").WebElement("request_id").GetROProperty("innertext")
    Reporter.ReportEvent micPass, "Submit Leave", "Leave request submitted. ID: " & requestId
Else
    Reporter.ReportEvent micFail, "Submit Leave", "Failed to submit leave request"
End If

' Step 5: Verify request appears in list
Browser("HRMS").Page("Leave Request Form").Link("lnk_my_requests").Click
Browser("HRMS").Page("Leave").Sync

Dim statusCell
statusCell = Browser("HRMS").Page("Leave").WebTable("tblRequests").GetCellData(2, 5)
If statusCell = "PENDING" Then
    Reporter.ReportEvent micPass, "Request Status", "Leave request status is PENDING"
Else
    Reporter.ReportEvent micFail, "Request Status", "Expected PENDING, got: " & statusCell
End If

' Step 6: Logout as employee, login as manager
Call Logout()
Call LoginAsUser("james.richardson@company.com", "manager_pass_456")

' Step 7: Navigate to pending approvals
Browser("HRMS").Page("Dashboard").Link("lnk_leave").Click
Browser("HRMS").Page("Leave").Sync
Browser("HRMS").Page("Leave").Link("lnk_pending_approvals").Click
Wait 2

' Step 8: Approve the leave request
Dim requestRow
Dim i
Dim tblRows
tblRows = Browser("HRMS").Page("Leave").WebTable("tblPendingApprovals").GetRowCount

For i = 2 To tblRows
    Dim cellValue
    cellValue = Browser("HRMS").Page("Leave").WebTable("tblPendingApprovals").GetCellData(i, 2)
    If InStr(cellValue, "Jessica") > 0 Then
        Browser("HRMS").Page("Leave").WebTable("tblPendingApprovals").ChildItem(i, 7, "WebButton", 0).Click
        Wait 1
        Reporter.ReportEvent micPass, "Approve Leave", "Leave request approved for Jessica"
        Exit For
    End If
Next

' Step 9: Logout as manager, login as employee to verify
Call Logout()
Call LoginAsUser("jessica.nguyen@company.com", "test_password_123")

Browser("HRMS").Page("Dashboard").Link("lnk_leave").Click
Browser("HRMS").Page("Leave").Sync

' Verify approved status
statusCell = Browser("HRMS").Page("Leave").WebTable("tblRequests").GetCellData(2, 5)
If statusCell = "APPROVED" Then
    Reporter.ReportEvent micPass, "Approval Verified", "Leave request status changed to APPROVED"
Else
    Reporter.ReportEvent micFail, "Approval Verified", "Expected APPROVED, got: " & statusCell
End If

' Step 10: Verify leave balance reduced
Dim newBalance
newBalance = GetLeaveBalance("PTO")
If CInt(newBalance) < CInt(leaveBalance) Then
    Reporter.ReportEvent micPass, "Balance Update", "Leave balance reduced from " & leaveBalance & " to " & newBalance
Else
    Reporter.ReportEvent micFail, "Balance Update", "Leave balance not updated. Was: " & leaveBalance & " Now: " & newBalance
End If

' Cleanup
Call Logout()
Browser("HRMS").Close
