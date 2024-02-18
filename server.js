// Load environment variables from .env file. This is important for keeping
// sensitive information like API keys out of the codebase.
require('dotenv').config();

// Import the express module to create an HTTP server for our API.
const express = require('express');

// CORS
const cors = require('cors');

// Import the node-fetch module to make HTTP requests (like the one to OpenAI's API).
const fetch = require('node-fetch');

// Initialize the express application.
const app = express();

// Enable Express to parse JSON bodies in requests, which is necessary for
// processing the incoming JSON data.
app.use(express.json());
app.use(cors());
app.use(express.static('src'));

// Define the port on which the server will listen. It uses the PORT environment
// variable if provided, otherwise it defaults to 3000.
const PORT = process.env.PORT || 3005;

// Retrieve the OpenAI API key from environment variables for secure access.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Define a POST route handler for '/process_image' which will process the
// incoming image data.
app.post('/process_image', async (req, res) => {
    // Extract the base64-encoded image data from the request body.
    const base64Image = req.body.image;

    // Check if the image data is not provided and return a 400 Bad Request error
    // if that's the case.
    if (!base64Image) {
        return res.status(400).json({ error: 'No image data received.' });
    }

    // Define the headers for the OpenAI API request, including the content type
    // and the authorization token.
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    };

    // Construct the payload for the OpenAI API, including the model to use, the
    // message with a prompt for the image description and the base64 image data.
    const payload = {
        model: "gpt-4-vision-preview",
        messages: [{
            role: "user",
            content: [{
                type: "text",
                text: `You can ONLY respond with 3 letters.
                IF the main person in the frame is on the floor, respond with F
                IF the main person is holding or consuming a small medical bottle or container, respond with M
                IF the neither of these conditions apply respond with N`
                // The text prompt includes instructions for the OpenAI model to
                // describe the image and format the response in a certain way.
            }, {
                type: "image_url",
                image_url: {
                    // Attach the base64 image data to the request, formatted as a
                    // data URL.
                    url: `data:image/jpeg;base64,${base64Image}`
                }
            }]
        }],
        max_tokens: 300 // Set a limit on the number of tokens (words) the model should generate.
    };

    try {
        // Make an asynchronous POST request to the OpenAI API with the headers
        // and the JSON-stringified payload.
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        // Parse the JSON response from the OpenAI API.
        const data = await response.json();
        // Send the parsed data back to the client with a 200 OK status.
        res.status(200).json(data);
    } catch (error) {
        // Log the error to the console and return a 500 Internal Server Error
        // status if something goes wrong with the fetch operation.
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to process the image.' });
    }
});

// Start the server and listen on the defined PORT. When the server is ready, it
// will log a message to the console.
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
