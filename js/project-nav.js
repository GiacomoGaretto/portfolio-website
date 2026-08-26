(function () {
    const projects = [
        { title: 'Il Corollario', url: 'project1.html', image: 'images/previews/corollario_preview.png' },
        { title: 'Digital Forest', url: 'project2.html', image: 'images/previews/data_preview.jpg' },
        { title: "Falken's Room", url: 'project3.html', image: 'images/previews/falkens_preview.jpg' },
        { title: 'VOTE', url: 'project4.html', image: 'images/previews/vote_preview.jpg' },
        { title: 'Chronicles of Ink', url: 'project5.html', image: 'images/previews/chronicles_preview.jpg' },
        { title: 'Beyondwaste', url: 'project6.html', image: 'images/previews/beyond_preview.jpg' },
        { title: 'Salotto di Milano', url: 'project7.html', image: 'images/previews/salotto_preview.jpg' }
    ];

    const currentMatch = window.location.pathname.match(/project([1-7])\.html$/i);
    if (!currentMatch) return;

    const projectVideos = Array.from(document.querySelectorAll('#galleria video'));

    projectVideos.forEach((video, index) => {
        const container = video.parentElement;
        if (!container) return;

        container.classList.add('project-video');

        const audioToggle = document.createElement('button');
        audioToggle.className = 'project-audio-toggle';
        audioToggle.type = 'button';
        audioToggle.textContent = 'AUDIO';
        audioToggle.setAttribute('aria-pressed', 'false');
        audioToggle.setAttribute('aria-label', `Enable audio for video ${index + 1}`);
        container.appendChild(audioToggle);

        function updateAudioState() {
            const isAudible = !video.muted && video.volume > 0;
            audioToggle.classList.toggle('is-active', isAudible);
            audioToggle.setAttribute('aria-pressed', String(isAudible));
            audioToggle.setAttribute('aria-label', `${isAudible ? 'Disable' : 'Enable'} audio for video ${index + 1}`);
        }

        audioToggle.addEventListener('click', async () => {
            const enableAudio = video.muted || video.volume === 0;

            projectVideos.forEach(otherVideo => {
                if (otherVideo !== video) otherVideo.muted = true;
            });

            video.muted = !enableAudio;
            if (enableAudio && video.volume === 0) video.volume = 1;

            if (enableAudio) {
                try {
                    await video.play();
                } catch (error) {
                    video.muted = true;
                }
            }

            updateAudioState();
        });

        video.addEventListener('volumechange', updateAudioState);
        updateAudioState();
    });

    if ('IntersectionObserver' in window) {
        const audioVisibilityObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const hasPassedViewportTop = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;

                if (hasPassedViewportTop && !entry.target.muted) {
                    entry.target.muted = true;
                }
            });
        }, { threshold: 0 });

        projectVideos.forEach(video => audioVisibilityObserver.observe(video));
    } else {
        window.addEventListener('scroll', () => {
            projectVideos.forEach(video => {
                if (video.getBoundingClientRect().bottom <= 0 && !video.muted) {
                    video.muted = true;
                }
            });
        }, { passive: true });
    }

    const currentIndex = Number(currentMatch[1]) - 1;
    const nextIndex = (currentIndex + 1) % projects.length;
    const nextProject = projects[nextIndex];
    const nextNumber = String(nextIndex + 1).padStart(2, '0');

    const section = document.createElement('section');
    section.className = 'next-project';
    section.setAttribute('aria-labelledby', 'nextProjectTitle');
    section.innerHTML = `
        <div class="next-project__inner">
            <div class="next-project__heading">
                <p>NEXT PROJECT</p>
                <h2 id="nextProjectTitle">${nextProject.title}</h2>
            </div>
            <div class="next-project__track">
                <div class="next-project__line" aria-hidden="true">
                    <span class="next-project__progress"></span>
                </div>
                <span class="next-project__destination" aria-hidden="true"></span>
                <button class="next-project__handle" type="button"
                    aria-label="Drag right to open ${nextProject.title}. Press Enter to open it directly.">
                    <img src="${nextProject.image}" alt="Preview of ${nextProject.title}" draggable="false">
                    <span aria-hidden="true">${nextNumber}</span>
                </button>
            </div>
            <div class="next-project__instructions" aria-hidden="true">
                <span>DRAG TO GO TO THE NEXT PROJECT</span>
            </div>
        </div>
    `;

    document.body.appendChild(section);

    const track = section.querySelector('.next-project__track');
    const handle = section.querySelector('.next-project__handle');
    const progress = section.querySelector('.next-project__progress');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const triggerRatio = 0.72;
    let activePointerId = null;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let currentOffset = 0;
    let maxOffset = 0;
    let navigating = false;

    function measureTrack() {
        maxOffset = Math.max(0, track.clientWidth - handle.offsetWidth);
        currentOffset = Math.min(currentOffset, maxOffset);
        renderOffset(currentOffset);
    }

    function renderOffset(offset) {
        currentOffset = Math.max(0, Math.min(offset, maxOffset));
        const ratio = maxOffset ? currentOffset / maxOffset : 0;
        handle.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
        progress.style.transform = `scaleX(${ratio})`;
        section.style.setProperty('--drag-progress', ratio);
    }

    function openNextProject() {
        if (navigating) return;
        navigating = true;
        section.classList.add('is-complete');
        renderOffset(maxOffset);
        window.setTimeout(() => window.location.assign(nextProject.url), prefersReducedMotion ? 0 : 320);
    }

    function resetHandle() {
        section.classList.remove('is-dragging');
        handle.classList.add('is-resetting');
        renderOffset(0);
        window.setTimeout(() => handle.classList.remove('is-resetting'), prefersReducedMotion ? 0 : 420);
    }

    handle.addEventListener('pointerdown', (event) => {
        if (navigating || event.button > 0) return;
        activePointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartOffset = currentOffset;
        handle.classList.remove('is-resetting');
        section.classList.add('is-dragging');
        handle.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    handle.addEventListener('pointermove', (event) => {
        if (event.pointerId !== activePointerId) return;
        renderOffset(dragStartOffset + event.clientX - dragStartX);
        event.preventDefault();
    });

    function finishDrag(event) {
        if (event.pointerId !== activePointerId) return;
        activePointerId = null;
        if (currentOffset >= maxOffset * triggerRatio) {
            openNextProject();
        } else {
            resetHandle();
        }
    }

    handle.addEventListener('pointerup', finishDrag);
    handle.addEventListener('pointercancel', finishDrag);
    handle.addEventListener('lostpointercapture', (event) => {
        if (event.pointerId === activePointerId) finishDrag(event);
    });

    handle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openNextProject();
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            renderOffset(currentOffset + Math.max(24, maxOffset * 0.1));
            if (currentOffset >= maxOffset * triggerRatio) openNextProject();
        }

        if (event.key === 'ArrowLeft' || event.key === 'Home') {
            event.preventDefault();
            resetHandle();
        }

        if (event.key === 'End') {
            event.preventDefault();
            openNextProject();
        }
    });

    window.addEventListener('resize', measureTrack);
    if ('ResizeObserver' in window) {
        new ResizeObserver(measureTrack).observe(track);
    }
    measureTrack();
})();
