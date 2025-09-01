import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ResultsView from '../components/ResultsView';
import { withBackoff } from '../lib/backoff';

interface ContractSummary {
  summary: string;
  parties: string;
  duration: string;
  risks: string[];
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

type ProgressStep = 'UPLOADING' | 'EXTRACTING' | 'SUMMARIZING' | 'DONE' | 'ERROR';

export default function Results() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [sourceFilename, setSourceFilename] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('UPLOADING');
  const router = useRouter();

  const doUploadFetch = async (): Promise<ContractSummary> => {
    // Get the pending upload from sessionStorage
    const pendingUpload = sessionStorage.getItem('pendingUpload');
    
    if (!pendingUpload) {
      throw { code: 'NO_FILE', message: 'No file found. Please go back and upload a contract.' };
    }

    const uploadData = JSON.parse(pendingUpload);
    
    // Store the source filename for the PDF download
    setSourceFilename(uploadData.name);
    
    // Convert base64 back to file
    const base64ToBlob = (base64: string, mimeType: string) => {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    };

    const file = base64ToBlob(uploadData.base64, uploadData.type);
    
    // Create FormData and send to API
    const formData = new FormData();
    formData.append('file', file, uploadData.name);

    // Set EXTRACTING state before making the request
    setProgressStep('EXTRACTING');

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw { code: errorData.error.code, message: errorData.error.message };
    }

    // Set SUMMARIZING state before processing the response
    setProgressStep('SUMMARIZING');

    const result = await response.json();
    return result;
  };

  const processUpload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsFromCache(false);
      setProgressStep('UPLOADING');
      
      const result = await withBackoff(doUploadFetch, {
        retries: 2,
        base: 600, // 600ms base delay
        factor: 2, // Exponential factor
        jitter: true // Add jitter
      });
      
      setSummary(result);
      setProgressStep('DONE');
      
      // Store results in sessionStorage for persistence
      sessionStorage.setItem('latestResults', JSON.stringify({
        ...result,
        sourceFilename,
        analyzedAt: new Date().toISOString()
      }));
      
      // Clear the pending upload from sessionStorage
      sessionStorage.removeItem('pendingUpload');
      
    } catch (err: any) {
      setProgressStep('ERROR');
      
      // Map error codes to friendly messages
      let friendlyMessage = 'We couldn\'t complete the analysis. Please try again.';
      
      switch (err.code) {
        case 'RATE_LIMIT':
          friendlyMessage = 'Too many requests — please try again in a minute.';
          break;
        case 'TIMEOUT':
          friendlyMessage = 'The analysis took too long. Please try again.';
          break;
        case 'AUTH':
          friendlyMessage = 'We\'re having trouble authorizing analysis. Please try again later.';
          break;
        case 'NO_FILE':
          friendlyMessage = 'No file found. Please go back and upload a contract.';
          break;
        default:
          friendlyMessage = 'We couldn\'t complete the analysis. Please try again.';
      }
      
      setError({ code: err.code, message: friendlyMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeResults = async () => {
      try {
        // Check if we have pending upload to process
        const pendingUpload = sessionStorage.getItem('pendingUpload');
        
        if (pendingUpload) {
          // Process the pending upload
          await processUpload();
          return;
        }
        
        // Check if we have latest results to display
        const latestResults = sessionStorage.getItem('latestResults');
        
        if (latestResults) {
          const results = JSON.parse(latestResults);
          setSummary({
            summary: results.summary,
            parties: results.parties,
            duration: results.duration,
            risks: results.risks
          });
          setSourceFilename(results.sourceFilename);
          setIsFromCache(true);
          setProgressStep('DONE');
          setIsLoading(false);
          return;
        }
        
        // No pending upload or latest results
        setError({ code: 'NO_FILE', message: 'No file found. Please go back and upload a contract.' });
        setProgressStep('ERROR');
        setIsLoading(false);
        
      } catch (err) {
        setError({ code: 'UNKNOWN', message: 'An unexpected error occurred. Please try again.' });
        setProgressStep('ERROR');
        setIsLoading(false);
      }
    };

    initializeResults();
  }, []);

  if (isLoading) {
    return (
      <main className="results-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1>Analyzing Your Contract...</h1>
          <p>Our AI is reading through your document to identify key points and risks.</p>
          
          {/* Progress Steps */}
          <div className="progress">
            <div className={`progress__step ${progressStep === 'UPLOADING' ? 'progress__step--active' : ''}`}>
              <div className="progress__step-icon">📤</div>
              <div className="progress__step-text">Uploading</div>
            </div>
            <div className={`progress__step ${progressStep === 'EXTRACTING' ? 'progress__step--active' : ''}`}>
              <div className="progress__step-icon">📄</div>
              <div className="progress__step-text">Extracting text</div>
            </div>
            <div className={`progress__step ${progressStep === 'SUMMARIZING' ? 'progress__step--active' : ''}`}>
              <div className="progress__step-icon">🤖</div>
              <div className="progress__step-text">Summarizing with AI</div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid var(--border)', 
              borderTop: '4px solid var(--primary)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="results-container">
        <div className="error">
          <h1 className="error__title">Something went wrong</h1>
          <p className="error__message">{error.message}</p>
          <div className="error__actions">
            <button 
              onClick={processUpload} 
              className="btn btn--primary"
            >
              Retry
            </button>
            <button 
              onClick={() => router.push('/')} 
              className="btn"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="results-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1>No Results Found</h1>
          <p>Please go back and upload a contract to analyze.</p>
          <button 
            onClick={() => router.push('/')} 
            className="btn btn--primary"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="results-container">
      {isFromCache && (
        <div style={{ 
          textAlign: 'center', 
          padding: '16px', 
          marginBottom: '20px', 
          backgroundColor: 'var(--card)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px',
          color: 'var(--muted)'
        }}>
          📋 Showing your last analysis
        </div>
      )}
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text)' }}>
        Contract Analysis Results
      </h1>
      <ResultsView 
        summary={summary.summary}
        parties={summary.parties}
        duration={summary.duration}
        risks={summary.risks}
        sourceFilename={sourceFilename}
      />
    </main>
  );
}
