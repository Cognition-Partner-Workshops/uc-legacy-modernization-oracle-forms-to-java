import { VBScriptParser } from '../src/parsers/vbscript-parser';

describe('VBScriptParser', () => {
  let parser: VBScriptParser;

  beforeEach(() => {
    parser = new VBScriptParser();
  });

  describe('parse', () => {
    it('should parse a simple UFT script with browser actions', () => {
      const content = `
' Test login
Browser("HRMS").Page("Login").WebEdit("username").Set "admin"
Browser("HRMS").Page("Login").WebButton("login").Click
`;
      const result = parser.parse(content, 'login-test.vbs');

      expect(result.scriptName).toBe('login-test');
      expect(result.actions.length).toBe(2);
      expect(result.comments.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse variable declarations', () => {
      const content = `
Dim myVar
Set objBrowser = Browser("Test")
Const MAX_RETRIES = 3
`;
      const result = parser.parse(content, 'vars.vbs');

      expect(result.variables.length).toBe(3);
      expect(result.variables[0].name).toBe('myVar');
      expect(result.variables[0].type).toBe('Variant');
      expect(result.variables[1].name).toBe('objBrowser');
      expect(result.variables[1].type).toBe('Object');
      expect(result.variables[2].name).toBe('MAX_RETRIES');
      expect(result.variables[2].type).toBe('Const');
    });

    it('should parse Function and Sub definitions', () => {
      const content = `
Function GetUserName(userId)
  Dim name
  name = "TestUser"
  GetUserName = name
End Function

Sub ClickButton(btnName)
  Browser("App").Page("Main").WebButton(btnName).Click
End Sub
`;
      const result = parser.parse(content, 'funcs.vbs');

      expect(result.functions.length).toBe(2);
      expect(result.functions[0].name).toBe('GetUserName');
      expect(result.functions[0].type).toBe('Function');
      expect(result.functions[0].parameters).toEqual(['userId']);
      expect(result.functions[1].name).toBe('ClickButton');
      expect(result.functions[1].type).toBe('Sub');
    });

    it('should parse DataTable references', () => {
      const content = `
Browser("App").Page("Form").WebEdit("name").Set DataTable("FirstName", dtGlobalSheet)
Browser("App").Page("Form").WebEdit("email").Set DataTable("Email", "UserData")
`;
      const result = parser.parse(content, 'data.vbs');

      expect(result.dataTables.length).toBe(2);
      expect(result.dataTables[0].columnName).toBe('FirstName');
      expect(result.dataTables[0].sheetName).toBe('dtGlobalSheet');
      expect(result.dataTables[1].columnName).toBe('Email');
      expect(result.dataTables[1].sheetName).toBe('UserData');
    });

    it('should parse Wait actions', () => {
      const content = `Wait 5`;
      const result = parser.parse(content, 'wait.vbs');

      expect(result.actions.length).toBe(1);
      expect(result.actions[0].objectType).toBe('Utility');
      expect(result.actions[0].method).toBe('Wait');
      expect(result.actions[0].arguments).toEqual(['5']);
    });

    it('should parse Reporter.ReportEvent', () => {
      const content = `Reporter.ReportEvent micPass, "Login", "Login successful"`;
      const result = parser.parse(content, 'reporter.vbs');

      expect(result.actions.length).toBe(1);
      expect(result.actions[0].objectType).toBe('Reporter');
      expect(result.actions[0].method).toBe('ReportEvent');
      expect(result.actions[0].arguments).toContain('micPass');
    });

    it('should parse SystemUtil.Run', () => {
      const content = `SystemUtil.Run "http://localhost:3000"`;
      const result = parser.parse(content, 'sysutil.vbs');

      expect(result.actions.length).toBe(1);
      expect(result.actions[0].objectType).toBe('SystemUtil');
      expect(result.actions[0].method).toBe('Run');
    });

    it('should handle line continuations', () => {
      const content = `Browser("HRMS").Page("Login") _
  .WebEdit("username").Set "admin"`;
      const result = parser.parse(content, 'continuation.vbs');

      // Should parse as a single action
      expect(result.actions.length).toBeGreaterThanOrEqual(1);
    });

    it('should skip empty lines and pure comments', () => {
      const content = `
' This is a comment
REM This is also a comment

' Another comment
Browser("App").Page("Main").WebButton("ok").Click
`;
      const result = parser.parse(content, 'comments.vbs');

      expect(result.actions.length).toBe(1);
      expect(result.comments.length).toBe(3);
    });
  });

  describe('parseAction', () => {
    it('should parse a WebEdit Set action', () => {
      const action = parser.parseAction(
        'Browser("HRMS").Page("Login").WebEdit("username").Set "admin"',
        1
      );

      expect(action).not.toBeNull();
      expect(action!.objectType).toBe('WebEdit');
      expect(action!.objectName).toBe('username');
      expect(action!.method).toBe('Set');
    });

    it('should parse a WebButton Click action', () => {
      const action = parser.parseAction(
        'Browser("HRMS").Page("Login").WebButton("btnLogin").Click',
        1
      );

      expect(action).not.toBeNull();
      expect(action!.objectType).toBe('WebButton');
      expect(action!.method).toBe('Click');
    });

    it('should parse a WebList Select action', () => {
      const action = parser.parseAction(
        'Browser("App").Page("Form").WebList("department").Select "Engineering"',
        1
      );

      expect(action).not.toBeNull();
      expect(action!.objectType).toBe('WebList');
      expect(action!.method).toBe('Select');
    });

    it('should return null for non-UFT lines', () => {
      const action = parser.parseAction('Dim myVariable', 1);
      expect(action).toBeNull();
    });
  });
});
