// Dynamic Card Generation System for DBT Documentation Portal

class DynamicCardManager {
    constructor() {
        this.cardsConfig = [];
        this.catalogGrid = document.getElementById('catalogGrid');
        this.init();
    }

    async init() {
        console.log('🚀 Initializing DynamicCardManager...');
        console.log('🔍 Looking for catalogGrid element...');
        console.log('catalogGrid element:', this.catalogGrid);
        
        if (!this.catalogGrid) {
            console.error('❌ catalogGrid element not found! Please ensure the HTML contains an element with id="catalogGrid"');
            return;
        }
        
        await this.loadCardsConfiguration();
        console.log('📊 Cards config loaded:', this.cardsConfig);
        
        this.setupFileWatcher();
        this.renderCards();
        console.log('✅ DynamicCardManager initialized successfully');
    }

    // Load cards configuration from a JSON file or API
    async loadCardsConfiguration() {
        try {
            console.log('📂 Loading cards configuration...');
            // Load from configuration file
            const response = await fetch('./static/cards-config.json');
            if (response.ok) {
                const config = await response.json();
                
                // Validate configuration
                if (Array.isArray(config)) {
                    this.cardsConfig = config.filter(card => {
                        // Validate required fields
                        const isValid = card && 
                                       card.title && 
                                       card.description && 
                                       card.url && 
                                       card.status;
                        
                        if (!isValid) {
                            console.warn('⚠️ Invalid card configuration:', card);
                        }
                        
                        return isValid;
                    });
                    
                    console.log('✅ Loaded configuration with', this.cardsConfig.length, 'valid projects:', this.cardsConfig.map(c => c.title));
                } else {
                    console.error('❌ Invalid configuration format - expected array');
                    this.cardsConfig = [];
                }
            } else {
                console.error('❌ Could not load cards configuration:', response.status, response.statusText);
                this.cardsConfig = [];
            }
        } catch (error) {
            console.error('❌ Error loading cards configuration:', error);
            this.cardsConfig = [];
        }
    }



    // Setup file watcher (simulated - in real implementation, this would be server-side)
    setupFileWatcher() {
        // Check for new files every 30 seconds
        setInterval(() => {
            this.checkForNewFiles();
        }, 30000);

        // Also check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForNewFiles();
            }
        });
    }

    async checkForNewFiles() {
        try {
            const response = await fetch('./static/cards-config.json?' + Date.now());
            if (response.ok) {
                const newConfig = await response.json();
                if (JSON.stringify(newConfig) !== JSON.stringify(this.cardsConfig)) {
                    this.cardsConfig = newConfig;
                    this.renderCards();
                    this.updateProjectStats();
                }
            }
        } catch (error) {
            console.log('No new files detected');
        }
    }

    // Render all cards
    renderCards() {
        console.log('🎨 Rendering cards...');
        console.log('🔍 catalogGrid element:', this.catalogGrid);
        console.log('📊 cardsConfig:', this.cardsConfig);
        
        if (!this.catalogGrid) {
            console.error('❌ catalogGrid element not found!');
            return;
        }

        // Clear existing cards
        this.catalogGrid.innerHTML = '';
        console.log('📋 Rendering', this.cardsConfig.length, 'cards...');

        // Sort cards by priority and last updated
        const sortedCards = this.cardsConfig.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return this.parseTimeString(a.lastUpdated) - this.parseTimeString(b.lastUpdated);
        });

        // Render each card
        sortedCards.forEach((card, index) => {
            console.log(`📄 Creating card ${index + 1}: ${card.title}`);
            const cardElement = this.createCardElement(card);
            if (cardElement) {
                this.catalogGrid.appendChild(cardElement);
            } else {
                console.warn(`⚠️ Skipping invalid card ${index + 1}: ${card.title || 'Unknown'}`);
            }
        });

        // Reinitialize card interactions
        this.setupCardInteractions();
        
        // Reinitialize search functionality after cards are rendered
        this.reinitializeSearch();
        
        console.log('✅ Cards rendered successfully');
    }

    // Create individual card element
    createCardElement(card) {
        // Validate card data
        if (!card || !card.title || !card.description || !card.url) {
            console.error('❌ Invalid card data:', card);
            return null;
        }

        const cardElement = document.createElement('a');
        cardElement.href = '#';
        cardElement.className = 'doc-card';
        cardElement.setAttribute('data-url', card.url);
        cardElement.setAttribute('data-category', card.category || 'active');
        cardElement.setAttribute('data-updated', card.lastUpdated || '1h');
        cardElement.setAttribute('tabindex', '0');

        // Safely escape HTML content
        const safeTitle = this.escapeHtml(card.title);
        const safeDescription = this.escapeHtml(card.description);
        const safeIcon = card.icon || '📊';
        const safeStatus = card.status || 'active';
        const safeLastUpdated = card.lastUpdated || '1h';
        const safeModels = card.models || 0;

        cardElement.innerHTML = `
            <div class="doc-icon">${safeIcon}</div>
            <div class="doc-title">${safeTitle}</div>
            <div class="doc-description">${safeDescription}</div>
            <div class="doc-meta">
                <div class="doc-status status-${safeStatus}">Active</div>
                <div class="external-link">↗</div>
            </div>
            <div class="last-updated">
                <span>🕒</span>
                <span>Updated ${safeLastUpdated} ago</span>
            </div>
            <div class="card-stats">
                <span class="stat">📊 ${safeModels} Models</span>
            </div>
        `;

        return cardElement;
    }

    // Setup card interactions for dynamically created cards
    setupCardInteractions() {
        const cards = document.querySelectorAll('.doc-card');
        
        cards.forEach(card => {
            // Remove existing listeners to prevent duplicates
            card.replaceWith(card.cloneNode(true));
        });

        // Re-select cards after cloning
        const newCards = document.querySelectorAll('.doc-card');
        
        newCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCardClick(card);
            });

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

        this.addLoadingState(card);

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

    // Update project statistics
    updateProjectStats() {
        const totalProjects = document.getElementById('totalProjects');
        const totalModels = document.getElementById('totalModels');
        
        if (totalProjects) {
            const currentCount = parseInt(totalProjects.textContent);
            const newCount = this.cardsConfig.length;
            this.animateNumber(totalProjects, currentCount, newCount);
        }
        
        if (totalModels) {
            const currentCount = parseInt(totalModels.textContent);
            const newCount = this.cardsConfig.reduce((sum, card) => sum + card.models, 0);
            this.animateNumber(totalModels, currentCount, newCount);
        }
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

    // Utility functions
    parseTimeString(timeStr) {
        const hours = parseInt(timeStr.replace('h', ''));
        return hours || 0;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Reinitialize search functionality after cards are rendered
    reinitializeSearch() {
        // Wait a bit for DOM to settle
        setTimeout(() => {
            if (window.searchManager) {
                console.log('🔄 Reinitializing search with new cards...');
                // Update the cards reference in the search manager
                window.searchManager.refreshCards();
                
                // Re-apply current search and filter if any
                if (window.searchManager.searchTerm) {
                    window.searchManager.performSearch(window.searchManager.searchTerm);
                }
                if (window.searchManager.currentFilter !== 'all') {
                    window.searchManager.applyFilter(window.searchManager.currentFilter);
                }
            } else {
                console.warn('⚠️ SearchManager not found, creating new instance');
                // If searchManager doesn't exist, create a new one
                window.searchManager = new SearchManager();
            }
        }, 100);
    }
}

// Initialize dynamic card manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DynamicCardManager();
}); 