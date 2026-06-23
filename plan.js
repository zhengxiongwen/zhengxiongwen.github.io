/**
 * ========================================
 * 规划管理系统 - plan.js
 * ========================================
 * 功能：规划任务的增删改查、编辑模式切换
 * 存储：localStorage
 * ========================================
 */

// ========================================
// 常量与配置
// ========================================
const PLAN_STORAGE_KEY = 'zhengxiongwen_plan';

// 默认规划数据
const DEFAULT_PLAN = {
    short: [
        { id: 'ps1', text: '完成个人网站搭建', checked: true },
        { id: 'ps2', text: '暑假练习剪辑', checked: false },
        { id: 'ps3', text: '读完 3 本书', checked: false },
        { id: 'ps4', text: '制作第一个剪辑作品', checked: false }
    ],
    medium: [
        { id: 'pm1', text: '提升剪辑技能', checked: false },
        { id: 'pm2', text: '建立个人作品集', checked: false },
        { id: 'pm3', text: '学习一项新技能', checked: false },
        { id: 'pm4', text: '扩大社交影响力', checked: false }
    ],
    long: [
        { id: 'pl1', text: '成为优秀的创作者', checked: false },
        { id: 'pl2', text: '建立个人品牌', checked: false },
        { id: 'pl3', text: '持续学习，不断进步', checked: false },
        { id: 'pl4', text: '帮助更多人成长', checked: false }
    ]
};

// 分类配置
const PLAN_CATEGORIES = {
    short: { title: '🎯 短期目标（1-3个月）', icon: '🎯' },
    medium: { title: '🚀 中期目标（3-12个月）', icon: '🚀' },
    long: { title: '🌟 长期愿景（1年以上）', icon: '🌟' }
};

// ========================================
// 数据操作
// ========================================

function getPlanData() {
    const data = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!data) {
        localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(DEFAULT_PLAN));
        return JSON.parse(JSON.stringify(DEFAULT_PLAN));
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('规划数据解析失败:', e);
        return JSON.parse(JSON.stringify(DEFAULT_PLAN));
    }
}

function savePlanData(data) {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(data));
}

function addPlanItem(category, text) {
    const data = getPlanData();
    const newItem = {
        id: 'p' + Date.now(),
        text: text,
        checked: false
    };
    data[category].push(newItem);
    savePlanData(data);
    return newItem;
}

function deletePlanItem(category, id) {
    const data = getPlanData();
    const index = data[category].findIndex(item => item.id === id);
    if (index === -1) return false;
    data[category].splice(index, 1);
    savePlanData(data);
    return true;
}

// ========================================
// UI 渲染
// ========================================

let planEditMode = false;

function renderPlanList() {
    const container = document.getElementById('planContainer');
    if (!container) return;

    const data = getPlanData();
    const editClass = planEditMode ? ' edit-mode' : '';

    let html = '';
    for (const [key, config] of Object.entries(PLAN_CATEGORIES)) {
        const items = data[key] || [];
        let itemsHtml = items.map(item => 
            '<li>' +
                '<input type="checkbox" id="' + item.id + '" ' + (item.checked ? 'checked' : '') + 
                ' onchange="togglePlanItem(\'' + key + '\', \'' + item.id + '\')">' +
                '<label for="' + item.id + '">' + escapeHtmlPlan(item.text) + '</label>' +
                '<button class="plan-delete-btn" onclick="confirmDeletePlanItem(\'' + key + '\', \'' + item.id + '\')" title="删除">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</li>'
        ).join('');

        html += '<div class="plan-period">' +
            '<h3>' + config.title + '</h3>' +
            '<ul class="plan-list' + editClass + '">' + itemsHtml + '</ul>' +
        '</div>';
    }
    container.innerHTML = html;
}

function togglePlanEditMode() {
    planEditMode = !planEditMode;
    
    const editBtn = document.getElementById('planEditBtn');
    const addBtn = document.getElementById('planAddBtn');
    
    if (planEditMode) {
        editBtn.classList.add('btn-edit-active');
        editBtn.querySelector('span').textContent = '完成';
        addBtn.style.display = 'flex';
    } else {
        editBtn.classList.remove('btn-edit-active');
        editBtn.querySelector('span').textContent = '编辑';
        addBtn.style.display = 'none';
    }
    
    renderPlanList();
}

function togglePlanItem(category, id) {
    const data = getPlanData();
    const item = data[category].find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        savePlanData(data);
    }
}

function confirmDeletePlanItem(category, id) {
    if (confirm('确定要删除这个任务吗？')) {
        deletePlanItem(category, id);
        renderPlanList();
        showToast('🗑️ 任务已删除');
    }
}

// ========================================
// 横向滚动
// ========================================

function scrollPlan(direction) {
    const container = document.getElementById('planScrollWrapper');
    if (!container) return;
    const scrollAmount = 340;
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// ========================================
// 模态框操作
// ========================================

function openPlanItemEditor() {
    document.getElementById('planItemModalTitle').textContent = '➕ 添加任务';
    document.getElementById('planItemText').value = '';
    document.getElementById('planItemCategory').value = 'short';
    showModal('planItemModal');
}

function closePlanItemEditor() {
    hideModal('planItemModal');
}

function savePlanItem() {
    const text = document.getElementById('planItemText').value.trim();
    const category = document.getElementById('planItemCategory').value;

    if (!text) {
        shakeElement(document.getElementById('planItemText'));
        return;
    }

    addPlanItem(category, text);
    closePlanItemEditor();
    renderPlanList();
    showToast('✅ 任务已添加');
}

// ========================================
// 工具函数
// ========================================

function escapeHtmlPlan(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// 初始化
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    renderPlanList();
});

// 导出给全局
window.scrollPlan = scrollPlan;
window.togglePlanEditMode = togglePlanEditMode;
window.togglePlanItem = togglePlanItem;
window.confirmDeletePlanItem = confirmDeletePlanItem;
window.openPlanItemEditor = openPlanItemEditor;
window.closePlanItemEditor = closePlanItemEditor;
window.savePlanItem = savePlanItem;
