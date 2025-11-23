// Booking Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar
    initializeCalendar();
    
    // Initialize form handlers
    initializeFormHandlers();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize animations
    initializeAnimations();
});

// Calendar initialization
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    const selectedDateInput = document.getElementById('selected-date');
    const timeSlotsContainer = document.getElementById('time-slots');
    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
        },
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        
        // Disable past dates
        validRange: {
            start: new Date().toISOString().split('T')[0]
        },
        
        // Handle date selection
        dateClick: function(info) {
            // Remove previous selection
            document.querySelectorAll('.fc-daygrid-day').forEach(day => {
                day.classList.remove('fc-day-selected');
            });
            
            // Add selection to clicked date
            info.dayEl.classList.add('fc-day-selected');
            
            // Update selected date input
            const selectedDate = new Date(info.date);
            const formattedDate = selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            selectedDateInput.value = formattedDate;
            
            // Generate time slots for selected date
            generateTimeSlots(info.date);
        },
        
        // Sample events (booked appointments)
        events: [
            {
                title: 'Booked',
                start: '2024-01-15T10:00:00',
                end: '2024-01-15T11:00:00',
                color: '#dc3545'
            },
            {
                title: 'Booked',
                start: '2024-01-16T14:00:00',
                end: '2024-01-16T15:00:00',
                color: '#dc3545'
            }
        ]
    });
    
    calendar.render();
}

// Generate time slots for selected date
function generateTimeSlots(selectedDate) {
    const timeSlotsContainer = document.getElementById('time-slots');
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    
    // Business hours: 9 AM to 6 PM
    const businessHours = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    // Sample booked slots (this would come from a database in a real application)
    const bookedSlots = ['10:00', '14:00', '16:30'];
    
    timeSlotsContainer.innerHTML = '';
    
    businessHours.forEach(time => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = time;
        timeSlot.dataset.time = time;
        
        // Check if slot is in the past (for today)
        const slotHour = parseInt(time.split(':')[0]);
        const slotMinute = parseInt(time.split(':')[1]);
        const isPastTime = isToday && (slotHour < currentHour || (slotHour === currentHour && slotMinute <= today.getMinutes()));
        
        // Check if slot is booked
        const isBooked = bookedSlots.includes(time);
        
        if (isPastTime || isBooked) {
            timeSlot.classList.add('unavailable');
            timeSlot.textContent += isBooked ? ' (Booked)' : ' (Past)';
        } else {
            timeSlot.addEventListener('click', function() {
                // Remove previous selection
                document.querySelectorAll('.time-slot').forEach(slot => {
                    slot.classList.remove('selected');
                });
                
                // Select this slot
                this.classList.add('selected');
            });
        }
        
        timeSlotsContainer.appendChild(timeSlot);
    });
}

// Form handlers
function initializeFormHandlers() {
    const bookingForm = document.getElementById('booking-form');
    
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(bookingForm);
        const selectedTimeSlot = document.querySelector('.time-slot.selected');
        const selectedDate = document.getElementById('selected-date').value;
        
        // Validation
        if (!selectedDate) {
            showNotification('Please select a date from the calendar.', 'error');
            return;
        }
        
        if (!selectedTimeSlot) {
            showNotification('Please select a time slot.', 'error');
            return;
        }
        
        // Add selected time to form data
        formData.append('selected-time', selectedTimeSlot.dataset.time);
        
        // Simulate booking submission
        submitBooking(formData);
    });
}

// Submit booking (API call to backend)
async function submitBooking(formData) {
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
    submitBtn.disabled = true;
    
    try {
        // Prepare booking data
        const bookingData = Object.fromEntries(formData);
        const selectedTimeSlot = document.querySelector('.time-slot.selected');
        const selectedDate = document.getElementById('selected-date').value;
        
        // Add selected time and date to booking data
        bookingData.appointment_date = selectedDate;
        bookingData.appointment_time = selectedTimeSlot ? selectedTimeSlot.dataset.time : '';
        
        // Send to backend API
        const response = await fetch('api/appointments.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            showNotification(
                `Appointment booked successfully! We've sent the details to our team and will contact you shortly to confirm. ${result.email_sent ? '📧 Email notification sent!' : ''}`,
                'success'
            );
            
            // Reset form
            document.getElementById('booking-form').reset();
            document.getElementById('selected-date').value = '';
            document.getElementById('time-slots').innerHTML = '';
            
            // Remove calendar selection
            document.querySelectorAll('.fc-daygrid-day').forEach(day => {
                day.classList.remove('fc-day-selected');
            });
            
            console.log('✅ Appointment booked:', result.appointment);
        } else {
            throw new Error(result.error || 'Failed to book appointment');
        }
        
    } catch (error) {
        console.error('❌ Booking error:', error);
        showNotification(
            `Failed to book appointment: ${error.message}. Please try again or contact us directly.`,
            'error'
        );
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Navigation handlers
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Initialize animations
function initializeAnimations() {
    // Trigger animations on page load
    setTimeout(() => {
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            element.style.opacity = '1';
        });
    }, 100);
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
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
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-close:hover {
        opacity: 0.7;
    }
`;
document.head.appendChild(notificationStyles);