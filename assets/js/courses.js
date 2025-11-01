// Courses page functionality

// Predefined courses data
const COURSES = [
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

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Set username
    document.getElementById('currentUsername').textContent = getCurrentUser();
    
    // Load and display courses
    displayCourses();
    
    // Update cart display
    updateCartDisplay();
    
    // Update cart count in navbar
    updateCartCount();
});

function displayCourses() {
    const container = document.getElementById('coursesContainer');
    const cart = getCart();
    const cartCodes = cart.map(c => c.code);
    
    container.innerHTML = '';
    
    COURSES.forEach(course => {
        const inCart = cartCodes.includes(course.code);
        const card = document.createElement('div');
        card.className = `col-md-6 mb-3`;
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
    const course = COURSES.find(c => c.code === courseCode);
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

