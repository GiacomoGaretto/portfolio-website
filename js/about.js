// --- Sezione About: percorsi di lettura sullo stesso sistema ---
// Ogni rotta è un elenco di tappe con composizione tipografica forte:
// indice, titolo e sottotitolo.

const aboutRoutes = {
    education: {
        items: [
            { index: '2026', title: 'Politecnico di Milano', sub: 'I completed an MSc in Communication Design with 110/110 cum laude.' },
            { index: '2022', title: 'Politecnico di Torino', sub: "I graduated with a Bachelor's degree in Design and Visual Communication." },
            { index: '2020–21', title: 'Ten months in Liège', sub: "During my Bachelor's, I studied at École Supérieure des Arts Saint-Luc de Liège through Erasmus, living and working in a multilingual environment." },
            { index: '2018', title: 'Scientific Studies', sub: 'A scientific high school background that still shapes the analytical side of how I approach a project.' }
        ]
    },
    experience: {
        items: [
            { title: 'Noodles Communication Srl', sub: 'Six months as a freelance junior graphic designer.' },
            { title: 'ARCA Studios', sub: 'A two-month internship as a motion designer and 3D artist.' },
            { title: 'Noodles Communication Srl', sub: 'A two-month design internship with the studio.' }
        ]
    },
    recognition: {
        items: [
            { index: '2026', title: 'Making the Pipeline Legible', sub: "Co-authored paper accepted at CIVICS '26, the AVI 2026 workshop, and forthcoming in the CEUR Workshop Proceedings." },
            { index: '2026', title: 'Enhancing Data Understandability', sub: 'Co-authored chapter published in AI for Democracy, Springer Series in Design and Innovation 66.', href: 'https://doi.org/10.1007/978-3-032-23948-8_3', external: true },
            { index: '2025', title: 'VOTE — ADI Design Index', sub: 'Selected for ADI Design Index 2025 in the Targa Giovani category.', href: 'project4.html' },
            { index: '2023–25', title: 'NEOLOGIA', sub: 'Selected at Graphic Days® in Motion Design in 2023 and 2025, and Poster Design in 2024.' },
            { index: '2022', title: "Falken's Room at Graphic Days®", sub: 'Interactive installation exhibited at Graphic Days® Torino in 2022.', href: 'project3.html' }
        ]
    }
};

const routeContent = document.getElementById('routeContent');
let currentRoute = 'education';
let routeItemTimers = [];

function buildRouteItems(routeId, target = routeContent) {
    target.innerHTML = '';

    aboutRoutes[routeId].items.forEach((item, i) => {
        const el = document.createElement('article');
        const hasCustomIndex = Boolean(item.index);
        el.className = 'route-item' +
            (item.accent ? ' route-item-accent' : '') +
            (hasCustomIndex ? ' route-item-dated' : '');

        const titleTag = item.href
            ? '<a class="item-title" href="' + item.href + '"' + (item.external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + item.title + '</a>'
            : '<h3 class="item-title">' + item.title + '</h3>';

        el.innerHTML =
            '<span class="item-index">' + (item.index || String(i + 1).padStart(2, '0')) + '</span>' +
            '<div class="item-main">' + titleTag +
            '<p class="item-sub">' + item.sub + '</p></div>';

        target.appendChild(el);
    });
}

function showRoute(routeId) {
    currentRoute = routeId;

    routeItemTimers.forEach(clearTimeout);
    routeItemTimers = [];

    buildRouteItems(routeId);

    routeContent.querySelectorAll('.route-item').forEach((el, i) => {
        routeItemTimers.push(setTimeout(() => el.classList.add('visible'), 90 + i * 90));
    });
}

// Fissa l'altezza del contenitore sulla rotta più alta: cambiando voce il
// blocco resta centrato e gli elementi comuni non si spostano.
function equalizeRouteHeights() {
    const measuringContent = routeContent.cloneNode(false);
    measuringContent.removeAttribute('id');
    measuringContent.setAttribute('aria-hidden', 'true');
    Object.assign(measuringContent.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: routeContent.getBoundingClientRect().width + 'px',
        minHeight: '0',
        visibility: 'hidden',
        pointerEvents: 'none'
    });
    document.body.appendChild(measuringContent);

    let tallest = 0;
    Object.keys(aboutRoutes).forEach(id => {
        buildRouteItems(id, measuringContent);
        measuringContent.querySelectorAll('.route-item').forEach(el => el.classList.add('visible'));
        tallest = Math.max(tallest, measuringContent.offsetHeight);
    });

    measuringContent.remove();
    routeContent.style.minHeight = tallest + 'px';
}

// Prepara subito la prima rotta. Il contenuto resta stabile mentre il pannello
// About si apre; le animazioni vengono usate soltanto quando si cambia sezione.
buildRouteItems(currentRoute);
routeContent.querySelectorAll('.route-item').forEach(el => el.classList.add('visible'));

// Misura a font caricati, e di nuovo quando cambia la larghezza disponibile
document.fonts.ready.then(equalizeRouteHeights);

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(equalizeRouteHeights, 200);
});

document.querySelectorAll('.route-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.dataset.route === currentRoute) return;
        document.querySelectorAll('.route-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showRoute(btn.dataset.route);
    });
});

// All'apertura non ricostruisce il DOM: interrompe soltanto eventuali
// animazioni rimaste in corso da un precedente cambio di sezione.
document.getElementById('aboutBtn').addEventListener('click', () => {
    routeItemTimers.forEach(clearTimeout);
    routeItemTimers = [];
    routeContent.querySelectorAll('.route-item').forEach(el => el.classList.add('visible'));
});

