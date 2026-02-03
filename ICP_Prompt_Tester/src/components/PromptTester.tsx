import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BeakerIcon,
  DocumentArrowUpIcon,
  PlayIcon,
  TrashIcon,
  CheckCircleIcon,
  SparklesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Prompt, TestResult, UploadedFile } from '../types';
import { getPrompts, uploadJsonFile, testPrompt, deletePrompt } from '../services/api';

interface PromptTesterProps {
  onTestCompleted?: () => void;
}

const PromptTester: React.FC<PromptTesterProps> = ({ onTestCompleted }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');

  useEffect(() => {
    console.log('PromptTester component mounted/updated');
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const data = await getPrompts();
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const isJson = file.type === 'application/json' || file.name.endsWith('.json');
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
    
    if (!isJson && !isText) {
      alert('Please upload a JSON or TXT file');
      return;
    }

    try {
      const result = await uploadJsonFile(file);
      setUploadedFile(result);
      setTestResult(null);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    }
  };

  const handleTest = async () => {
    if (!selectedPrompt || !uploadedFile) return;

    setIsTesting(true);
    try {
      const result = await testPrompt(selectedPrompt.id, uploadedFile.data);
      setTestResult(result);
      onTestCompleted?.();
    } catch (error) {
      console.error('Failed to test prompt:', error);
      alert('Failed to test prompt');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await deletePrompt(id);
        await loadPrompts();
        if (selectedPrompt?.id === id) {
          setSelectedPrompt(null);
        }
      } catch (error) {
        console.error('Failed to delete prompt:', error);
        alert('Failed to delete prompt');
      }
    }
  };

  // Get all unique tags from all questions in all prompts
  const getAllTags = () => {
    const allTags = new Set<string>();
    prompts.forEach(prompt => {
      prompt.questions.forEach(question => {
        if (question.tags && Array.isArray(question.tags)) {
          question.tags.forEach(tag => allTags.add(tag));
        }
      });
    });
    return Array.from(allTags).sort();
  };

  // Filter prompts based on selected tag and badge
  const filteredPrompts = prompts.filter(prompt => {
    // Tag filter
    if (selectedTag !== 'all') {
      const hasTag = prompt.tags && prompt.tags.includes(selectedTag);
      if (!hasTag) return false;
    }

    // Badge filter
    if (selectedBadge !== 'all') {
      const hasBadge = prompt.questions.some(question => {
        if (selectedBadge === 'required') return question.required;
        if (selectedBadge === 'hardFilter') return question.hardFilter;
        return false;
      });
      if (!hasBadge) return false;
    }

    return true;
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600';
    if (confidence >= 0.6) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Test Your Prompts</h1>
        <p className="text-gray-600 mt-2">Run AI tests with your prompts and data</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Prompt Selection */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2 text-primary-600" />
              Select Prompt
            </h2>
            
            {/* TEST ELEMENT */}
            <div className="bg-red-500 text-white p-4 mb-4">
              TEST: This should be visible!
            </div>
            
            {/* Filters */}
            <div className="mb-4 space-y-3 border-2 border-red-500 p-4">
              {/* Debug Info */}
              <div className="text-xs text-gray-500 bg-yellow-100 p-2">
                Debug: Prompts count = {prompts.length}, Tags count = {getAllTags().length}
              </div>
              
              {/* Test Element */}
              <div className="bg-blue-100 p-2 text-blue-800">
                TEST: Filters section is rendering!
              </div>
              
              {/* Tag Filter */}
              {getAllTags().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tag:</label>
                  <select 
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="select"
                  >
                    <option value="all">All Tags ({prompts.length})</option>
                    {getAllTags().map(tag => (
                      <option key={tag} value={tag}>
                        {tag} ({prompts.filter(p => p.tags.includes(tag)).length})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Badge Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Badge:</label>
                <select 
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="select"
                >
                  <option value="all">All Badges ({prompts.length})</option>
                  <option value="required">Required Only ({prompts.filter(p => p.questions.some(q => q.required)).length})</option>
                  <option value="hardFilter">Hard Filter Only ({prompts.filter(p => p.questions.some(q => q.hardFilter)).length})</option>
                </select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="text-center py-8">
                <BeakerIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-gray-500 mt-2">
                  {selectedTag === 'all' ? 'No prompts available' : `No prompts with tag "${selectedTag}"`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPrompts.map((prompt) => (
                  <motion.div
                    key={prompt.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPrompt?.id === prompt.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{prompt.name}</h3>
                        <p className="text-sm text-gray-500">
                          {prompt.questions.length} questions
                        </p>
                        {prompt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {prompt.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(prompt.id);
                        }}
                        className="p-1 text-gray-400 hover:text-error-600 transition-colors"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Prompt Details */}
          {selectedPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h3 className="font-semibold mb-3 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-2 text-primary-600" />
                Prompt Preview
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <strong>Prompt Name:</strong> {selectedPrompt.name}
                </div>
                <div className="mb-2">
                  <strong>Generated Prompt:</strong>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedPrompt.generatedPrompt || 'No prompt content available'}
                </pre>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column - File Upload & Testing */}
        <div className="space-y-6">
          {/* File Upload */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-primary-600" />
              Upload Test Data
            </h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <DocumentArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your JSON or TXT file here, or click to browse
              </p>
              <input
                type="file"
                accept=".json,.txt,application/json,text/plain"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
              >
                Select File
              </label>
            </div>

            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-success-50 border border-success-200 rounded-lg"
              >
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-success-600 mr-2" />
                  <span className="text-sm font-medium text-success-800">
                    {uploadedFile.originalName} uploaded successfully
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={!selectedPrompt || !uploadedFile || isTesting}
            className="btn btn-primary w-full"
          >
            {isTesting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing...
              </div>
            ) : (
              <div className="flex items-center">
                <PlayIcon className="h-4 w-4 mr-2" />
                Run Test
              </div>
            )}
          </button>

          {/* Test Results */}
          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card p-6"
              >
                <h3 className="font-semibold mb-4 flex items-center">
                  <SparklesIcon className="h-4 w-4 mr-2 text-primary-600" />
                  Test Results
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Confidence</p>
                      <p className={`text-2xl font-bold ${getConfidenceColor(testResult.result.confidence)}`}>
                        {(testResult.result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Processing Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {testResult.result.processingTime}ms
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-gray-700">{testResult.result.summary}</p>
                  </div>

                  {testResult.result.insights && testResult.result.insights.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Key Insights</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {testResult.result.insights.map((insight, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircleIcon className="h-3 w-3 text-success-500 mr-2 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PromptTester;
