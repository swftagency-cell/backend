<?php
/**
 * Email notification system for Swift Agency
 * Handles sending emails for form submissions and notifications
 */

require_once dirname(__DIR__) . '/config/config.php';

class EmailNotification {
    private $smtpHost;
    private $smtpPort;
    private $smtpUsername;
    private $smtpPassword;
    private $smtpEncryption;
    private $fromEmail;
    private $fromName;
    
    public function __construct() {
        $this->smtpHost = SMTP_HOST;
        $this->smtpPort = SMTP_PORT;
        $this->smtpUsername = SMTP_USERNAME;
        $this->smtpPassword = SMTP_PASSWORD;
        $this->smtpEncryption = SMTP_ENCRYPTION;
        $this->fromEmail = FROM_EMAIL;
        $this->fromName = FROM_NAME;
    }
    
    /**
     * Send email using PHP's mail() function (fallback)
     */
    public function sendSimpleEmail($to, $subject, $message, $headers = []) {
        $defaultHeaders = [
            'From' => $this->fromName . ' <' . $this->fromEmail . '>',
            'Reply-To' => $this->fromEmail,
            'Content-Type' => 'text/html; charset=UTF-8',
            'X-Mailer' => 'PHP/' . phpversion()
        ];
        
        $headers = array_merge($defaultHeaders, $headers);
        $headerString = '';
        foreach ($headers as $key => $value) {
            $headerString .= $key . ': ' . $value . "\r\n";
        }
        
        try {
            $result = mail($to, $subject, $message, $headerString);
            if ($result) {
                writeLog("Email sent successfully to: $to");
                return true;
            } else {
                writeLog("Failed to send email to: $to", 'ERROR');
                return false;
            }
        } catch (Exception $e) {
            writeLog("Email error: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    /**
     * Send appointment confirmation email
     */
    public function sendAppointmentConfirmation($appointmentData) {
        $to = $appointmentData['email'];
        $subject = 'Appointment Confirmation - ' . SITE_NAME;
        
        $message = $this->getEmailTemplate('appointment_confirmation', [
            'name' => $appointmentData['name'],
            'service' => $appointmentData['service'],
            'date' => $appointmentData['preferred_date'],
            'time' => $appointmentData['preferred_time'],
            'message' => $appointmentData['message'] ?? '',
            'site_name' => SITE_NAME,
            'site_url' => SITE_URL
        ]);
        
        return $this->sendSimpleEmail($to, $subject, $message);
    }
    
    /**
     * Send enquiry confirmation email
     */
    public function sendEnquiryConfirmation($enquiryData) {
        $to = $enquiryData['email'];
        $subject = 'Thank you for your enquiry - ' . SITE_NAME;
        
        $message = $this->getEmailTemplate('enquiry_confirmation', [
            'name' => $enquiryData['name'],
            'company' => $enquiryData['company'] ?? '',
            'message' => $enquiryData['message'],
            'site_name' => SITE_NAME,
            'site_url' => SITE_URL
        ]);
        
        return $this->sendSimpleEmail($to, $subject, $message);
    }
    
    /**
     * Send newsletter welcome email
     */
    public function sendNewsletterWelcome($email, $name = '') {
        $to = $email;
        $subject = 'Welcome to ' . SITE_NAME . ' Newsletter!';
        
        $message = $this->getEmailTemplate('newsletter_welcome', [
            'name' => $name ?: 'Subscriber',
            'email' => $email,
            'site_name' => SITE_NAME,
            'site_url' => SITE_URL,
            'unsubscribe_url' => SITE_URL . '/unsubscribe.php?email=' . urlencode($email)
        ]);
        
        return $this->sendSimpleEmail($to, $subject, $message);
    }
    
    /**
     * Send admin notification for new appointment
     */
    public function sendAdminAppointmentNotification($appointmentData) {
        $to = ADMIN_EMAIL;
        $subject = 'New Appointment Request - ' . SITE_NAME;
        
        $message = $this->getEmailTemplate('admin_appointment_notification', [
            'name' => $appointmentData['name'],
            'email' => $appointmentData['email'],
            'phone' => $appointmentData['phone'] ?? 'Not provided',
            'service' => $appointmentData['service'],
            'date' => $appointmentData['preferred_date'],
            'time' => $appointmentData['preferred_time'],
            'message' => $appointmentData['message'] ?? 'No additional message',
            'site_name' => SITE_NAME,
            'admin_url' => SITE_URL . '/admin/appointments.php'
        ]);
        
        return $this->sendSimpleEmail($to, $subject, $message);
    }
    
    /**
     * Send admin notification for new enquiry
     */
    public function sendAdminEnquiryNotification($enquiryData) {
        $to = ADMIN_EMAIL;
        $subject = 'New Enquiry - ' . SITE_NAME;
        
        $message = $this->getEmailTemplate('admin_enquiry_notification', [
            'name' => $enquiryData['name'],
            'email' => $enquiryData['email'],
            'phone' => $enquiryData['phone'] ?? 'Not provided',
            'company' => $enquiryData['company'] ?? 'Not provided',
            'message' => $enquiryData['message'],
            'site_name' => SITE_NAME,
            'admin_url' => SITE_URL . '/admin/enquiries.php'
        ]);
        
        return $this->sendSimpleEmail($to, $subject, $message);
    }
    
    /**
     * Get email template with variables replaced
     */
    private function getEmailTemplate($template, $variables = []) {
        $templates = [
            'appointment_confirmation' => '
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>{{site_name}}</h1>
                        </div>
                        <div class="content">
                            <h2>Appointment Confirmation</h2>
                            <p>Dear {{name}},</p>
                            <p>Thank you for booking an appointment with us. We have received your request and will contact you shortly to confirm the details.</p>
                            <h3>Appointment Details:</h3>
                            <ul>
                                <li><strong>Service:</strong> {{service}}</li>
                                <li><strong>Preferred Date:</strong> {{date}}</li>
                                <li><strong>Preferred Time:</strong> {{time}}</li>
                            </ul>
                            {{#message}}<p><strong>Your Message:</strong> {{message}}</p>{{/message}}
                            <p>We will review your request and get back to you within 24 hours.</p>
                            <p><a href="{{site_url}}" class="button">Visit Our Website</a></p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 {{site_name}}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>',
            
            'enquiry_confirmation' => '
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .button { display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>{{site_name}}</h1>
                        </div>
                        <div class="content">
                            <h2>Thank You for Your Enquiry</h2>
                            <p>Dear {{name}},</p>
                            <p>Thank you for contacting us. We have received your enquiry and will respond as soon as possible.</p>
                            {{#company}}<p><strong>Company:</strong> {{company}}</p>{{/company}}
                            <p><strong>Your Message:</strong></p>
                            <p style="background: white; padding: 15px; border-left: 4px solid #28a745;">{{message}}</p>
                            <p>Our team will review your enquiry and get back to you within 24 hours.</p>
                            <p><a href="{{site_url}}" class="button">Visit Our Website</a></p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 {{site_name}}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>',
            
            'newsletter_welcome' => '
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #6f42c1; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .button { display: inline-block; padding: 10px 20px; background: #6f42c1; color: white; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to {{site_name}}!</h1>
                        </div>
                        <div class="content">
                            <h2>Thank You for Subscribing</h2>
                            <p>Dear {{name}},</p>
                            <p>Welcome to our newsletter! You\'ll now receive the latest updates, news, and exclusive offers from {{site_name}}.</p>
                            <p>Stay tuned for:</p>
                            <ul>
                                <li>Latest blog posts and industry insights</li>
                                <li>Special offers and promotions</li>
                                <li>Company news and updates</li>
                                <li>Tips and best practices</li>
                            </ul>
                            <p><a href="{{site_url}}" class="button">Visit Our Website</a></p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 {{site_name}}. All rights reserved.</p>
                            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> from this newsletter</p>
                        </div>
                    </div>
                </body>
                </html>',
            
            'admin_appointment_notification' => '
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .button { display: inline-block; padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>New Appointment Request</h1>
                        </div>
                        <div class="content">
                            <h2>Appointment Details</h2>
                            <ul>
                                <li><strong>Name:</strong> {{name}}</li>
                                <li><strong>Email:</strong> {{email}}</li>
                                <li><strong>Phone:</strong> {{phone}}</li>
                                <li><strong>Service:</strong> {{service}}</li>
                                <li><strong>Preferred Date:</strong> {{date}}</li>
                                <li><strong>Preferred Time:</strong> {{time}}</li>
                            </ul>
                            <p><strong>Message:</strong></p>
                            <p style="background: white; padding: 15px; border-left: 4px solid #dc3545;">{{message}}</p>
                            <p><a href="{{admin_url}}" class="button">Manage Appointments</a></p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 {{site_name}}. Admin Notification.</p>
                        </div>
                    </div>
                </body>
                </html>',
            
            'admin_enquiry_notification' => '
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #fd7e14; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .button { display: inline-block; padding: 10px 20px; background: #fd7e14; color: white; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>New Enquiry Received</h1>
                        </div>
                        <div class="content">
                            <h2>Enquiry Details</h2>
                            <ul>
                                <li><strong>Name:</strong> {{name}}</li>
                                <li><strong>Email:</strong> {{email}}</li>
                                <li><strong>Phone:</strong> {{phone}}</li>
                                <li><strong>Company:</strong> {{company}}</li>
                            </ul>
                            <p><strong>Message:</strong></p>
                            <p style="background: white; padding: 15px; border-left: 4px solid #fd7e14;">{{message}}</p>
                            <p><a href="{{admin_url}}" class="button">Manage Enquiries</a></p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 {{site_name}}. Admin Notification.</p>
                        </div>
                    </div>
                </body>
                </html>'
        ];
        
        if (!isset($templates[$template])) {
            return 'Template not found';
        }
        
        $content = $templates[$template];
        
        // Replace variables
        foreach ($variables as $key => $value) {
            $content = str_replace('{{' . $key . '}}', $value, $content);
        }
        
        // Handle conditional blocks (simple implementation)
        $content = preg_replace('/{{#\w+}}.*?{{/\w+}}/s', '', $content);
        
        return $content;
    }
}

// Helper function to send emails easily
function sendEmail($type, $data) {
    $emailService = new EmailNotification();
    
    switch ($type) {
        case 'appointment_confirmation':
            return $emailService->sendAppointmentConfirmation($data);
        case 'enquiry_confirmation':
            return $emailService->sendEnquiryConfirmation($data);
        case 'newsletter_welcome':
            return $emailService->sendNewsletterWelcome($data['email'], $data['name'] ?? '');
        case 'admin_appointment':
            return $emailService->sendAdminAppointmentNotification($data);
        case 'admin_enquiry':
            return $emailService->sendAdminEnquiryNotification($data);
        default:
            return false;
    }
}

?>