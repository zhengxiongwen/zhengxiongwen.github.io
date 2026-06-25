/**
 * ========================================
 * 高级动效系统 - script.js
 * ========================================
 * 
 * 包含：
 * 1. 滚动驱动叙事动效
 * 2. 微交互系统
 * 3. 氛围美学动效
 * 
 * 基于 animation-engine.js 的性能框架
 * ========================================
 */

// ========================================
// 全局状态
// ========================================
const AdvancedAnimations = {
    state: {
        scrollY: 0,
        scrollProgress: 0,
        isIdle: false,
        idleTimer: null,
        idleTimeout: 5000,
        lastMouseX: 0,
        lastMouseY: 0,
        mouseTrail: [],
        particles: [],
        isReducedMotion: false
    },
    
    // 初始化
    init() {
        // 检测 reduced motion
        this.state.isReducedMotion = window.matchMedia && 
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (this.state.isReducedMotion) {
            console.log('🎬 高级动效已禁用 (reduced motion)');
            return;
        }
        
        // 启动所有系统
        this.initScrollObserver();
        this.initParallax();
        this.initScrollProgress();
        this.initMicroInteractions();
        this.initCustomCursor();
        this.initAmbientParticles();
        this.initCursorTrail();
        this.initIdleAnimation();
        this.initHeroAnimation();
        
        console.log('🎬 高级动效系统已初始化');
    },
    
    // ========================================
    // 滚动驱动叙事系统
    // ========================================
    
    initScrollObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -100px 0px', // 进入视口前 100px 开始动画
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    
                    // 交错动画
                    const revealElements = entry.target.querySelectorAll('.stagger-item');
                    if (revealElements.length > 0) {
                        AnimationEngine.staggerAnimate(Array.from(revealElements), {
                            duration: 400,
                            delay: 50,
                            easing: 'easeOutCubic'
                        });
                    }
                } else {
                    // 可选：离开视口时反向动画
                    // entry.target.classList.remove('revealed');
                }
            });
        }, observerOptions);
        
        // 观察所有滚动触发动画元素
        document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale').forEach(el => {
            observer.observe(el);
        });
        
        // 也观察 section
        document.querySelectorAll('section.section').forEach(el => {
            el.classList.add('scroll-reveal');
            observer.observe(el);
        });
    },
    
    initParallax() {
        // 视差元素
        const parallaxBackground = document.querySelectorAll('.hero-decoration, .hero-bg');
        const parallaxForeground = document.querySelectorAll('.hero-content');
        
        const handleParallax = () => {
            this.state.scrollY = window.scrollY;
            this.state.scrollProgress = this.state.scrollY / (document.body.scrollHeight - window.innerHeight);
            
            // 背景 0.3 倍速
            parallaxBackground.forEach(el => {
                const speed = 0.3;
                const yPos = -(this.state.scrollY * speed);
                el.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
            
            // 前景 0.8 倍速
            parallaxForeground.forEach(el => {
                const speed = 0.8;
                const yPos = -(this.state.scrollY * speed);
                el.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        };
        
        // 使用 RAF 优化
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleParallax();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        // 初始执行
        handleParallax();
    },
    
    initScrollProgress() {
        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress-bar';
        progressBar.innerHTML = '<div class="progress-fill"></div>';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            z-index: 10001;
            background: rgba(82, 183, 136, 0.2);
        `;
        progressBar.querySelector('.progress-fill').style.cssText = `
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #52b788, #81c784);
            transition: width 0.1s ease-out;
            box-shadow: 0 0 10px rgba(82, 183, 136, 0.5);
        `;
        document.body.appendChild(progressBar);
        
        // 导航栏变形（25% 时）
        const navbar = document.querySelector('.navbar');
        const heroHeight = document.querySelector('.hero')?.offsetHeight || 0;
        const navbarThreshold = heroHeight * 0.25;
        
        const handleNavTransform = () => {
            const scrollY = window.scrollY;
            
            // 滚动进度条（75% 时填满）
            if (this.state.scrollProgress >= 0.75) {
                const fillProgress = (this.state.scrollProgress - 0.75) / 0.25;
                progressBar.querySelector('.progress-fill').style.width = `${fillProgress * 100}%`;
            } else {
                progressBar.querySelector('.progress-fill').style.width = '0%';
            }
            
            // 导航栏变形
            if (scrollY > navbarThreshold) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        };
        
        window.addEventListener('scroll', handleNavTransform, { passive: true });
        
        // 添加导航栏变形样式
        const style = document.createElement('style');
        style.textContent = `
            .navbar-scrolled {
                padding: 0.5rem 2rem !important;
                backdrop-filter: blur(20px) !important;
                background-color: rgba(15, 32, 24, 0.95) !important;
            }
            
            .navbar-scrolled .nav-brand {
                font-size: 1.2rem;
            }
            
            .navbar-scrolled .nav-links {
                gap: 1rem;
            }
            
            .navbar-scrolled .nav-links a {
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    },
    
    // ========================================
    // 微交互系统
    // ========================================
    
    initMicroInteractions() {
        // 卡片悬停效果
        this.initCardHover();
        
        // 按钮悬停效果
        this.initButtonHover();
        
        // 链接悬停效果
        this.initLinkHover();
    },
    
    initCardHover() {
        document.querySelectorAll('.card, .plan-item, .journal-item, .book-card, .social-card, .resource-item').forEach(card => {
            // 鼠标进入
            card.addEventListener('mouseenter', (e) => {
                if (this.state.isReducedMotion) return;
                
                AnimationEngine.animate({
                    duration: 300,
                    easing: 'spring',
                    onUpdate: (progress) => {
                        card.style.transform = `translateY(-8px) scale(${1 + progress * 0.02})`;
                        card.style.boxShadow = `
                            0 ${20 + progress * 10}px ${40 + progress * 20}px rgba(0, 0, 0, ${0.2 + progress * 0.1}),
                            0 0 ${30 + progress * 20}px rgba(82, 183, 136, ${0.1 + progress * 0.1})
                        `;
                    }
                });
            });
            
            // 鼠标离开
            card.addEventListener('mouseleave', (e) => {
                if (this.state.isReducedMotion) return;
                
                AnimationEngine.animate({
                    duration: 400,
                    easing: 'spring',
                    onUpdate: (progress) => {
                        card.style.transform = `translateY(${-8 * (1 - progress)}px) scale(${1.02 - progress * 0.02})`;
                        card.style.boxShadow = `
                            0 ${20 * (1 - progress)}px ${40 * (1 - progress)}px rgba(0, 0, 0, ${0.2 * (1 - progress)}),
                            0 0 ${30 * (1 - progress)}px rgba(82, 183, 136, ${0.1 * (1 - progress)})
                        `;
                    },
                    onComplete: () => {
                        card.style.transform = '';
                        card.style.boxShadow = '';
                    }
                });
            });
        });
    },
    
    initButtonHover() {
        document.querySelectorAll('.btn').forEach(btn => {
            // 光晕跟随效果
            btn.addEventListener('mousemove', (e) => {
                if (this.state.isReducedMotion) return;
                
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                btn.style.setProperty('--mouse-x', `${x}px`);
                btn.style.setProperty('--mouse-y', `${y}px`);
            });
            
            // 点击效果
            btn.addEventListener('mousedown', () => {
                if (this.state.isReducedMotion) return;
                
                btn.classList.add('btn-pressed');
                btn.style.transform = 'scale(0.95)';
            });
            
            btn.addEventListener('mouseup', () => {
                if (this.state.isReducedMotion) return;
                
                btn.classList.remove('btn-pressed');
                AnimationEngine.animate({
                    duration: 200,
                    easing: 'spring',
                    onUpdate: (progress) => {
                        btn.style.transform = `scale(${0.95 + progress * 0.05})`;
                    },
                    onComplete: () => {
                        btn.style.transform = '';
                    }
                });
            });
        });
        
        // 添加按钮光晕样式
        const style = document.createElement('style');
        style.textContent = `
            .btn {
                position: relative;
                overflow: hidden;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                            box-shadow 0.2s ease;
            }
            
            .btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(
                    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                    rgba(255, 255, 255, 0.3) 0%,
                    transparent 50%
                );
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            
            .btn:hover::before {
                opacity: 1;
            }
            
            .btn:hover {
                transform: scale(1.05);
                box-shadow: 0 0 30px rgba(82, 183, 136, 0.4);
            }
            
            .btn-pressed {
                transform: scale(0.95) !important;
            }
        `;
        document.head.appendChild(style);
    },
    
    initLinkHover() {
        document.querySelectorAll('a:not(.btn)').forEach(link => {
            link.addEventListener('mouseenter', () => {
                if (this.state.isReducedMotion) return;
                AnimationEngine.animate({
                    duration: 200,
                    easing: 'easeOutCubic',
                    onUpdate: (progress) => {
                        link.style.color = `rgb(${82 + progress * 50}, ${183 + progress * 30}, ${136 + progress * 50})`;
                        link.style.textShadow = `0 0 ${progress * 10}px rgba(82, 183, 136, ${progress * 0.5})`;
                    }
                });
            });
            
            link.addEventListener('mouseleave', () => {
                if (this.state.isReducedMotion) return;
                link.style.color = '';
                link.style.textShadow = '';
            });
        });
    },
    
    // ========================================
    // 自定义光标
    // ========================================
    
    initCustomCursor() {
        // 创建自定义光标
        const cursor = document.createElement('div');
        cursor.id = 'custom-cursor';
        cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring"></div>';
        cursor.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 10000;
            mix-blend-mode: difference;
        `;
        cursor.querySelector('.cursor-dot').style.cssText = `
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            position: absolute;
            transform: translate(-50%, -50%);
        `;
        cursor.querySelector('.cursor-ring').style.cssText = `
            width: 24px;
            height: 24px;
            border: 2px solid white;
            border-radius: 50%;
            position: absolute;
            transform: translate(-50%, -50%);
            transition: width 0.2s ease, height 0.2s ease, border-radius 0.2s ease;
        `;
        document.body.appendChild(cursor);
        
        // 光标样式
        const cursorStyle = document.createElement('style');
        cursorStyle.textContent = `
            #custom-cursor {
                display: none;
            }
            
            @media (hover: hover) and (pointer: fine) {
                #custom-cursor {
                    display: block;
                }
            }
            
            #custom-cursor.hovering .cursor-ring {
                width: 36px !important;
                height: 36px !important;
                border-color: rgba(255, 255, 255, 0.5);
            }
            
            #custom-cursor.clicking .cursor-ring {
                width: 20px !important;
                height: 20px !important;
            }
        `;
        document.head.appendChild(cursorStyle);
        
        // 隐藏默认光标
        document.body.style.cursor = 'none';
        
        // 监听鼠标移动
        let cursorX = 0, cursorY = 0;
        let ringX = 0, ringY = 0;
        
        document.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            
            // 光标圆点立即跟随
            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
            
            // 更新 lastMouseX/Y
            this.state.lastMouseX = cursorX;
            this.state.lastMouseY = cursorY;
        });
        
        // 光标环延迟跟随
        const animateCursorRing = () => {
            ringX += (cursorX - ringX) * 0.15;
            ringY += (cursorY - ringY) * 0.15;
            
            cursor.querySelector('.cursor-ring').style.left = `${ringX}px`;
            cursor.querySelector('.cursor-ring').style.top = `${ringY}px`;
            
            requestAnimationFrame(animateCursorRing);
        };
        animateCursorRing();
        
        // 悬停效果
        document.querySelectorAll('a, button, .btn, .card, [data-hover]').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
        });
        
        // 点击效果
        document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
        document.addEventListener('mouseup', () => cursor.classList.remove('clicking'));
    },
    
    // ========================================
    // 氛围美学 - 粒子背景
    // ========================================
    
    initAmbientParticles() {
        const container = document.createElement('div');
        container.id = 'ambient-particles';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        `;
        document.body.appendChild(container);
        
        // 创建粒子
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'ambient-particle';
            
            const size = 80 + Math.random() * 40; // 80-120px
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            const duration = 15 + Math.random() * 5; // 15-20s
            const delay = Math.random() * -20;
            
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${startX}%;
                top: ${startY}%;
                background: radial-gradient(
                    circle,
                    rgba(82, 183, 136, ${0.3 + Math.random() * 0.2}) 0%,
                    rgba(82, 183, 136, 0) 70%
                );
                border-radius: 50%;
                filter: blur(${size * 0.8}px);
                opacity: ${0.3 + Math.random() * 0.2};
                animation: float-${i} ${duration}s ease-in-out infinite;
                animation-delay: ${delay}s;
            `;
            
            // 生成随机贝塞尔曲线路径
            const keyframes = `
                @keyframes float-${i} {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                        opacity: ${0.3 + Math.random() * 0.2};
                    }
                    25% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -100}px) scale(1.1);
                        opacity: ${0.5 + Math.random() * 0.2};
                    }
                    50% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0.9);
                        opacity: ${0.3 + Math.random() * 0.2};
                    }
                    75% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100}px) scale(1.05);
                        opacity: ${0.5 + Math.random() * 0.2};
                    }
                }
            `;
            
            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            container.appendChild(particle);
        }
        
        // 粒子样式
        const particleStyle = document.createElement('style');
        particleStyle.textContent = `
            @media (prefers-reduced-motion: reduce) {
                .ambient-particle {
                    animation: none !important;
                }
            }
        `;
        document.head.appendChild(particleStyle);
    },
    
    // ========================================
    // 光标拖尾
    // ========================================
    
    initCursorTrail() {
        // 创建 3 个残影圆点
        const trailContainer = document.createElement('div');
        trailContainer.id = 'cursor-trail';
        trailContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(trailContainer);
        
        const trailDots = [];
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                position: absolute;
                width: ${8 - i * 2}px;
                height: ${8 - i * 2}px;
                background: rgba(82, 183, 136, ${0.6 - i * 0.15});
                border-radius: 50%;
                pointer-events: none;
                transform: translate(-50%, -50%);
                transition: opacity 0.3s ease;
            `;
            trailContainer.appendChild(dot);
            trailDots.push({ element: dot, x: 0, y: 0 });
        }
        
        // 拖尾延迟跟随
        let trailX = 0, trailY = 0;
        const delay = 120; // ms
        
        const animateTrail = () => {
            trailDots.forEach((dot, index) => {
                const targetX = index === 0 ? this.state.lastMouseX : trailDots[index - 1].x;
                const targetY = index === 0 ? this.state.lastMouseY : trailDots[index - 1].y;
                
                // 使用 setTimeout 模拟延迟
                setTimeout(() => {
                    dot.x += (targetX - dot.x) * 0.3;
                    dot.y += (targetY - dot.y) * 0.3;
                    dot.element.style.left = `${dot.x}px`;
                    dot.element.style.top = `${dot.y}px`;
                }, index * delay / 3);
            });
            
            requestAnimationFrame(animateTrail);
        };
        
        // 只在非移动端启用
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            animateTrail();
        }
        
        // 隐藏拖尾样式
        const trailStyle = document.createElement('style');
        trailStyle.textContent = `
            @media (prefers-reduced-motion: reduce) {
                #cursor-trail {
                    display: none;
                }
            }
            
            @media (hover: none) {
                #cursor-trail {
                    display: none;
                }
            }
        `;
        document.head.appendChild(trailStyle);
    },
    
    // ========================================
    // 空闲动画 - Hero 标题脉冲
    // ========================================
    
    initIdleAnimation() {
        const heroTitle = document.querySelector('.hero h1');
        if (!heroTitle) return;
        
        const resetIdleTimer = () => {
            this.state.isIdle = false;
            clearTimeout(this.state.idleTimer);
            
            // 重置标题样式
            heroTitle.style.animation = 'none';
            heroTitle.offsetHeight; // 强制重绘
            heroTitle.style.animation = '';
            
            // 重新开始计时
            this.state.idleTimer = setTimeout(() => {
                this.state.isIdle = true;
                this.startTitlePulse();
            }, this.state.idleTimeout);
        };
        
        // 监听用户交互
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
            window.addEventListener(event, resetIdleTimer, { passive: true });
        });
        
        // 开始计时
        this.state.idleTimer = setTimeout(() => {
            this.state.isIdle = true;
            this.startTitlePulse();
        }, this.state.idleTimeout);
    },
    
    startTitlePulse() {
        const heroTitle = document.querySelector('.hero h1');
        if (!heroTitle || !this.state.isIdle) return;
        
        // 添加脉冲动画
        const pulseStyle = document.createElement('style');
        pulseStyle.id = 'title-pulse-style';
        pulseStyle.textContent = `
            @keyframes titlePulse {
                0%, 100% {
                    opacity: 1;
                    transform: skewX(0deg);
                }
                10% {
                    opacity: 0.8;
                    transform: skewX(-2deg);
                }
                20% {
                    opacity: 1;
                    transform: skewX(2deg);
                }
                30% {
                    opacity: 0.9;
                    transform: skewX(-1deg);
                }
                40% {
                    opacity: 1;
                    transform: skewX(0deg);
                }
            }
            
            .hero h1 {
                animation: titlePulse 3s ease-in-out infinite;
            }
            
            @media (prefers-reduced-motion: reduce) {
                .hero h1 {
                    animation: none;
                }
            }
        `;
        document.head.appendChild(pulseStyle);
    },
    
    // ========================================
    // Hero 区域增强动画
    // ========================================
    
    initHeroAnimation() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        
        // Hero 区域入场动画
        const heroContent = hero.querySelector('.hero-content');
        const heroElements = hero.querySelectorAll('h1, .tagline, .hero-buttons, .floating-leaf');
        
        // 初始状态
        heroElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
        });
        
        // 入场动画
        setTimeout(() => {
            heroElements.forEach((el, index) => {
                setTimeout(() => {
                    el.style.transition = 'opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 300);
    }
};

// ========================================
// 初始化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    AdvancedAnimations.init();
});

// 导出
window.AdvancedAnimations = AdvancedAnimations;


// ========================================\n// ģ̬�򹤾ߺ���\n// ========================================\n\nfunction showModal(modalId) {\n    const modal = document.getElementById(modalId);\n    if (!modal) return;\n    modal.classList.add('active');\n    document.body.style.overflow = 'hidden';\n}\n\nfunction hideModal(modalId) {\n    const modal = document.getElementById(modalId);\n    if (!modal) return;\n    modal.classList.remove('active');\n    document.body.style.overflow = '';\n}\n\n// ���ģ̬���ⲿ�ر�\ndocument.addEventListener('click', (e) => {\n    if (e.target.classList.contains('modal-overlay')) {\n        e.target.classList.remove('active');\n        document.body.style.overflow = '';\n    }\n});\n\n// ESC ���ر�ģ̬��\ndocument.addEventListener('keydown', (e) => {\n    if (e.key === 'Escape') {\n        document.querySelectorAll('.modal-overlay.active').forEach(modal => {\n            modal.classList.remove('active');\n        });\n        document.body.style.overflow = '';\n    }\n});\n\n// Toast ��ʾ\nfunction showToast(message, duration = 3000) {\n    const existing = document.querySelector('.toast-notification');\n    if (existing) existing.remove();\n    \n    const toast = document.createElement('div');\n    toast.className = 'toast-notification';\n    toast.innerHTML = <span></span>;\n    toast.style.cssText = \n        position: fixed;\n        bottom: 20px;\n        left: 50%;\n        transform: translateX(-50%) translateY(100px);\n        background: rgba(82, 183, 136, 0.95);\n        color: white;\n        padding: 12px 24px;\n        border-radius: 30px;\n        font-size: 0.95rem;\n        z-index: 100003;\n        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);\n        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);\n    ;\n    document.body.appendChild(toast);\n    \n    setTimeout(() => {\n        toast.style.transform = 'translateX(-50%) translateY(0)';\n    }, 10);\n    \n    setTimeout(() => {\n        toast.style.transform = 'translateX(-50%) translateY(100px)';\n        setTimeout(() => toast.remove(), 300);\n    }, duration);\n}\n\n// ����\nwindow.showModal = showModal;\nwindow.hideModal = hideModal;\nwindow.showToast = showToast;
