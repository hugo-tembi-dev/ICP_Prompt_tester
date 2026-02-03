import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import QuestionEditor from './components/QuestionEditor';
import AnswerCollector from './components/AnswerCollector';
import PromptTester from './components/PromptTester';
import ResultsDashboard from './components/ResultsDashboard';
import TestRuns from './components/TestRuns';
import Login from './components/Login';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('questions');
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
