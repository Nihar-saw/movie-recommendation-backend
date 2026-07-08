const mongoose=require("mongoose");

const ratingSchema=new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    movieId:{
        type:Number,
        required:true
    },

    rating:{
        type:Number,
        min:1,
        max:5,
        required:true
    }

},{
    timestamps:true
});

ratingSchema.index(
    {
        user:1,
        movieId:1
    },
    {
        unique:true
    }
);

module.exports=mongoose.model("MovieRating",ratingSchema);