node-mariaDB-utilities
----------------------
Taken the base of the [node-mysql-utilities](https://github.com/tshemsedinov/node-mysql-utilities) and modified accordingly to work with the MariaDB. Improved the base functionality by adding extra conditional checks. Now using this library we can add the MariaDB *JOINS* too. Please note that, MariaDB Utilities for [node-mysql driver](https://github.com/felixge/node-mysql) with specialized result types, introspection, joins and other helpful functionality for node.js. 

Installation
------------

    npm install mariadb-utilities
Features
------------

 - MariaDB Data Access Methods
	 -  Query selecting single row: connection.queryRow(sql, values, callback)
	 - Query selecting scalar (single value): connection.queryValue(sql, values, callback)
	 - Query selecting column into array: connection.queryCol(sql, values, callback)
	 - Query selecting hash of records: connection.queryHash(sql, values, callback)
	 - Query selecting key/value hash: connection.queryKeyValue(sql, values, callback)
 - MariaDB Introspection Methods
	 - Get primary key metadata: connection.primary(table, callback)
	 - Get foreign key metadata: connection.foreign(table, callback)
	 - Get table fields metadata: connection.fields(table, callback)
	 - Get connection databases array: connection.databases(callback)
	 - Get database tables list for given db:connection.databaseTables(database, callback)
	 - Get table metadata: connection.tableInfo(table, callback)
	 - Get database users: connection.users(callback)
 - MariaDB SQL Statements Autogenerating Methods
	 - Selecting record(s): connection.select(table, whereFilter, callback)
	 - Inserting record: connection.insert(table, row, callback)
	 - Updating record: connection.update(table, row, where, callback)
	 - Inserting or selecting record: connection.upsert(table, row, callback)
	 - Count records with filter: connection.count(table, whereFilter, callback)
	 - Delete record(s): connection.delete(table, whereFilter, callback)
 - Joins
	 - Inner Join: connection.innerJoin(tables, on, where, callback)
	 - Left Join: connection.leftJoin(tables, on, where, callback)
	 - Right Join: connection.rightJoin(tables, on, where, callback)
	 - Left Outer Join: connection.leftOuterJoin(tables, on, where, callback)
	 - Right Outer Join: connection.rightOuterJoin(tables, on, where, callback)
	 - Where Join: connection.whereJoin(tables, on, where, callback)	 

Initialization
------------
MariDB Utilities can be attached to connection using mix-ins:

    var mariadb = require('mysql');
    var mariaUtilities = require('./maria-utilities.js');
    
    var connection = mariadb.createConnection({
        host:     'localhost',
        user:     'root',
        password: '',
        database: 'maria'
    });
    
    mariaUtilities.introspection(connection);
    mariaUtilities.upgrade(connection);
    connection.connect();
    
    // Testing the MariaDB upgrade Functionality 
    connection.queryRow('select from users where id = ?', 3, function (err, results) {
        console.log(results);
        console.log(err);
    });
    connection.end();

Examples
------------
Examples for the  MariaDB Utilities upgrade Functionality 
/ Testing the MariaDB upgrade Functionality 

    connection.queryRow('select from users where id = ?', 3, function (err, results) {
        console.log(results);
        console.log(err);
    });
    
     connection.queryCol('select name from users where age > ?', 17, function (err, results) {
        console.log(results);
    });
    
    connection.queryValue('select max(age) from users', [], function (err, results) {
        console.log(results);
    });
    
    connection.queryHash("select * from users where surname like '%a%'", [], function (err, results) {
        console.log(results);
    });
    
    connection.queryKeyValue('select name, age from users where age > ?', 20, function (err, results) {
        console.log(results);
    });
    
    console.log(connection.where({
        id: 5,
        year: ">2010",
        price: "100..200",
        level: "<=3",
        sn: "str?",
        label: "str",
        code: "!(1,2,4,10,11)"
    }));
    
    connection.select("notable",["name","surname"], {age: ">=18"}, {name:'desc'}, function (err, results) {
        console.log(err);
    });
    
    connection.insert("users",{id: "7", name: "Kanye", surname: "Cliv", age: "21"},function (err, results) {
        console.log(results);
    });
    
    connection.update("users",{name: "Sanches", surname: "Cast"},  {id: "7"}, function (err, results) {
        console.log(results);
        //console.log(err);
    });
    
    connection.upsert("users",{id: "8", name: "Sanches", surname: "True", age: "22"}, function (err, results) {
        console.log(results);
    });
    
    connection.delete("users",{id: "8"}, function (err, results) {
        console.log(results);
    });
    
    connection.count("users",function (err, results) {
        console.log(results);
    });

Examples for the  MariaDB Utilities Join Functionality

    // Testing the MariaDB upgrade Join Functionality 
    connection.innerJoin(['users', 'students'], ['id', 'id'], {users: { age: "<20"}, students: {id: "<6"}}, function (err, results) {
        console.log(results);
    });

Examples for the  MariaDB Utilities introspection Functionality

    // Testing the MariaDB introspection Functionality 
    connection.primary('users', function (err, results) {
        console.log(results);
    });
    
    connection.foreign('users', function (err, results) {
        console.log(results);
    });
    
    connection.fields('students', function (err, results) {
        console.log(results);
    });
    
    connection.databases(function (err, results) {
        console.log(results);
    });
    
    connection.databaseTables('maria', function (err, results) {
        console.log(results);
    });
    
    connection.tableInfo('users', function (err, results) {
        console.log(results);
    });
    
    connection.users(function (err, results) {
        console.log(results);
    });

