import './App.css';
import { useState } from 'react';
import { getMockSearchResults, getMockQAResponse, MOCK_FILE_CONTENT } from './mockData';

function App() {
  // Demo Mode - use mock data instead of real backend
  const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';
  
  // Backend URL - use environment variable in production, localhost in development
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
  
  // Debug: Log current mode (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('=== App Mode Debug ===');
    console.log('DEMO_MODE:', DEMO_MODE);
    console.log('REACT_APP_DEMO_MODE:', process.env.REACT_APP_DEMO_MODE);
    console.log('BACKEND_URL:', BACKEND_URL);
    console.log('Mode:', DEMO_MODE ? 'DEMO (using mock data)' : 'FULL (using real backend)');
    console.log('====================');
  }
  
  // We will add JavaScript here step by step
  // Upload-related state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Search-related state
  const [searchQuery, setSearchQuery] = useState('');         // Store user's search input
  const [searchResults, setSearchResults] = useState([]);     // Store search results array
  const [searchStatus, setSearchStatus] = useState('');       // Track search status: '' | 'loading' | 'error'

  // Q&A-related state
  const [question, setQuestion] = useState('');               // User's question input
  const [messages, setMessages] = useState([]);               // Chat history (questions & answers)
  const [qaStatus, setQaStatus] = useState('');               // Q&A status: '' | 'loading' | 'error'


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    console.log('Selected file:', file);
  };

  // Handle drag over event
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Handle drag enter event
  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  // Handle drag leave event
  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  // Handle drop event
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    // Get the dropped files
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      console.log('Dropped file:', file);
    }
  };

  const handleUpload = async () => {
    // Check if file is selected
    if (!selectedFile) {
      alert('Please select a file first!');
      return;
    }
  
    // Set status to uploading
    setUploadStatus('uploading');

    // Demo mode: simulate upload
    if (DEMO_MODE) {
      setTimeout(() => {
        setUploadStatus('success');
        console.log('Demo upload successful!');
      }, 1000);
      return;
    }
  
  try {
    // Create FormData and append file and userId
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('userId', 'test-user');  // Using test user for now

    // Call backend API directly (bypass dev proxy issues)
    const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData
    });
  
      if (response.ok) {
        setUploadStatus('success');
        console.log('Upload successful!');
      } else {
        setUploadStatus('error');
        console.error('Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload error:', error);
    }
  };

  // Handle search request
  const handleSearch = async () => {
    // Validate input
    const query = searchQuery.trim();
    if (!query) {
      alert('Please enter a search query');
      return;
    }

    // Set loading status
    setSearchStatus('loading');

    // Demo mode: use mock data
    if (DEMO_MODE) {
      setTimeout(() => {
        const mockResults = getMockSearchResults(query);
        setSearchResults(mockResults);
        setSearchStatus('');
        console.log('Demo search results:', mockResults);
      }, 800);
      return;
    }

    try {
      // Call backend search API
      const response = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 5 })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || data);
        setSearchStatus('');
        console.log('Search results:', data);
      } else {
        setSearchStatus('error');
        console.error('Search failed');
      }
    } catch (error) {
      setSearchStatus('error');
      console.error('Search error:', error);
    }
  };

  // Handle file download
  const handleDownload = async (documentId, fileName) => {
    // Demo mode: simulate download
    if (DEMO_MODE) {
      const mockContent = MOCK_FILE_CONTENT[documentId] || MOCK_FILE_CONTENT['demo-1'];
      const blob = new Blob([mockContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'demo-document.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Demo download successful!');
      return;
    }

    try {
      console.log('Downloading:', documentId, fileName);
      
      // Call backend download API
      const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}/download`);
      
      console.log('Download response status:', response.status);
      console.log('Download response ok:', response.ok);
      
      if (response.ok) {
        // Get file as blob
        const blob = await response.blob();
        console.log('Blob size:', blob.size, 'bytes');
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Download successful!');
      } else {
        const errorText = await response.text();
        console.error('Download failed. Status:', response.status, 'Error:', errorText);
        alert(`Failed to download file: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download error: ' + error.message);
    }
  };

  // Convert similarity score to readable text
  const getSimilarityLabel = (similarity) => {
    if (similarity >= 0.8) return 'Very High';
    if (similarity >= 0.65) return 'High';
    if (similarity >= 0.5) return 'Medium';
    if (similarity >= 0.3) return 'Low';
    return 'Very Low';
  };
  // Handle Q&A request
  const handleAskQuestion = async () => {
    // Validate input
    const q = question.trim();
    if (!q) {
      alert('Please enter a question');
      return;
    }

    // Add user message to chat
    const userMessage = { type: 'user', text: q };
    setMessages([...messages, userMessage]);
    
    // Clear input and set loading status
    setQuestion('');
    setQaStatus('loading');

    // Demo mode: use mock data
    if (DEMO_MODE) {
      setTimeout(() => {
        try {
          const mockResponse = getMockQAResponse(q);
          const aiMessage = { 
            type: 'ai', 
            text: mockResponse.answer || 'I apologize, but I could not generate a response for that question.',
            sources: mockResponse.sources || []
          };
          // Use functional update to ensure we have the latest messages state
          setMessages(prevMessages => [...prevMessages, aiMessage]);
          setQaStatus('');
          console.log('Demo Q&A response:', mockResponse);
        } catch (error) {
          console.error('Error in demo Q&A:', error);
          setQaStatus('error');
          setMessages(prevMessages => [...prevMessages, {
            type: 'ai',
            text: 'Sorry, an error occurred while processing your question.',
            sources: []
          }]);
        }
      }, 1200);
      return;
    }

    try {
      // Call backend Q&A API
      const response = await fetch(`${BACKEND_URL}/api/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, maxSources: 5 })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to chat
        const aiMessage = { 
          type: 'ai', 
          text: data.answer, 
          sources: data.sources 
        };
        // Use functional update to ensure we have the latest messages state
        setMessages(prevMessages => [...prevMessages, aiMessage]);
        setQaStatus('');
        console.log('AI answer:', data);
      } else {
        setQaStatus('error');
        console.error('Q&A failed');
      }
    } catch (error) {
      setQaStatus('error');
      console.error('Q&A error:', error);
    }
  };
  return (
    <div className="App">

      {/* Header Section */}
      <header className="app-header">
        <h1>AI Knowledge Base Search Assistant</h1>
        <p>Intelligent Document Search & Q&A System</p>
        
        {DEMO_MODE && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            marginTop: '1rem',
            maxWidth: '800px',
            margin: '1rem auto 0',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            textAlign: 'left',
            lineHeight: '1.6'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              📌 Demo Preview Mode
            </div>
            <div style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              This is a UI demo with sample data for portfolio preview.
            </div>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              <strong>Full AI Implementation:</strong> The complete system integrates OpenAI embeddings, 
              AWS serverless architecture (S3, Lambda, DynamoDB, SNS), and GPT-4 RAG for real semantic 
              search and Q&A.
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              <strong>View Source Code:</strong>{' '}
              <a 
                href="https://github.com/HENGRui6/AI-Knowledge-Base-Internal-Search-Assistant" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#FFD700', 
                  textDecoration: 'underline',
                  fontWeight: 'bold'
                }}
              >
                GitHub Repository →
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="main-content">
      {/* 1. Document Upload Section */}
      <section className="card">
        <h2>Document Management</h2>
        <div className="upload-area">
          
          {/* Drag and Drop Zone */}
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" id="file-input" onChange={handleFileChange} />
            <label htmlFor="file-input" className="drop-zone-content">
              <div className="upload-icon" aria-hidden="true"></div>
              <p>
                Click to upload or drag and drop
              </p>
              <p style={{ fontSize: '0.9rem', color: '#999' }}>
                PDF, TXT (MAX. 10MB)
              </p>
            </label>
          </div>

          {/* Button Container - keeps buttons aligned */}
          <div className="button-container">
            <button onClick={handleUpload}>Upload</button>
          </div>
        </div>
        {selectedFile ? (
          <div className="selected-file">
            <span className="selected-file-name">{selectedFile.name}</span>
            <span className="file-size">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </span>
          </div>
        ) : (
          <p className="status-text">Ready to upload documents</p>
        )}

        {uploadStatus === 'uploading' && (
          <p className="status-text loading">Uploading...</p>
        )}
        {uploadStatus === 'success' && (
          <p className="status-text success">Upload successful!</p>
        )}
        {uploadStatus === 'error' && (
          <p className="status-text error">Upload failed. Please try again.</p>
        )}
      </section>

        {/* 2. Search Section */}
        <section className="card">
          <h2>Search Documents</h2>
          <div className="search-area">
            <input 
              type="text" 
              placeholder="Search for documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          <div className="results">
            {searchStatus === 'loading' && (
              <p className="loading-indicator">Searching...</p>
            )}
            
            {searchStatus === 'error' && (
              <p className="status-text error">Search failed. Please try again.</p>
            )}
            
            {searchResults && searchResults.length > 0 ? (
              <ul className="results-list">
                {searchResults.map((item, idx) => (
                  <li key={idx}>
                    <div className="result-header">
                      <h3>
                        {item.file_name || 'Unknown file'}
                      </h3>
                      <button 
                        onClick={() => handleDownload(item.document_id, item.file_name)}
                        className="download-btn-inline"
                      >
                        Download
                      </button>
                    </div>
                    <p>
                      {(item.text || '').slice(0, 120)}
                      {(item.text || '').length > 120 ? '...' : ''}
                    </p>
                    <div className="similarity">
                    Similarity: {item.similarity ? `${getSimilarityLabel(item.similarity)} (${item.similarity.toFixed(3)})` : 'N/A'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              searchStatus === '' && (
                <div className="results-placeholder">
                  <p>Search results will appear here</p>
                  {DEMO_MODE && (
                    <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Try searching for "machine learning", "cloud computing", or "data science"
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </section>

        {/* 3. Q&A Section */}
        <section className="card">
          <h2>Ask AI</h2>
          <div className="chat-area">
            <div className="messages-container">
              {qaStatus === 'loading' && (
                <p className="loading-indicator">AI is thinking...</p>
              )}
              
              {messages && messages.length > 0 ? (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.type}`}>
                    <div>{msg.text}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="message-sources">
                        <strong>Sources:</strong>
                        {msg.sources.map((source, sIdx) => (
                          <div key={sIdx} className="source-item">
                            • {source.file_name} - {getSimilarityLabel(source.similarity)} ({source.similarity.toFixed(3)})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="messages-placeholder">
                  <p>Ask a question about your documents</p>
                  {DEMO_MODE && (
                    <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Try to ask "What is machine learning?", "Tell me about cloud computing", or "What are data science best practices?"
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="input-area">
            <input 
              type="text" 
              placeholder="Type your question..." 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
              <button onClick={handleAskQuestion}>Send</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default App;

