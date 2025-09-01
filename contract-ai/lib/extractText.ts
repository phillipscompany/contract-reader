import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const fileExtension = filename.toLowerCase().split('.').pop();
  
  if (fileExtension === 'pdf') {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to extract text from PDF');
    }
  }
  
  if (fileExtension === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to extract text from DOCX');
    }
  }
  
  throw new Error('Unsupported file type');
}
