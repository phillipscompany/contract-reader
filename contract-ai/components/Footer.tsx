import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="container">
        {/* Legal Links */}
        <div className="footer-links">
          <Link href="/privacy">
            Privacy Policy
          </Link>
          
          <Link href="/terms">
            Terms of Service
          </Link>
          
          <Link href="/disclaimer">
            Disclaimer
          </Link>
        </div>

        {/* Copyright */}
        <div className="footer-copyright">
          © {currentYear} Contract Explainer
        </div>
      </div>
    </footer>
  );
}
