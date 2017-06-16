"use strict";

var identifierRegexp = /^[0-9,a-z,A-Z_\.]*$/;

var getQuote = function(str) {
	return '"'+str+'"';
};

var escapeIdentifier = function(str, quote) {
	quote = quote || "`";
	if (identifierRegexp.test(str)) return str;
	else return '`' + str + '`';
};

var startsWith = function(value, str) {
	return value.slice(0, str.length) === str; 
};

/**
 * To check NOT IN Condition
 * @param value
 * @param str
 * @returns boolean
 */
var endsWith = function(value, str) {
	return value[value.length-1] === str; 
};

if (typeof(Function.prototype.override) != 'function') {
	Function.prototype.override = function(fn) {
		var superFunction = this;
		return function() {
			this.inherited = superFunction;
			return fn.apply(this, arguments);
		};
	};
}

module.exports = {

	upgrade: function(connection) {


		connection.query = connection.query.override(function(sql, values, callback) {
			if (typeof(values) === 'function') {
				callback = values;
				values = [];
			}
			var query = this.inherited(sql, values, function(err, res, fields) {
				if (callback) callback(err, res, fields);
			});
			return query;
		});

		/**
		 * Added NOT IN Functionlity
		 * Corrected the checking of '?' symbol (only if in the end)
		 * @param where
		 * @returns string
		*/
		connection.where = function(where) {
				var result = '';
			for (var key in where) {
				var value = where[key],
					clause = key;
				if (typeof(value) === 'number') clause = key+' = '+value;
				else if (typeof(value) === 'string') {
					if (startsWith(value, '>=')) clause = key+' >= '+value.substring(2);
					else if (startsWith(value, '<=')) clause = key+' <= '+value.substring(2);
					else if (startsWith(value, '<>')) clause = key+' <> '+value.substring(2);
					else if (startsWith(value, '>' )) clause = key+' > ' +value.substring(1);
					else if (startsWith(value, '<' )) clause = key+' < ' +value.substring(1);
					else if (startsWith(value, '!(' ) && (endsWith(value, ')')))
						clause = key+' NOT IN ('+value.substr(2, value.length-3).split(',').map(function(s) { return s; }).join(',')+')';
					else if (startsWith(value, '(' ) && (endsWith(value, ')')))
						clause = key+' IN ('+value.substr(1, value.length-2).split(',').map(function(s) { return s; }).join(',')+')';
					else if (value.indexOf('..') !== -1) {
						value = value.split('..');
						clause = '('+key+' BETWEEN '+value[0]+' AND '+value[1]+')';
					} else if ((value.indexOf('*') !== -1) || endsWith(value,'?')) {
						value = this.escape(value.replace(/\*/g, '%').replace(/\?/g, '_'));
						clause = key+' LIKE '+value;
					} else clause = key+' = '+value;
				}
				if (result) result = result+' AND '+clause;
				else result = clause;
			}
			return result;
		};

		connection.order = function(order) {
			var result = [];
			for (var key in order) {
				var val = order[key],
					clause = key;
				result.push(clause + ' ' + val);
			}
			if (result.length) return result.join();
			else return '';
		};

		connection.fields = function(table, callback) {
			this.queryHash('SHOW FULL COLUMNS FROM '+table, [], function(err, res) {
				if (err) res = false;
				callback(err, res);
			});
		};


		/**
		 * Added extra condition to execute only if the table exists
		 * @param table
		 * @param fields
		 * @param where
		 * @param order
		 * @param callback
		 */
		connection.select = function(table, fields, where, order, callback) {
			var dbc = this;
			dbc.fields(table, function(err, fields) {
				if (!err) {
					where = this.where(where);
					if (typeof(order) === 'function') {
						callback = order;
						order = {};
					}
					order = this.order(order);
					var sql = 'SELECT ' + fields + ' FROM ' + table;
					if (where) sql = sql + ' WHERE ' + where;
					if (order) sql = sql + ' ORDER BY ' + order;
					var query = this.query(sql, [], function (err, res) {
						callback(err, res, query);
					});
				}
				else callback(new Error('Table "'+table+'" not found'), false);
			});
		};


		/**
		 * Added checking if the column exists 
		 * @param table
		 * @param row
		 * @param callback
		 */
		connection.insert = function(table, row, callback) {
			var dbc = this;
			dbc.fields(table, function(err, fields) {
				if (!err) {
					fields = Object.keys(fields);
					var rowKeys = Object.keys(row),
						values = [],
						columns = [];
					for (var i in fields) {
						var field = fields[i];
						if (rowKeys.indexOf(field)!=-1) {
							columns.push(field);
							values.push(typeof(row[field])==='number'? row[field]: getQuote(row[field]));
						}
						else return callback(new Error('Error: Column "'+field+'" not found'), false);
					}
					values = values.join(', ');
					columns = columns.join(', ');
					var query = dbc.query('INSERT INTO '+table+' ('+columns+') VALUES ('+values+')', [], function(err, res) {
						callback(err, res ? "Row was added" : false, query);
					});
				} else callback(new Error('Error: Table "'+table+'" not found'), false);
			});
		};

		connection.delete = function(table, where, callback) {
			var dbc = this;
			where = this.where(where);
			if (where) {
				var query = dbc.query('DELETE FROM '+table+' WHERE '+where, [], function(err, res) {
					callback(err, res ? "Deleted records: " + res.affectedRows : false, query);
				});
			} else {
				var e = new Error('can not delete from "'+table+'", because "where" parameter is empty');
				dbc.emit('error', e);
				callback(e, false);
			}
		};

		connection.queryRow = function(sql, values, callback) {
			if (typeof(values) === 'function') {
				callback = values;
				values = [];
			}
			return this.query(sql, values, function(err, res, fields) {
				if (err) res = false;
				else res = res[0] ? res[0] : false;
				callback(err, res, fields);
			});
		};

		connection.queryCol = function(sql, values, callback) {
			if (typeof(values) === 'function') {
				callback = values;
				values = [];
			}
			return this.query(sql, values, function(err, res, fields) {
				var result = [];
				if (err) result = false;
				else {
					for (var i in res) {
						var row = res[i];
						result.push(row[Object.keys(row)[0]]);
					}
				}
				callback(err, result, fields);
			});
		};

		connection.queryValue = function(sql, values, callback) {
			if (typeof(values) === 'function') {
				callback = values;
				values = [];
			}
			return this.queryRow(sql, values, function(err, res, fields) {
				if (err) res = false;
				else res = res[Object.keys(res)[0]];
				callback(err, res, fields);
			});
		};

		connection.queryHash = function(sql, values, callback) {
			if (typeof(values) == 'function') {
				callback = values;
				values = [];
			}
			return this.query(sql, values, function(err, res, fields) {
				var result = {};
				if (err) result = false;
				else {
					for (var i in res) {
						var row = res[i];
						result[row[Object.keys(row)[0]]] = row;
					}
				}
				callback(err, result, fields);
			});
		};

		connection.queryKeyValue = function(sql, values, callback) {
			if (typeof(values) === 'function') {
				callback = values;
				values = [];
			}
			return this.query(sql, values, function(err, res, fields) {
				var result = {};
				if (err) result = false;
				else {
					for (var i in res) {
						var row = res[i];
						result[row[Object.keys(row)[0]]] = row[Object.keys(row)[1]];
					}
				}
				callback(err, result, fields);
			});
		};

		/**
		 * Added checking of the where condition in the update and made it mandatory
		 * @param table
		 * @param row
		 * @param where
		 * @param callback
		*/
		connection.update = function(table, row, where, callback) {
			var dbc = this;
			if(typeof(where) === 'function'){
				callback = where;
				var e = new Error("can't update " + table + ", because 'where' parameter is empty");
				//dbc.emit('error', e);
				return callback(e, false);
			}
			where = this.where(where);
			if (where) {
				var data = [];
				for (var i in row)
					data.push(i + '=' + dbc.escape(row[i]));
				data = data.join(', ');
				var query = dbc.query('UPDATE ' + escapeIdentifier(table) + ' SET ' + data + ' WHERE ' + where, [], function (err, res) {
					callback(err, res ? "Changed rows: " + res.changedRows : false, query);
				});
			}
		};

		/**
		 * Create the where before update is called
		 * @param table
		 * @param row
		 * @param callback
		 */
		connection.upsert = function(table, row, callback) {
			var dbc = this;
			dbc.fields(table, function(err, fields) {
				if (!err) {
					var rowKeys = Object.keys(row),
						uniqueKey = '';
					for (var i in fields) {
						var field = fields[i],
							fieldName = field['Field'];
						if (!uniqueKey && (field['Key']=='PRI' || field['Key']=='UNI') && rowKeys.indexOf(fieldName)!=-1) uniqueKey = fieldName;
					}
					if (rowKeys.indexOf(uniqueKey)!=-1) {
						dbc.queryValue('SELECT count(*) FROM ' + escapeIdentifier(table) + ' WHERE ' + uniqueKey + '=' + dbc.escape(row[uniqueKey]), [], function(err, count) {
							if (count==1) {
								//can't create new object
								var where = {};
								where[uniqueKey] = row[uniqueKey];
								dbc.update(table, row, where, callback);
							}
							else dbc.insert(table, row, callback);
						});
					} else {
						var e = new Error('Error: can not insert or update table "' + table + '", primary or unique key is not specified');
						dbc.emit('error', e);
						callback(e, false);
					}
				} else callback(new Error('Error: Table "' + table + '" not found'), false);
			});
		};

		/**
		 * Added the extra possibility to execute count with out where condition
		 * @param table
		 * @param where
		 * @param callback
		 * @returns *
		 */
		connection.count = function(table, where, callback) {
			if(typeof(where) === 'function'){
				callback = where;
			 	where = false;
			}
			 else {
				where = this.where(where);
			}
			var sql = 'SELECT count(*) FROM ' + escapeIdentifier(table);
			if (where) sql = sql + ' WHERE ' + where;
			return this.queryValue(sql, [], function(err, res) {
				callback(err, res);
			});
		};

		/**
		 * Genartes the SQL to give all the columns using the join
		 * @param tables
		 * @param on
		 * @param where
		 * @param callback
		 * @returns *
		 */
		connection.innerJoin = function(tables, on, where, callback){
			if(typeof(where) === 'function'){
				callback = where;
				where = false;
			}
			else {
				where = this.whereJoin(where);
			}

			var sql = 'select * from ' + tables[0] + ' join ' + tables[1] + ' on '
				+ tables[0] + '.' + on[0] + '=' +tables[1] + '.' + on[1] + ' ';
			if (where) sql = sql + ' where ' + where;
			return this.query(sql, [], function(err, res) {
				callback(err, res);
			});
		}

		connection.leftJoin = function(tables, on, where, callback){
			if(typeof(where) === 'function'){
				callback = where;
				where = false;
			}
			else {
				where = this.whereJoin(where);
			}

			var sql = 'select * from ' + tables[0] + ' left join ' + tables[1] + ' on '
				+ tables[0] + '.' + on[0] + '=' +tables[1] + '.' + on[1] + ' ';
			if (where) sql = sql + ' where ' + where;
			return this.query(sql, [], function(err, res) {
				callback(err, res);
			});
		}

		connection.rightJoin = function(tables, on, where, callback){
			if(typeof(where) === 'function'){
				callback = where;
				where = false;
			}
			else {
				where = this.whereJoin(where);
			}

			var sql = 'select * from ' + tables[0] + ' right join ' + tables[1] + ' on '
				+ tables[0] + '.' + on[0] + '=' +tables[1] + '.' + on[1] + ' ';
			if (where) sql = sql + ' where ' + where;
			return this.query(sql, [], function(err, res) {
				callback(err, res);
			});
		}

		connection.leftOuterJoin = function(tables, on, where, callback){
			if(typeof(where) === 'function'){
				callback = where;
				where = false;
			}
			else {
				where = this.whereJoin(where);
			}

			var sql = 'select * from ' + tables[0] + ' left outer join ' + tables[1] + ' on '
				+ tables[0] + '.' + on[0] + '=' +tables[1] + '.' + on[1] + ' ';
			if (where) sql = sql + ' where ' + where;
			return this.query(sql, [], function(err, res) {
				callback(err, res);
			});
		}

		connection.rightOuterJoin = function(tables, on, where, callback){
			if(typeof(where) === 'function'){
				callback = where;
				where = false;
			}
			else {
				where = this.whereJoin(where);
			}

			var sql = 'select * from ' + tables[0] + ' right outer join ' + tables[1] + ' on '
				+ tables[0] + '.' + on[0] + '=' +tables[1] + '.' + on[1] + ' ';
			if (where) sql = sql + ' where ' + where;
			return this.query(sql, [], function(err, res) {
				callback(err, res);
			});
		}

		/**
		 * For creating Wright where in join function
		 * @param where
		*/
		connection.whereJoin = function(where){
			var result = '';
			for (var key in where) {
				var clause = where[key];
				var clauseResult = key + '.' + this.where(clause);
				result += clauseResult + ' and ';
			}
			result = result.substr(0, result.length - 5);
			return result;
		}
	},

	introspection: function(connection) {
		connection.primary = function(table, callback) {
			this.queryRow('SHOW KEYS FROM ' + escapeIdentifier(table) + ' WHERE Key_name = "PRIMARY"', [], function(err, res) {
				if (err) res = false;
				callback(err, res);
			});
		};

		connection.foreign = function(table, callback) {
			this.queryHash(
				'SELECT CONSTRAINT_NAME, COLUMN_NAME, ORDINAL_POSITION, POSITION_IN_UNIQUE_CONSTRAINT, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME ' +
				'FROM information_schema.KEY_COLUMN_USAGE ' +
				'WHERE REFERENCED_TABLE_NAME IS NOT NULL AND CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? ' +
				'ORDER BY REFERENCED_TABLE_NAME',
				[table],
				function(err, res) {
					if (err) res = false;
					callback(err, res);
				}
			);
		};

		connection.fields = function(table, callback) {
			this.queryHash('SHOW FULL COLUMNS FROM ' + escapeIdentifier(table), [], function(err, res) {
				if (err) res = false;
				callback(err, res);
			});
		};

		connection.databases = function(callback) {
			this.queryCol('SHOW DATABASES', [], function(err, res) {
				if (err) res = false;
				callback(err, res);
			});
		};

		connection.databaseTables = function(database, callback) {
			this.queryHash(
				'SELECT TABLE_NAME, TABLE_TYPE, ENGINE, VERSION, ROW_FORMAT, TABLE_ROWS, ' +
				'AVG_ROW_LENGTH, DATA_LENGTH, MAX_DATA_LENGTH, INDEX_LENGTH, DATA_FREE, AUTO_INCREMENT, ' +
				'CREATE_TIME, UPDATE_TIME, CHECK_TIME, TABLE_COLLATION, CHECKSUM, CREATE_OPTIONS, TABLE_COMMENT ' +
				'FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [database],
				function(err, res) {
					if (err) res = false;
					callback(err, res);
				}
			);
		};

		connection.tableInfo = function(table, callback) {
			this.queryRow('SHOW TABLE STATUS LIKE ?', [table], function(err, res) {
				if (err) res = false;
				callback(err, res);
			});
		};

		connection.users = function(callback) {
			this.query('SELECT * FROM mysql.user', [], function(err, res) {
				if (err) res = false;
				callback(err, res);
			});
		};
	}
};
