create database wallet;

create table nonce_btc (id int(50) not null auto_increment primary key,nonce int(50));

create table nonce_btc_testnet (id int(50) not null auto_increment primary key,nonce int(50));

INSERT INTO nonce_btc (nonce) VALUES(0);

INSERT INTO nonce_btc_testnet (nonce) VALUES(0);

SELECT * FROM nonce_btc;

SELECT * FROM nonce_btc_testnet;



create database wallet_action;

create table action_btc (id int(50) not null auto_increment primary key, `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, created_by varchar(100), action varchar(100), amount decimal(40, 18), confirmed boolean, data varchar(255));

create table action_btc_testnet (id int(50) not null auto_increment primary key, `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, created_by varchar(100), action varchar(100), amount decimal(40, 18), confirmed boolean, data varchar(255));


INSERT INTO action_btc_testnet (created_by, action, amount, confirmed, data) VALUES("tony", "delegate", 10.001, false, "");




create database holding_area;

create table pending_btc (id int(50) not null auto_increment primary key, `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, created_by varchar(100), approved_by varchar(100), sender_addr varchar(255), receiver_addr varchar(255), amount decimal(40, 18), token varchar(255), data varchar(255), tx_hash varchar(1000), use_case varchar(255), processed boolean, flagged boolean, wallet varchar(255));

create table pending_btc_testnet (id int(50) not null auto_increment primary key, `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, created_by varchar(100), approved_by varchar(100), sender_addr varchar(255), receiver_addr varchar(255), amount decimal(40, 18), token varchar(255), data varchar(255), tx_hash varchar(1000), use_case varchar(255), processed boolean, flagged boolean, wallet varchar(255));

INSERT INTO pending_btc_testnet (created_by, approved_by, sender_addr, receiver_addr, amount, token, data, tx_hash, use_case, processed, flagged, wallet) VALUES("tony", "", "123", "321", 10.001, "", "", "", "", false, false, "hot_wallet");

SELECT * FROM pending_btc_testnet;
