/**
 * ========================================
 * 日志管理系统 - journal.js
 * ========================================
 * 功能：在线编写、查看、编辑、删除日志
 * 存储：localStorage（浏览器本地存储）
 * 
 * 数据结构：
 * {
 *   id: string (时间戳),
 *   title: string,
 *   content: string,
 *   date: string (YYYY-MM-DD),
 *   mood: string (emoji),
 *   createdAt: string (ISO),
 *   updatedAt: string (ISO)
 * }
 * ========================================
 */

// ========================================
// 常量与配置
// ========================================
const STORAGE_KEY = 'zhengxiongwen_journals';
const DELETED_KEY = 'zhengxiongwen_journals_deleted';

// 默认日志（首次访问时初始化）
const DEFAULT_JOURNALS = [
    {
        id: '1719000000001',
        title: '今天创建了个人网站！',
        content: '终于拥有了自己的个人网站！这是一个新的开始。高中刚毕业，我希望通过这个平台记录我的成长、分享我的想法、展示我的作品。期待未来的每一天，期待成为更好的自己！',
        date: '2026-06-21',
        mood: '🌟',
        createdAt: '2026-06-21T10:00:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z'
    },
    {
        id: '1719000000002',
        title: '暑假开始，制定学习计划',
        content: '高中毕业后的第一个暑假，我决定利用这段时间好好提升自己。主要目标是练习视频剪辑，希望能在开学前掌握这项技能。加油！',
        date: '2026-06-15',
        mood: '💪',
        createdAt: '2026-06-15T10:00:00.000Z',
        updatedAt: '2026-06-15T10:00:00.000Z'
    }
];

// ========================================
// 数据操作
// ========================================

/**
 * 获取所有日志
 */
function getJournals() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        // 首次访问，初始化默认日志
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_JOURNALS));
        return [...DEFAULT_JOURNALS];
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('日志数据解析失败:', e);
        return [];
    }
}

/**
 * 保存所有日志
 */
function saveJournals(journals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
}

/**
 * 添加日志
 */
function addJournal(journal) {
    const journals = getJournals();
    const now = new Date().toISOString();
    const newJournal = {
        id: Date.now().toString(),
        title: journal.title || '无标题',
        content: journal.content || '',
        date: journal.date || new Date().toISOString().split('T')[0],
        mood: journal.mood || '',
        createdAt: now,
        updatedAt: now
    };
    journals.unshift(newJournal); // 新日志在前
    saveJournals(journals);
    return newJournal;
}

/**
 * 更新日志
 */
function updateJournal(id, updates) {
    const journals = getJournals();
    const index = journals.findIndex(j => j.id === id);
    if (index === -1) return null;
    journals[index] = {
        ...journals[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveJournals(journals);
    return journals[index];
}

/**
 * 删除日志
 */
function deleteJournal(id) {
    const journals = getJournals();
    const index = journals.findIndex(j => j.id === id);
    if (index === -1) return false;
    const deleted = journals.splice(index, 1)[0];
    saveJournals(journals);
    // 保存到回收站
    const deletedList = getDeletedJournals();
    deletedList.unshift({ ...deleted, deletedAt: new Date().toISOString() });
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedList));
    return true;
}

/**
 * 获取已删除的日志（回收站）
 */
function getDeletedJournals() {
    try {
        return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * 获取单条日志
 */
function getJournal(id) {
    const journals = getJournals();
    return journals.find(j => j.id === id) || null;
}

// ========================================
// UI 渲染
// ========================================

/**
 * 渲染日志列表
 */
function renderJournalList() {
    const container = document.getElementById('journalList');
    if (!container) return;

    const journals = getJournals();

    if (journals.length === 0) {
        container.innerHTML = `
            <div class="journal-empty">
                <div class="journal-empty-icon">📝</div>
                <p>还没有日志，点击上方「写日志」开始记录吧！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = journals.map(journal => {
        const dateObj = new Date(journal.date + 'T00:00:00');
        const day = dateObj.getDate();
        const month = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const preview = journal.content.length > 120 
            ? journal.content.substring(0, 120) + '...' 
            : journal.content;

        return `
            <article class="journal-entry scroll-reveal" onclick="openJournalDetail('${journal.id}')" style="cursor:pointer">
                <div class="journal-date">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                </div>
                <div class="journal-content">
                    <h3>${journal.mood ? journal.mood + ' ' : ''}${escapeHtml(journal.title)}</h3>
                    <p>${escapeHtml(preview)}</p>
                </div>
                <div class="journal-actions" onclick="event.stopPropagation()">
                    <button class="journal-action-btn" onclick="editJournal('${journal.id}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="journal-action-btn journal-action-delete" onclick="confirmDeleteJournal('${journal.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </article>
        `;
    }).join('');

    // 重新绑定滚动动画
    if (typeof initScrollReveal === 'function') {
        initScrollReveal();
    }
}

/**
 * HTML 转义（防 XSS）
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// 编辑器操作
// ========================================

let currentEditId = null; // 当前编辑的日志 ID（null = 新建）

/**
 * 打开编辑器（新建）
 */
function openJournalEditor() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = '📝 写日志';
    document.getElementById('journalTitle').value = '';
    document.getElementById('journalDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('journalContent').value = '';
    document.getElementById('journalMood').value = '';
    // 清除心情选中
    document.querySelectorAll('.mood-option').forEach(el => el.classList.remove('selected'));
    
    showModal('journalModal');
}

/**
 * 编辑日志
 */
function editJournal(id) {
    const journal = getJournal(id);
    if (!journal) return;

    currentEditId = id;
    document.getElementById('modalTitle').textContent = '✏️ 编辑日志';
    document.getElementById('journalTitle').value = journal.title;
    document.getElementById('journalDate').value = journal.date;
    document.getElementById('journalContent').value = journal.content;
    document.getElementById('journalMood').value = journal.mood || '';
    
    // 设置心情选中
    document.querySelectorAll('.mood-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.mood === journal.mood);
    });
    
    showModal('journalModal');
}

/**
 * 保存日志
 */
function saveJournal() {
    const title = document.getElementById('journalTitle').value.trim();
    const content = document.getElementById('journalContent').value.trim();
    const date = document.getElementById('journalDate').value;
    const mood = document.getElementById('journalMood').value;

    // 验证
    if (!title) {
        shakeElement(document.getElementById('journalTitle'));
        return;
    }
    if (!content) {
        shakeElement(document.getElementById('journalContent'));
        return;
    }

    if (currentEditId) {
        // 编辑模式
        updateJournal(currentEditId, { title, content, date, mood });
    } else {
        // 新建模式
        addJournal({ title, content, date, mood });
    }

    closeJournalEditor();
    renderJournalList();
    showToast(currentEditId ? '✅ 日志已更新' : '✅ 日志已保存');
}

/**
 * 关闭编辑器
 */
function closeJournalEditor() {
    hideModal('journalModal');
    currentEditId = null;
}

// ========================================
// 日志详情
// ========================================

let currentDetailId = null;

/**
 * 打开日志详情
 */
function openJournalDetail(id) {
    const journal = getJournal(id);
    if (!journal) return;

    currentDetailId = id;

    const dateObj = new Date(journal.date + 'T00:00:00');
    const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

    document.getElementById('detailTitle').textContent = '📖 日志详情';
    document.getElementById('detailMeta').innerHTML = `
        <span class="detail-mood">${journal.mood || '📝'}</span>
        <span class="detail-date"><i class="fas fa-calendar-alt"></i> ${dateStr}</span>
        ${journal.updatedAt !== journal.createdAt ? '<span class="detail-edited"><i class="fas fa-pen"></i> 已编辑</span>' : ''}
    `;
    document.getElementById('detailContent').innerHTML = `
        <h2 class="detail-title">${escapeHtml(journal.title)}</h2>
        <div class="detail-text">${escapeHtml(journal.content).replace(/\n/g, '<br>')}</div>
    `;

    showModal('journalDetailModal');
}

/**
 * 关闭日志详情
 */
function closeJournalDetail() {
    hideModal('journalDetailModal');
    currentDetailId = null;
}

/**
 * 从详情编辑
 */
function editJournalFromDetail() {
    closeJournalDetail();
    setTimeout(() => editJournal(currentDetailId), 300);
}

/**
 * 从详情删除
 */
function deleteJournalFromDetail() {
    if (confirm('确定要删除这篇日志吗？')) {
        deleteJournal(currentDetailId);
        closeJournalDetail();
        renderJournalList();
        showToast('🗑️ 日志已删除');
    }
}

// ========================================
// 删除确认
// ========================================

/**
 * 确认删除日志
 */
function confirmDeleteJournal(id) {
    if (confirm('确定要删除这篇日志吗？删除后可在回收站恢复。')) {
        deleteJournal(id);
        renderJournalList();
        showToast('🗑️ 日志已删除');
    }
}

// ========================================
// 心情选择器
// ========================================

function selectMood(el) {
    document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('journalMood').value = el.dataset.mood;
}

// ========================================
// 模态框控制
// ========================================

function showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// 点击遮罩关闭
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ESC 关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// ========================================
// 提示消息（Toast）
// ========================================

function showToast(message) {
    // 移除已有的 toast
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发动画
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // 3 秒后消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// 抖动效果（验证失败时）
// ========================================

function shakeElement(el) {
    el.classList.add('shake');
    el.focus();
    setTimeout(() => el.classList.remove('shake'), 600);
}

// ========================================
// 初始化
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    renderJournalList();
});

// 导出给全局（供 HTML onclick 调用）
window.openJournalEditor = openJournalEditor;
window.closeJournalEditor = closeJournalEditor;
window.saveJournal = saveJournal;
window.editJournal = editJournal;
window.openJournalDetail = openJournalDetail;
window.closeJournalDetail = closeJournalDetail;
window.editJournalFromDetail = editJournalFromDetail;
window.deleteJournalFromDetail = deleteJournalFromDetail;
window.confirmDeleteJournal = confirmDeleteJournal;
window.selectMood = selectMood;
