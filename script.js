// DOM Elements
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const categories = document.querySelectorAll('.category');
const productCards = document.querySelectorAll('.product-card');

// Search functionality
searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    
    productCards.forEach(card => {
        const productName = card.dataset.name.toLowerCase();
        const productText = card.textContent.toLowerCase();
        
        if (productName.includes(searchTerm) || productText.includes(searchTerm)) {
            card.classList.remove('hidden');
            card.style.animation = 'fadeInUp 0.3s ease forwards';
        } else {
            card.classList.add('hidden');
        }
    });
    
    // Show/hide categories based on visible products
    categories.forEach(category => {
        const visibleProducts = category.querySelectorAll('.product-card:not(.hidden)');
        if (visibleProducts.length === 0 && searchTerm !== '') {
            category.classList.add('hidden');
        } else {
            category.classList.remove('hidden');
        }
    });
    
    // If search is empty, show all products and categories
    if (searchTerm === '') {
        productCards.forEach(card => card.classList.remove('hidden'));
        categories.forEach(category => category.classList.remove('hidden'));
        
        // Reset filter to "All"
        filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');
    }
});

// Filter functionality
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        const category = this.dataset.category;
        
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Clear search input
        searchInput.value = '';
        
        // Filter products and categories
        if (category === 'all') {
            // Show all products and categories
            productCards.forEach(card => {
                card.classList.remove('hidden');
                card.style.animation = 'fadeInUp 0.3s ease forwards';
            });
            categories.forEach(cat => cat.classList.remove('hidden'));
        } else {
            // Hide all categories first
            categories.forEach(cat => {
                if (cat.dataset.category === category) {
                    cat.classList.remove('hidden');
                    // Show all products in this category
                    const categoryProducts = cat.querySelectorAll('.product-card');
                    categoryProducts.forEach(card => {
                        card.classList.remove('hidden');
                        card.style.animation = 'fadeInUp 0.3s ease forwards';
                    });
                } else {
                    cat.classList.add('hidden');
                }
            });
        }
    });
});

// Category toggle functionality
function toggleCategory(categoryId) {
    const category = document.getElementById(categoryId);
    const content = category.querySelector('.category-content');
    const header = category.querySelector('.category-header');
    const icon = header.querySelector('.toggle-icon');
    
    if (content.classList.contains('active')) {
        // Collapse category
        content.classList.remove('active');
        header.classList.add('collapsed');
        icon.style.transform = 'rotate(-90deg)';
    } else {
        // Expand category
        content.classList.add('active');
        header.classList.remove('collapsed');
        icon.style.transform = 'rotate(0deg)';
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('.nav-list a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            // Ensure the category is expanded
            const content = targetElement.querySelector('.category-content');
            const header = targetElement.querySelector('.category-header');
            const icon = header.querySelector('.toggle-icon');
            
            if (!content.classList.contains('active')) {
                content.classList.add('active');
                header.classList.remove('collapsed');
                icon.style.transform = 'rotate(0deg)';
            }
            
            // Smooth scroll to target
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading animation for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.product-image img, .banner-img, .logo-img');
    
    images.forEach(img => {
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', function() {
                this.style.opacity = '1';
            });
        }
    });
});

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    const scrollY = window.scrollY;
    
    if (scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 4px 25px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Add touch-friendly interactions for mobile
if ('ontouchstart' in window) {
    // Add touch feedback for buttons
    const interactiveElements = document.querySelectorAll('.filter-btn, .category-header, .nav-list a');
    
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        element.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Press 'S' to focus search
    if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        if (document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    }
    
    // Press 'Escape' to clear search
    if (e.key === 'Escape') {
        if (searchInput.value !== '') {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.blur();
        }
    }
});

// Add product card click animation
productCards.forEach(card => {
    card.addEventListener('click', function() {
        // Add a subtle pulse animation when clicked
        this.style.animation = 'none';
        setTimeout(() => {
            this.style.animation = 'pulse 0.6s ease';
        }, 10);
    });
});

// CSS animation for pulse effect (added dynamically)
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add staggered animation to product cards
    productCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Preload images for better performance
    const imageUrls = [
        'menue/banner.jpg',
        'menue/our logo.png',
        'menue/كاجو مدخن.webp',
        'menue/hickory almonds.webp',
        'menue/salted almonds.webp',
        'menue/chilli lemon almonds.webp',
        'menue/cheese almodnd and tomato one also .webp',
        'menue/pistachio.webp',
        'menue/hazelnut.webp',
        'menue/peanut.webp',
        'menue/لب ابيض.webp',
        'menue/لب مصري.webp',
        'menue/لب خشابي.jpg',
        'menue/sunflowerseeds.webp'
    ];
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}); 