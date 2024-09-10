# Federated Learning App
## A Federated Learning Experiment Using TensorFlow

This is an app currently in development exploring the different aspects of Federated Learning in a web app. The frontend uses React/Tailwind and TensorFlow.js for the model. The backend uses a Flask server that utilizes TensorFlow. All this is run on an Ubuntu server.

#Setup
1. [Install Docker](https://docs.docker.com/engine/install/ubuntu/)
2. [Use Docker without root](https://docs.docker.com/engine/install/linux-postinstall/). **(Optional)**
3. Add SSL keys for NGINX to `/etc/ssh/` in `cert.pem` and `key.pem` files.
