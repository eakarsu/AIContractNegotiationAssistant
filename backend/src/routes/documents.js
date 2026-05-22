const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const SYSTEM_PROMPT = 'You are an expert contract negotiation attorney with deep knowledge of commercial law, deal structuring, and negotiation strategy.';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

// In-memory document store (replace with DB in production)
const documents = new Map();
let docIdCounter = 1;

// Configure multer storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

function extractTextFromFile(filePath, mimeType, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  // For plain text files, read directly
  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }
  // For PDF/DOC files, return placeholder (production would use pdf-parse or mammoth)
  return `[Document uploaded: ${originalName}. Text extraction for ${ext} files requires additional processing. The document has been stored and can be analyzed with its metadata.]`;
}

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    const { description, tags } = req.body;

    let extractedText = null;
    try {
      extractedText = extractTextFromFile(filePath, mimetype, originalname);
    } catch (e) {
      // Text extraction failed; still accept upload
      extractedText = null;
    }

    const docId = docIdCounter++;
    const doc = {
      id: docId,
      originalName: originalname,
      filename,
      filePath,
      size,
      mimetype,
      description: description || null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      extractedText,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user ? req.user.userId : null
    };

    documents.set(docId, doc);

    res.status(201).json({
      success: true,
      document: {
        id: doc.id,
        originalName: doc.originalName,
        size: doc.size,
        description: doc.description,
        tags: doc.tags,
        hasExtractedText: !!extractedText,
        uploadedAt: doc.uploadedAt
      }
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 20MB.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id/ai-analyze
router.get('/:id/ai-analyze', aiRateLimiter, async (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const doc = documents.get(docId);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const textToAnalyze = doc.extractedText || `Document: ${doc.originalName} (text not extractable)`;

    const userMessage = `Perform a comprehensive AI contract analysis on the following document:

Document Name: ${doc.originalName}
Description: ${doc.description || 'Not provided'}
Upload Date: ${doc.uploadedAt}

Document Content:
${textToAnalyze}

Provide a thorough analysis including:
1. EXECUTIVE SUMMARY: Brief overview of the contract/document
2. CONTRACT TYPE & PURPOSE: What this document is and its primary purpose
3. KEY PARTIES: Who are the parties and their roles
4. CRITICAL TERMS: Most important provisions and their implications
5. OBLIGATIONS: What each party must do
6. RISK ASSESSMENT:
   - Overall risk level (Low/Medium/High)
   - Top 5 risk areas with explanation
7. FINANCIAL TERMS: Payment obligations, penalties, indemnities
8. TIME-SENSITIVE PROVISIONS: Deadlines, notice periods, termination dates
9. MISSING CLAUSES: Standard provisions that appear to be absent
10. NEGOTIATION OPPORTUNITIES: Areas where terms could be improved
11. RED FLAGS: Clauses that require immediate attention or legal review
12. RECOMMENDATIONS: Specific actions to take before signing`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Contract Negotiation Assistant'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errBody}`);
    }

    const aiResult = await response.json();
    if (!aiResult.choices || !aiResult.choices[0]) {
      throw new Error('Invalid response from AI');
    }

    res.json({
      success: true,
      documentId: docId,
      documentName: doc.originalName,
      analysis: aiResult.choices[0].message.content,
      analyzedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents - list uploaded documents
router.get('/', (req, res) => {
  const list = Array.from(documents.values()).map(d => ({
    id: d.id,
    originalName: d.originalName,
    size: d.size,
    description: d.description,
    tags: d.tags,
    hasExtractedText: !!d.extractedText,
    uploadedAt: d.uploadedAt,
    uploadedBy: d.uploadedBy
  }));
  res.json(list);
});

// GET /api/documents/:id
router.get('/:id', (req, res) => {
  const docId = parseInt(req.params.id);
  const doc = documents.get(docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({
    id: doc.id,
    originalName: doc.originalName,
    size: doc.size,
    description: doc.description,
    tags: doc.tags,
    hasExtractedText: !!doc.extractedText,
    uploadedAt: doc.uploadedAt
  });
});

// DELETE /api/documents/:id
router.delete('/:id', (req, res) => {
  const docId = parseInt(req.params.id);
  const doc = documents.get(docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  try {
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
  } catch (e) {
    // ignore file deletion errors
  }

  documents.delete(docId);
  res.json({ message: 'Document deleted successfully' });
});

module.exports = router;
