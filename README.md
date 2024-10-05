# RSVPlease README

**How to get started**

1. In the project directory run ``` npm i ``` to install node modules

2. Get firebaseConfig.js file that contains api keys and add that to public directory

3. Get the service-account-key.json and google-maps-config.json files that contain api keys and add them to the app directory.

4. run ```npm start ``` to start the node server

5. Go to localhost:3000 to see the webpage

6. If you want to use the remotely hosted application, enter this url into your browser: https://rsvplease.net/

7. Note: Application is hosted on an EC2 instance using AWS, and a Jenkins job is running that is connected to the main git branch. So ANY pushes to main will immediately reflect on the hosted application.
