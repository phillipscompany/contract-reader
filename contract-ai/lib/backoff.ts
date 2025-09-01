interface BackoffOptions {
  retries?: number;
  base?: number;
  factor?: number;
  jitter?: boolean;
}

interface RetryableError {
  code: 'RATE_LIMIT' | 'TIMEOUT';
  message: string;
}

function isRetryableError(error: any): error is RetryableError {
  return error?.code === 'RATE_LIMIT' || error?.code === 'TIMEOUT';
}

function calculateDelay(attempt: number, base: number, factor: number, jitter: boolean): number {
  let delay = base * Math.pow(factor, attempt);
  
  if (jitter) {
    // Add ±25% jitter
    const jitterAmount = delay * 0.25;
    delay += (Math.random() * 2 - 1) * jitterAmount;
  }
  
  return Math.max(0, delay);
}

export async function withBackoff<T>(
  fn: () => Promise<T>, 
  options: BackoffOptions = {}
): Promise<T> {
  const { retries = 2, base = 600, factor = 2, jitter = true } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Backoff attempt ${attempt + 1}/${retries + 1}`);
      return await fn();
    } catch (error) {
      // If this is the last attempt, re-throw the error
      if (attempt === retries) {
        console.log(`❌ Final attempt failed, throwing error:`, error);
        throw error;
      }
      
      // Only retry for RATE_LIMIT or TIMEOUT errors
      if (!isRetryableError(error)) {
        console.log(`🚫 Non-retryable error, throwing immediately:`, error);
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateDelay(attempt, base, factor, jitter);
      console.log(`⏳ Retryable error (${error.code}), waiting ${Math.round(delay)}ms before retry...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected error in backoff logic');
}
