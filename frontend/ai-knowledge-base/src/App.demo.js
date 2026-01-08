import './App.css';
import { useState } from 'react';
import { getMockSearchResults, getMockQAResponse, MOCK_FILE_CONTENT } from './mockData';

function App() {
  // DEMO MODE - Using mock data, no backend required
  const DEMO_MODE = true;
  
  // Upload-related state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Search-related state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState('');

  // Q&A-related state
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [qaStatus, setQaStatus] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    console.log('Selected file (demo):', file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      console.log('Dropped file (demo):', file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first!');
      return;
    }
  
    setUploadStatus('uploading');
    
    // Simulate upload delay
    setTimeout(() => {
      setUploadStatus('success');
      setSelectedFile(null);
    }, 1500);
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      alert('Please enter a search query');
      return;
    }

    setSearchStatus('loading');
    setSearchResults([]);
    
    // Simulate search delay
    setTimeout(() => {
      const results = getMockSearchResults(query);
      setSearchResults(results);
      setSearchStatus('');
    }, 800);
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      console.log('Downloading (demo):', documentId, fileName);
      
      // Get mock file content
      const content = MOCK_FILE_CONTENT[documentId] || 'Demo file content';
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Demo download successful!');
    } catch (error) {
      console.error('Download error:', error);
      alert('Download error: ' + error.message);
    }
  };

  const getSimilarityLabel = (sim) => {
    if (sim >= 0.9) return 'Very High';
    if (sim >= 0.8) return 'High';
    if (sim >= 0.7) return 'Medium';
    if (sim >= 0.6) return 'Low';
    return 'Very Low';
  };

  const handleAskQuestion = async () => {
    const q = question.trim();
    if (!q) {
      alert('Please enter a question');
      return;
    }

    const userMessage = { type: 'user', text: q };
    setMessages([...messages, userMessage]);
    
    setQuestion('');
    setQaStatus('loading');

    // Simulate thinking delay
    setTimeout(() => {
      const mockResponse = getMockQAResponse(q);
      const aiMessage = { 
        type: 'ai', 
        text: mockResponse.answer, 
        sources: mockResponse.sources 
      };
      setMessages([...messages, userMessage, aiMessage]);
      setQaStatus('');
    }, 1200);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Knowledge Base & Internal Search Assistant</h1>
        <p>Upload documents, search semantically, and ask AI questions</p>
        <div style={{ 
          background: '#FFF3CD', 
          color: '#856404', 
          padding: '0.5rem 1rem', 
          borderRadius: '6px',
          fontSize: '0.9rem',
          marginTop: '0.5rem',
          maxWidth: '600px'
        }}>
          <strong>Demo Mode:</strong> Using sample data (no backend required). Try searching for "machine learning", "cloud", or "data science"!
        </div>
      </header>

      <main className="App-main">
        {/* Upload Section */}
        <section className="upload-section">
          <h2>Document Management</h2>
          
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-input" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="drop-zone-content">
              <div className="upload-icon" aria-hidden="true"></div>
              <p>Click to upload or drag and drop</p>
              <p style={{ fontSize: '0.9rem', color: '#999' }}>PDF, TXT (MAX. 10MB) - Demo Only</p>
            </label>
          </div>

          {selectedFile && (
            <div className="file-info">
              <p><strong>Selected:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <button onClick={handleUpload} disabled={!selectedFile}>
            Upload
          </button>

          {uploadStatus === 'uploading' && <p style={{ color: '#4A90E2' }}>Simulating upload...</p>}
          {uploadStatus === 'success' && (
            <p style={{ color: '#28A745' }}>Demo upload successful! Try searching for "machine learning" or "cloud"</p>
          )}
          {uploadStatus === 'error' && <p style={{ color: '#DC3545' }}>Upload failed!</p>}
        </section>

        {/* Search Section */}
        <section className="search-section">
          <h2>Semantic Search</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Enter search query (try 'machine learning' or 'cloud')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>
              Search
            </button>
          </div>

          {searchStatus === 'loading' && <p style={{ color: '#4A90E2' }}>Searching...</p>}
          {searchStatus === 'error' && <p style={{ color: '#DC3545' }}>Search failed!</p>}

          <div className="results-container">
            <h3>Search Documents</h3>
            {searchResults && searchResults.length > 0 ? (
              <ul className="results-list">
                {searchResults.map((item, idx) => (
                  <li key={idx} className="result-item">
                    <div className="result-header">
                      <h3 className="file-name-display">{item.file_name || 'Unknown file'}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item.document_id, item.file_name);
                        }}
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
              <div className="placeholder">
                <p>No search results yet. Try searching for "machine learning", "cloud computing", or "data science"!</p>
              </div>
            )}
          </div>
        </section>

        {/* Q&A Section */}
        <section className="qa-section">
          <h2>AI Q&A</h2>
          <div className="chat-container">
            <div className="messages">
              {messages.length === 0 ? (
                <div className="placeholder">
                  <p>Ask questions about your documents. Try "What is machine learning?" or "Explain cloud computing"</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.type}`}>
                    <div className="message-content">
                      <strong>{msg.type === 'user' ? 'You:' : 'AI:'}</strong>
                      <p>{msg.text}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="sources">
                          <strong>Sources:</strong>
                          {msg.sources.map((src, i) => (
                            <div key={i} className="source-item">
                              <span className="source-name">{src.file_name}</span>
                              <span className="source-text">{src.text.slice(0, 80)}...</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {qaStatus === 'loading' && (
                <div className="message ai">
                  <div className="message-content">
                    <strong>AI:</strong>
                    <p style={{ color: '#4A90E2' }}>Thinking...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="input-area">
              <input
                type="text"
                placeholder="Ask a question (try 'What is machine learning?')..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <button onClick={handleAskQuestion}>
                Send
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

