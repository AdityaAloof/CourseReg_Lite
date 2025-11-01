// Cart management functionality

// Get cart from session storage
function getCart() {
    const cartJson = sessionStorage.getItem('cart');
    return cartJson ? JSON.parse(cartJson) : [];
}

// Save cart to session storage
function saveCart(cart) {
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

// Add course to cart
function addToCart(course) {
    const cart = getCart();
    
    // Check if course already in cart
    if (cart.find(item => item.code === course.code)) {
        return { success: false, message: 'Course already in cart' };
    }
    
    // Check max courses limit (5)
    if (cart.length >= 5) {
        return { success: false, message: 'Maximum 5 courses allowed' };
    }
    
    cart.push(course);
    saveCart(cart);
    return { success: true, message: 'Course added to cart' };
}

// Remove course from cart
function removeFromCart(courseCode) {
    const cart = getCart();
    const filtered = cart.filter(item => item.code !== courseCode);
    saveCart(filtered);
    return { success: true, message: 'Course removed from cart' };
}

// Calculate total credits
function getTotalCredits() {
    const cart = getCart();
    return cart.reduce((sum, course) => sum + course.credits, 0);
}

// Get cart count
function getCartCount() {
    return getCart().length;
}

// Clear cart (on logout)
function clearCart() {
    sessionStorage.removeItem('cart');
}

