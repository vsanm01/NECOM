/**
 * E-commerce Sidebar Component v2.1
 * CDN Library for easy integration into any project
 * 
 * Usage:
 * <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
 * <link rel="stylesheet" href="https://cdn.example.com/ecom-sidebar.css">
 * <script src="https://cdn.example.com/ecom-sidebar.js"></script>
 * 
 * Initialize:
 * EcomSidebar.init({ categories: [...], brands: [...], priceRanges: [...] })
 */

const EcomSidebar = (() => {
    // Default Sample Data (can be overridden)
    const defaultData = {
        categories: [
            { id: 'electronics', name: 'Electronics', count: 1245 },
            { id: 'fashion', name: 'Fashion', count: 3421 },
            { id: 'home', name: 'Home & Living', count: 892 },
            { id: 'sports', name: 'Sports & Outdoors', count: 654 },
            { id: 'books', name: 'Books & Media', count: 2103 }
        ],
        brands: [
            { id: 'apple', name: 'Apple', count: 156 },
            { id: 'samsung', name: 'Samsung', count: 243 },
            { id: 'nike', name: 'Nike', count: 189 },
            { id: 'adidas', name: 'Adidas', count: 167 },
            { id: 'sony', name: 'Sony', count: 134 }
        ],
        priceRanges: [
            { id: 'under25', label: 'Under $25', count: 892 },
            { id: '25to50', label: '$25 - $50', count: 1245 },
            { id: '50to100', label: '$50 - $100', count: 987 },
            { id: '100to200', label: '$100 - $200', count: 654 },
            { id: 'over200', label: 'Over $200', count: 432 }
        ]
    };

    let categories = [];
    let brands = [];
    let priceRanges = [];

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;

    let selectedFilters = {
        categories: [],
        brands: [],
        priceRange: null
    };

    let darkMode = false;
    let eventListeners = [];
    let initialized = false;

    const sidebarHTML = `
        <button class="ecom-mobile-toggle" aria-label="Toggle sidebar">
            <i class="fas fa-bars"></i>
        </button>

        <div class="ecom-sidebar-overlay"></div>

        <aside class="ecom-sidebar" id="ecomSidebar" role="navigation" aria-label="Shopping sidebar">
            <div class="ecom-sidebar-header">
                <a href="#" class="ecom-sidebar-logo">
                    <i class="fas fa-shopping-cart"></i>
                    <span>ShopHub</span>
                </a>
                <button class="ecom-theme-toggle" aria-label="Toggle dark mode">
                    <i class="fas fa-moon" id="ecomThemeIcon"></i>
                </button>
            </div>

            <div class="ecom-sidebar-search">
                <div class="ecom-search-wrapper">
                    <i class="fas fa-search"></i>
                    <input type="text" id="ecomSidebarSearch" placeholder="Search products..." aria-label="Search products">
                </div>
            </div>

            <nav class="ecom-sidebar-nav">
                <div class="ecom-nav-item active" data-route="home">
                    <div class="ecom-nav-item-content">
                        <i class="fas fa-home"></i>
                        <span>Home</span>
                    </div>
                </div>
                <div class="ecom-nav-item" data-route="cart">
                    <div class="ecom-nav-item-content">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Shopping Cart</span>
                    </div>
                    <span class="ecom-nav-badge" id="ecomCartBadge">0</span>
                </div>
                <div class="ecom-nav-item" data-route="wishlist">
                    <div class="ecom-nav-item-content">
                        <i class="fas fa-heart"></i>
                        <span>Wishlist</span>
                    </div>
                    <span class="ecom-nav-badge" id="ecomWishlistBadge">0</span>
                </div>
                <div class="ecom-nav-item" data-route="orders">
                    <div class="ecom-nav-item-content">
                        <i class="fas fa-box"></i>
                        <span>My Orders</span>
                    </div>
                </div>
                <div class="ecom-nav-item" data-route="allproduct">
                    <div class="ecom-nav-item-content">
                        <i class="fas fa-th"></i>
                        <span>All Products</span>
                    </div>
                </div>
            </nav>

            <div class="ecom-sidebar-filters">
                <div class="ecom-filters-header">
                    <h3>Filters</h3>
                    <button class="ecom-clear-filters" style="display: none;" id="ecomClearFiltersBtn" aria-label="Clear all filters">
                        Clear all (<span id="ecomFilterCount">0</span>)
                    </button>
                </div>

                <div class="ecom-filter-section" id="ecomCategoriesSection">
                    <div class="ecom-filter-section-header">
                        <span>Categories</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="ecom-filter-items" id="ecomCategoriesItems"></div>
                </div>

                <div class="ecom-filter-section collapsed" id="ecomBrandsSection">
                    <div class="ecom-filter-section-header">
                        <span>Brands</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="ecom-filter-items" id="ecomBrandsItems"></div>
                </div>

                <div class="ecom-filter-section collapsed" id="ecomPriceSection">
                    <div class="ecom-filter-section-header">
                        <span>Price Range</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="ecom-filter-items" id="ecomPriceItems"></div>
                </div>

                <div class="ecom-filter-section collapsed" id="ecomCategoryModeSection">
                    <div class="ecom-filter-section-header">
                        <span>Category Toggle</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="ecom-filter-items" id="ecomCategoryModeItems">
                        <div class="ecom-category-toggle">
                            <button class="ecom-toggle-btn active" data-view="grid" aria-label="Grid view">
                                <i class="fas fa-th"></i>
                            </button>
                            <button class="ecom-toggle-btn" data-view="list" aria-label="List view">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="ecom-filter-section collapsed" id="ecomSortBySection">
                    <div class="ecom-filter-section-header">
                        <span>Sort By</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="ecom-filter-items" id="ecomSortByItems">
                        <label class="ecom-filter-item">
                            <input type="radio" name="ecomSortBy" value="newest" data-filter-type="sortby">
                            <label class="ecom-filter-label">Newest</label>
                        </label>
                        <label class="ecom-filter-item">
                            <input type="radio" name="ecomSortBy" value="popular" data-filter-type="sortby">
                            <label class="ecom-filter-label">Most Popular</label>
                        </label>
                        <label class="ecom-filter-item">
                            <input type="radio" name="ecomSortBy" value="priceLow" data-filter-type="sortby">
                            <label class="ecom-filter-label">Price: Low to High</label>
                        </label>
                        <label class="ecom-filter-item">
                            <input type="radio" name="ecomSortBy" value="priceHigh" data-filter-type="sortby">
                            <label class="ecom-filter-label">Price: High to Low</label>
                        </label>
                    </div>
                </div>
            </div>

            <div class="ecom-sidebar-menu">
                <div class="ecom-menu-section">
                    <h4>Account</h4>
                    <a href="#" class="ecom-menu-link" data-route="refresh">
                        <i class="fas fa-sync-alt"></i>
                        <span>Refresh</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="downloads">
                        <i class="fas fa-download"></i>
                        <span>Downloads</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="payment">
                        <i class="fas fa-credit-card"></i>
                        <span>Payment Methods</span>
                    </a>
                </div>

                <div class="ecom-menu-section">
                    <h4>Media</h4>
                    <a href="#" class="ecom-menu-link" data-route="image">
                        <i class="fas fa-image"></i>
                        <span>Images</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="video">
                        <i class="fas fa-video"></i>
                        <span>Videos</span>
                    </a>
                </div>

                <div class="ecom-menu-section">
                    <h4>Data</h4>
                    <a href="#" class="ecom-menu-link" data-route="dbc">
                        <i class="fas fa-id-card"></i>
                        <span>DBC</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="qr">
                        <i class="fas fa-qrcode"></i>
                        <span>QR Codes</span>
                    </a>
                </div>

                <div class="ecom-menu-section">
                    <h4>Social & Settings</h4>
                    <a href="#" class="ecom-menu-link" data-route="socialmedia">
                        <i class="fas fa-share-alt"></i>
                        <span>Social Media</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="settings">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="notification">
                        <i class="fas fa-bell"></i>
                        <span>Notifications</span>
                    </a>
                </div>

                <div class="ecom-menu-section">
                    <h4>Information</h4>
                    <a href="#" class="ecom-menu-link" data-route="readme">
                        <i class="fas fa-readme"></i>
                        <span>ReadMe</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="help">
                        <i class="fas fa-question-circle"></i>
                        <span>Help</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="contactus">
                        <i class="fas fa-envelope"></i>
                        <span>Contact Us</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="hiring">
                        <i class="fas fa-briefcase"></i>
                        <span>We Are Hiring</span>
                    </a>
                    <a href="#" class="ecom-menu-link" data-route="business">
                        <i class="fas fa-handshake"></i>
                        <span>Business With Us</span>
                    </a>
                </div>
            </div>

            <div class="ecom-sidebar-footer">
                <a href="#" class="ecom-footer-link" data-route="about">
                    <i class="fas fa-info-circle"></i>
                    <span>About</span>
                </a>
                <a href="#" class="ecom-footer-link" data-route="terms">
                    <i class="fas fa-file-contract"></i>
                    <span>Terms & Conditions</span>
                </a>
                <a href="#" class="ecom-footer-link" data-route="datapolicy">
                    <i class="fas fa-lock"></i>
                    <span>Data Policy</span>
                </a>
                <a href="#" class="ecom-footer-link" data-route="privacy">
                    <i class="fas fa-shield-alt"></i>
                    <span>Privacy</span>
                </a>
            </div>
        </aside>
    `;

    function renderCategories() {
        const container = document.getElementById('ecomCategoriesItems');
        if (!container || !categories.length) return;
        container.innerHTML = categories.map(cat => `
            <label class="ecom-filter-item">
                <input type="checkbox" 
                       id="ecom-cat-${cat.id}"
                       value="${cat.id}" 
                       data-filter-type="category">
                <label for="ecom-cat-${cat.id}" class="ecom-filter-label">${escapeHtml(cat.name)}</label>
                <span class="ecom-filter-count">${cat.count}</span>
            </label>
        `).join('');
    }

    function renderBrands() {
        const container = document.getElementById('ecomBrandsItems');
        if (!container || !brands.length) return;
        container.innerHTML = brands.map(brand => `
            <label class="ecom-filter-item">
                <input type="checkbox" 
                       id="ecom-brand-${brand.id}"
                       value="${brand.id}" 
                       data-filter-type="brand">
                <label for="ecom-brand-${brand.id}" class="ecom-filter-label">${escapeHtml(brand.name)}</label>
                <span class="ecom-filter-count">${brand.count}</span>
            </label>
        `).join('');
    }

    function renderPriceRanges() {
        const container = document.getElementById('ecomPriceItems');
        if (!container || !priceRanges.length) return;
        container.innerHTML = priceRanges.map(range => `
            <label class="ecom-filter-item">
                <input type="radio" 
                       id="ecom-price-${range.id}"
                       name="ecomPriceRange" 
                       value="${range.id}" 
                       data-filter-type="price">
                <label for="ecom-price-${range.id}" class="ecom-filter-label">${escapeHtml(range.label)}</label>
                <span class="ecom-filter-count">${range.count}</span>
            </label>
        `).join('');
    }

    function updateFilterCount() {
        const count = selectedFilters.categories.length + 
                     selectedFilters.brands.length + 
                     (selectedFilters.priceRange ? 1 : 0);
        
        const countEl = document.getElementById('ecomFilterCount');
        const btnEl = document.getElementById('ecomClearFiltersBtn');
        if (countEl) countEl.textContent = count;
        if (btnEl) btnEl.style.display = count > 0 ? 'block' : 'none';
    }

    function emitFilterChange() {
        const event = new CustomEvent('ecomSidebarFilterChange', {
            detail: { ...selectedFilters }
        });
        window.dispatchEvent(event);
    }

    function handleSearch(query) {
        const event = new CustomEvent('ecomSidebarSearch', {
            detail: { query: query.trim() }
        });
        window.dispatchEvent(event);
    }

    function handleNavClick(route) {
        document.querySelectorAll('.ecom-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-route="${route}"]`)?.classList.add('active');
        
        const event = new CustomEvent('ecomSidebarNavigation', {
            detail: { route }
        });
        window.dispatchEvent(event);
    }

    function handleMenuClick(route) {
        const event = new CustomEvent('ecomSidebarMenuClick', {
            detail: { route }
        });
        window.dispatchEvent(event);
        closeSidebar();
    }

    function toggleTheme() {
        darkMode = !darkMode;
        const sidebar = document.getElementById('ecomSidebar');
        const icon = document.getElementById('ecomThemeIcon');
        
        if (sidebar) {
            if (darkMode) {
                sidebar.classList.add('ecom-dark-mode');
                localStorage.setItem('ecomSidebarDarkMode', 'true');
                if (icon) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            } else {
                sidebar.classList.remove('ecom-dark-mode');
                localStorage.setItem('ecomSidebarDarkMode', 'false');
                if (icon) {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
        }
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('ecomSidebar');
        const overlay = document.querySelector('.ecom-sidebar-overlay');
        
        if (sidebar) sidebar.classList.toggle('ecom-open');
        if (overlay) overlay.classList.toggle('ecom-active');
        
        if (sidebar?.classList.contains('ecom-open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    function closeSidebar() {
        const sidebar = document.getElementById('ecomSidebar');
        const overlay = document.querySelector('.ecom-sidebar-overlay');
        
        if (sidebar) sidebar.classList.remove('ecom-open');
        if (overlay) overlay.classList.remove('ecom-active');
        document.body.style.overflow = '';
    }

    function clearAllFilters() {
        selectedFilters = { categories: [], brands: [], priceRange: null };
        
        document.querySelectorAll('.ecom-filter-item input').forEach(input => {
            input.checked = false;
        });
        
        updateFilterCount();
        emitFilterChange();
    }

    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }

    function handleSwipe() {
        const sidebar = document.getElementById('ecomSidebar');
        if (!sidebar) return;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
            if (diffX > 0 && touchStartX < 50 && !sidebar.classList.contains('ecom-open')) {
                toggleSidebar();
            }
            else if (diffX < 0 && sidebar.classList.contains('ecom-open')) {
                closeSidebar();
            }
        }
    }

    function handleKeyPress(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function attachEventListeners() {
        const sidebar = document.getElementById('ecomSidebar');
        const toggle = document.querySelector('.ecom-mobile-toggle');
        const overlay = document.querySelector('.ecom-sidebar-overlay');
        const searchInput = document.getElementById('ecomSidebarSearch');
        const clearBtn = document.getElementById('ecomClearFiltersBtn');
        const themeBtn = document.querySelector('.ecom-theme-toggle');

        if (toggle) {
            const toggleHandler = () => toggleSidebar();
            toggle.addEventListener('click', toggleHandler);
            eventListeners.push({ el: toggle, event: 'click', handler: toggleHandler });
        }

        if (overlay) {
            const overlayHandler = () => closeSidebar();
            overlay.addEventListener('click', overlayHandler);
            eventListeners.push({ el: overlay, event: 'click', handler: overlayHandler });
        }

        if (searchInput) {
            const searchHandler = (e) => handleSearch(e.target.value);
            searchInput.addEventListener('input', searchHandler);
            eventListeners.push({ el: searchInput, event: 'input', handler: searchHandler });
        }

        if (clearBtn) {
            const clearHandler = () => clearAllFilters();
            clearBtn.addEventListener('click', clearHandler);
            eventListeners.push({ el: clearBtn, event: 'click', handler: clearHandler });
        }

        if (themeBtn) {
            const themeHandler = () => toggleTheme();
            themeBtn.addEventListener('click', themeHandler);
            eventListeners.push({ el: themeBtn, event: 'click', handler: themeHandler });
        }

        document.querySelectorAll('.ecom-filter-section-header').forEach(header => {
            const section = header.closest('.ecom-filter-section');
            if (section) {
                const toggleHandler = () => {
                    section.classList.toggle('collapsed');
                };
                header.addEventListener('click', toggleHandler);
                eventListeners.push({ el: header, event: 'click', handler: toggleHandler });
            }
        });

        document.querySelectorAll('.ecom-filter-item input').forEach(input => {
            const changeHandler = (e) => {
                const type = e.target.dataset.filterType;
                const value = e.target.value;
                const checked = e.target.checked;

                if (type === 'category') {
                    if (checked) {
                        selectedFilters.categories.push(value);
                    } else {
                        selectedFilters.categories = selectedFilters.categories.filter(id => id !== value);
                    }
                } else if (type === 'brand') {
                    if (checked) {
                        selectedFilters.brands.push(value);
                    } else {
                        selectedFilters.brands = selectedFilters.brands.filter(id => id !== value);
                    }
                } else if (type === 'price') {
                    selectedFilters.priceRange = checked ? value : null;
                }

                updateFilterCount();
                emitFilterChange();
            };
            input.addEventListener('change', changeHandler);
            eventListeners.push({ el: input, event: 'change', handler: changeHandler });
        });

        document.querySelectorAll('.ecom-nav-item').forEach(item => {
            const navHandler = () => {
                const route = item.dataset.route;
                if (route) handleNavClick(route);
                closeSidebar();
            };
            item.addEventListener('click', navHandler);
            eventListeners.push({ el: item, event: 'click', handler: navHandler });
        });

        document.querySelectorAll('.ecom-menu-link').forEach(link => {
            const menuHandler = (e) => {
                e.preventDefault();
                const route = link.dataset.route;
                if (route) handleMenuClick(route);
            };
            link.addEventListener('click', menuHandler);
            eventListeners.push({ el: link, event: 'click', handler: menuHandler });
        });

        const touchStartHandler = (e) => handleTouchStart(e);
        const touchEndHandler = (e) => handleTouchEnd(e);
        const keyHandler = (e) => handleKeyPress(e);

        document.addEventListener('touchstart', touchStartHandler, { passive: true });
        document.addEventListener('touchend', touchEndHandler, { passive: true });
        document.addEventListener('keydown', keyHandler);

        eventListeners.push(
            { el: document, event: 'touchstart', handler: touchStartHandler },
            { el: document, event: 'touchend', handler: touchEndHandler },
            { el: document, event: 'keydown', handler: keyHandler }
        );
    }

    function init(options = {}) {
        if (initialized) {
            console.warn('EcomSidebar is already initialized');
            return;
        }

        try {
            const root = document.getElementById('ecom-sidebar-root') || document.body;
            root.insertAdjacentHTML('afterbegin', sidebarHTML);

            categories = options.categories || defaultData.categories;
            brands = options.brands || defaultData.brands;
            priceRanges = options.priceRanges || defaultData.priceRanges;

            renderCategories();
            renderBrands();
            renderPriceRanges();
            attachEventListeners();
            updateFilterCount();

            const savedDarkMode = localStorage.getItem('ecomSidebarDarkMode') === 'true';
            if (savedDarkMode) {
                darkMode = true;
                const sidebar = document.getElementById('ecomSidebar');
                const icon = document.getElementById('ecomThemeIcon');
                if (sidebar) sidebar.classList.add('ecom-dark-mode');
                if (icon) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }

            initialized = true;
            console.log('✓ EcomSidebar initialized successfully');
        } catch (error) {
            console.error('✗ EcomSidebar initialization failed:', error);
        }
    }

    function destroy() {
        eventListeners.forEach(({ el, event, handler }) => {
            try {
                el.removeEventListener(event, handler);
            } catch (e) {
                console.warn('Error removing event listener:', e);
            }
        });
        eventListeners = [];

        const sidebar = document.getElementById('ecomSidebar');
        const toggle = document.querySelector('.ecom-mobile-toggle');
        const overlay = document.querySelector('.ecom-sidebar-overlay');

        sidebar?.remove();
        toggle?.remove();
        overlay?.remove();

        initialized = false;
        console.log('✓ EcomSidebar destroyed');
    }

    return {
        init,
        destroy,
        toggleSidebar,
        closeSidebar,
        toggleTheme,
        clearAllFilters,
        updateBadge: (type, count) => {
            const badge = document.getElementById(`ecom${type.charAt(0).toUpperCase() + type.slice(1)}Badge`);
            if (badge) badge.textContent = Math.max(0, count);
        },
        getFilters: () => ({ ...selectedFilters }),
        setData: (data) => {
            if (data.categories) {
                categories = data.categories;
                renderCategories();
            }
            if (data.brands) {
                brands = data.brands;
                renderBrands();
            }
            if (data.priceRanges) {
                priceRanges = data.priceRanges;
                renderPriceRanges();
            }
        },
        isInitialized: () => initialized,
        getVersion: () => '2.1.0'
    };
})();

// Auto-initialize on DOMContentLoaded if element exists
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!EcomSidebar.isInitialized()) {
            EcomSidebar.init();
        }
    });
} else {
    if (!EcomSidebar.isInitialized()) {
        EcomSidebar.init();
    }
}