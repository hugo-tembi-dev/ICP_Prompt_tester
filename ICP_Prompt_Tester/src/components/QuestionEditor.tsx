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
  const [formData, setFormData] = useState({
    text: '',
    type: 'text' as Question['type'],
    required: false,
    options: ['']
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await getQuestions();
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
      options: formData.type === 'select' || formData.type === 'multiselect' 
        ? formData.options.filter(opt => opt.trim() !== '')
        : undefined
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
      options: ['']
    });
    setEditingQuestion(null);
    setIsPanelOpen(false);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      text: question.text,
      type: question.type,
      required: question.required,
      options: question.options || ['']
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

  const getQuestionTypeLabel = (type: Question['type']) => {
    switch (type) {
      case 'text': return 'Text';
      case 'select': return 'Single Choice';
      case 'multiselect': return 'Multiple Choice';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Library</h1>
          <p className="text-gray-600 mt-1">Manage questions for building prompts</p>
        </div>
        <button
          onClick={() => setIsPanelOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Question
        </button>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <QuestionMarkCircleIcon className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first question.</p>
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
            {questions.map((question) => (
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

      {/* Right Side Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={resetForm}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as Question['type'],
                      options: ['']
                    }))}
                  >
                    <option value="text">Text</option>
                    <option value="select">Single Choice</option>
                    <option value="multiselect">Multiple Choice</option>
                  </select>
                </div>

                {(formData.type === 'select' || formData.type === 'multiselect') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" />
                        Add Option
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                          {formData.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="p-2 text-gray-400 hover:text-error-600 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionEditor;
