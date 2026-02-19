// Quando clicco su ABOUT, attivo la classe
document.getElementById('aboutBtn').addEventListener('click', function () {
    document.body.classList.add('about-active');
});

// Quando clicco su GIACOMO GARETTO (homeBtn), torno allo stato iniziale
document.getElementById('homeBtn').addEventListener('click', function () {
    document.body.classList.remove('about-active');
});

// Aggiunge l'evento al pulsante ABOUT per aprire l'about
document.getElementById('aboutBtn').addEventListener('click', function () {
    document.body.classList.add('about-active'); // Attiva la modalità About
});

// Aggiunge l'evento alla X per chiudere l'about
document.getElementById('closeAboutBtn').addEventListener('click', function () {
    document.body.classList.remove('about-active'); // Disattiva la modalità About
});

// Seleziona gli elementi della scheda informativa
const infoCard = document.getElementById('infoCard');
const projectTitle = document.getElementById('projectTitle');
const projectDescription = document.getElementById('projectDescription');
const projectDate = document.getElementById('projectDate')
const projectPreview = document.getElementById('projectPreview');
const aboutElement = document.getElementById('aboutText');

// Seleziona il bottone
const toggleRotationButton = document.getElementById('toggleRotation');

// Variabile per tracciare lo stato di pausa
let isRotationPaused = false;

// Aggiungi l'evento di click al bottone
toggleRotationButton.addEventListener('click', () => {
    isRotationPaused = !isRotationPaused; // Inverti lo stato

    if (isRotationPaused) {
        toggleRotationButton.textContent = 'PLAY'; // Cambia il testo del bottone
        toggleRotationButton.classList.add("active");
        stopRotation(); // Chiama la funzione per fermare la rotazione
        stopProjectsMovement();
    } else {
        toggleRotationButton.textContent = 'PAUSE'; // Cambia il testo del bottone
        toggleRotationButton.classList.remove("active");
        startRotation(); // Chiama la funzione per riprendere la rotazione
        startProjectsMovement();
    }
});

function showInfoCard(name, description, anteImg, info) {
    projectTitle.textContent = INTERSECTED.userData.projectName;;
    projectDescription.textContent = description;
    projectPreview.src = anteImg;
    projectDate.textContent = info;
    projectPreview.style.display = 'block';

    infoCard.classList.remove('hideCard', 'expandCard'); // Rimuovi eventuali classi precedenti
    infoCard.classList.add('showCard'); // Aggiungi la classe di entrata
    infoCard.style.display = 'block';
}

function hideInfoCard() {
    infoCard.classList.remove('showCard', 'expandCard');
    infoCard.classList.add('hideCard');

    setTimeout(() => {
        infoCard.style.display = 'none';
        // Riprendi la rotazione solo se il bottone era in modalità rotazione attiva
        if (!isRotationPaused) {
            startRotation();
            startProjectsMovement();
        }
    }, 100); // La durata deve corrispondere alla durata dell'animazione
}

let userInteracted = false; // Flag per controllare se l'utente ha interagito

function activateUserInteraction() {
    userInteracted = true; // L'utente ha interagito, attiva l'hover
    window.removeEventListener('mousemove', activateUserInteraction);
    window.removeEventListener('touchstart', activateUserInteraction);
}

// Ascolta la prima interazione dell'utente
window.addEventListener('mousemove', activateUserInteraction);
window.addEventListener('touchstart', activateUserInteraction);

function updateThemeColor(color) {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
        metaThemeColor.setAttribute("content", color);
    } else {
        let meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = color;
        document.head.appendChild(meta);
    }
}

// Imposta il colore iniziale in base alla pagina
if (document.body.classList.contains("inverted-theme")) {
    updateThemeColor("#FFFFFF"); // Bianco per il tema invertito
} else {
    updateThemeColor("#000000"); // Nero per il tema normale
}

// Aggiorna dinamicamente quando cambia il tema
document.addEventListener("DOMContentLoaded", function () {
    let observer = new MutationObserver(() => {
        if (document.body.classList.contains("inverted-theme")) {
            updateThemeColor("#FFFFFF"); // Bianco per tema chiaro
        } else {
            updateThemeColor("#000000"); // Nero per tema scuro
        }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
});
