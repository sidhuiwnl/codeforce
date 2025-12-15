import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import {
  Play,
  Check,
  X,
  Code,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  ChevronDown
} from "lucide-react";

const templates = {
  javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split("\\n");
const a = Number(input[0]);
const b = Number(input[1]);
console.log(a + b);`,

  python: `a = int(input())
b = int(input())
print(a + b)`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}`
};

export default function App() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(templates.javascript);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const [deviceType, setDeviceType] = useState("desktop");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Detect device type and adjust UI accordingly
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setDeviceType("mobile");
        setEditorHeight(300);
        setMobileView(true);
      } else if (width < 1024) {
        setDeviceType("tablet");
        setEditorHeight(350);
        setMobileView(false);
      } else {
        setDeviceType("desktop");
        setEditorHeight(400);
        setMobileView(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const runCode = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/run", {
        language,
        code,
        testCases: [
          { input: "2\n3", output: "5" },
          { input: "10\n20", output: "30" },
          { input: "100\n250", output: "350" }
        ]
      });
      setResult(res.data.results);
    } catch (error) {
      console.error("Error running code:", error);
      setResult([{ passed: false, error: "Failed to run code" }]);
    } finally {
      setLoading(false);
    }
  };

  const languageOptions = [
    { value: "javascript", label: "JavaScript", color: "bg-yellow-100 text-yellow-800" },
    { value: "python", label: "Python", color: "bg-blue-100 text-blue-800" },
    { value: "cpp", label: "C++", color: "bg-purple-100 text-purple-800" }
  ];

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(templates[lang]);
    setDropdownOpen(false);
  };

  const getLanguageColor = (lang) => {
    switch(lang) {
      case "javascript": return "border-l-yellow-500";
      case "python": return "border-l-blue-500";
      case "cpp": return "border-l-purple-500";
      default: return "border-l-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Code className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              Code Runner
            </h1>
          </div>

          {/* Device Indicator */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            {deviceType === "desktop" && <Monitor className="w-4 h-4 text-gray-600" />}
            {deviceType === "tablet" && <Tablet className="w-4 h-4 text-gray-600" />}
            {deviceType === "mobile" && <Smartphone className="w-4 h-4 text-gray-600" />}
            <span className="text-sm font-medium text-gray-700 capitalize">{deviceType} view</span>
          </div>
        </div>

        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Write, test, and run code in multiple programming languages
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column - Info and Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Run Button Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Run Code
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Execute your code against test cases and see the results
            </p>
            
            <button
              onClick={runCode}
              disabled={loading}
              className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Code
                </>
              )}
            </button>
          </div>

          

          {/* Test Cases Info */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Test Cases
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">Case 1</span>
                </div>
                <p className="text-sm text-gray-600">Input: 2, 3</p>
                <p className="text-sm text-gray-600">Expected Output: 5</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">Case 2</span>
                </div>
                <p className="text-sm text-gray-600">Input: 10, 20</p>
                <p className="text-sm text-gray-600">Expected Output: 30</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">Case 3</span>
                </div>
                <p className="text-sm text-gray-600">Input: 100, 250</p>
                <p className="text-sm text-gray-600">Expected Output: 350</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Editor with Dropdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editor Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Editor Header with Language Dropdown */}
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center justify-between w-full md:w-auto">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Code Editor
                  </h2>
                  <div className="md:hidden text-sm text-gray-500 px-3 py-1 bg-white rounded-full border">
                    {language.toUpperCase()}
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200 w-full md:w-auto justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        language === "javascript" ? "bg-yellow-500" :
                        language === "python" ? "bg-blue-500" :
                        "bg-purple-500"
                      }`}></span>
                      {languageOptions.find(l => l.value === language)?.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {languageOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleLanguageChange(option.value)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between ${
                            language === option.value ? "bg-gray-100" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              option.value === "javascript" ? "bg-yellow-500" :
                              option.value === "python" ? "bg-blue-500" :
                              "bg-purple-500"
                            }`}></div>
                            <span className="font-medium">{option.label}</span>
                          </div>
                          {language === option.value && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Editor */}
            <div className={mobileView ? "overflow-x-auto" : ""}>
              <Editor
                height={`${editorHeight}px`}
                language={language === "cpp" ? "cpp" : language}
                value={code}
                onChange={(v) => setCode(v)}
                theme="vs-dark"
                options={{
                  minimap: { enabled: !mobileView },
                  fontSize: mobileView ? 14 : 16,
                  wordWrap: "on",
                  lineNumbers: mobileView ? "off" : "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Results Card */}
          {result && (
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Test Results
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.map((r, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      r.passed
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {r.passed ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium text-gray-700">
                          Test {i + 1}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          r.passed
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {r.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>

                    {!r.passed && r.error && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                        Error: {r.error}
                      </div>
                    )}

                    {r.executionTime && (
                      <div className="mt-2 text-sm text-gray-500">
                        Execution time: {r.executionTime}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-gray-700">
                    <span className="font-semibold">Total:</span> {result.length} tests
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Passed:</span>{" "}
                    {result.filter((r) => r.passed).length} tests
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Success Rate:</span>{" "}
                    {Math.round(
                      (result.filter((r) => r.passed).length / result.length) *
                      100
                    )}
                    %
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 md:mt-12 pt-6 border-t border-gray-200">
        <div className="text-center text-gray-500 text-sm">
          <p>Code Runner • Supports JavaScript, Python, and C++</p>
          <p className="mt-1">
            Responsive design optimized for mobile, tablet, and desktop
          </p>
        </div>
      </footer>

      {/* Mobile-specific floating action button */}
      {mobileView && (
        <button
          onClick={runCode}
          disabled={loading}
          className="fixed bottom-6 right-6 bg-linear-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-50"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}