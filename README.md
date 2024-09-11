# Federated Learning App
## A Federated Learning Experiment Using TensorFlow

This is an app currently in development exploring the different aspects of Federated Learning in a web app. The frontend uses React/Tailwind and TensorFlow.js for the model. The backend uses a Flask server that utilizes TensorFlow. All this is run on an Ubuntu server.

## Setup
1. [Install Docker](https://docs.docker.com/engine/install/ubuntu/)

2. [Use Docker without root](https://docs.docker.com/engine/install/linux-postinstall/). **(Optional)**

3. Add SSL keys for NGINX to `/etc/ssl/` in `cert.pem` and `key.pem` files.

4. Clone this repo to your server using:
    ```
    git clone https://github.com/TheRealCasmat/Federated-Learning-App.git
    ```
    For this setup, we'll clone the directory to our `ubuntu` user's home directory.

5. Create `fla-site` Docker network:
    ```
    docker network create fla-site
    ```

6. Pull `nginx` Docker image:
    ```
    docker pull nginx:latest
    ```

7. Run the `nginx` image as a container and mount `default.conf` and the SSL directory:
    ```
    docker run --name fla-nginx --network fla-site --restart unless-stopped -p 80:80 -p 443:443 -v ~/Federated-Learning-App/nginx/default.conf:/etc/nginx/conf.d/default.conf -v /etc/ssl:/etc/ssl:ro -d nginx:latest
    ```

8. Build the frontend image:
    ```
    docker build -f frontend.Dockerfile -t fla-frontend:latest .
    ```

9. Run the `fla-frontend` image as a container and mount the frontend directories and files:
    ```
    docker run --name fla-frontend --network fla-site --restart unless-stopped -p 5173:5173 -v ~/Federated-Learning-App/frontend/public:/frontend/public -v ~/Federated-Learning-App/frontend/src:/frontend/src -v ~/Federated-Learning-App/frontend/index.html:/frontend/index.html -d fla-frontend:latest
    ```

10. Build the backend image ***NOTE: THIS MAY TAKE A WHILE TO BUILD DEPENDING ON THE SYSTEM***:
    ```
    docker build -f backend.Dockerfile -t fla-backend:latest .
    ```

11. Run the `fla-backend` image as a container and mount the backend directories and files:
    ```
    docker run --name fla-backend --network fla-site --restart unless-stopped -p 5000:5000 -v ~/Federated-Learning-App/backend/models:/backend/models -v ~/Federated-Learning-App/backend/.flaskenv:/backend/.flaskenv -v ~/Federated-Learning-App/backend/app.py:/backend/app.py -d fla-backend:latest
    ```

### 🎉 **Congratulations! You've setup the Federated Learning App!** 🎉
#