import Link from 'next/link';

export default function Terms() {
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
        Terms of Service
      </h1>

      <div style={{ color: 'var(--text)', lineHeight: '1.6' }}>
        <p>
          These terms of service govern your use of Contract Explainer. By using our service, you agree to be bound by these terms.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Service Description
        </h2>

        <p>
          Contract Explainer provides AI-powered analysis of legal documents to help users understand contract terms in plain English. Our service is designed for informational purposes only.
        </p>

        <p>
          We analyze uploaded documents and provide summaries, risk assessments, and explanations of key terms. All analysis is performed by artificial intelligence and should not be considered legal advice.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          User Responsibilities
        </h2>

        <p>
          You are responsible for ensuring that any documents you upload are legally yours to analyze and do not contain confidential information that you are not authorized to share.
        </p>

        <p>
          You agree not to use our service for any illegal or unauthorized purposes. You must not attempt to gain unauthorized access to our systems or interfere with the proper functioning of the service.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Limitation of Liability
        </h2>

        <p>
          Contract Explainer is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of our analysis results.
        </p>

        <p>
          We shall not be liable for any damages arising from your use of our service, including but not limited to direct, indirect, incidental, or consequential damages.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Intellectual Property
        </h2>

        <p>
          You retain ownership of any documents you upload. By using our service, you grant us a limited license to process your documents solely for the purpose of providing analysis.
        </p>

        <p>
          Our service, including all software, algorithms, and analysis methodologies, is protected by intellectual property laws and remains our property.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Changes to Terms
        </h2>

        <p>
          We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.
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
          <strong>Note:</strong> These are placeholder terms of service. The actual terms will be finalized with legal review before launch.
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
