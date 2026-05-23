// Vercel Web Analytics initialization
// This script uses the @vercel/analytics package to track page views
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject({
  mode: 'auto', // auto-detect environment (production vs development)
  debug: false  // set to true to see console logs in development
});