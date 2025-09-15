const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI, GoogleGenerativeAIFetchError } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const { Pool } = require('pg');
const { SYSTEM_PROMPT, NSFW_KEYWORDS, NSFW_MESSAGE } = require('./config');
const { sso } = require('node-expose-sspi');

dotenv.config();

const app = express();
const port = process.env.PORT || 5200;

// Enable CORS with credentials for cross-origin requests (required for IWA in some setups)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Apply Windows SSO to all API endpoints to block unauthenticated access
app.use('/api', sso.auth());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// PostgreSQL connection pool (configure via env: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)
let pgPool = null;
const enablePg = !!process.env.PGHOST; // enable only when configured
if (enablePg) {
  pgPool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  // Ensure prompts table exists
  (async () => {
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS prompts (
          id SERIAL PRIMARY KEY,
          username TEXT,
          domain TEXT,
          route TEXT NOT NULL,
          prompt TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      console.log('PostgreSQL: prompts table is ready');
    } catch (err) {
      console.error('PostgreSQL initialization error:', err);
    }
  })();
} else {
  console.log('PostgreSQL logging disabled (PGHOST not set).');
}

function getUserFromReq(req) {
  const u = (req.sso && req.sso.user) || {};
  return {
    username: u.name || null,
    domain: u.domain || null,
  };
}

async function logPrompt(req, route, promptText) {
  try {
    if (!pgPool) return; // no-op when PG not configured
    const { username, domain } = getUserFromReq(req);
    if (!promptText) return; // nothing to log
    await pgPool.query(
      'INSERT INTO prompts (username, domain, route, prompt) VALUES ($1, $2, $3, $4)',
      [username, domain, route, String(promptText)]
    );
  } catch (err) {
    console.error('Failed to log prompt:', err);
  }
}

// Simple NSFW checker - returns the matched keyword or null
function isNSFWText(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  for (const k of NSFW_KEYWORDS) {
    if (t.includes(k)) return k; // naive match; debug visibility only
  }
  return null;
}

// Middleware: rejects requests with NSFW prompt/question
function nsfwGuard(fieldName) {
  return (req, res, next) => {
    // For JSON and multipart, attempt to read the field
    const value = (req.body && req.body[fieldName]) || '';
    const matched = isNSFWText(value);
    if (matched) {
      console.warn('NSFW precheck blocked request. Matched keyword:', matched);
      const payload = { message: NSFW_MESSAGE };
      if (process.env.NODE_ENV !== 'production') {
        payload.matched = matched;
      }
      return res.status(400).json(payload);
    }
    next();
  };
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.get('/', (req, res) => {
  res.send('AI Photo Editor Server is running!');
});

// Return authenticated Windows user info
app.get('/api/me', (req, res) => {
  try {
    // node-expose-sspi populates req.sso with user information
    const user = (req.sso && req.sso.user) || null;

    if (!user) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    // Normalize a minimal, stable shape for the client
    const normalized = {
      authenticated: true,
      domain: user.domain || null,
      name: user.name || null,
      displayName: user.displayName || null,
      sid: user.sid || null,
    };

    return res.json(normalized);
  } catch (e) {
    console.error('Error reading Windows user info:', e);
    return res.status(500).json({ authenticated: false, error: 'Failed to read user info' });
  }
});

app.post('/api/generate-image', nsfwGuard('prompt'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Log user and prompt
    await logPrompt(req, '/api/generate-image', prompt);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    // Prepend system prompt to guide safety behavior
    const result = await model.generateContent(`${SYSTEM_PROMPT}\nUser prompt: ${prompt}`);
    const response = await result.response;

    console.log("Full AI Response:", JSON.stringify(response, null, 2));

    if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        const parts = response.candidates[0].content.parts;
        const imagePart = parts.find(part => part.fileData || part.inlineData);
        const aiText = typeof response.text === 'function' ? response.text() : '';

        if (imagePart) {
            let imageUrl = '';
            if (imagePart.fileData && imagePart.fileData.fileUri) {
                imageUrl = imagePart.fileData.fileUri;
            } else if (imagePart.inlineData && imagePart.inlineData.data) {
                const mimeType = imagePart.inlineData.mimeType;
                const base64Data = imagePart.inlineData.data;
                imageUrl = `data:${mimeType};base64,${base64Data}`;
            }
            console.log("Extracted Image URL:", imageUrl);
            return res.json({ imageUrl: imageUrl });
        } else {
            // Model did not provide image data. Bubble up any textual reason for better UX.
            const message = aiText || 'Model returned no image content for this prompt.';
            console.warn('No image in AI response. Textual response:', message);
            return res.status(400).json({ message });
        }

    } else {
        console.error("Unexpected AI response structure:", JSON.stringify(response, null, 2));
        const text = typeof response?.text === 'function' ? response.text() : '';
        console.log("AI Response as text:", text);
        return res.status(400).json({ message: text || 'AI response did not contain an image.' });
    }

  } catch (error) {
    if (error instanceof GoogleGenerativeAIFetchError) {
      if (error.status === 429) {
        console.error('Quota exceeded:', error.message);
        return res.status(429).json({ message: 'You have exceeded your API request quota. Please check your plan and billing details, or try again later.' });
      }
      if (error.status === 404) {
        console.error('Model not found:', error.message);
        return res.status(404).json({ message: 'The specified model is not available. Please check the model name.' });
      }
    }
    console.error('Error communicating with AI:', error);
    res.status(500).json({ message: 'An unexpected error occurred while communicating with the AI.', error: error.message });
  }
});

app.post('/api/edit-image', upload.fields([{ name: 'image' }, { name: 'mask' }]), nsfwGuard('prompt'), async (req, res) => {
  const imagePath = req.files.image[0].path;
  const maskPath = req.files.mask[0].path;

  try {
    const { prompt } = req.body;
    if (!prompt || !imagePath || !maskPath) {
      return res.status(400).json({ message: 'Prompt, image, and mask are required.' });
    }

    // Log user and prompt
    await logPrompt(req, '/api/edit-image', prompt);

    const imageBuffer = fs.readFileSync(imagePath);
    const maskBuffer = fs.readFileSync(maskPath);

    const imageBase64 = imageBuffer.toString('base64');
    const maskBase64 = maskBuffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    const requestBody = {
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64
              }
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: maskBase64
              }
            }
          ]
        }
      ]
    };

    const result = await model.generateContent(requestBody);
    const response = await result.response;

    console.log("Full AI In-painting Response:", JSON.stringify(response, null, 2));

    if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        const imagePart = response.candidates[0].content.parts.find(part => part.inlineData);
        if (imagePart) {
            const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            res.json({ imageUrl: imageUrl });
        } else {
            res.status(500).json({ message: 'Could not parse edited image from AI response.' });
        }
    } else {
        res.status(500).json({ message: 'Unexpected AI response structure for in-painting.' });
    }

  } catch (error) {
    console.error('Error editing image:', error);
    res.status(500).json({ message: 'Error editing image', error: error.message });
  } finally {
    // Clean up uploaded files
    fs.unlinkSync(imagePath);
    fs.unlinkSync(maskPath);
  }
});

app.post('/api/understand-image', upload.single('image'), nsfwGuard('question'), async (req, res) => {
  const imagePath = req.file.path;

  try {
    const { question } = req.body;
    if (!question || !imagePath) {
      return res.status(400).json({ message: 'Question and image are required.' });
    }

    // Log user and question as prompt text
    await logPrompt(req, '/api/understand-image', question);

    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    const requestBody = {
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            { text: question },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64
              }
            }
          ]
        }
      ]
    };

    const result = await model.generateContent(requestBody);
    const response = await result.response;
    const answer = response.text();

    console.log("Image Understanding Response:", answer);
    res.json({ answer: answer });

  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ message: 'Error analyzing image', error: error.message });
  } finally {
    // Clean up uploaded file
    fs.unlinkSync(imagePath);
  }
});

// Combine two images using the same Gemini model
app.post('/api/combine-images', upload.fields([{ name: 'image1' }, { name: 'image2' }]), nsfwGuard('prompt'), async (req, res) => {
  const img1 = req.files?.image1?.[0]?.path;
  const img2 = req.files?.image2?.[0]?.path;

  try {
    const { prompt } = req.body;
    if (!prompt || !img1 || !img2) {
      return res.status(400).json({ message: 'Prompt, image1, and image2 are required.' });
    }

    // Log user and prompt
    await logPrompt(req, '/api/combine-images', prompt);

    const b1 = fs.readFileSync(img1);
    const b2 = fs.readFileSync(img2);
    const i1 = b1.toString('base64');
    const i2 = b2.toString('base64');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    const requestBody = {
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            { text: prompt },
            { inlineData: { mimeType: 'image/png', data: i1 } },
            { inlineData: { mimeType: 'image/png', data: i2 } },
          ],
        },
      ],
    };

    const result = await model.generateContent(requestBody);
    const response = await result.response;

    console.log('Full AI Combine Response:', JSON.stringify(response, null, 2));

    if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      const imagePart = response.candidates[0].content.parts.find(part => part.inlineData);
      if (imagePart) {
        const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        return res.json({ imageUrl });
      }
      return res.status(500).json({ message: 'Could not parse combined image from AI response.' });
    }

    return res.status(500).json({ message: 'Unexpected AI response structure for combining images.' });
  } catch (error) {
    console.error('Error combining images:', error);
    return res.status(500).json({ message: 'Error combining images', error: error.message });
  } finally {
    try { if (img1) fs.unlinkSync(img1); } catch (_) {}
    try { if (img2) fs.unlinkSync(img2); } catch (_) {}
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
