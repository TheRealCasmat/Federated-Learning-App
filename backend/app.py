import io
import json
from PIL import Image
from flask import (
    Flask,
    jsonify,
    make_response,
    send_from_directory,
    request,
)
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

import tensorflow as tf
import tensorflowjs as tfjs
import numpy as np
import os
import logging

# Create a Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024

logging.basicConfig(level=logging.DEBUG)


# Define the root endpoint
@app.route("/")
def hello():
    return "You've reached the root endpoint!"


# Load the model
model = tf.keras.models.load_model("models/keras/fla_model.h5")


# Update model
@app.route("/update", methods=["POST"])
def update():
    try:
        data = request.json

        weights = data["weights"]
        shapes = data["shapes"]

        model_weights = [np.array(w).reshape(s) for w, s in zip(weights, shapes)]

        model.set_weights(model_weights)
        # model.save('models/keras/fla_model.h5')
        # tfjs.converters.dispatch_keras_h5_to_tfjs_layers_model_conversion('models/keras/fla_model.h5', 'models/tfjs/')
        response = make_response(
            jsonify({"message": "Update successful", "ans": "hi"}), 200
        )
        return response
    except Exception as e:
        response = make_response(jsonify({"error": str(e)}), 500)
        return response


# Serve model files
@app.route("/fla-model/<path:filename>")
def serve_model_files(filename):
    return send_from_directory("models", filename)


# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0")
