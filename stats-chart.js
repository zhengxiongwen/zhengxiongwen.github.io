/**
 * ========================================
 * 数据统计图表 - stats-chart.js
 * ========================================
 * 功能：显示能力值变化趋势图表
 * 使用 Canvas 绘制（无依赖）
 * ========================================
 */

// ========================================
// 常量配置
// ========================================
const STATS_HISTORY_KEY = 'zhengxiongwen_stats_history';

// 颜色配置
const CHART_COLORS = {
    mood: '#52b788',
    energy: '#f9c74f',
    health: '#ef5350',
    intelligence: '#81c784',
    charm: '#ce93d8',
    execution: '#ffb74d'
};

// ========================================
// 数据操作
// ========================================

/**
 * 保存今日能力值快照（每天首次调用时保存）
 */
function saveStatsSnapshot() {
    const today = new Date().toISOString().split('T')[0];
    const history = getStatsHistory();
    
    // 检查今天是否已有快照
    if (history.length > 0 && history[history.length - 1].date === today) {
        return; // 今天已保存
    }
    
    const stats = getStats ? getStats() : null;
    if (!stats) return;
    
    const snapshot = {
        date: today,
        timestamp: Date.now(),
        values: {}
    };
    
    for (const [key, stat] of Object.entries(stats)) {
        snapshot.values[key] = stat.value;
    }
    
    history.push(snapshot);
    
    // 只保留最近 30 天
    if (history.length > 30) {
        history.splice(0, history.length - 30);
    }
    
    localStorage.setItem(STATS_HISTORY_KEY, JSON.stringify(history));
}

/**
 * 获取能力值历史记录
 */
function getStatsHistory() {
    try {
        return JSON.parse(localStorage.getItem(STATS_HISTORY_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

// ========================================
// 图表渲染
// ========================================

/**
 * 渲染能力值趋势图表
 */
function renderStatsChart() {
    const canvas = document.getElementById('statsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const history = getStatsHistory();
    
    if (history.length < 2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('至少需要 2 天的数据才能显示趋势', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // 设置画布尺寸
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }
    
    // 绘制 X 轴标签（日期）
    ctx.fillStyle = '#aaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    
    const maxLabels = 7;
    const step = Math.ceil(history.length / maxLabels);
    
    for (let i = 0; i < history.length; i += step) {
        const x = padding.left + (chartWidth / (history.length - 1)) * i;
        const date = new Date(history[i].date + 'T00:00:00');
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(label, x, height - padding.bottom + 20);
    }
    
    // 绘制 Y 轴标签（数值）
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        const value = 100 - (i * 20);
        ctx.fillText(value.toString(), padding.left - 10, y + 4);
    }
    
    // 绘制图例
    const legendX = width - padding.right - 150;
    const legendY = padding.top - 20;
    let legendIndex = 0;
    
    for (const [key, config] of Object.entries(STATS_CONFIG)) {
        const x = legendX + (legendIndex % 2) * 75;
        const y = legendY + Math.floor(legendIndex / 2) * 18;
        
        ctx.fillStyle = CHART_COLORS[key];
        ctx.fillRect(x, y - 8, 12, 12);
        
        ctx.fillStyle = '#ccc';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(config.name, x + 16, y + 3);
        
        legendIndex++;
    }
    
    // 绘制折线
    const statsKeys = Object.keys(STATS_CONFIG);
    
    statsKeys.forEach((key, index) => {
        ctx.strokeStyle = CHART_COLORS[key];
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        history.forEach((snapshot, i) => {
            const x = padding.left + (chartWidth / (history.length - 1)) * i;
            const value = snapshot.values[key] || 0;
            const y = padding.top + chartHeight - (value / 100) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 绘制数据点
        ctx.fillStyle = CHART_COLORS[key];
        history.forEach((snapshot, i) => {
            const x = padding.left + (chartWidth / (history.length - 1)) * i;
            const value = snapshot.values[key] || 0;
            const y = padding.top + chartHeight - (value / 100) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}

/**
 * 渲染统计摘要
 */
function renderStatsSummary() {
    const container = document.getElementById('statsSummary');
    if (!container) return;
    
    const history = getStatsHistory();
    const currentStats = getStats ? getStats() : null;
    
    if (!currentStats || history.length === 0) {
        container.innerHTML = '<div class="stats-empty">暂无数据</div>';
        return;
    }
    
    const firstSnapshot = history[0];
    const latestSnapshot = history[history.length - 1];
    
    let html = '<div class="stats-summary-grid">';
    
    for (const [key, config] of Object.entries(STATS_CONFIG)) {
        const currentValue = currentStats[key].value;
        const firstValue = firstSnapshot.values[key] || 0;
        const change = currentValue - firstValue;
        const changePercent = firstValue > 0 ? ((change / firstValue) * 100).toFixed(1) : 0;
        
        html += `
            <div class="stats-summary-item">
                <div class="summary-icon">${config.icon}</div>
                <div class="summary-info">
                    <div class="summary-name">${config.name}</div>
                    <div class="summary-value">${currentValue}</div>
                    <div class="summary-change ${change >= 0 ? 'positive' : 'negative'}">
                        ${change >= 0 ? '+' : ''}${change} (${changePercent}%)
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// 自动保存快照（每天首次访问时）
// ========================================
(function() {
    const today = new Date().toISOString().split('T')[0];
    const lastSnapshotDate = localStorage.getItem('zhengxiongwen_last_snapshot_date');
    
    if (lastSnapshotDate !== today) {
        saveStatsSnapshot();
        localStorage.setItem('zhengxiongwen_last_snapshot_date', today);
    }
})();

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    renderStatsChart();
    renderStatsSummary();
    
    // 窗口大小改变时重绘
    window.addEventListener('resize', debounce(() => {
        renderStatsChart();
    }, 300));
});

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), wait);
    };
}

// 导出
window.renderStatsChart = renderStatsChart;
window.renderStatsSummary = renderStatsSummary;
window.getStatsHistory = getStatsHistory;
