var express = require('express');
const {  response } = require('../app');
 var router = express.Router();
const productHelpers = require('../helpers/store-product-helpers');
const userHelpers = require('../helpers/store-user-helpers ');

 const verifyLogin=(req,res,next)=>{
    if(req.session.loggedIn){
      next()
    }
    else{
      res.render('store/user/login')
    }
  }
  


router.get('/',verifyLogin, async function(req, res, next) {
    console.log('loading products........');
     let user=req.session.user
     let cartCount =null
     if(req.session.user){
       cartCount= await userHelpers.getCartCount(req.session.user._id)
     }
    
        productHelpers.getAllProducts().then((products)=>{
       
          console.log(products);
          console.log('full products loaded and displayed successfully');
          res.render('store/user/store-view-products',{products,user,cartCount})
  
        })
   
  })
  
  router.get('/login',(req,res)=>{ 
    console.log(' rendering login page...');
    if(req.session.loggedIn)
    {
      console.log('redirecting to the home page....(already logged in)');
      res.redirect('/')
    }
    else{
      res.render('login',{'loginErr':req.session.loginErr })
    console.log('login page loaded successfully...');
  
    }
    
  }) 
//   router.get('/signup',(req,res)=>{
//     console.log(' rendering signup page...');
//     res.render('user/signup') 
//     console.log('signup page loaded successfully....');
//   })
//   router.post('/signup',(req,res)=>{
//     console.log('submitting sign up page requests...');
//     userHelpers.doSignup(req.body).then((response)=>{
//       console.log(response);
//       req.session.loggedIn=true
//       req.session.user=response
//       res.redirect('/')
//     })
  
  
//   })
  router.post('/login',(req,res)=>{
    console.log('submitting login page requestes...');
    console.log(req.body);
    userHelpers.doLogin(req.body).then((response)=>{
      if(response.status){
        req.session.loggedIn=true
        req.session.user=response.user
        res.redirect('/')
      }else{
        req.session.loginErr="Invalied Username or Password"
        res.redirect('/login')
      }
    })
  })
  router.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/')
  })
  router.get('/cart', async (req, res) => {
    let products = await userHelpers.getCartProducts(req.session.user._id)
    let totalValue =0
    
    if(products.length>0){
      totalValue = await userHelpers.getTotalAmount(req.session.user._id)
    }
    
    console.log(products);
    res.render('user/cart', { products, user: req.session.user, totalValue })
  })
    
  
  router.get('/add-to-cart/:id',(req,res)=>{
    console.log('api call');
    console.log(req.params);
    //console.log(req.params.id);
    
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{ 
      res.json({status:true})
    })
  })
  
  router.post('/delete-Product', (req, res, next) => {
    console.log(req.body);
  
    userHelpers.deleteProduct(req.body).then((response) => {
      res.json(response)
    })
  })
  
  router.post('/change-product-quantity',  (req, res, next) => {
    console.log(req.body);
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = 0
      if (req.body.count != -1 || req.body.quantity != 1) {
      response.total = await userHelpers.getTotalAmount(req.body.user)
      }
      res.json(response)
  
  
    })
  })
  router.get('/place-order',  async (req, res) => {
    let total = await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/place-order', { total, user: req.session.user })
  })
  router.post('/place-order', async (req, res) => {
    let products = await userHelpers.getCartProductList(req.body.userId)
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
      console.log(orderId)
      if(req.body['payment-method']==='COD'){
        res.json({ codSuccess: true })
      }else{
        userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
          res.json(response)
  
        })
      }
     
  
    })
    console.log(req.body);
  
  })
  
  router.get('/order-success', (req, res) => {
    res.render('user/order-success', { user: req.session.user })
  })
  router.get('/orders', async (req, res) => {
    let orders = await userHelpers.getUserOrders(req.session.user._id)
    res.render('user/orders', { user: req.session.user, orders })
  })
  router.get('/view-order-products/:id', async (req, res) => {
    let products = await userHelpers.getOrderProducts(req.params.id)
    console.log(products)
    res.render('user/view-order-products', { user: req.session.user, products })
  })
  router.post('/verify-payment',(req,res)=>{
    console.log(req.body);
    userHelpers.verifyPayment(req.body).then(()=>{
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
        console.log('payment successfull')
        res.json({status:true})
      })
    }).catch((err)=>{
      console.log(err);
      res.json({status:false,errMsg:'Payment Failed'})
    })
  })
  module.exports = router;