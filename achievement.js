/**
 * ========================================
 * 成就系统 - achievement.js
 * ========================================
 * 功能：追踪连续完成任务，解锁成就徽章
 * 存储：localStorage
 * ========================================
 */

// ========================================
// 成就配置
// ========================================
const ACHIEVEMENTS_CONFIG = {
    'first_task': {
        name: '初次尝试',
        description: '完成第一个任务',
        icon: '🎉',
        condition: (stats) => stats.totalCompleted >= 1
    },
    '3_day_streak': {
        name: '三天打鱼',
        description: '连续 3 天完成至少 1 个任务',
        icon: '🔥',
        condition: (stats) => stats.currentStreak >= 3
    },
    '7_day_streak': {
        name: '一周坚持',
        description: '连续 7 天完成至少 1 个任务',
        icon: '⚡',
        condition: (stats) => stats.currentStreak >= 7
    },
    '30_day_streak': {
        name: '月度达人',
        description: '连续 30 天完成至少 1 个任务',
        icon: '🌟',
        condition: (stats) => stats.currentStreak >= 30
    },
    '100_tasks': {
        name: '百 task 斩',
        description: '累计完成 100 个任务',
        icon: '💯',
        condition: (stats) => stats.totalCompleted >= 100
    },
    'health_master': {
        name: '健康大师',
        description: '健康值达到 95 以上',
        icon: '💚',
        condition: (stats) => stats.stats && stats.stats.health && stats.stats.health.value >= 95
    },
    'all_max': {
        name: '全面进化',
        description: '所有能力值达到 90 以上',
        icon: '🧬',
        condition: (stats) => {
            if (!stats.stats) return false;
            const values = Object.values(stats.stats).map(s => s.value);
            return values.every(v => v >= 90);
        }
    },
    'early_bird': {
        name: '早起小鸟',
        description: '在早上 8 点前完成任务',
        icon: '🐦',
        condition: (stats) => stats.lastCompletedHour !== null && stats.lastCompletedHour < 8
    }
};

const ACHIEVEMENTS_KEY = 'zhengxiongwen_achievements';
const ACHIEVEMENTS_STATS_KEY = 'zhengxiongwen_achievements_stats';

// ========================================
// 数据操作
// ========================================

/**
 * 获取已解锁成就
 */
function getUnlockedAchievements() {
    try {
        return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * 保存已解锁成就
 */
function saveUnlockedAchievements(unlocked) {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
}

/**
 * 获取成就统计
 */
function getAchievementStats() {
    try {
        return JSON.parse(localStorage.getItem(ACHIEVEMENTS_STATS_KEY) || 'null') || {
            totalCompleted: 0,
            currentStreak: 0,
            lastCompletedDate: null,
            lastCompletedHour: null,
            stats: null
        };
    } catch (e) {
        return {
            totalCompleted: 0,
            currentStreak: 0,
            lastCompletedDate: null,
            lastCompletedHour: null,
            stats: null
        };
    }
}

/**
 * 更新成就统计（每次完成任务时调用）
 */
function updateAchievementStats() {
    const stats = getAchievementStats();
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // 更新总完成数
    const plan = getTodayPlan ? getTodayPlan() : [];
    stats.totalCompleted = (stats.totalCompleted || 0) + 1;
    
    // 更新连续天数
    if (stats.lastCompletedDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (stats.lastCompletedDate === yesterdayStr) {
            stats.currentStreak = (stats.currentStreak || 0) + 1;
        } else if (stats.lastCompletedDate !== today) {
            stats.currentStreak = 1;
        }
        
        stats.lastCompletedDate = today;
    }
    
    // 更新完成时刻
    stats.lastCompletedHour = hour;
    
    // 更新当前能力值
    stats.stats = getStats ? getStats() : null;
    
    localStorage.setItem(ACHIEVEMENTS_STATS_KEY, JSON.stringify(stats));
    
    // 检查新解锁成就
    checkAchievements();
    
    return stats;
}

/**
 * 检查并解锁新成就
 */
function checkAchievements() {
    const unlocked = getUnlockedAchievements();
    const stats = getAchievementStats();
    
    let newUnlocked = false;
    
    for (const [id, config] of Object.entries(ACHIEVEMENTS_CONFIG)) {
        if (unlocked.includes(id)) continue; // 已解锁
        
        if (config.condition(stats)) {
            unlocked.push(id);
            newUnlocked = true;
            showAchievementNotification(id, config);
        }
    }
    
    if (newUnlocked) {
        saveUnlockedAchievements(unlocked);
        if (window.renderAchievements) {
            window.renderAchievements();
        }
    }
}

// ========================================
// UI 渲染
// ========================================

/**
 * 渲染成就面板
 */
function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;
    
    const unlocked = getUnlockedAchievements();
    const totalCount = Object.keys(ACHIEVEMENTS_CONFIG).length;
    
    let html = `
        <div class="achievements-header">
            <h3>🏆 成就徽章</h3>
            <span class="achievements-progress">${unlocked.length}/${totalCount}</span>
        </div>
        <div class="achievements-grid">
    `;
    
    for (const [id, config] of Object.entries(ACHIEVEMENTS_CONFIG)) {
        const isUnlocked = unlocked.includes(id);
        html += `
            <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}" 
                 title="${config.description}">
                <div class="badge-icon">${isUnlocked ? config.icon : '🔒'}</div>
                <div class="badge-name">${isUnlocked ? config.name : '???'}</div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * 显示成就解锁通知
 */
function showAchievementNotification(id, config) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notification-icon">${config.icon}</div>
        <div class="achievement-notification-content">
            <div class="achievement-notification-title">🎉 成就解锁！</div>
            <div class="achievement-notification-name">${config.name}</div>
            <div class="achievement-notification-desc">${config.description}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 触发动画
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // 5 秒后消失
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
    
    // 播放音效（可选）
    playAchievementSound();
}

/**
 * 播放成就解锁音效
 */
function playAchievementSound() {
    // 使用 Web Audio API 生成简单的提示音
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        // 音效播放失败，忽略
    }
}

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    renderAchievements();
});

// 导出
window.renderAchievements = renderAchievements;
window.updateAchievementStats = updateAchievementStats;
window.getUnlockedAchievements = getUnlockedAchievements;
