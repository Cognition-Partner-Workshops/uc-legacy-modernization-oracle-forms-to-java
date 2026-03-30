' UFT Script: Complex Scenarios Test
' Exercises all edge cases for variable handling and string conversion.

' ---- Scenario 1: Dim then multiple reassignments ----
Dim aaa
aaa = "first value"
Browser("HRMS").Page("Dashboard").WebElement("status").GetROProperty("innertext")
aaa = "second value"

' ---- Scenario 2: Variable assigned without Dim (first use) ----
bbb = "direct assignment"

' ---- Scenario 3: Same variable assigned multiple times without Dim ----
ccc = "value1"
ccc = "value2"
ccc = "value3"

' ---- Scenario 4: SQL with & without spaces around ampersand ----
Dim sqlQuery
sqlQuery = "select * from users where name ='" & userName & "'"

' ---- Scenario 5: Concatenation without single quotes ----
Dim greeting
greeting = "Hello " & firstName & " " & lastName

' ---- Scenario 6: String with single quotes but no concatenation ----
Dim staticSql
staticSql = "select * from test where status = 'active'"

' ---- Scenario 7: Multiple Dim for same variable ----
Dim myVar
myVar = "assigned once"

' ---- Scenario 8: Set object variable then reassignment ----
Set objConn = CreateObject("ADODB.Connection")

' ---- Scenario 9: Const declaration ----
Const MAX_RETRIES = 5
Const APP_NAME = "HRMS Application"

' ---- Scenario 10: VBScript escaped double quotes inside string ----
Dim htmlContent
htmlContent = "He said ""hello"" to everyone"

' ---- Scenario 11: Empty string concatenation ----
Dim emptyConcat
emptyConcat = "" & userName & ""

' ---- Scenario 12: Multiple variables in single Dim ----
Dim var1, var2, var3
var1 = "one"
var2 = "two"
var3 = "three"

' ---- Scenario 13: Complex SQL with multiple single-quote segments ----
Dim complexSql
complexSql = "INSERT INTO employees (name, dept, status) VALUES ('" & empName & "', '" & deptName & "', 'active')"

' ---- Scenario 14: Template literal edge case - string with backtick ----
Dim codeSnippet
codeSnippet = "Use backtick ` for template"

' ---- Scenario 15: Boolean and Nothing assignments ----
Dim isActive
isActive = True
Dim result
result = Nothing

' ---- Scenario 16: Numeric assignment ----
Dim counter
counter = 0

' ---- Browser actions interspersed with variable assignments ----
Browser("HRMS").Page("Login").WebEdit("txtUsername").Set "admin"
Browser("HRMS").Page("Login").WebEdit("txtPassword").SetSecure "encrypted_pwd"
Browser("HRMS").Page("Login").WebButton("btnLogin").Click
Wait 2

' Variable assigned from action result
empName = Browser("HRMS").Page("Employee Form").WebElement("emp_name").GetROProperty("innertext")

' More browser actions
Browser("HRMS").Page("Employee List").WebEdit("txtSearch").Set "John"
Browser("HRMS").Page("Employee List").WebButton("btnSearch").Click
Wait 1

' Verify results exist
Browser("HRMS").Page("Employee List").WebTable("tblResults").Exist(10)
