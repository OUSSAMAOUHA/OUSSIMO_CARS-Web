const mongoose = require('mongoose');



var tracerSchema = new mongoose.Schema({
  num: {
    type: String,
  },
  position:[{
    latitude: {
      type: Number,
    },
    longitude:{
        type: Number,
    },
    date:{
      type: Date,
    },
  }]
}, {timestamps: true});





const Tracer = mongoose.model('tracer', tracerSchema);
module.exports =  Tracer

