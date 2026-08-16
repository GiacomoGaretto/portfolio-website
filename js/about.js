// --- Sezione About: tre rotte di lettura sullo stesso sistema ---
// Ogni rotta è un elenco di tappe con composizione tipografica forte:
// indice, titolo, sottotitolo e metadato allineato a destra.

const aboutRoutes = {
    bio: {
        caption: 'A few things that shape how I work.',
        items: [
            { title: 'I design by making', sub: 'I like moving from an idea to something tangible: an interface, a visual system, a 3D scene or a working prototype.', meta: 'APPROACH' },
            { title: 'Curious about how things work', sub: 'I learn by opening things up, testing them and rebuilding them until I understand what makes them click.', meta: 'MINDSET' },
            { title: 'Italian, English & French', sub: 'Italian is my native language. I hold a Cambridge English B2 certificate (score: 177); my French is at an uncertified C1 level.', meta: 'LANGUAGES' },
            { title: 'AI, but with intent', sub: 'I run ComfyUI locally to explore directions faster and prototype experiences, while keeping the design decisions mine.', meta: 'CURRENT' }
        ]
    },
    education: {
        caption: 'The places where I learned, both in and outside the classroom.',
        items: [
            { index: '2026', title: 'Politecnico di Milano', sub: 'I completed an MSc in Communication Design with 110/110 cum laude.', meta: 'MSC' },
            { index: '2022', title: 'Politecnico di Torino', sub: "I graduated with a Bachelor's degree in Design and Visual Communication.", meta: 'BSC' },
            { index: '2020–21', title: 'Ten months in Liège', sub: "During my Bachelor's, I studied at École Supérieure des Arts Saint-Luc de Liège through Erasmus, living and working in a multilingual environment.", meta: 'ERASMUS' },
            { index: '2018', title: 'Scientific Studies', sub: 'A scientific high school background that still shapes the analytical side of how I approach a project.', meta: 'DIPLOMA' }
        ]
    },
    experience: {
        caption: 'The roles and teams that shaped my professional experience.',
        items: [
            { title: 'Noodles Communication Srl', sub: 'Six months as a freelance junior graphic designer.', meta: 'FREELANCE' },
            { title: 'ARCA Studios', sub: 'A two-month internship as a motion designer and 3D artist.', meta: 'STUDIO' },
            { title: 'Noodles Communication Srl', sub: 'A two-month design internship with the studio.', meta: 'STUDIO' },
            { title: 'Your project', sub: "If you think we'd make something good together, let's talk.", meta: 'NEXT', href: 'mailto:giacomo.garetto@gmail.com', accent: true }
        ]
    }
};

const routeContent = document.getElementById('routeContent');
const routeCaption = document.getElementById('routeCaption');
let currentRoute = 'bio';
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
            ? '<a class="item-title" href="' + item.href + '">' + item.title + '</a>'
            : '<h3 class="item-title">' + item.title + '</h3>';

        el.innerHTML =
            '<span class="item-index">' + (item.index || String(i + 1).padStart(2, '0')) + '</span>' +
            '<div class="item-main">' + titleTag +
            '<p class="item-sub">' + item.sub + '</p></div>' +
            '<span class="item-meta">' + item.meta + '</span>';

        target.appendChild(el);
    });
}

function showRoute(routeId) {
    currentRoute = routeId;

    routeItemTimers.forEach(clearTimeout);
    routeItemTimers = [];

    buildRouteItems(routeId);
    scrambleIn(routeCaption, aboutRoutes[routeId].caption, { charDelay: 14, settleEvery: 2, trail: 5 });

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
routeCaption.textContent = aboutRoutes[currentRoute].caption;
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
    if (routeCaption._scrambleTimer) {
        clearInterval(routeCaption._scrambleTimer);
        routeCaption._scrambleTimer = null;
    }
    routeCaption.textContent = aboutRoutes[currentRoute].caption;
    routeContent.querySelectorAll('.route-item').forEach(el => el.classList.add('visible'));
});

