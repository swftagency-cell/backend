document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('menu');
    
    // Debug: Check if elements are found
    console.log('Hamburger element:', hamburger);
    console.log('Menu element:', menu);
    
    if (!hamburger || !menu) {
        console.error('Hamburger or menu element not found!');
        return;
    }
    
    // Hamburger menu functionality
    hamburger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Hamburger clicked!');
        
        hamburger.classList.toggle('active');
        menu.classList.toggle('active');
        
        console.log('Hamburger active:', hamburger.classList.contains('active'));
        console.log('Menu active:', menu.classList.contains('active'));
    });
    
    // Close mobile menu when clicking on a menu item
    const menuItems = menu.querySelectorAll('li a');
    menuItems.forEach(function(item) {
        item.addEventListener('click', function() {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
        }
    });
});