/**
 * ========================================
 * 规划管理系统 v2 - plan.js
 * ========================================
 * 新功能：
 * - 任务标签（类型 + 能量值大小）
 * - 今日规划 / 往期规划 分栏
 * - 完成确认 → 触发能力值变化
 * - 快捷选择（常用任务模板）
 * ========================================
 */

// ========================================
// 常量与配置
// ========================================
const PLAN_STORAGE_KEY = 'zhengxiongwen_plan_v2';
const PLAN_COMPLETED_KEY = 'zhengxiongwen_plan_completed';

// 任务类型配置
const TASK_TYPES = {
    '健康': { icon: '💚', label: '健康/运动' },
    '学习': { icon: '📚', label: '学习/阅读' },
    '社交': { icon: '💬', label: '社交/魅力' },
    '创作': { icon: '🎬', label: '创作/剪辑' },
    '其他': { icon: '📌', label: '其他任务' },
};

// 能量值大小
const ENERGY_SIZES = {
    'small':  { label: '小 (+3)', value: 3, icon: '⚡' },
    'medium': { label: '中 (+6)', value: 6, icon: '⚡⚡' },
    'large':  { label: '大 (+10)', value: 10, icon: '⚡⚡⚡' },
};

// 快捷任务模板
const QUICK_TASKS = [
    { text: '跑步 30 分钟', type: '健康', energy: 'medium' },
    { text: '阅读 1 小时', type: '学习', energy: 'small' },
    { text: '完成剪辑作品', type: '创作', energy: 'large' },
    { text: '学习新技能', type: '学习', energy: 'medium' },
    { text: '社交活动', type: '社交', energy: 'small' },
    { text: '完成一项任务', type: '其他', energy: 'small' },
];

// 默认今日规划
const DEFAULT_TODAY_PLAN = [
    { id: 'pt1', text: '完成个人网站功能迭代', type: '创作', energy: 'medium', completed: false, completedAt: null },
    { id: 'pt2', text: '练习视频剪辑 1 小时', type: '创作', energy: 'small', completed: false, completedAt: null },
    { id: 'pt3', text: '阅读《认知天性》30 页', type: '学习', energy: 'small', completed: false, completedAt: null },
];

// ========================================
// 数据操作
// ========================================

/**
 * 获取今日规划
 */
function getTodayPlan() {
    const today = new Date().toISOString().split('T')[0];
    const data = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}');
    
    if (!data[today]) {
        // 首次访问今日，初始化默认规划
        data[today] = JSON.parse(JSON.stringify(DEFAULT_TODAY_PLAN));
        localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(data));
    }
    
    return data[today] || [];
}

/**
 * 保存今日规划
 */
function saveTodayPlan(plan) {
    const today = new Date().toISOString().split('T')[0];
    const data = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}');
    data[today] = plan;
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(data));
}

/**
 * 获取往期规划（最近 7 天）
 */
function getPastPlans() {
    const today = new Date().toISOString().split('T')[0];
    const data = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}');
    const pastPlans = [];
    
    for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        if (data[dateStr]) {
            pastPlans.push({
                date: dateStr,
                tasks: data[dateStr]
            });
        }
    }
    
    return pastPlans;
}

/**
 * 完成任务
 */
function completeTask(taskId) {
    const plan = getTodayPlan();
    const task = plan.find(t => t.id === taskId);
    
    if (!task) return null;
    
    task.completed = true;
    task.completedAt = new Date().toISOString();
    
    saveTodayPlan(plan);
    
    // 触发能力值更新
    if (window.completeTaskUpdateStats) {
        window.completeTaskUpdateStats(task.type, task.energy);
    }
    
    return task;
}

/**
 * 添加任务
 */
function addTodayTask(text, type, energy) {
    const plan = getTodayPlan();
    const newTask = {
        id: 'pt' + Date.now(),
        text: text,
        type: type || '其他',
        energy: energy || 'small',
        completed: false,
        completedAt: null,
        mood: null
    };
    plan.push(newTask);
    saveTodayPlan(plan);
    return newTask;
}

/**
 * 删除任务
 */
function deleteTodayTask(taskId) {
    const plan = getTodayPlan();
    const index = plan.findIndex(t => t.id === taskId);
    if (index === -1) return false;
    plan.splice(index, 1);
    saveTodayPlan(plan);
    return true;
}

// ========================================
// UI 渲染
// ========================================

let planEditMode = false;

/**
 * 渲染今日规划
 */
function renderTodayPlan() {
    const container = document.getElementById('todayPlanList');
    if (!container) return;
    
    const plan = getTodayPlan();
    const completedCount = plan.filter(t => t.completed).length;
    const totalCount = plan.length;
    
    let html = `
        <div class="plan-progress">
            <div class="plan-progress-bar">
                <div class="plan-progress-fill" style="width: ${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%"></div>
            </div>
            <span class="plan-progress-text">${completedCount}/${totalCount}</span>
        </div>
    `;
    
    if (plan.length === 0) {
        html += '<div class="plan-empty">暂无今日规划，点击「添加任务」开始吧！</div>';
    } else {
        html += '<ul class="today-plan-list">';
        plan.forEach(task => {
            const typeConfig = TASK_TYPES[task.type] || TASK_TYPES['其他'];
            const energyConfig = ENERGY_SIZES[task.energy] || ENERGY_SIZES['small'];
            const moodStr = task.mood ? `<span class="task-mood">${task.mood}</span>` : '';
            const moodBg = task.mood ? `<div class="task-mood-background">${task.mood}</div>` : '';
            
            html += `
                <li class="today-plan-item ${task.completed ? 'completed' : ''}">
                    ${moodBg}
                    <div class="task-checkbox" onclick="handleCompleteTask('${task.id}')">
                        ${task.completed ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>'}
                    </div>
                    <div class="task-content">
                        <div class="task-text">${escapeHtmlPlan(task.text)}${moodStr}</div>
                        <div class="task-tags">
                            <span class="task-tag tag-type">${typeConfig.icon} ${typeConfig.label}</span>
                            <span class="task-tag tag-energy">${energyConfig.icon} ${energyConfig.label}</span>
                        </div>
                    </div>
                    ${planEditMode ? `
                        <button class="task-delete-btn" onclick="handleDeleteTask('${task.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </li>
            `;
        });
        html += '</ul>';
    }
    
    container.innerHTML = html;
}

/**
 * 渲染往期规划
 */
function renderPastPlans() {
    const container = document.getElementById('pastPlanList');
    if (!container) return;
    
    const pastPlans = getPastPlans();
    
    if (pastPlans.length === 0) {
        container.innerHTML = '<div class="plan-empty">暂无往期规划记录</div>';
        return;
    }
    
    let html = '';
    pastPlans.forEach(dayPlan => {
        const date = new Date(dayPlan.date + 'T00:00:00');
        const completedCount = dayPlan.tasks.filter(t => t.completed).length;
        const totalCount = dayPlan.tasks.length;
        
        html += `
            <div class="past-plan-day">
                <div class="past-plan-date">
                    <span class="date-day">${date.getDate()}</span>
                    <span class="date-month">${date.getMonth() + 1}月</span>
                </div>
                <div class="past-plan-tasks">
                    <div class="past-plan-progress">完成 ${completedCount}/${totalCount}</div>
                    ${dayPlan.tasks.map(task => {
                        const typeConfig = TASK_TYPES[task.type] || TASK_TYPES['其他'];
                        const moodStr = task.mood ? `<span class="past-task-mood">${task.mood}</span>` : '';
                        return `
                            <div class="past-plan-task ${task.completed ? 'completed' : ''}">
                                <span class="past-task-type">${typeConfig.icon}</span>
                                <span class="past-task-text">${escapeHtmlPlan(task.text)}${moodStr}</span>
                                ${task.completed ? '<i class="fas fa-check task-done-icon"></i>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * 切换编辑模式
 */
function togglePlanEditMode() {
    planEditMode = !planEditMode;
    
    const editBtn = document.getElementById('planEditBtn');
    const addBtn = document.getElementById('planAddBtn');
    const quickBtn = document.getElementById('planQuickBtn');
    
    if (planEditMode) {
        editBtn.classList.add('btn-edit-active');
        editBtn.querySelector('span').textContent = '完成';
        addBtn.style.display = 'flex';
        quickBtn.style.display = 'flex';
    } else {
        editBtn.classList.remove('btn-edit-active');
        editBtn.querySelector('span').textContent = '编辑';
        addBtn.style.display = 'none';
        quickBtn.style.display = 'none';
    }
    
    renderTodayPlan();
}

// ========================================
// 事件处理
// ========================================

let currentCompletingTaskId = null;
let currentSelectedMood = null;

/**
 * 完成任务
 */
function handleCompleteTask(taskId) {
    const plan = getTodayPlan();
    const task = plan.find(t => t.id === taskId);
    
    if (!task || task.completed) return;
    
    // 显示心情选择弹窗
    currentCompletingTaskId = taskId;
    currentSelectedMood = null;
    
    document.getElementById('taskMoodTaskName').textContent = `完成任务：「${task.text}」`;
    
    // 清除心情选中
    document.querySelectorAll('#taskMoodSelector .mood-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    showModal('taskMoodModal');
}

/**
 * 选择任务心情
 */
function selectTaskMood(el) {
    document.querySelectorAll('#taskMoodSelector .mood-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    currentSelectedMood = el.dataset.mood;
}

/**
 * 确认任务心情
 */
function confirmTaskMood() {
    if (!currentCompletingTaskId) return;
    
    const plan = getTodayPlan();
    const task = plan.find(t => t.id === currentCompletingTaskId);
    
    if (task) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
        task.mood = currentSelectedMood;
        saveTodayPlan(plan);
        
        closeTaskMoodPicker();
        renderTodayPlan();
        
        if (window.renderPixelPortrait) {
            window.renderPixelPortrait();
        }
        
        showToast(currentSelectedMood ? `🎉 任务完成！${currentSelectedMood}` : '🎉 任务完成！');
    }
}

/**
 * 关闭任务心情选择器
 */
function closeTaskMoodPicker() {
    hideModal('taskMoodModal');
    currentCompletingTaskId = null;
    currentSelectedMood = null;
}

/**
 * 删除任务
 */
function handleDeleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        deleteTodayTask(taskId);
        renderTodayPlan();
        showToast('🗑️ 任务已删除');
    }
}

/**
 * 打开任务编辑器
 */
function openPlanItemEditor() {
    currentEditPlanItem = null;
    document.getElementById('planItemModalTitle').textContent = '➕ 添加任务';
    document.getElementById('planItemText').value = '';
    document.getElementById('planItemType').value = '其他';
    document.getElementById('planItemEnergy').value = 'small';
    
    // 显示快捷选择
    renderQuickSelect();
    
    showModal('planItemModal');
}

/**
 * 关闭任务编辑器
 */
function closePlanItemEditor() {
    hideModal('planItemModal');
    currentEditPlanItem = null;
}

/**
 * 保存任务
 */
function savePlanItem() {
    const text = document.getElementById('planItemText').value.trim();
    const type = document.getElementById('planItemType').value;
    const energy = document.getElementById('planItemEnergy').value;
    
    if (!text) {
        shakeElement(document.getElementById('planItemText'));
        return;
    }
    
    addTodayTask(text, type, energy);
    closePlanItemEditor();
    renderTodayPlan();
    showToast('✅ 任务已添加');
}

/**
 * 渲染快捷选择
 */
function renderQuickSelect() {
    const container = document.getElementById('quickSelectList');
    if (!container) return;
    
    container.innerHTML = QUICK_TASKS.map((task, index) => `
        <div class="quick-task-item" onclick="selectQuickTask(${index})">
            <span class="quick-task-icon">${TASK_TYPES[task.type].icon}</span>
            <span class="quick-task-text">${task.text}</span>
            <span class="quick-task-energy">${ENERGY_SIZES[task.energy].icon}</span>
        </div>
    `).join('');
}

/**
 * 选择快捷任务
 */
function selectQuickTask(index) {
    const task = QUICK_TASKS[index];
    document.getElementById('planItemText').value = task.text;
    document.getElementById('planItemType').value = task.type;
    document.getElementById('planItemEnergy').value = task.energy;
}

// ========================================
// 横向滚动
// ========================================

function scrollPlan(direction) {
    const container = document.getElementById('planScrollWrapper');
    if (!container) return;
    container.scrollBy({
        left: direction * 360,
        behavior: 'smooth'
    });
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
    renderTodayPlan();
    renderPastPlans();
});

// 导出
window.togglePlanEditMode = togglePlanEditMode;
window.openPlanItemEditor = openPlanItemEditor;
window.closePlanItemEditor = closePlanItemEditor;
window.savePlanItem = savePlanItem;
window.selectQuickTask = selectQuickTask;
window.scrollPlan = scrollPlan;
window.renderTodayPlan = renderTodayPlan;
window.renderPastPlans = renderPastPlans;
