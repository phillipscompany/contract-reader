import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ResultsFull from '../components/ResultsFull';
import { withBackoff } from '../lib/backoff';
import { downloadFullAnalysisPdf } from '../lib/pdf';
import type { FullResult } from '../lib/summarizeContract';
import { MapPin, Briefcase, Mail } from 'lucide-react';

interface ApiResponse {
  ok: boolean;
  intakeContractType: string;
  detectedContractType: { label: string; confidence: number };
  finalContractType: string;
  buckets: FullResult['buckets'];
  meta: {
    name: string;
    size: number;
    type: string;
    mode: string;
    email?: string;
    location?: {
      country?: string;
      region?: string;
    };
  };
  full: FullResult;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

type ProgressStep = 'UPLOADING' | 'ANALYSING' | 'DONE' | 'ERROR';

export default function Results() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [sourceFilename, setSourceFilename] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('UPLOADING');
  const router = useRouter();

  const doFileAnalysis = async (): Promise<ApiResponse> => {
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
    
    // Get intake data from localStorage
    const intakeData = localStorage.getItem('intake');
    let intakeEmail = '';
    let intakeCountry = '';
    let intakeRegion = '';
    let intakeContractType = '';
    
    if (intakeData) {
      try {
        const parsed = JSON.parse(intakeData);
        intakeEmail = parsed.email || '';
        intakeCountry = parsed.location?.country || '';
        intakeRegion = parsed.location?.region || '';
        intakeContractType = parsed.contractType || '';
      } catch (error) {
        console.warn('Failed to parse intake data:', error);
      }
    }

    // Create FormData and send to analysis API
    const formData = new FormData();
    formData.append('file', file, uploadData.name);
    formData.append('intakeEmail', intakeEmail);
    formData.append('intakeCountry', intakeCountry);
    formData.append('intakeRegion', intakeRegion);
    formData.append('intakeContractType', intakeContractType);

    // Set ANALYSING state before making the request
    setProgressStep('ANALYSING');

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw { code: errorData.error.code, message: errorData.error.message };
    }

    const result = await response.json();
    return result;
  };

  const processUpload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsFromCache(false);
      setProgressStep('UPLOADING');
      
      // Single API call for file analysis
      const result = await withBackoff(doFileAnalysis, {
        retries: 2,
        base: 600, // 600ms base delay
        factor: 2, // Exponential factor
        jitter: true // Add jitter
      });
      
      setApiResponse(result);
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
          setApiResponse(results);
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
    // Determine the main loading message based on current stage
    const getLoadingMessage = () => {
      switch (progressStep) {
        case 'UPLOADING':
          return 'Uploading your contract...';
        case 'ANALYSING':
          return 'Analysing with AI...';
        default:
          return 'Processing your contract...';
      }
    };

    const getLoadingDescription = () => {
      switch (progressStep) {
        case 'UPLOADING':
          return 'Preparing your file for analysis.';
        case 'ANALYSING':
          return 'Our AI is reading through your document to identify key points and risks.';
        default:
          return 'Please wait while we process your contract.';
      }
    };

    return (
      <main className="results-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1>{getLoadingMessage()}</h1>
          <p>{getLoadingDescription()}</p>
          
          {/* Progress Steps */}
          <div className="progress">
            <div className={`progress__step ${progressStep === 'UPLOADING' ? 'progress__step--active' : ''}`}>
              <div className="progress__step-icon">📤</div>
              <div className="progress__step-text">Uploading</div>
            </div>
            <div className={`progress__step ${progressStep === 'ANALYSING' ? 'progress__step--active' : ''}`}>
              <div className="progress__step-icon">🤖</div>
              <div className="progress__step-text">Analysing with AI</div>
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

  if (!apiResponse) {
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
        
        {/* Sponsor Slot */}
        <div className="sponsor-slot">
          <p>Looking for professional legal advice? Sponsor placement coming soon.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="results-container">
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text)' }}>
        Contract Analysis Results
      </h1>

      {/* Meta Information Display */}
      {apiResponse.meta && ((apiResponse.meta.location?.country || apiResponse.meta.location?.region) || apiResponse.meta.email) && (
        <div className="meta-bar">
          {apiResponse.meta.location && (apiResponse.meta.location.country || apiResponse.meta.location.region) && (
            <div className="meta-item">
              <MapPin size={16} className="meta-icon" />
              <span className="meta-label">Location:</span>
              <span className="meta-value">
                {apiResponse.meta.location.region && apiResponse.meta.location.country
                  ? `${apiResponse.meta.location.region}, ${apiResponse.meta.location.country}`
                  : apiResponse.meta.location.country || apiResponse.meta.location.region
                }
              </span>
            </div>
          )}
          
          {apiResponse.meta.email && (
            <div className="meta-item">
              <Mail size={16} className="meta-icon" />
              <span className="meta-label">Email:</span>
              <span className="meta-value">{apiResponse.meta.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Always render full results */}
      {apiResponse.full ? (
        <ResultsFull 
          fullResult={apiResponse.full}
          sourceFilename={sourceFilename}
          meta={apiResponse.meta}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>No analysis results available.</p>
        </div>
      )}

      {/* PDF Download Button */}
      {apiResponse.full && (
        <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '20px' }}>
          <button 
            onClick={() => downloadFullAnalysisPdf({
              siteTitle: 'CONTRACT EXPLAINER - FULL ANALYSIS',
              sourceFilename: sourceFilename,
              analyzedAt: new Date().toLocaleString(),
              full: apiResponse.full,
              meta: apiResponse.meta
            })}
            className="btn btn--primary"
            style={{ fontSize: '18px', padding: '16px 32px', minWidth: '250px' }}
          >
            Download Full Report (PDF)
          </button>
        </div>
      )}

      {/* Sponsor Slot */}
      <div className="sponsor-slot">
        <p>Looking for professional legal advice? Sponsor placement coming soon.</p>
      </div>
    </main>
  );
}