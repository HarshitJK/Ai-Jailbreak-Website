export function launchPartyEffect() {
    let container = document.getElementById("party-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "party-container";
        document.body.appendChild(container);
    }
    
    container.innerHTML = "";
    
    const colors = ["#00ff9d", "#00e5ff", "#7c3aed", "#ff2bd6", "#ffffff", "#ffd700"];
    
    const flash = document.createElement("div");
    flash.id = "ph-success-flash";
    container.appendChild(flash);
    
    const CONFETTI_COUNT = 180;
    for (let i = 0; i < CONFETTI_COUNT; i++) {
        const particle = document.createElement("div");
        particle.className = "ph-confetti";
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const width = 5 + Math.random() * 7;
        const height = 9 + Math.random() * 12;
        particle.style.width = `${width}px`;
        particle.style.height = `${height}px`;
        particle.style.animationDuration = `${2.2 + Math.random() * 2.2}s`;
        particle.style.animationDelay = `${Math.random() * .6}s`;
        particle.style.setProperty("--ph-drift", `${-220 + Math.random() * 440}px`);
        particle.style.setProperty("--ph-rotation", `${360 + Math.random() * 1440}deg`);
        particle.style.borderRadius = Math.random() > .5 ? "2px" : "50%";
        container.appendChild(particle);
        particle.addEventListener("animationend", () => { particle.remove(); }, { once: true });
    }
    
    const BURST_COUNT = 70;
    for (let i = 0; i < BURST_COUNT; i++) {
        const burst = document.createElement("div");
        burst.className = "ph-burst";
        burst.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = 120 + Math.random() * 420;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        burst.style.setProperty("--ph-x", `${x}px`);
        burst.style.setProperty("--ph-y", `${y}px`);
        const size = 4 + Math.random() * 7;
        burst.style.width = `${size}px`;
        burst.style.height = `${size}px`;
        burst.style.animationDelay = `${Math.random() * .15}s`;
        container.appendChild(burst);
        burst.addEventListener("animationend", () => { burst.remove(); }, { once: true });
    }
    
    setTimeout(() => {
        if (flash) flash.remove();
    }, 1000);
}
