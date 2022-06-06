const mongoose = require('mongoose');



var voitureSchema = new mongoose.Schema({
  matricule: {
    type: String,
  },
  type:{
      type: String,
  },
  marque: {
    type: String,
  },
datec:{
  type: Date,
},
photo:{
  type: String,
},
numTracer: {
  type: String,
},
voitureTracer:[{
  numTracer: {
    type: String,
  },
  datedebut:{
    type: Date,
  },
  datefin:{
    type: Date,
  },
}]
}, {timestamps: true});





const Voiture = mongoose.model('voiture', voitureSchema);
module.exports =  Voiture