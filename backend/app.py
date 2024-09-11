import io  # Input/Output operations
import json  # JSON operations

# import torch # PyTorch

# from torchvision import transforms # Transformations we need to apply to the image
from PIL import Image  # Process images with PIL
from flask import (
    Flask,
    jsonify,
    make_response,
    send_from_directory,
    request,
)  # Flask for creating the API
from flask_sqlalchemy import SQLAlchemy  # SQLAlchemy for database management
from flask_cors import CORS  # CORS for cross-origin requests
import tensorflow as tf

# import tensorflowjs as tfjs
import numpy as np
import os

# from classes import caltech256Classes # List of classes in the Caltech256 dataset

# Create a Flask app
app = Flask(__name__)
CORS(app)

"""
# Load the serialized model
model = torch.jit.load("caltech256-script.zip", map_location="cpu")
model.eval()


# Define a function to transform the image
def transform_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)) # Open the image

    if image.mode != 'RGB': # Convert image to RGB
        image = image.convert('RGB')

    transform_image = transforms.Compose(
        [
            transforms.Resize(255), # Resize the image
            transforms.CenterCrop(224), # Crop the image
            transforms.ToTensor(), # Convert the image to a tensor
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]), # Normalize the tensor
        ]
    )
    
    return transform_image(image).unsqueeze(0) # Add a batch dimension where tensor shape is [1 batch, 3 channels, 224 w, 224 h]

# Define a function to get the prediction
def get_prediction(image_bytes):
    tensor = transform_image(image_bytes) # Transform the image
    outputs = model.forward(tensor) # Get the output with confidence values for each class
    _, y_hat = outputs.max(1) # Get the class index with the maximum probability
    predicted_idx = y_hat.item() # Get the item
    return caltech256Classes[predicted_idx]
"""
'''
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://ubuntu:P@$$w0rd27@localhost/federatedlearningapp'
db = SQLAlchemy(app)
CORS(app)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(500), nullable=False)

    def __init__(self, name, description):
        self.name = name
        self.description = description

    def __repr__(self):
        return f"Event {self.name}"'''

"""
# Define the predict endpoint
@app.route("/predict", methods=["POST"])
def predict():
    i1 = f"Request headers: {request.headers}"
    i2 = f"Request form data: {request.form}"
    i3 = f"Request files: {request.files}"

    if "file" not in request.files:
        return (
            jsonify(
                {"error": "No file part in the request", "1": i1, "2": i2, "3": i3}
            ),
            400,
        )

    image = request.files["file"]
    if image.filename == "":
        return jsonify({"error": "No selected file"}), 400

    img_bytes = image.read()
    class_name = get_prediction(img_bytes)
    return jsonify({"class_name": class_name})
"""

# Define the root endpoint
@app.route("/")
def hello():
    return "You've reached the root endpoint! Try /predict to make a prediction."

# Update model
@app.route("/update", methods=["POST"])
def update():
    model_weights = request.get_json()
    # model = tf.keras.models.load_model('models/fla_model.h5')
    # model.set_weights(model_weights)
    # model.save('models/fla_model.h5')
    response = make_response(jsonify({"message": "Update successful", "ans": model_weights}), 200)
    return response

# Serve model files
@app.route("/fla-model/<path:filename>")
def serve_model_files(filename):
    return send_from_directory("models", filename)


# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0")
