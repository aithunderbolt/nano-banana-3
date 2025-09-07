const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI, GoogleGenerativeAIFetchError } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;

    console.log("Full AI Response:", JSON.stringify(response, null, 2));

    if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts[0]) {
        
        const imagePart = response.candidates[0].content.parts[0];
        let imageUrl = '';

        if (imagePart.fileData && imagePart.fileData.fileUri) {
            imageUrl = imagePart.fileData.fileUri;
        } else if (imagePart.inlineData && imagePart.inlineData.data) {
            const mimeType = imagePart.inlineData.mimeType;
            const base64Data = imagePart.inlineData.data;
            imageUrl = `data:${mimeType};base64,${base64Data}`;
        } else {
            console.error("Could not find image URI or data in the response part:", imagePart);
            return res.status(500).json({ message: 'Could not parse image from AI response.' });
        }

        console.log("Extracted Image URL:", imageUrl);
        res.json({ imageUrl: imageUrl });

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

app.post('/api/edit-image', upload.fields([{ name: 'image' }, { name: 'mask' }]), async (req, res) => {
  try {
    const { prompt } = req.body;
    const imagePath = req.files.image[0].path;
    const maskPath = req.files.mask[0].path;

    // This is a simplified representation. The actual API call will be more complex
    // and will require sending the image and mask data as base64 strings or via a file URI.
    // The gemini-2.5-flash-image-preview model's in-painting capabilities would be used here.
    
    // For now, we'll just return a placeholder response.
    console.log(`Received in-painting request with prompt: ${prompt}`);
    console.log(`Image saved at: ${imagePath}`);
    console.log(`Mask saved at: ${maskPath}`);

    // Placeholder for actual image editing logic
    const editedImageUrl = "https://via.placeholder.com/512x512.png?text=Edited+Image";

    res.json({ imageUrl: editedImageUrl });

  } catch (error) {
    console.error('Error editing image:', error);
    res.status(500).json({ message: 'Error editing image', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
