const admin = require("../config/firebase");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const googleLogin = async (req, res) => {

    try {

        const { idToken } = req.body;

        const decoded = await admin.auth().verifyIdToken(idToken);

        const { uid, email, name, picture } = decoded;

        let user = await User.findOne({ email });

        if (!user) {

            user = await User.create({

                name,

                email,

                avatar: picture,

                firebaseUid: uid,

            });

        }

        const token = generateToken(user._id);

        res.json({

            success: true,

            token,

            user

        });

    } catch (err) {

        res.status(401).json({

            success: false,

            message: err.message

        });

    }

};

module.exports = {

    googleLogin

};