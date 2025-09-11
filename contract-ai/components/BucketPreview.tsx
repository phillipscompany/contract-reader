import React from 'react';
import type { FullResult } from '../lib/summarizeContract';

interface BucketPreviewProps {
  buckets: FullResult['buckets'];
}

export default function BucketPreview({ buckets }: BucketPreviewProps) {
  // Debug logging
  console.log('BucketPreview received buckets:', buckets);
  
  if (!buckets || buckets.length === 0) {
    return (
      <div className="bucket-preview">
        <p>No risk information available.</p>
        <p>Debug: buckets = {JSON.stringify(buckets)}</p>
      </div>
    );
  }

  // Filter out buckets with no risks
  const bucketsWithRisks = buckets.filter(bucket => bucket.risks && bucket.risks.length > 0);

  if (bucketsWithRisks.length === 0) {
    return (
      <div className="bucket-preview">
        <p>No risk information available.</p>
        <p>Debug: All buckets are empty</p>
      </div>
    );
  }

  return (
    <div className="bucket-preview">
      <div className="bucket-preview__grid">
        {bucketsWithRisks.map((bucket, bucketIndex) => (
          <div key={bucketIndex} className="bucket-card">
            <h4 className="bucket-card__title">{bucket.bucketName}</h4>
            
            <div className="bucket-card__risks">
              {bucket.risks.map((risk, riskIndex) => (
                <div key={riskIndex} className="risk-item">
                  <span className="risk-item__name">{risk.riskName}</span>
                  <span 
                    className={`risk-item__status risk-item__status--${risk.mentioned ? 'mentioned' : 'not-mentioned'}`}
                  >
                    {risk.mentioned ? 'Mentioned' : 'Not\u00A0mentioned'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}