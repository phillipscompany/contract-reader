import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="nav">
      <div className="container nav__inner">
        <div className="nav__brand">
          <div className="nav__logo" aria-hidden>▦</div>
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
