import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBjIHbJnt1l5eh1zfxXcnce4bpzVVLQsbU",
    authDomain: "restful-cbcd4.firebaseapp.com",
    projectId: "restful-cbcd4",
    storageBucket: "restful-cbcd4.appspot.com",
    messagingSenderId: "205445907884",
    appId: "1:205445907884:web:538aee7dc0b42c0c386609",
    measurementId: "G-FZRFK5VRBY"
  };

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);



// Initialize the webcam and set event listeners
function initializeWebcam() {
    const video = document.getElementById('webcam');
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error('getUserMedia error:', error);
            // You can update this to show an error message to the user in the UI.
        });
}

let runCapture = false;

// Function to toggle the capture state
function toggleCapture() {
    runCapture = !runCapture; // Toggle the value of runCapture
}

setInterval(function() {
    if (runCapture) {
        captureImage();
    }
}, 10000); // 5000 milliseconds = 5 seconds


// Function to capture image from webcam and process it
function captureImage() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    processImage(base64Image);
}

// Send the image to the server for processing
function processImage(base64Image) {
    toggleLoader(true); // Show the loader

    fetch('process_image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
    })
    .then(response => response.json())
    .then(handleResponse)
    .catch(handleError);
}

// Handle the server response
function handleResponse(data) {

    toggleLoader(false); // Hide the loader
    if(data.error) {
        console.error(data.error);
        appendToChatbox(`Error: ${data.error}`, true);
        return;
    }


    if (data.choices[0].message.content === "M") {
            const docRef = doc(db, "meds", "status");
            updateDoc(docRef, { tylenol: true })
              .then(() => {
                console.log(
                  "Document successfully updated with Tylenol status set to true"
                );
              })
              .catch((error) => {
                console.error("Error updating document: ", error);
              });
        }
    
        if (data.choices[0].message.content === "F") {
                const docRef = doc(db, "meds", "status");
                updateDoc(docRef, { fallen: true })
                  .then(() => {
                    console.log(
                      "Document successfully updated with Fallen status set to true"
                    );
                  })
                  .catch((error) => {
                    console.error("Error updating document: ", error);
                  });
        }
        
    appendToChatbox(data.choices[0].message.content);

    
  
          
}

// Handle any errors during fetch
function handleError(error) {
    
    console.error("hey first one");
        const docRef = doc(db, "meds", "status");
        updateDoc(docRef, { tylenol: true })
          .then(() => {
            console.log(
              "Document successfully updated with Tylenol status set to true"
            );
          })
          .catch((error) => {
            console.error("Error updating document: ", error);
          });

    toggleLoader(false); // Hide the loader
    console.error('Fetch error:', error);
    appendToChatbox(`Error: ${error.message}`, true);
}

// Toggle the visibility of the loader
function toggleLoader(show) {
    document.querySelector('.loader').style.display = show ? 'block' : 'none';
}

// Append messages to the chatbox
function appendToChatbox(message, isUserMessage = false) {
    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString(); // Get the current time as a string
    
    // Assign different classes based on the sender for CSS styling
    messageElement.className = isUserMessage ? 'user-message' : 'assistant-message';

    messageElement.innerHTML = `<div class="message-content">${message}</div>
                                <div class="timestamp">${timestamp}</div>`;
    if (chatbox.firstChild) {
        chatbox.insertBefore(messageElement, chatbox.firstChild);
    } else {
        chatbox.appendChild(messageElement);
    }
}

// Function to switch the camera source
function switchCamera() {
    const video = document.getElementById('webcam');
    let usingFrontCamera = true; // This assumes the initial camera is the user-facing one

    return function() {
        // Toggle the camera type
        usingFrontCamera = !usingFrontCamera;
        const constraints = {
            video: { facingMode: (usingFrontCamera ? 'user' : 'environment') }
        };
        
        // Stop any previous stream
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // Start a new stream with the new constraints
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                video.srcObject = stream;
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
            });
    };
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeWebcam();

    document.getElementById('capture').addEventListener('click', toggleCapture);
    document.getElementById('switch-camera').addEventListener('click', switchCamera());

    // Other event listeners here...
});
