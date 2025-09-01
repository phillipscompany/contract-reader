import { useState } from 'react';
import FileUploader from '../components/FileUploader';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <main style={{ padding: 32 }}>
      <h1>Upload Your Contract</h1>
      <FileUploader onFileSelect={setFile} />
      {file && (
        <div style={{ marginTop: 20 }}>
          <p>File ready: {file.name}</p>
          <button disabled className="btn btn--primary" style={{ marginTop: 10 }}>
            Analyze Contract (coming soon)
          </button>
        </div>
      )}
    </main>
  );
}
