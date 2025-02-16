// Advanced animations for photon behavior
class PhotonAnimator {
    constructor(container) {
        this.container = container;
        this.photons = [];
    }

    createPhoton() {
        const photon = document.createElement('div');
        photon.className = 'photon';
        this.container.appendChild(photon);
        return photon;
    }

    animateTransmission(photon, startPos, endPos, duration) {
        return new Promise(resolve => {
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentX = startPos.x + (endPos.x - startPos.x) * progress;
                const currentY = startPos.y + (endPos.y - startPos.y) * progress;
                
                photon.style.transform = `translate(${currentX}px, ${currentY}px)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
} 