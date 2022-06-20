const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const app = express();
const connectToDb = require("./DB/connect.js")
const Voiture = require("./DB/models/voitures");
const Tracer = require("./DB/models/tracers");
const port = process.env.PORT || 3000;    //pour le deploiment

app.use(express.static(__dirname + '/public'));   //tous ce qui concerne les fichiers stockees dans public

const fileUpload = require("express-fileupload");    //pour resoudre probleme d'images dans express js
app.use(fileUpload());
app.use(express.static("views/img"));
app.use('/views/img/', express.static('./views/img'));

connectToDb()  //connection a la base de donnes

app.set('views', path.join(__dirname, 'views'));   //definir les views
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


////PAGE ACCEUIL
app.get('/', async(req, res) => {
    res.render("index", {
        title: 'Accueil',
    })
})
 

/////PAGE VOITURES
app.get('/voiture', async(req, res) => {
    let voitures = await Voiture.find({})
    res.render("voiture", {
        title: 'Liste des voitures',
        voiture: voitures
    })
})
app.get('/add', async(req, res) => {
    res.render('add', {
        title: 'ajouter voitures'
    });
})
app.post('/save', async(req, res) => {
    const uploadedFile = req.files.image;
    let p = Date.now() + uploadedFile.name
    const uploadPath = __dirname.split("Routers")[0] + "/public/images/" + p;
    var donnees = {
        type: req.body.type,
        matricule: req.body.matricule,
        marque: req.body.marque,
        datec: req.body.datec,
        photo: p
    }
    uploadedFile.mv(uploadPath, async(err) => {
        if (err) {
            console.log(err);
        } else {
            const voiture = await new Voiture(donnees)
            voiture.save().then(async() => {
                res.redirect('/voiture')
            }).catch((err) => {
                res.send(err)
            })
        };
    });
})

app.get('/edit/:id', async(req, res) => {
    let voiture = await Voiture.findById(req.params.id)
    res.render("edit", {
        title: 'voitures',
        m: voiture
    })
})

app.post('/update/:id', async(req, res) => {
    console.log(req.body)
    const uploadedFile = req.files.image;
    let p = Date.now() + uploadedFile.name
    var items = {
            type: req.body.type,
            matricule: req.body.matricule,
            marque: req.body.marque,
            datec: req.body.datec,
            photo: p
        }

    const uploadPath = __dirname.split("Routers")[0] + "/public/images/" + p;
    uploadedFile.mv(uploadPath, async(err) => {
        let data = await Voiture.findByIdAndUpdate(req.params.id, items)
        data.save()
        res.redirect('/voiture')

    });
})

app.get('/delete/:id', async(req, res) => {
    let voiture = await Voiture.findByIdAndDelete(req.params.id)
    res.redirect('/voiture');
})



////LISTE DES TRACERS
app.get('/tracer', async(req, res) => {
    let tracers = await Tracer.find({})
    res.render("tracer", {
        title: 'Liste des tracers',
        tracer: tracers
    })
})




////PAGE VOITURESTRACERS
app.get('/voituretracer', async(req, res) => {
    let voitures = await Voiture.find({})
    res.render("voituretracer", {
        title: 'voituretracer',
        voiture: voitures
    })
})
app.get('/affecterVoiTra', async(req, res) => {
    let voitures = await Voiture.find({})
    let tracersImpo = []
    let tracersDispo = []
    voitures.forEach(e => {
        tracersImpo.push(e.numTracer)
    });

    let tracers = await Tracer.find({})
    tracers.forEach(e => {
        if (!tracersImpo.includes(e.num)) {
            tracersDispo.push(e)
        }
    });
    res.render('affecterVoiTra', {
        title: 'affecter voitures=>tracers',
        voiture: voitures,
        tracer: tracersDispo
    });
})

app.post('/saveaffecter', async(req, res) => {
    var dateTime = new Date()
    const voiture = await Voiture.findOne({ matricule: req.body.voiture })
    voiture.numTracer = req.body.tracer
    voiture.voitureTracer = {
        "numTracer": req.body.tracer,
        "datedebut": dateTime,
        "datefin": null,
    }
    voiture.save()
    res.redirect('/voituretracer');
})

app.get('/deleteaffecter/:id', async(req, res) => {
    let voiture = await Voiture.findById(req.params.id)
    voiture.numTracer = ""
    voiture.save()
    res.redirect('/voituretracer');
})


///PAGE DE MAP

app.get('/envoyerMap', async(req, res) => {
    let tracer = await Tracer.find({ num: req.query.num });
    console.log(tracer[0].position[0].latitude);   // envoie latitude et longitudes
    console.log(tracer);
    let d = new Date();
    let voiture = await Voiture.find({ matricule: req.query.matricule });
    let datefin
    if (voiture[0].voitureTracer[0].datefin === null) {
        datefin = d;
    } else {
        datefin = voiture[0].voitureTracer[0].datefin;
    }
    var date = [];
    for (let i = 0; i < tracer[0].position.length; i++) {    // pour affichages des dates dans select seulement engtre date debut et fin
        if (tracer[0].position[i].date > voiture[0].voitureTracer[0].datedebut && tracer[0].position[i].date < datefin) {
            let yourDate = tracer[0].position[i].date;
            date.push(yourDate.toISOString().split('T')[0])
        } else {
            continue;
        }
    }
    const result = Array.from(new Set(date));
    console.log(result)
    res.render('mapPositions', {
        num: tracer[0].num,
        date: result
    })
})

app.post("/request", async(req, res) => {        //Format des dates affichees dans select
    let tracer = await Tracer.findOne({ num: req.body.num })

    var date = [];
    var div = [];
    var dov = [];
    for (let i = 0; i < tracer.position.length; i++) {
        let yourDate = tracer.position[i].date;

        var nw = yourDate.toISOString().split('T')[0];
        date.push(nw)

    }
    const result = Array.from(new Set(date));
    tracer.position.forEach(function(n) {
        if (n.date.toISOString().split('T')[0] == req.body.date) {
            var d = n.date.toISOString().split('T')[0];
            var la = n.latitude;
            var lo = n.longitude;
            div.push({ d, lo, la })
        }
    });
    console.log(div)
    console.log(result)
    res.json([{
        position: div
    }])
})


/////URL UTLISE  POUR ENVOYER LES VOITURE VERS MOBILE     WEB =>MOBILE
app.get("/sendvoiteur", async(req, res) => {
    let voiture = await Voiture.find({})
    res.send(voiture)
})

app.get("/cord/:id", async(req, res) => {
    let tracker = await Tracer.find({ num: req.params.id })
    console.log(tracker)
    res.send(tracker[0].position[tracker[0].position.length - 1])
})

///// URL UTILISE POUR ENVOYER LES POSITIONS DU MOBILE VERS WEB     MOBILE =>WEB
app.post('/test', async(req, res) => {
    console.log(req.body)
    var posi = {                        //declaration
            num: req.body.id,
            position: [{
                latitude: req.body.lat,
                longitude: req.body.long,
                date: req.body.date
            }]
        }

    const user = await Tracer.findOne({ num: req.body.id });
    if (user) {                                       //ajoute de nouvelle position dans objet deja cree
        const trackerr = await Tracer.find({ num: req.body.id });
        var latlongdate = {
                latitude: req.body.lat,
                longitude: req.body.long,
                date: req.body.date
            }

        Tracer.findOneAndUpdate({ num: req.body.id }, { $push: { position: latlongdate } },     
            function(error, success) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(success);
                }
            }
        );

    } else {
        let tracker = await new Tracer(posi);               //ajouter un nouveau objet
        tracker.save()
    }


})


// Server Listening
app.listen(port, () => {
    console.log('Server is running at port 3000');
});