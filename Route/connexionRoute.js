const express = require('express');
const connection = require("../Config BD/bd");
const router = express.Router();

router.post("/connexion", (req, res) => {
    const { nomUtilisateur, motDePasse } = req.body;

    const sql = "SELECT * FROM utilisateurs WHERE nomUtilisateur = ?";
    connection.query(sql, [nomUtilisateur], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Erreur serveur", err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        const utilisateur = results[0];
        if (utilisateur.motDePasse !== motDePasse) {
            return res.status(401).json({ message: "Mot de passe incorrect" });
        }

        res.status(200).json({ message: "Connexion réussie", utilisateur });
    });
});
module.exports=router ;c