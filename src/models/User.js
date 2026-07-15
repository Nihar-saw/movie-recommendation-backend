const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true,
        trim:true
    },

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },

    password:{
        type:String,
        required:true
    },

    avatar:{
        type:String,
        default:""
    },

    favorites:[
        {
            type:Number
        }
    ],

    watchlist:[
        {
            type:Number
        }
    ],

    recentlyViewed:[
        {
            movieId:Number,
            viewedAt:{
                type:Date,
                default:Date.now
            }
        }
    ],

    history: [
    {
        movieId: Number,
        watchedAt: {
            type: Date,
            default: Date.now
        },
        duration: {
            type: Number,
            default: 0
        },
        completed: {
            type: Boolean,
            default: false
        }
    }
],

},
{
    timestamps:true
});

userSchema.pre("save",async function(next){

    if(!this.isModified("password"))
        return next();

    const salt=await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password,salt);

    next();

});

userSchema.methods.matchPassword=async function(password){

    return await bcrypt.compare(password,this.password);

}

module.exports=mongoose.model("User",userSchema);
