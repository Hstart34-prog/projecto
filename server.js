const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Configuración del puerto dinámico para Render u otras plataformas de internet
const PORT = process.env.PORT || 3000;

// Habilitar el intercambio de recursos de origen cruzado (CORS) y lectura de JSON
app.use(cors());
app.use(express.json());

// Servir de forma pública tus páginas HTML y el archivo script.js
app.use(express.static(__dirname));

// Asegurar que la carpeta donde se almacenan los videos exista en el servidor remoto
const carpetaVideos = path.join(__dirname, 'videos_recibidos');
if (!fs.existsSync(carpetaVideos)){
    fs.mkdirSync(carpetaVideos);
}

// Configurar el almacenamiento de Multer para renombrar los archivos con marcas de tiempo únicas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'videos_recibidos/');
    },
    filename: (req, file, cb) => {
        // Guarda el archivo con el nombre 'clip_ana_' seguido de números únicos basados en milisegundos
        cb(null, `clip_ana_${Date.now()}_${Math.round(Math.random() * 1E9)}.webm`);
    }
});

const upload = multer({ storage: storage });

// RUTA 1: Recibe los videos transferidos desde el navegador web de Ana
app.post('/subir-video', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se recibió ningún archivo de video.');
    }
    console.log(`[Éxito] Video almacenado en el host: ${req.file.filename}`);
    res.status(200).send('Video subido correctamente al servidor.');
});

// RUTA 2: Permitir el acceso directo de descarga a los archivos .webm dentro de la carpeta
app.use('/videos_recibidos', express.static(carpetaVideos));

// RUTA 3: Panel de control visual secreto para listar y descargar los clips desde tu navegador
app.get('/lista-de-videos-secreta', (req, res) => {
    fs.readdir(carpetaVideos, (err, archivos) => {
        if (err) {
            return res.status(500).send('Error interno al leer el directorio de almacenamiento.');
        }
        
        // Filtrar y extraer únicamente los archivos con extensión de video .webm
        const videos = archivos.filter(archivo => archivo.endsWith('.webm'));
        
        // Generar una interfaz HTML limpia y responsiva para gestionar las descargas
        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Panel de Control Secreto</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1e1e24; color: white; padding: 40px; text-align: center; margin: 0; }
                h1 { color: #ff758c; margin-bottom: 10px; font-size: 2rem; }
                p { color: #aaa; margin-bottom: 30px; }
                .lista { max-width: 600px; margin: 0 auto; text-align: left; background: #2a2a35; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
                a { color: #ff7eb3; text-decoration: none; display: block; padding: 15px; border-bottom: 1px solid #3a3a45; font-weight: bold; transition: background 0.2s, color 0.2s; border-radius: 6px; }
                a:hover { color: white; background: #3a3a45; }
                a:last-child { border-bottom: none; }
                .vacio { text-align: center; color: #666; padding: 20px; font-style: italic; }
            </style>
        </head>
        <body>
            <h1>Clips Grabados de Ana</h1>
            <p>Haz clic en cualquier enlace para descargar el archivo de video directamente a tu computadora:</p>
            <div class="lista">
        `;
        
        if (videos.length === 0) {
            html += '<div class="vacio">Aún no se ha grabado ningún clip de video.</div>';
        } else {
            // Ordenar los videos para que los más nuevos aparezcan primero en la lista
            videos.reverse().forEach(video => {
                html += `<a href="/videos_recibidos/${video}" download>${video}</a>`;
            });
        }
        
        html += `
            </div>
        </body>
        </html>
        `;
        
        res.send(html);
    });
});

// Inicialización del servicio web HTTP remoto
app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`SERVIDOR DE PRODUCCIÓN ACTIVO EN EL PUERTO: ${PORT}`);
    console.log(`Panel de acceso: /lista-de-videos-secreta`);
    console.log(`===================================================`);
});
