import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Question, Prompt } from '../types';
import { getQuestions, createPrompt } from '../services/api';

interface AnswerCollectorProps {
  onPromptCreated?: (prompt: Prompt) => void;
}

const AnswerCollector: React.FC<AnswerCollectorProps> = ({ onPromptCreated }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});
  const [promptName, setPromptName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [editablePrompt, setEditablePrompt] = useState('');
  const [excludedQuestions, setExcludedQuestions] = useState<Set<string>>(new Set());
  const [promptTags, setPromptTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const toggleQuestionExclusion = (questionId: string) => {
    setExcludedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !promptTags.includes(trimmedTag)) {
      setPromptTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPromptTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const generatePrompt = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      let prompt = `Custom Analysis Prompt\n\nName: ${promptName}\n\nContext:\n`;
      prompt += `All answers define our customers ICP for webshop matching\n`;
      
      questions.forEach((question) => {
        // Skip excluded questions
        if (excludedQuestions.has(question.id)) {
          return;
        }
        
        const answer = answers[question.id];
        if (answer && answer !== '') {
          prompt += `- ${question.text}: ${Array.isArray(answer) ? answer.join(', ') : answer}\n`;
        }
      });

      prompt += `\nInstructions: Analyze JSON data with focus on patterns and recommendations.\n`;
      setGeneratedPrompt(prompt);
      setEditablePrompt(prompt); // Set the editable version
      setIsGenerating(false);
    }, 1500);
  };

  const createPromptAndSave = async () => {
    try {
      const prompt: Prompt = {
        id: Date.now().toString(),
        name: promptName,
        questions: questions.filter(q => !excludedQuestions.has(q.id)),
        answers: answers,
        generatedPrompt: editablePrompt,
        tags: promptTags,
        createdAt: new Date().toISOString()
      };

      const savedPrompt = await createPrompt(prompt);
      onPromptCreated?.(savedPrompt);
    } catch (error) {
      console.error('Failed to create prompt:', error);
    }
  };

  // Get all unique tags from questions
  const getAllTags = () => {
    const allTags = new Set<string>();
    questions.forEach(question => {
      if (question.tags && Array.isArray(question.tags)) {
        question.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  };

  // Filter questions based on selected tag and badge
  const filteredQuestions = questions.filter(question => {
    // Tag filter
    if (selectedTag !== 'all') {
      const hasTag = question.tags && question.tags.includes(selectedTag);
      if (!hasTag) return false;
    }

    // Badge filter
    if (selectedBadge !== 'all') {
      if (selectedBadge === 'required' && !question.required) return false;
      if (selectedBadge === 'hardFilter' && !question.hardFilter) return false;
    }

    return true;
  });

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Build Your Prompt</h1>
        <p className="text-gray-600 mt-2">Answer questions to generate a custom AI prompt</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step}
            </div>
            {step < 4 && <div className="w-8 h-1 mx-2 bg-gray-200" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentStep} className="card p-8">
          {/* Step 1: Questions */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Questions</h2>
              <p className="text-sm text-gray-600 mb-4">Select which questions to include in your prompt generation. Toggle questions on/off to customize your prompt.</p>
              
              {/* Filters */}
              <div className="mb-6 space-y-3">
                {/* Tag Filter */}
                {getAllTags().length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tag:</label>
                    <select 
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Tags ({questions.length})</option>
                      {getAllTags().map(tag => (
                        <option key={tag} value={tag}>
                          {tag} ({questions.filter(q => q.tags.includes(tag)).length})
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Badges ({questions.length})</option>
                    <option value="required">Required Only ({questions.filter(q => q.required).length})</option>
                    <option value="hardFilter">Hard Filter Only ({questions.filter(q => q.hardFilter).length})</option>
                  </select>
                </div>
              </div>
              
              {filteredQuestions.map((question) => (
                <div key={question.id} className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${
                  excludedQuestions.has(question.id) 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : 'bg-primary-50 border-primary-200'
                }`}>
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded ${
                      excludedQuestions.has(question.id) 
                        ? 'bg-gray-200 text-gray-400' 
                        : 'bg-primary-100 text-primary-600'
                    }`}>
                      {question.type === 'text' ? <DocumentTextIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${excludedQuestions.has(question.id) ? 'text-gray-500' : 'text-gray-900'}`}>
                        {question.text}
                      </p>
                      <p className="text-sm text-gray-500">{question.type} {question.required && '(required)'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleQuestionExclusion(question.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      excludedQuestions.has(question.id)
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {excludedQuestions.has(question.id) ? 'Excluded' : 'Included'}
                  </button>
                </div>
              ))}
              {excludedQuestions.size > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    {excludedQuestions.size} question{excludedQuestions.size > 1 ? 's' : ''} excluded from prompt generation
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Name */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Name Your Prompt</h2>
              <input
                type="text"
                className="input"
                placeholder="Enter prompt name..."
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
              />
              
              <div className="space-y-2">
                <label className="label">Tags (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Add a tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn btn-secondary"
                  >
                    Add Tag
                  </button>
                </div>
                
                {promptTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {promptTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  💡 Tags help you organize and filter prompts later (e.g., "marketing", "analysis", "customer-segmentation")
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Answers */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Answer Questions</h2>
              {excludedQuestions.size > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Answering {questions.length - excludedQuestions.size} of {questions.length} questions ({excludedQuestions.size} excluded)
                  </p>
                </div>
              )}
              {questions.filter(question => !excludedQuestions.has(question.id)).map((question) => (
                <div key={question.id} className="space-y-2">
                  <label className="label">
                    {question.text} {question.required && <span className="text-error-600">*</span>}
                  </label>
                  {question.type === 'text' ? (
                    <textarea
                      className="textarea"
                      rows={2}
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Your answer..."
                      required={question.required}
                    />
                  ) : question.type === 'select' ? (
                    <select
                      className="select"
                      value={answers[question.id] || ''}
                      onChange={(e) => {
                        console.log('Select changed:', { questionId: question.id, value: e.target.value, question });
                        handleAnswerChange(question.id, e.target.value);
                      }}
                      required={question.required}
                    >
                      <option value="">Select an option</option>
                      {question.options?.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      {question.options?.map((option, index) => (
                        <label key={index} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option)}
                            onChange={(e) => {
                              const current = Array.isArray(answers[question.id]) ? answers[question.id] : [];
                              if (e.target.checked) {
                                handleAnswerChange(question.id, [...(current as string[]), option]);
                              } else {
                                handleAnswerChange(question.id, (current as string[]).filter((item: string) => item !== option));
                              }
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Generate */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Generate Your Prompt</h2>
              
              <button
                onClick={generatePrompt}
                disabled={isGenerating}
                className="btn btn-primary w-full"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate Prompt
                  </div>
                )}
              </button>

              {generatedPrompt && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Generated Prompt (Editable):</h3>
                      <button
                        onClick={() => setEditablePrompt(generatedPrompt)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Reset to Original
                      </button>
                    </div>
                    <textarea
                      className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                      value={editablePrompt}
                      onChange={(e) => setEditablePrompt(e.target.value)}
                      placeholder="Your generated prompt will appear here..."
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      💡 Tip: You can edit the prompt above to customize it before creating. Changes will be saved when you click "Create Prompt".
                    </div>
                  </div>
                  
                  <button
                    onClick={createPromptAndSave}
                    className="btn btn-success w-full"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Create Prompt
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="btn btn-secondary"
        >
          Previous
        </button>
        
        {currentStep < 4 && (
          <button
            onClick={nextStep}
            className="btn btn-primary"
          >
            Next
            <ArrowRightIcon className="h-3 w-3 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AnswerCollector;
