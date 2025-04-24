const express = require('express');
const connection = require("./Config BD/bd");
const utilisateurRoute = require('./Route/utilisateurRoute');
const connexionRoute =require("./Route/connexionRoute")
const path = require('path');
const cors =require('cors')

const app = express();
app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Servir les fichiers statiques du dossier 'uploads' pour afficher les images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(utilisateurRoute);
app.use(connexionRoute);
app.use(express.static('public'));

const port = 3500;
app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});