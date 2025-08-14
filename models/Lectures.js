import mongoose from "mongoose"

const lectureSchema = new mongoose.Schema({
    subject:String,
    day:String,
    date:String,
    startTime:String,
    endTime:String,
    room:String
})

export default lectureSchema;