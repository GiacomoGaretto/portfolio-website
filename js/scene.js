let scene, camera, renderer, galaxy, raycaster, mouse;

// Velocità di rotazione idle della galassia (più pronunciata).
// La velocità netta dei progetti lungo il proprio anello resta invariata:
// updateProjects compensa sottraendo la rotazione della galassia.
function getIdleSpeed() {
    return window.innerWidth <= 768 ? 0.0001 : 0.0006;
}
// Velocità angolare netta (galassia + orbita propria) percepita dai progetti
function getNetProjectSpeed() {
    return window.innerWidth <= 768 ? 0.00102 : 0.0012;
}
let rotatingSpeed = getIdleSpeed();
let rotating = true;
let projectsMoving = true;
let galaxyPositionY = 9;
let isModelActive = false; // Stato iniziale: la sfera è visibile
let modelVisible = false; // Stato per il click su mobile

// Scia continua del razzo
let rocketTrailAnchor = null;
let trailMesh;
const rocketTrailPoints = [];
const MAX_ROCKET_TRAIL_POINTS = 180;
const ROCKET_TRAIL_HOLD = 0.21;
const ROCKET_TRAIL_FADE = 0.63;
const trailWorldPosition = new THREE.Vector3();
const trailLocalPosition = new THREE.Vector3();
const trailCameraPosition = new THREE.Vector3();
const trailTangent = new THREE.Vector3();
const trailViewDirection = new THREE.Vector3();
const trailSide = new THREE.Vector3();
const trailLeft = new THREE.Vector3();
const trailRight = new THREE.Vector3();
let isRocketEngineActive = false;


let starGroup; // Gruppo per le stelle
let centralSphere;
let isCentralHovered = false;
const defaultCentralScale = 1;
const targetCentralScale = 4; // Imposta la scala desiderata per l'hover


// Aggiungi le descrizioni ai dati dei progetti
const projectCatalog = [
    { published: true, shapeIndex: 0, projectName: "Il Corollario", info: "16/03/2026", coords: "RA 18h26m · DEC +45°04′", hoverImage: "images/previews/corollario_preview.png", anteImg: "images/ante/corollario_ante.png", description: "Il Corollario is an interactive knowledge graph that makes AI-mediated public deliberation readable, traceable and contestable through visualisation, narrative scaffolding and progressive disclosure.", url: "project1.html" },
    { shapeIndex: 1, projectName: "Digital Forest", info: "22/11/2025", coords: "RA 04h21m · DEC +19°32′", hoverImage: "images/previews/data_preview.jpg", anteImg: "images/ante/data_ante.jpg", description: "The project analyzes 273 trail cam videos from Italian social platforms (2021-2024), exploring hashtags as tools of human categorization. The installation arranges videos chronologically with their hashtags, forming a growing network that reflects the evolving interplay between human perception and animal presence in a digital forest.", url: "project2.html" },
    { shapeIndex: 2, projectName: "Falken's Room", info: "12/09/2022", coords: "RA 17h58m · DEC −22°41′", hoverImage: "images/previews/falkens_preview.jpg", anteImg: "images/ante/falk_ante.jpg", description: "This thesis analyzes interactive installations through a practical case study, exploring their development, communication potential, and challenges. The study focuses on a 3D interactive installation inspired by 80s arcade games, designed and showcased at the Graphic Days 2022 festival.", url: "project3.html" },
    { shapeIndex: 3, projectName: "VOTE", info: "25/06/2024", coords: "RA 09h12m · DEC +45°08′", hoverImage: "images/previews/vote_preview.jpg", anteImg: "images/ante/vote_ante.jpg", description: "Vote is an interactive experience designed to actively engage students in a reflection on the value of voting and democratic representation. Developed within the Interaction Design Studio course at the Politecnico di Milano, the project addresses the growing disinterest in electoral participation, especially among young people.", url: "project4.html" },
    { shapeIndex: 4, projectName: "Chronicles of Ink", info: "01/07/2024", coords: "RA 21h33m · DEC −05°17′", hoverImage: "images/previews/chronicles_preview.jpg", anteImg: "images/ante/chron_ante.jpg", description: "The Chronicles of Ink is an Interactive Digital Narrative experience that explores social judgement and self-exploration through the metaphorical fantasy world of Talea. The project aims to raise awareness of the social double standard towards tattoos by examining how the perception of these art forms varies culturally and socially.", url: "project5.html" },
    { shapeIndex: 5, projectName: "Beyondwaste", info: "27/02/2025", coords: "RA 12h47m · DEC +62°55′", hoverImage: "images/previews/beyond_preview.jpg", anteImg: "images/ante/beyond_ante.jpg", description: "Beyondwaste is a presentation event designed by LATTER Studio for the innovative E-Trash bin concept. I contributed to the project by creating high-quality 3D visuals for the event's launch campaign. ", url: "project6.html" },
    { shapeIndex: 6, projectName: "Salotto di Milano", info: "15/01/2024", coords: "RA 06h05m · DEC +31°24′", hoverImage: "images/previews/salotto_preview.jpg", anteImg: "images/ante/salotto_ante.jpg", description: "The Salotto di Milano stands as an intersection of art, technology and culture. It is a journey that redefines how we all interact in the digital age, expanding the heart of Milano in the digital space.", url: "project7.html" },
];

const projectsData = projectCatalog
    .filter(project => project.published !== false)
    .map((project, index) => ({ ...project, name: `Proj ${index + 1}` }));

const rings = [];
const projectsMeshes = [];
const labels = [];
const previewImages = [];

// Variabili per le particelle
let particlesMesh;
let particlePositions;
let particleInitialPositions;
let particleTargetPositions; // Nuova variabile per i target delle particelle
let interactionPlane; // Piano invisibile per il raycasting del mouse sulla galassia

let INTERSECTED = null;

const ringDistance = 5.2;
// Gli anelli restano un livello di sfondo: le etichette hanno la precedenza visiva
const RING_IDLE_OPACITY = 0.45;
// Opacità dei progetti non selezionati durante l'hover
const PROJECT_DIMMED_OPACITY = 0.15;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°
// Margine tra il bordo del progetto e la ripresa dell'anello (~10px a schermo)
const PROJECT_RING_GAP = 1.3;

// Carica il modello 3D
const gltfLoader = new THREE.GLTFLoader();
let model3D;
let loadedShapes = {}; // Oggetto per memorizzare le forme caricate
let clock = new THREE.Clock(); // Usa il clock per il delta time
let rocketCurve = null;
let rocketRotationInterpolant = null;
let rocketAnimationDuration = 10;
let rocketAnimationTime = 0;
let rocketCurveProgress = 0;
let rocketJourneyComplete = false;
const rocketTargetQuaternion = new THREE.Quaternion();
const rocketQuaternionBuffer = new Float32Array(4);
const ROCKET_VISIBLE_SCALE = 1.53; // 15% in meno rispetto alla scala precedente (1.8)
const ROCKET_ACCELERATION_DURATION = 2.2;
const ROCKET_CRUISE_SPEED_FACTOR = 0.86;

gltfLoader.load('rocket-clean.glb', function (gltf) {
    // Variante runtime generata dal GLB originale: contiene soltanto la mesh
    // pulita del razzo e la sua clip di movimento, senza i 240 morph target.
    model3D = gltf.scene.children[0] || gltf.scene;

    if (!model3D) return;

    const morphSmoke = model3D.getObjectByName('Icosphere.003');
    if (morphSmoke) model3D.remove(morphSmoke);

    model3D.scale.set(0, 0, 0); // Inizia con scala 0
    model3D.visible = false;
    if (galaxy) galaxy.add(model3D);

    model3D.traverse(node => {
        if (node.isMesh) {
            applyRocketMaterials(node);
        }
    });

    // Punto di emissione in corrispondenza del motore, nello spazio locale
    // del modello originale.
    rocketTrailAnchor = new THREE.Object3D();
    rocketTrailAnchor.position.set(0, -3.65, 0);
    model3D.add(rocketTrailAnchor);

    const pathClip = gltf.animations.find(clip => clip.name === 'Action.012');
    prepareRocketPath(pathClip);
}, undefined, function (error) {
    console.error('Impossibile caricare il modello del razzo:', error);
});

function applyRocketMaterials(mesh) {
    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const materials = sourceMaterials.map(source => {
        const material = source.clone();

        switch (material.name) {
            case 'Corpo':
                material.color.setHex(0x9ca7af);
                material.metalness = 0.28;
                material.roughness = 0.58;
                break;
            case 'Punta':
                material.color.setHex(0x1f51ff);
                material.metalness = 0.38;
                material.roughness = 0.34;
                material.emissive.setHex(0x06143f);
                material.emissiveIntensity = 0.32;
                break;
            case 'metallo':
                material.color.setHex(0x3d4650);
                material.metalness = 0.82;
                material.roughness = 0.3;
                break;
            case 'Dettagli':
                material.color.setHex(0x080b12);
                material.metalness = 0.56;
                material.roughness = 0.42;
                break;
            case 'Motore':
                material.color.setHex(0x11151b);
                material.metalness = 0.72;
                material.roughness = 0.36;
                material.emissive.setHex(0x07194d);
                material.emissiveIntensity = 0.22;
                break;
            case 'vetro':
                material.color.setHex(0x05080d);
                material.metalness = 0.25;
                material.roughness = 0.12;
                material.transparent = true;
                material.opacity = 0.72;
                material.depthWrite = false;
                break;
        }

        material.needsUpdate = true;
        return material;
    });

    mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
}

function prepareRocketPath(clip) {
    if (!clip) return;

    const positionTrack = clip.tracks.find(track => track.name.endsWith('.position'));
    const rotationTrack = clip.tracks.find(track => track.name.endsWith('.quaternion'));
    if (!positionTrack) return;

    const points = [];
    for (let i = 0; i < positionTrack.values.length; i += 3) {
        points.push(new THREE.Vector3(
            positionTrack.values[i],
            positionTrack.values[i + 1],
            positionTrack.values[i + 2]
        ));
    }

    // L'ultimo campione coincide con il primo: la chiusura viene gestita
    // direttamente dalla curva ed evitiamo un segmento duplicato.
    if (points.length > 2 && points[0].distanceToSquared(points[points.length - 1]) < 0.0001) {
        points.pop();
    }

    rocketCurve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
    rocketCurve.arcLengthDivisions = Math.max(1000, points.length * 8);
    rocketCurve.updateArcLengths();
    rocketAnimationDuration = clip.duration || 10;
    rocketRotationInterpolant = rotationTrack
        ? rotationTrack.createInterpolant(rocketQuaternionBuffer)
        : null;
    resetRocketMotion();
}

function resetRocketMotion() {
    rocketAnimationTime = 0;
    rocketCurveProgress = 0;
    rocketJourneyComplete = false;
    if (!model3D || !rocketCurve) return;

    rocketCurve.getPointAt(0, model3D.position);
    if (rocketRotationInterpolant) {
        const values = rocketRotationInterpolant.evaluate(0);
        model3D.quaternion.set(values[0], values[1], values[2], values[3]).normalize();
    }
}

function updateRocketMotion(delta) {
    if (!model3D || !model3D.visible || !rocketCurve || rocketJourneyComplete) return;

    rocketAnimationTime += delta;

    // La velocità parte da zero, cresce con uno smoothstep e si stabilizza
    // all'86% della velocità precedente.
    const accelerationProgress = Math.min(rocketAnimationTime / ROCKET_ACCELERATION_DURATION, 1);
    const thrust = accelerationProgress * accelerationProgress * (3 - 2 * accelerationProgress);
    rocketCurveProgress += delta * (ROCKET_CRUISE_SPEED_FACTOR / rocketAnimationDuration) * thrust;
    rocketCurveProgress = Math.min(rocketCurveProgress, 1);
    rocketCurve.getPointAt(rocketCurveProgress, model3D.position);

    if (rocketRotationInterpolant) {
        const values = rocketRotationInterpolant.evaluate(rocketCurveProgress * rocketAnimationDuration);
        rocketTargetQuaternion.set(values[0], values[1], values[2], values[3]).normalize();
        const smoothing = 1 - Math.exp(-12 * delta);
        model3D.quaternion.slerp(rocketTargetQuaternion, smoothing);
    }

    if (rocketCurveProgress >= 1) {
        rocketJourneyComplete = true;
        isRocketEngineActive = false;

        // La chiusura parte nello stesso frame in cui la curva torna
        // esattamente al punto d'origine.
        if (isModelActive && !isAnimating) {
            isAnimating = true;
            showSphere(() => {
                isModelActive = false;
                isAnimating = false;
            });
        }
    }
}

function hideRocketAtCurrentPosition() {
    if (!model3D || !model3D.visible || !isModelActive || isAnimating) {
        return;
    }

    isAnimating = true;
    isRocketEngineActive = false;
    rocketJourneyComplete = true;

    // Usa la stessa chiusura del termine del tracciato, mantenendo però
    // posizione e orientamento raggiunti in questo istante.
    showSphere(() => {
        isModelActive = false;
        isAnimating = false;
    });
}

// Configurazione modelli personalizzati per i progetti (Indice Progetto: { percorso, scala })
const customShapesConfig = {
    1: { path: '3DCenter/proj1.glb', scale: 65 }, // Digital Forest
    2: { path: '3DCenter/proj2.glb', scale: 50 }, // Falken's Room
    3: { path: '3DCenter/proj3.glb', scale: 50 }, // VOTE
    4: { path: '3DCenter/proj4.glb', scale: 50 }, // Chronicles of Ink
    5: { path: '3DCenter/proj5.glb', scale: 40 }, // Beyondwaste
    6: { path: '3DCenter/proj6.glb', scale: 90 } // Salotto di Milano
    // Aggiungi qui altri progetti: es. 0: { path: 'modelli/altro.glb', scale: 20 }
};

// Carica le forme personalizzate basandosi sulla configurazione
Object.keys(customShapesConfig).forEach(key => {
    const index = parseInt(key);
    const config = customShapesConfig[index];

    gltfLoader.load(config.path, function (gltf) {
        const model = gltf.scene;
        const positions = [];
        model.updateMatrixWorld(true);

        model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                const posAttr = geometry.attributes.position;
                for (let i = 0; i < posAttr.count; i++) {
                    const v = new THREE.Vector3();
                    v.fromBufferAttribute(posAttr, i);
                    v.applyMatrix4(child.matrixWorld);
                    positions.push(v);
                }
            }
        });

        if (positions.length > 0) {
            // Normalizza e scala i punti per adattarli alla scena
            const box = new THREE.Box3().setFromPoints(positions);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Usa la scala definita nella configurazione. Nessuna inclinazione:
            // il modello ruota nella scheda con l'asse verticale dritto
            const scaleFactor = config.scale / (maxDim || 1);

            loadedShapes[index] = positions.map(p => p.sub(center).multiplyScalar(scaleFactor));
            console.log(`Forma Progetto ${index + 1} caricata:`, loadedShapes[index].length, "punti");
        }
    });
});



function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene').appendChild(renderer.domElement);
    renderer.setPixelRatio(2);

    camera.position.z = 60;

    galaxy = new THREE.Object3D();
    galaxy.rotation.x = THREE.Math.degToRad(30);
    galaxy.rotation.z = THREE.Math.degToRad(10);

    scene.add(galaxy);
    if (model3D && model3D.parent !== galaxy) galaxy.add(model3D);
    
    starGroup = new THREE.Group();
    starGroup.rotation.x = THREE.Math.degToRad(30);
    starGroup.rotation.z = THREE.Math.degToRad(10);
    scene.add(starGroup);

    createCentralSphere();
    createRingsAndProjects();
    createParticles(); // Crea le particelle
    createRocketTrail(); // Initialize the trail
    addLighting();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    animate();

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('wheel', onMouseWheel, false);
    document.addEventListener('click', onClick, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('touchstart', onTouchStart, false);
    document.addEventListener('touchmove', onTouchMove, false);
    window.addEventListener('resize', adjustGalaxyScale);
    window.addEventListener('load', adjustGalaxyScale);
    window.addEventListener('resize', adjustGalaxyPosition);
    window.addEventListener('load', adjustGalaxyPosition);
    // Ascolta la prima interazione dell'utente
    window.addEventListener('mousemove', activateUserInteraction);
    window.addEventListener('touchstart', activateUserInteraction);
}

window.addEventListener('resize', () => {
    if (!isRotationPaused) {
        rotatingSpeed = getIdleSpeed();
    }
});

function adjustGalaxyPosition() {
    if (window.innerWidth <= 768) {
        galaxyPositionY = 5; // Abbassa la posizione su mobile
    } else {
        galaxyPositionY = 9; // Posizione originale su desktop
    }

    // Applica la modifica immediatamente alla galassia se esiste
    if (galaxy) {
        galaxy.position.y = galaxyPositionY;
    }
    if (starGroup) {
        starGroup.position.y = galaxyPositionY;
    }
}




function adjustGalaxyScale() {
    if (window.innerWidth <= 768) {
        galaxy.scale.set(0.8, 0.8, 0.8); // Riduce la scala al 70% su mobile
        if (starGroup) starGroup.scale.set(0.8, 0.8, 0.8);
    } else {
        galaxy.scale.set(1, 1, 1); // Ripristina la scala su desktop
        if (starGroup) starGroup.scale.set(1, 1, 1);
    }
}

// Crea la sfera centrale
function createCentralSphere() {
    const sphereGeometry = new THREE.SphereGeometry(4, 25, 25);
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, shininess: 11, transparent: true, opacity: 1 });
    // Salva la sfera in una variabile globale
    centralSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    galaxy.add(centralSphere);
}


// Crea gli anelli e i progetti
function createRingsAndProjects() {
    const ringCount = projectsData.length;
    const projectCount = projectsData.length;
    const ringThickness = window.innerWidth <= 768 ? 0.06 : 0.028;


    const projectDimension = window.innerWidth <= 768 ? 2.0 : 1.5;

    for (let i = 0; i < ringCount; i++) {
        const radius = 10 + i * ringDistance;

        // L'anello si interrompe attorno al progetto lasciando un margine
        // costante oltre il bordo del cerchio: più l'anello è largo, minore
        // è l'angolo necessario a coprire la stessa distanza.
        const halfGap = (projectDimension + PROJECT_RING_GAP) / radius;
        const arc = Math.PI * 2 - halfGap * 2;

        const ringGeometry = new THREE.TorusGeometry(radius, ringThickness, 10, 200, arc);
        const ringMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x040404, shininess: 11, side: THREE.DoubleSide, transparent: true, opacity: RING_IDLE_OPACITY });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);

        ring.rotation.x = Math.PI / 2;
        // Il varco della geometria è centrato qui: sottraendolo dall'angolo del
        // progetto, l'interruzione resta agganciata al pianeta mentre orbita
        ring.userData = { angle: 0, gapOffset: arc / 2 + Math.PI };
        rings.push(ring);
        galaxy.add(ring);

        if (i < projectCount) {
            createProject(projectsData[i], i);
        }
    }
}

function createProject(projectData, ringIndex) {
    const projectDimension = window.innerWidth <= 768 ? 2.0 : 1.5;

    const projectGeometry = new THREE.CircleGeometry(projectDimension, 64);
    const projectMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const projectMesh = new THREE.Mesh(projectGeometry, projectMaterial);

    projectMesh.userData = {
        ringIndex: ringIndex,
        // Angolo aureo: due anelli adiacenti risultano sempre a ~137.5° l'uno
        // dall'altro, così le etichette non si accavallano mai. Tutti i
        // progetti hanno la stessa velocità angolare, quindi la distribuzione
        // resta valida nel tempo.
        angle: ringIndex * GOLDEN_ANGLE,
        hoverImage: projectData.hoverImage,
        anteImg: projectData.anteImg,
        description: projectData.description,
        name: projectData.name,
        projectName: projectData.projectName,
        info: projectData.info,
        coords: projectData.coords,
        shapeIndex: projectData.shapeIndex,
        url: projectData.url, // Associa l'URL del progetto
        originalMaterial: projectMaterial,
        outlineMaterial: new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
        isHovered: false
    };

    projectsMeshes.push(projectMesh);
    galaxy.add(projectMesh);

    const previewImage = createPreviewImage(projectData.hoverImage);
    previewImage.position.z = 2;
    previewImage.visible = false;
    previewImages.push(previewImage);
    galaxy.add(previewImage);

    const label = createLabel(projectData, ringIndex);
    label.classList.add('label-hidden');
    label.dataset.state = 'hidden';
    labels.push(label);
    // Reveal sequenziale all'avvio, dal centro verso l'esterno
    setTimeout(() => revealLabel(label), 900 + ringIndex * 260);
}

function createParticles() {
    const particleCount = 3200;
    const geometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(particleCount * 3);
    particleInitialPositions = new Float32Array(particleCount * 3);
    particleTargetPositions = new Float32Array(particleCount * 3);
    // Luminosità variabile per particella: il campo stellare acquista profondità
    // e smette di competere con le etichette dei progetti
    const particleColors = new Float32Array(particleCount * 3);

    // Distribuisci le particelle in un'area simile agli anelli
    for (let i = 0; i < particleCount; i++) {
        // Distribuzione sferica per riempire meglio il volume inclinato
        const r = 10 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        particleInitialPositions[i * 3] = x;
        particleInitialPositions[i * 3 + 1] = y;
        particleInitialPositions[i * 3 + 2] = z;

        // Inizialmente il target è la posizione iniziale (galassia)
        particleTargetPositions[i * 3] = x;
        particleTargetPositions[i * 3 + 1] = y;
        particleTargetPositions[i * 3 + 2] = z;

        // Curva esponenziale: molte stelle deboli, poche brillanti
        const brightness = 0.28 + 0.72 * Math.pow(Math.random(), 2.2);
        particleColors[i * 3] = brightness;
        particleColors[i * 3 + 1] = brightness;
        particleColors[i * 3 + 2] = brightness;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.09,
        vertexColors: true,
        transparent: true,
        opacity: 0.45
    });
    
    // Store original values
    material.userData.originalOpacity = material.opacity;
    material.userData.originalSize = material.size;

    particlesMesh = new THREE.Points(geometry, material);
    starGroup.add(particlesMesh); // Aggiungi le particelle al gruppo delle stelle invece che alla galassia

    // Crea un piano invisibile per intercettare il mouse nello spazio locale della galassia
    const planeGeometry = new THREE.PlaneGeometry(120, 120);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisibile
    interactionPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    interactionPlane.rotation.x = -Math.PI / 2; // Ruota per essere piatto come la galassia
    galaxy.add(interactionPlane);
}

// Nastro luminoso continuo, ispirato alle scie dei light cycle di Tron.
function createRocketTrail() {
    const geometry = new THREE.BufferGeometry();
    const vertexCount = MAX_ROCKET_TRAIL_POINTS * 2;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const indices = new Uint16Array((MAX_ROCKET_TRAIL_POINTS - 1) * 6);

    for (let i = 0; i < MAX_ROCKET_TRAIL_POINTS - 1; i++) {
        const vertex = i * 2;
        const index = i * 6;
        indices[index] = vertex;
        indices[index + 1] = vertex + 1;
        indices[index + 2] = vertex + 2;
        indices[index + 3] = vertex + 1;
        indices[index + 4] = vertex + 3;
        indices[index + 5] = vertex + 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.setDrawRange(0, 0);

    const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });

    trailMesh = new THREE.Mesh(geometry, material);
    trailMesh.frustumCulled = false;
    trailMesh.renderOrder = 3;
    trailMesh.visible = false;
    galaxy.add(trailMesh);
}

function addRocketTrailPoint() {
    if (!rocketTrailAnchor || !galaxy) return;

    rocketTrailAnchor.getWorldPosition(trailWorldPosition);
    galaxy.worldToLocal(trailLocalPosition.copy(trailWorldPosition));

    const previous = rocketTrailPoints[rocketTrailPoints.length - 1];
    if (previous && previous.position.distanceToSquared(trailLocalPosition) < 0.0012) return;

    rocketTrailPoints.push({
        position: trailLocalPosition.clone(),
        age: 0
    });

    if (rocketTrailPoints.length > MAX_ROCKET_TRAIL_POINTS) {
        rocketTrailPoints.shift();
    }
}

function updateRocketTrail(delta) {
    if (!trailMesh) return;

    for (let i = 0; i < rocketTrailPoints.length; i++) {
        rocketTrailPoints[i].age += delta;
    }

    const maximumAge = ROCKET_TRAIL_HOLD + ROCKET_TRAIL_FADE;
    while (rocketTrailPoints.length && rocketTrailPoints[0].age >= maximumAge) {
        rocketTrailPoints.shift();
    }

    if (isRocketEngineActive && model3D && model3D.visible) {
        addRocketTrailPoint();
    }

    const pointCount = rocketTrailPoints.length;
    if (pointCount < 2) {
        trailMesh.visible = false;
        trailMesh.geometry.setDrawRange(0, 0);
        return;
    }

    trailMesh.visible = true;
    const positions = trailMesh.geometry.attributes.position.array;
    const colors = trailMesh.geometry.attributes.color.array;

    camera.getWorldPosition(trailCameraPosition);
    galaxy.worldToLocal(trailCameraPosition);

    for (let i = 0; i < pointCount; i++) {
        const point = rocketTrailPoints[i];
        const previousPoint = rocketTrailPoints[Math.max(0, i - 1)].position;
        const nextPoint = rocketTrailPoints[Math.min(pointCount - 1, i + 1)].position;
        const headProgress = i / Math.max(1, pointCount - 1);
        const fade = point.age <= ROCKET_TRAIL_HOLD
            ? 1
            : Math.max(0, 1 - (point.age - ROCKET_TRAIL_HOLD) / ROCKET_TRAIL_FADE);

        trailTangent.subVectors(nextPoint, previousPoint).normalize();
        trailViewDirection.subVectors(trailCameraPosition, point.position).normalize();
        trailSide.crossVectors(trailTangent, trailViewDirection);
        if (trailSide.lengthSq() < 0.0001) trailSide.set(1, 0, 0);
        trailSide.normalize();

        const width = (0.1575 + 0.54 * Math.pow(headProgress, 0.7)) * (0.35 + 0.65 * fade);
        trailSide.multiplyScalar(width);
        trailLeft.copy(point.position).add(trailSide);
        trailRight.copy(point.position).sub(trailSide);

        const vertexOffset = i * 6;
        positions[vertexOffset] = trailLeft.x;
        positions[vertexOffset + 1] = trailLeft.y;
        positions[vertexOffset + 2] = trailLeft.z;
        positions[vertexOffset + 3] = trailRight.x;
        positions[vertexOffset + 4] = trailRight.y;
        positions[vertexOffset + 5] = trailRight.z;

        // Blu elettrico lungo la scia, fino al bianco in prossimità del motore.
        const whiteMixRaw = Math.max(0, (headProgress - 0.76) / 0.24);
        const whiteMix = whiteMixRaw * whiteMixRaw * (3 - 2 * whiteMixRaw);
        const red = (0.122 + (1 - 0.122) * whiteMix) * fade;
        const green = (0.318 + (1 - 0.318) * whiteMix) * fade;
        const blue = fade;

        colors[vertexOffset] = red;
        colors[vertexOffset + 1] = green;
        colors[vertexOffset + 2] = blue;
        colors[vertexOffset + 3] = red;
        colors[vertexOffset + 4] = green;
        colors[vertexOffset + 5] = blue;
    }

    trailMesh.geometry.setDrawRange(0, (pointCount - 1) * 6);
    trailMesh.geometry.attributes.position.needsUpdate = true;
    trailMesh.geometry.attributes.color.needsUpdate = true;
}

function resetRocketTrail() {
    if (!trailMesh) return;
    rocketTrailPoints.length = 0;
    trailMesh.geometry.setDrawRange(0, 0);
    trailMesh.visible = false;
}

// Funzione aggiornata per gestire l'hover


// Etichette HTML sovrapposte al canvas: il testo resta nitido, tipografico,
// e con mix-blend-mode: difference si inverte da solo sopra le aree bianche.
function createLabel(projectData, index) {
    const el = document.createElement('div');
    el.className = 'planet-label';

    const nameEl = document.createElement('span');
    nameEl.className = 'planet-label-name';
    nameEl.dataset.text = projectData.projectName;

    const dateEl = document.createElement('span');
    dateEl.className = 'planet-label-meta';
    dateEl.dataset.text = projectData.info;

    const coordsEl = document.createElement('span');
    coordsEl.className = 'planet-label-meta';
    coordsEl.dataset.text = projectData.coords;

    el.appendChild(nameEl);
    el.appendChild(dateEl);
    el.appendChild(coordsEl);
    document.getElementById('labels').appendChild(el);

    // Il numero vive su un livello separato: #labels è in mix-blend-mode
    // difference (che invertirebbe il blu in arancio sopra i cerchi bianchi),
    // mentre il blu key resta leggibile sia sul nero sia sul bianco.
    const numEl = document.createElement('span');
    numEl.className = 'planet-label-num';
    numEl.dataset.text = String(index + 1).padStart(2, '0');
    document.getElementById('labelNums').appendChild(numEl);
    el.numEl = numEl;

    return el;
}

// Tempi di scramble: il nome più lento e leggibile, i metadati più rapidi
function labelScrambleOptions(el, fast) {
    if (el.classList.contains('planet-label-name')) {
        return fast ? { charDelay: 16, settleEvery: 2, trail: 4 } : { charDelay: 34, trail: 5 };
    }
    return fast ? { charDelay: 10, settleEvery: 3, trail: 6 } : { charDelay: 20, settleEvery: 2, trail: 7 };
}

// Il numero sta in un altro contenitore ma si anima insieme al resto
function labelParts(label) {
    return [...label.querySelectorAll('[data-text]'), label.numEl];
}

// Rivela un'etichetta con l'effetto scramble (definito in main.js)
function revealLabel(label, fast) {
    label.dataset.state = 'visible';
    label.classList.remove('label-hidden');
    label.numEl.classList.remove('label-hidden');
    labelParts(label).forEach(el => {
        scrambleIn(el, el.dataset.text, labelScrambleOptions(el, fast));
    });
}

// Nasconde subito, senza animazione (per il progetto sotto al cursore,
// la cui area viene comunque coperta dall'anteprima)
function hideLabel(label) {
    label.dataset.state = 'hidden';
    label.classList.add('label-hidden');
    label.numEl.classList.add('label-hidden');
}

// Nasconde con l'animazione inversa a quella di comparsa
function dissolveLabel(label) {
    label.dataset.state = 'hiding';
    const parts = labelParts(label);
    let remaining = parts.length;
    parts.forEach(el => {
        scrambleOut(el, el.dataset.text, labelScrambleOptions(el, true), () => {
            // Se nel frattempo l'etichetta è tornata visibile, non nasconderla
            if (--remaining === 0 && label.dataset.state === 'hiding') {
                label.classList.add('label-hidden');
                label.numEl.classList.add('label-hidden');
                label.dataset.state = 'hidden';
            }
        });
    });
}

// Durante l'hover su un progetto tutte le altre etichette si dissolvono
function dissolveOtherLabels(exceptIndex) {
    labels.forEach((label, i) => {
        if (i === exceptIndex || label.dataset.state === 'hiding' || label.dataset.state === 'hidden') return;
        dissolveLabel(label);
    });
}

function revealAllLabels() {
    labels.forEach(label => revealLabel(label, true));
}

function createPreviewImage(hoverImage) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
        hoverImage,
        () => { console.log(`Image ${hoverImage} loaded successfully`); },
        undefined,
        (err) => { console.error(`Error loading image ${hoverImage}`, err); }
    );

    // La cover del Corollario include un margine bianco nel file sorgente:
    // ritagliamo la texture sulle tangenti del disco blu per farlo coincidere
    // con la circonferenza geometrica dell'anteprima.
    if (hoverImage.includes('corollario_preview')) {
        texture.repeat.set(0.755, 0.734);
        texture.offset.set(0.119, 0.134);
        texture.needsUpdate = true;
    }

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        depthTest: false,
        transparent: true,  // Abilita la trasparenza
        opacity: 0          // Parti da opacity 0
    });

    const geometry = new THREE.CircleGeometry(1.5, 64);
    const mesh = new THREE.Mesh(geometry, material);

    // Imposta la scala a quella finale, ma l'oggetto sarà invisibile inizialmente
    mesh.scale.set(5, 5, 1);
    mesh.position.z = 2;
    mesh.renderOrder = 1;
    // Puoi anche impostare direttamente visible a false se lo preferisci
    mesh.visible = false;

    return mesh;
}

function animateRingsOpacity(targetOpacity, duration) {
    rings.forEach(ring => {
        if (ring.userData.opacityTween) {
            ring.userData.opacityTween.stop();
        }
        ring.userData.opacityTween = new TWEEN.Tween({ opacity: ring.material.opacity })
            .to({ opacity: targetOpacity }, duration)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(function (obj) {
                ring.material.opacity = obj.opacity;
            })
            .start();
    });
}

function tweenMaterialOpacity(material, targetOpacity, duration) {
    if (!material) return;
    material.transparent = true;
    if (material.userData.opacityTween) material.userData.opacityTween.stop();

    material.userData.opacityTween = new TWEEN.Tween({ opacity: material.opacity })
        .to({ opacity: targetOpacity }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function (obj) {
            material.opacity = obj.opacity;
        })
        .start();
}

// Durante l'hover solo il progetto puntato resta pieno: gli altri e la
// stella centrale arretrano.
function focusOnProject(focusMesh, duration) {
    projectsMeshes.forEach(mesh => {
        // Senza un progetto a fuoco tornano tutti pieni: confrontare con null
        // avrebbe lasciato ogni pianeta al valore ridotto
        const target = !focusMesh || mesh === focusMesh ? 1 : PROJECT_DIMMED_OPACITY;
        tweenMaterialOpacity(mesh.material, target, duration);
    });
    if (centralSphere) {
        tweenMaterialOpacity(centralSphere.material, focusMesh ? PROJECT_DIMMED_OPACITY : 1, duration);
    }
}

function animateParticlesMaterial(targetOpacity, targetSize, duration) {
    if (!particlesMesh) return;
    
    const material = particlesMesh.material;
    
    // Stop existing tween if any
    if (material.userData.tween) {
        material.userData.tween.stop();
    }

    material.userData.tween = new TWEEN.Tween({ opacity: material.opacity, size: material.size })
        .to({ opacity: targetOpacity, size: targetSize }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function (obj) {
            material.opacity = obj.opacity;
            material.size = obj.size;
        })
        .start();
}

function animateOpacity(object, targetOpacity, duration, onCompleteCallback) {
    // Se stiamo facendo un fade in, assicuriamoci che l'oggetto sia visibile
    if (targetOpacity > 0) {
        object.visible = true;
    }
    new TWEEN.Tween({ opacity: object.material.opacity })
        .to({ opacity: targetOpacity }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function (obj) {
            object.material.opacity = obj.opacity;
        })
        .onComplete(function () {
            // Se l'animazione porta a 0, rendi l'oggetto invisibile
            if (targetOpacity === 0) {
                object.visible = false;
            }
            if (onCompleteCallback) onCompleteCallback();
        })
        .start();
}

const labelWorldPos = new THREE.Vector3();

// --- Aggancio magnetico del cursore all'elemento sotto di esso ---
const snapCenter = new THREE.Vector3();
const snapEdge = new THREE.Vector3();
const camRight = new THREE.Vector3();
const CURSOR_SNAP_PADDING = 18; // px oltre il bordo dell'elemento

function updateCursorSnap(mesh) {
    mesh.getWorldPosition(snapCenter);

    // Raggio dell'elemento proiettato in pixel: prendo un punto sul bordo
    // lungo l'asse orizzontale della camera e misuro la distanza a schermo
    const worldRadius = (mesh.geometry.parameters.radius || 1.5) * mesh.scale.x;
    camRight.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(worldRadius);
    snapEdge.copy(snapCenter).add(camRight);

    snapCenter.project(camera);
    snapEdge.project(camera);

    const cx = (snapCenter.x * 0.5 + 0.5) * window.innerWidth;
    const cy = (-snapCenter.y * 0.5 + 0.5) * window.innerHeight;
    const ex = (snapEdge.x * 0.5 + 0.5) * window.innerWidth;

    snapCursorTo(cx, cy, Math.abs(ex - cx) * 2 + CURSOR_SNAP_PADDING);
}

function updateProjects() {
    projectsMeshes.forEach((projectMesh, index) => {
        const radius = 10 + projectMesh.userData.ringIndex * ringDistance;

        if (projectsMoving) {
            // La velocità propria compensa quella della galassia: la velocità
            // netta percepita resta costante anche con l'idle più veloce
            const ownSpeed = Math.max(0, getNetProjectSpeed() - (rotating ? rotatingSpeed : 0));
            projectMesh.userData.angle -= ownSpeed;
        }

        const angle = projectMesh.userData.angle;
        projectMesh.position.set(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );

        // Trascina l'interruzione dell'anello insieme al progetto
        const ring = rings[projectMesh.userData.ringIndex];
        if (ring) ring.rotation.z = angle - ring.userData.gapOffset;

        // Mantieni i progetti orientati verso la camera indipendentemente dallo stato di rotazione
        projectMesh.lookAt(camera.position);

        const previewImage = previewImages[index];
        previewImage.position.set(
            projectMesh.position.x,
            projectMesh.position.y,
            projectMesh.position.z
        );
        previewImage.lookAt(camera.position);

        // Proietta la posizione 3D del progetto in coordinate schermo per l'etichetta HTML
        const label = labels[index];
        projectMesh.getWorldPosition(labelWorldPos);
        const distance = labelWorldPos.distanceTo(camera.position);
        labelWorldPos.project(camera);

        const hidden = label.classList.contains('label-hidden');

        if (labelWorldPos.z > 1 || hidden) {
            // Dietro la camera o nascosta dall'hover
            label.style.opacity = '0';
            label.numEl.style.opacity = '0';
        } else {
            const x = (labelWorldPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-labelWorldPos.y * 0.5 + 0.5) * window.innerHeight;
            // Scala e opacità in base alla distanza: i progetti sul lato lontano
            // arretrano invece di competere con quelli in primo piano
            const depthScale = Math.min(1.25, Math.max(0.55, 62 / distance));
            const depthOpacity = Math.min(1, Math.max(0.32, (110 - distance) / 55));
            const transform = 'translate(' + (x + 34 * depthScale) + 'px, ' + (y - 10 * depthScale) + 'px) scale(' + depthScale + ')';

            label.style.opacity = depthOpacity.toFixed(3);
            label.style.transform = transform;
            // Stesso ancoraggio: il numero resta allineato al nome
            label.numEl.style.opacity = depthOpacity.toFixed(3);
            label.numEl.style.transform = transform;
        }
    });
}

function updateParticles() {
    if (!particlesMesh) return;

    const positions = particlesMesh.geometry.attributes.position.array;
    
    // 1. Trova la posizione del mouse nello spazio locale della galassia
    let localMouse = new THREE.Vector3(9999, 9999, 9999); // Default lontano
    
    // Usa il raycaster esistente che viene aggiornato in animate() o onMouseMove
    // Nota: raycaster.setFromCamera viene chiamato in animate() solo se !isMobileDevice
    // Quindi dobbiamo assicurarci che il raycaster sia aggiornato qui se vogliamo l'effetto
    if (!isMobileDevice()) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(interactionPlane);
        if (intersects.length > 0) {
            localMouse = intersects[0].point; // Questo punto è già locale perché interactionPlane è dentro galaxy? 
            // No, intersectObject restituisce world point. Dobbiamo convertirlo in locale.
            starGroup.worldToLocal(localMouse); // Converti nel sistema di coordinate delle stelle
        }
    }

    // Parametri configurabili
    const mouseRepelRadius = 20;
    const mouseRepelForce = 5;
    // const projectHaloRadius = 6; // Rimosso per la nuova logica
    const returnSpeed = 0.05; // Velocità di ritorno alla posizione originale

    // Calcolo posizione razzo (fuori dal loop per performance)
    let rocketLocalPos = null;
    const rocketRepelRadius = 15; // Raggio di influenza del razzo
    const rocketRepelForce = 8;   // Forza di repulsione del razzo

    if (model3D && model3D.visible) {
        const rocketWorldPos = new THREE.Vector3();
        model3D.getWorldPosition(rocketWorldPos);
        rocketLocalPos = starGroup.worldToLocal(rocketWorldPos);
    }

    for (let i = 0; i < positions.length / 3; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        // Posizione attuale
        let px = positions[ix];
        let py = positions[iy];
        let pz = positions[iz];

        // Posizione target (basata sullo stato attuale: galassia o forma)
        let tx = particleTargetPositions[ix];
        let ty = particleTargetPositions[iy];
        let tz = particleTargetPositions[iz];

        // Mentre le particelle compongono il modello del progetto non devono
        // essere disturbate da mouse e razzo: la forma deve restare leggibile
        if (shapeBase) {
            positions[ix] += (tx - px) * returnSpeed;
            positions[iy] += (ty - py) * returnSpeed;
            positions[iz] += (tz - pz) * returnSpeed;
            continue;
        }

        // --- Logica 1: Mouse Repulsion (Sferica) ---
        const dxMouse = px - localMouse.x;
        const dyMouse = py - localMouse.y;
        const dzMouse = pz - localMouse.z;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse + dzMouse * dzMouse);

        if (distMouse < mouseRepelRadius) {
            const force = (mouseRepelRadius - distMouse) / mouseRepelRadius;
            tx += (dxMouse / distMouse) * force * mouseRepelForce;
            ty += (dyMouse / distMouse) * force * mouseRepelForce;
            tz += (dzMouse / distMouse) * force * mouseRepelForce;
        }

        // --- Logica 2: Rocket Repulsion ---
        if (rocketLocalPos) {
            const dxRocket = px - rocketLocalPos.x;
            const dyRocket = py - rocketLocalPos.y;
            const dzRocket = pz - rocketLocalPos.z;
            const distRocket = Math.sqrt(dxRocket * dxRocket + dyRocket * dyRocket + dzRocket * dzRocket);

            if (distRocket < rocketRepelRadius) {
                const force = (rocketRepelRadius - distRocket) / rocketRepelRadius;
                tx += (dxRocket / distRocket) * force * rocketRepelForce;
                ty += (dyRocket / distRocket) * force * rocketRepelForce;
                tz += (dzRocket / distRocket) * force * rocketRepelForce;
            }
        }

        // --- Logica 2: Project Halo RIMOSSA ---

        // --- Applicazione del movimento (Lerp) ---
        // Muovi dolcemente la particella verso il target calcolato
        positions[ix] += (tx - px) * returnSpeed;
        positions[iy] += (ty - py) * returnSpeed;
        positions[iz] += (tz - pz) * returnSpeed;
    }

    particlesMesh.geometry.attributes.position.needsUpdate = true;
}

// Restituisce i punti della forma di un progetto, centrati sull'origine
function getShapePoints(shapeIndex) {
    if (loadedShapes[shapeIndex]) return loadedShapes[shapeIndex];

    // Il Corollario: una costellazione gerarchica costruita direttamente
    // in Three.js, coerente con il knowledge graph della piattaforma.
    if (shapeIndex === 0) {
        const points = [];
        const nodes = [];
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));

        function addNode(position, radius, count) {
            nodes.push(position);
            for (let i = 0; i < count; i++) {
                const y = 1 - (i / Math.max(1, count - 1)) * 2;
                const radial = Math.sqrt(Math.max(0, 1 - y * y));
                const angle = goldenAngle * i;
                points.push(new THREE.Vector3(
                    position.x + Math.cos(angle) * radial * radius,
                    position.y + y * radius,
                    position.z + Math.sin(angle) * radial * radius
                ));
            }
        }

        function addEdge(start, end, count = 22) {
            for (let i = 0; i < count; i++) {
                points.push(start.clone().lerp(end, i / Math.max(1, count - 1)));
            }
        }

        const subject = new THREE.Vector3(0, 0, 0);
        addNode(subject, 5.2, 120);

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const position = new THREE.Vector3(
                Math.cos(angle) * 25,
                Math.sin(angle) * 18,
                (i % 2 === 0 ? -1 : 1) * 1.5
            );
            addNode(position, 3.3, 45);
            addEdge(subject, position, 60);

            for (let j = 0; j < 3; j++) {
                const spread = angle + (j - 1) * 0.28;
                const child = new THREE.Vector3(
                    position.x + Math.cos(spread) * (13 + j * 2),
                    position.y + Math.sin(spread) * (10 + j * 2),
                    (j - 1) * 1.5
                );
                addNode(child, 1.7, 20);
                addEdge(position, child, 35);
            }
        }

        return points;
    }

    // Ripiego geometrico se il modello del progetto non è (ancora) caricato
    const size = 35;
    let geometry;
    switch (shapeIndex % 6) {
        case 0: geometry = new THREE.BoxGeometry(size, size, size); break;
        case 1: geometry = new THREE.TetrahedronGeometry(size * 0.8); break;
        case 2: geometry = new THREE.OctahedronGeometry(size * 0.8); break;
        case 3: geometry = new THREE.IcosahedronGeometry(size * 0.7); break;
        case 4: geometry = new THREE.DodecahedronGeometry(size * 0.7); break;
        default: geometry = new THREE.TorusGeometry(size * 0.5, size * 0.1, 16, 100);
    }

    const edges = new THREE.EdgesGeometry(geometry);
    const edgePositions = edges.attributes.position.array;
    const segmentCount = edgePositions.length / 6;

    const points = [];
    for (let s = 0; s < segmentCount; s++) {
        const start = s * 6;
        // Punti distribuiti lungo ciascuno spigolo
        for (let k = 0; k < 12; k++) {
            const t = k / 11;
            points.push(new THREE.Vector3(
                edgePositions[start] + (edgePositions[start + 3] - edgePositions[start]) * t,
                edgePositions[start + 1] + (edgePositions[start + 4] - edgePositions[start + 1]) * t,
                edgePositions[start + 2] + (edgePositions[start + 5] - edgePositions[start + 2]) * t
            ));
        }
    }

    geometry.dispose();
    edges.dispose();
    return points;
}

// --- Modello a particelle ospitato nell'area immagine della scheda ---
let shapeBase = null;        // campionamento fisso: evita che le particelle
let shapeMaxRadiusXZ = 1;    // saltino da un punto all'altro a ogni frame
let shapeMaxY = 1;
let shapeAngle = 0;

const SHAPE_DISTANCE = 32;    // distanza dalla camera: davanti alla galassia
const SHAPE_MARGIN = 0.86;    // margine interno rispetto ai bordi dell'area
const SHAPE_SPIN = 0.00187;   // ~56 secondi per giro completo

// Dimensione delle particelle mentre compongono il modello nella scheda,
// con override per i modelli che risultano troppo densi
const SHAPE_PARTICLE_SIZE_DEFAULT = 0.104;
const SHAPE_PARTICLE_SIZE = { 3: 0.062 }; // VOTE: particelle 40% più piccole

// Scala visiva di ciascun modello dentro l'area della scheda
// (moltiplica la scala di contenimento calcolata automaticamente)
const SHAPE_SCALE = { 0: 0.92, 1: 0.8, 2: 0.675, 3: 0.9, 4: 0.8, 5: 0.7, 6: 1 };
let shapeScaleMul = 1;

const shapeMatrix = new THREE.Matrix4();
const shapeTmpMatrix = new THREE.Matrix4();
const shapeTmpVec = new THREE.Vector3();

function prepareShape(shapeIndex) {
    const points = getShapePoints(shapeIndex);
    if (!points || points.length === 0) return;

    const count = particleTargetPositions.length / 3;
    shapeBase = new Float32Array(count * 3);
    shapeAngle = 0;
    shapeScaleMul = SHAPE_SCALE[shapeIndex] !== undefined ? SHAPE_SCALE[shapeIndex] : 1;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
        const p = points[Math.floor(Math.random() * points.length)];
        shapeBase[i * 3] = p.x;
        shapeBase[i * 3 + 1] = p.y;
        shapeBase[i * 3 + 2] = p.z;

        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
        minZ = Math.min(minZ, p.z);
        maxZ = Math.max(maxZ, p.z);
    }

    // Ricentra il campionamento effettivamente visualizzato: in questo modo
    // il suo bounding box resta agganciato al centro del projectStage anche
    // quando il campionamento casuale non è perfettamente simmetrico.
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    let maxRadius = 0;
    let maxAbsY = 0;

    for (let i = 0; i < count; i++) {
        const offset = i * 3;
        shapeBase[offset] -= centerX;
        shapeBase[offset + 1] -= centerY;
        shapeBase[offset + 2] -= centerZ;

        // Ruotando attorno a Y è il raggio nel piano XZ a poter sbordare.
        maxRadius = Math.max(
            maxRadius,
            Math.sqrt(shapeBase[offset] ** 2 + shapeBase[offset + 2] ** 2)
        );
        maxAbsY = Math.max(maxAbsY, Math.abs(shapeBase[offset + 1]));
    }
    shapeMaxRadiusXZ = maxRadius || 1;
    shapeMaxY = maxAbsY || 1;
}

function updateShapeTargets() {
    if (!shapeBase) return;

    const rect = projectStage.getBoundingClientRect();
    if (rect.width < 1) return;

    shapeAngle += SHAPE_SPIN;

    // Punto del mondo che cade al centro dell'area, a distanza fissa
    const ndcX = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
    const ndcY = -((rect.top + rect.height / 2) / window.innerHeight) * 2 + 1;
    const dir = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
    const worldPos = camera.position.clone().add(dir.multiplyScalar(SHAPE_DISTANCE));

    // Quanto misura un pixel dello schermo a quella distanza
    const visibleHeight = 2 * Math.tan(THREE.Math.degToRad(camera.fov) / 2) * SHAPE_DISTANCE;
    const unitsPerPixel = visibleHeight / window.innerHeight;
    const halfWidth = (rect.width / 2) * unitsPerPixel * SHAPE_MARGIN;
    const halfHeight = (rect.height / 2) * unitsPerPixel * SHAPE_MARGIN;

    // Il lato più vincolante decide la scala: così il modello resta dentro
    // l'area per tutti i 360° della rotazione
    const flatScale = Math.min(halfWidth / shapeMaxRadiusXZ, halfHeight / shapeMaxY);

    // Correzione prospettica: i punti del modello rivolti verso la camera
    // sono più vicini di SHAPE_DISTANCE e quindi proiettano più grandi.
    // Senza questo fattore la forma sborda dai bordi dell'area.
    const nearestOffset = flatScale * shapeMaxRadiusXZ;
    const scale = flatScale * (SHAPE_DISTANCE - nearestOffset) / SHAPE_DISTANCE * shapeScaleMul;

    // Le particelle vivono nello spazio di starGroup: compongo
    // inversa(starGroup) · traslazione · rotazione · scala
    starGroup.updateMatrixWorld();
    shapeMatrix.copy(starGroup.matrixWorld).invert();
    shapeMatrix.multiply(shapeTmpMatrix.makeTranslation(worldPos.x, worldPos.y, worldPos.z));
    shapeMatrix.multiply(shapeTmpMatrix.makeRotationY(shapeAngle));
    shapeMatrix.multiply(shapeTmpMatrix.makeScale(scale, scale, scale));

    const count = particleTargetPositions.length / 3;
    for (let i = 0; i < count; i++) {
        shapeTmpVec
            .set(shapeBase[i * 3], shapeBase[i * 3 + 1], shapeBase[i * 3 + 2])
            .applyMatrix4(shapeMatrix);
        particleTargetPositions[i * 3] = shapeTmpVec.x;
        particleTargetPositions[i * 3 + 1] = shapeTmpVec.y;
        particleTargetPositions[i * 3 + 2] = shapeTmpVec.z;
    }
}

function resetParticleTargets() {
    shapeBase = null;
    for (let i = 0; i < particleTargetPositions.length; i++) {
        particleTargetPositions[i] = particleInitialPositions[i];
    }
}

function addLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {
    if (isMobileDevice()) {
        // Su mobile, controlla prima se è stato cliccato il modello o la sfera centrale
        raycaster.setFromCamera(mouse, camera);
        const centralIntersects = raycaster.intersectObjects([centralSphere, model3D]);

        if (centralIntersects.length > 0) {
            if (centralIntersects[0].object === centralSphere && !isModelActive && !isAnimating) {
                // Click sulla sfera centrale
                isAnimating = true;
                showModel(() => {
                    isModelActive = true;
                    isAnimating = false;
                });
            } else if (centralIntersects[0].object === model3D && isModelActive && !isAnimating) {
                // Click sul modello 3D
                isAnimating = true;
                showSphere(() => {
                    isModelActive = false;
                    isAnimating = false;
                });
            }
        } else {
            // Controlla se è stato cliccato un progetto
            const projectIntersects = raycaster.intersectObjects(projectsMeshes);
            if (projectIntersects.length > 0) {
                const clickedProject = projectIntersects[0].object;
                window.location.href = clickedProject.userData.url;
            }
        }
    } else {
        // Comportamento desktop esistente
        if (INTERSECTED) {
            if (infoCard.style.display !== 'none' && infoCard.style.display !== '') {
                infoCard.classList.add('expandCard');
                const projectUrl = INTERSECTED.userData.url;
                if (projectUrl) {
                    setTimeout(() => {
                        window.location.href = projectUrl;
                    }, 500);
                }
            }
        }
    }
}

function scaleProject(object, scale) {
    object.scale.set(scale, scale, scale);
}

// Funzione per mostrare la scheda informativa

function stopRotation() {
    new TWEEN.Tween({ speed: rotatingSpeed })
        .to({ speed: 0 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function (obj) {
            rotatingSpeed = obj.speed;
        })
        .onComplete(function () {
            rotating = false;
        })
        .start();
}

function startRotation() {
    const targetSpeed = getIdleSpeed();

    new TWEEN.Tween({ speed: 0 })
        .to({ speed: targetSpeed }, 1000)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(function (obj) {
            rotatingSpeed = obj.speed;
            rotating = true;
        })
        .start();
}

function stopProjectsMovement() {
    projectsMoving = false;
}

function startProjectsMovement() {
    projectsMoving = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let scrollDelta = 0;

function onMouseWheel(event) {
    scrollDelta += event.deltaY * 0.0002;
}

function showModel(callback) {
    if (!model3D) return;

    animateScale3D(centralSphere, 0, 300, () => {
        centralSphere.visible = false;
        model3D.visible = true;
        resetRocketMotion();
        resetRocketTrail(); // Reset trail when model appears
        isRocketEngineActive = true;

        animateScale3D(model3D, ROCKET_VISIBLE_SCALE, 300, () => {
            if (callback) callback();
        });
    });
}

// Modifica la funzione showSphere
function showSphere(callback) {
    isRocketEngineActive = false;
    rocketJourneyComplete = true;
    animateScale3D(model3D, 0, 300, () => {
        model3D.visible = false;
        centralSphere.visible = true;
        animateScale3D(centralSphere, 1, 300, callback);
    });
}

function animateScale3D(object, targetScale, duration, onComplete) {
    if (!object) return;

    new TWEEN.Tween({ scale: object.scale.x })
        .to({ scale: targetScale }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function (obj) {
            object.scale.set(obj.scale, obj.scale, obj.scale);
        })
        .onComplete(() => {
            if (onComplete) onComplete();
        })
        .start();
}




function animateScale(object, targetScale, duration, onCompleteCallback) {
    // Se l'oggetto è già alla scala target, esegui il callback e esci
    if (Math.abs(object.scale.x - targetScale) < 0.01) {
        if (onCompleteCallback) onCompleteCallback();
        return;
    }
    // Se esiste già un tween che punta allo stesso target, non ricominciare
    if (object.userData.scaleTween && object.userData.currentTarget === targetScale) {
        return;
    }
    // Ferma eventuali tween in corso
    if (object.userData.scaleTween) {
        object.userData.scaleTween.stop();
    }
    // Salva il target corrente
    object.userData.currentTarget = targetScale;
    const currentScale = object.scale.x;
    object.userData.scaleTween = new TWEEN.Tween({ scale: currentScale })
        .to({ scale: targetScale }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function (obj) {
            object.scale.set(obj.scale, obj.scale, obj.scale);
        })
        .onComplete(function () {
            object.userData.scaleTween = null;
            object.userData.currentTarget = targetScale;
            if (onCompleteCallback) onCompleteCallback();
        })
        .start();
}

// Variabili per il touch scrolling
let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let touchDeltaY = 0;

// Funzione per iniziare il touch
function onTouchStart(event) {
    if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
}

// Funzione per gestire il movimento del touch
function onTouchMove(event) {
    if (event.touches.length === 1) {
        let touchMoveX = event.touches[0].clientX;
        let touchMoveY = event.touches[0].clientY;

        // Calcola il movimento rispetto alla posizione iniziale
        touchDeltaX = (touchMoveX - touchStartX) * 0.006; // Scala per maggiore sensibilità
        touchDeltaY = (touchMoveY - touchStartY) * 0.006;

        // Aggiorna la posizione iniziale per il prossimo movimento
        touchStartX = touchMoveX;
        touchStartY = touchMoveY;
    }
}

let isAnimating = false;

function isMobileDevice() {
    return (window.innerWidth <= 768) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}


// Modifica la funzione `animate` per rispettare lo stato di `rotating`
function animate() {
    requestAnimationFrame(animate);

    // Rotazione e aggiornamenti della galassia
    galaxy.rotation.y += rotating ? rotatingSpeed : 0;
    galaxy.rotation.y += scrollDelta;
    galaxy.rotation.y += touchDeltaX;
    scrollDelta *= 0.9;
    touchDeltaX *= 0.9;
    touchDeltaY *= 0.9;
    
    // Rotazione rallentata per le stelle
    starGroup.rotation.y += (rotating ? rotatingSpeed * 0.1 : 0); // Molto più lento
    starGroup.rotation.y += scrollDelta * 0.1;
    starGroup.rotation.y += touchDeltaX * 0.1;

    // Limita i salti dopo tab inattive o frame molto lenti.
    const delta = Math.min(clock.getDelta(), 1 / 30);

    TWEEN.update();
    updateProjects();
    updateShapeTargets(); // Fa ruotare il modello dentro l'area della scheda
    updateRocketMotion(delta);
    updateParticles(); // Aggiorna le particelle
    updateRocketTrail(delta);
    galaxy.position.y = galaxyPositionY;

    // Controllo del raycaster per l'hover (solo desktop)
    if (!isMobileDevice()) {
        if (!document.body.classList.contains('about-active') && userInteracted) {
            raycaster.setFromCamera(mouse, camera);
            const objectsToTest = [];
            if (centralSphere && centralSphere.visible) objectsToTest.push(centralSphere);
            if (model3D && model3D.visible) objectsToTest.push(model3D);
            const intersects = raycaster.intersectObjects(objectsToTest);

            if (intersects.length > 0) {
                // Se interseca la sfera e il modello non è attivo
                if (intersects[0].object === centralSphere && !isModelActive && !isAnimating) {
                    isAnimating = true;
                    showModel(() => {
                        isModelActive = true;
                        isAnimating = false;
                    });
                }
                // Se interseca il modello 3D ed è attivo
                else if (intersects[0].object === model3D && isModelActive && !isAnimating) {
                    isAnimating = true;
                    showSphere(() => {
                        isModelActive = false;
                        isAnimating = false;
                    });
                }
            }

            // Logica per i progetti (solo su desktop)
            const projectIntersects = raycaster.intersectObjects(projectsMeshes);
            if (projectIntersects.length > 0) {
                document.body.classList.add('cursor-hovered');

                const intersected = projectIntersects[0].object;
                updateCursorSnap(intersected);

                // Viene verificato a ogni frame: se l'hover inizia durante la
                // comparsa, il razzo si chiude appena la transizione termina.
                hideRocketAtCurrentPosition();

                // Effetto Tilt 3D (Parallax)
                const localPoint = intersected.worldToLocal(projectIntersects[0].point.clone());
                const tiltIntensity = 0.15;
                intersected.rotateX(localPoint.y * tiltIntensity);
                intersected.rotateY(-localPoint.x * tiltIntensity);

                const index = projectsMeshes.indexOf(intersected);
                if (index !== -1 && previewImages[index]) {
                    previewImages[index].rotateX(localPoint.y * tiltIntensity);
                    previewImages[index].rotateY(-localPoint.x * tiltIntensity);
                }

                if (INTERSECTED !== intersected) {
                    if (INTERSECTED) {
                        animateOpacity(previewImages[projectsMeshes.indexOf(INTERSECTED)], 0, 150);
                        animateScale(INTERSECTED, 1, 150);
                    }
                    INTERSECTED = intersected;
                    hideLabel(labels[projectsMeshes.indexOf(INTERSECTED)]);
                    dissolveOtherLabels(projectsMeshes.indexOf(INTERSECTED));
                    animateScale(INTERSECTED, 5, 150, () => {
                        animateOpacity(previewImages[projectsMeshes.indexOf(INTERSECTED)], 1, 150);
                    });
                    showInfoCard(
                        INTERSECTED.userData,
                        projectsMeshes.indexOf(INTERSECTED),
                        projectsData.length
                    );
                    
                    // Prepara il modello a particelle del progetto: verrà
                    // posizionato e fatto ruotare dentro l'area della scheda
                    const projectIndex = projectsMeshes.indexOf(INTERSECTED);
                    const shapeIndex = INTERSECTED.userData.shapeIndex ?? projectIndex;
                    prepareShape(shapeIndex);

                    const shapeParticleSize = SHAPE_PARTICLE_SIZE[shapeIndex] !== undefined
                        ? SHAPE_PARTICLE_SIZE[shapeIndex]
                        : SHAPE_PARTICLE_SIZE_DEFAULT;

                    stopRotation();
                    stopProjectsMovement();
                    animateRingsOpacity(0.2, 500); // Riduci opacità anelli
                    animateParticlesMaterial(1, shapeParticleSize, 500);
                    focusOnProject(INTERSECTED, 400);
                }
            } else {
                // Se il cursore è agganciato a un elemento di interfaccia
                // (header, PAUSE), l'aggancio è gestito dai suoi eventi
                if (!domSnapActive) {
                    document.body.classList.remove('cursor-hovered');
                    releaseCursor(
                        (mouse.x * 0.5 + 0.5) * window.innerWidth,
                        (-mouse.y * 0.5 + 0.5) * window.innerHeight
                    );
                }
                if (INTERSECTED) {
                animateOpacity(previewImages[projectsMeshes.indexOf(INTERSECTED)], 0, 150);
                animateScale(INTERSECTED, 1, 150);
                INTERSECTED = null;
                revealAllLabels();
                hideInfoCard();

                // Ripristina le particelle alla forma della galassia
                resetParticleTargets();
                focusOnProject(null, 400);
                animateRingsOpacity(RING_IDLE_OPACITY, 500); // Ripristina opacità anelli
                animateParticlesMaterial(particlesMesh.material.userData.originalOpacity, particlesMesh.material.userData.originalSize, 500);
                }
            }
        }
    }

    renderer.render(scene, camera);
}




document.fonts.ready.then(() => {
    init();
});
