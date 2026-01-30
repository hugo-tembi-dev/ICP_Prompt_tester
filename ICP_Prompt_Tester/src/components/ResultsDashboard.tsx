import React, { useState, useEffect } from 'react';
import { Prompt, TestResult } from '../types';
import { getPrompts, getTestResults, getOverallAnalytics, getPromptAnalytics } from '../services/api';

interface PromptMetrics {
  promptId: string;
  promptName: string;
  totalTests: number;
  averageConfidence: number;
  averageProcessingTime: number;
  lastTest: string;
  version?: number;
  successRate?: number;
  totalTokens?: number;
  totalCost?: number;
}

interface OverallAnalytics {
  prompt_id: string;
  prompt_name: string;
  version: number;
  total_tests: number;
  avg_confidence: number;
  avg_processing_time: number;
  success_rate: number;
  last_test: string;
  total_tokens: number;
  total_cost: number;
}

const ResultsDashboard: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [metrics, setMetrics] = useState<PromptMetrics[]>([]);
  const [overallAnalytics, setOverallAnalytics] = useState<OverallAnalytics[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [promptsData, resultsData, analyticsData] = await Promise.all([
        getPrompts(),
        getTestResults(),
        getOverallAnalytics()
      ]);
      
      console.log('Test Results with cost/token data:', resultsData.map(r => ({
        id: r.id,
        promptName: r.promptName,
        tokensUsed: r.tokensUsed,
        costUsd: r.costUsd,
        resultTokens: r.result.tokensUsed,
        resultCost: r.result.costUsd
      })));

      console.log('Calculated metrics:', {
        totalCost: resultsData.reduce((sum, r) => sum + (r.costUsd || 0), 0),
        totalTokens: resultsData.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
        totalTests: resultsData.length
      });
      
      setPrompts(promptsData);
      setTestResults(resultsData);
      setOverallAnalytics(analyticsData);
      calculateMetrics(promptsData, resultsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const calculateMetrics = (prompts: Prompt[], results: TestResult[]) => {
    const metricsMap = new Map<string, PromptMetrics>();

    prompts.forEach(prompt => {
      const promptResults = results.filter(r => r.promptId === prompt.id);
      
      if (promptResults.length > 0) {
        const totalConfidence = promptResults.reduce((sum, r) => sum + (r.result.confidence || 0), 0);
        const totalTime = promptResults.reduce((sum, r) => sum + (r.result.processingTime || 0), 0);
        const totalTokens = promptResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
        const totalCost = promptResults.reduce((sum, r) => sum + (r.costUsd || 0), 0);
        const lastTest = new Date(Math.max(...promptResults.map(r => new Date(r.timestamp).getTime())));

        metricsMap.set(prompt.id, {
          promptId: prompt.id,
          promptName: prompt.name,
          totalTests: promptResults.length,
          averageConfidence: totalConfidence / promptResults.length,
          averageProcessingTime: totalTime / promptResults.length,
          totalTokens,
          totalCost,
          lastTest: lastTest.toISOString()
        });
      }
    });

    setMetrics(Array.from(metricsMap.values()));
  };

  const filteredResults = selectedPrompt === 'all' 
    ? testResults 
    : testResults.filter(r => r.promptId === selectedPrompt);

  const getEfficiencyScore = (confidence: number | null | undefined, processingTime: number | null | undefined) => {
    if (!confidence || !processingTime) return 0;
    // Normalize processing time (lower is better, assuming max 5000ms)
    const timeScore = Math.max(0, 1 - (processingTime / 5000));
    // Weight confidence more heavily
    return (confidence * 0.7 + timeScore * 0.3) * 100;
  };

  const getTopPerformers = () => {
    return metrics
      .map(m => ({
        ...m,
        efficiencyScore: getEfficiencyScore(m.averageConfidence, m.averageProcessingTime)
      }))
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
      .slice(0, 5);
  };

  const exportResults = () => {
    const exportData = {
      prompts: prompts,
      testResults: testResults,
      metrics: metrics,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (ms: number | null | undefined) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatChatGPTResponse = (response: string) => {
    if (!response) return '';
    
    // Split by paragraphs and format each
    return response
      .split('\n\n')
      .filter(paragraph => paragraph.trim())
      .map((paragraph, index) => {
        // Handle bullet points
        if (paragraph.includes('\n-') || paragraph.includes('\n•')) {
          const lines = paragraph.split('\n');
          return (
            <div key={index} className="response-paragraph">
              {lines.map((line, lineIndex) => {
                if (line.startsWith('-') || line.startsWith('•')) {
                  return <li key={lineIndex}>{line.substring(1).trim()}</li>;
                } else if (line.trim()) {
                  return <p key={lineIndex}>{line}</p>;
                }
                return null;
              })}
            </div>
          );
        }
        
        // Handle numbered lists
        if (/^\d+\./.test(paragraph)) {
          const lines = paragraph.split('\n');
          return (
            <ol key={index} className="response-list">
              {lines.map((line, lineIndex) => {
                const match = line.match(/^\d+\.\s*(.+)/);
                if (match) {
                  return <li key={lineIndex}>{match[1]}</li>;
                }
                return null;
              })}
            </ol>
          );
        }
        
        // Regular paragraph
        return <p key={index} className="response-paragraph">{paragraph}</p>;
      });
  };

  const getConfidenceColor = (confidence: number | null | undefined) => {
    if (!confidence) return '#dc3545'; // Default to red for null/undefined
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#ffc107';
    return '#dc3545';
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="results-dashboard">
      <div className="dashboard-header">
        <h2>Results Dashboard</h2>
        <button onClick={exportResults} className="btn btn-secondary">
          Export Results
        </button>
      </div>

      <div className="overview-cards">
        <div className="card">
          <h3>Total Prompts</h3>
          <div className="value">{prompts.length}</div>
        </div>
        <div className="card">
          <h3>Total Tests</h3>
          <div className="value">{testResults.length}</div>
        </div>
        <div className="card">
          <h3>Avg Confidence</h3>
          <div className="value">
            {testResults.length > 0 
              ? `${(testResults.reduce((sum, r) => sum + r.result.confidence, 0) / testResults.length * 100).toFixed(1)}%`
              : 'N/A'
            }
          </div>
        </div>
        <div className="card">
          <h3>Avg Processing Time</h3>
          <div className="value">
            {testResults.length > 0 
              ? formatTime(testResults.reduce((sum, r) => sum + r.result.processingTime, 0) / testResults.length)
              : 'N/A'
            }
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Section */}
      {overallAnalytics.length > 0 && (
        <div className="enhanced-analytics">
          <h3>📊 Enhanced Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>🏆 Top Performing Prompts</h4>
              <div className="top-performers">
                {overallAnalytics
                  .sort((a, b) => b.avg_confidence - a.avg_confidence)
                  .slice(0, 3)
                  .map((prompt, index) => (
                    <div key={prompt.prompt_id} className="performer-item">
                      <span className="rank">#{index + 1}</span>
                      <div className="performer-info">
                        <div className="name">{prompt.prompt_name}</div>
                        <div className="metrics">
                          <span className="confidence">
                            {prompt.avg_confidence ? `${(prompt.avg_confidence * 100).toFixed(1)}% confidence` : 'N/A'}
                          </span>
                          <span className="tests">{prompt.total_tests} tests</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="analytics-card">
              <h4>⚡ Efficiency Leaders</h4>
              <div className="efficiency-leaders">
                {overallAnalytics
                  .map(prompt => ({
                    ...prompt,
                    efficiencyScore: getEfficiencyScore(prompt.avg_confidence, prompt.avg_processing_time)
                  }))
                  .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
                  .slice(0, 3)
                  .map((prompt, index) => (
                    <div key={prompt.prompt_id} className="leader-item">
                      <span className="rank">#{index + 1}</span>
                      <div className="leader-info">
                        <div className="name">{prompt.prompt_name}</div>
                        <div className="metrics">
                          <span 
                            className="efficiency"
                            style={{ color: getEfficiencyColor(prompt.efficiencyScore || 0) }}
                          >
                            {prompt.efficiencyScore ? `${prompt.efficiencyScore.toFixed(0)}% efficiency` : 'N/A'}
                          </span>
                          <span className="time">{formatTime(prompt.avg_processing_time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="analytics-card">
              <h4>💰 Cost Analysis</h4>
              <div className="cost-analysis">
                <div className="total-cost">
                  <span className="label">Total API Cost:</span>
                  <span className="value">
                    ${testResults.reduce((sum: number, r: TestResult) => sum + (r.costUsd || 0), 0).toFixed(4)}
                  </span>
                </div>
                <div className="total-tokens">
                  <span className="label">Total Tokens Used:</span>
                  <span className="value">
                    {testResults.reduce((sum: number, r: TestResult) => sum + (r.tokensUsed || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="avg-cost">
                  <span className="label">Avg Cost per Test:</span>
                  <span className="value">
                    ${testResults.length > 0
                      ? (testResults.reduce((sum: number, r: TestResult) => sum + (r.costUsd || 0), 0) / testResults.length).toFixed(6)
                      : '0'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h4>📈 Success Rates</h4>
              <div className="success-rates">
                {overallAnalytics
                  .sort((a, b) => b.success_rate - a.success_rate)
                  .slice(0, 5)
                  .map((prompt) => (
                    <div key={prompt.prompt_id} className="success-item">
                      <div className="name">{prompt.prompt_name}</div>
                      <div className="success-bar">
                        <div 
                          className="success-fill"
                          style={{ 
                            width: `${prompt.success_rate || 0}%`,
                            backgroundColor: (prompt.success_rate || 0) >= 90 ? '#28a745' : 
                                             (prompt.success_rate || 0) >= 70 ? '#ffc107' : '#dc3545'
                          }}
                        />
                        <span className="success-text">{prompt.success_rate ? `${prompt.success_rate.toFixed(1)}%` : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div className="metrics-section">
          <h3>Prompt Performance Metrics</h3>
          <div className="filter-controls">
            <label htmlFor="prompt-filter">Filter by Prompt:</label>
            <select
              id="prompt-filter"
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
            >
              <option value="all">All Prompts</option>
              {prompts.map(prompt => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Prompt Name</th>
                  <th>Tests Run</th>
                  <th>Avg Confidence</th>
                  <th>Avg Time</th>
                  <th>Efficiency Score</th>
                  <th>Last Test</th>
                </tr>
              </thead>
              <tbody>
                {metrics
                  .filter(m => selectedPrompt === 'all' || m.promptId === selectedPrompt)
                  .map(metric => (
                    <tr key={metric.promptId}>
                      <td>{metric.promptName}</td>
                      <td>{metric.totalTests}</td>
                      <td>
                        <span 
                          className="confidence-badge"
                          style={{ backgroundColor: getConfidenceColor(metric.averageConfidence || 0) }}
                        >
                          {metric.averageConfidence ? `${(metric.averageConfidence * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </td>
                      <td>{formatTime(metric.averageProcessingTime)}</td>
                      <td>
                        <span 
                          className="efficiency-badge"
                          style={{ backgroundColor: getEfficiencyColor(getEfficiencyScore(metric.averageConfidence || 0, metric.averageProcessingTime || 0)) }}
                        >
                          {getEfficiencyScore(metric.averageConfidence || 0, metric.averageProcessingTime || 0).toFixed(1)}
                        </span>
                      </td>
                      <td>{new Date(metric.lastTest).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {getTopPerformers().length > 0 && (
        <div className="top-performers">
          <h3>Top Performing Prompts</h3>
          <div className="performers-list">
            {getTopPerformers().map((performer, index) => (
              <div key={performer.promptId} className="performer-card">
                <div className="rank">#{index + 1}</div>
                <div className="performer-info">
                  <h4>{performer.promptName}</h4>
                  <div className="stats">
                    <span>Efficiency: {performer.efficiencyScore ? performer.efficiencyScore.toFixed(1) : 'N/A'}</span>
                    <span>Tests: {performer.totalTests}</span>
                    <span>Confidence: {performer.averageConfidence ? `${(performer.averageConfidence * 100).toFixed(1)}%` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredResults.length > 0 && (
        <div className="recent-results">
          <h3>Recent Test Results</h3>
          <div className="results-list">
            {filteredResults
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 10)
              .map(result => (
                <div key={result.id} className="result-item">
                  <div className="result-header">
                    <h4>{result.promptName}</h4>
                    <div className="result-meta">
                      <span 
                        className="confidence"
                        style={{ color: getConfidenceColor(result.result.confidence) }}
                      >
                        {result.result.confidence ? `${(result.result.confidence * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                      <span>{formatTime(result.result.processingTime)}</span>
                      <span>{new Date(result.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <p>{result.result.summary}</p>
                  {result.result.chatGPTResponse && (
                    <div className="chatgpt-response">
                      <h5>ChatGPT Full Response</h5>
                      <div className="response-content">
                        <div className="formatted-response">
                          {formatChatGPTResponse(result.result.chatGPTResponse)}
                        </div>
                        <details className="raw-response">
                          <summary>View Raw Response</summary>
                          <pre>{result.result.chatGPTResponse}</pre>
                        </details>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <style>{`
        .results-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .overview-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .card h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          text-transform: uppercase;
        }

        .card .value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .metrics-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .filter-controls {
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-controls select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .metrics-table {
          overflow-x: auto;
        }

        .metrics-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .metrics-table th,
        .metrics-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .metrics-table th {
          background: #f8f9fa;
          font-weight: bold;
        }

        .confidence-badge,
        .efficiency-badge {
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .top-performers {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .performers-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .performer-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
        }

        .rank {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          min-width: 40px;
        }

        .performer-info {
          flex: 1;
        }

        .performer-info h4 {
          margin: 0 0 5px 0;
        }

        .stats {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: #666;
        }

        .recent-results {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .result-item {
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .result-item p {
          margin: 0 0 15px 0;
          line-height: 1.5;
        }

        .chatgpt-response {
          margin-top: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
        }

        .chatgpt-response h5 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .response-content {
          max-height: 500px;
          overflow-y: auto;
        }

        .formatted-response {
          margin-bottom: 15px;
        }

        .response-paragraph {
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .response-paragraph p {
          margin: 0 0 8px 0;
          color: #333;
        }

        .response-paragraph ul {
          margin: 8px 0;
          padding-left: 20px;
        }

        .response-paragraph li {
          margin-bottom: 4px;
          color: #333;
        }

        .response-list {
          margin: 8px 0;
          padding-left: 20px;
        }

        .response-list li {
          margin-bottom: 6px;
          color: #333;
        }

        .raw-response {
          margin-top: 15px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }

        .raw-response summary {
          cursor: pointer;
          font-weight: 500;
          color: #007bff;
          margin-bottom: 10px;
        }

        .raw-response summary:hover {
          color: #0056b3;
        }

        .raw-response pre {
          background: #f1f1f1;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
          overflow-x: auto;
          margin: 0;
        }

        /* Enhanced Analytics Styles */
        .enhanced-analytics {
          margin-bottom: 40px;
        }

        .enhanced-analytics h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 20px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .analytics-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }

        .analytics-card h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .top-performers,
        .efficiency-leaders {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .performer-item,
        .leader-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #007bff;
        }

        .rank {
          font-weight: bold;
          color: #007bff;
          font-size: 14px;
          min-width: 30px;
        }

        .performer-info,
        .leader-info {
          flex: 1;
        }

        .name {
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .metrics {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #666;
        }

        .confidence {
          color: #28a745;
          font-weight: 500;
        }

        .efficiency {
          font-weight: 500;
        }

        .time {
          color: #666;
        }

        .cost-analysis {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .total-cost,
        .total-tokens,
        .avg-cost-per-test {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .label {
          font-size: 13px;
          color: #666;
        }

        .value {
          font-weight: 600;
          color: #333;
        }

        .success-rates {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .success-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .success-item .name {
          font-size: 13px;
          font-weight: 500;
        }

        .success-bar {
          position: relative;
          height: 20px;
          background: #f1f1f1;
          border-radius: 10px;
          overflow: hidden;
        }

        .success-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 10px;
        }

        .success-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 11px;
          font-weight: 600;
          color: #333;
        }

        @media (max-width: 768px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
          
          .metrics {
            flex-direction: column;
            gap: 4px;
          }
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .result-header h4 {
          margin: 0;
        }

        .result-meta {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: #666;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        @media (max-width: 768px) {
          .overview-cards {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          
          .stats {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsDashboard;
