@echo off
echo Starting Personal Assistant Project...

echo 1. Start MongoDB (Ensure you have MongoDB running locally on port 27017)

echo 2. Start ChromaDB (Requires python and chromadb installed: pip install chromadb)
echo Open a new terminal and run: chroma run --path ./chroma-data

echo 3. Start Backend
echo Open a new terminal and run: cd backend && npm run dev

echo 4. Start Frontend
echo Open a new terminal and run: cd frontend && npm run dev

echo.
echo Make sure you have added your GOOGLE_API_KEY to backend/.env!
pause
