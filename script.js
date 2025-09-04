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

// Product Data with Descriptions
const productData = {
    'king-cashews-butter': {
        title: 'King Cashews (Butter-Roasted Salted)',
        weight: '100g',
        price: 195,
        image: 'menue/كاجو مدخن.webp',
        badges: ['Premium', 'Protein Rich'],
        description: 'Experience the royal treatment with our King Cashews (Butter-Roasted Salted), a luxurious snack crafted for indulgence. These premium whole cashews are roasted to golden perfection in creamy butter and lightly salted to enhance their natural flavor, offering a delightful crunch in every bite.',
        features: [
            'Rich & Buttery Flavor: Perfectly roasted in butter for a decadent taste',
            'Lightly Salted: Balanced seasoning to highlight natural richness',
            'Nutrient-Rich: Packed with healthy fats, protein, and essential minerals',
            'Perfect for guilt-free snacking anytime, anywhere',
            'Great for charcuterie boards or party platters',
            'Sealed in premium resealable bag for freshness'
        ]
    },
    'king-cashews-salted': {
        title: 'King Sized Cashew (Roasted Salted)',
        weight: '100g',
        price: 195,
        image: 'menue/كاجو مدخن.webp',
        badges: ['King Size', 'High Protein'],
        description: 'Experience the ultimate snacking pleasure with King Sized Cashew (Roasted Salted), a premium selection of extra-large cashews roasted to perfection and lightly salted for an irresistible crunch. Perfect for satisfying cravings while providing a rich source of nutrients.',
        features: [
            'Extra-Large & Premium Quality: Rich, buttery flavor and crunchy texture',
            'Perfectly Roasted: Expertly roasted to enhance natural nutty flavor',
            'Lightly Salted: Balanced seasoning for gourmet taste',
            'Nutrient-Packed: High in protein, healthy fats, and essential minerals',
            'Perfect for snacking anytime, anywhere',
            'Great for sharing with friends and family'
        ]
    },
    'roasted-salted-peanuts': {
        title: 'Roasted Salted Peanuts',
        weight: '100g',
        price: 98,
        image: 'menue/peanut.webp',
        badges: ['Gluten Free', 'Vitamin E'],
        description: 'Indulge in the classic taste of roasted salted peanuts, a timeless snack loved by all. Packed with crunch, flavor, and nutrients, these peanuts are carefully roasted and lightly salted to perfection.',
        features: [
            'Rich in Nutrients: Great source of protein, healthy fats, and vitamins B6 & E',
            'Perfectly Seasoned: Lightly salted for savory snack experience',
            'Roasted for Crispiness: Satisfying crunch in every handful',
            'Snack on the Go: Perfect for quick energy boosts and travel',
            'Diet-Friendly: Gluten-free and suitable for vegetarian diets',
            'Store in cool, dry place to maintain freshness'
        ]
    },
    'roasted-unsalted-peanuts': {
        title: 'Roasted Unsalted Peanuts',
        weight: '100g',
        price: 98,
        image: 'menue/peanut.webp',
        badges: ['All Natural', 'Keto Friendly'],
        description: 'Enjoy the pure, natural flavor of roasted unsalted peanuts, a wholesome snack packed with nutrients and crunch. Carefully roasted to bring out their natural taste, these peanuts are perfect for guilt-free snacking or as an ingredient in your favorite recipes.',
        features: [
            'All-Natural Flavor: No added salt or preservatives, just pure peanuts',
            'Rich in Nutrients: Powerhouse of protein, healthy fats, and vitamins B6 & E',
            'Roasted to Perfection: Crunchy and delicious in every bite',
            'Versatile Use: Great for snacks, salads, baked goods, or trail mixes',
            'Diet-Friendly: Gluten-free, vegan, and keto-friendly',
            'Store in cool, dry place to maintain freshness'
        ]
    },
    'american-pistachio': {
        title: 'Roasted Salted Pistachio (American)',
        weight: '100g',
        price: 210,
        image: 'menue/pistachio.webp',
        badges: ['American', 'Heart Healthy'],
        description: 'Enjoy the premium taste of Roasted Salted Pistachio (American), a gourmet snack crafted from the finest American pistachios. Perfectly roasted and lightly salted, these pistachios offer a delightful crunch and rich flavor in every bite.',
        features: [
            'Premium Quality: Sourced from finest pistachio farms in the USA',
            'Perfectly Seasoned: Lightly salted to enhance natural, nutty flavor',
            'Nutrient-Rich: High in protein, fiber, and heart-healthy fats',
            'Perfect for snacking at home, work, or on the go',
            'Great for parties or charcuterie boards',
            'Ideal for recipes, salads, desserts, or savory dishes'
        ]
    },
    'pumpkin-seeds': {
        title: 'Roasted Salted Pumpkin Seeds',
        weight: '100g',
        price: 125,
        image: 'menue/لب خشابي.jpg',
        badges: ['Antioxidants', 'Magnesium'],
        description: 'Crunch into the wholesome goodness of Roasted Salted Pumpkin Seeds, a flavorful snack packed with nutrients. These premium pumpkin seeds are roasted to perfection and lightly salted to bring out their rich, nutty taste.',
        features: [
            'Rich in Flavor: Perfectly roasted and seasoned with right amount of salt',
            'Nutrient-Dense: High in protein, healthy fats, magnesium, zinc, and antioxidants',
            'Versatile Snack: Great for snacking, topping salads, soups, or trail blends',
            'Quick healthy snack at home, work, or on the go',
            'Adds crunch and nutrition to recipes',
            'Heart-healthy addition to your daily diet'
        ]
    },
    'sunflower-seeds': {
        title: 'Roasted Salted Sunflower Seeds',
        weight: '100g',
        price: 115,
        image: 'menue/sunflowerseeds.webp',
        badges: ['Vegan', 'Vitamin E'],
        description: 'Enjoy the crunchy goodness of roasted salted sunflower seeds, a nutritious and flavorful snack that\'s perfect for any time of the day. Carefully roasted and lightly salted, these seeds are a great way to satisfy your cravings while staying healthy.',
        features: [
            'Nutrient-Packed: High in vitamin E, magnesium, and healthy fats',
            'Lightly Salted: Balanced seasoning to enhance natural flavor',
            'Perfectly Roasted: Satisfying crunch with every bite',
            'Versatile Snack: Great for snacking, salads, or trail mix',
            'Diet-Friendly: Vegan, gluten-free, and keto-friendly',
            'Store in cool, dry place to keep seeds fresh and crunchy'
        ]
    },
         'egyptian-seeds': {
         title: 'Roasted Egyptian Seeds',
         weight: '100g',
         price: 125,
         image: 'menue/لب مصري.webp',
         badges: ['Authentic', 'High Fiber'],
         description: 'Savor the rich flavors of Roasted Egyptian Seeds, a timeless snack loved across generations. Carefully selected from the finest farms in Egypt, these seeds are roasted to perfection to deliver a crunchy texture and satisfying burst of flavor.',
         features: [
             'Authentic Egyptian Taste: Traditional flavors of Egypt in healthy snack',
             'Premium Quality: Handpicked seeds, roasted without compromising nutrients',
             'Healthy Snacking: High in fiber and packed with essential nutrients',
             'Versatile Delight: Perfect for casual snacking or entertaining guests',
             'Adds crunch to your meals',
             'Perfect companion for relaxing at home or on the go'
         ]
     },
     'hickory-smoked-almonds': {
         title: 'Nutzzi Almonds - Hickory Smoked',
         weight: '100g',
         price: 185,
         image: 'menue/hickory almonds.webp',
         badges: ['Gourmet', 'Smoky'],
         description: 'Experience the rich, smoky flavor of Nutzzi Hickory Smoked Almonds, a gourmet snack designed to elevate your taste buds. These premium almonds are roasted to perfection and infused with the deep, woodsy aroma of hickory smoke, offering a satisfying crunch and an unforgettable flavor.',
         features: [
             'Bold Flavor: Perfect balance of natural almond goodness and authentic hickory smoke',
             'Healthy and Nutritious: Rich in protein, healthy fats, and essential nutrients',
             'Versatile: Enjoy straight from pack or use as smoky twist in salads and recipes',
             'Premium roasting process for optimal flavor',
             'Woodsy hickory aroma for gourmet experience',
             'Perfect for sophisticated snacking'
         ]
     },
     'roasted-salted-almonds': {
         title: 'Roasted Almonds (Salted)',
         weight: '100g',
         price: 185,
         image: 'menue/salted almonds.webp',
         badges: ['Classic', 'Vitamin E'],
         description: 'Savor the classic taste of Roasted Almonds (Salted), a wholesome and flavorful snack that combines the natural crunch of premium almonds with a perfect touch of salt. These almonds are roasted to perfection, bringing out their rich, nutty flavor for an irresistible treat.',
         features: [
             'Rich & Savory Flavor: Perfectly roasted and lightly salted to enhance natural taste',
             'Healthy Snack: Packed with protein, healthy fats, vitamin E and magnesium',
             'Versatile: Great as snack, salad topping, or complement to favorite dishes',
             'Nutritious snack at home, work, or on the go',
             'Perfect for serving at parties or gatherings',
             'Great for adding to trail mixes or using in recipes'
         ]
     },
     'chilli-lime-almonds': {
         title: 'Chilli Lime Crunchy Coated Almonds',
         weight: '100g',
         price: 180,
         image: 'menue/chilli lemon almonds.webp',
         badges: ['Spicy', 'Zesty'],
         description: 'Get ready to excite your taste buds with Chilli Lime Crunchy Coated Almonds! These premium almonds are coated in a zesty blend of spicy chili and tangy lime, wrapped in a crunchy layer that delivers a bold burst of flavor in every bite.',
         features: [
             'Bold Flavors: Fiery kick of chili meets refreshing zest of lime',
             'Crunchy Texture: Perfectly coated for extra crunch that makes snacking irresistible',
             'Nutritious and Delicious: Packed with protein, healthy fats, and essential vitamins',
             'Perfect for snacking at home or on the go',
             'Great for adding spicy, tangy twist to party platters',
             'Excellent pairing with favorite drinks or salads'
         ]
     },
     'cheese-coated-almonds': {
         title: 'Almonds Crunchy Coated (Cheese)',
         weight: '250g',
         price: 465,
         image: 'menue/cheese almodnd and tomato one also .webp',
         badges: ['Premium', '250g'],
         description: 'Nutzzi\'s Almond Collection, where health meets indulgence! Our handpicked almonds are sourced from the finest farms, ensuring rich flavor, perfect crunch, and superior quality in every bite. This premium cheese-coated variety offers a delightful savory experience.',
         features: [
             'Handpicked Quality: Sourced from finest farms for superior quality',
             'Rich Cheese Flavor: Perfectly balanced cheese coating',
             'Loaded with Nutrition: Protein, fiber, antioxidants, and heart-healthy fats',
             'Perfect for snacking, baking, or adding healthy twist to meals',
             'Large 250g pack for sharing or extended enjoyment',
             'Premium selection ensures rich flavor and perfect crunch'
         ]
     }
};

// Modal Functions
function openProductModal(productId) {
    const product = productData[productId];
    if (!product) return;

    document.getElementById('modalTitle').textContent = product.title;
    document.getElementById('modalWeight').textContent = product.weight;
    document.getElementById('modalPrice').innerHTML = `${product.price} <span class="currency">EGP</span>`;
    document.getElementById('modalImage').src = product.image;
    document.getElementById('modalImage').alt = product.title;
    document.getElementById('modalDescription').textContent = product.description;
    
    // Set badges
    const badgesContainer = document.getElementById('modalBadges');
    badgesContainer.innerHTML = product.badges.map(badge => 
        `<span class="badge ${badge.toLowerCase().replace(/\s+/g, '-')}">${badge}</span>`
    ).join('');
    
    // Set features
    const featuresContainer = document.getElementById('modalFeatures');
    featuresContainer.innerHTML = `
        <h4>Key Features:</h4>
        <ul>
            ${product.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
    `;
    
    // Reset quantity and update total
    document.getElementById('quantity').value = 1;
    updateTotalPrice(product.price);
    
    // Show modal
    document.getElementById('productModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Store current product price for calculations
    window.currentProductPrice = product.price;
    window.currentProductTitle = product.title;
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newQuantity = parseInt(quantityInput.value) + change;
    
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 10) newQuantity = 10;
    
    quantityInput.value = newQuantity;
    updateTotalPrice(window.currentProductPrice);
}

function updateTotalPrice(unitPrice) {
    const quantity = parseInt(document.getElementById('quantity').value);
    const total = unitPrice * quantity;
    document.getElementById('totalPrice').textContent = total;
}

function orderProduct() {
    const quantity = document.getElementById('quantity').value;
    const productTitle = window.currentProductTitle;
    const totalPrice = document.getElementById('totalPrice').textContent;
    
    const message = `Hello! I would like to order:
    
Product: ${productTitle}
Quantity: ${quantity} pack(s)
Total: ${totalPrice} EGP

Please confirm availability and delivery details.`;
    
    const whatsappUrl = `https://wa.me/201024299309?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
}

// Keyboard support for modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});

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