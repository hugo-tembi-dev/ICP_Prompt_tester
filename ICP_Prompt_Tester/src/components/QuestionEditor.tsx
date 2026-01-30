import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Question } from '../types';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../services/api';

const QuestionEditor: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    text: '',
    type: 'text' as Question['type'],
    required: false,
    hardFilter: false,
    options: [''],
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await getQuestions();
      console.log('Loaded questions:', data);
      console.log('First question tags:', data[0]?.tags);
      console.log('First question hardFilter:', data[0]?.hardFilter);
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const questionData = {
      text: formData.text,
      type: formData.type,
      required: formData.required,
      hardFilter: formData.hardFilter,
      options: formData.type === 'select' || formData.type === 'multiselect' 
        ? formData.options.filter(opt => opt.trim() !== '')
        : undefined,
      tags: formData.tags
    };

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionData);
      } else {
        await createQuestion(questionData);
      }
      
      resetForm();
      await loadQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      text: '',
      type: 'text',
      required: false,
      hardFilter: false,
      options: [''],
      tags: []
    });
    setTagInput('');
    setEditingQuestion(null);
    setIsPanelOpen(false);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      text: question.text,
      type: question.type,
      required: question.required,
      hardFilter: question.hardFilter || false,
      options: question.options || [''],
      tags: question.tags || []
    });
    setIsPanelOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(id);
        await loadQuestions();
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const getAllTags = () => {
    const allTags = new Set<string>();
    questions.forEach(question => {
      question.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  const filteredQuestions = questions.filter(question => {
    const tagMatch = selectedTag === 'all' || question.tags.includes(selectedTag);
    const typeMatch = selectedType === 'all' || question.type === selectedType;
    const searchMatch = searchQuery === '' || 
      question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return tagMatch && typeMatch && searchMatch;
  });

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const getQuestionIcon = (type: Question['type']) => {
    switch (type) {
      case 'text':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'select':
      case 'multiselect':
        return <ChevronDownIcon className="h-4 w-4" />;
      default:
        return <QuestionMarkCircleIcon className="h-4 w-4" />;
    }
  };

  const getQuestionTypeLabel = (type: Question['type'] | 'all') => {
    switch (type) {
      case 'text': return 'Text';
      case 'select': return 'Single Choice';
      case 'multiselect': return 'Multiple Choice';
      case 'all': return 'All Types';
      default: return type;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className={`transition-all duration-300 overflow-y-auto ${isPanelOpen ? 'w-[calc(100%-320px)]' : 'flex-1'}`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Question Library</h1>
              <p className="text-gray-600 mt-1">Create and manage your question bank with smart filtering</p>
            </div>
            <button
              onClick={() => setIsPanelOpen(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Question
            </button>
          </div>

          {/* Enhanced Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">🔍 Filter Questions</h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">Search Questions:</label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search by question text or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tag Filter */}
              <div>
                <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Tag:</label>
                <select 
                  id="tag-filter"
                  value={selectedTag} 
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="select"
                >
                  <option value="all">All Tags</option>
                  {getAllTags().map(tag => (
                    <option key={tag} value={tag}>
                      {tag} ({questions.filter(q => q.tags.includes(tag)).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Type:</label>
                <select 
                  id="type-filter"
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="select"
                >
                  <option value="all">All Types</option>
                  <option value="text">
                    Text ({questions.filter(q => q.type === 'text').length})
                  </option>
                  <option value="select">
                    Single Choice ({questions.filter(q => q.type === 'select').length})
                  </option>
                  <option value="multiselect">
                    Multiple Choice ({questions.filter(q => q.type === 'multiselect').length})
                  </option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedTag !== 'all' || selectedType !== 'all' || searchQuery !== '') && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {searchQuery !== '' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      🔍 Search: "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedTag !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      🏷️ Tag: {selectedTag}
                      <button
                        onClick={() => setSelectedTag('all')}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedType !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                      📝 Type: {getQuestionTypeLabel(selectedType as Question['type'] | 'all')}
                      <button
                        onClick={() => setSelectedType('all')}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedTag('all');
                    setSelectedType('all');
                    setSearchQuery('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Results Count */}
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
          </div>

          {/* Questions List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <QuestionMarkCircleIcon className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {selectedTag === 'all' && selectedType === 'all' && searchQuery === ''
                  ? 'No questions' 
                  : `No questions match your filters`
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedTag === 'all' && selectedType === 'all' && searchQuery === ''
                  ? 'Get started by creating your first question.' 
                  : `Try adjusting your filters or create new questions. Active filters: ${
                    [searchQuery !== '' && `Search: "${searchQuery}"`,
                     selectedTag !== 'all' && `Tag: ${selectedTag}`, 
                     selectedType !== 'all' && `Type: ${getQuestionTypeLabel(selectedType as Question['type'] | 'all')}`]
                    .filter(Boolean).join(', ')
                  }`
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsPanelOpen(true)}
                  className="btn btn-primary"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredQuestions.map((question) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="card p-6 hover:shadow-medium transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                          {getQuestionIcon(question.type)}
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getQuestionTypeLabel(question.type)}
                          </span>
                          {question.required && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
                              Required
                            </span>
                          )}
                          {question.hardFilter && (
                            <span 
                              className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                              style={{ 
                                backgroundColor: '#dcfce7', 
                                color: '#166534',
                                borderColor: '#86efac'
                              }}
                            >
                              Hard Filter
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(question)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="p-1 text-gray-400 hover:text-error-600 transition-colors"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{question.text}</h3>
                    
                    {question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {question.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                          >
                            🏷️ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {question.options && question.options.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                        <div className="space-y-1">
                          {question.options.map((option, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <CheckCircleIcon className="h-3 w-3 mr-2 text-gray-400" />
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Right Side Panel - CSS Transition */}
      <>
        {/* Backdrop - No Click Handler */}
        {isPanelOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}
        
        {/* Desktop Column - CSS Transition */}
        <div
          className="bg-white border-l border-gray-200 overflow-y-auto h-full shadow-lg transition-all duration-500 ease-in-out relative z-50"
          style={{ width: isPanelOpen ? '320px' : '0px' }}
        >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('X button clicked');
                      closePanel();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded-lg cursor-pointer"
                    type="button"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <textarea
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={5}
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter your question here..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Question['type'] }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="text">Text</option>
                    <option value="select">Single Choice</option>
                    <option value="multiselect">Multiple Choice</option>
                  </select>
                </div>

                {(formData.type === 'select' || formData.type === 'multiselect') && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-700">
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex gap-1">
                          <input
                            type="text"
                            className="flex-1 px-1 py-0.5 text-xs border border-gray-300 rounded shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            placeholder={`Opt ${index + 1}`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                          />
                          {formData.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="p-0.5 text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Add a tag and press Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                    />
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                          >
                            🏷️ {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <XMarkIcon className="h-2 w-2" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="required"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={formData.required}
                      onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                    />
                    <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                      Required
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hardFilter"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={formData.hardFilter}
                      onChange={(e) => setFormData(prev => ({ ...prev, hardFilter: e.target.checked }))}
                    />
                    <label htmlFor="hardFilter" className="ml-2 block text-sm text-gray-900">
                      Hard Filter
                    </label>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingQuestion ? 'Update' : 'Create'} Question
                  </button>
                </div>
              </form>
            </div>
            
            {/* Mobile Overlay Panel - Completely Hidden */}
            <div
              className="hidden fixed right-0 top-0 h-full w-full bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter your question here..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Question['type'] }))}
                    className="select"
                  >
                    <option value="text">Text</option>
                    <option value="select">Single Choice</option>
                    <option value="multiselect">Multiple Choice</option>
                  </select>
                </div>

                {(formData.type === 'select' || formData.type === 'multiselect') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                          />
                          {formData.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add a tag and press Enter..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleTagInputKeyPress}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Add Tag
                      </button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            🏷️ {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      💡 Tags help you organize and filter questions (e.g., "demographics", "behavior", "technical")
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.required}
                    onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                  />
                  <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                    Required question
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors"
                  >
                    {editingQuestion ? 'Update' : 'Create'} Question
                  </button>
                </div>
              </form>
            </div>
        </>
    </div>
  );
};

export default QuestionEditor;
