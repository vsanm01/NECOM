/**
 * Sidebar Toggle Component
 * A lightweight, reusable sidebar component with toggle functionality
 * Can be used across multiple projects via CDN
 * 
 * Usage:
 * 1. Link the CSS file in your HTML head
 * 2. Include this script before closing body tag
 * 3. Initialize with: new Sidebar('#sidebar-id', options)
 */

class Sidebar {
    constructor(sidebarSelector, options = {}) {
        // Default options
        this.options = {
            toggleBtnSelector: options.toggleBtnSelector || '.sidebar-toggle',
            closeBtnSelector: options.closeBtnSelector || '.sidebar-close',
            overlaySelector: options.overlaySelector || '.sidebar-overlay',
            activeClass: options.activeClass || 'active',
            animationDuration: options.animationDuration || 300,
            closeOnOverlayClick: options.closeOnOverlayClick !== false,
            closeOnEscapeKey: options.closeOnEscapeKey !== false,
            onOpen: options.onOpen || null,
            onClose: options.onClose || null,
            breakpoint: options.breakpoint || 768 // Mobile breakpoint
        };

        // Get sidebar element
        this.sidebar = document.querySelector(sidebarSelector);
        if (!this.sidebar) {
            console.warn(`Sidebar: Element "${sidebarSelector}" not found`);
            return;
        }

        this.isOpen = false;
        this.init();
    }

    /**
     * Initialize sidebar event listeners
     */
    init() {
        // Find toggle button
        const toggleBtn = document.querySelector(this.options.toggleBtnSelector);
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Find close button
        const closeBtn = this.sidebar.querySelector(this.options.closeBtnSelector);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Find overlay
        const overlay = document.querySelector(this.options.overlaySelector);
        if (overlay && this.options.closeOnOverlayClick) {
            overlay.addEventListener('click', () => this.close());
        }

        // Escape key to close
        if (this.options.closeOnEscapeKey) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        // Close sidebar on menu item click
        const menuLinks = this.sidebar.querySelectorAll('a, button');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Check if it's a submenu toggle
                if (!link.classList.contains('submenu-toggle')) {
                    this.close();
                }
            });
        });

        // Handle submenu toggles
        this.initSubmenus();

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Initialize submenu toggles
     */
    initSubmenus() {
        const subMenuToggles = this.sidebar.querySelectorAll('.submenu-toggle');
        subMenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const submenu = toggle.nextElementSibling;
                if (submenu && submenu.classList.contains('submenu')) {
                    submenu.classList.toggle('open');
                    toggle.classList.toggle('open');
                }
            });
        });
    }

    /**
     * Toggle sidebar open/close
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open sidebar
     */
    open() {
        this.sidebar.classList.add(this.options.activeClass);
        const overlay = document.querySelector(this.options.overlaySelector);
        if (overlay) {
            overlay.classList.add(this.options.activeClass);
        }
        this.isOpen = true;
        
        // Prevent body scroll on mobile
        if (window.innerWidth < this.options.breakpoint) {
            document.body.style.overflow = 'hidden';
        }

        // Callback
        if (this.options.onOpen) {
            this.options.onOpen();
        }

        this.triggerEvent('sidebar:open');
    }

    /**
     * Close sidebar
     */
    close() {
        this.sidebar.classList.remove(this.options.activeClass);
        const overlay = document.querySelector(this.options.overlaySelector);
        if (overlay) {
            overlay.classList.remove(this.options.activeClass);
        }
        this.isOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';

        // Callback
        if (this.options.onClose) {
            this.options.onClose();
        }

        this.triggerEvent('sidebar:close');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (window.innerWidth >= this.options.breakpoint && this.isOpen) {
            this.close();
        }
    }

    /**
     * Trigger custom events
     */
    triggerEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { sidebar: this }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current state
     */
    getState() {
        return this.isOpen;
    }

    /**
     * Destroy sidebar instance
     */
    destroy() {
        document.body.style.overflow = '';
        this.sidebar.classList.remove(this.options.activeClass);
        const overlay = document.querySelector(this.options.overlaySelector);
        if (overlay) {
            overlay.classList.remove(this.options.activeClass);
        }
    }
}

// Auto-initialize sidebars with data-sidebar attribute
document.addEventListener('DOMContentLoaded', function() {
    const sidebars = document.querySelectorAll('[data-sidebar]');
    sidebars.forEach(sidebar => {
        new Sidebar(`#${sidebar.id}`);
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
}
