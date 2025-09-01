import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ResultsView from '../components/ResultsView';

interface ContractSummary {
  summary: string;
  parties: string;
  duration: string;
  risks: string[];
}

export default function Results() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const router = useRouter();

  useEffect(() => {
    const processUpload = async () => {
      try {
        // Get the pending upload from sessionStorage
        const pendingUpload = sessionStorage.getItem('pendingUpload');
        
        if (!pendingUpload) {
          setError('No file found. Please go back and upload a contract.');
          setIsLoading(false);
          return;
        }

        const uploadData = JSON.parse(pendingUpload);
        
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

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Analysis failed');
        }

        const result = await response.json();
        setSummary(result);
        
        // Clear the pending upload from sessionStorage
        sessionStorage.removeItem('pendingUpload');
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      } finally {
        setIsLoading(false);
      }
    };

    processUpload();
  }, []);

  if (isLoading) {
    return (
      <main className="results-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1>Analyzing Your Contract...</h1>
          <p>Our AI is reading through your document to identify key points and risks.</p>
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
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1>Something Went Wrong</h1>
          <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={() => router.push('/')} 
            className="btn btn--primary"
          >
            Try Again
          </button>
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
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text)' }}>
        Contract Analysis Results
      </h1>
      <ResultsView 
        summary={summary.summary}
        parties={summary.parties}
        duration={summary.duration}
        risks={summary.risks}
      />
    </main>
  );
}
