(() => {
    const section = document.querySelector('.corollario-live-demo');
    const frame = document.getElementById('corollario-demo');
    const toggle = document.getElementById('demo-toggle');
    const status = document.getElementById('demo-status');
    const story = document.getElementById('project-story');
    const desktop = window.matchMedia('(min-width: 769px)');
    const header = document.getElementById('header2');
    const toolbar = section.querySelector('.corollario-demo-toolbar');
    const syncDemoChrome = () => {
        section.style.setProperty('--demo-header-height', `${header.getBoundingClientRect().height}px`);
        section.style.setProperty('--demo-toolbar-height', `${toolbar.getBoundingClientRect().height}px`);
    };
    syncDemoChrome();
    if ('ResizeObserver' in window) {
        const chromeObserver = new ResizeObserver(syncDemoChrome);
        chromeObserver.observe(header);
        chromeObserver.observe(toolbar);
    }
    window.addEventListener('resize', syncDemoChrome);
    let active = false;
    let ready = false;

    function setActive(value, restoreFocus = false) {
        active = value && ready && desktop.matches;
        section.classList.toggle('is-interacting', active);
        frame.inert = !active;
        frame.tabIndex = active ? 0 : -1;
        toggle.setAttribute('aria-pressed', String(active));
        toggle.textContent = active ? 'Back to scrolling' : 'Explore demo';
        status.textContent = !ready ? 'Loading demo…' : active
            ? 'Demo active · Press Esc to resume scrolling'
            : 'Scroll to read · Activate to explore';
        if (restoreFocus) toggle.focus({ preventScroll: true });
    }

    function escapeDemo(event) {
        if (event.key === 'Escape' && active) {
            event.preventDefault();
            setActive(false, true);
        }
    }

    toggle.addEventListener('click', () => {
        setActive(!active);
        if (active) {
            toolbar.scrollIntoView({ block: 'start' });
            frame.focus({ preventScroll: true });
        }
    });
    document.addEventListener('keydown', escapeDemo);
    document.getElementById('demo-continue').addEventListener('click', event => {
        event.preventDefault();
        setActive(false);
        story.focus({ preventScroll: true });
        story.scrollIntoView({ block: 'start', behavior:
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });

    frame.addEventListener('load', () => {
        if (!frame.hasAttribute('src') || !desktop.matches) return;
        ready = true;
        toggle.disabled = false;
        // The bundled prototype is same-origin: Esc also works while its document has focus.
        frame.contentDocument.addEventListener('keydown', escapeDemo, true);
        setActive(false);
    });

    function syncViewport() {
        setActive(false);
        if (desktop.matches && !frame.hasAttribute('src')) {
            frame.src = frame.dataset.src;
        } else if (!desktop.matches) {
            ready = false;
            toggle.disabled = true;
            frame.removeAttribute('src');
        }
    }
    desktop.addEventListener('change', syncViewport);
    syncViewport();

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting && active) setActive(false);
        }).observe(frame);
    }
})();
