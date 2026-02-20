// Load shared header and footer components
(function() {
    // Get current page name
    function getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page;
    }

    // Load header
    async function loadHeader() {
        try {
            const response = await fetch('/header.html');
            const html = await response.text();
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.outerHTML = html;
                
                // Set active navigation link
                const currentPage = getCurrentPage();
                const navLinks = document.querySelectorAll('.nav-menu a[data-page], .nav-links a[data-page]');
                navLinks.forEach(link => {
                    if (link.getAttribute('data-page') === currentPage) {
                        link.classList.add('active');
                    }
                });
                
                // Re-initialize any header scripts after loading
                if (typeof initializeHeader === 'function') {
                    initializeHeader();
                }
                
                // Dispatch custom event to notify that header is loaded
                window.dispatchEvent(new CustomEvent('headerLoaded'));
            }
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }

    // Load footer
    async function loadFooter() {
        try {
            const response = await fetch('/footer.html');
            const html = await response.text();
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.outerHTML = html;
            }
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    // Load components when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadHeader();
            loadFooter();
        });
    } else {
        loadHeader();
        loadFooter();
    }
})();
