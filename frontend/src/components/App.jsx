import React, { useState, useEffect } from "react";
import Alert from "./Alert";
import FileUpload from "./FileUpload";
import IdentifyButton from "./IdentifyButton";
import Feedback from "./Feedback";
import Dialog from "./Dialog";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import db from "./db";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [model, setModel] = useState(null);
  const [predictedClass, setPredictedClass] = useState("");
  const [showRmFeedback, setShowRmFeedback] = useState(false);
  const [showRmModel, setShowRmModel] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRetrained, setIsRetrained] = useState(false);

  // Load the model from IndexedDB or the server
  const loadModel = async () => {
    try {
      const localModel = await tf.loadLayersModel("indexeddb://my-model");
      setModel(localModel);
      setShowRmModel(true);
    } catch (error) {
      try {
        const loadedModel = await tf.loadLayersModel(
          "https://api.dhanwanth.pp.ua/fla-model/tfjs/model.json"
        );
        setModel(loadedModel);
        await loadedModel.save("indexeddb://my-model");
        setShowRmModel(true);
      } catch (error) {
        console.error("Error loading model from server:", error);
        if (!showAlert) {
          setAlertMessage(
            "Error! An unknown error occurred while loading the model. Please try again later."
          );
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
        }
      }
    }
  };

  // Check if feedback exists in IndexedDB
  const checkFeedbackExists = async () => {
    try {
      const feedbackCount = await db.feedbacks.count();
      setShowRmFeedback(feedbackCount > 0);
    } catch (error) {
      console.error("Error checking feedback in IndexedDB:", error);
    }
  };

  // Load the model when the component mounts
  useEffect(() => {
    loadModel();
    checkFeedbackExists();
  }, []);

  // Predict the image when the form is submitted
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if the user has uploaded an image
    if (files.length === 0) {
      if (!showAlert) {
        setAlertMessage(
          "Error! You can't identify an image without inputting one first!"
        );
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
      return;
    }

    // Check if the model has loaded
    if (!model) {
      if (!showAlert) {
        setAlertMessage(
          "Error! The model hasn't completely loaded yet. Please wait and try again."
        );
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
      return;
    }

    setIsLoading(true);

    // Get the image from the input
    const file = files[0].file;
    const imageElement = document.createElement("img");
    imageElement.src = URL.createObjectURL(file);

    // Wait for the image to load
    await new Promise((resolve) => {
      imageElement.onload = resolve;
    });

    // Preprocess the image
    let tensorImg = tf.browser
      .fromPixels(imageElement)
      .resizeNearestNeighbor([150, 150])
      .toFloat()
      .expandDims();

    try {
      // Predict the image
      const prediction = await model.predict(tensorImg).data();
      setResponseMessage(
        `The image has been identified as a ${
          prediction[0] === 0 ? "🐈 Cat 😺" : "🐕 Dog 🐶"
        }!`
      );
      setPredictedClass(prediction[0] === 0 ? "cat" : "dog");
    } catch (error) {
      console.error(error);
      if (!showAlert) {
        setAlertMessage(
          "Error! An unkown error occurred while identifying the image. Please try again later."
        );
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    }

    tensorImg.dispose();
    setIsLoading(false);
  };

  // Handle the feedback given by the user
  const handleFeedback = async (type) => {
    setFeedbackGiven(true);

    const trueLabel =
      type === "good"
        ? predictedClass
        : predictedClass === "cat"
        ? "dog"
        : "cat";

    const file = files[0].file;
    const imageDataUrl = await convertFileToDataUrl(file);

    try {
      await db.feedbacks.add({ imageDataUrl, trueLabel });
      setShowRmFeedback(true);
    } catch (error) {
      console.error("Error saving feedback to IndexedDB:", error);
    }
  };

  // Retrain the model with the feedback
  const retrainModel = async () => {
    try {
      setIsRetraining(true);
      const feedbacks = await getFeedbacks();
      if (feedbacks.length === 0) {
        if (!showAlert) {
          setAlertMessage(
            "Error! There is no feedback to retrain the model with."
          );
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
        }
        return;
      }

      const imgTensors = [];
      const labels = [];

      const oldWeights = model.getWeights();

      for (const feedback of feedbacks) {
        const img = new Image();
        img.src = feedback.imageDataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const tensor = tf.browser
          .fromPixels(img)
          .resizeNearestNeighbor([150, 150])
          .toFloat()
          .expandDims();

        imgTensors.push(tensor);

        const label = feedback.trueLabel === "cat" ? 0 : 1;
        labels.push(label);
      }

      // Prepare training data
      const xTrain = tf.concat(imgTensors);
      const yTrain = tf.tensor1d(labels, "int32");

      // Retrain the model
      if (model) {
        model.compile({
          optimizer: "adam",
          loss: "binaryCrossentropy",
          metrics: ["accuracy"],
        });

        await model.fit(xTrain, yTrain, {
          epochs: 1,
          batchSize: 1,
          shuffle: true,
          callbacks: {
            onEpochEnd: async (epoch, logs) => {
              console.log(
                `Epoch ${epoch + 1}: Loss = ${logs.loss}, Accuracy = ${
                  logs.acc
                }`
              );
            },
          },
        });

        // Save the updated model
        await model.save("indexeddb://my-model");
        loadModel();

        const newWeights = model.getWeights();

        console.log("Old weights:", oldWeights);
        console.log("New weights:", newWeights);

        // Check if the weights have changed
        let weightsChanged = false;
        for (let i = 0; i < oldWeights.length; i++) {
          if (!oldWeights[i].equal(newWeights[i])) {
            weightsChanged = true;
            break;
          }
        }

        console.log("Weights changed:", weightsChanged);
      }

      tf.dispose(imgTensors);
      tf.dispose([xTrain, yTrain]);
      handleRemoveFeedback();
      setIsRetrained(true);
      if (!showAlert) {
        setAlertMessage(
          "Model has been been retrained on the feedback you provided! Stored feedback will be erased."
        );
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      console.error("Error retraining the model:", error);
      if (!showAlert) {
        setAlertMessage(
          "Error! An unkown error occurred while retraining the model. Please try again later."
        );
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    }
    setIsRetraining(false);
  };

  // Convert the file to a data URL
  const convertFileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Get feedback from IndexedDB
  const getFeedbacks = async () => {
    try {
      const feedbacks = await db.feedbacks.toArray();
      return feedbacks;
    } catch (error) {
      console.error("Error retrieving feedback from IndexedDB:", error);
      return [];
    }
  };

  // Handle remove feedback button
  const handleRemoveFeedback = async () => {
    try {
      await db.feedbacks.clear();
      setShowRmFeedback(false);
      if (!showAlert) {
        setAlertMessage("Stored feedback has been removed!");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      console.error("Error removing feedback from IndexedDB:", error);
    }
  };

  // Handle remove model button
  const handleResetModel = async () => {
    try {
      setIsRetrained(false);
      setShowRmModel(false);
      await tf.io.removeModel("indexeddb://my-model");
      setModel(null);
      loadModel();
      if (!showAlert) {
        setAlertMessage("Model has been reset!");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      console.error("Error removing model:", error);
    }
  };

  // Remove the uploaded file
  const handleRemoveFile = () => {
    setFiles([]);
    setResponseMessage("");
    setFeedbackGiven(false);
    setPredictedClass("");
  };

  // Send the model to the server
  const handleSendModel = async () => {
    try {
      setIsSending(true);

      const weights = model.getWeights();
      const weightsJson = JSON.stringify(weights);
      const weightsArray = weights.map((w) => w.dataSync());
      console.log(weightsArray);
      return;
      const response = await axios.post(
        "https://api.dhanwanth.pp.ua/update",
        weightsJson,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log(response.data.ans);
        if (!showAlert) {
          setAlertMessage("Model has been sent to the server!");
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
        }
        //setIsRetrained(false);
      }
    } catch (error) {
      console.error("Error sending model to the server:", error);
      if (!showAlert) {
        setAlertMessage(
          "Error! An unknown error occurred while sending the model to the server. Please try again later."
        );
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    }
    setIsSending(false);
  };

  return (
    <div className="App animate-fade flex justify-center select-none">
      <div className="wrapper">
        <span>🐶</span>
        <span>🐈</span>
        <span>🐱</span>
        <span>🐕</span>
        <span>🐶</span>
        <span>🐈</span>
        <span>🐱</span>
        <span>🐕</span>
        <span>🐶</span>
        <span>🐈</span>
      </div>
      <Alert showAlert={showAlert} alertMessage={alertMessage} />
      <Dialog
        id="remove_feedback_modal"
        title="Remove Feedback"
        text="Are you sure you want to remove your locally stored feedback?"
        command="Clear Data"
        callback={handleRemoveFeedback}
      />
      <Dialog
        id="reset_model_modal"
        title="Reset Model"
        text="Are you sure you want to reset your local model?"
        command="Reset Model"
        callback={handleResetModel}
      />
      <div className="flex justify-center items-center h-screen">
        <div className="card card-border bg-neutral text-neutral-content w-[30rem] shadow-2xl">
          <div className="card-body items-center text-center">
            <img
              src="/Logo.png"
              alt="Image Identifier Logo"
              className="select-none no-select w-16 h-16 mx-auto"
            />
            <h1 className="card-title text-3xl text-indigo-100">Cat or Dog?</h1>
            <h3 className="text-xl text-slate-300">
              A Federated Learning Experiment
            </h3>
            <hr className="divider bg-indigo-100 opacity-25 h-1 rounded-md" />
            <p className="text-md text-slate-400 mb-4 mx-5 text-left">
              This tool allows you to identify pictures of dogs or cats! Just
              upload an image and identify! The model uses federated learning to
              improve its performance based on user provided feedback. Don't
              worry about privacy, your images and feedback are stored in the
              browser and isn't sent to us. You can delete stored data and reset
              the model using the buttons below.
            </p>
            <div className="flex justify-center space-x-4 mb-4">
              {isRetrained && (
                <button
                  className={`btn ${isSending && "btn-primary:disabled"}`}
                  onClick={handleSendModel}
                  disabled={isSending}
                >
                  {isSending ? (
                    <span
                      className="loading loading-spinner"
                      style={{ color: "#A6ADBB" }}
                    />
                  ) : (
                    "Send Model"
                  )}
                </button>
              )}
              {showRmFeedback && (
                <button
                  className={`btn ${isRetraining && "btn-primary:disabled"}`}
                  onClick={retrainModel}
                  disabled={isRetraining}
                >
                  {isRetraining ? (
                    <span
                      className="loading loading-spinner"
                      style={{ color: "#A6ADBB" }}
                    />
                  ) : (
                    "Retrain Model"
                  )}
                </button>
              )}
              {showRmFeedback && (
                <button
                  className="btn btn-outline btn-error"
                  onClick={() =>
                    document.getElementById("remove_feedback_modal").showModal()
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                    />
                  </svg>
                </button>
              )}
              {showRmModel && (
                <button
                  className="btn btn-outline btn-error"
                  onClick={() =>
                    document.getElementById("reset_model_modal").showModal()
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z"
                    />
                  </svg>
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <FileUpload
                files={files}
                setFiles={setFiles}
                handleRemoveFile={handleRemoveFile}
              />
              <IdentifyButton
                isLoading={isLoading}
                isIdentified={!!responseMessage}
              />
            </form>
            <Feedback
              responseMessage={responseMessage}
              feedbackGiven={feedbackGiven}
              handleFeedback={handleFeedback}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
