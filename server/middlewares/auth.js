import jwt from 'jsonwebtoken'
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token = req.headers.authorization;

    try{
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decode.id;

        const user = await User.findOne(userId)

        if(!user){
            return res.json({success:false, message:"Not authorised, user not found"});
        }

        req.user = user;
        next()
    } catch (error){
        res.status(401).json({messages: "Not authorized, token failed"})

    }

}