# Coco Chat

An instant messaging services that uses WebSockets to enable real-time communication between users. Users make their own accounts, sign in, pick rooms to contribute to, and message away! Messages persist so users can view chat history at any time and during any login.

## Usage

Run
```npm install``` to install the dependencies in package.json.

The app uses MongoDB to store user data as a well as text messages. There are two remote databases, one for user data and one to store messages from each room.
Set up your own versions of these databases on [MongoDB Atlas](https://account.mongodb.com/account/login). The database models to be used can be found in the ./models/ directory.
Note that the rooms database contains several collections, one for each room, but these will be created automatically as you run the app and send messages in each room.
Store your connection strings for each database in a .env folder (as test_db and room_db respectively, or following your own nomenclature).

Please set a custom secret key for your app as well in your .env folder. This is to enable the creation of secure sessions for each user.
