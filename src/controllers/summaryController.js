import { generateSummary as generateLocalSummary } from '../utils/aiSummary.js';

/**
 * Summary generation endpoint using local transformers library
 * Uses facebook/bart-large-cnn model via @xenova/transformers
 * Fully local - no API calls, no external services
 */
export const generateSummary = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ 
        error: 'Content is required and must be a string' 
      });
    }

    // Validate that text is not empty
    if (!content.trim()) {
      return res.status(400).json({ 
        error: 'Content cannot be empty' 
      });
    }

    console.log('Generating summary using local transformers (facebook/bart-large-cnn)...');
    
    // Use local summarizer with transformers library
    const summary = await generateLocalSummary(content);
    
    if (!summary || !summary.trim()) {
      return res.status(500).json({ 
        error: 'Summary generation failed - empty result' 
      });
    }

    return res.json({ 
      summary: summary.trim()
    });

  } catch (error) {
    console.error('Summary generation error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return error response
    return res.status(500).json({ 
      error: `Summary generation failed: ${error.message || 'Unknown error'}` 
    });
  }
};

