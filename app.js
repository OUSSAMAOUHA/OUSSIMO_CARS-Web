const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const app = express();
const connectToDb = require("./DB/connect.js")
const Voiture = require("./DB/models/voitures");
const Tracer = require("./DB/models/tracers");
const req = require('express/lib/request');
const res = require('express/lib/response');
const port = process.env.PORT || 3000


//connect to db
connectToDb()

app.use(express.static("views/img"));
app.use('/views/img/', express.static('./views/img'));




//definir moteur de template
//set views file
app.set('views', path.join(__dirname, 'views'));
//app.use(express.static(path.join(__dirname, 'public')));

//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/', async(req, res) => {
    let voitures = await Voiture.find({})
    res.render("index", {
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
    const voiture = await new Voiture(req.body)
    voiture.save()
    res.redirect('/');
})

app.get('/edit/:id', async(req, res) => {
    let voiture = await Voiture.findById(req.params.id)
    res.render("edit", {
        title: 'voitures',
        m: voiture
    })
})

app.post('/update/:id', async(req, res) => {
    let data = await Voiture.findByIdAndUpdate(req.params.id, req.body)
    data.save()
    res.redirect('/')
})

app.get('/delete/:id', async(req, res) => {
    let voiture = await Voiture.findByIdAndDelete(req.params.id)
    res.redirect('/');
})

////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/tracer', async(req, res) => {
    let tracers = await Tracer.find({})
    res.render("tracer", {
        title: 'Liste des tracers',
        tracer: tracers
    })
})

//////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/voituretracer', async(req, res) => {
    let voitures = await Voiture.find({})
    res.render("voituretracer", {
        title: 'voituretracer',
        voiture: voitures
    })
})

app.get('/affecter', async(req, res) => {
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
    res.render('affecter', {
        title: 'affecter voitures=>tracers',
        voiture: voitures,
        tracer: tracersDispo
    });
})

app.post('/saveaffecter', async(req, res) => {
    var dateTime = new Date()
    let data = { voiture: req.body.voiture, tracer: req.body.tracer };
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.get('/sendMap/:numTracer', async(req, res) => {
    let tracer = await Tracer.findOne({ num: req.params.numTracer })
    console.log(tracer.position.length)
    console.log(tracer)
    var date = [];
    for (let i = 0; i < tracer.position.length; i++) {
        let yourDate = tracer.position[i].date;
        date.push(yourDate.toISOString().split('T')[0])


    }
    console.log(date)
    const result = Array.from(new Set(date));
    console.log(result)
    res.render('map2', {
        num: tracer.num,
        date: result
    })
})

app.post("/request", async(req, res) => {
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


////////////////////////////////////////////////// send cars
app.get("/sendvoiteur", async(req, res) => {
    let voiture = await Voiture.find({})
    res.send(voiture)
})

app.get("/cord/:id", async(req, res) => {
    let tracker = await Tracer.find({ num: req.params.id })
    console.log(tracker)
    res.send(tracker[0].position[tracker[0].position.length - 1])
})

////////////////////////////////////////////////// get position

app.post('/test', async(req, res) => {
    console.log(req.body)
    var item = {
        num: req.body.id,
        lat: req.body.lat,
        long: req.body.long,
        date: req.body.date
    }
    var item2 = {
            num: req.body.id,
            position: [{
                latitude: req.body.lat,
                longitude: req.body.long,
                date: req.body.date
            }]
        }
        // let tracker = await new tracer(item2)
        // let positionn = await new position(item)

    const user = await Tracer.findOne({ num: req.body.id });
    if (user) {
        const trackerr = await Tracer.find({ num: req.body.id });
        /* console.log(trackerr)*/
        var itemm = {
                latitude: req.body.lat,
                longitude: req.body.long,
                date: req.body.date
            }
            /* trackerr.position.push(itemm)
             trackerr.save()*/

        Tracer.findOneAndUpdate({ num: req.body.id }, { $push: { position: itemm } },
            function(error, success) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(success);
                }
            }
        );

    } else {
        let tracker = await new Tracer(item2);
        tracker.save()
    }


})


// Server Listening
app.listen(port, () => {
    console.log('Server is running at port ', port);
});