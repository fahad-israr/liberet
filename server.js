const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const opn = require('opn');

//opening front end on browser
opn('http://localhost:5000', {app: 'chrome'});


const db = knex({
  client: 'pg',
  connection: {
    connectionString : process.env.DATABASE_URL,
    ssl:true
  }
});

const app = express();

app.use(cors());
app.use(bodyParser.json());



app.get('/',(req,res)=>{res.send('Welcome to liberet corps')})

/*=================================
POST /shoppingCarts/{userId}/add
Add a product to a current active shoppingCart. If the user doesn't have an active it will
create a new reference. NOTE: user can only have 1 ACTIVE shoppingCart
Body:
{
productId: “string”
Amount: number,
serviceDate: “isoUtcDate”
serviceSchedule: “isoUtcDate”
supplier: “string”
deliveryType: “string”
productCost: “string”
}
Response 200:
{
orderId:””
}
*/
app.post('/shoppingCarts/:userId/add',(req,res)=>{

	let {userId}=req.params; 
	let {productId,Amount,serviceDate,serviceSchedule,supplier,deliveryType,productCost}=req.body;
	
	/* Get Order Number if it exists */
	let orderId = db('users').where('userId',userId).pluck('orderId');

	if(!orderId){
		//If Cart is not active then we'll create OrderId
		orderId = userId+"_"+(new Date().toString()); //Make a unique OrderId using userId+currentTime
	} 
	
	// Insert Order into the Order Table:
	db.insert({'orderId':orderId,'productId' : productId,'userId' : userId,
	'Amount' : Amount,'serviceDate' : serviceDate,
	'serviceSchedule' : serviceSchedule,'supplier' : supplier,
	'deliveryType' : deliveryType,'productCost' : productCost}).into('orders').catch(err=>{res.status(400).json('Failied')});

	// Update OrderID if we have a new orderId 
	db('users').update({'orderId':orderId}).where('userId','=',userId).then(res.status(200).json('orderId :'+orderId)).catch(err=>res.status(400).json('Failed to Issue'));
	
	
	});

/*=============================== */



/*===============================
- DEL /shoppingCart/{userId}/remove/{orderId}/{productId}
Response: 204
app.delete(/shoppingCart/:userId/remove/:orderId/:productId)
 */
app.delete('/shoppingCarts/:userId/remove/:orderId/:productId',(req,res)=>{

	let {userId,orderId,productId}=req.params; 
	
	/*Delete from orders table */
	db('orders').where('userId','=',userId).andWhere('orderId','=',orderId).andWhere('productId','=',productId).then(res.status(204).json('Success')).catch(err=>res.status(400).json('Failed'));
	
	});


// ===============================


/*================================
POST /shoppingCart/{userId}/complete
Completes a shopping Cart, if a user adds another product it will be a new shopping cart.
Response 204
*/

app.post('/shoppingCart/:userId/complete',(req,res)=>{

	let {userId}=req.params; 
	
	/*To compete an order we should remove the orderId and let the Items be in the orders table for History */
	db('users').update({'orderId':orderId}).where('userId','=',userId).then(res.status(204).json('Success!!')).catch(err=>res.status(400).json('Failed'));

	});


//=================================

/*=================================
GET /shoppingCart/{userId}
Obtain current active shopping cart in the following forma
Response: 200
{
orders:[
{
orderId:string,
products:[
{
productId:”string”,
amount:number
productPrice:number
},...
],
orderCost:number,
orderDeliveryFee:number
},...
],
totalDeliveryFee: float,
totalOrdersCost: float,
totalCost: float
}
*/
app.get('/shoppingCart/:userId',(req,res)=>{

	let {userId}=req.params; 
	// Get OrderId from users database
	let orderId = db('users').where('userId',userId).pluck('orderId');
	// Fetch Orders from Orders Table
	db.select('*').from('orders').where('orderId','=',orderId).then(data=>res.status(200).send(data)).catch(err=>res.status(400));
	
	});
	

//=================================



app.listen(process.env.PORT||3000, ()=> {
  console.log(`app is running on port ${process.env.PORT||3000}`);
});

console.log(process.env.PORT);