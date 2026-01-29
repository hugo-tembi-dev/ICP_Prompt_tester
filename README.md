# ICP Prompt Tester

A web application that allows users to create custom prompts through Q&A pairs and test them against JSON data analysis. This tool enables team members to experiment with different question-answer combinations to build refined prompts and evaluate their efficiency.

## Features

- **Question Editor**: Create, edit, and delete questions with different input types (text, textarea, select, multiselect)
- **Prompt Builder**: Answer questions to generate custom prompts automatically
- **Testing Interface**: Upload JSON files and test prompts against the data
- **Results Dashboard**: View performance metrics, confidence scores, and efficiency comparisons
- **Export Functionality**: Export test results for further analysis

## Tech Stack

### Frontend
- React with TypeScript
- Axios for API calls
- CSS-in-JS styling

### Backend
- Node.js with Express
- Multer for file uploads
- In-memory data storage (easily replaceable with database)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ICP_Prompt_Tester
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Start the development servers:
```bash
npm run dev
```

This will start both the frontend (http://localhost:3000) and backend (http://localhost:5001) servers concurrently.

### Manual Setup

If you prefer to set up manually:

1. Install root dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd server && npm install
```

3. Install frontend dependencies:
```bash
cd client && npm install
```

4. Start the backend server:
```bash
cd server && npm run dev
```

5. Start the frontend server (in a new terminal):
```bash
cd client && npm start
```

## ChatGPT Integration

The application now integrates with OpenAI's ChatGPT API for real prompt testing:

### Setup
1. Copy `.env.example` to `.env` in the server directory
2. Add your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`
3. Optionally change the model: `OPENAI_MODEL=gpt-4` (default: gpt-3.5-turbo)

### How it Works
- Custom prompts are sent to ChatGPT along with the uploaded JSON data
- ChatGPT analyzes the data according to your prompt instructions
- The full response is displayed along with extracted insights and confidence metrics
- Processing time and model information are tracked for performance analysis

### Features
- **Real AI Analysis**: Uses actual ChatGPT responses instead of mock data
- **Response Parsing**: Automatically extracts key insights from ChatGPT responses
- **Confidence Scoring**: Calculates confidence based on response quality and structure
- **Model Selection**: Supports different OpenAI models (GPT-3.5, GPT-4)
- **Full Response Display**: Shows complete ChatGPT response for detailed review

## Usage

### 1. Create Questions
- Navigate to the "Questions" tab
- Click "Add Question" to create new questions
- Choose from different input types: text, textarea, select, or multiselect
- Mark questions as required if needed
- Edit or delete existing questions as needed

### 2. Build Prompts
- Go to the "Build Prompts" tab
- Enter a descriptive name for your prompt
- Answer all the questions you've created
- Preview the generated prompt before saving
- Click "Create Prompt" to save it

### 3. Test Prompts
- Navigate to the "Test Prompts" tab
- Select a prompt from your saved prompts
- Upload a JSON file for testing
- Click "Run Test" to analyze the data with your custom prompt
- View the results including confidence scores and processing time

### 4. View Results
- Check the "Results" tab for comprehensive analytics
- View performance metrics for all prompts
- Compare efficiency scores across different prompts
- Export results for further analysis

## API Endpoints

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create a new question
- `PUT /api/questions/:id` - Update a question
- `DELETE /api/questions/:id` - Delete a question

### Prompts
- `GET /api/prompts` - Get all prompts
- `GET /api/prompts/:id` - Get a specific prompt
- `POST /api/prompts` - Create a new prompt

### Testing
- `POST /api/upload` - Upload a JSON file
- `POST /api/test` - Test a prompt against JSON data
- `GET /api/results` - Get all test results
- `GET /api/results/:promptId` - Get results for a specific prompt

## Data Models

### Question
```typescript
interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  createdAt: string;
}
```

### Prompt
```typescript
interface Prompt {
  id: string;
  name: string;
  questions: Question[];
  answers: { [questionId: string]: string | string[] };
  generatedPrompt: string;
  createdAt: string;
}
```

### Test Result
```typescript
interface TestResult {
  id: string;
  promptId: string;
  promptName: string;
  jsonData: any;
  result: {
    summary: string;
    insights: string[];
    confidence: number;
    processingTime: number;
  };
  timestamp: string;
}
```

## Production Considerations

For production use, consider:

1. **Database Integration**: Replace in-memory storage with a proper database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Add user authentication and authorization
3. **AI Integration**: Connect to actual AI APIs for real prompt testing
4. **File Storage**: Use cloud storage for uploaded files
5. **Error Handling**: Implement comprehensive error handling and logging
6. **Testing**: Add unit and integration tests
7. **Deployment**: Set up proper deployment with CI/CD

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
