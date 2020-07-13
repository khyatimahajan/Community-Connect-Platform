# Mock-social-network

`npm start` at the root folder will serve the file `index.js` which has specified routes and connections to other files. <br>
The folder `views` contains all the `.ejs` files. Similarly the folder `style` contains `.css` files corresponing to the ejs files. `models` folder contains schema for entities required to be stored in the database. `routes` folder contains the server side functions for different routes that are required and declared in `index.js`. Also `controller` & `middleware` contains all the logical files for controller and middleware files.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Before starting, please make sure you have Node and NPM installed. <br>
For installing, you can follow instructions on this link --> [Installing NodeJS](https://nodejs.org/en/download/) <br><br>

You can verify the installation by running following commonds on terminal or cmd
`npm -v`
`node -v`

### Installing

Doing a `npm install` in the project folder should install all the dependencies and create a folder called `node_modules`. <br>
Also make sure to install Install MongoDB Community Edition on your machine.
[MongoDB](https://docs.mongodb.com/manual/administration/install-community/)

You can also install mongoDB compass to explore and manage MongoDB data easily
[MongoDB-Compass](https://www.mongodb.com/products/compass)

## Deployment

Host project that can handle dynamic content. Make sure to install and configure MongoDB on server.
Additional to this you need to install pm2
[pm2](https://pm2.keymetrics.io/docs/usage/quick-start/)

It's daemon process manager for running our application.
On project folder, run below command to serve application.

`pm2 start index.js`

`index.js` is starting point for application.

## Built With

-   [Express](http://www.dropwizard.io/1.0.2/docs/) - NodeJS web application framework
-   [NPM](https://expressjs.com/) - Dependency Management
-   [Javascript](https://www.javascript.com/) - Use for jquery operations
-   [EJS](https://ejs.co/) - Templating engine
-   [MongoDB](https://www.mongodb.com/) - Database

## Browser support

-   Chrome (latest)
-   Firefox (latest)
-   Safari (latest)
-   Opera (latest)
-   Edge (latest)
-   Internet Explorer 9+

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

-   **Sourav Roy** -

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
