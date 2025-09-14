import { useState } from 'react';

interface IntakeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { email: string; location: { country: string; region: string }; contractType: string; role: string }) => void;
}

export default function IntakeModal({ open, onClose, onSave }: IntakeModalProps) {
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [contractType, setContractType] = useState('');
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState<{ email?: string; country?: string; contractType?: string; role?: string }>({});

  const countries = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'India',
    'Other'
  ];

  const contractTypes = [
    'Residential Lease',
    'Freelance / Services',
    'Employment Contract',
    'NDA (Non-Disclosure Agreement)',
    'Business Services',
    'Other'
  ];

  const getRolesForContractType = (contractType: string): string[] => {
    switch (contractType) {
      case 'Residential Lease':
        return ['Tenant', 'Landlord'];
      case 'Freelance / Services':
        return ['Freelancer/Contractor', 'Client/Company'];
      case 'Employment Contract':
        return ['Employee', 'Employer'];
      case 'NDA (Non-Disclosure Agreement)':
        return ['Disclosing Party', 'Receiving Party'];
      case 'Business Services':
        return ['Service Provider', 'Client/Customer'];
      case 'Other':
        return ['Party A', 'Party B'];
      default:
        return [];
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = () => {
    const newErrors: { email?: string; country?: string; contractType?: string; role?: string } = {};

    // Validate email (optional)
    if (email.trim() && !validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate country (required)
    if (!country) {
      newErrors.country = 'Please select a country';
    }

    // Validate contract type (required)
    if (!contractType) {
      newErrors.contractType = 'Please select a contract type';
    }

    // Validate role (required)
    if (!role) {
      newErrors.role = 'Please select your role';
    }

    setErrors(newErrors);

    // If no errors, save and close
    if (Object.keys(newErrors).length === 0) {
      onSave({
        email: email.trim(),
        location: {
          country: country,
          region: region.trim()
        },
        contractType: contractType,
        role: role
      });
      handleClose();
    }
  };

  const handleSkip = () => {
    onSave({
      email: '',
      location: {
        country: 'Other',
        region: ''
      },
      contractType: 'Other',
      role: 'Party A'
    });
    handleClose();
  };

  const handleClose = () => {
    setEmail('');
    setCountry('');
    setRegion('');
    setContractType('');
    setRole('');
    setErrors({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={handleClose}></div>
      <div className="modal__card">
        <h2 className="modal__title">Tell us about your contract</h2>
        <p style={{ 
          color: 'var(--muted)', 
          fontSize: '14px', 
          margin: '0 0 24px 0',
          lineHeight: '1.5'
        }}>
          We use this to tailor your analysis and (optionally) contact you. We don't store your documents.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email Field */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: 'var(--text)'
            }}>
              Email <span style={{ color: 'var(--muted)', fontWeight: '400' }}>(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${errors.email ? '#ef4444' : 'var(--border)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                boxSizing: 'border-box'
              }}
            />
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Country Field */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: 'var(--text)'
            }}>
              Country <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${errors.country ? '#ef4444' : 'var(--border)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="">Select country...</option>
              {countries.map((countryOption) => (
                <option key={countryOption} value={countryOption}>
                  {countryOption}
                </option>
              ))}
            </select>
            {errors.country && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.country}
              </p>
            )}
          </div>

          {/* Region Field */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: 'var(--text)'
            }}>
              City/State/Region <span style={{ color: 'var(--muted)', fontWeight: '400' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="City, State, or Region"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Contract Type Field */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: 'var(--text)'
            }}>
              Contract Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${errors.contractType ? '#ef4444' : 'var(--border)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="">Select contract type...</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <p style={{ 
              color: 'var(--muted)', 
              fontSize: '12px', 
              margin: '6px 0 0 0',
              lineHeight: '1.4'
            }}>
              💡 <strong>Business Services</strong> = MSAs, SaaS, vendor/supplier agreements.
            </p>
            {errors.contractType && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.contractType}
              </p>
            )}
          </div>

          {/* Role Field */}
          {contractType && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                Your Role <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${errors.role ? '#ef4444' : 'var(--border)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select your role...</option>
                {getRolesForContractType(contractType).map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {errors.role}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="modal__actions">
          <button
            onClick={handleSave}
            className="btn btn--primary"
            style={{ minWidth: '140px' }}
          >
            Save and continue
          </button>
          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '8px 0'
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
