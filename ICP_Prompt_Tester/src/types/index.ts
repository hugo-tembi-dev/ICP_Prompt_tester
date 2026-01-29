export interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  createdAt: string;
}

export interface Prompt {
  id: string;
  name: string;
  questions: Question[];
  answers: { [questionId: string]: string | string[] };
  generatedPrompt: string;
  createdAt: string;
}

export interface TestResult {
  id: string;
  promptId: string;
  promptName: string;
  jsonData: any;
  result: {
    summary: string;
    insights: string[];
    confidence: number;
    processingTime: number;
    chatGPTResponse?: string;
    model?: string;
  };
  timestamp: string;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  data: any;
  size: number;
}
