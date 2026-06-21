/**
 * 高级感交互反馈优化 - JavaScript 逻辑
 * 包含：涟漪效果、滚动触发、视差效果、平滑过渡
 */

// ========================================
// 1. 点击涟漪效果（Ripple Effect）
// ========================================
function initRippleEffect() {
    // 为所有可点击元素添加涟漪效果
    const rippleElements = document.querySelectorAll('.btn, .card, .social-card, .contact-card, .resource-item, .tag');
    
    rippleElements.forEach(el => {
        el.classList.add('ripple-container');
        
        el.addEventListener('click', function(e) {
            // 创建涟漪元素
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            // 计算涟漪位置和大小
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            // 设置涟漪样式
            ripple.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
            `;
            
            // 添加到容器
            this.appendChild(ripple);
            
            // 动画结束后移除
            setTimeout(() => {
                if (ripple && ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });
    });
}

// ========================================
// 2. 滚动触发动画（Intersection Observer）
// ========================================
function initScrollReveal() {
    // 为需要动画的元素添加 .scroll-reveal 类
    const revealElements = document.querySelectorAll(
        '.about-card, .skill-category, .journal-entry, .idea-card, .book-card, .plan-period, .social-card, .contact-card, .resource-category, .resource-item, .section-title, .section-divider'
    );
    
    revealElements.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        // 错落延迟（每批6个元素循环）
        el.style.transitionDelay = `${(index % 6) * 80}ms`;
    });
    
    // 创建 Intersection Observer
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // 错落延迟显示
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 80);
                
                // 只触发一次
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1, // 10% 可见时触发
        rootMargin: '0px 0px -50px 0px' // 提前 50px 触发
    });
    
    // 开始观察
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        scrollObserver.observe(el);
    });
}

// ========================================
// 3. 视差滚动效果（Parallax）
// ========================================
function initParallax() {
    // 为装饰元素添加视差层
    const parallaxElements = document.querySelectorAll('.floating-leaf, .hero-decoration');
    parallaxElements.forEach(el => {
        el.classList.add('parallax-layer');
    });
    
    let lastScrollY = window.scrollY;
    let lastTime = Date.now();
    let ticking = false;
    
    function updateParallax() {
        const currentScrollY = window.scrollY;
        const currentTime = Date.now();
        
        // 计算滚动速度
        const deltaTime = currentTime - lastTime;
        const speed = deltaTime > 0 ? Math.abs(currentScrollY - lastScrollY) / deltaTime * 16 : 0;
        
        // 根据速度调整视差效果
        document.querySelectorAll('.parallax-layer').forEach(layer => {
            const speedFactor = layer.dataset.speed || 0.3;
            const yOffset = currentScrollY * speedFactor * (1 + speed * 0.1);
            
            // 使用 requestAnimationFrame 优化性能
            requestAnimationFrame(() => {
                layer.style.transform = `translateY(${yOffset}px)`;
            });
        });
        
        lastScrollY = currentScrollY;
        lastTime = currentTime;
        ticking = false;
    }
    
    // 节流滚动事件
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });
}

// ========================================
// 4. 平滑滚动增强（Smooth Scroll）
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                // 计算导航栏高度偏移
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;
                
                // 使用自定义缓动函数平滑滚动
                smoothScrollTo(targetPosition, 800);
                
                // 关闭移动端菜单
                const navLinks = document.querySelector('.nav-links');
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
}

// 自定义平滑滚动函数（使用 easeInOutQuart 缓动）
function smoothScrollTo(targetPosition, duration) {
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    }
    
    function animationScroll(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutQuart(progress);
        
        window.scrollTo(0, startPosition + distance * ease);
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animationScroll);
        }
    }
    
    requestAnimationFrame(animationScroll);
}

// ========================================
// 5. 导航栏滚动效果增强
// ========================================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 50) {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            navbar.style.padding = '0.8rem 2rem';
        } else {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
            navbar.style.padding = '1rem 2rem';
        }
        
        // 向下滚动时隐藏导航栏，向上滚动时显示（可选）
        // if (currentScroll > lastScroll && currentScroll > 100) {
        //     navbar.style.transform = 'translateY(-100%)';
        // } else {
        //     navbar.style.transform = 'translateY(0)';
        // }
        
        lastScroll = currentScroll;
    }, { passive: true });
}

// ========================================
// 6. 技能条动画触发
// ========================================
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 触发技能条动画
                const progress = entry.target;
                const width = progress.style.width;
                progress.style.width = '0%';
                
                // 延迟执行，让重置生效
                setTimeout(() => {
                    progress.style.width = width;
                }, 100);
                
                skillObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    skillBars.forEach(bar => {
        skillObserver.observe(bar);
    });
}

// ========================================
// 7. 毛玻璃页面切换（针对 SPA）
// ========================================
function initGlassmorphismTransition() {
    // 创建毛玻璃遮罩
    const overlay = document.createElement('div');
    overlay.classList.add('glass-overlay');
    document.body.appendChild(overlay);
    
    // 为所有页面内容添加类
    const pageContents = document.querySelectorAll('.section');
    pageContents.forEach(el => {
        el.classList.add('page-content');
    });
    
    // 页面切换函数（供 SPA 路由调用）
    window.transitionToPage = function(newPage) {
        const overlay = document.querySelector('.glass-overlay');
        const currentPage = document.querySelector('.page-content.active');
        
        if (!newPage || newPage === currentPage) return;
        
        // 1. 激活毛玻璃遮罩
        overlay.classList.add('active');
        
        // 2. 当前页面融解
        if (currentPage) {
            currentPage.classList.add('page-exit');
        }
        
        setTimeout(() => {
            // 3. 切换内容
            if (currentPage) {
                currentPage.classList.remove('active', 'page-exit');
            }
            newPage.classList.add('active', 'page-enter');
            
            // 4. 新页面汇聚
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    newPage.classList.remove('page-enter');
                });
            });
            
            // 5. 移除毛玻璃
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 200);
        }, 300);
    };
}

// ========================================
// 8. 性能监控（可选）
// ========================================
function initPerformanceMonitor() {
    // 监听动画性能
    let frameCount = 0;
    let lastTime = performance.now();
    
    function checkFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
            const fps = frameCount;
            frameCount = 0;
            lastTime = currentTime;
            
            // FPS 低于 30 时输出警告（调试用）
            if (fps < 30 && window.console && console.warn) {
                console.warn(`Low FPS detected: ${fps}`);
            }
        }
        
        requestAnimationFrame(checkFPS);
    }
    
    // 只在调试模式启用
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        requestAnimationFrame(checkFPS);
    }
}

// ========================================
// 9. 无障碍优化（Accessibility）
// ========================================
function initAccessibility() {
    // 为交互元素添加键盘导航支持
    const interactiveElements = document.querySelectorAll('.btn, .card, .social-card, .resource-item');
    
    interactiveElements.forEach(el => {
        if (!el.getAttribute('tabindex')) {
            el.setAttribute('tabindex', '0');
        }
        
        // 回车键触发点击
        el.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // 检测用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    function handleMotionPreference() {
        if (prefersReducedMotion.matches) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    }
    
    prefersReducedMotion.addListener(handleMotionPreference);
    handleMotionPreference();
}

// ========================================
// 初始化所有效果
// ========================================
function initAllEffects() {
    // 等待 DOM 完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initRippleEffect();
            initScrollReveal();
            initParallax();
            initSmoothScroll();
            initNavbarScroll();
            initSkillBars();
            initGlassmorphismTransition();
            initAccessibility();
            
            // 性能监控（调试用）
            // initPerformanceMonitor();
            
            console.log('✨ 高级感交互效果已加载');
        });
    } else {
        // DOM 已经加载完成
        initRippleEffect();
        initScrollReveal();
        initParallax();
        initSmoothScroll();
        initNavbarScroll();
        initSkillBars();
        initGlassmorphismTransition();
        initAccessibility();
        
        console.log('✨ 高级感交互效果已加载');
    }
}

// 启动
initAllEffects();
