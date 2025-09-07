import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FileUploader from '../components/FileUploader';
import IntakeModal from '../components/IntakeModal';
import TrustedBy from '../components/TrustedBy';
import { fileToBase64 } from '../lib/base64';

interface IntakeData {
  email: string;
  location: {
    country: string;
    region: string;
  };
  contractType: string;
  savedAt: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeCompleted, setIntakeCompleted] = useState(false);
  const router = useRouter();

  // Check for existing intake data on mount
  useEffect(() => {
    const existingIntake = localStorage.getItem('intake');
    if (!existingIntake) {
      setShowIntakeModal(true);
    } else {
      setIntakeCompleted(true);
    }
  }, []);

  const handleIntakeSave = (data: { email: string; location: { country: string; region: string }; contractType: string }) => {
    const intakeData: IntakeData = {
      ...data,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('intake', JSON.stringify(intakeData));
    setIntakeCompleted(true);
    setShowIntakeModal(false);
  };

  const handleIntakeClose = () => {
    setShowIntakeModal(false);
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(selectedFile);
      
      // Save to sessionStorage
      const uploadData = {
        name: selectedFile.name,
        type: selectedFile.type,
        base64: base64,
        createdAt: new Date().toISOString()
      };
      
      sessionStorage.setItem('pendingUpload', JSON.stringify(uploadData));
      
      // Navigate to results page
      router.push('/results');
    } catch (err) {
      setError('Failed to process file. Please try again.');
    }
  };

  return (
    <>
      <IntakeModal 
        open={showIntakeModal}
        onClose={handleIntakeClose}
        onSave={handleIntakeSave}
      />
      <main className="container hero">
        <section className="hero__text">
          <h1 className="hero__title">Know Exactly What You're Signing... Before You Sign!</h1>
          <p className="hero__subtitle">
            Don't fall into the trap of signing something you don't understand. Simply upload your document and our AI will explain it clearly, highlighting key risks & obligations.
          </p>
        </section>

        <section className="drop">
          <div className="drop__area" aria-label="Upload area" style={{ position: 'relative' }}>
            {!intakeCompleted && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                zIndex: 10,
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '8px' 
                }}>
                  Please complete a quick setup to continue
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--muted)' 
                }}>
                  We need some basic information to tailor your analysis
                </div>
              </div>
            )}
            <FileUploader onFileSelect={handleFileSelect} />
          </div>
          <div className="drop__notes">
            <div>🚨 Please note this is not legal advice. If unsure, seek advice from a legal professional.</div>
          </div>
        </section>

        {error && (
          <div style={{ textAlign: 'center', marginTop: 20, color: 'red' }}>
            <p>Error: {error}</p>
          </div>
        )}

        <section className="features">
          <article className="feature">
            <div className="feature__icon" aria-hidden>🔒</div>
            <h3 className="feature__title">Stay Secure</h3>
            <p className="feature__text">
              We follow strict standards when handling your files. Documents are processed in-memory and deleted right after analysis.
            </p>
          </article>
          <article className="feature">
            <div className="feature__icon" aria-hidden>🪤</div>
            <h3 className="feature__title">Avoid Traps</h3>
            <p className="feature__text">
              Don't get caught out! We flag hidden fees, auto-renewals, and penalty clauses buried in the fine print.
            </p>
          </article>
          <article className="feature">
            <div className="feature__icon" aria-hidden>⏰</div>
            <h3 className="feature__title">Save Time</h3>
            <p className="feature__text">
              Skip hours of reading through boring legal text. Get the key points, risks, and obligations summarised in seconds.
            </p>
          </article>
        </section>

        {/* <TrustedBy /> */}

        {/* <section className="workflow">
          <h2 className="workflow__title">How it works</h2>
          <div className="workflow__path">
            <div className="workflow__step">
              <div className="workflow__icon">📄</div>
              <h3 className="workflow__step-title">Upload your contract</h3>
              <p className="workflow__step-text">Simply drag and drop your PDF or DOCX file into the upload area above.</p>
            </div>
            <div className="workflow__arrow workflow__arrow--down"></div>
            
            <div className="workflow__step">
              <div className="workflow__icon">🤖</div>
              <h3 className="workflow__step-title">Our AI analyses it</h3>
              <p className="workflow__step-text">Our trained AI scans through your document to identify key terms and risks.</p>
            </div>
            <div className="workflow__arrow workflow__arrow--right"></div>
            
            <div className="workflow__step">
              <div className="workflow__icon">📥</div>
              <h3 className="workflow__step-title">Get your summary</h3>
              <p className="workflow__step-text">Download a clear, comprehensive PDF summary highlighting what matters most.</p>
            </div>
          </div>
        </section> */}
      </main>
    </>
  );
}
