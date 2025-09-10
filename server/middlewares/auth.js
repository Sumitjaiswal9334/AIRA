// import jwt from 'jsonwebtoken'
// import User from '../models/User.js';

// export const protect = async (req, res, next) => {
//     let token = req.headers.authorization;

//     try{
//         const decoded = jwt.verify(token, process.env.JWT_SECRET)
//         const userId = decoded.id;

//         const user = await User.findById(userId)

//         if(!user){
//             return res.json({success:false, message:"Not authorised, user not found"});
//         }

//         req.user = user;
//         next()
//     } catch (error){
//         res.status(401).json({messages: "Not authorized, token failed"})

//     }

// }


import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token = req.headers.authorization;

    try {
        // ✅ Extract token if starts with "Bearer "
        if (token && token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized, token missing" });
        }

        // ✅ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Fetch user
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Not authorized, user not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
};

