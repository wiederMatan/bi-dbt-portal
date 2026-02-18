// Modern DBT Analyzer Chat Interface

class DBTAnalyzer {
    constructor() {
        this.apiBase = '/api';
        this.conversationHistory = [];
        this.currentProject = null;
        this.recentProjects = this.loadRecentProjects();
        this.init();
    }

    init() {
        this.loadProjects();
        this.setupEventListeners();
        this.renderRecentProjects();
    }

    async loadProjects() {
        try {
            const response = await fetch(`${this.apiBase}/projects`);
            const data = await response.json();
            
            if (data.error) {
                this.showError(data.error);
                return;
            }
            
            this.populateProjectSelector(data.projects);
        } catch (error) {
            this.showError('שגיאה בטעינת הפרויקטים. ודא שהשרת פועל.');
            console.error('Error loading projects:', error);
        }
    }

    populateProjectSelector(projects) {
        const select = document.getElementById('projectSelect');
        select.innerHTML = '<option value="">-- בחר פרויקט --</option>';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.name;
            option.textContent = `${project.display_name} (${project.model_count} מודלים)`;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        const projectSelect = document.getElementById('projectSelect');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const newChatBtn = document.getElementById('newChatBtn');
        const menuToggle = document.getElementById('menuToggle');

        projectSelect.addEventListener('change', (e) => {
            this.currentProject = e.target.value;
            if (this.currentProject) {
                chatInput.disabled = false;
                sendBtn.disabled = false;
                this.addToRecentProjects(this.currentProject);
            } else {
                chatInput.disabled = true;
                sendBtn.disabled = true;
            }
        });

        sendBtn.addEventListener('click', () => this.sendMessage());
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        chatInput.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        });

        newChatBtn.addEventListener('click', () => this.clearConversation());

        menuToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Example prompts
        document.querySelectorAll('.example-prompt').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.currentProject) {
                    chatInput.value = btn.textContent;
                    this.sendMessage();
                } else {
                    this.showError('אנא בחר פרויקט תחילה');
                }
            });
        });
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message || !this.currentProject) return;
        
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        this.hideEmptyState();
        this.addMessage('user', message);
        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    project_name: this.currentProject,
                    message: message,
                    conversation_history: this.conversationHistory
                })
            });
            
            const data = await response.json();
            this.removeLoading();
            
            if (data.error) {
                this.showError(data.error);
                return;
            }
            
            this.addMessage('assistant', data.response);
            
            this.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.response }
            );
            
        } catch (error) {
            this.removeLoading();
            this.showError('שגיאה בשליחת ההודעה. נסה שוב.');
            console.error('Error sending message:', error);
        }
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('chatMessages');
        
        if (!messagesContainer.querySelector('.messages-container')) {
            const container = document.createElement('div');
            container.className = 'messages-container';
            messagesContainer.appendChild(container);
        }
        
        const container = messagesContainer.querySelector('.messages-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const icon = document.createElement('div');
        icon.className = 'message-icon';
        icon.textContent = role === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Detect text direction
        const isHebrew = /[\u0590-\u05FF]/.test(content);
        const isEnglish = /[a-zA-Z]/.test(content);
        
        if (isHebrew && !isEnglish) {
            contentDiv.setAttribute('dir', 'rtl');
        } else if (isEnglish && !isHebrew) {
            contentDiv.setAttribute('dir', 'ltr');
        } else {
            contentDiv.setAttribute('dir', 'auto');
        }
        
        contentDiv.innerHTML = this.formatMessage(content);
        
        messageDiv.appendChild(icon);
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
        
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Remove ANSI escape codes and terminal artifacts
        content = content.replace(/\x1b\[[0-9;]*m/g, '');
        content = content.replace(/\d+m>/g, '');
        content = content.replace(/mm/g, '\n');
        
        // Handle code blocks first
        const codeBlocks = [];
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
            return placeholder;
        });
        
        // Handle inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Split into paragraphs
        const paragraphs = content.split(/\n\n+/);
        const formatted = [];
        
        paragraphs.forEach(para => {
            const lines = para.trim().split('\n');
            let inList = false;
            let listItems = [];
            
            lines.forEach(line => {
                const trimmed = line.trim();
                
                // List item
                if (trimmed.match(/^[-•]\s+/)) {
                    if (!inList) {
                        inList = true;
                    }
                    listItems.push(`<li>${trimmed.replace(/^[-•]\s+/, '')}</li>`);
                } else if (trimmed) {
                    // Close list if open
                    if (inList) {
                        formatted.push(`<ul>${listItems.join('')}</ul>`);
                        listItems = [];
                        inList = false;
                    }
                    
                    // Bold headers (lines ending with :)
                    if (trimmed.endsWith(':') && trimmed.length < 50) {
                        formatted.push(`<p><strong>${trimmed}</strong></p>`);
                    } else {
                        formatted.push(`<p>${trimmed}</p>`);
                    }
                }
            });
            
            // Close any open list
            if (inList && listItems.length > 0) {
                formatted.push(`<ul>${listItems.join('')}</ul>`);
            }
        });
        
        // Restore code blocks
        let result = formatted.join('');
        codeBlocks.forEach((block, i) => {
            result = result.replace(`__CODE_BLOCK_${i}__`, block);
        });
        
        return result;
    }

    showLoading() {
        const messagesContainer = document.getElementById('chatMessages');
        const container = messagesContainer.querySelector('.messages-container');
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.id = 'loadingIndicator';
        
        const icon = document.createElement('div');
        icon.className = 'message-icon';
        icon.textContent = '🤖';
        
        const dots = document.createElement('div');
        dots.className = 'loading-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        
        loadingDiv.appendChild(icon);
        loadingDiv.appendChild(dots);
        container.appendChild(loadingDiv);
        
        this.scrollToBottom();
    }

    removeLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.remove();
    }

    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'none';
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    clearConversation() {
        this.conversationHistory = [];
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="empty-state" id="emptyState">
                <div class="empty-icon">💬</div>
                <h2>?שלום! איך אוכל לעזור</h2>
                <p>בחר פרויקט והתחל לשאול שאלות על המודלים שלך</p>
                <div class="example-prompts">
                    <button class="example-prompt">?מהו "הסיפור העסקי" של הפרויקט</button>
                    <button class="example-prompt">?SLA -האם המבנה תומך ב</button>
                    <button class="example-prompt">הצג לי את כל המודלים הסופיים בסכמה</button>
                </div>
            </div>
        `;
        this.setupEventListeners();
    }

    showError(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const container = messagesContainer.querySelector('.messages-container') || messagesContainer;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        container.appendChild(errorDiv);
        
        this.scrollToBottom();
        setTimeout(() => errorDiv.remove(), 5000);
    }

    addToRecentProjects(projectName) {
        if (!this.recentProjects.includes(projectName)) {
            this.recentProjects.unshift(projectName);
            this.recentProjects = this.recentProjects.slice(0, 10);
            this.saveRecentProjects();
            this.renderRecentProjects();
        }
    }

    renderRecentProjects() {
        const recentList = document.getElementById('recentList');
        recentList.innerHTML = '';
        
        this.recentProjects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.textContent = project.replace(/_/g, ' ');
            item.addEventListener('click', () => {
                document.getElementById('projectSelect').value = project;
                this.currentProject = project;
                document.getElementById('chatInput').disabled = false;
                document.getElementById('sendBtn').disabled = false;
            });
            recentList.appendChild(item);
        });
    }

    loadRecentProjects() {
        const saved = localStorage.getItem('dbt_recent_projects');
        return saved ? JSON.parse(saved) : [];
    }

    saveRecentProjects() {
        localStorage.setItem('dbt_recent_projects', JSON.stringify(this.recentProjects));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DBTAnalyzer();
});
