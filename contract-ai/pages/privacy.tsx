import Link from 'next/link';

export default function Privacy() {
  return (
    <main className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <h1 style={{ 
        fontSize: 'clamp(28px, 4vw, 40px)', 
        lineHeight: '1.15', 
        margin: '0 0 32px', 
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontWeight: '600',
        letterSpacing: '-0.02em'
      }}>
        Privacy Policy
      </h1>

      <div style={{ color: 'var(--text)', lineHeight: '1.6' }}>
        <p>
          This privacy policy describes how Contract Explainer collects, uses, and protects your information when you use our service.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Information We Collect
        </h2>

        <p>
          When you upload a contract for analysis, we collect the document content temporarily to provide our AI-powered analysis service. We do not store your documents permanently.
        </p>

        <p>
          We may also collect basic usage information such as the type of files uploaded and analysis results to improve our service quality.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          How We Use Your Information
        </h2>

        <p>
          Your uploaded documents are processed in-memory and deleted immediately after analysis. We use the document content solely to provide contract analysis services.
        </p>

        <p>
          We do not share your personal information or document content with third parties, except as required by law or to provide our services.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Data Security
        </h2>

        <p>
          We implement appropriate security measures to protect your information. All document processing occurs in secure, encrypted environments.
        </p>

        <p>
          Documents are processed in-memory and are not stored on our servers after analysis is complete.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Contact Us
        </h2>

        <p>
          If you have any questions about this privacy policy, please contact us through our website.
        </p>

        <p style={{ 
          marginTop: '40px', 
          padding: '20px', 
          backgroundColor: 'var(--card)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px',
          color: 'var(--muted)',
          fontSize: '14px'
        }}>
          <strong>Note:</strong> This is a placeholder privacy policy. The actual policy will be finalized before launch.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link href="/" className="btn btn--primary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
