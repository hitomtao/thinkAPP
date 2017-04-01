// Generated by CoffeeScript 1.9.1
var Database, NULL, Runtime, SQLite, Statement, apiTemp, i, sqlite3_bind_blob, sqlite3_bind_double, sqlite3_bind_int, sqlite3_bind_parameter_index, sqlite3_bind_text, sqlite3_clear_bindings, sqlite3_close_v2, sqlite3_column_blob, sqlite3_column_bytes, sqlite3_column_double, sqlite3_column_name, sqlite3_column_text, sqlite3_column_type, sqlite3_data_count, sqlite3_errmsg, sqlite3_exec, sqlite3_finalize, sqlite3_free, sqlite3_open, sqlite3_prepare_v2, sqlite3_prepare_v2_sqlptr, sqlite3_reset, sqlite3_step;

Runtime = Module['Runtime'];

apiTemp = Runtime.stackAlloc(4);

SQLite = {};


/* Represents an prepared statement.

Prepared statements allow you to have a template sql string,
that you can execute multiple times with different parameters.

You can't instantiate this class directly, you have to use a [Database](Database.html)
object in order to create a statement.

**Warning**: When you close a database (using db.close()), all its statements are
closed too and become unusable.

@see Database.html#prepare-dynamic
@see https://en.wikipedia.org/wiki/Prepared_statement
 */

Statement = (function() {
  function Statement(stmt1, db) {
    this.stmt = stmt1;
    this.db = db;
    this.pos = 1;
    this.allocatedmem = [];
  }


  /* Bind values to the parameters, after having reseted the statement
  
  	SQL statements can have parameters, named *'?', '?NNN', ':VVV', '@VVV', '$VVV'*,
  	where NNN is a number and VVV a string.
  	This function binds these parameters to the given values.
  
  	*Warning*: ':', '@', and '$' are included in the parameters names
  
  	## Binding values to named parameters
  	@example Bind values to named parameters
  		var stmt = db.prepare("UPDATE test SET a=@newval WHERE id BETWEEN $mini AND $maxi");
  		stmt.bind({$mini:10, $maxi:20, '@newval':5});
  	- Create a statement that contains parameters like '$VVV', ':VVV', '@VVV'
  	- Call Statement.bind with an object as parameter
  
  	## Binding values to parameters
  	@example Bind values to anonymous parameters
  		var stmt = db.prepare("UPDATE test SET a=? WHERE id BETWEEN ? AND ?");
  		stmt.bind([5, 10, 20]);
  	 - Create a statement that contains parameters like '?', '?NNN'
  	 - Call Statement.bind with an array as parameter
  
  	## Value types
  	Javascript type | SQLite type
  	--- | ---
  	number | REAL, INTEGER
  	boolean | INTEGER
  	string | TEXT
  	Array, Uint8Array | BLOB
  	null | NULL
  	@see http://www.sqlite.org/datatype3.html
  
  	@see http://www.sqlite.org/lang_expr.html#varparam
  	@param values [Array,Object] The values to bind
  	@return [Boolean] true if it worked
  	@throw [String] SQLite Error
   */

  Statement.prototype['bind'] = function(values) {
    this['reset']();
    if (Array.isArray(values)) {
      return this.bindFromArray(values);
    } else {
      return this.bindFromObject(values);
    }
  };


  /* Execute the statement, fetching the the next line of result,
  	that can be retrieved with [Statement.get()](#get-dynamic) .
  
  	@return [Boolean] true if a row of result available
  	@throw [String] SQLite Error
   */

  Statement.prototype['step'] = function() {
    var ret;
    if (!this.stmt) {
      throw "Statement closed";
    }
    this.pos = 1;
    switch (ret = sqlite3_step(this.stmt)) {
      case SQLite.ROW:
        return true;
      case SQLite.DONE:
        return false;
      default:
        return this.db.handleError(ret);
    }
  };

  Statement.prototype.getNumber = function(pos) {
    if (pos == null) {
      pos = this.pos++;
    }
    return sqlite3_column_double(this.stmt, pos);
  };

  Statement.prototype.getString = function(pos) {
    if (pos == null) {
      pos = this.pos++;
    }
    return sqlite3_column_text(this.stmt, pos);
  };

  Statement.prototype.getBlob = function(pos) {
    var i, j, ptr, ref, result, size;
    if (pos == null) {
      pos = this.pos++;
    }
    size = sqlite3_column_bytes(this.stmt, pos);
    ptr = sqlite3_column_blob(this.stmt, pos);
    result = new Uint8Array(size);
    for (i = j = 0, ref = size; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      result[i] = HEAP8[ptr + i];
    }
    return result;
  };


  /* Get one row of results of a statement.
  	If the first parameter is not provided, step must have been called before get.
  	@param [Array,Object] Optional: If set, the values will be bound to the statement, and it will be executed
  	@return [Array<String,Number,Uint8Array,null>] One row of result
  
  	@example Print all the rows of the table test to the console
  
  		var stmt = db.prepare("SELECT * FROM test");
  		while (stmt.step()) console.log(stmt.get());
   */

  Statement.prototype['get'] = function(params) {
    var field, j, ref, results1;
    if (params != null) {
      this['bind'](params) && this['step']();
    }
    results1 = [];
    for (field = j = 0, ref = sqlite3_data_count(this.stmt); 0 <= ref ? j < ref : j > ref; field = 0 <= ref ? ++j : --j) {
      switch (sqlite3_column_type(this.stmt, field)) {
        case SQLite.INTEGER:
        case SQLite.FLOAT:
          results1.push(this.getNumber(field));
          break;
        case SQLite.TEXT:
          results1.push(this.getString(field));
          break;
        case SQLite.BLOB:
          results1.push(this.getBlob(field));
          break;
        default:
          results1.push(null);
      }
    }
    return results1;
  };


  /* Get the list of column names of a row of result of a statement.
  	@return [Array<String>] The names of the columns
  	@example
  
  		var stmt = db.prepare("SELECT 5 AS nbr, x'616200' AS data, NULL AS nothing;");
  		stmt.step(); // Execute the statement
  		console.log(stmt.getColumnNames()); // Will print ['nbr','data','nothing']
   */

  Statement.prototype['getColumnNames'] = function() {
    var i, j, ref, results1;
    results1 = [];
    for (i = j = 0, ref = sqlite3_data_count(this.stmt); 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      results1.push(sqlite3_column_name(this.stmt, i));
    }
    return results1;
  };


  /* Get one row of result as a javascript object, associating column names with
  	their value in the current row.
  	@param [Array,Object] Optional: If set, the values will be bound to the statement, and it will be executed
  	@return [Object] The row of result
  	@see [Statement.get](#get-dynamic)
  
  	@example
  
  		var stmt = db.prepare("SELECT 5 AS nbr, x'616200' AS data, NULL AS nothing;");
  		stmt.step(); // Execute the statement
  		console.log(stmt.getAsObject()); // Will print {nbr:5, data: Uint8Array([1,2,3]), nothing:null}
   */

  Statement.prototype['getAsObject'] = function(params) {
    var i, j, len, name, names, rowObject, values;
    values = this['get'](params);
    names = this['getColumnNames']();
    rowObject = {};
    for (i = j = 0, len = names.length; j < len; i = ++j) {
      name = names[i];
      rowObject[name] = values[i];
    }
    return rowObject;
  };


  /* Shorthand for bind + step + reset
  	Bind the values, execute the statement, ignoring the rows it returns, and resets it
  	@param [Array,Object] Value to bind to the statement
   */

  Statement.prototype['run'] = function(values) {
    if (values != null) {
      this['bind'](values);
    }
    this['step']();
    return this['reset']();
  };

  Statement.prototype.bindString = function(string, pos) {
    var bytes, strptr;
    if (pos == null) {
      pos = this.pos++;
    }
    bytes = intArrayFromString(string);
    this.allocatedmem.push(strptr = allocate(bytes, 'i8', ALLOC_NORMAL));
    this.db.handleError(sqlite3_bind_text(this.stmt, pos, strptr, bytes.length - 1, 0));
    return true;
  };

  Statement.prototype.bindBlob = function(array, pos) {
    var blobptr;
    if (pos == null) {
      pos = this.pos++;
    }
    this.allocatedmem.push(blobptr = allocate(array, 'i8', ALLOC_NORMAL));
    this.db.handleError(sqlite3_bind_blob(this.stmt, pos, blobptr, array.length, 0));
    return true;
  };

  Statement.prototype.bindNumber = function(num, pos) {
    var bindfunc;
    if (pos == null) {
      pos = this.pos++;
    }
    bindfunc = num === (num | 0) ? sqlite3_bind_int : sqlite3_bind_double;
    this.db.handleError(bindfunc(this.stmt, pos, num));
    return true;
  };

  Statement.prototype.bindNull = function(pos) {
    if (pos == null) {
      pos = this.pos++;
    }
    return sqlite3_bind_blob(this.stmt, pos, 0, 0, 0) === SQLite.OK;
  };

  Statement.prototype.bindValue = function(val, pos) {
    if (pos == null) {
      pos = this.pos++;
    }
    switch (typeof val) {
      case "string":
        return this.bindString(val, pos);
      case "number":
      case "boolean":
        return this.bindNumber(val + 0, pos);
      case "object":
        if (val === null) {
          return this.bindNull(pos);
        } else if (val.length != null) {
          return this.bindBlob(val, pos);
        } else {
          throw "Wrong API use : tried to bind a value of an unknown type (" + val + ").";
        }
    }
  };


  /* Bind names and values of an object to the named parameters of the statement
  	@param [Object]
  	@private
  	@nodoc
   */

  Statement.prototype.bindFromObject = function(valuesObj) {
    var name, num, value;
    for (name in valuesObj) {
      value = valuesObj[name];
      num = sqlite3_bind_parameter_index(this.stmt, name);
      if (num !== 0) {
        this.bindValue(value, num);
      }
    }
    return true;
  };


  /* Bind values to numbered parameters
  	@param [Array]
  	@private
  	@nodoc
   */

  Statement.prototype.bindFromArray = function(values) {
    var j, len, num, value;
    for (num = j = 0, len = values.length; j < len; num = ++j) {
      value = values[num];
      this.bindValue(value, num + 1);
    }
    return true;
  };


  /* Reset a statement, so that it's parameters can be bound to new values
  	It also clears all previous bindings, freeing the memory used by bound parameters.
   */

  Statement.prototype['reset'] = function() {
    this.freemem();
    return sqlite3_clear_bindings(this.stmt) === SQLite.OK && sqlite3_reset(this.stmt) === SQLite.OK;
  };


  /* Free the memory allocated during parameter binding
   */

  Statement.prototype.freemem = function() {
    var mem;
    while (mem = this.allocatedmem.pop()) {
      _free(mem);
    }
    return null;
  };


  /* Free the memory used by the statement
  	@return [Boolean] true in case of success
   */

  Statement.prototype['free'] = function() {
    var res;
    this.freemem();
    res = sqlite3_finalize(this.stmt) === SQLite.OK;
    delete this.db.statements[this.stmt];
    this.stmt = NULL;
    return res;
  };

  return Statement;

})();

Database = (function() {
  function Database(data) {
    this.filename = 'dbfile_' + (0xffffffff * Math.random() >>> 0);
    if (data != null) {
      FS.createDataFile('/', this.filename, data, true, true);
    }
    this.handleError(sqlite3_open(this.filename, apiTemp));
    this.db = getValue(apiTemp, 'i32');
    this.statements = {};
  }


  /* Execute an SQL query, ignoring the rows it returns.
  
  	@param sql [String] a string containing some SQL text to execute
  	@param params [Array] (*optional*) When the SQL statement contains placeholders, you can pass them in here. They will be bound to the statement before it is executed.
  
  	If you use the params argument, you **cannot** provide an sql string that contains several
  	queries (separated by ';')
  
  	@example Insert values in a table
  	    db.run("INSERT INTO test VALUES (:age, :name)", {':age':18, ':name':'John'});
  
  	@return [Database] The database object (usefull for method chaining)
   */

  Database.prototype['run'] = function(sql, params) {
    var stmt;
    if (!this.db) {
      throw "Database closed";
    }
    if (params) {
      stmt = this['prepare'](sql, params);
      stmt['step']();
      stmt['free']();
    } else {
      this.handleError(sqlite3_exec(this.db, sql, 0, 0, apiTemp));
    }
    return this;
  };


  /* Execute an SQL query, and returns the result.
  
  	This is a wrapper against Database.prepare, Statement.step, Statement.get,
  	and Statement.free.
  
  	The result is an array of result elements. There are as many result elements
  	as the number of statements in your sql string (statements are separated by a semicolon)
  
  	Each result element is an object with two properties:
  		'columns' : the name of the columns of the result (as returned by Statement.getColumnNames())
  		'values' : an array of rows. Each row is itself an array of values
  
  	## Example use
  	We have the following table, named *test* :
  
  	| id | age |  name  |
  	|:--:|:---:|:------:|
  	| 1  |  1  | Ling   |
  	| 2  |  18 | Paul   |
  	| 3  |  3  | Markus |
  
  
  	We query it like that:
  	```javascript
  	var db = new SQL.Database();
  	var res = db.exec("SELECT id FROM test; SELECT age,name FROM test;");
  	```
  
  	`res` is now :
  	```javascript
  		[
  		 	{columns: ['id'], values:[[1],[2],[3]]},
  		 	{columns: ['age','name'], values:[[1,'Ling'],[18,'Paul'],[3,'Markus']]}
  		]
  	```
  
  	@param sql [String] a string containing some SQL text to execute
  	@return [Array<QueryResults>] An array of results.
   */

  Database.prototype['exec'] = function(sql) {
    var curresult, nextSqlPtr, pStmt, pzTail, results, stack, stmt;
    if (!this.db) {
      throw "Database closed";
    }
    stack = Runtime.stackSave();
    nextSqlPtr = Runtime.stackAlloc(sql.length << 2 + 1);
    writeStringToMemory(sql, nextSqlPtr);
    pzTail = Runtime.stackAlloc(4);
    results = [];
    while (getValue(nextSqlPtr, 'i8') !== NULL) {
      setValue(apiTemp, 0, 'i32');
      setValue(pzTail, 0, 'i32');
      this.handleError(sqlite3_prepare_v2_sqlptr(this.db, nextSqlPtr, -1, apiTemp, pzTail));
      pStmt = getValue(apiTemp, 'i32');
      nextSqlPtr = getValue(pzTail, 'i32');
      if (pStmt === NULL) {
        continue;
      }
      stmt = new Statement(pStmt, this);
      curresult = null;
      while (stmt['step']()) {
        if (curresult === null) {
          curresult = {
            'columns': stmt['getColumnNames'](),
            'values': []
          };
          results.push(curresult);
        }
        curresult['values'].push(stmt['get']());
      }
      stmt['free']();
    }
    Runtime.stackRestore(stack);
    return results;
  };


  /* Execute an sql statement, and call a callback for each row of result.
  
  	**Currently** this method is synchronous, it will not return until the callback has
  	been called on every row of the result. But this might change.
  
  	@param sql [String] A string of SQL text. Can contain placeholders that will be
  	bound to the parameters given as the second argument
  	@param params [Array<String,Number,null,Uint8Array>] (*optional*) Parameters to bind 
  	to the query
  	@param callback [Function(Object)] A function that will be called on each row of result
  	@param done [Function] A function that will be called when all rows have been retrieved
  
  	@return [Database] The database object. Usefull for method chaining
  
  	@example Read values from a table
  	    db.each("SELECT name,age FROM users WHERE age >= $majority",
  	    				{$majority:18},
  	    				function(row){console.log(row.name + " is a grown-up.")}
  	    			);
   */

  Database.prototype['each'] = function(sql, params, callback, done) {
    var stmt;
    if (typeof params === 'function') {
      done = callback;
      callback = params;
      params = void 0;
    }
    stmt = this['prepare'](sql, params);
    while (stmt['step']()) {
      callback(stmt['getAsObject']());
    }
    stmt['free']();
    if (typeof done === 'function') {
      return done();
    }
  };


  /* Prepare an SQL statement
  	@param sql [String] a string of SQL, that can contain placeholders ('?', ':VVV', ':AAA', '@AAA')
  	@param params [Array] (*optional*) values to bind to placeholders
  	@return [Statement] the resulting statement
  	@throw [String] SQLite error
   */

  Database.prototype['prepare'] = function(sql, params) {
    var pStmt, stmt;
    setValue(apiTemp, 0, 'i32');
    this.handleError(sqlite3_prepare_v2(this.db, sql, -1, apiTemp, NULL));
    pStmt = getValue(apiTemp, 'i32');
    if (pStmt === NULL) {
      throw 'Nothing to prepare';
    }
    stmt = new Statement(pStmt, this);
    if (params != null) {
      stmt.bind(params);
    }
    this.statements[pStmt] = stmt;
    return stmt;
  };


  /* Exports the contents of the database to a binary array
  	@return [Uint8Array] An array of bytes of the SQLite3 database file
   */

  Database.prototype['export'] = function() {
    var _, binaryDb, ref, stmt;
    ref = this.statements;
    for (_ in ref) {
      stmt = ref[_];
      stmt['free']();
    }
    this.handleError(sqlite3_close_v2(this.db));
    binaryDb = FS.readFile(this.filename, {
      encoding: 'binary'
    });
    this.handleError(sqlite3_open(this.filename, apiTemp));
    this.db = getValue(apiTemp, 'i32');
    return binaryDb;
  };


  /* Close the database, and all associated prepared statements.
  
  	The memory associated to the database and all associated statements
  	will be freed.
  
  	**Warning**: A statement belonging to a database that has been closed cannot
  	be used anymore.
  
  	Databases **must** be closed, when you're finished with them, or the
  	memory consumption will grow forever
   */

  Database.prototype['close'] = function() {
    var _, ref, stmt;
    ref = this.statements;
    for (_ in ref) {
      stmt = ref[_];
      stmt['free']();
    }
    this.handleError(sqlite3_close_v2(this.db));
    FS.unlink('/' + this.filename);
    return this.db = null;
  };


  /* Analyze a result code, return null if no error occured, and throw
  	an error with a descriptive message otherwise
  	@nodoc
   */

  Database.prototype.handleError = function(returnCode) {
    var errmsg;
    if (returnCode === SQLite.OK) {
      return null;
    } else {
      errmsg = sqlite3_errmsg(this.db);
      throw new Error(errmsg);
    }
  };

  return Database;

})();

sqlite3_open = Module['cwrap']('sqlite3_open', 'number', ['string', 'number']);

sqlite3_close_v2 = Module['cwrap']('sqlite3_close_v2', 'number', ['number']);

sqlite3_exec = Module['cwrap']('sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number']);

sqlite3_free = Module['cwrap']('sqlite3_free', '', ['number']);

sqlite3_prepare_v2 = Module['cwrap']('sqlite3_prepare_v2', 'number', ['number', 'string', 'number', 'number', 'number']);

sqlite3_prepare_v2_sqlptr = Module['cwrap']('sqlite3_prepare_v2', 'number', ['number', 'number', 'number', 'number', 'number']);

sqlite3_bind_text = Module['cwrap']('sqlite3_bind_text', 'number', ['number', 'number', 'number', 'number', 'number']);

sqlite3_bind_blob = Module['cwrap']('sqlite3_bind_blob', 'number', ['number', 'number', 'number', 'number', 'number']);

sqlite3_bind_double = Module['cwrap']('sqlite3_bind_double', 'number', ['number', 'number', 'number']);

sqlite3_bind_int = Module['cwrap']('sqlite3_bind_int', 'number', ['number', 'number', 'number']);

sqlite3_bind_parameter_index = Module['cwrap']('sqlite3_bind_parameter_index', 'number', ['number', 'string']);

sqlite3_step = Module['cwrap']('sqlite3_step', 'number', ['number']);

sqlite3_errmsg = Module['cwrap']('sqlite3_errmsg', 'string', ['number']);

sqlite3_data_count = Module['cwrap']('sqlite3_data_count', 'number', ['number']);

sqlite3_column_double = Module['cwrap']('sqlite3_column_double', 'number', ['number', 'number']);

sqlite3_column_text = Module['cwrap']('sqlite3_column_text', 'string', ['number', 'number']);

sqlite3_column_blob = Module['cwrap']('sqlite3_column_blob', 'number', ['number', 'number']);

sqlite3_column_bytes = Module['cwrap']('sqlite3_column_bytes', 'number', ['number', 'number']);

sqlite3_column_type = Module['cwrap']('sqlite3_column_type', 'number', ['number', 'number']);

sqlite3_column_name = Module['cwrap']('sqlite3_column_name', 'string', ['number', 'number']);

sqlite3_reset = Module['cwrap']('sqlite3_reset', 'number', ['number']);

sqlite3_clear_bindings = Module['cwrap']('sqlite3_clear_bindings', 'number', ['number']);

sqlite3_finalize = Module['cwrap']('sqlite3_finalize', 'number', ['number']);

this['SQL'] = {
  'Database': Database
};

for (i in this['SQL']) {
  Module[i] = this['SQL'][i];
}

NULL = 0;

SQLite.OK = 0;

SQLite.ERROR = 1;

SQLite.INTERNAL = 2;

SQLite.PERM = 3;

SQLite.ABORT = 4;

SQLite.BUSY = 5;

SQLite.LOCKED = 6;

SQLite.NOMEM = 7;

SQLite.READONLY = 8;

SQLite.INTERRUPT = 9;

SQLite.IOERR = 10;

SQLite.CORRUPT = 11;

SQLite.NOTFOUND = 12;

SQLite.FULL = 13;

SQLite.CANTOPEN = 14;

SQLite.PROTOCOL = 15;

SQLite.EMPTY = 16;

SQLite.SCHEMA = 17;

SQLite.TOOBIG = 18;

SQLite.CONSTRAINT = 19;

SQLite.MISMATCH = 20;

SQLite.MISUSE = 21;

SQLite.NOLFS = 22;

SQLite.AUTH = 23;

SQLite.FORMAT = 24;

SQLite.RANGE = 25;

SQLite.NOTADB = 26;

SQLite.NOTICE = 27;

SQLite.WARNING = 28;

SQLite.ROW = 100;

SQLite.DONE = 101;

SQLite.INTEGER = 1;

SQLite.FLOAT = 2;

SQLite.TEXT = 3;

SQLite.BLOB = 4;

SQLite.NULL = 5;