/* ==================================================
   OCTOPÉDIA - WIKIPEDIA DE VIDEOGAMES
   Sistema completo de gerenciamento de acervo digital
   ================================================== */

// ============ CLASSES E ESTRUTURAS ============

class Article {
    constructor(id, title, category, content, tags, author, date) {
        this.id = id || 'art_' + Date.now();
        this.title = title;
        this.category = category;
        this.content = content;
        this.tags = tags || [];
        this.author = author;
        this.date = date || new Date();
        this.likes = 0;
        this.views = 0;
        this.comments = [];
        this.lastEdited = new Date();
        this.editHistory = [];
    }
}

class Collection {
    constructor(id, name, type, quantity, description, owner, image) {
        this.id = id || 'coll_' + Date.now();
        this.name = name;
        this.type = type;
        this.quantity = quantity;
        this.description = description;
        this.owner = owner;
        this.image = image;
        this.date = new Date();
        this.likes = 0;
        this.comments = [];
        this.tags = [];
    }
}

class User {
    constructor(id, username, email) {
        this.id = id || 'user_' + Date.now();
        this.username = username;
        this.email = email;
        this.articles = [];
        this.collections = [];
        this.favorites = [];
        this.joinDate = new Date();
        this.bio = '';
        this.avatar = this.generateAvatar(username);
    }

    generateAvatar(name) {
        return name.charAt(0).toUpperCase();
    }
}

// ============ GERENCIADOR PRINCIPAL ============

class OctopediaManager {
    constructor() {
        this.articles = [];
        this.collections = [];
        this.users = [];
        this.currentUser = null;
        this.comments = [];
        this.favorites = [];
        this.searchFilters = {};
        
        this.loadFromLocalStorage();
        this.initializeUI();
        this.loadSampleData();
    }

    // ============ USUÁRIOS ============

    registerUser(username, email, password) {
        if (this.users.find(u => u.email === email)) {
            alert('Email já registrado!');
            return false;
        }
        
        const user = new User('user_' + Date.now(), username, email);
        this.users.push(user);
        this.currentUser = user;
        this.updateStats();
        this.save();
        return true;
    }

    loginUser(email) {
        const user = this.users.find(u => u.email === email);
        if (user) {
            this.currentUser = user;
            this.updateStats();
            return true;
        }
        return false;
    }

    logoutUser() {
        this.currentUser = null;
        this.updateUI();
    }

    // ============ ARTIGOS ============

    createArticle(title, category, content, tags, author) {
        const article = new Article(
            'art_' + Date.now(),
            title,
            category,
            content,
            tags.split(',').map(t => t.trim()),
            author || this.currentUser?.username || 'Anônimo',
            new Date()
        );
        
        this.articles.push(article);
        if (this.currentUser) {
            this.currentUser.articles.push(article.id);
        }
        
        this.updateStats();
        this.save();
        return article;
    }

    editArticle(articleId, title, category, content, tags) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) return false;

        // Guardar no histórico de edições
        article.editHistory.push({
            timestamp: article.lastEdited,
            content: article.content,
            editor: this.currentUser?.username || 'Anônimo'
        });

        article.title = title;
        article.category = category;
        article.content = content;
        article.tags = tags.split(',').map(t => t.trim());
        article.lastEdited = new Date();

        this.save();
        return true;
    }

    deleteArticle(articleId) {
        const index = this.articles.findIndex(a => a.id === articleId);
        if (index > -1) {
            this.articles.splice(index, 1);
            this.updateStats();
            this.save();
            return true;
        }
        return false;
    }

    getArticle(articleId) {
        return this.articles.find(a => a.id === articleId);
    }

    getAllArticles() {
        return this.articles.sort((a, b) => b.date - a.date);
    }

    getArticlesByCategory(category) {
        return this.articles.filter(a => a.category === category);
    }

    searchArticles(query) {
        const q = query.toLowerCase();
        return this.articles.filter(a => 
            a.title.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q) ||
            a.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    // ============ COLEÇÕES ============

    addCollection(name, type, quantity, description, owner, image) {
        const collection = new Collection(
            'coll_' + Date.now(),
            name,
            type,
            quantity,
            description,
            owner || this.currentUser?.username || 'Anônimo',
            image
        );
        
        this.collections.push(collection);
        if (this.currentUser) {
            this.currentUser.collections.push(collection.id);
        }
        
        this.updateStats();
        this.save();
        return collection;
    }

    getCollection(collectionId) {
        return this.collections.find(c => c.id === collectionId);
    }

    getAllCollections() {
        return this.collections.sort((a, b) => b.date - a.date);
    }

    deleteCollection(collectionId) {
        const index = this.collections.findIndex(c => c.id === collectionId);
        if (index > -1) {
            this.collections.splice(index, 1);
            this.updateStats();
            this.save();
            return true;
        }
        return false;
    }

    // ============ COMENTÁRIOS ============

    addComment(targetId, targetType, text, author) {
        const comment = {
            id: 'com_' + Date.now(),
            targetId: targetId,
            targetType: targetType, // 'article' ou 'collection'
            text: text,
            author: author || this.currentUser?.username || 'Anônimo',
            date: new Date(),
            likes: 0
        };
        
        this.comments.push(comment);
        
        if (targetType === 'article') {
            const article = this.getArticle(targetId);
            if (article) article.comments.push(comment.id);
        } else if (targetType === 'collection') {
            const collection = this.getCollection(targetId);
            if (collection) collection.comments.push(comment.id);
        }
        
        this.updateStats();
        this.save();
        return comment;
    }

    getComments(targetId) {
        return this.comments.filter(c => c.targetId === targetId).sort((a, b) => b.date - a.date);
    }

    deleteComment(commentId) {
        const index = this.comments.findIndex(c => c.id === commentId);
        if (index > -1) {
            this.comments.splice(index, 1);
            this.updateStats();
            this.save();
            return true;
        }
        return false;
    }

    // ============ FAVORITOS ============

    addFavorite(itemId, itemType) {
        if (!this.currentUser) return false;
        
        const favorite = { itemId, itemType, date: new Date() };
        this.currentUser.favorites.push(favorite);
        this.save();
        return true;
    }

    removeFavorite(itemId) {
        if (!this.currentUser) return false;
        
        this.currentUser.favorites = this.currentUser.favorites.filter(f => f.itemId !== itemId);
        this.save();
        return true;
    }

    // ============ LIKES ============

    likeArticle(articleId) {
        const article = this.getArticle(articleId);
        if (article) {
            article.likes++;
            this.save();
            return true;
        }
        return false;
    }

    likeCollection(collectionId) {
        const collection = this.getCollection(collectionId);
        if (collection) {
            collection.likes++;
            this.save();
            return true;
        }
        return false;
    }

    viewArticle(articleId) {
        const article = this.getArticle(articleId);
        if (article) {
            article.views++;
            this.save();
        }
    }

    // ============ PERSISTÊNCIA ============

    save() {
        const data = {
            articles: this.articles,
            collections: this.collections,
            users: this.users,
            comments: this.comments,
            currentUser: this.currentUser
        };
        localStorage.setItem('octopedia_data', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('octopedia_data') || '{}');
        this.articles = data.articles || [];
        this.collections = data.collections || [];
        this.users = data.users || [];
        this.comments = data.comments || [];
        this.currentUser = data.currentUser || null;
    }

    // ============ DADOS EXEMPLARES ============

    loadSampleData() {
        if (this.articles.length > 0) return; // Não recarregar

        // Criar usuário demo
        this.users.push(new User('user_demo', 'Curador Octopédia', 'curador@octopedia.local'));

        // Artigos de exemplo
        const sampleArticles = [
            {
                title: 'PlayStation 2: A Revolução dos Videogames',
                category: 'Consoles',
                content: 'O PlayStation 2 (PS2) é um console de videogame de sexta geração lançado pela Sony em 2000. Tornou-se um dos consoles mais bem-sucedidos da história...'
            },
            {
                title: 'The Legend of Zelda: Ocarina of Time',
                category: 'Jogos',
                content: 'Lançado em 1998 para o Nintendo 64, Ocarina of Time revolucionou os videogames 3D com sua narrativa épica e gameplay inovador...'
            },
            {
                title: 'Nintendo: A Gigante dos Videogames',
                category: 'Desenvolvedoras',
                content: 'Fundada em 1889 como fabricante de cartas de jogo, a Nintendo se tornou a maior empresa de videogames do mundo...'
            }
        ];

        sampleArticles.forEach(art => {
            this.createArticle(
                art.title,
                art.category,
                art.content,
                art.category,
                'Curador Octopédia'
            );
        });

        // Coleções de exemplo
        this.addCollection(
            'Meu Acervo de PS2 Clássicos',
            'Jogos',
            12,
            'Uma seleção dos melhores RPGs e aventuras do PlayStation 2...',
            'Curador Octopédia',
            null
        );

        this.addCollection(
            'Consoles Vintage da Minha Infância',
            'Consoles',
            5,
            'Sega Genesis, Super Nintendo, Nintendo 64 e outros clássicos...',
            'Curador Octopédia',
            null
        );
    }

    // ============ ESTATÍSTICAS ============

    updateStats() {
        const stats = {
            articles: this.articles.length,
            contributors: this.users.length,
            comments: this.comments.length,
            collections: this.collections.length
        };

        document.getElementById('statsArticles').textContent = stats.articles;
        document.getElementById('statsContributors').textContent = stats.contributors;
        document.getElementById('statsComments').textContent = stats.comments;
        document.getElementById('statsCollections').textContent = stats.collections;
    }

    // ============ INTERFACE ============

    initializeUI() {
        this.updateStats();
        this.renderArticles();
        this.renderCollections();
        this.updateUserUI();
    }

    updateUserUI() {
        const userSection = document.querySelector('.user-section');
        if (!userSection) return;

        userSection.innerHTML = '';

        if (this.currentUser) {
            userSection.innerHTML = `
                <div class="user-profile" style="display: flex; align-items: center; gap: 10px; padding: 8px 15px; background: rgba(32, 201, 201, 0.15); border-radius: 20px; border: 1px solid rgba(32, 201, 201, 0.3);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #0084a3, #20c9c9); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${this.currentUser.avatar}</div>
                    <span style="color: #0c5460; font-weight: 600;">${this.currentUser.username}</span>
                    <button onclick="octopedia.logoutUser()" style="padding: 6px 12px; border-radius: 12px; border: none; background: #ff6b6b; color: white; cursor: pointer; font-weight: 600; font-size: 0.85em;">Sair</button>
                </div>
            `;
        } else {
            userSection.innerHTML = `
                <button onclick="openModal('login-modal')" style="padding: 10px 20px; border-radius: 20px; border: 2px solid #20c9c9; background: transparent; color: #0c5460; cursor: pointer; font-weight: 600;">👤 Login/Cadastro</button>
            `;
        }
    }

    renderArticles() {
        const grid = document.getElementById('articlesGrid');
        const articles = this.getAllArticles().slice(0, 6);

        grid.innerHTML = articles.map(article => `
            <div class="card" style="cursor: pointer; transition: all 0.3s;" onclick="openArticleDetail('${article.id}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <span class="badge" style="background: rgba(32, 201, 201, 0.3); color: #0c5460;">${article.category}</span>
                    <span style="font-size: 0.85em; color: #999;">${article.date.toLocaleDateString('pt-BR')}</span>
                </div>
                <h3 style="margin: 10px 0; color: #0c5460;">${article.title}</h3>
                <p style="color: #666; margin: 10px 0; line-height: 1.5;">${article.content.substring(0, 150)}...</p>
                <div style="display: flex; gap: 15px; margin-top: 15px; font-size: 0.9em; color: #999;">
                    <span>👁️ ${article.views} visualizações</span>
                    <span>❤️ ${article.likes} gostaram</span>
                    <span>💬 ${article.comments.length} comentários</span>
                </div>
                <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 10px;">
                    ${article.tags.map(tag => `<span style="background: rgba(0, 132, 163, 0.15); color: #0084a3; padding: 3px 8px; border-radius: 8px; font-size: 0.8em;">#${tag}</span>`).join('')}
                </div>
                <p style="color: #999; font-size: 0.85em; margin-top: 10px;">por <strong>${article.author}</strong></p>
            </div>
        `).join('');
    }

    renderCollections() {
        const grid = document.getElementById('collectionsGrid');
        const collections = this.getAllCollections().slice(0, 6);

        grid.innerHTML = collections.map(coll => `
            <div class="card" style="cursor: pointer; transition: all 0.3s;" onclick="openCollectionDetail('${coll.id}')">
                <div style="background: linear-gradient(135deg, rgba(32, 201, 201, 0.2), rgba(0, 132, 163, 0.1)); padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 15px;">
                    <span style="font-size: 3em;">${getCategoryEmoji(coll.type)}</span>
                </div>
                <h3 style="margin: 10px 0; color: #0c5460;">${coll.name}</h3>
                <p style="color: #999; font-size: 0.9em; margin: 5px 0;">Tipo: ${coll.type}</p>
                <p style="color: #0c5460; font-weight: bold; margin: 5px 0;">📦 ${coll.quantity} itens</p>
                <p style="color: #666; margin: 10px 0; line-height: 1.5;">${coll.description.substring(0, 100)}...</p>
                <div style="display: flex; gap: 15px; margin-top: 15px; font-size: 0.9em; color: #999;">
                    <span>❤️ ${coll.likes}</span>
                    <span>💬 ${coll.comments.length}</span>
                </div>
                <p style="color: #999; font-size: 0.85em; margin-top: 10px;">por <strong>${coll.owner}</strong></p>
            </div>
        `).join('');
    }
}

// ============ INSTÂNCIA GLOBAL ============
const octopedia = new OctopediaManager();

// ============ FUNÇÕES DE INTERFACE ============

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

function saveArticle(event) {
    event.preventDefault();
    
    if (!octopedia.currentUser) {
        alert('Você precisa estar logado para criar um artigo!');
        closeModal('contribuir-modal');
        openModal('login-modal');
        return;
    }

    const title = document.getElementById('artTitle').value;
    const category = document.getElementById('artCategory').value;
    const content = document.getElementById('artContent').value;
    const tags = document.getElementById('artTags').value;

    octopedia.createArticle(title, category, content, tags, octopedia.currentUser.username);
    alert('Artigo publicado com sucesso! 🎉');
    
    document.getElementById('articleForm').reset();
    closeModal('contribuir-modal');
    octopedia.renderArticles();
}

function saveCollection(event) {
    event.preventDefault();
    
    if (!octopedia.currentUser) {
        alert('Você precisa estar logado para compartilhar uma coleção!');
        closeModal('colecoes-modal');
        openModal('login-modal');
        return;
    }

    const name = document.getElementById('collName').value;
    const type = document.getElementById('collType').value;
    const quantity = parseInt(document.getElementById('collQuantity').value);
    const description = document.getElementById('collDescription').value;

    octopedia.addCollection(name, type, quantity, description, octopedia.currentUser.username, null);
    alert('Coleção compartilhada com sucesso! 🎪');
    
    document.getElementById('collectionForm').reset();
    closeModal('colecoes-modal');
    octopedia.renderCollections();
}

function handleLocalLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const username = email.split('@')[0];

    let user = octopedia.users.find(u => u.email === email);
    if (!user) {
        octopedia.registerUser(username, email, 'password123');
        alert('Conta criada com sucesso! Bem-vindo à Octopédia! 🎉');
    } else {
        octopedia.currentUser = user;
        alert('Login realizado com sucesso! 🎮');
    }

    closeModal('login-modal');
    octopedia.updateUserUI();
}

function performSearch(query) {
    if (!query.trim()) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }

    const results = octopedia.searchArticles(query);
    const resultsDiv = document.getElementById('searchResults');
    const resultsList = document.getElementById('searchResultsList');

    if (results.length === 0) {
        resultsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Nenhum artigo encontrado</p>';
    } else {
        resultsList.innerHTML = results.map(article => `
            <div class="card" style="cursor: pointer;" onclick="openArticleDetail('${article.id}')">
                <span class="badge">${article.category}</span>
                <h3 style="margin: 10px 0; color: #0c5460;">${article.title}</h3>
                <p style="color: #666;">${article.content.substring(0, 100)}...</p>
            </div>
        `).join('');
    }

    resultsDiv.style.display = 'block';
}

function applyFilters() {
    // Implementar lógica de filtros
}

function clearFilters() {
    document.querySelectorAll('#filtros-modal input[type="checkbox"]').forEach(cb => cb.checked = false);
    applyFilters();
}

function openArticleDetail(articleId) {
    const article = octopedia.getArticle(articleId);
    if (!article) return;

    octopedia.viewArticle(articleId);

    const comments = octopedia.getComments(articleId);
    const content = `
        <h2>${article.title}</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 15px 0; padding-bottom: 15px; border-bottom: 1px solid #eee;">
            <div>
                <p style="margin: 0; color: #999; font-size: 0.9em;">por <strong>${article.author}</strong></p>
                <p style="margin: 0; color: #999; font-size: 0.85em;">${article.date.toLocaleDateString('pt-BR')} • ${article.views} visualizações</p>
            </div>
            <div style="display: flex; gap: 15px;">
                <button onclick="octopedia.likeArticle('${article.id}'); alert('Você gostou! ❤️'); openArticleDetail('${article.id}');" style="padding: 8px 15px; border-radius: 8px; border: none; background: rgba(255, 107, 107, 0.2); color: #ff6b6b; cursor: pointer; font-weight: 600;">❤️ ${article.likes}</button>
                <button onclick="alert('Favorito adicionado! ⭐')" style="padding: 8px 15px; border-radius: 8px; border: none; background: rgba(255, 193, 7, 0.2); color: #ffc107; cursor: pointer; font-weight: 600;">⭐ Favoritar</button>
            </div>
        </div>
        <div style="background: rgba(32, 201, 201, 0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0c5460; margin-top: 0;">Conteúdo</h3>
            <p>${article.content}</p>
            ${article.editHistory.length > 0 ? `<p style="color: #999; font-size: 0.85em;">Última edição: ${article.lastEdited.toLocaleDateString('pt-BR')}</p>` : ''}
        </div>
        <div style="margin: 20px 0;">
            <h4 style="color: #0c5460; margin-bottom: 10px;">Tags</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${article.tags.map(tag => `<span style="background: rgba(0, 132, 163, 0.15); color: #0084a3; padding: 5px 12px; border-radius: 8px; font-size: 0.9em;">#${tag}</span>`).join('')}
            </div>
        </div>
        <div style="margin-top: 30px;">
            <h3 style="color: #0c5460;">💬 Comentários (${comments.length})</h3>
            ${octopedia.currentUser ? `
                <form onsubmit="addCommentToArticle(event, '${articleId}')" style="margin-bottom: 20px;">
                    <textarea placeholder="Deixe um comentário..." id="commentText" required style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; min-height: 80px;"></textarea>
                    <button type="submit" style="margin-top: 10px; padding: 10px 20px; border-radius: 8px; border: none; background: #20c9c9; color: white; cursor: pointer; font-weight: 600;">Comentar</button>
                </form>
            ` : `<p style="color: #999; padding: 15px; background: rgba(0, 0, 0, 0.02); border-radius: 8px;"><a href="javascript:openModal('login-modal')" style="color: #0084a3; text-decoration: none; font-weight: 600;">Faça login</a> para comentar</p>`}
            <div style="display: grid; gap: 12px;">
                ${comments.map(comment => `
                    <div style="padding: 12px; background: rgba(32, 201, 201, 0.05); border-radius: 8px; border-left: 3px solid #20c9c9;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong style="color: #0c5460;">${comment.author}</strong>
                            <span style="color: #999; font-size: 0.85em;">${comment.date.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p style="margin: 8px 0; color: #333;">${escapeHtml(comment.text)}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('articleDetailContent').innerHTML = content;
    openModal('article-detail-modal');
}

function openCollectionDetail(collectionId) {
    const collection = octopedia.getCollection(collectionId);
    if (!collection) return;

    const comments = octopedia.getComments(collectionId);
    const content = `
        <h2>${collection.name}</h2>
        <div style="background: linear-gradient(135deg, rgba(32, 201, 201, 0.2), rgba(0, 132, 163, 0.1)); padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 5em;">${getCategoryEmoji(collection.type)}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
            <div style="padding: 15px; background: rgba(32, 201, 201, 0.1); border-radius: 8px;">
                <p style="margin: 0; color: #999; font-size: 0.9em;">Tipo</p>
                <p style="margin: 5px 0; color: #0c5460; font-weight: bold;">${collection.type}</p>
            </div>
            <div style="padding: 15px; background: rgba(32, 201, 201, 0.1); border-radius: 8px;">
                <p style="margin: 0; color: #999; font-size: 0.9em;">Quantidade</p>
                <p style="margin: 5px 0; color: #0c5460; font-weight: bold;">📦 ${collection.quantity} itens</p>
            </div>
            <div style="padding: 15px; background: rgba(32, 201, 201, 0.1); border-radius: 8px; grid-column: 1/-1;">
                <p style="margin: 0; color: #999; font-size: 0.9em;">Proprietário</p>
                <p style="margin: 5px 0; color: #0c5460; font-weight: bold;">${collection.owner}</p>
            </div>
        </div>
        <div style="background: rgba(32, 201, 201, 0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0c5460; margin-top: 0;">Descrição</h3>
            <p>${collection.description}</p>
            <p style="color: #999; font-size: 0.85em;">Compartilhado em ${collection.date.toLocaleDateString('pt-BR')}</p>
        </div>
        <div style="display: flex; gap: 15px; margin: 20px 0;">
            <button onclick="octopedia.likeCollection('${collection.id}'); alert('Você gostou! ❤️'); openCollectionDetail('${collection.id}');" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: rgba(255, 107, 107, 0.2); color: #ff6b6b; cursor: pointer; font-weight: 600;">❤️ ${collection.likes}</button>
            <button onclick="alert('Adicionado aos favoritos! ⭐')" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: rgba(255, 193, 7, 0.2); color: #ffc107; cursor: pointer; font-weight: 600;">⭐ Favoritar</button>
        </div>
        <div style="margin-top: 30px;">
            <h3 style="color: #0c5460;">💬 Comentários (${comments.length})</h3>
            ${octopedia.currentUser ? `
                <form onsubmit="addCommentToCollection(event, '${collectionId}')" style="margin-bottom: 20px;">
                    <textarea placeholder="Deixe um comentário..." id="collectionCommentText" required style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; min-height: 80px;"></textarea>
                    <button type="submit" style="margin-top: 10px; padding: 10px 20px; border-radius: 8px; border: none; background: #20c9c9; color: white; cursor: pointer; font-weight: 600;">Comentar</button>
                </form>
            ` : `<p style="color: #999; padding: 15px; background: rgba(0, 0, 0, 0.02); border-radius: 8px;"><a href="javascript:openModal('login-modal')" style="color: #0084a3; text-decoration: none; font-weight: 600;">Faça login</a> para comentar</p>`}
            <div style="display: grid; gap: 12px;">
                ${comments.map(comment => `
                    <div style="padding: 12px; background: rgba(32, 201, 201, 0.05); border-radius: 8px; border-left: 3px solid #20c9c9;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong style="color: #0c5460;">${comment.author}</strong>
                            <span style="color: #999; font-size: 0.85em;">${comment.date.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p style="margin: 8px 0; color: #333;">${escapeHtml(comment.text)}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('articleDetailContent').innerHTML = content;
    openModal('article-detail-modal');
}

function addCommentToArticle(event, articleId) {
    event.preventDefault();
    const text = document.getElementById('commentText').value;
    octopedia.addComment(articleId, 'article', text, octopedia.currentUser.username);
    document.getElementById('commentText').value = '';
    alert('Comentário publicado! 💬');
    openArticleDetail(articleId);
}

function addCommentToCollection(event, collectionId) {
    event.preventDefault();
    const text = document.getElementById('collectionCommentText').value;
    octopedia.addComment(collectionId, 'collection', text, octopedia.currentUser.username);
    document.getElementById('collectionCommentText').value = '';
    alert('Comentário publicado! 💬');
    openCollectionDetail(collectionId);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCategoryEmoji(category) {
    const emojis = {
        'Consoles': '🎮',
        'Jogos': '🕹️',
        'Acessórios': '🎧',
        'Memorabilia': '🏆',
        'Revistas': '📰',
        'Outro': '📦'
    };
    return emojis[category] || '📦';
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('Seção em construção!');
    }
}

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Octopédia inicializada com sucesso!');
    octopedia.initializeUI();
});
