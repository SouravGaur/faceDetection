import React, { useRef, useState, useEffect } from "react";

const FaceAuth = () => {
  // State to manage the authentication mode: 'register' or 'login'
  const [authMode, setAuthMode] = useState("login"); // Default to 'login' based on your image

  // State and refs for camera and photo capture
  const videoRef = useRef(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);

  // State for form inputs and user session
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // State for UI messages (errors, success)
  const [message, setMessage] = useState("");

  // Helper function to reset all relevant state
  const resetState = () => {
    // Stop the video stream if it's running
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null; // Explicitly null out the srcObject
    }

    setCameraStarted(false);
    setCapturedPhoto(null);
    setPhotoBlob(null);
    setMessage("");
    setUsername("");
    setEmail("");
  };

  // Start camera and clear any previous photo
  const startVideo = async () => {
    setMessage(""); // Clear any previous messages
    try {
      // Check for camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraStarted(true);
        setCapturedPhoto(null); // Clear any previous photo when starting camera
        setPhotoBlob(null); // Clear the associated blob
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setMessage("Please allow camera access to use this feature.");
      setCameraStarted(false);
    }
  };

  // Capture a still photo from the video stream
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to a Blob and set state
    canvas.toBlob((blob) => {
      setCapturedPhoto(URL.createObjectURL(blob));
      setPhotoBlob(blob);
    }, "image/jpeg");

    // Stop the camera stream to save resources
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null; // Explicitly null out the srcObject
    }
    setCameraStarted(false);
  };

  // Handle both registration and login with a single function
  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear message before new attempt

    if (!photoBlob) {
      setMessage("Please capture your photo first!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("photo", photoBlob, "face.jpg");

      let endpoint = "";

      // Conditional logic for handling 'register' vs 'login' mode
      if (authMode === "register") {
        if (!username || !email) {
          setMessage("Please enter username and email to register.");
          return;
        }
        formData.append("username", username);
        formData.append("email", email);
        endpoint = "http://localhost:5009/api/auth/register";
      } else {
        // authMode is 'login'
        endpoint = "http://localhost:5009/api/auth/login";
      }

      // Perform the API call
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        if (authMode === "register") {
          setMessage("Registration successful! You can now log in.");
          setAuthMode("login"); // Auto-switch to login tab
        } else {
          // authMode is 'login'
          setMessage(`Login successful! Welcome, ${data.username || "user"}!`);
          setIsLoggedIn(true); // "Redirect" to the home page view
        }
      } else {
        // Handle failed authentication
        setMessage(data.message || "Authentication failed.");
        resetState(); // Reset state on failure
      }
    } catch (err) {
      setMessage("Error: " + err.message);
      resetState(); // Reset state on error
    }
  };

  // If the user is logged in, show a simple home page
  if (isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 text-center">
        <div className="p-10 bg-white rounded-2xl shadow-xl space-y-4">
          <h2 className="text-4xl font-extrabold text-green-600">
            Successfully Logged In!
          </h2>
          <p className="text-xl text-gray-700">Welcome to your home page.</p>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              resetState(); // IMPORTANT: Reset state on logout
            }}
            className="mt-6 px-6 py-2 rounded-lg font-bold text-white transition-colors duration-300 bg-red-500 hover:bg-red-600 shadow-md"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Main Authentication UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl space-y-6">
        <h2 className="text-3xl font-extrabold text-center text-gray-800">
          Face Authentication
        </h2>

        {/* UI Message Display */}
        {message && (
          <div
            className={`p-3 text-center rounded-lg font-medium 
              ${
                message.includes("successful")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            `}
          >
            {message}
          </div>
        )}

        {/* Mode Switcher Buttons */}
        <div className="flex justify-center space-x-2 bg-gray-200 p-1 rounded-full">
          <button
            onClick={() => {
              setAuthMode("register");
              resetState(); // IMPORTANT: Reset state on tab switch
            }}
            className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${
              authMode === "register"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-transparent text-gray-700 hover:bg-gray-300"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => {
              setAuthMode("login");
              resetState(); // IMPORTANT: Reset state on tab switch
            }}
            className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${
              authMode === "login"
                ? "bg-green-600 text-white shadow-md"
                : "bg-transparent text-gray-700 hover:bg-gray-300"
            }`}
          >
            Login
          </button>
        </div>

        {/* Video / Captured Photo Display */}
        <div className="relative w-full h-60 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 flex items-center justify-center">
          {capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ display: cameraStarted ? "block" : "none" }}
            />
          )}
          {!cameraStarted && !capturedPhoto && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-center">
              Click "Start Camera" to begin
            </div>
          )}
        </div>

        {/* Camera Control Buttons */}
        <div className="flex flex-col space-y-4">
          {!cameraStarted && (
            <button
              onClick={startVideo}
              className="w-full py-3 rounded-lg font-bold text-white transition-colors duration-300 bg-blue-500 hover:bg-blue-600 shadow-md"
            >
              Start Camera
            </button>
          )}

          {cameraStarted && (
            <button
              type="button"
              onClick={capturePhoto}
              className="w-full py-3 rounded-lg font-bold text-white transition-colors duration-300 bg-yellow-500 hover:bg-yellow-600 shadow-md"
            >
              Capture Photo
            </button>
          )}
        </div>

        {/* Form Inputs and Submit Button */}
        <form onSubmit={handleAuth} className="w-full space-y-4 mt-4">
          {authMode === "register" && (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors duration-300 shadow-md mt-4
              ${
                authMode === "register"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            `}
          >
            {authMode === "register" ? "Register" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FaceAuth;
