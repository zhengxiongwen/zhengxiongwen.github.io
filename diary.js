/**
 * ========================================
 * 日记管理系统 - diary.js
 * ========================================
 * 功能：在线编写、查看、编辑、删除日记
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
const DIARY_STORAGE_KEY = 'zhengxiongwen_diary';
const OLD_JOURNAL_KEY = 'zhengxiongwen_journals';
const DIARY_DELETED_KEY = 'zhengxiongwen_diary_deleted';

// 默认日记（首次访问时初始化）
const DEFAULT_DIARIES = [
    {
        id: '1719000000101',
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
        id: '1719000000102',
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
        id: '1719000000103',
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
// 数据迁移（旧日志 → 新日记）
// ========================================

/**
 * 迁移旧日志数据到日记
 */
function migrateJournalToDiary() {
    const oldData = localStorage.getItem(OLD_JOURNAL_KEY);
    const newData = localStorage.getItem(DIARY_STORAGE_KEY);
    
    // 如果新数据存在，则跳过迁移
    if (newData) return;
    
    // 如果旧数据存在，迁移
    if (oldData) {
        try {
            const journals = JSON.parse(oldData);
            localStorage.setItem(DIARY_STORAGE_KEY, oldData);
            // 迁移后删除旧数据
            localStorage.removeItem(OLD_JOURNAL_KEY);
            console.log(`已迁移 ${journals.length} 条日志到日记`);
        } catch (e) {
            console.error('迁移失败:', e);
        }
    }
    
    // 迁移回收站数据
    const oldDeletedKey = 'zhengxiongwen_journals_deleted';
    const oldDeleted = localStorage.getItem(oldDeletedKey);
    if (oldDeleted) {
        const newDeleted = localStorage.getItem(DIARY_DELETED_KEY);
        if (!newDeleted) {
            localStorage.setItem(DIARY_DELETED_KEY, oldDeleted);
        }
        localStorage.removeItem(oldDeletedKey);
    }
}

// ========================================
// 数据操作
// ========================================

/**
 * 获取所有日记
 */
function getDiary() {
    const data = localStorage.getItem(DIARY_STORAGE_KEY);
    if (!data) {
        // 首次访问，初始化默认日记
        localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(DEFAULT_DIARIES));
        return [...DEFAULT_DIARIES];
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('日记数据解析失败:', e);
        return [];
    }
}

/**
 * 保存所有日记
 */
function saveDiary(diary) {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(diary));
}

/**
 * 添加日记
 */
function addDiary(entry) {
    const diary = getDiary();
    const now = new Date().toISOString();
    const newEntry = {
        id: Date.now().toString(),
        title: entry.title || '无标题',
        content: entry.content || '',
        date: entry.date || new Date().toISOString().split('T')[0],
        mood: entry.mood || '',
        weather: entry.weather || '',
        tags: entry.tags || [],
        location: entry.location || '',
        createdAt: now,
        updatedAt: now
    };
    diary.unshift(newEntry);
    saveDiary(diary);
    return newEntry;
}

/**
 * 更新日记
 */
function updateDiary(id, updates) {
    const diary = getDiary();
    const index = diary.findIndex(j => j.id === id);
    if (index === -1) return null;
    diary[index] = {
        ...diary[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveDiary(diary);
    return diary[index];
}

/**
 * 删除日记
 */
function deleteDiary(id) {
    const diary = getDiary();
    const index = diary.findIndex(j => j.id === id);
    if (index === -1) return false;
    const deleted = diary.splice(index, 1)[0];
    saveDiary(diary);
    // 保存到回收站
    const deletedList = getDeletedDiary();
    deletedList.unshift({ ...deleted, deletedAt: new Date().toISOString() });
    localStorage.setItem(DIARY_DELETED_KEY, JSON.stringify(deletedList));
    return true;
}

/**
 * 获取已删除的日记（回收站）
 */
function getDeletedDiary() {
    try {
        return JSON.parse(localStorage.getItem(DIARY_DELETED_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * 获取单条日记
 */
function getDiaryEntry(id) {
    const diary = getDiary();
    return diary.find(j => j.id === id) || null;
}

// ========================================
// UI 渲染
// ========================================

/**
 * 横向滚动 - 日记
 */
function scrollDiary(direction) {
    const container = document.getElementById('diaryScrollWrapper');
    if (!container) return;
    const scrollAmount = 400;
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

/**
 * 渲染日记列表
 */
function renderDiaryList() {
    const container = document.getElementById('diaryList');
    if (!container) return;

    const diary = getDiary();

    if (diary.length === 0) {
        container.innerHTML = `
            <div class="journal-empty">
                <div class="journal-empty-icon">📓</div>
                <p>还没有日记，点击上方「写日记」开始记录吧！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = diary.map(entry => {
        const dateObj = new Date(entry.date + 'T00:00:00');
        const day = dateObj.getDate();
        const month = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const preview = entry.content.length > 80 
            ? entry.content.substring(0, 80) + '...' 
            : entry.content;

        const weatherStr = entry.weather ? `${entry.weather} ` : '';
        const locationStr = entry.location ? ` 📍${entry.location}` : '';
        const tagsStr = (entry.tags || []).length > 0 
            ? `<div class="journal-tags">${(entry.tags || []).map(t => `<span class="journal-tag">${escapeHtmlDiary(t)}</span>`).join('')}</div>` 
            : '';

        return `
            <article class="journal-entry scroll-reveal" onclick="openDiaryDetail('${entry.id}')" style="cursor:pointer">
                <div class="journal-date">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                </div>
                <div class="journal-content">
                    <h3>${entry.mood ? entry.mood + ' ' : ''}${weatherStr}${escapeHtmlDiary(entry.title)}</h3>
                    <p>${escapeHtmlDiary(preview)}</p>
                    ${tagsStr}
                    ${locationStr ? `<div class="journal-location">${locationStr}</div>` : ''}
                </div>
                <div class="journal-actions" onclick="event.stopPropagation()">
                    <button class="journal-action-btn" onclick="editDiary('${entry.id}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="journal-action-btn journal-action-delete" onclick="confirmDeleteDiary('${entry.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </article>
        `;
    }).join('');

    if (typeof initScrollReveal === 'function') {
        initScrollReveal();
    }
}

/**
 * HTML 转义
 */
function escapeHtmlDiary(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// 编辑器操作
// ========================================

let currentEditDiaryId = null;

/**
 * 打开编辑器（新建）
 */
function openDiaryEditor() {
    currentEditDiaryId = null;
    document.getElementById('diaryModalTitle').textContent = '📝 写日记';
    document.getElementById('diaryTitle').value = '';
    document.getElementById('diaryDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('diaryContent').value = '';
    document.getElementById('diaryMood').value = '';
    document.getElementById('diaryWeather').value = '';
    document.getElementById('diaryTags').value = '';
    document.getElementById('diaryLocation').value = '';
    document.querySelectorAll('.diary-mood-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.diary-weather-option').forEach(el => el.classList.remove('selected'));
    
    showModal('diaryModal');
}

/**
 * 编辑日记
 */
function editDiary(id) {
    const entry = getDiaryEntry(id);
    if (!entry) return;

    currentEditDiaryId = id;
    document.getElementById('diaryModalTitle').textContent = '✏️ 编辑日记';
    document.getElementById('diaryTitle').value = entry.title;
    document.getElementById('diaryDate').value = entry.date;
    document.getElementById('diaryContent').value = entry.content;
    document.getElementById('diaryMood').value = entry.mood || '';
    document.getElementById('diaryWeather').value = entry.weather || '';
    document.getElementById('diaryTags').value = (entry.tags || []).join(', ');
    document.getElementById('diaryLocation').value = entry.location || '';
    
    document.querySelectorAll('.diary-mood-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.mood === entry.mood);
    });
    
    document.querySelectorAll('.diary-weather-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.weather === entry.weather);
    });
    
    showModal('diaryModal');
}

/**
 * 保存日记
 */
function saveDiary() {
    const title = document.getElementById('diaryTitle').value.trim();
    const content = document.getElementById('diaryContent').value.trim();
    const date = document.getElementById('diaryDate').value;
    const mood = document.getElementById('diaryMood').value;
    const weather = document.getElementById('diaryWeather').value;
    const tagsStr = document.getElementById('diaryTags').value.trim();
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
    const location = document.getElementById('diaryLocation').value.trim();

    if (!title) {
        shakeElement(document.getElementById('diaryTitle'));
        return;
    }
    if (!content) {
        shakeElement(document.getElementById('diaryContent'));
        return;
    }

    if (currentEditDiaryId) {
        updateDiary(currentEditDiaryId, { title, content, date, mood, weather, tags, location });
    } else {
        addDiary({ title, content, date, mood, weather, tags, location });
    }

    closeDiaryEditor();
    renderDiaryList();
    showToast(currentEditDiaryId ? '✅ 日记已更新' : '✅ 日记已保存');
}

/**
 * 关闭编辑器
 */
function closeDiaryEditor() {
    hideModal('diaryModal');
    currentEditDiaryId = null;
}

// ========================================
// 日记详情
// ========================================

let currentDiaryDetailId = null;

/**
 * 打开日记详情
 */
function openDiaryDetail(id) {
    const entry = getDiaryEntry(id);
    if (!entry) return;

    currentDiaryDetailId = id;

    const dateObj = new Date(entry.date + 'T00:00:00');
    const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

    const moodStr = entry.mood ? `${entry.mood} ` : '📝';
    const weatherStr = entry.weather ? `${entry.weather} ` : '';
    const locationStr = entry.location ? ` 📍${entry.location}` : '';
    const tagsStr = (entry.tags || []).length > 0 
        ? `<div class="detail-tags">${(entry.tags || []).map(t => `<span class="detail-tag">${escapeHtmlDiary(t)}</span>`).join('')}</div>` 
        : '';

    document.getElementById('diaryDetailTitle').textContent = '📖 日记详情';
    document.getElementById('diaryDetailMeta').innerHTML = `
        <span class="detail-mood">${moodStr}${weatherStr}</span>
        <span class="detail-date"><i class="fas fa-calendar-alt"></i> ${dateStr}${locationStr}</span>
        ${entry.updatedAt !== entry.createdAt ? '<span class="detail-edited"><i class="fas fa-pen"></i> 已编辑</span>' : ''}
    `;
    document.getElementById('diaryDetailContent').innerHTML = `
        <h2 class="detail-title">${escapeHtmlDiary(entry.title)}</h2>
        ${tagsStr}
        <div class="detail-text">${escapeHtmlDiary(entry.content).replace(/\n/g, '<br>')}</div>
    `;

    showModal('diaryDetailModal');
}

/**
 * 关闭日记详情
 */
function closeDiaryDetail() {
    hideModal('diaryDetailModal');
    currentDiaryDetailId = null;
}

/**
 * 从详情编辑
 */
function editDiaryFromDetail() {
    closeDiaryDetail();
    setTimeout(() => editDiary(currentDiaryDetailId), 300);
}

/**
 * 从详情删除
 */
function deleteDiaryFromDetail() {
    if (confirm('确定要删除这篇日记吗？')) {
        deleteDiary(currentDiaryDetailId);
        closeDiaryDetail();
        renderDiaryList();
        showToast('🗑️ 日记已删除');
    }
}

// ========================================
// 删除确认
// ========================================

function confirmDeleteDiary(id) {
    if (confirm('确定要删除这篇日记吗？删除后可在回收站恢复。')) {
        deleteDiary(id);
        renderDiaryList();
        showToast('🗑️ 日记已删除');
    }
}

// ========================================
// 心情选择器
// ========================================

function selectDiaryMood(el) {
    document.querySelectorAll('.diary-mood-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('diaryMood').value = el.dataset.mood;
}

// ========================================
// 天气选择器
// ========================================

function selectDiaryWeather(el) {
    document.querySelectorAll('.diary-weather-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('diaryWeather').value = el.dataset.weather;
}

// ========================================
// 初始化
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // 迁移旧日志数据
    migrateJournalToDiary();
    
    renderDiaryList();
    addDiaryImportExport();
});

/**
 * 添加导入/导出按钮
 */
function addDiaryImportExport() {
    const section = document.getElementById('diary');
    if (!section) return;
    
    const toolbar = section.querySelector('.section-toolbar');
    if (!toolbar) return;
    
    if (toolbar.querySelector('.import-export-btns')) return;
    
    const btnGroup = document.createElement('div');
    btnGroup.className = 'import-export-btns';
    btnGroup.style.cssText = 'display:flex; gap:0.5rem; margin-left:0.5rem;';
    btnGroup.innerHTML = `
        <button class="btn btn-sm btn-outline" onclick="exportDiary()" title="导出日记数据">
            <i class="fas fa-download"></i> 导出
        </button>
        <button class="btn btn-sm btn-outline" onclick="importDiary()" title="导入日记数据">
            <i class="fas fa-upload"></i> 导入
        </button>
        <input type="file" id="diaryImportFile" accept=".json" style="display:none" onchange="handleDiaryImport(event)">
    `;
    toolbar.appendChild(btnGroup);
}

/**
 * 导出日记
 */
function exportDiary() {
    const diary = getDiary();
    const dataStr = JSON.stringify(diary, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `日记备份_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    alert('日记已导出！你可以把这个文件保存到电脑，换设备时再导入。');
}

/**
 * 触发导入
 */
function importDiary() {
    document.getElementById('diaryImportFile').click();
}

/**
 * 处理导入
 */
function handleDiaryImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                alert('文件格式错误：不是有效的日记数据');
                return;
            }
            
            if (confirm(`确定要导入 ${imported.length} 条日记吗？当前日记将被合并。`)) {
                const current = getDiary();
                const merged = [...imported, ...current];
                const unique = merged.filter((entry, index, self) => 
                    index === self.findIndex(j => j.id === entry.id)
                );
                saveDiary(unique);
                renderDiaryList();
                alert(`导入成功！共 ${unique.length} 条日记。`);
            }
        } catch (err) {
            alert('文件解析失败：' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// 导出到全局
window.openDiaryEditor = openDiaryEditor;
window.closeDiaryEditor = closeDiaryEditor;
window.saveDiary = saveDiary;
window.editDiary = editDiary;
window.openDiaryDetail = openDiaryDetail;
window.closeDiaryDetail = closeDiaryDetail;
window.editDiaryFromDetail = editDiaryFromDetail;
window.deleteDiaryFromDetail = deleteDiaryFromDetail;
window.confirmDeleteDiary = confirmDeleteDiary;
window.selectDiaryMood = selectDiaryMood;
window.selectDiaryWeather = selectDiaryWeather;
window.scrollDiary = scrollDiary;
window.exportDiary = exportDiary;
window.importDiary = importDiary;
window.handleDiaryImport = handleDiaryImport;
