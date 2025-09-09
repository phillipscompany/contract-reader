import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Why not just use ChatGPT?',
    answer: 'The short answer is: ChatGPT can (and does) train on your data, we don\'t. We delete files instantly so we never see your contract information. ChatGPT answers vary, our service always returns a well-structured, repeatable and downloadable PDF that can be sent directly to others. Forget typing in long prompts — simply drop the contract and you\'re away!'
  },
  {
    id: '2',
    question: 'Do you store my documents?',
    answer: 'No, your files are processed in memory only. They are permanently deleted immediately after analysis. We never keep copies of your contracts.'
  },
  {
    id: '3',
    question: 'Is this legal advice?',
    answer: 'No, this is an AI-powered plain-English explanation. It helps you understand contracts but does not replace professional legal advice. Always consult a qualified lawyer for final decisions.'
  },
  {
    id: '4',
    question: 'What file types can I upload?',
    answer: 'Currently supports PDF and DOCX contracts. Scanned image-only PDFs may not extract text correctly.'
  },
  {
    id: '5',
    question: 'How accurate is the analysis?',
    answer: 'The AI is trained to explain common clauses and risks. It is accurate for plain-English summaries but may miss rare or highly technical clauses. Always cross-check critical decisions with a professional.'
  },
  {
    id: '6',
    question: 'What kinds of contracts work best?',
    answer: 'Leases, freelance agreements, NDAs, employment contracts, and service agreements. The tool is best for everyday contracts where you want clarity and plain-English explanations.'
  }
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredFAQs = faqData.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleItem(id);
    }
  };

  return (
    <>
      <Head>
        <title>FAQ - Contract Reader</title>
        <meta name="description" content="Frequently asked questions about contract analysis" />
      </Head>

      <div className="faq-wrap">
        <div className="faq-header">
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <p className="faq-subtitle">
            Common questions about how the tool works, privacy, and results.
          </p>
        </div>

        <div className="faq-search">
          <div className="faq-search__input-wrapper">
            <Search size={20} className="faq-search__icon" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="faq-search__input"
            />
          </div>
        </div>

        <div className="faq-accordion" role="region" aria-label="FAQ Accordion">
          {filteredFAQs.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            return (
              <div key={item.id} className="faq-item">
                <button
                  className={`faq-item__button ${isExpanded ? 'faq-item__button--expanded' : ''}`}
                  onClick={() => toggleItem(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, item.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`faq-content-${item.id}`}
                  id={`faq-button-${item.id}`}
                >
                  <span className="faq-item__question">{item.question}</span>
                  {isExpanded ? (
                    <ChevronUp size={20} className="faq-item__chevron" />
                  ) : (
                    <ChevronDown size={20} className="faq-item__chevron" />
                  )}
                </button>
                {isExpanded && (
                  <div
                    className="faq-item__content"
                    id={`faq-content-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-button-${item.id}`}
                  >
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="faq-no-results">
            <p>No questions found matching your search.</p>
          </div>
        )}

        <div className="faq-contact">
          <p>Still need help? We'll add contact options here.</p>
        </div>

        <div className="faq-back">
          <Link href="/" className="faq-back__link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
