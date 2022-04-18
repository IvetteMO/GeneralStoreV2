const express = require('express')
const router = express.Router()

const {newOrder, 
    getSingleOrder, 
    myOrderS, 
    allOrderS, 
    updateOrder, 
    deleteOrder}= require('../controllers/orderControllers')

const {isAuthenticatedUser, authorizeRoles} = require('../middleware/auth')

router.route('/order/new').post(isAuthenticatedUser, newOrder)


router.route('/order/:id').get(isAuthenticatedUser, getSingleOrder)
router.route('/orders/me').get(isAuthenticatedUser, myOrderS)

router.route('/admin/orders/').get(isAuthenticatedUser, authorizeRoles('admin'), allOrderS)
router.route('/admin/order/:id')
        .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
        .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder)

module.exports=router;