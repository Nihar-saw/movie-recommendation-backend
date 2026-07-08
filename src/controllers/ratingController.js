const MovieRating=require("../models/MovieRating");

const rateMovie=async(req,res)=>{

    const {movieId,rating}=req.body;

    const existing=await MovieRating.findOne({
        user:req.user._id,
        movieId
    });

    if(existing){

        existing.rating=rating;

        await existing.save();

        return res.json(existing);

    }

    const newRating=await MovieRating.create({

        user:req.user._id,

        movieId,

        rating

    });

    res.status(201).json(newRating);

};

const myRatings=async(req,res)=>{

    const ratings=await MovieRating.find({

        user:req.user._id

    });

    res.json(ratings);

};

module.exports={
    rateMovie,
    myRatings
};