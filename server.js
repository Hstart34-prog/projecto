const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const dir = './videos_recibidos';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
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
        return res.status(400).send('No se recibió ningún video.');
    }
    console.log(`[Éxito] Video guardado en tu computadora: ${req.file.filename}`);
    res.status(200).send('Video subido correctamente.');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`¡SERVIDOR ACTIVO EXITOSAMENTE!`);
    console.log(`Los videos de Ana se guardarán en la carpeta: /videos_recibidos`);
    console.log(`===================================================`);
});
