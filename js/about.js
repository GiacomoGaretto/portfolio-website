// --- Sezione About: tre rotte di lettura sullo stesso sistema ---
// Ogni rotta è un elenco di tappe con composizione tipografica forte:
// indice, titolo, sottotitolo e metadato allineato a destra.

const aboutRoutes = {
    bio: {
        caption: 'Who I am and how I work.',
        items: [
            { title: 'Visual design & technology', sub: 'A designer who works where the two meet, from concept to build.', meta: 'FOCUS' },
            { title: 'Hands-on curiosity', sub: 'I explore how things work from the inside out, taking them apart to understand them.', meta: 'METHOD' },
            { title: 'Digital, interaction, 3D, motion', sub: 'A practice that moves across static and moving image, interface and space.', meta: 'CRAFT' },
            { title: 'AI as an instrument', sub: 'Running ComfyUI locally — not as a generator, but to accelerate the prototyping of platforms and experiences.', meta: 'CURRENT' }
        ]
    },
    education: {
        caption: 'Where the training comes from.',
        items: [
            { title: 'Politecnico di Milano', sub: 'MSc in Communication Design — 110/110 Cum Laude.', meta: 'MSC' },
            { title: 'Politecnico di Torino', sub: "Bachelor's Degree in Communication Design.", meta: 'BSC' },
            { title: 'Scientific Studies', sub: 'High School Diploma.', meta: 'DIPLOMA' }
        ]
    },
    experience: {
        caption: 'Where the work has been done.',
        items: [
            { title: 'ARCA Studios', sub: 'Internship — 2 months.', meta: 'STUDIO' },
            { title: 'Noodles Communication Srl', sub: 'Freelance Junior Graphic Designer — 2 months.', meta: 'FREELANCE' },
            { title: 'Noodles Communication Srl', sub: 'Internship — 2 months.', meta: 'STUDIO' },
            { title: 'Your project', sub: 'The next entry on this list is still open.', meta: 'NEXT', href: 'mailto:giacomo.garetto@gmail.com', accent: true }
        ]
    }
};

const routeContent = document.getElementById('routeContent');
const routeCaption = document.getElementById('routeCaption');
let currentRoute = 'bio';
let routeItemTimers = [];

function buildRouteItems(routeId) {
    routeContent.innerHTML = '';

    aboutRoutes[routeId].items.forEach((item, i) => {
        const el = document.createElement('article');
        el.className = 'route-item' + (item.accent ? ' route-item-accent' : '');

        const titleTag = item.href
            ? '<a class="item-title" href="' + item.href + '">' + item.title + '</a>'
            : '<h3 class="item-title">' + item.title + '</h3>';

        el.innerHTML =
            '<span class="item-index">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<div class="item-main">' + titleTag +
            '<p class="item-sub">' + item.sub + '</p></div>' +
            '<span class="item-meta">' + item.meta + '</span>';

        routeContent.appendChild(el);
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
    routeContent.style.minHeight = '0px';

    let tallest = 0;
    Object.keys(aboutRoutes).forEach(id => {
        buildRouteItems(id);
        routeContent.querySelectorAll('.route-item').forEach(el => el.classList.add('visible'));
        tallest = Math.max(tallest, routeContent.offsetHeight);
    });

    routeContent.style.minHeight = tallest + 'px';
    buildRouteItems(currentRoute);
    routeContent.querySelectorAll('.route-item').forEach(el => el.classList.add('visible'));
}

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

// Ridisegna la rotta corrente ogni volta che l'about viene aperto
document.getElementById('aboutBtn').addEventListener('click', () => {
    setTimeout(() => showRoute(currentRoute), 400);
});

