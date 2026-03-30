' UFT Script: Duplicate Variable Test
' This script tests all patterns that could cause "identifier already declared" errors.

' Pattern 1: Dim then assignment (most common)
Dim a
a = "hello"

' Pattern 2: Multiple assignments without Dim
b = "first"
b = "second"

' Pattern 3: Dim then multiple reassignments
Dim c
c = "value1"
c = "value2"
c = "value3"

' Pattern 4: Same variable in Dim and Set
Dim d
Set d = CreateObject("Scripting.Dictionary")

' Pattern 5: Variable used before and after browser actions
Dim empName
empName = "default"
Browser("HRMS").Page("Login").WebEdit("txtUsername").Set empName
Browser("HRMS").Page("Login").WebButton("btnLogin").Click
Wait 1
empName = "updated"

' Pattern 6: Variable assigned from browser result then reassigned
Dim rowCount
rowCount = 0
Browser("HRMS").Page("Employee List").WebTable("tblResults").Exist(10)
rowCount = Browser("HRMS").Page("Employee List").WebTable("tblResults").GetROProperty("rows")

' Pattern 7: Multiple Dim on separate lines for same variable (VBScript allows this)
Dim x
x = "test"

' Pattern 8: Assignment with SQL concatenation then reassignment
Dim sql
sql = "select * from users where name ='" & empName & "'"
sql = "select * from orders where id ='" & empName & "'"

' Done
Browser("HRMS").Page("Dashboard").Link("lnkLogout").Click
