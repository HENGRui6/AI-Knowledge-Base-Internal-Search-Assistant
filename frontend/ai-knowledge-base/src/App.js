import './App.css';
import { useState, useEffect } from 'react';
import { getMockSearchResults, getMockQAResponse, MOCK_FILE_CONTENT } from './mockData';

function groupSearchResultsByFile(results) {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return [];
  }
  
  const grouped = {};
  for (const chunk of results) {
    if (!chunk || !chunk.file_name) {
      continue;
    }
    
    const fileName = chunk.file_name;
    if (!grouped[fileName]) {
      grouped[fileName] = {
        file_name: fileName,
        document_id: chunk.document_id,
        chunks: [],
        highest_similarity: 0
      };
    }
    grouped[fileName].chunks.push({
      chunk_id: chunk.chunk_id,
      text: chunk.text,
      similarity: chunk.similarity || 0
    });

    if ((chunk.similarity || 0) > grouped[fileName].highest_similarity) {
      grouped[fileName].highest_similarity = chunk.similarity || 0;
    }
  }
  return Object.values(grouped).sort((a, b) => 
    b.highest_similarity - a.highest_similarity
  );
}

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

  // Admin-related state
  const [allDocuments, setAllDocuments] = useState([]);       // All documents in the system
  const [adminStatus, setAdminStatus] = useState('');         // Admin status: '' | 'loading' | 'error'

  // Authentication-related state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);       // {username, role}
  const [authToken, setAuthToken] = useState(null);
  const [showLogin, setShowLogin] = useState(true);           // Show login page or main app
  const [loginMode, setLoginMode] = useState('login');        // 'login' or 'register'
  const [authError, setAuthError] = useState('');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Check for existing token on mount
  useEffect(() => {
    if (DEMO_MODE) {
      // In demo mode, auto-login as admin
      setIsAuthenticated(true);
      setCurrentUser({ username: 'demo-admin', role: 'ADMIN' });
      setShowLogin(false);
      return;
    }
    
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token
      fetch(`${BACKEND_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid === 'true' || data.username) {
          setAuthToken(token);
          setCurrentUser({ username: data.username, role: data.role });
          setIsAuthenticated(true);
          setShowLogin(false);
        } else {
          localStorage.removeItem('authToken');
        }
      })
      .catch(() => {
        localStorage.removeItem('authToken');
      });
    }
  }, [BACKEND_URL, DEMO_MODE]);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!loginUsername || !loginPassword) {
      setAuthError('Please enter username and password');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setAuthToken(data.token);
        setCurrentUser({ username: data.username, role: data.role });
        setIsAuthenticated(true);
        setShowLogin(false);
        setLoginUsername('');
        setLoginPassword('');
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (error) {
      setAuthError('Network error: ' + error.message);
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!loginUsername || !loginPassword) {
      setAuthError('Please enter username and password');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          role: 'USER'  // Default role for new registrations
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        setLoginMode('login');
        setLoginPassword('');
      } else {
        setAuthError(data.error || 'Registration failed');
      }
    } catch (error) {
      setAuthError('Network error: ' + error.message);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowLogin(true);
    setLoginUsername('');
    setLoginPassword('');
    setSearchResults([]);
    setMessages([]);
    setAllDocuments([]);
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

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
    formData.append('userId', currentUser?.username || 'anonymous');

    // Call backend API with auth header
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
      method: 'POST',
      headers: headers,
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
        const rawResults = data.results || data;
        const groupedResults = groupSearchResultsByFile(rawResults);
        setSearchResults(groupedResults);
        setSearchStatus('');
        console.log('Grouped search results:', groupedResults);
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

  // Fetch all documents on component mount (Admin section)
  useEffect(() => {
    // Skip in demo mode
    if (DEMO_MODE) {
      // Set mock documents for demo
      setAllDocuments([
        {
          id: 'demo-1',
          fileName: 'AI_Machine_Learning_Guide.pdf',
          fileSize: 2457600,
          uploadDate: '2024-01-15T10:30:00Z',
          status: 'PROCESSED',
          userId: 'demo-user'
        },
        {
          id: 'demo-2',
          fileName: 'Cloud_Computing_Best_Practices.pdf',
          fileSize: 1843200,
          uploadDate: '2024-01-14T14:20:00Z',
          status: 'PROCESSED',
          userId: 'demo-user'
        },
        {
          id: 'demo-3',
          fileName: 'Data_Science_Handbook.pdf',
          fileSize: 3276800,
          uploadDate: '2024-01-13T09:15:00Z',
          status: 'PROCESSED',
          userId: 'demo-user'
        }
      ]);
      return;
    }

    // Only fetch if user is authenticated and is ADMIN
    if (!isAuthenticated || currentUser?.role !== 'ADMIN') {
      return;
    }

    const fetchDocuments = async () => {
      setAdminStatus('loading');
      try {
        const headers = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${BACKEND_URL}/api/documents/all`, {
          headers: headers
        });
        
        if (response.ok) {
          const data = await response.json();
          setAllDocuments(data);
          setAdminStatus('');
        } else {
          setAdminStatus('error');
          console.error('Failed to fetch documents');
        }
      } catch (error) {
        setAdminStatus('error');
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, [BACKEND_URL, DEMO_MODE, isAuthenticated, currentUser, authToken]);

  // Handle document deletion
  const handleDeleteDocument = async (documentId, fileName) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?\n\nThis will permanently remove the file and all its embeddings.`)) {
      return;
    }

    // Demo mode: just remove from UI
    if (DEMO_MODE) {
      setAllDocuments(allDocuments.filter(doc => doc.id !== documentId));
      alert(`Demo: Document "${fileName}" removed from display`);
      return;
    }

    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (response.ok) {
        // Remove from UI
        setAllDocuments(allDocuments.filter(doc => doc.id !== documentId));
        alert(`Successfully deleted "${fileName}"`);
      } else {
        const error = await response.json();
        alert(`Failed to delete document: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting document: ' + error.message);
    }
  };

  // Show login page if not authenticated
  if (showLogin && !DEMO_MODE) {
    return (
      <div className="App">
        <div className="login-container">
          <div className="login-box">
            <h1>AI Knowledge Base</h1>
            <p className="login-subtitle">Sign in to continue</p>
            
            {authError && (
              <div className="auth-error">{authError}</div>
            )}
            
            <form onSubmit={loginMode === 'login' ? handleLogin : handleRegister}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              
              <button type="submit" className="login-btn">
                {loginMode === 'login' ? 'Login' : 'Register'}
              </button>
            </form>
            
            <div className="login-toggle">
              {loginMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <span onClick={() => { setLoginMode('register'); setAuthError(''); }}>
                    Register
                  </span>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <span onClick={() => { setLoginMode('login'); setAuthError(''); }}>
                    Login
                  </span>
                </p>
              )}
            </div>
            
            <div className="demo-credentials">
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '2rem' }}>
                <strong>Test Credentials:</strong>
              </p>
              <p style={{ fontSize: '0.85rem', color: '#888' }}>
                Admin: username: <code>admin</code> / password: <code>admin123</code>
              </p>
              <p style={{ fontSize: '0.85rem', color: '#888' }}>
                User: username: <code>user</code> / password: <code>user123</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">

      {/* Header Section */}
      <header className="app-header">
        <h1>AI Knowledge Base Search Assistant</h1>
        <p>Intelligent Document Search & Q&A System</p>
        
        {/* User info and logout */}
        {isAuthenticated && currentUser && (
          <div className="user-info">
            <span className="user-badge">
              {currentUser.username} [{currentUser.role}]
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
        
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
      {/* 1. Document Upload Section - ADMIN ONLY */}
      {currentUser?.role === 'ADMIN' && (
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
      )}

        {/* 2. Search Section */}
        <section className="card">
          <h2>Search Documents</h2>
          {DEMO_MODE && (
            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '-0.5rem', marginBottom: '1rem', fontStyle: 'italic' }}>
              Try searching for "machine learning", "cloud computing", or "data science"
            </p>
          )}
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
                {searchResults.map((fileGroup, idx) => (
                  <li key={idx} className="file-group">
                    <div className="result-header">
                      <h3>
                        {fileGroup.file_name || 'Unknown file'}
                        {fileGroup.chunks && fileGroup.chunks.length > 0 && (
                          <span style={{ fontSize: '0.9rem', color: '#888', marginLeft: '10px' }}>
                            ({fileGroup.chunks.length} chunk{fileGroup.chunks.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </h3>
                      <button 
                        onClick={() => handleDownload(fileGroup.document_id, fileGroup.file_name)}
                        className="download-btn-inline"
                      >
                        Download
                      </button>
                    </div>

                    <div className="similarity" style={{ marginBottom: '10px' }}>
                      Best match: {getSimilarityLabel(fileGroup.highest_similarity || 0)} ({(fileGroup.highest_similarity || 0).toFixed(3)})
                    </div>

                    <div className="chunks-container">
                      {fileGroup.chunks && fileGroup.chunks.map((chunk, chunkIdx) => (
                        <div key={chunkIdx} className="chunk-item" style={{ 
                          marginLeft: '15px', 
                          marginBottom: '10px',
                          paddingLeft: '15px',
                          borderLeft: '2px solid #4A90E2'
                        }}>
                          <p style={{ fontSize: '0.9rem', color: '#000' }}>
                            {(chunk.text || '').slice(0, 150)}
                            {(chunk.text || '').length > 150 ? '...' : ''}
                          </p>
                          <div style={{ fontSize: '0.8rem', color: '#999' }}>
                            Similarity: {getSimilarityLabel(chunk.similarity || 0)} ({(chunk.similarity || 0).toFixed(3)})
                          </div>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              searchStatus === '' && (
                <div className="results-placeholder">
                  <p>Search results will appear here</p>
                </div>
              )
            )}
          </div>
        </section>

        {/* 3. Q&A Section */}
        <section className="card">
          <h2>Ask AI</h2>
          {DEMO_MODE && (
            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '-0.5rem', marginBottom: '1rem', fontStyle: 'italic' }}>
              Try to ask "What is machine learning?", "Tell me about cloud computing", or "What are data science best practices?"
            </p>
          )}
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

        {/* 4. Admin Section - Document Management - ADMIN ONLY */}
        {currentUser?.role === 'ADMIN' && (
        <section className="card">
          <h2>Document Management</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            View and manage all uploaded documents
          </p>
          
          {adminStatus === 'loading' && (
            <p className="loading-indicator">Loading documents...</p>
          )}
          
          {adminStatus === 'error' && (
            <p className="status-text error">Failed to load documents. Please try again.</p>
          )}
          
          {allDocuments && allDocuments.length > 0 ? (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td className="file-name-cell">{doc.fileName}</td>
                      <td>{((doc.fileSize || 0) / 1024).toFixed(2)} KB</td>
                      <td>
                        {doc.uploadDate 
                          ? new Date(doc.uploadDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </td>
                      <td>
                        <span className={`status-badge ${(doc.status || '').toLowerCase()}`}>
                          {doc.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDownload(doc.id, doc.fileName)}
                          className="action-btn download-btn"
                          title="Download document"
                        >
                          Download
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                          className="action-btn delete-btn"
                          title="Delete document"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            adminStatus === '' && (
              <div className="results-placeholder">
                <p>No documents found</p>
              </div>
            )
          )}
        </section>
        )}
      </main>
    </div>
  );
}
export default App;

