/**
 * ========================================
 * 书籍管理系统 - books.js
 * ========================================
 * 功能：在线添加、查看、编辑、删除已读书籍
 * 存储：localStorage（浏览器本地存储）
 * 
 * 数据结构：
 * {
 *   id: string (时间戳),
 *   title: string,
 *   author: string,
 *   cover: string (封面图片URL或emoji),
 *   rating: number (1-5),
 *   review: string,
 *   date: string (YYYY-MM-DD),
 *   tags: array (标签),
 *   createdAt: string (ISO)
 * }
 * ========================================
 */

// ========================================
// 常量与配置
// ========================================
const BOOKS_STORAGE_KEY = 'zhengxiongwen_books';

// 默认书籍（首次访问时初始化）
const DEFAULT_BOOKS = [
    {
        id: '1719000000001',
        title: '认知天性',
        author: '[美] 彼得·C.布朗 / 亨利·L.勒迪格三世 / 马克·A.麦克丹尼尔',
        cover: '📖',
        rating: 5,
        review: '这本书颠覆了我对学习的认知，让我明白了高效学习的真正方法，特别是关于间隔重复和提取练习的部分，非常实用！',
        date: '2026-06-10',
        tags: ['学习', '认知心理学'],
        createdAt: '2026-06-10T10:00:00.000Z'
    },
    {
        id: '1719000000002',
        title: '待添加',
        author: '等待阅读更多好书',
        cover: '📚',
        rating: 0,
        review: '持续阅读，不断成长。读书是我提升自我的重要方式。',
        date: '2026-06-21',
        tags: [],
        createdAt: '2026-06-21T10:00:00.000Z'
    }
];

// ========================================
// 数据操作
// ========================================

/**
 * 获取所有书籍
 */
function getBooks() {
    const data = localStorage.getItem(BOOKS_STORAGE_KEY);
    if (!data) {
        // 首次访问，初始化默认书籍
        localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
        return [...DEFAULT_BOOKS];
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('书籍数据解析失败:', e);
        return [];
    }
}

/**
 * 保存所有书籍
 */
function saveBooks(books) {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
}

/**
 * 添加书籍
 */
function addBook(book) {
    const books = getBooks();
    const newBook = {
        id: Date.now().toString(),
        title: book.title || '未命名书籍',
        author: book.author || '未知作者',
        cover: book.cover || '📖',
        rating: book.rating || 0,
        review: book.review || '',
        date: book.date || new Date().toISOString().split('T')[0],
        tags: book.tags || [],
        createdAt: new Date().toISOString()
    };
    books.unshift(newBook); // 添加到开头
    saveBooks(books);
    return newBook;
}

/**
 * 更新书籍
 */
function updateBook(id, updates) {
    const books = getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
        books[index] = { ...books[index], ...updates };
        saveBooks(books);
        return books[index];
    }
    return null;
}

/**
 * 删除书籍
 */
function deleteBook(id) {
    const books = getBooks();
    const filtered = books.filter(b => b.id !== id);
    saveBooks(filtered);
}

// ========================================
// 渲染
// ========================================

/**
 * 渲染书籍列表
 */
function renderBooks() {
    const container = document.getElementById('booksList');
    if (!container) return;
    
    const books = getBooks();
    
    container.innerHTML = books.map(book => `
        <div class="book-card" data-id="${book.id}">
            <div class="book-cover">${book.cover}</div>
            <div class="book-info">
                <h3>《${book.title}》</h3>
                <p class="book-author">${book.author}</p>
                ${book.review ? `<p class="book-review">${book.review}</p>` : ''}
                <div class="book-rating" data-rating="${book.rating}">
                    ${[1,2,3,4,5].map(i => 
                        `<i class="${i <= book.rating ? 'fas' : 'far'} fa-star"></i>`
                    ).join('')}
                </div>
                <div class="book-actions">
                    <button class="btn btn-sm btn-outline" onclick="editBook('${book.id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteBook('${book.id}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 生成星级评分HTML
 */
function generateRatingHTML(rating, editable = false) {
    if (editable) {
        return `
            <div class="rating-editor" data-rating="${rating}">
                ${[1,2,3,4,5].map(i => 
                    `<span class="star ${i <= rating ? 'active' : ''}" data-value="${i}">★</span>`
                ).join('')}
            </div>
        `;
    }
    return `
        <div class="book-rating">
            ${[1,2,3,4,5].map(i => 
                `<i class="${i <= rating ? 'fas' : 'far'} fa-star"></i>`
            ).join('')}
        </div>
    `;
}

// ========================================
// 模态框操作
// ========================================

let currentEditBookId = null;

/**
 * 打开添加书籍模态框
 */
function openBookEditor(bookId = null) {
    currentEditBookId = bookId;
    const modal = document.getElementById('bookEditorModal');
    const form = document.getElementById('bookEditorForm');
    const title = document.getElementById('bookEditorTitle');
    
    if (!modal || !form) {
        console.error('书籍编辑器模态框未找到');
        return;
    }
    
    // 重置表单
    form.reset();
    
    if (bookId) {
        // 编辑模式
        const books = getBooks();
        const book = books.find(b => b.id === bookId);
        if (book) {
            title.textContent = '✏️ 编辑书籍';
            document.getElementById('bookTitle').value = book.title;
            document.getElementById('bookAuthor').value = book.author;
            document.getElementById('bookCover').value = book.cover;
            document.getElementById('bookReview').value = book.review || '';
            document.getElementById('bookDate').value = book.date;
            document.getElementById('bookTags').value = (book.tags || []).join(', ');
            // 设置评分
            document.querySelectorAll('#bookEditorModal .star').forEach((star, idx) => {
                star.classList.toggle('active', idx < book.rating);
            });
        }
    } else {
        // 添加模式
        title.textContent = '📚 添加书籍';
        document.getElementById('bookDate').value = new Date().toISOString().split('T')[0];
    }
    
    // 初始化评分点击事件
    initRatingEditor();
    
    modal.style.display = 'flex';
}

/**
 * 初始化评分编辑器点击事件
 */
function initRatingEditor() {
    const ratingEditor = document.querySelector('#bookEditorModal .rating-editor');
    if (!ratingEditor) return;
    
    ratingEditor.querySelectorAll('.star').forEach(star => {
        star.onclick = () => {
            const value = parseInt(star.dataset.value);
            ratingEditor.dataset.rating = value;
            ratingEditor.querySelectorAll('.star').forEach((s, idx) => {
                s.classList.toggle('active', idx < value);
            });
        };
    });
}

/**
 * 关闭书籍编辑器
 */
function closeBookEditor() {
    const modal = document.getElementById('bookEditorModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditBookId = null;
}

/**
 * 保存书籍
 */
function saveBookFromEditor() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const cover = document.getElementById('bookCover').value.trim() || '📖';
    const review = document.getElementById('bookReview').value.trim();
    const date = document.getElementById('bookDate').value;
    const tagsStr = document.getElementById('bookTags').value.trim();
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
    const ratingEditor = document.querySelector('#bookEditorModal .rating-editor');
    const rating = ratingEditor ? parseInt(ratingEditor.dataset.rating || '0') : 0;
    
    if (!title) {
        alert('请输入书名');
        return;
    }
    
    const bookData = {
        title,
        author,
        cover,
        rating,
        review,
        date,
        tags
    };
    
    if (currentEditBookId) {
        updateBook(currentEditBookId, bookData);
    } else {
        addBook(bookData);
    }
    
    closeBookEditor();
    renderBooks();
}

/**
 * 编辑书籍
 */
function editBook(bookId) {
    openBookEditor(bookId);
}

/**
 * 确认删除书籍
 */
function confirmDeleteBook(bookId) {
    const books = getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    if (confirm(`确定要删除《${book.title}》吗？`)) {
        deleteBook(bookId);
        renderBooks();
    }
}

// ========================================
// 初始化
// ========================================

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    // 渲染书籍列表
    renderBooks();
    
    // 绑定添加按钮
    const addBtn = document.getElementById('addBookBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openBookEditor());
    }
    
    // ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBookEditor();
        }
    });
});
