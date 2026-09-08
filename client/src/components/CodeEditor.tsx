import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccessibility } from './AccessibilityProvider';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { Play, StopCircle, Save, RotateCcw, Terminal, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ProgrammingLanguage, CodeExecutionResult, TestCase } from '@shared/schema';

export interface CodeEditorVoiceActions {
  runTests: () => void;
  readTestResults: () => string;
}

interface CodeEditorProps {
  language: ProgrammingLanguage;
  initialCode?: string;
  testCases?: TestCase[];
  onCodeChange?: (code: string) => void;
  onExecute?: (code: string, language: ProgrammingLanguage) => Promise<CodeExecutionResult>;
  readOnly?: boolean;
  questionId?: string;
  className?: string;
  onVoiceActionsReady?: (actions: CodeEditorVoiceActions | null) => void;
}

const LANGUAGE_CONFIGS = {
  javascript: { name: 'JavaScript', extension: 'js', monacoLang: 'javascript' },
  python: { name: 'Python', extension: 'py', monacoLang: 'python' },
  java: { name: 'Java', extension: 'java', monacoLang: 'java' },
  cpp: { name: 'C++', extension: 'cpp', monacoLang: 'cpp' },
  c: { name: 'C', extension: 'c', monacoLang: 'c' },
  typescript: { name: 'TypeScript', extension: 'ts', monacoLang: 'typescript' },
  go: { name: 'Go', extension: 'go', monacoLang: 'go' },
  rust: { name: 'Rust', extension: 'rs', monacoLang: 'rust' },
};
const EXECUTABLE_LANGUAGES: ProgrammingLanguage[] = ['javascript', 'typescript', 'python'];

const getDefaultCode = (language: ProgrammingLanguage): string => {
  const templates: Record<ProgrammingLanguage, string> = {
    javascript: `// Write your JavaScript solution here
function solve() {
    // Your code here
}

// Example usage:
console.log(solve());`,
    python: `# Write your Python solution here
def solve():
    # Your code here
    pass

# Example usage:
print(solve())`,
    java: `// Write your Java solution here
public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}`,
    cpp: `// Write your C++ solution here
#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
    c: `// Write your C solution here
#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`,
    typescript: `// Write your TypeScript solution here
function solve(): any {
    // Your code here
}

// Example usage:
console.log(solve());`,
    go: `// Write your Go solution here
package main

import "fmt"

func main() {
    // Your code here
}`,
    rust: `// Write your Rust solution here
fn main() {
    // Your code here
}`,
  };
  return templates[language];
};

export function CodeEditor({ 
  language, 
  initialCode, 
  testCases = [], 
  onCodeChange, 
  onExecute,
  readOnly = false,
  questionId,
  className = '',
  onVoiceActionsReady,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode || getDefaultCode(language));
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(language);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const executionSupported = EXECUTABLE_LANGUAGES.includes(selectedLanguage);
  
  const { announceToScreenReader } = useAccessibility();
  const editorRef = useRef<any>(null);
  const voiceRunRef = useRef<() => void>(() => {});
  const voiceResultRef = useRef<() => string>(() => 'There are no coding test results yet.');

  // Keyboard shortcuts for the code editor
  const codeEditorShortcuts = [
    {
      key: 'F5',
      action: () => handleExecute(),
      description: 'Run code'
    },
    {
      key: 'F9',
      action: () => handleReset(),
      description: 'Reset code to default'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => handleSave(),
      description: 'Save code (Ctrl+S)'
    },
    {
      key: 'Equal',
      ctrlKey: true,
      action: () => setFontSize(prev => Math.min(prev + 2, 32)),
      description: 'Increase font size (Ctrl+=)'
    },
    {
      key: 'Minus',
      ctrlKey: true,
      action: () => setFontSize(prev => Math.max(prev - 2, 8)),
      description: 'Decrease font size (Ctrl+-)'
    },
  ];

  useKeyboardNavigation(codeEditorShortcuts);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor for accessibility
    editor.updateOptions({
      fontSize,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      accessibilitySupport: 'on',
      ariaLabel: `Code editor for ${LANGUAGE_CONFIGS[selectedLanguage].name}`,
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyCode.F5, handleExecute);
    editor.addCommand(monaco.KeyCode.F9, handleReset);
    
    announceToScreenReader(`Code editor loaded with ${LANGUAGE_CONFIGS[selectedLanguage].name}. Press F5 to run code, F9 to reset.`);
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const handleLanguageChange = (newLanguage: ProgrammingLanguage) => {
    setSelectedLanguage(newLanguage);
    const defaultCode = getDefaultCode(newLanguage);
    setCode(defaultCode);
    onCodeChange?.(defaultCode);
    announceToScreenReader(`Language changed to ${LANGUAGE_CONFIGS[newLanguage].name}`);
  };

  const handleExecute = async () => {
    if (!onExecute || isExecuting || !executionSupported) {
      if (!executionSupported) announceToScreenReader(`${LANGUAGE_CONFIGS[selectedLanguage].name} execution is not supported yet.`);
      return;
    }
    
    setIsExecuting(true);
    setShowOutput(true);
    announceToScreenReader('Executing code...');
    
    try {
      const result = await onExecute(code, selectedLanguage);
      setExecutionResult(result);
      
      const announcement = `Code execution completed. Status: ${result.status}. ${result.passedTests} of ${result.totalTests} tests passed.`;
      announceToScreenReader(announcement);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setExecutionResult({
        status: 'error',
        output: '',
        error: errorMessage,
        testResults: [],
        executionTime: 0,
        memoryUsed: 0,
        passedTests: 0,
        totalTests: testCases.length
      });
      announceToScreenReader(`Code execution failed: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  };

  voiceRunRef.current = () => void handleExecute();
  voiceResultRef.current = () => executionResult
    ? `Code execution completed. Status ${executionResult.status}. ${executionResult.passedTests} of ${executionResult.totalTests} tests passed.${executionResult.error ? ` Error: ${executionResult.error}` : ''}`
    : 'There are no coding test results yet.';

  useEffect(() => {
    if (!onVoiceActionsReady) return;
    onVoiceActionsReady({
      runTests: () => voiceRunRef.current(),
      readTestResults: () => voiceResultRef.current(),
    });
    return () => onVoiceActionsReady(null);
  }, [onVoiceActionsReady]);

  const handleReset = () => {
    const defaultCode = getDefaultCode(selectedLanguage);
    setCode(defaultCode);
    onCodeChange?.(defaultCode);
    setExecutionResult(null);
    setShowOutput(false);
    announceToScreenReader('Code reset to default template');
  };

  const handleSave = () => {
    // In a real implementation, this would save to localStorage or server
    announceToScreenReader('Code saved');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'timeout': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  // Update editor font size when changed
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  return (
    <div className={`code-editor-container ${className}`} data-navigable="true" data-testid={`code-editor-${questionId}`}>
      {/* Editor Header */}
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Terminal className="h-5 w-5 mr-2" aria-hidden="true" />
              Code Editor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={readOnly}>
                <SelectTrigger className="w-40" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXECUTABLE_LANGUAGES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {LANGUAGE_CONFIGS[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Editor Controls */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              onClick={handleExecute}
              disabled={isExecuting || readOnly || !executionSupported}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-execute"
            >
              {isExecuting ? (
                <>
                  <StopCircle className="h-4 w-4 mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run (F5)
                </>
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={readOnly}
              data-testid="button-reset"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset (F9)
            </Button>
            
            <Button
              onClick={handleSave}
              variant="outline"
              disabled={readOnly}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              Save (Ctrl+S)
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm font-medium">Font Size:</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFontSize(prev => Math.max(prev - 2, 8))}
                data-testid="button-font-decrease"
              >
                -
              </Button>
              <span className="text-sm w-8 text-center">{fontSize}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFontSize(prev => Math.min(prev + 2, 32))}
                data-testid="button-font-increase"
              >
                +
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="border rounded-md overflow-hidden" style={{ height: '400px' }}>
            <Editor
              height="100%"
              language={LANGUAGE_CONFIGS[selectedLanguage].monacoLang}
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              options={{
                readOnly,
                theme: 'vs-dark',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                fontSize,
                fontFamily: 'Consolas, "Courier New", monospace',
                minimap: { enabled: false },
                wordWrap: 'on',
                accessibilitySupport: 'on',
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Execution Output */}
      {showOutput && executionResult && (
        <Card data-testid="execution-results">
          <CardHeader>
            <CardTitle className="flex items-center">
              {getStatusIcon(executionResult.status)}
              <span className="ml-2">Execution Results</span>
              <Badge variant={executionResult.status === 'passed' ? 'default' : 'destructive'} className="ml-2">
                {executionResult.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Test Results Summary */}
            <div className="mb-4">
              <p className="text-sm font-medium">
                Tests: {executionResult.passedTests}/{executionResult.totalTests} passed
              </p>
              <p className="text-sm text-muted-foreground">
                Execution Time: {executionResult.executionTime}ms | 
                Memory Used: {executionResult.memoryUsed}KB
              </p>
            </div>

            {/* Output */}
            {executionResult.output && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Output:</h4>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                  {executionResult.output}
                </pre>
              </div>
            )}

            {/* Error */}
            {executionResult.error && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 text-red-600">Error:</h4>
                <pre className="bg-red-50 border border-red-200 p-3 rounded-md text-sm overflow-x-auto text-red-800">
                  {executionResult.error}
                </pre>
              </div>
            )}

            {/* Individual Test Results */}
            {executionResult.testResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Test Cases:</h4>
                <div className="space-y-2">
                  {executionResult.testResults.map((testResult, index) => (
                    <div 
                      key={testResult.testCaseId}
                      className={`border p-3 rounded-md ${testResult.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Test Case #{index + 1}</span>
                        <Badge variant={testResult.passed ? 'default' : 'destructive'}>
                          {testResult.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1">
                        <div><strong>Expected:</strong> {testResult.expectedOutput}</div>
                        <div><strong>Actual:</strong> {testResult.actualOutput}</div>
                        <div><strong>Time:</strong> {testResult.executionTime}ms</div>
                        {testResult.error && (
                          <div className="text-red-600"><strong>Error:</strong> {testResult.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}