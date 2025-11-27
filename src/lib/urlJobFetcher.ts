/**
 * Fetch and extract job description from a URL
 * Supports: LinkedIn, Indeed, Arbetsförmedlingen (Platsbanken), Academedia, Teamtailor, Workbuster
 */
export async function fetchJobDescriptionFromURL(url: string): Promise<string> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // Use a CORS proxy for fetching external content
    // Note: In production, this should be done through a backend endpoint
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract job description based on common patterns
    let jobText = extractJobText(html, urlObj.hostname);
    
    if (!jobText || jobText.trim().length < 100) {
      throw new Error('Could not extract job description from URL');
    }
    
    return jobText;
  } catch (error) {
    console.error('Error fetching job from URL:', error);
    throw new Error('Failed to fetch job description from URL. Please copy and paste the text instead.');
  }
}

/**
 * Extract job text from HTML content
 */
function extractJobText(html: string, hostname: string): string {
  // Remove script and style tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  // Try to extract relevant sections based on common keywords
  const sections = [];
  const keywords = [
    'job description', 'about the role', 'responsibilities', 'requirements',
    'qualifications', 'about you', 'what we offer', 'benefits',
    'arbetsuppgifter', 'kvalifikationer', 'erfarenhet', 'vi söker'
  ];
  
  // Split by common section headers and filter
  const lines = cleaned.split('\n');
  let relevantText = '';
  let capturing = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Start capturing if we hit a job-related keyword
    if (keywords.some(kw => lowerLine.includes(kw))) {
      capturing = true;
    }
    
    // Stop capturing at footer/irrelevant sections
    if (lowerLine.includes('cookie') || 
        lowerLine.includes('privacy policy') ||
        lowerLine.includes('terms of service') ||
        lowerLine.includes('copyright')) {
      capturing = false;
    }
    
    if (capturing && line.trim().length > 20) {
      relevantText += line + '\n';
    }
  }
  
  // If we didn't capture enough, return a cleaned version of the full text
  if (relevantText.length < 200) {
    // Take middle portion of text (skip navigation/footer)
    const start = Math.floor(cleaned.length * 0.1);
    const end = Math.floor(cleaned.length * 0.8);
    relevantText = cleaned.substring(start, end);
  }
  
  // Limit length
  if (relevantText.length > 10000) {
    relevantText = relevantText.substring(0, 10000) + '...';
  }
  
  return relevantText.trim();
}

/**
 * Check if a string is a valid URL
 */
export function isValidURL(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
