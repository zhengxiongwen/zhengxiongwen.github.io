/**
 * ========================================
 * 核心动画引擎 - animation-engine.js
 * ========================================
 * 性能优化 + 基础框架
 * 
 * 特性：
 * - GPU 加速属性（transform, opacity）
 * - will-change 智能标记
 * - requestAnimationFrame 动画循环
 * - prefers-reduced-motion 支持
 * - FPS 监控与自动降级（<55fps 暂停非关键动画）
 * ========================================
 */

const AnimationEngine = {
    // 配置
    config: {
        targetFPS: 60,
        minFPSThreshold: 55,
        performanceSampleSize: 60,
        reducedMotionThreshold: 0.5 // seconds
    },
    
    // 状态
    state: {
        fps: 60,
        avgFPS: 60,
        frameCount: 0,
        lastTime: 0,
        isRunning: false,
        isPaused: false,
        reducedMotion: false,
        fpsHistory: [],
        animationCallbacks: [],
        criticalAnimations: new Set()
    },
    
    // 初始化
    init() {
        // 检测 prefers-reduced-motion
        this.checkReducedMotion();
        
        // 监听媒体查询变化
        if (window.matchMedia) {
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.state.reducedMotion = e.matches;
                if (e.matches) {
                    this.pauseAllAnimations();
                } else {
                    this.resumeAllAnimations();
                }
            });
        }
        
        // 启动 FPS 监控
        this.startFPSMonitor();
        
        console.log('🎬 动画引擎已初始化', this.state.reducedMotion ? '(reduced motion 模式)' : '');
    },
    
    // 检测 prefers-reduced-motion
    checkReducedMotion() {
        this.state.reducedMotion = window.matchMedia && 
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    
    // FPS 监控
    startFPSMonitor() {
        const measureFPS = (timestamp) => {
            if (!this.state.lastTime) {
                this.state.lastTime = timestamp;
            }
            
            const delta = timestamp - this.state.lastTime;
            const fps = Math.round(1000 / delta);
            
            this.state.fps = fps;
            this.state.fpsHistory.push(fps);
            
            if (this.state.fpsHistory.length > this.config.performanceSampleSize) {
                this.state.fpsHistory.shift();
            }
            
            // 计算平均 FPS
            this.state.avgFPS = Math.round(
                this.state.fpsHistory.reduce((a, b) => a + b, 0) / this.state.fpsHistory.length
            );
            
            // FPS 低于阈值时暂停非关键动画
            if (this.state.avgFPS < this.config.minFPSThreshold && !this.state.isPaused) {
                this.pauseNonCriticalAnimations();
            } else if (this.state.avgFPS >= this.config.minFPSThreshold && this.state.isPaused) {
                this.resumeNonCriticalAnimations();
            }
            
            this.state.lastTime = timestamp;
            this.state.frameCount++;
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    },
    
    // 暂停非关键动画
    pauseNonCriticalAnimations() {
        this.state.isPaused = true;
        console.warn('⚠️ FPS 低于 ' + this.config.minFPSThreshold + '，暂停非关键动画');
        
        this.state.animationCallbacks.forEach(callback => {
            if (!this.state.criticalAnimations.has(callback.id)) {
                callback.paused = true;
            }
        });
        
        document.body.classList.add('animations-paused');
    },
    
    // 恢复非关键动画
    resumeNonCriticalAnimations() {
        this.state.isPaused = false;
        console.log('✅ FPS 恢复正常，恢复动画');
        
        this.state.animationCallbacks.forEach(callback => {
            callback.paused = false;
        });
        
        document.body.classList.remove('animations-paused');
    },
    
    // 暂停所有动画
    pauseAllAnimations() {
        document.body.classList.add('animations-reduced');
        console.log('⏸️ 已暂停所有动画 (reduced motion)');
    },
    
    // 恢复所有动画
    resumeAllAnimations() {
        document.body.classList.remove('animations-reduced');
        console.log('▶️ 已恢复所有动画');
    },
    
    // 注册动画回调
    registerAnimation(callback, options = {}) {
        const id = Symbol('animation');
        const animationObj = {
            id,
            callback,
            priority: options.priority || 'normal',
            paused: false
        };
        
        if (options.critical) {
            this.state.criticalAnimations.add(id);
        }
        
        this.state.animationCallbacks.push(animationObj);
        
        return () => {
            const index = this.state.animationCallbacks.indexOf(animationObj);
            if (index > -1) {
                this.state.animationCallbacks.splice(index, 1);
                this.state.criticalAnimations.delete(id);
            }
        };
    },
    
    // GPU 加速 helper
    enableGPU(element) {
        element.style.willChange = 'transform, opacity';
        // 动画结束后移除 will-change
        setTimeout(() => {
            if (element.style.willChange) {
                element.style.willChange = 'auto';
            }
        }, 300);
    },
    
    // 创建 RAF 动画
    animate(options) {
        const { duration, easing = 'easeOutCubic', onUpdate, onComplete, critical = false } = options;
        
        if (this.state.reducedMotion) {
            // reduced motion 模式：直接跳到最终状态
            if (onUpdate) onUpdate(1);
            if (onComplete) onComplete();
            return () => {};
        }
        
        const easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInCubic: t => t * t * t,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeOutQuart: t => 1 - (--t) * t * t * t,
            spring: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            bounce: t => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) return n1 * t * t;
                if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
                if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        };
        
        const easingFn = typeof easing === 'function' ? easing : easingFunctions[easing] || easingFunctions.easeOutCubic;
        
        let startTime = null;
        let animationId = null;
        let isPaused = false;
        let pauseTime = 0;
        
        const animate = (timestamp) => {
            if (isPaused) {
                animationId = requestAnimationFrame(animate);
                return;
            }
            
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime + pauseTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easingFn(progress);
            
            if (onUpdate) onUpdate(easedProgress);
            
            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                if (onComplete) onComplete();
            }
        };
        
        animationId = requestAnimationFrame(animate);
        
        return () => {
            cancelAnimationFrame(animationId);
            isPaused = true;
        };
    },
    
    // 批量动画（交错执行）
    staggerAnimate(elements, options) {
        const { duration = 300, delay = 50, easing = 'easeOutCubic', onUpdate, onComplete } = options;
        
        if (this.state.reducedMotion) {
            elements.forEach(el => onUpdate && onUpdate(el, 1));
            if (onComplete) onComplete();
            return () => {};
        }
        
        const cleanups = [];
        let completed = 0;
        
        elements.forEach((element, index) => {
            const cleanup = this.animate({
                duration,
                delay: index * delay,
                easing,
                onUpdate: (progress) => onUpdate && onUpdate(element, progress),
                onComplete: () => {
                    completed++;
                    if (completed === elements.length && onComplete) {
                        onComplete();
                    }
                }
            });
            cleanups.push(cleanup);
        });
        
        return () => cleanups.forEach(fn => fn());
    }
};

// ========================================
// 工具函数
// ========================================

// 防止滥用 will-change
const GPUOptimizer = {
    mark(element, property = 'transform') {
        element.style.willChange = property;
    },
    
    unmark(element) {
        setTimeout(() => {
            element.style.willChange = 'auto';
        }, 1000);
    },
    
    markAll(elements, property = 'transform') {
        elements.forEach(el => this.mark(el, property));
    }
};

// ========================================
// CSS 变量注入
// ========================================

const injectAnimationCSS = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        
        /* 动画暂停状态 */
        .animations-paused *,
        .animations-paused *::before,
        .animations-paused *::after {
            animation-play-state: paused !important;
            transition-duration: 0.01ms !important;
        }
        
        /* Reduced motion 状态 */
        .animations-reduced *,
        .animations-reduced *::before,
        .animations-reduced *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
        
        /* GPU 加速提示 */
        .gpu-accelerated {
            transform: translateZ(0);
            backface-visibility: hidden;
        }
        
        /* 滚动触发动画初始状态 */
        .scroll-reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                        transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .scroll-reveal.revealed {
            opacity: 1;
            transform: translateY(0);
        }
        
        .scroll-reveal-left {
            opacity: 0;
            transform: translateX(-30px);
            transition: opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                        transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .scroll-reveal-left.revealed {
            opacity: 1;
            transform: translateX(0);
        }
        
        .scroll-reveal-right {
            opacity: 0;
            transform: translateX(30px);
            transition: opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                        transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .scroll-reveal-right.revealed {
            opacity: 1;
            transform: translateX(0);
        }
        
        .scroll-reveal-scale {
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                        transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .scroll-reveal-scale.revealed {
            opacity: 1;
            transform: scale(1);
        }
    `;
    document.head.appendChild(style);
};

// ========================================
// 初始化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    injectAnimationCSS();
    AnimationEngine.init();
});

// 导出
window.AnimationEngine = AnimationEngine;
window.GPUOptimizer = GPUOptimizer;
