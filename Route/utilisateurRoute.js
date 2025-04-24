const express = require('express');
const connection = require("../Config BD/bd");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Importez le module 'fs' pour la gestion des fichiers

// Configuration de Multer pour le stockage des fichiers image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// afficher les utilisateurs

router.get("/utilisateurs", (req, res) => {
    connection.query("SELECT * FROM utilisateurs", [], (erreur, resultat) => {
        if (erreur) {
            console.log(erreur);
            res.status(500).json({ erreur });
        } else {
            res.status(200).send({ resultat });
        }
    });
});

// afficher un utilisateur specifique

router.get("/utilisateurs/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM utilisateurs WHERE id = ?";

    connection.query(sql, [id], (erreur, resultat) => {
        if (erreur) {
            console.error("Erreur lors de la récupération de l'utilisateur:", erreur);
            return res.status(500).json({ error: "Erreur serveur", details: erreur.message });
        }
        res.status(200).json(resultat[0]);
    });
});

// Créer un utilisateur avec une image de profil (gestion de l'upload via Multer)

router.post("/utilisateurs", upload.single('photoProfil'), (req, res) => {
    const { nomUtilisateur, motDePasse } = req.body;
    const chemin_image = req.file ? `/uploads/${req.file.filename}` : null;
    console.log("Données reçues :", req.body);
    console.log("Fichier reçu :", req.file);

    const sql = "INSERT INTO utilisateurs (nomUtilisateur, motDePasse, chemin_image) VALUES(?, ?, ?)";
    const data = [nomUtilisateur, motDePasse, chemin_image];

    connection.query(sql, data, (erreur, resultat) => {
        if (erreur) {
            console.log(erreur);
            if (req.file) fs.unlinkSync(req.file.path); // Nettoyer le fichier si erreur
            return res.status(500).json({ message: "Erreur lors de l'insertion", erreur }); 
        }

        return res.status(201).json({
            message: "Utilisateur créé avec succès",
            utilisateur: {
                id: resultat.insertId,
                nomUtilisateur,
                chemin_image
            }
        });
    });
});


// Modifier un utilisateur (permet la modification de l'image - optionnel)
router.put("/utilisateurs/:id", upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { nomUtilisateur, motDePasse } = req.body;
    const nouveau_chemin_image = req.file ? `/uploads/${req.file.filename}` : null;
    let sql = "UPDATE utilisateurs SET nomUtilisateur = ?, motDePasse = ?";
    const data = [nomUtilisateur, motDePasse];

    if (nouveau_chemin_image) {
        sql += ", chemin_image = ?";
        data.push(nouveau_chemin_image);
    }
    sql += " WHERE id = ?";
    data.push(id);

    connection.query(sql, data, (erreur, resultat) => {
        if (erreur) {
            console.log(erreur);
            // Supprimer le nouveau fichier uploadé en cas d'erreur
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ erreur });
        } else {
            res.status(200).json({ message: "Mise à jour réussie", chemin_image: nouveau_chemin_image });
        }
    });
});

router.delete("/utilisateurs/:id", (req, res) => {
    const id = req.params.id;

    // Récupérer le chemin de l'image à supprimer (optionnel)
    connection.query("SELECT chemin_image FROM utilisateurs WHERE id = ?", [id], (err, results) => {
        if (err) {
            console.error("Erreur lors de la récupération du chemin de l'image:", err);
        } else if (results.length > 0 && results[0].chemin_image) {
            const imagePath = path.join(__dirname, '../', results[0].chemin_image);
            fs.unlink(imagePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Erreur lors de la suppression de l'image:", unlinkErr);
                }
            });
        }

        // Supprimer l'utilisateur
        connection.query("DELETE FROM utilisateurs WHERE id = ?", [id], (erreur, resultat) => {
            if (erreur) {
                console.log(erreur);
                res.status(500).json({ erreur });
            } else {
                res.status(200).json({ message: "utilisateur supprimé" });
            }
        });
    });
});

module.exports = router;