// DBT Model Analyzer Chat Interface

class DBTAnalyzer {
    constructor() {
        this.apiBase = '/api';
        this.conversationHistory = [];
        this.currentProject = null;
        this.init();
    }

    init() {
        this.loadProjects();
        this.setupEventListeners();
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
        const clearBtn = document.getElementById('clearBtn');

        projectSelect.addEventListener('change', (e) => {
            this.currentProject = e.target.value;
            if (this.currentProject) {
                chatInput.disabled = false;
                sendBtn.disabled = false;
                this.clearConversation();
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

        clearBtn.addEventListener('click', () => this.clearConversation());
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message || !this.currentProject) return;
        
        // Clear input
        chatInput.value = '';
        
        // Hide empty state
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Add user message to UI
        this.addMessage('user', message);
        
        // Show loading indicator
        this.showLoading();
        
        // Send to backend
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
            
            // Remove loading indicator
            this.removeLoading();
            
            if (data.error) {
                this.showError(data.error);
                return;
            }
            
            // Add assistant response to UI
            this.addMessage('assistant', data.response);
            
            // Update conversation history
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
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        // Format content (handle code blocks, etc.)
        messageDiv.innerHTML = this.formatMessage(content);
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Simple markdown-like formatting
        // Handle code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        
        // Handle inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Handle line breaks
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    showLoading() {
        const messagesContainer = document.getElementById('chatMessages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(loadingDiv);
        this.scrollToBottom();
    }

    removeLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.remove();
        }
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
                <div>
                    <p>👋 בחר פרויקט למעלה והתחל לשאול שאלות!</p>
                    <p style="font-size: 14px; margin-top: 10px;">
                        דוגמה: "אילו מודלים תלויים בטבלת הלקוחות?"
                    </p>
                </div>
            </div>
        `;
    }

    showError(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        messagesContainer.appendChild(errorDiv);
        this.scrollToBottom();
        
        // Remove error after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DBTAnalyzer();
});
