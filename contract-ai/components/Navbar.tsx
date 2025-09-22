import Link from 'next/link';
import Logo from '../assets/Logo.png';

export default function Navbar() {
  return (
    <header className="nav">
      <div className="container nav__inner">
        <div className="nav__brand">
          <div className="nav__logo" aria-hidden>
            <img src={Logo.src} alt="Contract Explainer Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }}/>
          </div>
          <Link href="/" className="nav__title">CONTRACT EXPLAINER</Link>
        </div>
        <nav className="nav__links">
          <Link href="/" className="nav__link">Home</Link>
          <Link href="/pricing" className="nav__link">Pricing</Link>
          <Link href="/feedback" className="nav__link">Feedback</Link>
        </nav>
      </div>
    </header>
  );
}
