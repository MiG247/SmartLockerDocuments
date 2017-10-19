'use strict';

const fs = require('fs');

exports.getHtml = function (req, res, next) {
  /**
   * Returns the landing page.
   *
   * no response value expected for this operation
   **/
   fs.readFile('web/index.html', 'utf8', (err, data) => {
     if (err) {
       return res.error({
         status: 500,
         message: 'File System Error',
         err: err
       });
     }
     // Replace Link Placeholder with rest of the url
     // this makes it possible to mantain querys
     data = data.replace(/{{link}}/g, req.url);
     res.statusCode = 200;
     res.end(data);
   });
}

/**
 * getMenue
 *
 **/

var mysql = require('mysql');

 var con = mysql.createConnection({
  host: "localhost",
  user: "RobertMarxreiter",
  password: "test123",
  database: "DatabaseSQL_Creates"
});

 con.connect(function(err) {
  if (err) throw err;
  con.query("SELECT combo1 * FROM foodCombo WHERE ", function (err, result, fields){
    if (err) throw err;
    console.log(result);
  });
});


/**
 example sql statement with AJAX:

 mysqli_select_db($con,"ajax_demo");
 $sql="SELECT * FROM user WHERE id = '".$q."'";
 $result = mysqli_query($con,$sql);
 **/



/**
 generating PIN
 Implementation advice:
 Math Object -> Random numbers
 example: dice (numbers 1 - 6)
 Usage of the function Math.random(). returns numbers between 0 and 1, one will never reached, example result 0.35890368036023 or 0.1230534069.
 By multiplicating 6 the needed numbers area is reached
 Math.random() * 6 exals for example 5.4580489458 or 3.09954602340964
 Usage of Math.floor deletes the not needed numbers after the comma, the round function would change the probability
 Math.floor( Math.random() * 6) exals for example 1 or 4
 Problem: 6 would never be returned: so add +1: Math.floor( Math.random() * 6) + 1 exals for exmple 1 or 6.
 **/
Math.floor( Math.random() * 9)+ 1

