import React, { useState, useRef } from 'react';
import axios from 'axios';

const App = () => {
  const [image, setImage] = useState(null);
  const [plantData, setPlantData] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start the camera
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access the camera. Please make sure you have granted permissions and your device has a rear camera.');
    }
  };

  // Capture image from camera
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    setImage(dataUrl);

    // Convert data URL to Blob and send to server
    const formData = new FormData();
    formData.append('image', dataURLtoBlob(dataUrl));

    axios.post('http://localhost:5000/upload', formData)
      .then(response => setPlantData(response.data))
      .catch(error => console.error('Error uploading image:', error));
  };

  // Utility function to convert dataURL to Blob
  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  // Voice Commands
  const startVoiceCommands = () => {
    if (!window.webkitSpeechRecognition) {
      console.error('Speech Recognition not supported');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      console.log('Speech Result:', speechResult);

      if (speechResult.includes('start scan')) {
        startCamera();
      } else if (speechResult.includes('capture')) {
        captureImage();
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech Recognition Error:', event.error);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Plant Scanner</h1>
        <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4">
          <button
            onClick={startCamera}
            className="bg-blue-500 text-white px-4 py-2 rounded mb-2 sm:mb-0 sm:mr-2 hover:bg-blue-600"
          >
            Start Camera
          </button>
          <button
            onClick={captureImage}
            className="bg-green-500 text-white px-4 py-2 rounded mb-2 sm:mb-0 sm:mr-2 hover:bg-green-600"
          >
            Capture Image
          </button>
          <button
            onClick={startVoiceCommands}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Enable Voice Commands
          </button>
        </div>

        <div className="relative w-full max-w-lg mb-4">
          <video ref={videoRef} className="w-full border border-gray-300 rounded" autoPlay></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        {image && (
          <div className="mb-4">
            <img src={image} alt="Captured" className="w-full max-w-lg border border-gray-300 rounded" />
          </div>
        )}

        <h2 className="text-xl font-semibold mb-2">Detected Plants</h2>
        <ul className="list-disc list-inside">
          {plantData.map((plant, index) => (
            <li key={index} className="mb-1">
              <span className="font-semibold">{plant.plantName}</span> - {plant.disease} (Confidence: {plant.confidence})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;