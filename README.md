# Sen AI - Intelligent Resume Processing & Candidate Management System

## 🎯 Overview
Sen AI is a comprehensive recruitment platform that leverages artificial intelligence to streamline resume processing, candidate evaluation, and hiring workflows. Built with modern web technologies, it provides intelligent resume parsing, automated candidate shortlisting, and interactive chat capabilities.

## ✨ Key Features

### 🔍 **Intelligent Resume Processing**
- **AI-Powered Parsing**: Extracts contact info, skills, experience, education automatically
- **Batch Upload**: Process up to 50 resumes simultaneously with progress tracking
- **Smart Validation**: LLM-based content validation to ensure quality resume data
- **Multiple Formats**: Supports PDF, DOCX, and TXT files (up to 10MB each)
- **Duplicate Detection**: Configurable duplicate handling (strict, updates, allow all)

### 🎯 **Smart Candidate Shortlisting**
- **Job Description Matching**: Text input or file upload for job requirements
- **AI-Powered Scoring**: Intelligent candidate ranking with detailed explanations
- **Customizable Criteria**: Set minimum scores and candidate limits
- **Strength/Weakness Analysis**: Detailed candidate evaluation with actionable insights
- **Real-time Results**: Instant shortlisting with visual progress indicators

### 📊 **Advanced Candidate Management**
- **Comprehensive Database**: Searchable candidate repository with detailed profiles
- **Smart Filtering**: Filter by status, experience, skills, location, company, education
- **Status Management**: Track candidates through pending, shortlisted, rejected states
- **Resume Viewer**: Built-in document viewer with fallback options
- **Bulk Operations**: Manage multiple candidates efficiently

### 💬 **Interactive AI Chat Assistant**
- **Context-Aware**: Understands candidate data and recruitment context
- **Session Management**: Persistent chat history with session switching
- **Candidate Insights**: Get AI-powered analysis and recommendations
- **Query Processing**: Natural language queries about candidates and hiring

### 🔐 **Secure Authentication System**
- **Multi-Provider Auth**: Google OAuth integration
- **Session Management**: Secure JWT-based authentication
- **Protected Routes**: Role-based access control
- **User Profiles**: Personalized dashboard and settings

## 🏗️ Architecture

### **Frontend** (Next.js 14 + TypeScript)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS with GitHub theme system
- **UI Library**: Headless UI components with Framer Motion animations
- **State Management**: TanStack Query for server state
- **File Handling**: React Dropzone for drag-and-drop uploads

### **Backend** (Python Flask)
- **API Server**: RESTful API with Flask
- **Database**: SQLite with SQLAlchemy ORM
- **AI Integration**: OpenAI GPT models for processing
- **File Storage**: Local storage with S3 capability
- **Authentication**: JWT token validation

### **Auth Service** (Node.js Express)
- **OAuth Provider**: Google authentication
- **Session Management**: Passport.js integration
- **Database**: Shared SQLite database
- **Security**: CORS and security middleware

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS | User interface and experience |
| **Backend** | Python Flask, SQLAlchemy | API and business logic |
| **Auth** | Node.js, Express, Passport.js | Authentication services |
| **Database** | SQLite | Data persistence |
| **AI/ML** | OpenAI GPT-4, LangChain | Resume processing and analysis |
| **File Processing** | PyPDF2, python-docx | Document parsing |
| **UI Components** | Headless UI, Heroicons | Component library |
| **Animations** | Framer Motion | Smooth transitions |
| **Deployment** | Local development | Easy setup scripts |

## 📁 Project Structure

```
Sen_AI/
├── frontend/           # Next.js application
│   ├── app/           # App router pages
│   ├── components/    # Reusable UI components
│   └── src/lib/       # Utilities and API client
├── backend/           # Python Flask API
│   ├── api.py         # Main API endpoints
│   ├── database.py    # Database models
│   └── services/      # Business logic
├── auth-backend/      # Node.js auth service
│   ├── routes/        # Authentication routes
│   └── config/        # Database and OAuth config
├── setup.bat          # Quick development start
├── setup-enhanced.bat # Advanced setup with dependencies
└── stop-servers.bat   # Stop all services
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ and npm
- Python 3.8+ and pip
- Git

### **1. Clone & Setup**
```bash
git clone <repository-url>
cd Sen_AI
```

### **2. Start Development Environment**
```bash
# Quick start (recommended)
setup.bat

# Or enhanced setup with dependency installation
setup-enhanced.bat
```

### **3. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Auth Service**: http://localhost:8000

### **4. Stop Servers**
```bash
stop-servers.bat
```

## 📋 API Endpoints

### **Authentication**
- `POST /auth/google` - Google OAuth login
- `GET /auth/profile` - Get user profile
- `POST /auth/logout` - Logout user

### **Resume Processing**
- `POST /upload-resume` - Single resume upload
- `POST /upload-resumes-batch` - Batch resume processing
- `POST /validate-resume-content` - AI content validation

### **Candidates**
- `GET /candidates` - Get candidates with filters
- `POST /candidates/{id}/shortlist` - Shortlist candidate
- `PUT /candidates/{id}/status` - Update candidate status
- `GET /candidates/{id}/resume` - View candidate resume

### **Shortlisting**
- `POST /shortlist-by-text` - Shortlist by job description text
- `POST /shortlist-by-file` - Shortlist by job description file

### **Chat**
- `POST /chat` - Send chat message
- `GET /chat/sessions` - Get chat sessions
- `POST /chat/sessions` - Create new session

## 🎨 UI/UX Features

### **Design System**
- **GitHub Theme**: Consistent light/dark mode theming
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant components
- **Animations**: Smooth micro-interactions

### **Components**
- **File Uploader**: Drag-and-drop with validation
- **Candidate Cards**: Rich candidate information display
- **Status Badges**: Visual status indicators
- **Progress Indicators**: Real-time processing feedback
- **Modal Viewers**: In-app document viewing

## 🔧 Configuration

### **Environment Variables**
```bash
# Backend (.env)
OPENAI_API_KEY=your_openai_key
DATABASE_URL=sqlite:///./database.db
JWT_SECRET=your_jwt_secret

# Auth Backend (.env)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
SESSION_SECRET=your_session_secret
```

### **Customization**
- **AI Models**: Configure OpenAI model versions
- **File Limits**: Adjust upload size and quantity limits
- **Scoring Criteria**: Customize shortlisting algorithms
- **UI Themes**: Modify Tailwind configuration

## 📊 Database Schema

### **Core Tables**
- **candidates**: Personal and professional information
- **work_experience**: Employment history
- **education**: Educational background
- **skills**: Technical and soft skills
- **users**: Authentication and profile data
- **chat_sessions**: Conversation history

## 🔒 Security Features

- **Input Validation**: Comprehensive request validation
- **File Security**: Type and size validation
- **Authentication**: Secure OAuth and JWT
- **CORS Protection**: Cross-origin request security
- **SQL Injection Prevention**: Parameterized queries

## 🚀 Deployment

### **Development**
- Use provided batch scripts for local development
- Hot reload enabled for all services
- Debug mode with detailed logging

### **Production Ready**
- Docker containerization support
- Environment-based configuration
- Database migration scripts
- Health check endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### **Common Issues**
- **Port conflicts**: Use `stop-servers.bat` to clear ports
- **Dependencies**: Run `setup-enhanced.bat` for automatic installation
- **API errors**: Check console logs in individual server windows

### **Getting Help**
- Check server logs in individual terminal windows
- Review API documentation in code comments
- Use enhanced setup script for dependency diagnostics

---

**Sen AI** - Revolutionizing recruitment with artificial intelligence. 🚀
