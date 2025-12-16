import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  Maximize2,
  Minimize2,
  AlertTriangle
} from "lucide-react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate
} from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";

/* =========================
   CODE TEMPLATES
========================= */
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

/* =========================
   HOME PAGE
========================= */
function Home() {
  const navigate = useNavigate();

  const startTest = () => {
    Swal.fire({
      title: 'Important Instructions',
      html: `
        <div class="text-left space-y-3">
          <p><strong>⚠️ Test Rules:</strong></p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Fullscreen is <strong>REQUIRED</strong></li>
            <li>No tab switching allowed</li>
            <li>No screenshots (PrintScreen blocked)</li>
            <li>Right-click and copy disabled</li>
            <li>DevTools access is blocked</li>
            <li>Tab switching > 2 times will end test</li>
          </ul>
          <p class="text-red-600 font-semibold mt-4">Test will auto-start in fullscreen mode!</p>
        </div>
      `,
      icon: 'warning',
      confirmButtonText: 'Start Test',
      confirmButtonColor: '#3085d6',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/test");
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Code className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Coding Assessment
        </h1>
        <p className="text-gray-600 mb-8">
          Secure coding test with anti-cheat protection
        </p>
        <button
          onClick={startTest}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl w-full"
        >
          Start Secure Test
        </button>
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800 text-left">
              <strong>Note:</strong> Test requires fullscreen mode. Please allow fullscreen when prompted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   TEST PAGE
========================= */
function Test() {
  const navigate = useNavigate();
  const testContainerRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(templates.javascript);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const [deviceType, setDeviceType] = useState("desktop");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTestEnded, setIsTestEnded] = useState(false);

  /* =========================
     FULLSCREEN ENFORCEMENT
  ========================= */
  const enforceFullscreen = () => {
    if (!document.fullscreenElement) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.error(`Fullscreen error: ${err.message}`);
          Swal.fire({
            title: 'Fullscreen Required',
            text: 'Please enable fullscreen manually to continue the test.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        });
      }
    }
  };

  /* =========================
     ANTI-CHEAT LOGIC
  ========================= */
  useEffect(() => {
    if (isTestEnded) return;

    // Enforce fullscreen on test start
    const timer = setTimeout(() => {
      enforceFullscreen();
    }, 500);

    // Fullscreen change handler
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      
      if (!isFull) {
        toast.error("⚠️ Fullscreen exited! Re-entering fullscreen...");
        setTimeout(enforceFullscreen, 1000);
      }
    };

    // Tab switch/blur handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          
          if (newCount >= 3) {
            endTest("Test terminated due to multiple tab switches");
            return newCount;
          }
          
          toast.error(`⚠️ Tab switched (${newCount}/2 warnings)`);
          
          // Show warning message
          setShowWarning(true);
          if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
          }
          warningTimeoutRef.current = setTimeout(() => {
            setShowWarning(false);
          }, 3000);
          
          return newCount;
        });
      }
    };

    // Prevent screenshot (PrintScreen)
    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        toast.error("⚠️ Screenshot/Print attempt blocked!");
        // Apply visual deterrent
        document.body.style.filter = 'invert(1)';
        setTimeout(() => {
          document.body.style.filter = 'none';
        }, 800);
        return false;
      }
    };

    // Block DevTools
    const blockDevTools = (e) => {
      const keys = ['F12', 'F8'];
      if (keys.includes(e.key) || 
          (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
          (e.metaKey && e.altKey && e.key.toUpperCase() === 'I')) {
        e.preventDefault();
        toast.error("⚠️ Developer tools are disabled");
        return false;
      }
    };

    // Prevent copy/paste
    const preventCopy = (e) => {
      if (e.ctrlKey && ['c', 'x', 'v'].includes(e.key.toLowerCase())) {
        toast.error("⚠️ Copy/paste disabled");
        e.preventDefault();
      }
    };

    // Prevent right-click
    const preventRightClick = (e) => {
      e.preventDefault();
      toast.error("⚠️ Right-click disabled");
    };

    // Prevent drag/drop
    const preventDrag = (e) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', blockDevTools);
    document.addEventListener('keydown', preventCopy);
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('drop', preventDrag);

    // Initial fullscreen check
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      clearTimeout(timer);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', blockDevTools);
      document.removeEventListener('keydown', preventCopy);
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('drop', preventDrag);
    };
  }, [isTestEnded, navigate]);

  /* =========================
     END TEST FUNCTION
  ========================= */
  const endTest = (reason) => {
    setIsTestEnded(true);
    
    // Exit fullscreen if in fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    
    Swal.fire({
      title: 'Test Terminated',
      text: reason,
      icon: 'error',
      confirmButtonText: 'Return to Home',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: '#d33'
    }).then(() => {
      navigate("/");
    });
  };

  /* =========================
     RESPONSIVE UI
  ========================= */
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

  /* =========================
     RUN CODE
  ========================= */
  const runCode = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/run`, {
        language,
        code,
        testCases: [
          { input: "2\n3", output: "5" },
          { input: "10\n20", output: "30" },
          { input: "100\n250", output: "350" }
        ]
      });
      setResult(res.data.results);
      toast.success("Code executed successfully!");
    } catch {
      toast.error("Failed to run code");
      setResult(null);
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

  return (
    <div 
      ref={testContainerRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6 lg:p-8"
    >
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #4b5563'
          },
        }}
      />

      {/* WARNING OVERLAY */}
      {showWarning && (
        <div className="fixed inset-0 bg-red-600/90 z-50 flex items-center justify-center">
          <div className="text-center text-white p-8 max-w-lg">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">⚠️ WARNING ⚠️</h2>
            <p className="text-xl mb-2">Tab switch detected!</p>
            <p className="mb-4">Remaining warnings: {3 - tabSwitchCount}</p>
            <p className="text-sm opacity-80">Please stay on this tab to continue the test</p>
          </div>
        </div>
      )}

      {/* FULLSCREEN WARNING */}
      {!isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-40 flex items-center justify-center">
          <div className="text-center text-white p-8 max-w-lg">
            <Maximize2 className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-3xl font-bold mb-4">FULLSCREEN REQUIRED</h2>
            <p className="text-lg mb-6">Please enable fullscreen mode to continue the test</p>
            <button
              onClick={enforceFullscreen}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold text-lg"
            >
              Enable Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Code className="w-8 h-8 text-indigo-400" />
              {!isFullscreen && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Secure Code Test
            </h1>
          </div>

          {/* STATUS BAR */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
              {deviceType === "desktop" && <Monitor className="w-4 h-4 text-gray-400" />}
              {deviceType === "tablet" && <Tablet className="w-4 h-4 text-gray-400" />}
              {deviceType === "mobile" && <Smartphone className="w-4 h-4 text-gray-400" />}
              <span className="text-sm font-medium text-gray-300 capitalize">{deviceType} view</span>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isFullscreen ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              {isFullscreen ? (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Fullscreen</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Windowed</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < (3 - tabSwitchCount) ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-300">
                Warnings: {tabSwitchCount}/3
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          {/* LANGUAGE DROPDOWN */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Select Language
            </h2>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 hover:bg-gray-800 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20">
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLanguageChange(option.value)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors duration-150 flex items-center justify-between ${language === option.value ? "bg-gray-800" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          option.value === "javascript" ? "bg-yellow-500" :
                          option.value === "python" ? "bg-blue-500" :
                          "bg-purple-500"
                        }`}></div>
                        <span className="font-medium text-gray-100">{option.label}</span>
                      </div>
                      {language === option.value && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RUN BUTTON */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
            <button
              onClick={runCode}
              disabled={loading || !isFullscreen}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            {!isFullscreen && (
              <p className="text-red-400 text-sm mt-3 text-center">
                Enable fullscreen to run code
              </p>
            )}
          </div>

          {/* TEST CASES */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Test Cases
            </h3>
            <div className="space-y-3">
              {[
                { input: "2, 3", output: "5", color: "bg-green-900/30" },
                { input: "10, 20", output: "30", color: "bg-blue-900/30" },
                { input: "100, 250", output: "350", color: "bg-purple-900/30" }
              ].map((test, i) => (
                <div key={i} className={`p-3 ${test.color} rounded-lg border border-gray-700`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="font-medium text-gray-300">Case {i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-400">Input: {test.input}</p>
                  <p className="text-sm text-gray-400">Expected: {test.output}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* EDITOR */}
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-700 bg-gray-900/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Code Editor
                </h2>
                <div className="text-sm text-gray-300 px-3 py-1 bg-gray-700 rounded-full">
                  {language.toUpperCase()}
                </div>
              </div>
            </div>
            
            <div className={mobileView ? "overflow-x-auto" : ""}>
              <Editor
                height={`${editorHeight}px`}
                language={language === "cpp" ? "cpp" : language}
                value={code}
                onChange={(v) => setCode(v || "")}
                theme="vs-dark"
                options={{
                  fontSize: mobileView ? 14 : 16,
                  minimap: { enabled: !mobileView },
                  wordWrap: "on",
                  lineNumbers: mobileView ? "off" : "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  readOnly: false,
                }}
              />
            </div>
          </div>

          {/* RESULTS */}
          {result && (
            <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Test Results
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.map((r, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      r.passed
                        ? "bg-green-900/20 border-green-700"
                        : "bg-red-900/20 border-red-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {r.passed ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium text-gray-300">
                          Test {i + 1}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          r.passed
                            ? "bg-green-900 text-green-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {r.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>

                    {!r.passed && r.error && (
                      <div className="mt-2 p-2 bg-red-900/30 rounded text-sm text-red-300">
                        Error: {r.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* SUMMARY */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-gray-300">
                    <span className="font-semibold">Total:</span> {result.length} tests
                  </div>
                  <div className="text-gray-300">
                    <span className="font-semibold">Passed:</span>{" "}
                    {result.filter((r) => r.passed).length} tests
                  </div>
                  <div className="text-gray-300">
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

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}

/* =========================
   APP ROUTER
========================= */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </Router>
  );
}