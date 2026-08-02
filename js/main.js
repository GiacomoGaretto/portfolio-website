// --- Utility: animazione "scramble" stile sci-fi ---
// Rivela il testo lettera per lettera, con caratteri casuali prima dell'assestamento.
const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#_0123456789';

// Disegna lo stato intermedio: lettere assestate, poi una scia di caratteri
// casuali, poi il nulla. Condiviso da scrambleIn e scrambleOut così che
// l'uscita sia esattamente l'inverso dell'entrata.
function scrambleFrame(text, settled, trail) {
    let out = '';
    for (let i = 0; i < text.length; i++) {
        if (i < settled) {
            out += text[i];
        } else if (i < settled + trail) {
            out += text[i] === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
    }
    return out;
}

function scrambleIn(el, text, options = {}) {
    const charDelay = options.charDelay || 28;       // ms per frame
    const settleEvery = options.settleEvery || 1;    // lettere assestate per frame
    const trail = options.trail || 5;                // lettere "in cottura" dopo quelle assestate

    if (el._scrambleTimer) clearInterval(el._scrambleTimer);

    let settled = 0;
    el._scrambleTimer = setInterval(() => {
        settled += settleEvery;
        el.textContent = scrambleFrame(text, settled, trail);
        if (settled >= text.length) {
            clearInterval(el._scrambleTimer);
            el._scrambleTimer = null;
            el.textContent = text;
        }
    }, charDelay);
}

// Animazione inversa: il testo si dissolve da destra verso sinistra
function scrambleOut(el, text, options = {}, onComplete) {
    const charDelay = options.charDelay || 28;
    const settleEvery = options.settleEvery || 1;
    const trail = options.trail || 5;

    if (el._scrambleTimer) clearInterval(el._scrambleTimer);

    let settled = text.length;
    el._scrambleTimer = setInterval(() => {
        settled -= settleEvery;
        el.textContent = scrambleFrame(text, settled, trail);
        if (settled <= -trail) {
            clearInterval(el._scrambleTimer);
            el._scrambleTimer = null;
            el.textContent = '';
            if (onComplete) onComplete();
        }
    }, charDelay);
}

// Anima tutti gli elementi .scramble di un contenitore (con stagger)
function scrambleAll(container, stagger = 120) {
    const els = container.querySelectorAll('.scramble');
    els.forEach((el, i) => {
        const text = el.dataset.text || el.textContent.trim();
        el.dataset.text = text;
        el.textContent = '';
        setTimeout(() => scrambleIn(el, text), i * stagger);
    });
}

// Quando clicco su ABOUT, attivo la classe
document.getElementById('aboutBtn').addEventListener('click', function () {
    document.body.classList.add('about-active');
    // Il bottone sparisce con l'header: senza mouseleave il cursore
    // resterebbe agganciato a un elemento invisibile
    releaseDomSnap();
    // Avvia le animazioni scramble dopo l'espansione del cerchio bianco
    setTimeout(() => scrambleAll(document.getElementById('aboutText'), 150), 350);
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
    releaseDomSnap(); // La X si nasconde: rilascia l'aggancio del cursore
});

// Seleziona gli elementi della scheda informativa
const infoCard = document.getElementById('infoCard');
const projectTitle = document.getElementById('projectTitle');
const projectDescription = document.getElementById('projectDescription');
const projectDate = document.getElementById('projectDate')
const projectStage = document.getElementById('projectStage');
const projectIndex = document.getElementById('projectIndex');
const projectCoordinates = document.getElementById('coordinates');
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

// Testi che si compongono in sequenza, sincronizzati con le animazioni CSS
// dei rispettivi blocchi (vedi .showCard nel foglio di stile)
const infoCardSequence = [
    { id: 'projectIndex', delay: 80, options: { charDelay: 12, settleEvery: 2, trail: 5 } },
    { id: 'projectSeries', delay: 140, options: { charDelay: 12, settleEvery: 2, trail: 5 } },
    { id: 'projectTitle', delay: 330, options: { charDelay: 20, settleEvery: 2, trail: 4 } },
    { id: 'projectCode', delay: 400, options: { charDelay: 12, settleEvery: 2, trail: 5 } },
    { id: 'projectDate', delay: 580, options: { charDelay: 10, settleEvery: 3, trail: 6 } },
    { id: 'coordinates', delay: 640, options: { charDelay: 10, settleEvery: 3, trail: 6 } },
    { id: 'infoCardHint', delay: 740, options: { charDelay: 14, settleEvery: 1, trail: 4 } }
];

let infoCardTimers = [];

function runInfoCardSequence(values) {
    infoCardTimers.forEach(clearTimeout);
    infoCardTimers = [];

    infoCardSequence.forEach(step => {
        const el = document.getElementById(step.id);
        const text = values[step.id];
        el.textContent = '';
        infoCardTimers.push(setTimeout(() => scrambleIn(el, text, step.options), step.delay));
    });
}

function showInfoCard(userData, index, total) {
    const num = String(index + 1).padStart(2, '0');
    const year = (userData.info.match(/\d{4}/) || [''])[0];

    projectDescription.textContent = userData.description;
    document.getElementById('projectGhostNum').textContent = num;

    // Rimuovere e riapplicare showCard fa ripartire la sequenza anche quando
    // si passa direttamente da un progetto all'altro
    infoCard.classList.remove('hideCard', 'expandCard', 'showCard');
    void infoCard.offsetWidth;
    infoCard.classList.add('showCard');
    infoCard.style.display = 'flex';
    // Toglie di mezzo la UI di navigazione mentre si legge il progetto
    document.body.classList.add('project-focus');

    runInfoCardSequence({
        projectIndex: 'GG — PROJECT INDEX',
        projectSeries: 'FILE ' + num + ' / ' + String(total).padStart(2, '0'),
        projectTitle: userData.projectName,
        // Il ritorno a capo è reso da white-space: pre-line
        projectCode: 'K—' + num + '\n' + year,
        projectDate: userData.info,
        coordinates: userData.coords || '',
        infoCardHint: '→  CLICK TO OPEN PROJECT'
    });
}

function hideInfoCard() {
    infoCardTimers.forEach(clearTimeout);
    infoCardTimers = [];
    infoCard.classList.remove('showCard', 'expandCard');
    infoCard.classList.add('hideCard');
    document.body.classList.remove('project-focus');

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

// Cursore personalizzato: reticolo di puntamento a quattro angoli.
// Visibile solo in homepage su desktop (vedi media query nel CSS).
const customCursor = document.createElement('div');
customCursor.id = 'custom-cursor';
customCursor.innerHTML =
    '<span class="cursor-corner tl"></span>' +
    '<span class="cursor-corner tr"></span>' +
    '<span class="cursor-corner bl"></span>' +
    '<span class="cursor-corner br"></span>';
document.body.appendChild(customCursor);

// Fuori schermo finché il mouse non si muove
customCursor.style.left = '-100px';
customCursor.style.top = '-100px';

// Quando è agganciato a un elemento il cursore smette di seguire il mouse:
// i suoi crocini vanno a incorniciare l'elemento
let cursorSnapped = false;

document.addEventListener('mousemove', (e) => {
    if (cursorSnapped) return;
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
});

function snapCursorTo(centerX, centerY, width, height) {
    cursorSnapped = true;
    customCursor.classList.add('snapped');
    customCursor.style.left = centerX + 'px';
    customCursor.style.top = centerY + 'px';
    customCursor.style.width = width + 'px';
    customCursor.style.height = (height !== undefined ? height : width) + 'px';
}

function releaseCursor(mouseX, mouseY) {
    if (!cursorSnapped) return;
    cursorSnapped = false;
    customCursor.classList.remove('snapped');
    customCursor.style.width = '';
    customCursor.style.height = '';
    if (mouseX !== undefined) {
        customCursor.style.left = mouseX + 'px';
        customCursor.style.top = mouseY + 'px';
    }
}

// --- Aggancio magnetico agli elementi di interfaccia (DOM) ---
// Il loop 3D rilascia il cursore a ogni frame in cui non c'è un pianeta
// sotto il mouse: questo flag gli dice di non interferire.
let domSnapActive = false;

function releaseDomSnap(mouseX, mouseY) {
    if (!domSnapActive) return;
    domSnapActive = false;
    document.body.classList.remove('cursor-hovered');
    releaseCursor(mouseX, mouseY);
}

// paddingY può essere negativo: utile quando l'elemento ha molto padding
// interno e la cornice deve aderire al testo, non alla sua area cliccabile
function attachCursorSnap(el, paddingX, paddingY) {
    if (paddingY === undefined) paddingY = paddingX;
    el.addEventListener('mouseenter', () => {
        const rect = el.getBoundingClientRect();
        domSnapActive = true;
        document.body.classList.add('cursor-hovered');
        snapCursorTo(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            rect.width + paddingX * 2,
            rect.height + paddingY * 2
        );
    });
    el.addEventListener('mouseleave', (e) => {
        releaseDomSnap(e.clientX, e.clientY);
    });
}

// UI della home, selettori dell'About e X di chiusura
['homeBtn', 'aboutBtn', 'toggleRotation', 'closeAboutBtn'].forEach(id => {
    attachCursorSnap(document.getElementById(id), 10);
});
// I selettori hanno 14px di padding verticale proprio: la cornice lo
// scavalca e si stringe attorno al testo
document.querySelectorAll('.route-btn').forEach(btn => attachCursorSnap(btn, 8, -9));
