# tifytox
Share your current Spotify track to X.

## Requisite:
- You need to run this app with SSL on a live server where you can receive requests from outside.
- Create an app on Spotify Developers and choose Web API
- Log into the dashboard using your Spotify account.
- Create an app and select "Web API" for the question asking which APIs are you planning to use. Once you have created your app, you will have access to the app credentials. These will be required for API authorization to obtain an access token.
- On the field Redirect URL you write your domain followed by "/auth-callback"

## How to install on localhost

- Download or clone the repo to a location of your choice
- Install NodeJS and NPM
- Install MySQL and create a database called "tifytox".
- Run the file database/create-tables.sql on your new database.
- Copy the file "secret-config-base.json" and rename it "secret-config.json".
- Copy the file "frontend/src/config-base.json" and rename it "frontend/src/config.json".
- Fill out the necessary fields on these files.
- Run the command "npm install" on the root folder.
- Run the command "npm install" on the frontend folder.
- Run the command "npm run build" on the frontend folder.
- Run the command "npm start" on the root folder to start the application.
- On your browser go to [Your URL]:4026
