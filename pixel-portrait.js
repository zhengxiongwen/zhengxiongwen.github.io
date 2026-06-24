/**
 * ========================================
 * 个人像素肖像 & 能力值系统 - pixel-portrait.js
 * ========================================
 * RPG 风格个人成长系统
 * 6 项能力：执行力、精力、心情、健康、魅力、智商
 * 
 * 核心机制：
 * - 心情/精力：每日重置为 100
 * - 健康/智商：每日递减（公差=1），完成任务后停止递减并加成
 * - 魅力/执行力：每日递减（公差=2），完成任务后停止递减并加成
 * ========================================
 */

// ========================================
// 常量配置
// ========================================
const STATS_KEY = 'zhengxiongwen_stats';
const STATS_LAST_UPDATE_KEY = 'zhengxiongwen_stats_last_update';

const STATS_CONFIG = {
    mood:        { name: '心情', icon: '😊', max: 100, dailyReset: true,  decay: 0,     decayType: 'none' },
    energy:      { name: '精力', icon: '⚡', max: 100, dailyReset: true,  decay: 0,     decayType: 'none' },
    health:      { name: '健康', icon: '💚', max: 100, dailyReset: false, decay: 1,     decayType: 'arithmetic' },
    intelligence: { name: '智商', icon: '🧠', max: 100, dailyReset: false, decay: 1,     decayType: 'arithmetic' },
    charm:       { name: '魅力', icon: '✨', max: 100, dailyReset: false, decay: 2,     decayType: 'arithmetic' },
    execution:   { name: '执行力', icon: '🎯', max: 100, dailyReset: false, decay: 2,     decayType: 'arithmetic' },
};

// 任务类型 → 影响的能力值映射
const TASK_TYPE_TO_STAT = {
    '健康':  'health',
    '学习':  'intelligence',
    '社交':  'charm',
    '创作':  'execution',
    '运动':  'health',
    '阅读':  'intelligence',
    '其他':  'execution',
};

// 能量值大小配置
const ENERGY_VALUE_CONFIG = {
    'small':  { label: '小 (+3)', value: 3, color: '#52b788' },
    'medium': { label: '中 (+6)', value: 6, color: '#f9c74f' },
    'large':  { label: '大 (+10)', value: 10, color: '#ef5350' },
};

// ========================================
// 数据操作
// ========================================

/**
 * 获取当前能力值（自动处理每日重置/递减）
 */
function getStats() {
    const today = new Date().toISOString().split('T')[0];
    const lastUpdate = localStorage.getItem(STATS_LAST_UPDATE_KEY);
    let stats = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');

    // 初始化
    if (!stats) {
        stats = initializeStats();
        saveStats(stats, today);
        return stats;
    }

    // 跨天处理
    if (lastUpdate !== today) {
        const daysPassed = calculateDaysPassed(lastUpdate, today);
        if (daysPassed > 0) {
            stats = applyDailyDecay(stats, daysPassed);
            // 重置每日重置项
            if (daysPassed >= 1) {
                stats.mood.value = stats.mood.max;
                stats.energy.value = stats.energy.max;
            }
            saveStats(stats, today);
        }
    }

    return stats;
}

/**
 * 初始化能力值
 */
function initializeStats() {
    const stats = {};
    for (const [key, config] of Object.entries(STATS_CONFIG)) {
        stats[key] = {
            value: config.max,
            max: config.max,
            decayDays: 0,  // 连续未完成天数
        };
    }
    return stats;
}

/**
 * 计算两天之间间隔天数
 */
function calculateDaysPassed(dateStr1, dateStr2) {
    if (!dateStr1) return 1;
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffMs = d2 - d1;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 应用每日递减
 */
function applyDailyDecay(stats, days) {
    for (let day = 0; day < days; day++) {
        for (const [key, config] of Object.entries(STATS_CONFIG)) {
            if (config.dailyReset) continue;  // 每日重置项不递减
            if (stats[key].decayDays >= 0) {
                // decayDays > 0 表示昨天有未完成 → 继续递减
                const decayAmount = config.decay * (stats[key].decayDays + 1);
                stats[key].value = Math.max(0, stats[key].value - decayAmount);
                stats[key].decayDays++;
            }
            // decayDays < 0 表示昨天已完成对应任务 → 重置递减计数
            if (stats[key].decayDays < 0) {
                stats[key].decayDays = 0;  // 重置，从明天开始重新计递减
            }
        }
    }
    return stats;
}

/**
 * 完成任务 → 更新能力值
 * @param {string} taskType - 任务类型（健康/学习/社交/其他）
 * @param {string} energySize - 能量值大小（small/medium/large）
 */
function completeTaskUpdateStats(taskType, energySize) {
    const stats = getStats();
    const statKey = TASK_TYPE_TO_STAT[taskType] || 'execution';
    const energyConfig = ENERGY_VALUE_CONFIG[energySize] || ENERGY_VALUE_CONFIG['small'];

    // 更新对应能力值
    const stat = stats[statKey];
    stat.value = Math.min(stat.max, stat.value + energyConfig.value);
    
    // 重置递减计数（用负数表示今天已完成，-1 表示今天完成，明天若未完成则从 0 开始递减）
    stat.decayDays = -1;

    // 如果是「其他」类型，也影响执行力
    if (taskType === '其他') {
        stats.execution.value = Math.min(stats.execution.max, stats.execution.value + Math.ceil(energyConfig.value / 2));
        stats.execution.decayDays = -1;
    }

    saveStats(stats, new Date().toISOString().split('T')[0]);
    return stats;
}

/**
 * 保存能力值
 */
function saveStats(stats, date) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    localStorage.setItem(STATS_LAST_UPDATE_KEY, date);
}

// ========================================
// UI 渲染
// ========================================

/**
 * 渲染像素肖像面板
 */
function renderPixelPortrait() {
    const container = document.getElementById('pixelPortrait');
    if (!container) return;

    const stats = getStats();

    let statsHtml = '';
    for (const [key, config] of Object.entries(STATS_CONFIG)) {
        const stat = stats[key];
        const percentage = (stat.value / stat.max) * 100;
        const barColor = getStatBarColor(percentage);
        
        statsHtml += `
            <div class="stat-item" data-stat="${key}">
                <div class="stat-icon">${config.icon}</div>
                <div class="stat-info">
                    <div class="stat-name">${config.name}</div>
                    <div class="stat-bar-container">
                        <div class="stat-bar ${barColor}" style="width: ${percentage}%"></div>
                        <div class="stat-bar-glow" style="width: ${percentage}%"></div>
                    </div>
                    <div class="stat-value">${stat.value}/${stat.max}</div>
                </div>
                ${stat.decayDays > 2 ? '<div class="stat-warning" title="连续未完成，正在递减！">⚠️</div>' : ''}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="pixel-portrait-panel">
            <div class="portrait-header">
                <h3>🧑‍💻 个人状态</h3>
                <span class="portrait-date">${new Date().toLocaleDateString('zh-CN')}</span>
            </div>
            <div class="portrait-avatar">
                <div class="pixel-character">
                    <!-- 像素角色（CSS 绘制） -->
                    <div class="pixel-head"></div>
                    <div class="pixel-body"></div>
                    <div class="pixel-legs"></div>
                </div>
                <div class="portrait-level">
                    Lv.${calculateLevel(stats)}
                </div>
            </div>
            <div class="stats-container">
                ${statsHtml}
            </div>
        </div>
    `;
}

/**
 * 根据百分比获取能量条颜色
 */
function getStatBarColor(percentage) {
    if (percentage >= 70) return 'stat-bar-high';
    if (percentage >= 40) return 'stat-bar-mid';
    return 'stat-bar-low';
}

/**
 * 计算等级（所有能力值平均值）
 */
function calculateLevel(stats) {
    const values = Object.values(stats).map(s => s.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.floor(avg / 10) + 1;
}

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    renderPixelPortrait();
});

// 导出
window.getStats = getStats;
window.completeTaskUpdateStats = completeTaskUpdateStats;
window.renderPixelPortrait = renderPixelPortrait;
window.ENERGY_VALUE_CONFIG = ENERGY_VALUE_CONFIG;
window.TASK_TYPE_TO_STAT = TASK_TYPE_TO_STAT;
