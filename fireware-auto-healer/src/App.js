import React, { useState } from "react";
import {
  Upload,
  FileText,
  Code,
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowLeft,
  Send,
} from "lucide-react";

const FirmwareHealerApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [jiraDescription, setJiraDescription] = useState("");
  const [jiraResults, setJiraResults] = useState(null);

  // Log Analyzer Handler
  const handleLogUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Replace with your backend endpoint
      const response = await fetch("/api/analyze-log", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResults({
        type: "log",
        data: data,
        filename: file.name,
      });
    } catch (error) {
      console.error("Error analyzing log:", error);
      // Demo data for testing
      setResults({
        type: "log",
        filename: file.name,
        data: {
          rootCause: "Memory allocation failure in bootloader module",
          reproductionSteps: [
            "Initialize system with low memory configuration",
            "Trigger firmware update sequence",
            "Monitor memory allocation during boot phase",
          ],
          suggestedFix:
            "Increase heap size allocation in bootloader config by 512KB",
          confidence: 94,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Jira Analyzer Handler
  const handleJiraSubmit = async () => {
    if (!jiraDescription.trim()) return;

    setLoading(true);
    try {
      // Replace with your backend endpoint
      const response = await fetch("/api/analyze-jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: jiraDescription }),
      });
      const data = await response.json();
      setJiraResults(data);
    } catch (error) {
      console.error("Error analyzing Jira:", error);
      // Demo data for testing
      setJiraResults({
        summary:
          "Critical firmware boot failure due to memory corruption in bootloader. Issue affects v2.1.x builds on ARM-based devices.",
        similarIssues: [
          {
            id: "FW-1234",
            title: "Bootloader memory leak in v2.0",
            similarity: 92,
          },
          {
            id: "FW-5678",
            title: "ARM device boot failure pattern",
            similarity: 87,
          },
          {
            id: "FW-9012",
            title: "Memory corruption during OTA update",
            similarity: 81,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  // Code Corrector Handler
  const handleCodeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Replace with your backend endpoint
      const response = await fetch("/api/correct-code", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResults({
        type: "code",
        data: data,
        filename: file.name,
      });
    } catch (error) {
      console.error("Error correcting code:", error);
      // Demo data for testing
      setResults({
        type: "code",
        filename: file.name,
        data: {
          issuesFound: 3,
          corrections: [
            {
              line: 42,
              issue: "Buffer overflow risk",
              fix: "Add bounds checking before memcpy",
            },
            {
              line: 78,
              issue: "Uninitialized pointer",
              fix: "Initialize ptr to NULL",
            },
            {
              line: 105,
              issue: "Memory leak",
              fix: "Add free() call before function return",
            },
          ],
          fixedCode: "// Corrected code would appear here...",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Dashboard View
  const DashboardView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Firmware Auto-Healer
              </h1>
              <p className="text-blue-300 text-sm">
                AI-Powered Build Doctor & Reproduction Simulator
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <FeatureCard
            icon={<FileText />}
            title="Log Analyzer"
            description="Upload firmware logs to detect root causes and get reproduction steps"
            onUpload={handleLogUpload}
            acceptedFiles=".log,.txt"
            loading={loading && results?.type === "log"}
          />

          <FeatureCard
            icon={<AlertCircle />}
            title="Jira Analyzer"
            description="Analyze Jira issues to find patterns and similar problems"
            onClick={() => setActiveTab("jira")}
            isButton
          />

          <FeatureCard
            icon={<Code />}
            title="Syntax Corrector"
            description="Upload code files to detect and fix syntax errors automatically"
            onUpload={handleCodeUpload}
            acceptedFiles=".c,.cpp,.h,.py"
            loading={loading && results?.type === "code"}
          />
        </div>

        {/* Results Display */}
        {results && (
          <ResultsDisplay results={results} onClose={() => setResults(null)} />
        )}
      </div>
    </div>
  );

  // Jira Analysis View
  const JiraView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-blue-500/20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">Jira Issue Analyzer</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
          <label className="block text-white font-medium mb-3">
            Issue Description
          </label>
          <textarea
            value={jiraDescription}
            onChange={(e) => setJiraDescription(e.target.value)}
            placeholder="Enter the Jira issue description here..."
            className="w-full h-40 bg-slate-900/50 text-white border border-slate-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <button
            onClick={handleJiraSubmit}
            disabled={loading || !jiraDescription.trim()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Analyze Issue
              </>
            )}
          </button>
        </div>

        {jiraResults && (
          <div className="mt-8 space-y-6">
            {/* Summary */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Summary
              </h2>
              <p className="text-slate-300 leading-relaxed">
                {jiraResults.summary}
              </p>
            </div>

            {/* Similar Issues */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
              <h2 className="text-xl font-bold text-white mb-4">
                Similar Issues
              </h2>
              <div className="space-y-3">
                {jiraResults.similarIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-blue-400 font-mono text-sm">
                          {issue.id}
                        </span>
                        <p className="text-white mt-1">{issue.title}</p>
                      </div>
                      <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                        {issue.similarity}% match
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return activeTab === "dashboard" ? <DashboardView /> : <JiraView />;
};

// Feature Card Component
const FeatureCard = ({
  icon,
  title,
  description,
  onUpload,
  acceptedFiles,
  onClick,
  isButton,
  loading,
}) => {
  const handleFileSelect = (e) => {
    if (onUpload) onUpload(e);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all">
      <div className="bg-blue-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        {React.cloneElement(icon, { className: "w-6 h-6 text-blue-400" })}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-4 text-sm">{description}</p>

      {isButton ? (
        <button
          onClick={onClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Open Analyzer
        </button>
      ) : (
        <label className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload File
            </>
          )}
          <input
            type="file"
            onChange={handleFileSelect}
            accept={acceptedFiles}
            className="hidden"
            disabled={loading}
          />
        </label>
      )}
    </div>
  );
};

// Results Display Component
const ResultsDisplay = ({ results, onClose }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="mb-4 text-sm text-blue-400">File: {results.filename}</div>

      {results.type === "log" && (
        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-red-500/20">
            <h3 className="text-red-400 font-semibold mb-2">Root Cause</h3>
            <p className="text-white">{results.data.rootCause}</p>
            <div className="mt-2 text-sm text-slate-400">
              Confidence: {results.data.confidence}%
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-500/20">
            <h3 className="text-yellow-400 font-semibold mb-2">
              Reproduction Steps
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-white">
              {results.data.reproductionSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/20">
            <h3 className="text-green-400 font-semibold mb-2">Suggested Fix</h3>
            <p className="text-white">{results.data.suggestedFix}</p>
          </div>
        </div>
      )}

      {results.type === "code" && (
        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-blue-500/20">
            <h3 className="text-blue-400 font-semibold mb-3">
              Found {results.data.issuesFound} Issues
            </h3>
            <div className="space-y-3">
              {results.data.corrections.map((correction, idx) => (
                <div key={idx} className="border-l-2 border-yellow-500 pl-3">
                  <div className="text-yellow-400 text-sm">
                    Line {correction.line}
                  </div>
                  <div className="text-white font-medium">
                    {correction.issue}
                  </div>
                  <div className="text-green-400 text-sm mt-1">
                    Fix: {correction.fix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirmwareHealerApp;
