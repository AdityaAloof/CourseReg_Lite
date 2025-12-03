(function(global) {
    const COURSE_SOURCE = 'assets/data/courses.json';
    const CACHE_KEY = 'crl_catalog_cache';
    const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
    const REQUEST_TIMEOUT_MS = 4000;

    const FALLBACK_COURSES = [
        { code: 'CS101', name: 'Introduction to Computer Science', credits: 3, description: 'Fundamental concepts of programming, algorithms, and data structures.' },
        { code: 'CS201', name: 'Data Structures and Algorithms', credits: 4, description: 'Advanced data structures, algorithm analysis, and complexity theory.' },
        { code: 'MATH150', name: 'Calculus I', credits: 4, description: 'Limits, derivatives, and applications of differential calculus.' },
        { code: 'MATH250', name: 'Calculus II', credits: 4, description: 'Integration techniques, sequences, series, and applications.' },
        { code: 'ENG101', name: 'Composition I', credits: 3, description: 'Writing, research, and critical thinking skills development.' },
        { code: 'PHYS200', name: 'Physics I', credits: 4, description: 'Mechanics, thermodynamics, and wave motion fundamentals.' },
        { code: 'HIST101', name: 'World History', credits: 3, description: 'Survey of major world civilizations and historical developments.' },
        { code: 'BIOL101', name: 'Biology I', credits: 4, description: 'Cell biology, genetics, and evolution principles.' },
        { code: 'CHEM101', name: 'Chemistry I', credits: 4, description: 'Atomic structure, bonding, and chemical reactions.' },
        { code: 'PSYC101', name: 'Introduction to Psychology', credits: 3, description: 'Overview of psychological principles, theories, and research methods.' }
    ];

    let lastMeta = null;

    async function loadCourses() {
        let meta;
        try {
            meta = await fetchLiveCatalog();
        } catch (error) {
            meta = recoverCatalog(error);
        }
        lastMeta = meta;
        return meta;
    }

    async function fetchLiveCatalog() {
        const response = await fetchWithTimeout(COURSE_SOURCE, REQUEST_TIMEOUT_MS);
        if (!response.ok) {
            throw new Error(`Catalog request failed (${response.status})`);
        }
        const payload = await response.json();
        const normalized = normalizePayload(payload);
        cacheCatalog(normalized, payload.version);
        return {
            source: 'live',
            stale: false,
            refreshedAt: Date.now(),
            version: payload.version || null,
            courses: normalized,
            message: 'Live catalog loaded successfully.'
        };
    }

    function recoverCatalog(error) {
        const cached = readCatalogCache();
        if (cached) {
            const stale = Date.now() - cached.savedAt > CACHE_TTL_MS;
            return {
                source: 'cache',
                stale,
                refreshedAt: cached.savedAt,
                version: cached.version || null,
                courses: cached.courses,
                message: stale ? 'Using cached catalog (stale) while live data is unavailable.' : 'Using cached catalog while live data is unavailable.',
                errorMessage: error ? error.message : undefined
            };
        }
        return {
            source: 'fallback',
            stale: true,
            refreshedAt: null,
            version: null,
            courses: FALLBACK_COURSES.slice(),
            message: 'Using built-in fallback catalog after live data failure.',
            errorMessage: error ? error.message : undefined
        };
    }

    function cacheCatalog(courses, version) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                savedAt: Date.now(),
                courses,
                version: version || null
            }));
        } catch (storageError) {
            console.warn('Unable to persist catalog cache', storageError);
        }
    }

    function readCatalogCache() {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed.courses)) {
                return null;
            }
            return parsed;
        } catch (error) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    }

    function normalizePayload(payload) {
        const items = Array.isArray(payload && payload.courses) ? payload.courses : payload;
        if (!Array.isArray(items)) {
            throw new Error('Catalog payload missing course array');
        }
        return items
            .map(normalizeCourse)
            .filter(course => course.code);
    }

    function normalizeCourse(entry) {
        const code = String(entry.code || '').trim();
        return {
            code,
            name: entry.name ? String(entry.name) : 'Untitled Course',
            credits: Number(entry.credits) || 0,
            description: entry.description ? String(entry.description) : 'Description unavailable.'
        };
    }

    async function fetchWithTimeout(url, timeoutMs) {
        if (!('AbortController' in window)) {
            return fetch(url);
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    global.CourseCatalogService = {
        loadCourses,
        getFallbackCourses: () => FALLBACK_COURSES.slice(),
        getLastMeta: () => lastMeta
    };
})(window);
