import React, { useState, useEffect } from 'react';
import { Prompt, TestResult } from '../types';
import { getPrompts, getTestResults } from '../services/api';

interface TestRunWithPrompt extends TestResult {
  prompt: Prompt;
}

const TestRuns: React.FC = () => {
  const [testRuns, setTestRuns] = useState<TestRunWithPrompt[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('all');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promptsData, resultsData] = await Promise.all([
        getPrompts(),
        getTestResults()
      ]);
      
      setPrompts(promptsData);
      
      // Combine test results with their prompts
      const runsWithPrompts = resultsData.map(result => {
        const prompt = promptsData.find(p => p.id === result.promptId);
        return {
          ...result,
          prompt: prompt || {
            id: result.promptId,
            name: result.promptName,
            questions: [],
            answers: {},
            generatedPrompt: 'Prompt not found',
            createdAt: result.timestamp
          }
        };
      });
      
      setTestRuns(runsWithPrompts);
    } catch (error) {
      console.error('Failed to load test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRuns = selectedPrompt === 'all' 
    ? testRuns 
    : testRuns.filter(r => r.promptId === selectedPrompt);

  const toggleExpanded = (runId: string) => {
    setExpandedRun(expandedRun === runId ? null : runId);
  };

  const formatJsonData = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return JSON.stringify(data);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#ffc107';
    return '#dc3545';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const csvHeaders = [
      'Prompt Name',
      'Prompt Details',
      'Test Data Type',
      'Test Data Content',
      'Confidence Score',
      'Processing Time',
      'Model Used',
      'Test Result Summary',
      'ChatGPT Response',
      'Test Timestamp'
    ];

    const csvRows = filteredRuns.map(run => {
      const answersText = Object.entries(run.prompt.answers || {})
        .map(([questionId, answer]) => {
          const question = run.prompt.questions.find(q => q.id === questionId);
          const questionText = question?.text || questionId;
          const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
          return `${questionText}: ${answerText}`;
        })
        .join(' | ');

      return [
        run.prompt.name || 'Unknown',
        run.prompt.generatedPrompt || 'No prompt details',
        run.jsonData?.type || 'Unknown',
        typeof run.jsonData?.content === 'string' 
          ? run.jsonData.content 
          : JSON.stringify(run.jsonData?.content || {}),
        run.result?.confidence?.toString() || 'N/A',
        formatTime(run.result?.processingTime || 0),
        run.result?.model || 'N/A',
        run.result?.summary || 'No summary',
        run.result?.chatGPTResponse || 'No response',
        new Date(run.timestamp).toLocaleString()
      ];
    });

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const cellStr = cell.toString();
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `test-runs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="test-runs">
        <div className="loading">Loading test runs...</div>
      </div>
    );
  }

  return (
    <div className="test-runs">
      <div className="test-runs-header">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Test Runs</h2>
            <p className="text-gray-600 mt-1">Complete history of all prompt tests with detailed results</p>
          </div>
          <button 
            onClick={exportToCSV}
            className="btn btn-secondary"
            disabled={filteredRuns.length === 0}
          >
            Export to CSV
          </button>
        </div>
        
        <div className="filters">
          <label htmlFor="prompt-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Prompt:</label>
          <select 
            id="prompt-filter"
            value={selectedPrompt} 
            onChange={(e) => setSelectedPrompt(e.target.value)}
            className="select"
          >
            <option value="all">All Prompts</option>
            {prompts.map(prompt => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <div className="no-runs">
          <h3>No test runs found</h3>
          <p>
            {selectedPrompt === 'all' 
              ? 'No test runs have been performed yet. Go to the Test Prompts tab to run some tests!'
              : 'No test runs found for this prompt. Try selecting "All Prompts" or run a test with this prompt.'
            }
          </p>
        </div>
      ) : (
        <div className="runs-list">
          {filteredRuns
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map(run => (
              <div key={run.id} className="run-card">
                <div className="run-header" onClick={() => toggleExpanded(run.id)}>
                  <div className="run-info">
                    <h3>{run.promptName}</h3>
                    <div className="run-meta">
                      <span className="timestamp">
                        {new Date(run.timestamp).toLocaleString()}
                      </span>
                      <span 
                        className="confidence"
                        style={{ color: getConfidenceColor(run.result.confidence) }}
                      >
                        {(run.result.confidence * 100).toFixed(1)}% confidence
                      </span>
                      <span className="processing-time">
                        {formatTime(run.result.processingTime)}
                      </span>
                      {run.result.model && (
                        <span className="model">{run.result.model}</span>
                      )}
                    </div>
                  </div>
                  <div className="expand-icon">
                    {expandedRun === run.id ? '▼' : '▶'}
                  </div>
                </div>

                {expandedRun === run.id && (
                  <div className="run-details">
                    <div className="section">
                      <h4>📝 Test Prompt</h4>
                      <div className="prompt-content">
                        <pre>{run.prompt.generatedPrompt}</pre>
                      </div>
                    </div>

                    <div className="section">
                      <h4>📊 Test Data</h4>
                      <div className="data-content">
                        <div className="data-info">
                          <span>Type: {run.jsonData.type || 'json'}</span>
                          <span>Size: {JSON.stringify(run.jsonData).length} characters</span>
                        </div>
                        <details className="data-preview">
                          <summary>View Test Data</summary>
                          <pre>{formatJsonData(run.jsonData)}</pre>
                        </details>
                      </div>
                    </div>

                    <div className="section">
                      <h4>🤖 ChatGPT Response</h4>
                      <div className="response-content">
                        <div className="response-summary">
                          <h5>Summary</h5>
                          <p>{run.result.summary}</p>
                        </div>
                        
                        {run.result.insights && run.result.insights.length > 0 && (
                          <div className="response-insights">
                            <h5>Key Insights</h5>
                            <ul>
                              {run.result.insights.map((insight, index) => (
                                <li key={index}>{insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {run.result.chatGPTResponse && (
                          <details className="full-response">
                            <summary>View Full ChatGPT Response</summary>
                            <div className="response-text">
                              <pre>{run.result.chatGPTResponse}</pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      <style>{`
        .test-runs {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .test-runs-header {
          margin-bottom: 30px;
        }

        .test-runs-header h2 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .test-runs-header p {
          margin: 0 0 20px 0;
          color: #666;
        }

        .filters {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filters label {
          font-weight: 500;
          color: #333;
        }

        .filters select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 200px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 16px;
        }

        .no-runs {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .no-runs h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .runs-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .run-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .run-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .run-header {
          padding: 20px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
        }

        .run-header:hover {
          background: #f0f1f3;
        }

        .run-info h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 18px;
        }

        .run-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          font-size: 13px;
          color: #666;
        }

        .run-meta span {
          padding: 4px 8px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
        }

        .confidence {
          font-weight: 500;
        }

        .expand-icon {
          font-size: 18px;
          color: #666;
          transition: transform 0.2s;
        }

        .run-details {
          padding: 20px;
        }

        .section {
          margin-bottom: 30px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .prompt-content {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
        }

        .prompt-content pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.4;
        }

        .data-content {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
        }

        .data-info {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
          font-size: 13px;
          color: #666;
        }

        .data-preview {
          margin-top: 10px;
        }

        .data-preview summary {
          cursor: pointer;
          font-weight: 500;
          color: #007bff;
          margin-bottom: 10px;
        }

        .data-preview summary:hover {
          color: #0056b3;
        }

        .data-preview pre {
          background: #f1f1f1;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
          overflow-x: auto;
          margin: 0;
          max-height: 300px;
          overflow-y: auto;
        }

        .response-content {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
        }

        .response-summary {
          margin-bottom: 20px;
        }

        .response-summary h5 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 14px;
        }

        .response-summary p {
          margin: 0;
          line-height: 1.5;
          color: #333;
        }

        .response-insights {
          margin-bottom: 20px;
        }

        .response-insights h5 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 14px;
        }

        .response-insights ul {
          margin: 0;
          padding-left: 20px;
        }

        .response-insights li {
          margin-bottom: 6px;
          line-height: 1.4;
          color: #333;
        }

        .full-response {
          margin-top: 15px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }

        .full-response summary {
          cursor: pointer;
          font-weight: 500;
          color: #007bff;
          margin-bottom: 10px;
        }

        .full-response summary:hover {
          color: #0056b3;
        }

        .response-text pre {
          background: #f1f1f1;
          padding: 15px;
          border-radius: 4px;
          font-size: 13px;
          line-height: 1.4;
          overflow-x: auto;
          margin: 0;
          max-height: 400px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        @media (max-width: 768px) {
          .test-runs {
            padding: 10px;
          }

          .run-header {
            padding: 15px;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .run-meta {
            gap: 8px;
          }

          .run-meta span {
            font-size: 12px;
            padding: 3px 6px;
          }

          .run-details {
            padding: 15px;
          }

          .data-info {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default TestRuns;
