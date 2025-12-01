// Enquiry Page JavaScript

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEnquiryForm();
    initializeFormValidation();
    initializeAnimations();
});

// Initialize enquiry form
function initializeEnquiryForm() {
    const form = document.getElementById('enquiryForm');
    if (!form) return;
    
    form.addEventListener('submit', handleFormSubmission);
    
    // Add real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Handle form submission
async function handleFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    // Validate form
    if (!validateForm(form)) {
        showNotification('Please fill in all required fields correctly.', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Prepare form data
        const formData = new FormData(form);
        const firstName = formData.get('firstName') || '';
        const lastName = formData.get('lastName') || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        const data = {
            name: fullName,
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            serviceType: formData.get('serviceType'), // Match backend field name
            budget: formData.get('budget'),
            timeline: formData.get('timeline'),
            message: formData.get('message')
        };
        
        // Send to API
        const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'http://localhost:3000'
            : '';
        const response = await fetch(`${API_BASE}/api/enquiry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Success
            showNotification(
                'Thank you for your enquiry! We will get back to you within 24 hours.',
                'success'
            );
            
            // Reset form
            form.reset();
            
            // Show success modal
            showSuccessModal(data);
            
        } else {
            // Error from API
            throw new Error(result.message || 'Failed to submit enquiry');
        }
        
    } catch (error) {
        console.error('Enquiry submission error:', error);
        showNotification(
            'Sorry, there was an error submitting your enquiry. Please try again or contact us directly.',
            'error'
        );
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Validate individual field
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous errors
    clearFieldError({ target: field });
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        errorMessage = `${getFieldLabel(fieldName)} is required.`;
        isValid = false;
    }
    
    // Email validation
    else if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            errorMessage = 'Please enter a valid email address.';
            isValid = false;
        }
    }
    
    // Phone validation
    else if (fieldName === 'phone' && value) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value) || value.length < 10) {
            errorMessage = 'Please enter a valid phone number.';
            isValid = false;
        }
    }
    
    // Message length validation
    else if (fieldName === 'message' && value) {
        if (value.length < 10) {
            errorMessage = 'Message must be at least 10 characters long.';
            isValid = false;
        }
    }
    
    // Show error if validation failed
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

// Clear field error
function clearFieldError(e) {
    const field = e.target;
    const errorElement = field.parentNode.querySelector('.field-error');
    
    if (errorElement) {
        errorElement.remove();
    }
    
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
}

// Show field error
function showFieldError(field, message) {
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error class
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error text-danger small mt-1';
    errorElement.textContent = message;
    
    // Insert after field
    field.parentNode.appendChild(errorElement);
}

// Get field label
function getFieldLabel(fieldName) {
    const labels = {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        company: 'Company',
        service: 'Service',
        budget: 'Budget',
        timeline: 'Timeline',
        message: 'Message'
    };
    
    return labels[fieldName] || fieldName;
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Show success modal
function showSuccessModal(data) {
    const modalHTML = `
        <div class="modal fade" id="successModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle"></i> Enquiry Submitted Successfully
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-4">
                            <i class="fas fa-envelope-open-text text-success" style="font-size: 3rem;"></i>
                        </div>
                        <h4>Thank you, ${data.name}!</h4>
                        <p class="lead">Your enquiry about <strong>${data.service}</strong> has been received.</p>
                        <div class="alert alert-info">
                            <i class="fas fa-clock"></i>
                            We will review your enquiry and get back to you within <strong>24 hours</strong>.
                        </div>
                        <p class="text-muted">A confirmation email has been sent to <strong>${data.email}</strong></p>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-success" data-bs-dismiss="modal">
                            <i class="fas fa-thumbs-up"></i> Great!
                        </button>
                        <a href="booking.html" class="btn btn-outline-primary">
                            <i class="fas fa-calendar"></i> Book a Call
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('successModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    modal.show();
}

// Initialize form validation styles
function initializeFormValidation() {
    // Add Bootstrap validation classes
    const style = document.createElement('style');
    style.textContent = `
        .field-error {
            display: block;
            width: 100%;
            margin-top: 0.25rem;
            font-size: 0.875em;
            color: #dc3545;
        }
        
        .form-control.is-invalid {
            border-color: #dc3545;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
        
        .form-control.is-valid {
            border-color: #198754;
            box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
        }
        
        .notification {
            animation: slideInRight 0.3s ease;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize animations
function initializeAnimations() {
    // Animate form elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Animate form groups
    const formGroups = document.querySelectorAll('.mb-3, .card, .alert');
    formGroups.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(element);
    });
}

// Character counter for textarea
function initializeCharacterCounter() {
    const textarea = document.querySelector('textarea[name="message"]');
    if (!textarea) return;
    
    const maxLength = 1000;
    const counter = document.createElement('div');
    counter.className = 'character-counter text-muted small text-end mt-1';
    counter.textContent = `0 / ${maxLength} characters`;
    
    textarea.parentNode.appendChild(counter);
    
    textarea.addEventListener('input', function() {
        const length = this.value.length;
        counter.textContent = `${length} / ${maxLength} characters`;
        
        if (length > maxLength * 0.9) {
            counter.classList.add('text-warning');
        } else {
            counter.classList.remove('text-warning');
        }
        
        if (length >= maxLength) {
            counter.classList.add('text-danger');
            counter.classList.remove('text-warning');
        } else {
            counter.classList.remove('text-danger');
        }
    });
}

// Initialize character counter
initializeCharacterCounter();

// Initialize chatbot if available
if (typeof SwiftChatbot !== 'undefined') {
    const chatbot = new SwiftChatbot();
    chatbot.init();
}

// Export functions for potential external use
window.EnquiryPage = {
    validateForm,
    showNotification,
    showSuccessModal
};
