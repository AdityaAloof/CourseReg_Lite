// Courses page functionality with resilient catalog loading

let catalog = [];
let dataStatusBanner;

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;

    dataStatusBanner = document.getElementById('dataStatusBanner');
    document.getElementById('currentUsername').textContent = getCurrentUser();

    hydrateCatalog().then(() => {
        updateCartDisplay();
        updateCartCount();
    });
});

async function hydrateCatalog() {
    if (!isDynamicCatalogEnabled()) {
        catalog = getEmbeddedFallbackCatalog();
        renderDataStatus({
            source: 'fallback',
            stale: false,
            message: 'Dynamic catalog disabled via feature flag. Serving embedded data.'
        });
        displayCourses();
        return;
    }

    if (!window.CourseCatalogService) {
        console.warn('CourseCatalogService unavailable. Falling back to embedded data.');
        catalog = getEmbeddedFallbackCatalog();
        renderDataStatus({ source: 'fallback', stale: true, message: 'Catalog service unavailable. Using embedded data.' });
        displayCourses();
        return;
    }

    showDataLoading();
    try {
        const result = await CourseCatalogService.loadCourses();
        catalog = Array.isArray(result.courses) ? result.courses : [];
        renderDataStatus(result);
    } catch (error) {
        console.error('Failed to load catalog, using fallback data.', error);
        catalog = CourseCatalogService.getFallbackCourses();
        renderDataStatus({
            source: 'fallback',
            stale: true,
            message: 'Unable to reach the live catalog. Using fallback data.',
            errorMessage: error.message
        });
    }
    displayCourses();
}

function showDataLoading() {
    if (!dataStatusBanner) {
        return;
    }
    dataStatusBanner.textContent = 'Loading the latest course catalog…';
    dataStatusBanner.classList.remove('d-none', 'alert-warning', 'alert-danger', 'alert-success');
    dataStatusBanner.classList.add('alert-info');
    dataStatusBanner.setAttribute('role', 'status');
}

function renderDataStatus(meta) {
    if (!dataStatusBanner || !meta) {
        return;
    }
    const toneMap = {
        live: 'success',
        cache: 'warning',
        fallback: 'danger'
    };
    const tone = toneMap[meta.source] || 'info';
    const lastUpdated = meta.refreshedAt ? ` Last updated ${formatTimestamp(meta.refreshedAt)}.` : '';
    const baseMessage = meta.message || 'Catalog status unavailable.';
    const errorDetail = meta.errorMessage ? ` Cause: ${meta.errorMessage}.` : '';
    dataStatusBanner.textContent = `${baseMessage}${lastUpdated}${errorDetail}`;
    dataStatusBanner.classList.remove('d-none', 'alert-info', 'alert-warning', 'alert-danger', 'alert-success');
    dataStatusBanner.classList.add(`alert-${tone}`);
    dataStatusBanner.setAttribute('role', tone === 'success' ? 'status' : 'alert');
}

function formatTimestamp(timestamp) {
    try {
        return new Date(timestamp).toLocaleString();
    } catch (error) {
        return 'recently';
    }
}

function getEmbeddedFallbackCatalog() {
    return [
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
}

function isDynamicCatalogEnabled() {
    return !window.FeatureFlags || FeatureFlags.get('dynamicCatalog') !== false;
}

function displayCourses() {
    const container = document.getElementById('coursesContainer');
    if (!container) {
        return;
    }
    const cart = getCart();
    const cartCodes = cart.map(c => c.code);

    if (!catalog.length) {
        container.innerHTML = '<p class="text-muted">Course catalog is unavailable right now. Please try again later.</p>';
        return;
    }

    container.innerHTML = '';

    catalog.forEach(course => {
        const inCart = cartCodes.includes(course.code);
        const card = document.createElement('div');
        card.className = 'col-md-6 mb-3';
        card.innerHTML = `
            <div class="card course-card h-100 ${inCart ? 'in-cart' : ''}">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="course-code-badge">${course.code}</span>
                        ${inCart ? '<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i>In Cart</span>' : ''}
                    </div>
                    <h5 class="text-primary mb-3 fw-bold">${course.name}</h5>
                    <p class="card-text text-muted mb-3" style="line-height: 1.6;">${course.description}</p>
                    <div class="d-flex justify-content-between align-items-center pt-3 border-top">
                        <span class="badge bg-secondary px-3 py-2">
                            <i class="bi bi-award me-1"></i>${course.credits} Credits
                        </span>
                        ${inCart 
                            ? `<button class="btn btn-sm btn-outline-danger" onclick="removeCourse('${course.code}')">
                                <i class="bi bi-dash-circle me-1"></i>Remove
                               </button>`
                            : `<button class="btn btn-sm btn-primary" onclick="addCourse('${course.code}')">
                                <i class="bi bi-plus-circle me-1"></i>Add to Cart
                               </button>`
                        }
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function addCourse(courseCode) {
    const course = catalog.find(c => c.code === courseCode);
    if (!course) return;
    
    const result = addToCart(course);
    
    if (!result.success) {
        showError(result.message);
    } else {
        hideError();
        displayCourses();
        updateCartDisplay();
        updateCartCount();
    }
}

function removeCourse(courseCode) {
    removeFromCart(courseCode);
    displayCourses();
    updateCartDisplay();
    updateCartCount();
}

function updateCartDisplay() {
    const container = document.getElementById('cartContainer');
    const cart = getCart();
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Your cart is empty</p>';
        document.getElementById('confirmBtn').disabled = true;
        document.getElementById('totalCredits').textContent = '0';
        return;
    }
    
    container.innerHTML = '';
    cart.forEach(course => {
        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="fw-semibold">${course.code}</div>
                    <div class="small text-muted">${course.name}</div>
                    <div class="small"><span class="badge bg-secondary">${course.credits} credits</span></div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeCourse('${course.code}')" aria-label="Remove ${course.code}">
                    <i class="bi bi-x-circle"></i>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
    
    // Update total credits
    const total = getTotalCredits();
    document.getElementById('totalCredits').textContent = total;
    
    // Enable confirm button if cart has items
    document.getElementById('confirmBtn').disabled = false;
}

function updateCartCount() {
    const count = getCartCount();
    document.getElementById('cartCount').textContent = count;
}

function clearAllCart() {
    if (confirm('Are you sure you want to clear all courses from your cart?')) {
        saveCart([]);
        displayCourses();
        updateCartDisplay();
        updateCartCount();
    }
}

function goToConfirmation() {
    const cart = getCart();
    if (cart.length === 0) {
        showError('Your cart is empty. Please add at least one course.');
        return;
    }
    window.location.href = 'confirmation.html';
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.remove('d-none');
    alert.setAttribute('role', 'alert');
    setTimeout(() => hideError(), 5000);
}

function hideError() {
    const alert = document.getElementById('errorAlert');
    alert.classList.add('d-none');
}

