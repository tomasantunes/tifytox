# tifytox
Share your current Spotify track to X.

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
- On your browser go to localhost:4026
