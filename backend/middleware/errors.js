const ErrorHandler = require('../utils/errorhandler');

module.exports=(err, req, res, next) =>{
    err.statusCode = err.statusCode || 500;
    
    if(process.env.NODE_ENV === 'DEVELOPMENT'){
        res.status(err.statusCode).json({
            success: false,
            error: err,
            errMessage: err.message,
            stack:err.stack
        })
    }

    if(process.env.NODE_ENV === 'PRODUCTION'){
        let error = {...err}

        error.message = err.message;    

        //Wrong mongo0ose object id error
        if(err.name === 'CastError'){
            const message =`Resource not found. Invalid: ${err.path}`
            error= new ErrorHandler(message, 400)
        }

        //Handling mongoose validation error
        if(err.name === 'ValidationError'){
            const message = Object.values(err.errors).map(value => value.message)
            error = new ErrorHandler(message, 404)
        }

        //Handling mongoose duplicated key error
        if(error.code===11000){
            const message =`Duplicate ${Object.keys(err.keyValue)} entered`
            error = new ErrorHandler(message, 404)
        }

        //Handling wrong JWT error
        if(err.name === 'JsonWebTokenError'){
            const message = 'JSON Web Token is invalid. Try Again!!!'
            error = new ErrorHandler(message, 404)
        }

           //Handling Expired JWT error
        if(err.name === 'TokenExpiredError'){
            const message = 'JSON Web Token is Expired. Try Again!!!'
            error = new ErrorHandler(message, 404)
        }
        
        res.status(error.statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error'

    })
}
}