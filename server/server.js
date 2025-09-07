const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI, GoogleGenerativeAIFetchError } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const { SYSTEM_PROMPT, NSFW_KEYWORDS, NSFW_MESSAGE } = require('./config');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple NSFW checker
function isNSFWText(text) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  return NSFW_KEYWORDS.some(k => t.includes(k));
}

// Middleware: rejects requests with NSFW prompt/question
function nsfwGuard(fieldName) {
  return (req, res, next) => {
    // For JSON and multipart, attempt to read the field
    const value = (req.body && req.body[fieldName]) || '';
    if (isNSFWText(value)) {
      return res.status(400).json({ message: NSFW_MESSAGE });
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

app.post('/api/generate-image', nsfwGuard('prompt'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    // Prepend system prompt to guide safety behavior
    const result = await model.generateContent(`${SYSTEM_PROMPT}\nUser prompt: ${prompt}`);
    const response = await result.response;

    console.log("Full AI Response:", JSON.stringify(response, null, 2));

    if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        
        const imagePart = response.candidates[0].content.parts.find(part => part.fileData || part.inlineData);

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
            console.error("Could not find a part with image data in the response.");
            return res.status(500).json({ message: 'Could not parse image from AI response.' });
        }

    } else {
        console.error("Unexpected AI response structure:", JSON.stringify(response, null, 2));
        const text = response.text();
        console.log("AI Response as text:", text);
        return res.status(500).json({ message: 'AI response did not contain an image.', aiResponse: text });
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

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
