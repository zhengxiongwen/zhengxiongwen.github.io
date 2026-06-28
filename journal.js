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
 *   weather: string (emoji),
 *   tags: array (标签),
 *   location: string (地点),
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
        weather: '☀️',
        tags: ['个人网站', '成长'],
        location: '家里',
        createdAt: '2026-06-21T10:00:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z'
    },
    {
        id: '1719000000002',
        title: '暑假开始，制定学习计划',
        content: '高中毕业后的第一个暑假，我决定利用这段时间好好提升自己。主要目标是练习视频剪辑，希望能在开学前掌握这项技能。加油！',
        date: '2026-06-15',
        mood: '💪',
        weather: '⛅',
        tags: ['暑假', '学习计划'],
        location: '家里',
        createdAt: '2026-06-15T10:00:00.000Z',
        updatedAt: '2026-06-15T10:00:00.000Z'
    },
    {
        id: '1719000000003',
        title: '读完《认知天性》',
        content: '这本书真的改变了我对学习的认知。原来重复阅读并不是好方法，提取练习和间隔重复才是高效学习的关键。以后要用这些方法去学习！',
        date: '2026-06-10',
        mood: '😊',
        weather: '🌤️',
        tags: ['读书', '学习'],
        location: '图书馆',
        createdAt: '2026-06-10T10:00:00.000Z',
        updatedAt: '2026-06-10T10:00:00.000Z'
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
        weather: journal.weather || '',
        tags: journal.tags || [],
        location: journal.location || '',
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
 * 横向滚动 - 日志
 */
function scrollJournal(direction) {
    const container = document.getElementById('journalScrollWrapper');
    if (!container) return;
    const scrollAmount = 400; // 每次滚动的像素
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

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
        const preview = journal.content.length > 80 
            ? journal.content.substring(0, 80) + '...' 
            : journal.content;

        const weatherStr = journal.weather ? `${journal.weather} ` : '';
        const locationStr = journal.location ? ` 📍${journal.location}` : '';
        const tagsStr = (journal.tags || []).length > 0 
            ? `<div class="journal-tags">${(journal.tags || []).map(t => `<span class="journal-tag">${escapeHtml(t)}</span>`).join('')}</div>` 
            : '';

        return `
            <article class="journal-entry scroll-reveal" onclick="openJournalDetail('${journal.id}')" style="cursor:pointer">
                <div class="journal-date">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                </div>
                <div class="journal-content">
                    <h3>${journal.mood ? journal.mood + ' ' : ''}${weatherStr}${escapeHtml(journal.title)}</h3>
                    <p>${escapeHtml(preview)}</p>
                    ${tagsStr}
                    ${locationStr ? `<div class="journal-location">${locationStr}</div>` : ''}
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
    document.getElementById('journalWeather').value = '';
    document.getElementById('journalTags').value = '';
    document.getElementById('journalLocation').value = '';
    // 清除心情选中
    document.querySelectorAll('.mood-option').forEach(el => el.classList.remove('selected'));
    // 清除天气选中
    document.querySelectorAll('.weather-option').forEach(el => el.classList.remove('selected'));
    
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
    document.getElementById('journalWeather').value = journal.weather || '';
    document.getElementById('journalTags').value = (journal.tags || []).join(', ');
    document.getElementById('journalLocation').value = journal.location || '';
    
    // 设置心情选中
    document.querySelectorAll('.mood-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.mood === journal.mood);
    });
    
    // 设置天气选中
    document.querySelectorAll('.weather-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.weather === journal.weather);
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
    const weather = document.getElementById('journalWeather').value;
    const tagsStr = document.getElementById('journalTags').value.trim();
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
    const location = document.getElementById('journalLocation').value.trim();

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
        updateJournal(currentEditId, { title, content, date, mood, weather, tags, location });
    } else {
        // 新建模式
        addJournal({ title, content, date, mood, weather, tags, location });
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

    const moodStr = journal.mood ? `${journal.mood} ` : '📝';
    const weatherStr = journal.weather ? `${journal.weather} ` : '';
    const locationStr = journal.location ? ` 📍${journal.location}` : '';
    const tagsStr = (journal.tags || []).length > 0 
        ? `<div class="detail-tags">${(journal.tags || []).map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>` 
        : '';

    document.getElementById('detailTitle').textContent = '📖 日志详情';
    document.getElementById('detailMeta').innerHTML = `
        <span class="detail-mood">${moodStr}${weatherStr}</span>
        <span class="detail-date"><i class="fas fa-calendar-alt"></i> ${dateStr}${locationStr}</span>
        ${journal.updatedAt !== journal.createdAt ? '<span class="detail-edited"><i class="fas fa-pen"></i> 已编辑</span>' : ''}
    `;
    document.getElementById('detailContent').innerHTML = `
        <h2 class="detail-title">${escapeHtml(journal.title)}</h2>
        ${tagsStr}
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
// 天气选择器
// ========================================

function selectWeather(el) {
    document.querySelectorAll('.weather-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('journalWeather').value = el.dataset.weather;
}

// ========================================
// 重置日志到默认状态
// ========================================

function resetJournalsToDefault() {
    if (confirm('确定要重置日志到默认状态吗？当前所有日志将被替换。')) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_JOURNALS));
        renderJournalList();
        showToast('✅ 日志已重置为默认状态');
    }
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
    // 检查是否需要初始化默认数据
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        // 首次访问，初始化默认日志
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_JOURNALS));
    }
    
    renderJournalList();
    
    // 添加导入/导出按钮
    addImportExportButtons();
});

/**
 * 添加导入/导出按钮
 */
function addImportExportButtons() {
    const section = document.getElementById('journal');
    if (!section) return;
    
    const toolbar = section.querySelector('.section-toolbar');
    if (!toolbar) return;
    
    // 检查是否已添加
    if (toolbar.querySelector('.import-export-btns')) return;
    
    const btnGroup = document.createElement('div');
    btnGroup.className = 'import-export-btns';
    btnGroup.style.cssText = 'display:flex; gap:0.5rem; margin-left:0.5rem;';
    btnGroup.innerHTML = `
        <button class="btn btn-sm btn-outline" onclick="exportJournals()" title="导出日志数据">
            <i class="fas fa-download"></i> 导出
        </button>
        <button class="btn btn-sm btn-outline" onclick="importJournals()" title="导入日志数据">
            <i class="fas fa-upload"></i> 导入
        </button>
        <input type="file" id="journalImportFile" accept=".json" style="display:none" onchange="handleJournalImport(event)">
    `;
    toolbar.appendChild(btnGroup);
}

/**
 * 导出日志数据
 */
function exportJournals() {
    const journals = getJournals();
    const dataStr = JSON.stringify(journals, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `日志备份_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    alert('日志已导出！你可以把这个文件保存到电脑，换设备时再导入。');
}

/**
 * 触发导入文件选择
 */
function importJournals() {
    document.getElementById('journalImportFile').click();
}

/**
 * 处理导入文件
 */
function handleJournalImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                alert('文件格式错误：不是有效的日志数据');
                return;
            }
            
            if (confirm(`确定要导入 ${imported.length} 条日志吗？当前日志将被合并。`)) {
                const current = getJournals();
                // 合并数据（去重）
                const merged = [...imported, ...current];
                const unique = merged.filter((journal, index, self) => 
                    index === self.findIndex(j => j.id === journal.id)
                );
                saveJournals(unique);
                renderJournalList();
                alert(`导入成功！共 ${unique.length} 条日志。`);
            }
        } catch (err) {
            alert('文件解析失败：' + err.message);
        }
    };
    reader.readAsText(file);
    
    // 清空 input，允许重复选择同一文件
    event.target.value = '';
}

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
