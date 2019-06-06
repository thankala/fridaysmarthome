DROP DATABASE IF EXISTS fridaysmarthome;
CREATE DATABASE fridaysmarthome;
USE fridaysmarthome;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS History;
DROP TABLE IF EXISTS Devices;
DROP TABLE IF EXISTS Contact;
DROP TABLE IF EXISTS sessions;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users
(
  userID INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  userType VARCHAR(255) NOT NULL,
  fname VARCHAR(255) NOT NULL,
  lname VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  resetPasswordToken VARCHAR(255),
  resetPasswordExpires VARCHAR(255),
  registerDate VARCHAR(255) NOT NULL,
  lastLogIn VARCHAR(255),
  lastLogOut VARCHAR(255),
  PRIMARY KEY (userID),
  UNIQUE (username),
  UNIQUE (email)
);

CREATE TABLE Rooms
(
  roomID INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  longName VARCHAR(255) NOT NULL,
  userID INT NOT NULL,
  PRIMARY KEY (roomID)
);

CREATE TABLE Devices
(
  deviceID INT NOT NULL AUTO_INCREMENT,
  type VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  state BOOLEAN,
  value JSON,
  src_link_of_live_streaming VARCHAR(255),
  userID INT NOT NULL,
  roomID INT NOT NULL,
  PRIMARY KEY (deviceID)
);

CREATE TABLE Contact
(
  contactID INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  message VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  messageDate VARCHAR(255) NOT NULL,
  PRIMARY KEY (contactID)
);


ALTER TABLE Rooms
ADD FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE;

ALTER TABLE Devices
ADD FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE;

ALTER TABLE Devices
ADD FOREIGN KEY (roomID) REFERENCES Rooms(roomID) ON DELETE CASCADE;

INSERT INTO users (userID,username,password,userType,fname,lname,email,registerDate) VALUES(1,'admin','$2b$10$jwA22uGvdFEHmWNyahIRX.MJBPe8ENywpLHFS/zqpstteV.4dCseG','admin','admin','admin','admin@fridayadmin.com','2019-05-30 14:39:46');
INSERT INTO users (userID,username,password,userType,fname,lname,email,registerDate) VALUES(2,'thankala','$2b$10$jwA22uGvdFEHmWNyahIRX.MJBPe8ENywpLHFS/zqpstteV.4dCseG','admin','admin','admin','akaframed@gmail.com','2019-05-30 14:39:46');
INSERT INTO users (userID,username,password,userType,fname,lname,email,registerDate) VALUES(3,'baggelisp','$2b$10$jwA22uGvdFEHmWNyahIRX.MJBPe8ENywpLHFS/zqpstteV.4dCseG','admin','admin','admin','admin@fridayadmin.com','2019-05-30 14:39:46');

