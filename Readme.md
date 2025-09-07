### Project Plan: AI Photo Editor

This document outlines the plan for building an AI-powered photo editor web application.

#### 1. Core Technologies

*   **AI Model:** Google's `gemini-2.5-flash-image-preview` for image editing tasks.
*   **Backend:** Node.js with Express.js to create a server that communicates with the Google AI API.
*   **Frontend:** React (using Vite for a fast development environment) to build the user interface.
*   **API Key Management:** The Google AI API key will be stored in a `.env` file on the server for security.

#### 2. Project Structure

The project will be organized into two main folders to keep the client and server code separate:

```
/
|-- client/         # React frontend application
|-- server/         # Node.js backend server
|-- Readme.md       # This file
```

#### 3. Development Phases and Features

I will implement the features one by one.

*   **Phase 1: Project Setup**
    *   Set up the directory structure.
    *   Initialize the Node.js server with Express.
    *   Initialize the React client with Vite.
    *   Establish communication between the client and server.
    *   Set up the API key handling on the server.

*   **Phase 2: Basic Image Editing - Text-to-Image Generation**
    *   Create a UI on the client to input a text prompt.
    *   Implement a server endpoint that takes the prompt and uses the Gemini API to generate an image.
    *   Display the generated image on the client.

*   **Phase 3: Image Editing - In-painting (Object Removal/Replacement)**
    *   Enhance the UI to allow users to upload an image and select an area to edit (e.g., by drawing a mask).
    *   Add a text prompt for what to do in the selected area (e.g., "remove the person" or "add a cat").
    *   Implement the server logic to send the image, mask, and prompt to the Gemini API.
    *   Display the edited image.

*   **Phase 4: Image Editing - Out-painting (Expanding an Image)**
    *   Create a UI to upload an image and specify dimensions for expansion.
    *   Add a text prompt to describe the content for the expanded areas.
    *   Implement the server-side logic for out-painting.
    *   Display the expanded image.

*   **Phase 5: Image Style Transfer**
    *   Allow the user to upload a content image and a style image.
    *   Implement the server logic to apply the style of the second image to the first one.
    *   Display the resulting image.

*   **Phase 6: Image Understanding**
    *   Allow the user to upload an image and ask a question about it.
    *   Implement the server logic to send the image and question to the Gemini API.
    *   Display the text-based answer from the model.
