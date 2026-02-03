import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import QuestionEditor from './components/QuestionEditor';
import AnswerCollector from './components/AnswerCollector';
import PromptTester from './components/PromptTester';
import ResultsDashboard from './components/ResultsDashboard';
import TestRuns from './components/TestRuns';
import Layout from './components/Layout';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('questions');

  const renderContent = () => {
    switch (activeTab) {
      case 'questions':
        return <QuestionEditor />;
      case 'prompts':
        return <AnswerCollector onPromptCreated={() => setActiveTab('testing')} />;
      case 'testing':
        return <PromptTester onTestCompleted={() => setActiveTab('results')} />;
      case 'results':
        return <ResultsDashboard />;
      case 'test-runs':
        return <TestRuns />;
      default:
        return <QuestionEditor />;
    }
  };

  return (
    <Router>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>
    </Router>
  );
}

export default App;
