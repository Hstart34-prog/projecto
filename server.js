const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const carpetaVideos = path.join(__dirname, 'videos_recibidos');
if (!fs.existsSync(carpetaVideos)){
    fs.mkdirSync(carpetaVideos);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'videos_recibidos/');
    },
    filename: (req, file, cb) => {
        cb(null, `clip_ana_${Date.now()}_${Math.round(Math.random() * 1E9)}.webm`);
    }
});

const upload = multer({ storage: storage });

app.post('/subir-video', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Archivo ausente.');
    }
    res.status(200).send('Subido correctamente.');
});

app.use('/videos_recibidos', express.static(carpetaVideos));

app.get('/lista-de-videos-secreta', (req, res) => {
    fs.readdir(carpetaVideos, (err, archivos) => {
        if (err) return res.status(500).send('Error de lectura.');
        const videos = archivos.filter(archivo => archivo.endsWith('.webm'));
        
        let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Panel Secreto</title><style>body{font-family:sans-serif;background:#1e1e24;color:white;padding:40px;text-align:center;}.lista{max-width:600px;margin:0 auto;text-align:left;background:#2a2a35;padding:15px;border-radius:12px;}a{color:#ff7eb3;text-decoration:none;display:block;padding:15px;border-bottom:1px solid #3a3a45;font-weight:bold;}a:hover{color:white;background:#3a3a45;}</style></head><body><h1>Clips Grabados de Ana</h1><div class="lista">`;
        if (videos.length === 0) {
            html += '<p style="text-align:center;color:#666;">No hay videos.</p>';
        } else {
            videos.reverse().forEach(v => { html += `<a href="/videos_recibidos/${v}" download>${v}</a>`; });
        }
        html += `</div></body></html>`;
        res.send(html);
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});
