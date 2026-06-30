/**
 * ========================================
 * 灵感碎片 - ideas.js
 * ========================================
 * 功能：快速记录灵感和思维想法
 * 存储：localStorage（浏览器本地存储）
 * 
 * 数据结构：
 * {
 *   id: string (时间戳),
 *   title: string,
 *   content: string,
 *   tags: array (自定义标签),
 *   date: string (YYYY-MM-DD),
 *   createdAt: string (ISO),
 *   updatedAt: string (ISO)
 * }
 * ========================================
 */

// ========================================
// 常量与配置
// ========================================
const IDEAS_STORAGE_KEY = 'zhengxiongwen_ideas';

// 默认灵感示例
const DEFAULT_IDEAS = [
    {
        id: 'idea_1719000001',
        title: '个人网站可以加个暗色模式切换',
        content: '想加一个一键切换暗色模式和护眼模式的按钮，放在导航栏右侧。暗色模式用深绿色主题，护眼模式用暖黄色。',
        tags: ['网站', 'UI设计'],
        date: '2026-06-21',
        createdAt: '2026-06-21T14:00:00.000Z',
        updatedAt: '2026-06-21T14:00:00.000Z'
    },
    {
        id: 'idea_1719000002',
        title: '视频剪辑的创意方向',
        content: '可以做一期「高中三年回顾」的混剪视频，用不同时期的照片和视频，配上音乐，记录成长轨迹。风格可以参考抖音上的回忆类视频。',
        tags: ['剪辑', '创作'],
        date: '2026-06-20',
        createdAt: '2026-06-20T16:30:00.000Z',
        updatedAt: '2026-06-20T16:30:00.000Z'
    },
    {
        id: 'idea_1719000003',
        title: '用 AI 辅助学习编程',
        content: '可以试试用 AI 对话式学习 Python，遇到问题直接问，比看教程效率高。但要注意不能完全依赖，还是要理解底层原理。',
        tags: ['编程', '学习'],
        date: '2026-06-18',
        createdAt: '2026-06-18T10:00:00.000Z',
        updatedAt: '2026-06-18T10:00:00.000Z'
    }
];

// ========================================
// 数据操作
// ========================================

function getIdeas() {
    const data = localStorage.getItem(IDEAS_STORAGE_KEY);
    if (!data) {
        localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(DEFAULT_IDEAS));
        return [...DEFAULT_IDEAS];
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('灵感数据解析失败:', e);
        return [];
    }
}

function saveIdeas(ideas) {
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
}

function addIdea(idea) {
    const ideas = getIdeas();
    const now = new Date().toISOString();
    const newIdea = {
        id: 'idea_' + Date.now(),
        title: idea.title || '无标题',
        content: idea.content || '',
        tags: idea.tags || [],
        date: idea.date || new Date().toISOString().split('T')[0],
        createdAt: now,
        updatedAt: now
    };
    ideas.unshift(newIdea);
    saveIdeas(ideas);
    return newIdea;
}

function updateIdea(id, updates) {
    const ideas = getIdeas();
    const index = ideas.findIndex(i => i.id === id);
    if (index === -1) return null;
    ideas[index] = {
        ...ideas[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveIdeas(ideas);
    return ideas[index];
}

function deleteIdea(id) {
    const ideas = getIdeas();
    const index = ideas.findIndex(i => i.id === id);
    if (index === -1) return false;
    ideas.splice(index, 1);
    saveIdeas(ideas);
    return true;
}

function getIdea(id) {
    const ideas = getIdeas();
    return ideas.find(i => i.id === id) || null;
}

// ========================================
// 标签管理
// ========================================

function getAllIdeaTags() {
    const ideas = getIdeas();
    const tagSet = new Set();
    ideas.forEach(idea => {
        (idea.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
}

// ========================================
// UI 渲染
// ========================================

let activeIdeaTagFilter = null;

function renderIdeas() {
    const container = document.getElementById('ideasList');
    if (!container) return;

    const ideas = getIdeas();
    const allTags = getAllIdeaTags();
    const filtered = activeIdeaTagFilter 
        ? ideas.filter(i => (i.tags || []).includes(activeIdeaTagFilter))
        : ideas;

    if (ideas.length === 0) {
        container.innerHTML = `
            <div class="ideas-empty">
                <div class="ideas-empty-icon">💡</div>
                <p>还没有灵感，点击右上角「记录灵感」开始捕捉想法吧！</p>
            </div>
        `;
        return;
    }

    // 标签筛选条
    const tagBar = `
        <div class="ideas-tag-bar">
            <span class="ideas-tag-filter ${activeIdeaTagFilter === null ? 'active' : ''}" onclick="filterIdeasByTag(null)">全部</span>
            ${allTags.map(tag => `
                <span class="ideas-tag-filter ${activeIdeaTagFilter === tag ? 'active' : ''}" onclick="filterIdeasByTag('${escapeHtmlDiary(tag)}')">${escapeHtmlDiary(tag)}</span>
            `).join('')}
        </div>
    `;

    // 卡片网格
    const cards = filtered.map(idea => {
        const dateObj = new Date(idea.date + 'T00:00:00');
        const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
        const preview = idea.content.length > 100 
            ? idea.content.substring(0, 100) + '...' 
            : idea.content;

        const tagsStr = (idea.tags || []).length > 0 
            ? `<div class="ideas-card-tags">${(idea.tags || []).map(t => `<span class="ideas-card-tag">${escapeHtmlDiary(t)}</span>`).join('')}</div>` 
            : '';

        return `
            <div class="idea-card" onclick="openIdeaDetail('${idea.id}')">
                <div class="idea-card-header">
                    <h4>${escapeHtmlDiary(idea.title)}</h4>
                    <span class="idea-card-date">${dateStr}</span>
                </div>
                <p class="idea-card-content">${escapeHtmlDiary(preview)}</p>
                ${tagsStr}
                <div class="idea-card-actions" onclick="event.stopPropagation()">
                    <button class="idea-card-btn" onclick="editIdea('${idea.id}')" title="编辑"><i class="fas fa-edit"></i></button>
                    <button class="idea-card-btn idea-card-delete" onclick="confirmDeleteIdea('${idea.id}')" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        ${tagBar}
        <div class="ideas-grid">${cards}</div>
    `;

    if (filtered.length === 0 && activeIdeaTagFilter) {
        container.innerHTML = `
            ${tagBar}
            <div class="ideas-empty">
                <p>没有匹配「${escapeHtmlDiary(activeIdeaTagFilter)}」标签的灵感</p>
            </div>
        `;
    }
}

function filterIdeasByTag(tag) {
    activeIdeaTagFilter = tag;
    renderIdeas();
}

// ========================================
// 编辑器
// ========================================

let currentEditIdeaId = null;

function openIdeaEditor() {
    currentEditIdeaId = null;
    document.getElementById('ideaModalTitle').textContent = '💡 记录灵感';
    document.getElementById('ideaTitle').value = '';
    document.getElementById('ideaContent').value = '';
    document.getElementById('ideaDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('ideaTags').value = '';
    showModal('ideaModal');
}

function editIdea(id) {
    const idea = getIdea(id);
    if (!idea) return;
    currentEditIdeaId = id;
    document.getElementById('ideaModalTitle').textContent = '✏️ 编辑灵感';
    document.getElementById('ideaTitle').value = idea.title;
    document.getElementById('ideaContent').value = idea.content;
    document.getElementById('ideaDate').value = idea.date;
    document.getElementById('ideaTags').value = (idea.tags || []).join(', ');
    showModal('ideaModal');
}

function saveIdea() {
    const title = document.getElementById('ideaTitle').value.trim();
    const content = document.getElementById('ideaContent').value.trim();
    const date = document.getElementById('ideaDate').value;
    const tagsStr = document.getElementById('ideaTags').value.trim();
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];

    if (!title) {
        shakeElement(document.getElementById('ideaTitle'));
        return;
    }
    if (!content) {
        shakeElement(document.getElementById('ideaContent'));
        return;
    }

    if (currentEditIdeaId) {
        updateIdea(currentEditIdeaId, { title, content, date, tags });
    } else {
        addIdea({ title, content, date, tags });
    }

    closeIdeaEditor();
    renderIdeas();
    showToast(currentEditIdeaId ? '✅ 灵感已更新' : '✅ 灵感已记录');
}

function closeIdeaEditor() {
    hideModal('ideaModal');
    currentEditIdeaId = null;
}

// ========================================
// 详情
// ========================================

let currentIdeaDetailId = null;

function openIdeaDetail(id) {
    const idea = getIdea(id);
    if (!idea) return;
    currentIdeaDetailId = id;

    const dateObj = new Date(idea.date + 'T00:00:00');
    const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    const tagsStr = (idea.tags || []).length > 0 
        ? `<div class="detail-tags">${(idea.tags || []).map(t => `<span class="detail-tag">${escapeHtmlDiary(t)}</span>`).join('')}</div>` 
        : '';

    document.getElementById('ideaDetailTitle').textContent = '💡 灵感详情';
    document.getElementById('ideaDetailMeta').innerHTML = `
        <span class="detail-date"><i class="fas fa-calendar-alt"></i> ${dateStr}</span>
        ${idea.updatedAt !== idea.createdAt ? '<span class="detail-edited"><i class="fas fa-pen"></i> 已编辑</span>' : ''}
    `;
    document.getElementById('ideaDetailContent').innerHTML = `
        <h2 class="detail-title">${escapeHtmlDiary(idea.title)}</h2>
        ${tagsStr}
        <div class="detail-text">${escapeHtmlDiary(idea.content).replace(/\n/g, '<br>')}</div>
    `;

    showModal('ideaDetailModal');
}

function closeIdeaDetail() {
    hideModal('ideaDetailModal');
    currentIdeaDetailId = null;
}

function editIdeaFromDetail() {
    closeIdeaDetail();
    setTimeout(() => editIdea(currentIdeaDetailId), 300);
}

function deleteIdeaFromDetail() {
    if (confirm('确定要删除这个灵感吗？')) {
        deleteIdea(currentIdeaDetailId);
        closeIdeaDetail();
        renderIdeas();
        showToast('🗑️ 灵感已删除');
    }
}

function confirmDeleteIdea(id) {
    if (confirm('确定要删除这个灵感吗？')) {
        deleteIdea(id);
        renderIdeas();
        showToast('🗑️ 灵感已删除');
    }
}

// ========================================
// 初始化
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    renderIdeas();
});

// 导出到全局
window.openIdeaEditor = openIdeaEditor;
window.closeIdeaEditor = closeIdeaEditor;
window.saveIdea = saveIdea;
window.editIdea = editIdea;
window.openIdeaDetail = openIdeaDetail;
window.closeIdeaDetail = closeIdeaDetail;
window.editIdeaFromDetail = editIdeaFromDetail;
window.deleteIdeaFromDetail = deleteIdeaFromDetail;
window.confirmDeleteIdea = confirmDeleteIdea;
window.filterIdeasByTag = filterIdeasByTag;
