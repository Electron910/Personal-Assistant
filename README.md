# AI Personal Assistant

An advanced, locally-hosted AI Personal Assistant that operates autonomously on your machine. This assistant features a beautiful modern UI, document questioning (RAG) using ChromaDB, system file searching, and the ability to instantly launch applications and URLs directly from your chat.

## Features

- **Autonomous System Agent**: 
  - **Instantly open apps**: "Open Spotify", "Open VS Code"
  - **Launch URLs**: "Open YouTube in Chrome", "Go to https://instagram.com"
  - **Search your entire file system**: "Find my resume", "Where is that python script?"
- **Document Q&A (RAG)**: Upload PDFs, Word documents, or text files and ask the AI deep questions about them.
- **Persistent Memory**: Your chat history and context are saved locally using MongoDB.
- **Beautiful UI**: A highly responsive, modern chat interface built with React and Tailwind CSS.
- **Extremely Fast**: Optimized with native Windows hooks (Explorer / CMD) to execute background tasks with zero latency.

## Tech Stack

### Frontend
- **React.js & Vite** - High-performance UI rendering and bundling
- **Tailwind CSS v4** - Modern, utility-first styling
- **React Router** - Seamless navigation
- **Lucide React** - Beautiful SVG icons
- **React Markdown** - For rendering rich AI responses

### Backend
- **Node.js & Express.js** - Robust REST API server
- **MongoDB & Mongoose** - Database for storing chat sessions and users
- **ChromaDB** - Open-source vector database for fast document retrieval (RAG)
- **LangChain / Google GenAI (Gemini)** - The "brain" behind the AI, powering dynamic tool calling and reasoning
- **pdf-parse / mammoth** - Document ingestion and parsing

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (Running locally on default port 27017)
3. **ChromaDB** (Running locally on default port 8000)
4. **Google Gemini API Key**

## How to Run the Project

### 1. Start the Databases
Ensure your MongoDB is running natively or via Docker.
Ensure ChromaDB is running locally:
```bash
# If you have Python installed, you can start ChromaDB easily:
pip install chromadb
chroma run --path ./chroma-data --port 8000
```

### 2. Configure Environment Variables
Inside the `backend/` folder, ensure you have a `.env` file containing:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/personal_assistant
JWT_SECRET=supersecretjwtkey_for_personal_assistant
JWT_EXPIRES_IN=7d
GOOGLE_API_KEY=your_google_gemini_api_key_here
CHROMA_URL=http://localhost:8000
```

### 3. Install Dependencies
Open two terminals. One for the backend, one for the frontend.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

### 4. Start the Application
You can use the provided batch script `start.bat` in the root folder, or start them manually:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Once running, navigate to `http://localhost:5173` in your browser to start chatting with your AI!

## Security
- The AI's tool execution engine safely sanitizes paths and URLs.
- It prevents shell injection by strictly bypassing CMD parsers and feeding arguments directly to OS sub-processes using Node's `spawn` arrays and native `explorer.exe` hooks.
- It avoids scanning sensitive system folders (like `Windows` or `node_modules`) to prevent freezing your machine.
