const jwt = require("jsonwebtoken")

const verify = (req, res, next) => {
    let accessToken = req.body.token;
    if (!accessToken) {
        return res.status(403).send()
    }
    try {
        //use the jwt.verify method to verify the access token
        let payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        res.locals.username = payload.username;
        res.locals.id = payload.id;
        console.log("user verified successfully");
        next()
    }
    catch (e) {
        //if an error occurred return request unauthorized error
        console.log("user verification is fail");
        res.locals.currentuser = null;
        return res.status(401).send()
    }
}

module.exports = verify;
