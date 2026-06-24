/**
 * ========================================
 * 移动端优化 - mobile-optimize.js
 * ========================================
 * 功能：优化触摸交互、手势支持、移动端适配
 * ========================================
 */

// ========================================
// 触摸手势支持
// ========================================

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isSwiping = false;

/**
 * 初始化触摸手势
 */
function initTouchGestures() {
    const scrollContainers = document.querySelectorAll('.horizontal-scroll');
    
    scrollContainers.forEach(container => {
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
    });
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
}

function handleTouchMove(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const diffX = touchStartX - touchX;
    const diffY = touchStartY - touchY;
    
    // 判断是否为横向滑动
    if (Math.abs(diffX) > Math.abs(diffY)) {
        isSwiping = true;
    }
}

function handleTouchEnd(e) {
    if (!isSwiping) return;
    
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    
    handleSwipeGesture();
}

function handleSwipeGesture() {
    const diffX = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    
    if (Math.abs(diffX) > minSwipeDistance) {
        // 左滑：下一个
        if (diffX > 0) {
            scrollActiveContainer(1);
        } else {
            // 右滑：上一个
            scrollActiveContainer(-1);
        }
    }
    
    // 重置
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
    isSwiping = false;
}

function scrollActiveContainer(direction) {
    const activeElement = document.activeElement;
    let container = null;
    
    // 找到当前焦点所在的横向滚动容器
    if (activeElement) {
        container = activeElement.closest('.horizontal-scroll');
    }
    
    // 如果没找到，默认使用第一个
    if (!container) {
        container = document.querySelector('.horizontal-scroll');
    }
    
    if (container) {
        const scrollAmount = 340;
        container.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }
}

// ========================================
// 移动端 UI 优化
// ========================================

/**
 * 检测是否为移动设备
 */
function isMobileDevice() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
}

/**
 * 应用移动端优化
 */
function applyMobileOptimizations() {
    if (!isMobileDevice()) return;
    
    // 1. 增大可点击区域
    const clickableElements = document.querySelectorAll('.nav-arrow, .journal-write-btn, .task-checkbox, .plan-delete-btn');
    clickableElements.forEach(el => {
        el.style.minWidth = '44px';
        el.style.minHeight = '44px';
    });
    
    // 2. 优化模态框全屏显示
    const modals = document.querySelectorAll('.modal-content');
    modals.forEach(modal => {
        modal.style.maxHeight = '95vh';
        modal.style.margin = '2.5vh 1rem';
    });
    
    // 3. 禁用双击缩放（iOS）
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // 4. 优化滚动性能
    document.querySelectorAll('.horizontal-scroll').forEach(container => {
        container.style.webkitOverflowScrolling = 'touch';
        container.style.scrollBehavior = 'smooth';
    });
    
    // 5. 添加下拉刷新提示（可选）
    addPullToRefreshHint();
}

/**
 * 添加下拉刷新提示
 */
function addPullToRefreshHint() {
    let startY = 0;
    let pullDistance = 0;
    const threshold = 100;
    
    const hint = document.createElement('div');
    hint.className = 'pull-to-refresh-hint';
    hint.innerHTML = '<span class="hint-icon">↓</span> 下拉刷新';
    hint.style.cssText = `
        position: fixed;
        top: -50px;
        left: 0;
        right: 0;
        height: 50px;
        background: rgba(82, 183, 136, 0.95);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        z-index: 100001;
        transition: top 300ms ease;
    `;
    document.body.appendChild(hint);
    
    document.addEventListener('touchstart', e => {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', e => {
        if (window.scrollY > 0 || !startY) return;
        
        pullDistance = e.touches[0].clientY - startY;
        
        if (pullDistance > 0 && pullDistance < threshold * 2) {
            hint.style.top = Math.min(pullDistance / 2, threshold) - 50 + 'px';
            
            if (pullDistance > threshold) {
                hint.innerHTML = '<span class="hint-icon">↑</span> 释放刷新';
            } else {
                hint.innerHTML = '<span class="hint-icon">↓</span> 下拉刷新';
            }
        }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
        if (pullDistance > threshold) {
            hint.innerHTML = '⟳ 刷新中...';
            setTimeout(() => {
                location.reload();
            }, 500);
        }
        
        hint.style.top = '-50px';
        startY = 0;
        pullDistance = 0;
    }, { passive: true });
}

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    initTouchGestures();
    applyMobileOptimizations();
    
    // 窗口大小改变时重新检测
    window.addEventListener('resize', debounce(() => {
        applyMobileOptimizations();
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
window.initTouchGestures = initTouchGestures;
window.applyMobileOptimizations = applyMobileOptimizations;
