var express = require('express');
var router=express.Router();
var Sequelize = require('sequelize');
var sequelize = new Sequelize('db', 'root', 'admin',{
host:"127.0.0.1",
port:3306,
dialect:"mariadb"
})


//creating/defining a table with tablename table1 and giving it into a variable User
var Table1 = sequelize.define('DeploymentConfiguration', {
Id:{ type: Sequelize.INTEGER,primaryKey :true},
Configuration :{type:Sequelize.STRING},
CreatedBy: {type:Sequelize.STRING},
CreatedOn:{type:Sequelize.DATE},
ModifiedOn:{type:Sequelize.DATE},
ModifiedBy:{type:Sequelize.STRING},
IsDeleted:{type:Sequelize.BOOLEAN}
},{timestamps:false,
tableName:'DeploymentConfiguration'});




//inserting data into table1 dynamically using User.create method
 router.post('/t1',function(req,res,next){
	 console.log("table1 hitted")

Table1.create({"Id":req.body.Id,
"Configuration":req.body.Configuration,
"CreatedBy":req.body.CreatedBy,
"CreatedOn":req.body.CreatedOn,
"ModifiedOn":req.body.ModifiedOn,
"ModifiedBy":req.body.ModifiedBy,
"IsDeleted":req.body.IsDeleted
}).
then(function(a) { 
console.log(a);
res.json(a); 
}, function(error) { 
res.send(error); 
}); 
}); 

//creating a table with tablename table2 and giving it into a variable Post
var Table2 = sequelize.define('DeploymentJob', {
Id: {type :Sequelize.INTEGER,primaryKey :true},
StartDateTime :{type :Sequelize.DATE},
EndDateTime: {type :Sequelize.DATE},
Status:{type :Sequelize.INTEGER},
ApplicationName:{type :Sequelize.STRING},
CreatedBy:{type :Sequelize.STRING},
CreatedOn:{type :Sequelize.DATE},
ModifiedOn:{type :Sequelize.DATE},
ModifiedBy:{type :Sequelize.STRING},
IsDeleted:{type :Sequelize.BOOLEAN},
Configuration_Id:{type :Sequelize.INTEGER,foreignKey :true},
SignOffUser:{type:Sequelize.STRING}

},{timestamps:false,
tableName:'DeploymentJob'
});


//inserting data into table2 dynamically using Post.create method
 router.post('/t2',function(req,res,next){

 console.log("Table2 Hitted")
 
Table2.create({"Id":req.body.Id,
"StartDateTime":req.body.StartDateTime,
"EndDateTime":req.body.EndDateTime,
"Status":req.body.Status,
"ApplicationName":req.body.ApplicationName,
"CreatedBy":req.body.CreatedBy,
"CreatedOn":req.body.CreatedOn,
"ModifiedOn":req.body.ModifiedOn,
"ModifiedBy":req.body.ModifiedBy,
"IsDeleted":req.body.IsDeleted,
"Configuration_Id":req.body.Configuration_Id,
"SignOffUser":req.body.SignOffUser

}).
then(function(b) { 
res.json(b); 
}, function(error) { 
res.send(error); 
}); 
}); 


//to create foreignKey for the two tables to retrieve data
Table2.belongsTo(Table1, {foreignKey: 'Configuration_Id'})



var arr=[];
var count=0;
//to retrieve data from two tables using sequelizer method
//localhost:3000/data/
router.get('/',function(req,res,next){
//Table2.findAll({include:Table1,order: 'StartDateTime DESC'})
Table2.findAll({include:Table1,order: [['StartDateTime','DESC']]}).then(function(data) {
	
for(i=0;i<data.length;i++)
	{
	
	var json={
		
		//DeploymentConfiguration Table Data
		"Id":data[i].DeploymentConfiguration.Id,
		"Configuration":data[i].DeploymentConfiguration.Configuration,
		"CreatedBy":data[i].DeploymentConfiguration.CreatedBy,
		"CreatedOn":data[i].DeploymentConfiguration.CreatedOn,
		"ModifiedOn":data[i].DeploymentConfiguration.ModifiedOn,
		"ModifiedBy":data[i].DeploymentConfiguration.ModifiedBy,
		"IsDeleted":data[i].DeploymentConfiguration.IsDeleted,
		//DeploymentJob Table Data
		"ApplicationName":data[i].ApplicationName,
		"StartDateTime":data[i].StartDateTime
	
	}
	arr.push(json);//Pushing 'json' data to arr array variable
	count++; //counting number of records from the output
	
}
console.log("Testing Data is :"+JSON.stringify(arr));
console.log("\nTotal Count : "+count);//counting number of records from the output


	
res.json(arr); 
}, function(error) { 
res.send(error); 
}); 
});

module.exports = sequelize;
module.exports = Table1;
module.exports=Table2;
module.exports = router;