import Link from 'next/link';

export default function Disclaimer() {
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
        Disclaimer
      </h1>

      <div style={{ color: 'var(--text)', lineHeight: '1.6' }}>
        <p>
          Please read this disclaimer carefully before using Contract Explainer. This service is designed to provide informational assistance only and should not be considered as legal advice.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Not Legal Advice
        </h2>

        <p>
          Contract Explainer uses artificial intelligence to analyze legal documents and provide plain-English explanations. However, this analysis is not a substitute for professional legal advice from a qualified attorney.
        </p>

        <p>
          The information provided by our service is for general informational purposes only and should not be relied upon for making legal decisions or taking legal action.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Accuracy and Completeness
        </h2>

        <p>
          While we strive to provide accurate and helpful analysis, we cannot guarantee the completeness, accuracy, or reliability of our AI-generated explanations. Legal documents can be complex and may contain nuances that require professional interpretation.
        </p>

        <p>
          Our analysis may not identify all important terms, risks, or obligations in your contract. Always review the original document carefully and consult with a legal professional for important decisions.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          No Attorney-Client Relationship
        </h2>

        <p>
          Using Contract Explainer does not create an attorney-client relationship. We are not a law firm, and our service is not a substitute for legal representation.
        </p>

        <p>
          If you need legal advice, representation, or have questions about your legal rights and obligations, you should consult with a qualified attorney licensed in your jurisdiction.
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--primary)', 
          margin: '32px 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--primary)'
        }}>
          Use at Your Own Risk
        </h2>

        <p>
          You acknowledge and agree that you use Contract Explainer at your own risk. We are not responsible for any decisions you make based on our analysis or any consequences that may result from such decisions.
        </p>

        <p>
          We recommend that you always seek professional legal advice for important contracts, especially those involving significant financial obligations, business relationships, or legal rights.
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
          To the maximum extent permitted by law, Contract Explainer and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of our service.
        </p>

        <p>
          This includes, but is not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses, even if we have been advised of the possibility of such damages.
        </p>

        <div style={{ 
          marginTop: '40px', 
          padding: '20px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px',
          color: '#856404'
        }}>
          <p style={{ margin: '0', fontWeight: '600' }}>
            ⚠️ Important: This tool provides AI-powered plain-English explanations. It is not legal advice.
          </p>
        </div>

        <p style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: 'var(--card)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px',
          color: 'var(--muted)',
          fontSize: '14px'
        }}>
          <strong>Note:</strong> This is a placeholder disclaimer. The actual disclaimer will be finalized with legal review before launch.
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
