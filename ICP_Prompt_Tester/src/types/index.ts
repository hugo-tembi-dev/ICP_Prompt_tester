export interface Question {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect';
  required: boolean;
  hardFilter: boolean;
  options?: string[];
  tags: string[];
  createdAt: string;
}

export interface Prompt {
  id: string;
  name: string;
  questions: Question[];
  answers: { [questionId: string]: string | string[] };
  generatedPrompt: string;
  tags: string[];
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
    tokensUsed?: number;
    costUsd?: number;
  };
  timestamp: string;
  tokensUsed?: number;
  costUsd?: number;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  data: any;
  size: number;
}
