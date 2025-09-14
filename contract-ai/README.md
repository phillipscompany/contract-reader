# Contract AI – "Understand Any Contract in Plain English"

**What it is:** A Next.js web application that analyzes legal contracts (leases, service agreements, NDAs, employment contracts, etc.) and explains them in plain English. Users upload PDF or DOCX files, and the app uses AI to extract key information, identify risks, and generate comprehensive summaries with specific analysis for each risk category.

## 🎯 Current Functionality

The application performs the following process:
1. **User Intake**: Collects user email, location, and contract type via modal
2. **File Upload**: Users upload PDF/DOCX contracts via drag-and-drop interface
3. **Text Extraction**: Extracts raw text from uploaded documents using specialized libraries
4. **AI Analysis**: Uses OpenAI GPT-4o-mini to analyze the contract with structured prompts
5. **Risk Assessment**: Identifies and analyzes specific risks based on contract type
6. **Structured Output**: Generates comprehensive summaries with detailed risk analysis
7. **PDF Export**: Allows users to download analysis results as formatted PDFs

## 🏗️ Technical Architecture

### Framework & Dependencies
- **Next.js 15.5.2** - React framework with API routes
- **TypeScript** - Type-safe development
- **OpenAI API** - GPT-4o-mini for contract analysis
- **PDF Processing** - `pdf-parse` for PDF text extraction
- **DOCX Processing** - `mammoth` for Word document text extraction
- **PDF Generation** - `jspdf` for creating downloadable PDF reports
- **File Upload** - `formidable` for handling multipart form data
- **UI Components** - `lucide-react` for icons

### Project Structure

```
contract-ai/
├── pages/                          # Next.js pages and API routes
│   ├── index.tsx                   # Landing page with file upload and intake modal
│   ├── upload.tsx                  # Upload processing page (redirects to results)
│   ├── results.tsx                 # Analysis results display
│   ├── pricing.tsx                 # Pricing information
│   ├── faq.tsx                     # Frequently asked questions
│   ├── terms.tsx                   # Terms of service
│   ├── privacy.tsx                 # Privacy policy
│   ├── disclaimer.tsx              # Legal disclaimer
│   ├── feedback.tsx                # User feedback form
│   └── api/                        # Backend API endpoints
│       ├── analyze.ts              # Main contract analysis endpoint
│       ├── checkout.ts             # Stripe payment processing
│       ├── stripe-webhook.ts       # Stripe webhook handler
│       ├── health.ts               # Health check endpoint
│       ├── openai-health.ts        # OpenAI API health check
│       └── test-errors.ts          # Error testing endpoint
├── components/                     # React components
│   ├── FileUploader.tsx            # Drag-and-drop file upload
│   ├── IntakeModal.tsx             # User information collection
│   ├── ContractSummary.tsx         # Contract summary display
│   ├── ResultsView.tsx             # Results page layout
│   ├── ResultsDemo.tsx             # Demo results display
│   ├── ResultsFull.tsx             # Full analysis results
│   ├── BucketPreview.tsx           # Risk bucket preview
│   ├── PricingTable.tsx            # Pricing information table
│   ├── Navbar.tsx                  # Navigation component
│   ├── Footer.tsx                  # Footer component
│   ├── Layout.tsx                  # Page layout wrapper
│   ├── Spinner.tsx                 # Loading spinner
│   ├── TrustedBy.tsx               # Social proof component
│   ├── EarlyStageBanner.tsx        # Early stage notice
│   └── Reviews.tsx                 # User reviews display
├── lib/                           # Core business logic
│   ├── summarizeContract.ts        # Main AI analysis engine
│   ├── extractText.ts              # Text extraction from files
│   ├── pdf.ts                      # PDF generation utilities
│   ├── riskDetect.ts               # Risk detection algorithms
│   ├── riskBuckets.ts              # Risk bucket management
│   ├── riskTaxonomy.ts             # Risk taxonomy definitions
│   ├── buckets.ts                  # Bucket definition loader
│   ├── validators.ts               # Input validation utilities
│   ├── stripe.ts                   # Stripe payment integration
│   ├── base64.ts                   # Base64 encoding utilities
│   ├── backoff.ts                  # Retry logic with exponential backoff
│   ├── highlights.ts               # Text highlighting utilities
│   └── simplifyText.ts             # Text simplification utilities
├── data/                          # Static data files
│   ├── bucketDefs.json            # Risk bucket definitions by contract type
│   ├── riskBuckets.json           # Risk bucket structure
│   └── riskTaxonomy.json          # Risk taxonomy with keywords
├── styles/                        # Global styles
│   └── globals.css                # Global CSS styles
├── public/                        # Static assets
│   └── favicon.ico                # Site favicon
└── Configuration files
    ├── package.json               # Dependencies and scripts
    ├── next.config.js             # Next.js configuration
    ├── tsconfig.json              # TypeScript configuration
    └── .env.local                 # Environment variables
```

## 🔄 Current Data Flow & Process

### 1. User Intake Process
```
User visits site → IntakeModal.tsx → Collects email, location, contract type → localStorage
```

**Files involved:**
- `components/IntakeModal.tsx` - Collects user email, location, and contract type
- `pages/index.tsx` - Shows intake modal on first visit, stores data in localStorage

### 2. File Upload Process
```
User selects file → FileUploader.tsx → Validates file → Uploads to /api/analyze
```

**Files involved:**
- `components/FileUploader.tsx` - Handles drag-and-drop file selection and validation
- `pages/index.tsx` - Orchestrates the upload flow

### 3. File Processing Pipeline
```
PDF/DOCX → extractText.ts → sanitizeText() → summarizeContract.ts → AI Analysis
```

**Files involved:**
- `lib/extractText.ts` - Extracts text from PDF (pdf-parse) and DOCX (mammoth)
- `pages/api/analyze.ts` - Main API endpoint that orchestrates the analysis
- `lib/summarizeContract.ts` - Core AI analysis engine

### 4. AI Analysis Engine
```
Contract Text → Contract Type Detection → Risk Buckets → OpenAI GPT-4o-mini → Structured JSON Response
```

**Files involved:**
- `lib/summarizeContract.ts` - Contains the main analysis logic and contract type detection
- `data/bucketDefs.json` - Defines risk categories for each contract type
- `lib/buckets.ts` - Loads and manages bucket definitions
- `lib/riskDetect.ts` - Validates AI responses using keyword detection

### 5. Risk Analysis System
```
Contract Type → Risk Buckets → AI Analysis → Risk Detection Validation → Enhanced Results
```

**Files involved:**
- `data/riskBuckets.json` - Defines risk bucket structure
- `lib/riskBuckets.ts` - Loads and manages risk bucket definitions
- `data/riskTaxonomy.json` - Contains risk keywords for detection
- `lib/riskTaxonomy.ts` - Manages risk taxonomy data
- `lib/riskDetect.ts` - Validates AI responses against known risk patterns

### 6. Results Display & Export
```
Analysis Results → ResultsView.tsx → PDF Generation → User Download
```

**Files involved:**
- `pages/results.tsx` - Main results page
- `components/ResultsView.tsx` - Results layout component
- `components/ResultsFull.tsx` - Full analysis display
- `lib/pdf.ts` - Generates downloadable PDF reports

## 📊 Contract Types & Risk Categories

The system supports 6 contract types, each with specific risk categories:

### 1. Residential Lease
- **Money**: Rent increases, deposits, fees, utilities
- **Dates & Timelines**: Break clauses, renewal notices, landlord entry
- **Responsibilities**: Repairs, pets/alterations, parking rules, insurance
- **Safety & Standards**: Habitability and safety requirements
- **Legal & Disputes**: Subletting, disputes and jurisdiction

### 2. Freelance / Services
- **Scope & Delivery**: Scope, acceptance criteria, change control, timelines
- **Money**: Payment terms, expenses
- **Rights & Restrictions**: IP ownership, moral rights, confidentiality, non-compete
- **Risk & Termination**: Termination, liability, warranties, contractor status

### 3. NDA (Non-Disclosure Agreement)
- **Confidentiality**: Definition, scope, exclusions
- **Obligations**: Non-disclosure, non-use, return of materials
- **Duration**: Term, survival clauses
- **Remedies**: Injunctive relief, damages, enforcement

### 4. Employment Contract
- **Role & Terms**: Job title, duties, reporting structure
- **Compensation**: Salary, benefits, bonuses, expenses
- **Time & Location**: Hours, remote work, travel
- **Rights & Restrictions**: IP, confidentiality, non-compete, non-solicit

### 5. Business Services
- **Service Delivery**: SLA, uptime, performance metrics
- **Financial**: Pricing, payment terms, auto-renewal
- **Risk Management**: Liability caps, indemnification, warranties
- **Termination**: Notice periods, data return, transition

### 6. Other
- Generic contract analysis with standard risk categories

## 🤖 AI Analysis Process

### Contract Type Detection
The system automatically detects contract type with confidence scoring:
- **User Selection**: Users choose contract type during intake
- **AI Detection**: System validates user selection with AI analysis
- **Confidence Scoring**: High-confidence AI detection (≥0.80) can override user selection

### Analysis Output Structure
```typescript
interface FullResult {
  executiveSummary: string;           // Comprehensive contract overview
  partiesAndPurpose: string;          // Who's involved and why
  keyClauses: Array<{                 // Important clauses explained
    clause: string;
    explanation: string;
  }>;
  obligations: string[];              // User's duties and requirements
  paymentsAndCosts: string[];         // Financial obligations
  renewalAndTermination: string[];    // Contract lifecycle terms
  liabilityAndRisks: Array<{          // Risk analysis
    clause: string;
    whyItMatters: string;
    howItAffectsYou: string;
  }>;
  buckets: Array<{                    // Detailed risk analysis
    bucketName: string;
    risks: Array<{
      riskId: string;
      riskName: string;
      mentioned: boolean;
      keyInfo: string;                // Short plain-English sentence if mentioned
    }>;
  }>;
  professionalAdviceNote: string;     // Legal disclaimer
  intakeContractType: string;         // User's original selection
  detectedContractType: {             // AI's detection result
    label: string;
    confidence: number;
  };
  finalContractType: string;          // Final contract type used
}
```

## 🔍 Risk Detection & Validation

### Dual-Layer Risk Detection
1. **AI Analysis**: GPT-4o-mini analyzes contract text and identifies risks
2. **Keyword Validation**: System validates AI responses using predefined keywords

**Files involved:**
- `lib/riskDetect.ts` - Contains keyword-based risk detection
- `data/riskTaxonomy.json` - Stores keywords for each risk category
- `lib/summarizeContract.ts` - Enhances AI results with validation

### Risk Enhancement Process
```typescript
// If AI says risk is not mentioned but keywords are detected
if (detectedMentioned && !risk.mentioned) {
  risk.mentioned = true;
  console.log(`Risk detection: Flipped ${riskId} to mentioned`);
}
```

## 💳 Payment Integration

### Stripe Integration
- **Checkout**: `pages/api/checkout.ts` - Creates Stripe checkout sessions
- **Webhooks**: `pages/api/stripe-webhook.ts` - Handles payment confirmations
- **Pricing**: $5 per full contract analysis

**Files involved:**
- `lib/stripe.ts` - Stripe configuration and utilities
- `components/PricingTable.tsx` - Pricing display component

## 🛡️ Security & Privacy

### File Handling
- **Validation**: MIME type and file size validation (5MB limit)
- **Processing**: In-memory processing only, no persistent storage
- **Cleanup**: Files deleted immediately after analysis
- **Sanitization**: URLs, emails, and law firm names removed from text

### API Security
- **Rate Limiting**: Built into OpenAI API calls
- **Error Handling**: Standardized error responses
- **Input Validation**: File type and size validation
- **Environment Variables**: Sensitive data stored in `.env.local`

## 🚀 Development & Deployment

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add OPENAI_API_KEY and STRIPE keys

# Run development server
npm run dev
# Visit http://localhost:3000
```

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📈 Performance & Monitoring

### API Endpoints
- `/api/health` - Basic health check
- `/api/openai-health` - OpenAI API connectivity check
- `/api/analyze` - Main contract analysis (20-40 second processing time)

### Error Handling
- **Retry Logic**: Exponential backoff for API failures
- **Fallback Analysis**: Meaningful defaults when AI responses are incomplete
- **User Feedback**: Error messages and recovery suggestions

### Logging
- **Debug Logging**: Contract type detection, role selection, bucket loading
- **Performance Tracking**: API response times and token usage
- **Error Tracking**: Failed analyses and retry attempts

## 🔧 Key Features

### Smart Contract Type Detection
- **User Selection**: Users choose contract type during intake
- **AI Detection**: System validates user selection with AI analysis
- **Confidence Scoring**: High-confidence AI detection can override user selection

### Comprehensive Risk Analysis
- **Risk Identification**: Each risk is marked as mentioned or not mentioned
- **Key Information**: Short plain-English explanations for mentioned risks
- **Bucket Organization**: Risks grouped by category (Money, Dates, Responsibilities, etc.)

### PDF Export
- **Formatted Reports**: Professional PDF layout with all analysis sections
- **Complete Analysis**: All sections included in downloadable format
- **Metadata**: Timestamp, filename, and analysis details included

### User Experience
- **Intake Modal**: Collects user information on first visit
- **Drag-and-Drop Upload**: Easy file upload interface
- **Real-time Processing**: Shows progress during analysis
- **Comprehensive Results**: Detailed analysis with risk breakdown

## 📝 Current Limitations

- **No Role-Based Analysis**: Currently uses generic prompts for all contract types
- **Simple Risk Analysis**: Only shows "mentioned" or "not mentioned" with basic key info
- **No Payment Gating**: All analysis is currently free (Stripe integration exists but not enforced)
- **Basic Error Handling**: Limited retry logic and error recovery

This system provides a functional, AI-powered contract analysis platform that transforms complex legal documents into understandable, actionable insights for users across different contract types.