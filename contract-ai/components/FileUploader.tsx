import { useState, useRef } from 'react';

interface Props {
  onFileSelect: (file: File) => void;
}

export default function FileUploader({ onFileSelect }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files.length === 0) return;
    validateAndSetFile(e.dataTransfer.files[0]);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    validateAndSetFile(e.target.files[0]);
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  function validateAndSetFile(file: File) {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF and DOCX files are allowed');
      setFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5 MB');
      setFile(null);
      return;
    }
    setFile(file);
    setError(null);
    onFileSelect(file);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={handleClick}
      className="uploader"
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".pdf,.docx" 
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      {file ? (
        <p>{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
      ) : (
        <p>Drag & drop your contract here, or click to browse</p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
