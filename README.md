## Authentication and User Management

This repository is a part of an Ecommerce website and a Chat site [link](https://github.com/sujon13/Messenger).

It is like a microservice for authentication, authorization and user management.

#### Other Services repository link

[Product Service](https://github.com/sujon13/product-microservice)

[Cart, Order, Payment Service](https://github.com/sujon13/cart-order-payment-microservice)

#### Cloning and Running the Application in local

-   First you need to have nodejs and npm installed on your pc.
    You can see it [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

-   Clone the repo in your terminal by clicking the green clone or download button at the top right and copying the url
-   Type `git clone [repository url]`
-   Type `cd [local repository]` to go to local repository.
-   Delete the node_modules folder and any 'lock' files such as package-lock.jsos.
-   Type `npm install` for installing all dependency
-   Type `npm start` to run the projects


#### Documentation of API

After running application you will get documentation of apis in http://127.0.0.1:3001/api-docs/ url if your port is 3001

**NB**: You need to create a .env file in project root directory and create below environment variables below run the project :-

 - `DB_CONNECTION=mongodb+srv://<user>:<password>@cluster0.58mik.mongodb.net/<database name>`
 - `PORT=<any integer>`
 - `TOKEN_SECRET=<random string>`
 - `MY_GMAIL_PASSWORD=<user password>`