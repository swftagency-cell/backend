// Services Page JavaScript - Modern Redesign

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initScrollAnimations();
    initServiceCards();
    initProcessSteps();
    initCounterAnimations();
    initSmoothScrolling();
    initParallaxEffects();
    initServiceModal();
    initScrollIndicator();
});

// Scroll-triggered animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Add staggered animation for service cards
                if (entry.target.classList.contains('service-card')) {
                    const cards = document.querySelectorAll('.service-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.animationDelay = `${index * 0.1}s`;
                            card.classList.add('fade-in-up');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Enhanced service card interactions
function initServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        // Add ripple effect on click
        card.addEventListener('click', function(e) {
            createRippleEffect(e, this);
        });

        // Enhanced hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            
            // Animate service icon
            const icon = this.querySelector('.service-icon');
            if (icon) {
                icon.style.transform = 'scale(1.15) rotate(10deg)';
            }
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            
            // Reset service icon
            const icon = this.querySelector('.service-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });

        // Modal trigger
        const overlayBtn = card.querySelector('.service-overlay .btn');
        if (overlayBtn) {
            overlayBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const serviceTitle = card.querySelector('.service-title').textContent;
                openServiceModal(serviceTitle);
            });
        }
    });
}

// Create ripple effect
function createRippleEffect(event, element) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Process steps animations
function initProcessSteps() {
    const processSteps = document.querySelectorAll('.process-step');
    
    processSteps.forEach((step, index) => {
        step.addEventListener('mouseenter', function() {
            // Scale animation
            const icon = this.querySelector('.step-icon');
            if (icon) {
                icon.style.transform = 'scale(1.2)';
                icon.style.boxShadow = '0 15px 40px rgba(0, 212, 255, 0.4)';
            }
            
            // Glow effect on step number
            const number = this.querySelector('.step-number');
            if (number) {
                number.style.color = 'rgba(0, 212, 255, 0.3)';
                number.style.textShadow = '0 0 20px rgba(0, 212, 255, 0.5)';
            }
        });
        
        step.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.step-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
                icon.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.3)';
            }
            
            const number = this.querySelector('.step-number');
            if (number) {
                number.style.color = 'rgba(255, 255, 255, 0.1)';
                number.style.textShadow = 'none';
            }
        });
    });
}

// Counter animations for stats
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.textContent);
                animateCounter(counter, 0, target, 2000);
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Animate counter function
function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    const suffix = element.textContent.replace(/[0-9]/g, '');
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Smooth scrolling for navigation
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Parallax effects
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.hero-particles, .hero-gradient');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        parallaxElements.forEach(element => {
            element.style.transform = `translateY(${rate}px)`;
        });
    });
}

// Service modal functionality
function initServiceModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('serviceModal')) {
        createServiceModal();
    }
}

// Create service modal
function createServiceModal() {
    const modalHTML = `
        <div class="modal fade" id="serviceModal" tabindex="-1" aria-labelledby="serviceModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="serviceModalLabel">Service Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="modalContent">
                            <!-- Dynamic content will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="requestQuote()">Request Quote</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Open service modal with content
function openServiceModal(serviceTitle) {
    const modal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('serviceModalLabel');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.textContent = serviceTitle;
    
    // Service details data
    const serviceDetails = {
        'Web Development': {
            description: 'Complete web development solutions from concept to deployment.',
            features: [
                'Responsive Design',
                'Modern Frameworks',
                'SEO Optimization',
                'Performance Optimization',
                'Cross-browser Compatibility'
            ],
            process: [
                'Requirements Analysis',
                'Design & Prototyping',
                'Development',
                'Testing & QA',
                'Deployment & Support'
            ]
        },
        'Mobile App Development': {
            description: 'Native and cross-platform mobile applications for iOS and Android.',
            features: [
                'Native iOS & Android',
                'Cross-platform Solutions',
                'UI/UX Design',
                'App Store Optimization',
                'Push Notifications'
            ],
            process: [
                'Concept & Strategy',
                'Design & Wireframing',
                'Development',
                'Testing',
                'App Store Submission'
            ]
        },
        'Digital Marketing': {
            description: 'Comprehensive digital marketing strategies to grow your business.',
            features: [
                'SEO & SEM',
                'Social Media Marketing',
                'Content Marketing',
                'Email Marketing',
                'Analytics & Reporting'
            ],
            process: [
                'Market Research',
                'Strategy Development',
                'Campaign Creation',
                'Implementation',
                'Monitoring & Optimization'
            ]
        }
    };
    
    const details = serviceDetails[serviceTitle] || serviceDetails['Web Development'];
    
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-12">
                <p class="lead">${details.description}</p>
                
                <h6 class="mt-4 mb-3">Key Features:</h6>
                <ul class="list-unstyled">
                    ${details.features.map(feature => `
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            ${feature}
                        </li>
                    `).join('')}
                </ul>
                
                <h6 class="mt-4 mb-3">Our Process:</h6>
                <div class="row">
                    ${details.process.map((step, index) => `
                        <div class="col-md-6 mb-3">
                            <div class="d-flex align-items-center">
                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 30px; height: 30px; font-size: 0.8rem;">
                                    ${index + 1}
                                </div>
                                <span>${step}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Scroll indicator functionality
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const servicesSection = document.querySelector('.services-grid');
            if (servicesSection) {
                servicesSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
        
        // Hide scroll indicator after scrolling
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            if (scrolled > 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        });
    }
}

// Request quote function
function requestQuote() {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
    modal.hide();
    
    // Scroll to contact section or show contact form
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        // If no contact section, you could show a contact modal or redirect
        alert('Thank you for your interest! Please contact us at info@swiftagency.com for a quote.');
    }
}

// Button hover effects
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// Performance optimization - Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(function() {
    // Any scroll-based animations or effects can be added here
}, 16); // ~60fps

window.addEventListener('scroll', debouncedScrollHandler);

// Loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Trigger initial animations
    setTimeout(() => {
        const heroElements = document.querySelectorAll('.hero-content > *');
        heroElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }, 300);
});