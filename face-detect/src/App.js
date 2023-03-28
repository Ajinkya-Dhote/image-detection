import * as faceapi from 'face-api.js';
import { useEffect, useRef, useState } from 'react';
import React from 'react';

import './App.css';
let faceMatcher;
function App() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [image, setImage] = useState();

  const videoRef = React.useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = React.useRef();
  const imageRef = useRef();

  const handleImageChange = async (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
   
  }



  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';

      Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
       
        // faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]).then(() => {
        setModelsLoaded(true);        
      })
        
    }
    loadModels();
   
  }, []);

  const loadFaceMatcher = async () => {
    const input = document.getElementById('myImg');
    console.log(input);

    const results = await faceapi
      .detectAllFaces(input)
      .withFaceLandmarks()
      .withFaceDescriptors()
    faceMatcher = new faceapi.FaceMatcher(results);
  }

  const startVideo = async () => {
    await loadFaceMatcher();
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("error:", err);
      });
  }

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
        const displaySize = {
          width: videoWidth,
          height: videoHeight
        }

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi
                            .detectAllFaces(videoRef.current)
                            .withFaceLandmarks()
                            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        detections.forEach(fd => {
          const bestMatch = faceMatcher.findBestMatch(fd.descriptor)
          console.log(bestMatch.toString());
        })

        canvasRef && canvasRef.current && canvasRef.current.getContext('2d').clearRect(0, 0, videoWidth, videoHeight);
        // canvasRef && canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        // canvasRef && canvasRef.current && faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        // canvasRef && canvasRef.current && faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
      }
    }, 100)
  }

  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setCaptureVideo(false);
  }

  return (
    <div style={{display: 'flex'}}>
      <img ref={imageRef} id="myImg" src={image} alt="reference image" width={430} height={300}/>
      <input type="file" onChange={handleImageChange} />
      <div style={{ textAlign: 'center', padding: '10px' }}>
        {
          captureVideo && modelsLoaded ?
            <button onClick={closeWebcam} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Close Webcam
            </button>
            :
            <button onClick={startVideo} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Open Webcam
            </button>
        }
      </div>
      {
        captureVideo ?
          modelsLoaded ?
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} style={{ borderRadius: '10px' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute' }} />
              </div>
              
            </div>
            :
            <div>loading...</div>
          :
          <>
          </>
      }
    </div>
  );
}

export default App;
