# ICP Prompt Tester

A powerful web application for creating, testing, and analyzing AI prompts through Q&A pairs and JSON analysis.

## Features

- **Question Management**: Create and organize custom question libraries
- **Prompt Generation**: Build prompts from Q&A pairs with various input types
- **AI Testing**: Test prompts against OpenAI's GPT models
- **Results Analysis**: Analyze and compare test results
- **User Authentication**: Secure JWT-based authentication system
- **Modern UI**: Clean, responsive design with Tailwind CSS

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Heroicons
- Axios

### Backend
- Node.js
- Express.js
- SQLite Database
- JWT Authentication
- OpenAI API
- Multer for file uploads

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy Frontend**
   ```bash
   cd ICP_Prompt_Tester
   vercel --prod
   ```

4. **Set Environment Variables in Vercel Dashboard**
   - `REACT_APP_API_URL`: Your deployed API URL
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `JWT_SECRET`: Your JWT secret key

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:
- `REACT_APP_API_URL`: API endpoint URL
- `OPENAI_API_KEY`: OpenAI API key for GPT testing
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time (default: 7d)

## Local Development

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Start Development Servers**
   ```bash
   npm run dev
   ```

3. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Project Structure

```
ICP_Prompt_Tester/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── services/           # API services
│   └── types/              # TypeScript types
├── public/                 # Static assets
├── server/                 # Backend server
│   ├── database.js         # Database configuration
│   └── index.js           # Server routes
├── api/                   # Vercel serverless functions
└── vercel.json           # Vercel configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Prompts
- `GET /api/prompts` - Get all prompts
- `POST /api/prompts` - Create prompt
- `POST /api/prompts/:id/test` - Test prompt with AI

### Results
- `GET /api/results` - Get test results
- `POST /api/results` - Save test result

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
