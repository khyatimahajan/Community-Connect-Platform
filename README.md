# Community Connect 
## A Mock Social Media Platform to Study Online Behavior

Community Connect is a social media platform for conducting controlled experiments of human behavior, created with the goal of facilitating research on data collected through controlled experiments on social networks. The key distinguishing feature of Community Connect is the ability to control the visibility of user posts based on the groups they belong to, allowing careful and controlled investigation into how information propagates through a social network. We release this platform as a resource to the broader community, with the goal of faciliating research on data collected through controlled experiments.

## User Interface for Community Connect

![Interface](assets/interface.png)

## System Architecture

![Interface](assets/arch.png)

## Web Sequence Diagram

![](assets/websequence_diagram-1.png)

## Features
- **Bridge Users** and **Information Flow Control***: Setup bridge users who are connected to multiple groups, and control information flow through them since posts only become available across groups when a bridge user interacts with them
- **Outcomes**: Collect information about likes, reposts, replies and quotes for each post
- **Images**: Attach images to any post or comment
- **Conversation Threads**: Follow conversation threads following any post through a unique conversation ID
- **Emojis**: Emoji support for text
- **Notifications**: Help users catch up with posts they missed

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for documentation on how to deploy the project on a live system.

### Prerequisites

- [Node.js](https://nodejs.org)
  - expressjs [ExpressJS HTTP middleware](https://npmjs.org/package/express)
  - ejs [Embedded JavaScript templates](https://npmjs.org/package/ejs)
- [MongoDB](http://mongodb.org)

## Installation

Follow these steps to install prerequisites on the local machine, or the server where the platform will be hosted.

1. [Install `Node.js`](https://nodejs.org/en/download/) - this also installs ```NPM```.
2. [Install `MongoDB Community Edition`](https://docs.mongodb.com/manual/administration/install-community/).
3. Verify installation by running following commands on the terminal or command line: `npm -v`, `node -v`, `mongod --version`.
4. Clone the repo locally then install all the dependencies using [NPM](https://npmjs.org/), running `npm install` should install all the dependencies and create a folder called `node_modules`:

>  ```bash
>  $ git clone https://github.com/Souravroych/Mock-social-network-master-updated.git
>  $ cd Mock-social-network-master-updated
>  $ npm install
>  ```

5. Optionally, [install `pm2`](https://www.npmjs.com/package/pm2) to help with managing the process. This step is recommended if using EC2. PM2 is a production process manager for Node.js applications with a built-in load balancer. It allows you to keep applications alive forever, to reload them without downtime and to facilitate common system admin tasks.

Please note that all third party dependencies are managed through NPM and a package.json file. NPM is the default package management system for javascript programming and aids in package installation, dependency management and version management.

## Setup for running the platform

#### If using Amazon EC2

- Setup the environment file, and replace line 25 in the [`index.js`](index.js) file with `require('dotenv').config({ path: 'ENV_FILENAME' });`, where ENV_FILENAME is the path to the `.env` environment file. Make sure to include it in `.gitignore` to protect credentials. Further instructions for setting up this file are detailed here: [Setting up the environment file](https://github.com/khyatimahajan/Mock-social-network-master-updated#setting-up-the-environment-file)
- Enable access to port 5000 (this is the specified port we will be using to provide internet access) for the security group managing your EC2 instance, using inbound rules: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/authorizing-access-to-an-instance.html

1. [Start the `MongoDB` server](https://docs.mongodb.com/manual/administration/configuration/).
2. Optionally, check if running `npm start` works smoothly. If yes, continue to next step.
3. Run `pm2 start index.js` to start the platform. Your app is now daemonized, monitored and kept alive forever.
4. Go to your browser, copy the public URL displayed on your EC2 instance, add `:5000` at the end to access port 5000. If this works, your platform is all set!


## Populating the database using the Excel

When the platform first runs, it creates users and groups specified in this excel file:
![](assets/Users_Groups_database.png)

To customize the users and groups, edit this excel file.

- **"User name"**: Name of the user. 
- **"user_id"**: Unique ID for each user - this is used by the users to sign up for the platform. Without it, they cannot sign up for the platform.
- **email-ids**: Enter user email. They will be using this to sign into the platform.
- **Group** in column E is used to assign the users to their individual groups. (Users who are assigned in multiple groups are ***Bridge Users***)

## Setting up the environment file
![ENV](assets/env.png)

1. **`AWS_BUCKET_NAME`**: [Create an `S3` bucket on Amazon AWS](https://docs.aws.amazon.com/quickstarts/latest/s3backup/step-1-create-bucket.html), and add the name of this newly created `S3` bucket here.
2. **`AWS_ACCESS_KEY_ID`**, **`AWS_SECRET_ACCESS_KEY`**: Check the access keys using the Security Credentials menu from your user dropdown on the navigation bar top right. Fill these fields using data in these access keys. If you do not already have one, create a new one. To get information from the keys, [follow this guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html).
3. **`AWS_REGION`**: [AWS_REGION](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html) You can use the Amazon EC2 console or the command line interface to determine which Regions, Availability Zones, and Local Zones are available for your account. Fill in the region you will be using for your EC2 instance.
4. **`SESSION_SECRET_KEY`**: Setup a [SESSION_SECRET_KEY](https://github.com/expressjs/session#readme) for Express middleware.

## Folder Structure 

### Frontend
- `/assets` contains all the images, some client side JS files and style sheets. <br />
- `/views` contains all the view templates (we have used Embedded javascript templating engine for node.js). <br />
- `/style` contains all the style sheets or the css files used for stylisation including colour, layout and fonts. <br />

### Middleware
- `/middleware` contains the functions which have access to request object, response object and the next function in applications request response cycle. <br />

### Backend
- `/model` contains all the ORM or the Virtual object database (specifically called schemas in mongoose). <br />
- `/routes` contains all the server side functions for different modules or areas of the application. <br />
- `/controller` contains all the major express routes seprated by major sections.  <br />

## Data Storage and Retrieval

### Schema for Backend

#### Users

| *Field*                                               | _id                                            | user_id                                        | username                  | password                  | name                      | bio                       | location                  | Email ID                  | created_at                | profile_pic               | group_id                         |
|-------------------------------------------------------|------------------------------------------------|------------------------------------------------|---------------------------|---------------------------|---------------------------|---------------------------|---------------------------|---------------------------|---------------------------|---------------------------|----------------------------------|
| *Function*                                            | *primary_key, system generated, do not change* | *generate based on demo, experiment condition* | *assign default or empty* | *assign default or empty* | *assign default or empty* | *assign default or empty* | *assign default or empty* | *assign default or empty* | *assign default or empty* | *assign default or empty* | *pre-populate*                   |
| *Data Type*                                           | *ObjectId*                                     | *string*                                       | *string*                  | *private password*        | *string*                  | *string*                  | *string*                  | *string*                  | *datetime*                | *URL*                     | *list of strings*                |
| *Example of how this will look at setup*              | \<empty\>                                      | jd_c1_06112020                                 | \<empty\>                 | \<empty\>                 | John Doe                  | \<empty\>                 | \<empty\>                 | john.doe&#8203;@gmail.com | \<empty\>                 | \<empty\>                 | [Blue] ([Blue, Red] if multiple) |
| *Example of how this will look when the experiment is underway* | x1y2                                           | jd_c1_06112020                                 | john_doe                  | john_doe                  | John Doe                  | hello                     | Charlotte                 | john.doe&#8203;@gmail.com | TIMESTAMP                 | [link to profile pic]     | [Red] ([Blue, Red] if multiple)  |

### Groups

| *Field*                                               | group_id                                       | group_name                                                            | group_desc                          |
|-------------------------------------------------------|------------------------------------------------|-----------------------------------------------------------------------|-------------------------------------|
| *Function*                                            | *primary key, system_generated, do not change* | *experiment-assigned group name, same as group info from Users table* | *field to store group descriptions* |
| *Data Type*                                           | *ObjectId*                                     | *list of strings*                                                     | *string*                            |
| *Example of how this will look at setup*              | a1b2                                           | [Blue, Red]                                                           | All bridge users                    |
| *Example of how this will look when the experiment is underway* | a1b2                                           | [Blue, Red]                                                           | All bridge users                    |

### Feeds

| *Field*                                                          | _id                                            | user_id                                          | body                | created_at          | liked_by                                       | like_count              | retweet_count              | reply_count                                    | quote_count                                | post_type                                                                                     | parent_id                                                                                                                     | conversation_id                                                                                                                                 | mentions                                                                                                                               | visible_to                                                                                    |
|------------------------------------------------------------------|------------------------------------------------|--------------------------------------------------|---------------------|---------------------|------------------------------------------------|-------------------------|----------------------------|------------------------------------------------|--------------------------------------------|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| *Function*                                                       | *primary key, system generated, do not change* | *copy from user_id of person taking this action* | *created with post* | *created with post* | *maintains list of people who liked this post* | *updates post is liked* | *updates post is reposted* | *updates when a reply is posted on this post*  | *updates post is reposted with comment*    | *created with post based on how it was created - can be “tweet”, “retweet”, “reply”, “quote”* | *if post_type is “tweet”, this is empty, otherwise this is the _id of the post on which action was taken to create this post* | *if post_type is “tweet”, this is copy of _id, otherwise this is the conversation_id of the post on which action was taken to create this post* | *if another user was mentioned, add their user_id from Users table here; also logically these can only be users in this user’s groups* | *mark this post visible to the user’s groups, then update based on interactions on this post* |
| *Data Type*                                                      | *ObjectId*                                     | *string*                                         | *string*            | *datetime*          | *list of strings*                              | *number*                | *number*                   | *number*                                       | *number*                                   | *string*                                                                                      | *string*                                                                                                                      | *string*                                                                                                                                        | *list of strings*                                                                                                                      | *list of strings*                                                                             |
| *Example of how this will look at setup*                         | \<empty\>                                      | \<empty\>                                        | \<empty\>           | \<empty\>           | \<empty\>                                      | \<empty\>               | \<empty\>                  | \<empty\>                                      | \<empty\>                                  | \<empty\>                                                                                     | \<empty\>                                                                                                                     | \<empty\>                                                                                                                                       | []                                                                                                                                     | \<empty\>                                                                                     |
| *Example of how this will look when someone posts*               | 123                                            | x1y2                                             | hello               | TIMESTAMP           | []                                             | 0                       | 0                          | 0                                              | 1 *(became 1 when x2y3 quoted this tweet)* | tweet                                                                                         | \<empty\>                                                                                                                     | 123                                                                                                                                             | []                                                                                                                                     | [Blue]                                                                                        |
| *Example of how this will look when someone quotes post 123*     | 234                                            | x2y3                                             | world               | TIMESTAMP           | []                                             | 0                       | 0                          | 1 *(became 1 when x3y4 replied on this tweet)* | 0                                          | quote                                                                                         | 123 *(copied from _id of post which was quoted)*                                                                              | 123 *(copied from conversation_id of post which was quoted)*                                                                                    | []                                                                                                                                     | [Blue]                                                                                        |
| *Example of how this will look when someone replies on post 234* | 356                                            | x3y4                                             | everyone            | TIMESTAMP           | []                                             | 0                       | 0                          | 0                                              | 0                                          | reply                                                                                         | 234 *(copied from _id of post on which reply was made)*                                                                       | 123 *(copied from conversation_id of post which was quoted)*                                                                                    | []                                                                                                                                     | [Blue]                                                                                        |

### How to Retrieve Data
1. [Dumping MongoDB data](https://docs.mongodb.com/manual/reference/program/mongodump/)
2. [Backing up and restoring data from MongoDB dump](https://docs.mongodb.com/manual/tutorial/backup-and-restore-tools/)
3. [For python - using pymongo to read data from MongoDB](https://pymongo.readthedocs.io/en/stable/)
3. [For R - using the 'mongolite' R package to read MongoDB data](https://jeroen.github.io/mongolite/connecting-to-mongodb.html)

## Demonstration Video
Watch the demonstration video on YouTube: https://youtu.be/mDJ5tji0XTg

### Browser Support
Tested on:
-   Chrome (84.0.4147)
-   Firefox (78.0)
-   Safari (14.x)
-   Internet Explorer(11.0)

## Contributors
-   [Sourav Roy Choudhury](https://github.com/Souravroych)
-   [Khyati Mahajan](https://github.com/khyatimahajan)
-   [Samira Shaikh](https://github.com/sshaikh2)

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
