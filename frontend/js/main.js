// Main JavaScript file for Swift Agency

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeScrollEffects();
    initializeAnimations();
    initializeUtilities();
    initializeServicesMarquee();
});

// Navigation functionality
function initializeNavigation() {
    // Mobile menu toggle
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            navbarCollapse.classList.toggle('show');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                navbarCollapse.classList.remove('show');
            }
        }
    });
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    navbarCollapse.classList.remove('show');
                }
            }
        });
    });
}

// Scroll effects
function initializeScrollEffects() {
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // Back to top button
    createBackToTopButton();
}

// Create back to top button
function createBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    `;
    
    document.body.appendChild(backToTopBtn);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effects
    backToTopBtn.addEventListener('mouseenter', function() {
        this.style.background = '#0056b3';
        this.style.transform = 'scale(1.1)';
    });
    
    backToTopBtn.addEventListener('mouseleave', function() {
        this.style.background = '#007bff';
        this.style.transform = 'scale(1)';
    });
}

// Animation on scroll
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    const animatedElements = document.querySelectorAll(
        '.fade-in, .slide-in-left, .slide-in-right, .slide-in-up, .zoom-in'
    );
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Utility functions
function initializeUtilities() {
    // Add CSS for animations
    addAnimationStyles();
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Initialize popovers if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function(popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
}

// Auto-scroll services cards horizontally
function initializeServicesMarquee() {
    const container = document.querySelector('.services .cards');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.card'));
    if (cards.length === 0) return;
    const track = document.createElement('div');
    track.className = 'marquee-track';
    cards.forEach(c => track.appendChild(c.cloneNode(true)));
    cards.forEach(c => track.appendChild(c.cloneNode(true)));
    container.innerHTML = '';
    container.appendChild(track);
    container.classList.add('marquee');
    const region = container.closest('.services') || container.parentElement;
    region.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; track.style.WebkitAnimationPlayState = 'paused'; });
    region.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; track.style.WebkitAnimationPlayState = 'running'; });

    const getHalfWidth = () => track.scrollWidth / 2;
    let dragging = false;
    let startX = 0;
    let startOffset = 0;
    let currentOffset = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    const setOffset = (off) => {
        const half = getHalfWidth();
        while (off < -half) off += half;
        while (off > 0) off -= half;
        currentOffset = off;
        track.style.transform = `translateX(${off}px)`;
        track.style.webkitTransform = `translateX(${off}px)`;
    };

    const pauseAnimation = () => {
        track.style.animationPlayState = 'paused';
        track.style.WebkitAnimationPlayState = 'paused';
    };

    const resumeAnimationFromCurrent = () => {
        const half = getHalfWidth();
        const progress = Math.max(0, Math.min(1, -currentOffset / half));
        const comp = getComputedStyle(track);
        const durStr = comp.animationDuration || comp.webkitAnimationDuration || '12s';
        const durSec = parseFloat(durStr);
        const delaySec = -(durSec * progress);
        track.style.transform = '';
        track.style.webkitTransform = '';
        track.style.animationDelay = `${delaySec}s`;
        track.style.WebkitAnimationDelay = `${delaySec}s`;
        track.style.animationPlayState = 'running';
        track.style.WebkitAnimationPlayState = 'running';
    };

    const onStart = (x) => {
        dragging = true;
        startX = x;
        const comp = getComputedStyle(track);
        const matrix = comp.transform || comp.webkitTransform;
        let current = 0;
        if (matrix && matrix !== 'none') {
            const m = matrix.match(/matrix\(([^)]+)\)/);
            if (m) {
                const parts = m[1].split(',').map(parseFloat);
                current = parts[4] || 0;
            }
        }
        startOffset = currentOffset || current || 0;
        lastX = x;
        lastT = performance.now();
        velocity = 0;
        pauseAnimation();
        container.classList.add('dragging');
    };

    const onMove = (x, e) => {
        if (!dragging) return;
        const dx = x - startX;
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        velocity = (x - lastX) / dt; // px/ms
        lastX = x;
        lastT = now;
        setOffset(startOffset + dx);
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
    };

    const onEnd = () => {
        if (!dragging) return;
        dragging = false;
        let v = velocity * 16;
        const decay = 0.9;
        const min = 0.1;
        const step = () => {
            if (Math.abs(v) < min) { snapToNearest(); return; }
            setOffset(currentOffset + v);
            v *= decay;
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const snapToNearest = () => {
        const cs = getComputedStyle(container);
        const cwVar = parseFloat(cs.getPropertyValue('--services-card-width'));
        const gapVar = parseFloat(cs.getPropertyValue('--services-scroll-gap'));
        const cw = !isNaN(cwVar) ? cwVar : (track.firstElementChild ? track.firstElementChild.offsetWidth : 300);
        const gap = !isNaN(gapVar) ? gapVar : 0;
        const stepSize = cw + gap;
        const cur = -currentOffset;
        const base = Math.round(cur / stepSize) * stepSize;
        const target = -base;
        const start = currentOffset;
        const startTime = performance.now();
        const duration = 200;
        const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const anim = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            const val = start + (target - start) * ease(t);
            setOffset(val);
            if (t < 1) { requestAnimationFrame(anim); } else { container.classList.remove('dragging'); resumeAnimationFromCurrent(); }
        };
        requestAnimationFrame(anim);
    };

    // Touch events
    container.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        onStart(e.touches[0].clientX);
    }, { passive: true });
    container.addEventListener('touchmove', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        onMove(e.touches[0].clientX, e);
    }, { passive: false });
    container.addEventListener('touchend', () => { onEnd(); }, { passive: true });
    container.addEventListener('touchcancel', () => { onEnd(); }, { passive: true });

    // Mouse events
    const onMouseDown = (e) => { onStart(e.clientX); e.preventDefault(); };
    const onMouseMove = (e) => { onMove(e.clientX, e); };
    const onMouseUp = () => { onEnd(); };
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const onKeyDown = (e) => {
        const cs = getComputedStyle(container);
        const cwVar = parseFloat(cs.getPropertyValue('--services-card-width'));
        const gapVar = parseFloat(cs.getPropertyValue('--services-scroll-gap'));
        const cw = !isNaN(cwVar) ? cwVar : (track.firstElementChild ? track.firstElementChild.offsetWidth : 300);
        const gap = !isNaN(gapVar) ? gapVar : 0;
        const stepSize = cw + gap;
        if (e.key === 'ArrowLeft') { pauseAnimation(); setOffset(currentOffset + stepSize); snapToNearest(); }
        if (e.key === 'ArrowRight') { pauseAnimation(); setOffset(currentOffset - stepSize); snapToNearest(); }
        if (e.key === ' ') { e.preventDefault(); const ps = getComputedStyle(track).animationPlayState; if (ps === 'running') { pauseAnimation(); } else { resumeAnimationFromCurrent(); } }
    };
    region.setAttribute('tabindex', '0');
    region.addEventListener('keydown', onKeyDown);

    const cleanup = () => {
        container.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        region.removeEventListener('keydown', onKeyDown);
    };
    window.addEventListener('beforeunload', cleanup);
}

// Add animation styles
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Navbar scroll effect */
        .navbar.scrolled {
            background-color: #001E3D !important;
            background: #001E3D !important;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        /* Animation classes */
        .fade-in {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .fade-in.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .slide-in-left {
            opacity: 0;
            transform: translateX(-50px);
            transition: all 0.6s ease;
        }
        
        .slide-in-left.animate-in {
            opacity: 1;
            transform: translateX(0);
        }
        
        .slide-in-right {
            opacity: 0;
            transform: translateX(50px);
            transition: all 0.6s ease;
        }
        
        .slide-in-right.animate-in {
            opacity: 1;
            transform: translateX(0);
        }
        
        .slide-in-up {
            opacity: 0;
            transform: translateY(50px);
            transition: all 0.6s ease;
        }
        
        .slide-in-up.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .zoom-in {
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.6s ease;
        }
        
        .zoom-in.animate-in {
            opacity: 1;
            transform: scale(1);
        }
        
        /* Loading spinner */
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Button hover effects */
        .btn-hover-effect {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .btn-hover-effect::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }
        
        .btn-hover-effect:hover::before {
            left: 100%;
        }
        
        /* Card hover effects */
        .card-hover {
            transition: all 0.3s ease;
        }
        
        .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        /* Responsive utilities */
        @media (max-width: 768px) {
            .back-to-top {
                bottom: 15px;
                right: 15px;
                width: 45px;
                height: 45px;
            }
        }

        .services .cards {
            scroll-behavior: auto;
            overflow: hidden;
            position: relative;
            display: flex;
            --services-scroll-duration: 8s;
            --services-scroll-gap: 20px;
            --services-card-width: 360px;
            --services-card-height: 420px;
            touch-action: pan-y;
            cursor: grab;
        }
        .services .cards.dragging { cursor: grabbing; }
        .services .cards.dragging .card { box-shadow: 0 8px 24px rgba(0,0,0,0.15); opacity: 0.97; }
        .services .card {
            width: var(--services-card-width);
            height: var(--services-card-height);
            flex: 0 0 var(--services-card-width);
            margin-right: var(--services-scroll-gap);
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
            overflow: hidden;
            -webkit-overflow-scrolling: touch;
        }
        .services .card p {
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        }
        .services .cards.marquee .marquee-track {
            display: inline-flex;
            will-change: transform;
            animation: services-marquee var(--services-scroll-duration) var(--services-easing, ease-in-out) infinite;
            -webkit-animation: services-marquee var(--services-scroll-duration) var(--services-easing, ease-in-out) infinite;
            animation-timing-function: var(--services-easing, ease-in-out);
            -webkit-animation-timing-function: var(--services-easing, ease-in-out);
        }
        @media (max-width: 992px) {
            .services .cards { --services-card-width: 320px; --services-card-height: 400px; }
        }
        @media (max-width: 768px) {
            .services .cards { --services-card-width: 280px; --services-card-height: 360px; }
        }
        @keyframes services-marquee {
            0% { transform: translateX(0); }
            8% { transform: translateX(0); }
            92% { transform: translateX(-50%); }
            100% { transform: translateX(-50%); }
        }
        @-webkit-keyframes services-marquee {
            0% { -webkit-transform: translateX(0); }
            8% { -webkit-transform: translateX(0); }
            92% { -webkit-transform: translateX(-50%); }
            100% { -webkit-transform: translateX(-50%); }
        }
    `;
    
    document.head.appendChild(style);
}

// Utility functions for external use
window.SwiftUtils = {
    // Show loading spinner
    showLoading: function(element, text = 'Loading...') {
        if (element) {
            element.innerHTML = `<span class="spinner"></span> ${text}`;
            element.disabled = true;
        }
    },
    
    // Hide loading spinner
    hideLoading: function(element, originalText) {
        if (element) {
            element.innerHTML = originalText;
            element.disabled = false;
        }
    },
    
    // Show notification
    showNotification: function(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    },
    
    // Format date
    formatDate: function(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },
    
    // Validate email
    validateEmail: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    // Validate phone
    validatePhone: function(phone) {
        const regex = /^[\d\s\-\+\(\)]+$/;
        return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },
    
    // Debounce function
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },
    
    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Initialize chatbot if available
if (typeof SwiftChatbot !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        const chatbot = new SwiftChatbot();
        chatbot.init();
    });
}
