// Main JavaScript functionality for DBT Documentation Portal

class DBTPortal {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupCardInteractions();
        this.setupKeyboardNavigation();
        this.updateLastSync();
        this.updateProjectStats();
        this.setupAutoRefresh();
        this.setupAnimations();
    }

    // Navigation functionality
    setupNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Close mobile menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (hamburger && navMenu) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (hamburger && navMenu && !hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

        // Highlight current page in navigation
        this.highlightCurrentPage();
    }

    highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    // Card interactions
    setupCardInteractions() {
        const cards = document.querySelectorAll('.doc-card');
        
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCardClick(card);
            });

            // Add focus styles for accessibility
            card.addEventListener('focus', () => {
                card.style.outline = '2px solid var(--accent-color)';
                card.style.outlineOffset = '2px';
            });

            card.addEventListener('blur', () => {
                card.style.outline = 'none';
            });
        });
    }

    handleCardClick(card) {
        const url = card.getAttribute('data-url');
        if (!url) {
            this.showError('Documentation URL not found. Please contact administrator.');
            return;
        }

        // Add loading state
        this.addLoadingState(card);

        // Simulate loading delay for better UX
        setTimeout(() => {
            try {
                window.open(url, '_blank');
                this.removeLoadingState(card);
            } catch (error) {
                console.error('Error opening documentation:', error);
                this.showError('Failed to open documentation. Please try again.');
                this.removeLoadingState(card);
            }
        }, 300);
    }

    addLoadingState(card) {
        card.style.opacity = '0.7';
        card.style.pointerEvents = 'none';
        
        // Add loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
        `;
        card.appendChild(spinner);
    }

    removeLoadingState(card) {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        
        const spinner = card.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    // Keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const focusedCard = document.querySelector('.doc-card:focus');
            
            if (focusedCard) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleCardClick(focusedCard);
                }
            }

            // Escape key to close mobile menu
            if (e.key === 'Escape') {
                const hamburger = document.querySelector('.hamburger');
                const navMenu = document.querySelector('.nav-menu');
                if (hamburger && navMenu) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            }
        });

        // Make cards focusable
        document.querySelectorAll('.doc-card').forEach(card => {
            card.setAttribute('tabindex', '0');
        });
    }

    // Update last sync time
    updateLastSync() {
        const lastSyncElements = document.querySelectorAll('#lastSync, #lastSyncTime');
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        lastSyncElements.forEach(element => {
            if (element) {
                element.textContent = timeString;
            }
        });
    }

    // Auto refresh functionality
    setupAutoRefresh() {
        // Update sync time every minute
        setInterval(() => {
            this.updateLastSync();
        }, 60000);

        // Refresh page data every 5 minutes (if needed)
        setInterval(() => {
            this.refreshData();
        }, 300000);
    }

    refreshData() {
        // This could be expanded to fetch new data from the server
        console.log('Refreshing data...');
        
        // Update project stats
        this.updateProjectStats();
    }

    updateProjectStats() {
        // Fetch and update project statistics from cards-config.json
        fetch('./static/cards-config.json')
            .then(response => response.json())
            .then(config => {
                const totalProjects = document.getElementById('totalProjects');
                const totalModels = document.getElementById('totalModels');
                
                if (totalProjects) {
                    const currentCount = parseInt(totalProjects.textContent) || 0;
                    const newCount = config.length;
                    this.animateNumber(totalProjects, currentCount, newCount);
                }
                
                if (totalModels) {
                    const currentCount = parseInt(totalModels.textContent) || 0;
                    const newCount = config.reduce((sum, card) => sum + (card.models || 0), 0);
                    this.animateNumber(totalModels, currentCount, newCount);
                }
            })
            .catch(error => {
                console.error('Error updating project stats:', error);
            });
    }

    animateNumber(element, start, end) {
        if (start === end) return;
        
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Animation setup
    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe cards and action items
        document.querySelectorAll('.doc-card, .action-card').forEach(el => {
            observer.observe(el);
        });
    }

    // Error handling
    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⚠️</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(248, 113, 113, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize the portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DBTPortal();
});

// Export for use in other modules
window.DBTPortal = DBTPortal; 