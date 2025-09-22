import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Logo from '../assets/logo.png';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Contract Reader</title>
        <link rel="icon" href={Logo.src} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </>
  );
}
