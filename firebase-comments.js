/* ==================================================
   OCTOPÉDIA — Sistema de Comentários em Tempo Real
   Firestore + JavaScript
   ================================================== */

class FirebaseCommentsManager {
    constructor() {
        this.currentPageId = null;
        this.commentsListener = null;
    }

    // Adicionar comentário
    async addComment(pageId, text) {
        if (!firebaseAuthManager.currentUser) {
            alert('Você precisa estar logado para comentar!');
            openFirebaseLoginModal();
            return false;
        }

        try {
            await db.collection('comments').add({
                pageId: pageId,
                userId: firebaseAuthManager.currentUser.uid,
                author: firebaseAuthManager.currentUser.displayName || firebaseAuthManager.currentUser.email,
                photoURL: firebaseAuthManager.currentUser.photoURL || null,
                text: text,
                timestamp: new Date(),
                likes: 0,
                liked: []
            });
            console.log('✅ Comentário adicionado!');
            return true;
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            alert('Erro ao publicar comentário');
            return false;
        }
    }

    // Carregar comentários em tempo real
    loadComments(pageId, callback) {
        if (this.commentsListener) {
            this.commentsListener();
        }

        this.currentPageId = pageId;

        this.commentsListener = db.collection('comments')
            .where('pageId', '==', pageId)
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const comments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(comments);
            });
    }

    // Dar like em comentário
    async likeComment(commentId) {
        if (!firebaseAuthManager.currentUser) {
            alert('Você precisa estar logado!');
            return;
        }

        try {
            const commentRef = db.collection('comments').doc(commentId);
            const commentSnap = await commentRef.get();
            const liked = commentSnap.data().liked || [];
            const userId = firebaseAuthManager.currentUser.uid;

            if (liked.includes(userId)) {
                // Remover like
                await commentRef.update({
                    likes: firebase.firestore.FieldValue.increment(-1),
                    liked: firebase.firestore.FieldValue.arrayRemove(userId)
                });
            } else {
                // Adicionar like
                await commentRef.update({
                    likes: firebase.firestore.FieldValue.increment(1),
                    liked: firebase.firestore.FieldValue.arrayUnion(userId)
                });
            }
        } catch (error) {
            console.error('Erro ao dar like:', error);
        }
    }

    // Deletar comentário (apenas do autor)
    async deleteComment(commentId) {
        try {
            const commentRef = db.collection('comments').doc(commentId);
            const commentSnap = await commentRef.get();

            if (commentSnap.data().userId !== firebaseAuthManager.currentUser.uid) {
                alert('Você só pode deletar seus próprios comentários!');
                return;
            }

            await commentRef.delete();
            console.log('✅ Comentário deletado!');
        } catch (error) {
            console.error('Erro ao deletar comentário:', error);
        }
    }
}

const firebaseCommentsManager = new FirebaseCommentsManager();

// Inicializar seção de comentários
function initFirebaseCommentsSection(pageId, pageTitle) {
    const commentsHTML = `
        <div class="comments-section" style="margin-top: 40px; padding: 25px; background: rgba(32, 201, 201, 0.08); border-radius: 18px; border: 1px solid rgba(32, 201, 201, .2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #0c5460;">💬 Comentários da Comunidade</h3>
            </div>

            ${firebaseAuthManager.currentUser ? `
                <form onsubmit="submitFirebaseComment(event, '${pageId}')" style="margin-bottom: 20px;">
                    <textarea id="firebase-comment-input-${pageId}" placeholder="Compartilhe sua opinião sobre este artigo..." style="min-height: 100px; width: 100%;" required></textarea>
                    <button type="submit" style="width: 100%; margin-top: 10px;">📤 Publicar Comentário</button>
                </form>
            ` : `
                <p style="text-align: center; color: #666; padding: 20px; background: rgba(255, 255, 255, 0.6); border-radius: 12px;">
                    <a href="javascript:openFirebaseLoginModal()" style="color: #0084a3; font-weight: 600; text-decoration: none;">Faça login</a> para comentar! 🎮
                </p>
            `}

            <div id="firebase-comments-list-${pageId}" style="margin-top: 20px;">
                <p style="text-align: center; color: #999;">Carregando comentários...</p>
            </div>
        </div>
    `;

    const container = document.querySelector('main');
    if (container) {
        container.insertAdjacentHTML('beforeend', commentsHTML);
        
        // Carregar comentários em tempo real
        firebaseCommentsManager.loadComments(pageId, (comments) => {
            renderFirebaseComments(pageId, comments);
        });
    }
}

function renderFirebaseComments(pageId, comments) {
    const container = document.getElementById(`firebase-comments-list-${pageId}`);

    if (comments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhum comentário ainda. Seja o primeiro! 🚀</p>';
        return;
    }

    container.innerHTML = comments.map(comment => {
        const date = new Date(comment.timestamp.toDate ? comment.timestamp.toDate() : comment.timestamp);
        const isAuthor = firebaseAuthManager.currentUser && firebaseAuthManager.currentUser.uid === comment.userId;
        const isLiked = firebaseAuthManager.currentUser && comment.liked && comment.liked.includes(firebaseAuthManager.currentUser.uid);

        return `
            <div style="padding: 15px; background: rgba(255, 255, 255, 0.7); border-radius: 12px; margin-bottom: 12px; border-left: 4px solid rgba(32, 201, 201, 0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${comment.photoURL ? 
                            `<img src="${comment.photoURL}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` :
                            `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #0084a3, #20c9c9); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${comment.author.charAt(0).toUpperCase()}</div>`
                        }
                        <strong style="color: #0c5460;">${comment.author}</strong>
                    </div>
                    <span style="font-size: 0.85em; color: #999;">${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                </div>
                <p style="margin: 8px 0; color: #333;">${escapeHtml(comment.text)}</p>
                <div style="display: flex; gap: 15px; margin-top: 10px;">
                    <button onclick="firebaseCommentsManager.likeComment('${comment.id}')" style="background: none; border: none; color: ${isLiked ? '#ff6b6b' : '#0084a3'}; cursor: pointer; font-size: 0.9em; font-weight: 600;">
                        ${isLiked ? '❤️' : '🤍'} Útil (${comment.likes || 0})
                    </button>
                    ${isAuthor ? `
                        <button onclick="firebaseCommentsManager.deleteComment('${comment.id}')" style="background: none; border: none; color: #999; cursor: pointer; font-size: 0.9em;">🗑️ Deletar</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function submitFirebaseComment(event, pageId) {
    event.preventDefault();
    const input = document.getElementById(`firebase-comment-input-${pageId}`);
    const text = input.value.trim();

    if (text) {
        firebaseCommentsManager.addComment(pageId, text).then(success => {
            if (success) {
                input.value = '';
            }
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
