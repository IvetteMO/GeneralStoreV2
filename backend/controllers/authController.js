const User = require('../models/user');

const ErrorHandler = require('../utils/errorhandler');
const catchAsyncError = require('../middleware/catchAsyncErrors');
const { triggerAsyncId } = require('async_hooks');
const sendToken = require('../utils/hwtToken');
const sendEmail= require('../utils/sendEmail')

const crypto = require('crypto')

//Register user => /api/v1/register
exports. registerUser = catchAsyncError(async (req, res, next)=>{

    const {name, email, password}= req.body;

    const user = await User.create({
        name, 
        email,
        password,
        avatar:{
            public_id: 'v1649572758',
            url:'https://res.cloudinary.com/ibero/image/upload/v1649572758/cld-sample.jpg'
        }
    })


    sendToken(user,200, res)


})

//Login useer => /a[i/v1/login
exports.loginUser= catchAsyncError(async(req, res, next)=>{
    const{email, password} = req.body;

    //Check if email and password is entered by user
    if(!email || !password){

    
    return next(new ErrorHandler('Please enter email & password', 400)) 
}

//Find user in database
const user = await User.findOne({email}).select('+password')

if(!user){
    return next(new ErrorHandler('Invalid Email or Password',401))

}

//Check if password is correct or not
const isPasswordMatched = await user.comparePassword(password);

if(!isPasswordMatched){
    return next(new ErrorHandler('Invalid Email or Password',401))

}

sendToken(user,200, res)

})

//Forgot Password => /api/v1/password/forgot
exports.forgotPassword = catchAsyncError(async(req, res, next) =>{
    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new ErrorHandler('User not found with this email', 404));
    }

    //Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave:false})

    //Create reset password url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is as follow: \n\n${resetUrl}\n\nIf you have not
    requested this email, then ignore it`

    try {

        await sendEmail({
            email: user.email, 
            subject: 'General store Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })
        
    } catch (error) {
        user.resetPasswordToken= undefined;
        user.resetPasswordExpire =undefined;

        await user.save({validateBeforeSave:false})

        return next(new ErrorHandler(error.message,500))

        
    }
})

//Forgot Password => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncError(async(req, res, next) =>{

    //Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.find({
        resetPasswordToken,
        resetPasswordExpire:{$gt: Date.now()}
    })

    if(!user){
        return next(new ErrorHandler('Password reset token is invalid or has been expired', 400))
    }

    if(req.body.password != req.body.confirmPassword){
        return next(new ErrorHandler('Password does not match', 400))
    }

    //Setup new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200, res)

})

//Get currently logged in user details => /api/v1/me

exports.getUserProfile = catchAsyncError(async (req, res, next)=>{
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    })
})

//Update /change password => api/v1/password/update
exports.updatePassword= catchAsyncError(async (req, res, next)=>{

    const user= await User.findById(req.user.id).select('+password');

    //Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if(!isMatched){
        return next(new ErrorHandler('Old password is incorrect', 400))
    }

    user.password = req.body.password;
    await user.save();

    sendToken(user, 200, res)


})

//update user profile => /api/v1/admin/user/update
exports.updateProfile = catchAsyncError(async (req, res, next)=>{
    const newUserData={
        name: req.body.name,
        email: req.body.email
    }

    //Update avatar
    const user= await User.findByIdAndUpdate(req.user.id, newUserData,{
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})

//Logout user => /api/v1/logout
exports.logout = catchAsyncError(async(req, res, next)=>{
    res.cookie('token', null,{
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success:true,
        message: 'Logged out'
    })
})

//Admin Routes

//Get all user =>/api/v1/admin/users
exports.allUsers = catchAsyncError(async (req, res, next)=>{
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
})

//Get user details => /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncError(async (req, res, next)=>{
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

        res.status(200).json({
            success: true,
            user
        })

})

//update user profile => /api/v1/admin/user:id
exports.updateUser = catchAsyncError(async (req, res, next)=>{
    const newUserData={
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    //Update avatar
    const user= await User.findByIdAndUpdate(req.params.id, newUserData,{
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})

//Delete user => /api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next)=>{
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    //Remove avatar from cloudinary - TODO

    await user.remove();

        res.status(200).json({
            success: true,

        })

})