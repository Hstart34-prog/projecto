/* eslint-env browser */

document.addEventListener('DOMContentLoaded', () => {
    const touchButton = document.getElementById('touchButton');
    const videoElement = document.getElementById('videoElement');
    
    let stream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    
    if (!touchButton) return;

    touchButton.addEventListener('click', () => {
        const constraints = {
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then((mediaStream) => {
                stream = mediaStream;
                if (videoElement) {
                    videoElement.srcObject = stream;
                }
                
                recordedChunks = [];
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    const clipBlob = new Blob(recordedChunks, { type: 'video/webm' });
                    const formData = new FormData();
                    formData.append('video', clipBlob, 'clip.webm');
                    
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                        if (videoElement) videoElement.srcObject = null;
                    }

                    fetch('/subir-video', {
                        method: 'POST',
                        body: formData
                    })
                    .catch((err) => {
                        console.error('Error de red:', err);
                    });
                    
                    touchButton.disabled = false;
                };
                
                mediaRecorder.start();
                touchButton.disabled = true; 
                
                // CAMBIO AQUÍ: Ahora el temporizador espera 30000 milisegundos (30 segundos)
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, 30000);
            })
            .catch((err) => {
                console.error('Error de acceso a hardware:', err);
                touchButton.disabled = false;
            });
    });
});
