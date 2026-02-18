// Search and Filter functionality for DBT Documentation Portal

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.filterTags = document.querySelectorAll('.filter-tag');
        this.catalogGrid = document.getElementById('catalogGrid');
        this.cards = document.querySelectorAll('.doc-card');
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        this.init();
    }

    init() {
        console.log('🔍 Initializing SearchManager...');
        this.setupSearch();
        this.setupFilters();
        this.setupKeyboardShortcuts();
        console.log('✅ SearchManager initialized successfully');
    }

    setupSearch() {
        if (!this.searchInput) return;

        // Debounced search to improve performance
        const debouncedSearch = this.debounce((searchTerm) => {
            this.performSearch(searchTerm);
        }, 300);

        this.searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // For very short searches (1 character), show a hint or require more input
            if (searchTerm.length === 1) {
                // Show a subtle hint that more characters are needed for better results
                this.showSearchHint('Type more characters to search project names');
            } else {
                this.hideSearchHint();
            }
            
            this.searchTerm = searchTerm;
            debouncedSearch(searchTerm);
        });

        // Search button click
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(this.searchTerm);
            });
        }

        // Clear search on escape
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }

    setupFilters() {
        this.filterTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const filter = tag.getAttribute('data-filter');
                this.applyFilter(filter);
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }

            // Ctrl/Cmd + / to clear search
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.clearSearch();
            }
        });
    }

    performSearch(searchTerm) {
        this.searchTerm = searchTerm;
        
        if (!searchTerm) {
            this.showAllCards();
            this.updateFilterDisplay();
            return;
        }

        let hasResults = false;
        let visibleCount = 0;
        
        this.cards.forEach(card => {
            const titleElement = card.querySelector('.doc-title');
            const descriptionElement = card.querySelector('.doc-description');
            
            if (!titleElement || !descriptionElement) {
                console.warn('⚠️ Card missing title or description element:', card);
                card.style.display = 'none';
                return;
            }
            
            const title = titleElement.textContent.toLowerCase();
            const category = card.getAttribute('data-category');
            
            // Only search in the title (doc-title) - ignore description and stats
            const matchesTitle = this.matchesSearchTerm(title, searchTerm);
            const matchesFilter = this.currentFilter === 'all' || category === this.currentFilter;
            
            if (matchesTitle && matchesFilter) {
                card.style.display = 'block';
                this.highlightSearchTerm(card, searchTerm, matchesTitle, false);
                hasResults = true;
                visibleCount++;
            } else {
                card.style.display = 'none';
                // Remove highlights from hidden cards
                this.removeHighlights(card);
            }
        });

        console.log(`🔍 Search results: ${visibleCount} cards found for "${searchTerm}" (title-only search)`);
        this.showSearchResults(hasResults, searchTerm);
        this.updateSearchStats();
    }

    // Improved search matching logic - title only, first word priority
    matchesSearchTerm(text, searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const textLower = text.toLowerCase();
        
        // Split text into words
        const words = textLower.split(/\s+/);
        
        // For single character searches, only match the first word
        if (searchTerm.length === 1) {
            return words[0] && words[0].startsWith(searchLower);
        }
        
        // For longer searches, check if search term starts the first word
        return words[0] && words[0].startsWith(searchLower);
    }

    searchInStats(card, searchTerm) {
        const stats = card.querySelectorAll('.stat');
        return Array.from(stats).some(stat => 
            stat.textContent.toLowerCase().includes(searchTerm)
        );
    }

    highlightSearchTerm(card, searchTerm, matchesTitle, matchesDescription) {
        const title = card.querySelector('.doc-title');
        const description = card.querySelector('.doc-description');
        
        // Remove existing highlights first
        this.removeHighlights(card);
        
        // Add highlights only to elements that match
        if (searchTerm && matchesTitle && title) {
            title.classList.add('search-highlight');
            console.log(`✨ Highlighting title: "${title.textContent}" for search term "${searchTerm}"`);
        }
        if (searchTerm && matchesDescription && description) {
            description.classList.add('search-highlight');
            console.log(`✨ Highlighting description for search term "${searchTerm}"`);
        }
    }

    removeHighlights(card) {
        const title = card.querySelector('.doc-title');
        const description = card.querySelector('.doc-description');
        if (title) {
            title.classList.remove('search-highlight');
        }
        if (description) {
            description.classList.remove('search-highlight');
        }
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter tag
        this.filterTags.forEach(tag => {
            tag.classList.remove('active');
            if (tag.getAttribute('data-filter') === filter) {
                tag.classList.add('active');
            }
        });

        // Apply filter to cards
        this.cards.forEach(card => {
            const category = card.getAttribute('data-category');
            const titleElement = card.querySelector('.doc-title');
            const descriptionElement = card.querySelector('.doc-description');
            const lastUpdated = card.getAttribute('data-updated');
            
            if (!titleElement || !descriptionElement) {
                card.style.display = 'none';
                return;
            }
            
            const title = titleElement.textContent.toLowerCase();
            
            // Only search in the title (doc-title) - ignore description and stats
            const matchesSearch = !this.searchTerm || 
                                this.matchesSearchTerm(title, this.searchTerm);
            
            let matchesFilter = filter === 'all' || category === filter;
            
            // Handle "Recently Updated" filter
            if (filter === 'recent' && lastUpdated) {
                const hours = this.parseTimeString(lastUpdated);
                matchesFilter = hours <= 24; // Show cards updated within 24 hours
            }
            
            if (matchesSearch && matchesFilter) {
                card.style.display = 'block';
                // Re-apply highlighting if there's an active search
                if (this.searchTerm) {
                    const matchesTitle = this.matchesSearchTerm(title, this.searchTerm);
                    this.highlightSearchTerm(card, this.searchTerm, matchesTitle, false);
                }
            } else {
                card.style.display = 'none';
                this.removeHighlights(card);
            }
        });

        this.updateFilterStats();
    }

    showAllCards() {
        this.cards.forEach(card => {
            card.style.display = 'block';
            // Remove highlights
            this.removeHighlights(card);
        });
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.searchTerm = '';
        this.showAllCards();
        this.updateFilterDisplay();
        this.hideSearchResults();
        this.hideSearchHint();
    }

    showSearchResults(hasResults, searchTerm) {
        // Remove existing result message
        this.hideSearchResults();
        
        if (!hasResults && searchTerm) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <div class="no-results-content">
                    <div class="no-results-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>No projects match "<strong>${this.escapeHtml(searchTerm)}</strong>"</p>
                    <button class="clear-search-btn" onclick="window.searchManager.clearSearch()">
                        Clear search
                    </button>
                </div>
            `;
            
            noResults.style.cssText = `
                text-align: center;
                padding: 60px 20px;
                color: var(--text-secondary);
            `;
            
            this.catalogGrid.appendChild(noResults);
        }
    }

    hideSearchResults() {
        const noResults = document.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }
    }

    showSearchHint(message) {
        this.hideSearchHint();
        
        const hint = document.createElement('div');
        hint.className = 'search-hint';
        hint.innerHTML = `
            <div class="search-hint-content">
                <span>💡 ${message}</span>
            </div>
        `;
        
        hint.style.cssText = `
            text-align: center;
            padding: 10px 20px;
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-style: italic;
            opacity: 0.8;
        `;
        
        this.catalogGrid.appendChild(hint);
    }

    hideSearchHint() {
        const hint = document.querySelector('.search-hint');
        if (hint) {
            hint.remove();
        }
    }

    updateSearchStats() {
        const visibleCards = Array.from(this.cards).filter(card => 
            card.style.display !== 'none'
        );
        
        // Update search stats if they exist
        const searchStats = document.querySelector('.search-stats');
        if (searchStats) {
            searchStats.textContent = `${visibleCards.length} of ${this.cards.length} projects`;
        }
    }

    updateFilterStats() {
        const visibleCards = Array.from(this.cards).filter(card => 
            card.style.display !== 'none'
        );
        
        // Update filter stats if they exist
        const filterStats = document.querySelector('.filter-stats');
        if (filterStats) {
            const filterName = this.currentFilter === 'all' ? 'All' : 
                             this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1);
            filterStats.textContent = `${filterName}: ${visibleCards.length} projects`;
        }
    }

    updateFilterDisplay() {
        // Reset filter display when search is cleared
        this.filterTags.forEach(tag => {
            if (tag.getAttribute('data-filter') === 'all') {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
        this.currentFilter = 'all';
    }

    // Advanced search features
    performAdvancedSearch(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        this.cards.forEach(card => {
            const title = card.querySelector('.doc-title').textContent.toLowerCase();
            const description = card.querySelector('.doc-description').textContent.toLowerCase();
            const category = card.getAttribute('data-category');
            const updated = card.getAttribute('data-updated');
            
            // Check if all search terms are found
            const allTermsFound = searchTerms.every(term => 
                title.includes(term) || 
                description.includes(term) ||
                category.includes(term) ||
                updated.includes(term)
            );
            
            const matchesFilter = this.currentFilter === 'all' || category === this.currentFilter;
            
            if (allTermsFound && matchesFilter) {
                card.style.display = 'block';
                this.highlightMultipleTerms(card, searchTerms);
            } else {
                card.style.display = 'none';
            }
        });
    }

    highlightMultipleTerms(card, searchTerms) {
        const title = card.querySelector('.doc-title');
        const description = card.querySelector('.doc-description');
        
        // Remove existing highlights
        title.classList.remove('search-highlight');
        description.classList.remove('search-highlight');
        
        // Add highlights for all terms
        searchTerms.forEach(term => {
            const highlightRegex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
            title.innerHTML = title.innerHTML.replace(highlightRegex, '<mark>$1</mark>');
            description.innerHTML = description.innerHTML.replace(highlightRegex, '<mark>$1</mark>');
        });
    }

    // Search suggestions
    getSearchSuggestions(query) {
        if (!query || query.length < 2) return [];
        
        const suggestions = new Set();
        const queryLower = query.toLowerCase();
        
        this.cards.forEach(card => {
            const title = card.querySelector('.doc-title').textContent;
            const description = card.querySelector('.doc-description').textContent;
            
            // Find words that start with the query
            const words = [...title.split(' '), ...description.split(' ')];
            words.forEach(word => {
                if (word.toLowerCase().startsWith(queryLower) && word.length > 2) {
                    suggestions.add(word);
                }
            });
        });
        
        return Array.from(suggestions).slice(0, 5);
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

    parseTimeString(timeStr) {
        if (!timeStr) return 0;
        const hours = parseInt(timeStr.replace('h', ''));
        return hours || 0;
    }

    // Export search results
    exportSearchResults() {
        const visibleCards = Array.from(this.cards).filter(card => 
            card.style.display !== 'none'
        );
        
        const results = visibleCards.map(card => ({
            title: card.querySelector('.doc-title').textContent,
            description: card.querySelector('.doc-description').textContent,
            category: card.getAttribute('data-category'),
            updated: card.getAttribute('data-updated'),
            url: card.getAttribute('data-url')
        }));
        
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dbt-search-results-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Refresh cards reference when cards are dynamically updated
    refreshCards() {
        const oldCount = this.cards.length;
        this.cards = document.querySelectorAll('.doc-card');
        const newCount = this.cards.length;
        
        console.log(`🔄 Search cards refreshed: ${oldCount} → ${newCount} cards`);
        
        // Validate that we have the expected elements
        this.cards.forEach((card, index) => {
            const title = card.querySelector('.doc-title');
            const description = card.querySelector('.doc-description');
            
            if (!title || !description) {
                console.warn(`⚠️ Card ${index} missing title or description:`, card);
            }
        });
        
        // Re-apply current search and filter if any
        if (this.searchTerm) {
            console.log('🔄 Re-applying search term:', this.searchTerm);
            this.performSearch(this.searchTerm);
        }
        if (this.currentFilter !== 'all') {
            console.log('🔄 Re-applying filter:', this.currentFilter);
            this.applyFilter(this.currentFilter);
        }
    }
}

// Initialize search manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
    console.log('🔍 SearchManager initialized');
}); 