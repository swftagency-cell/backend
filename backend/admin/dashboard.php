<?php
session_start();

// Check authentication
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    header('Location: index.php');
    exit();
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit();
}

// Database connections
try {
    $appointments_db = new PDO('sqlite:../database/appointments.db');
    $appointments_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $enquiries_db = new PDO('sqlite:../database/enquiries.db');
    $enquiries_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $chatbot_db = new PDO('sqlite:../database/chatbot.db');
    $chatbot_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}

// Get statistics
$stats = [];

// Appointments stats
try {
    $stmt = $appointments_db->query("SELECT COUNT(*) as total FROM appointments");
    $stats['total_appointments'] = $stmt->fetch()['total'];
    
    $stmt = $appointments_db->query("SELECT COUNT(*) as pending FROM appointments WHERE status = 'pending'");
    $stats['pending_appointments'] = $stmt->fetch()['pending'];
} catch (PDOException $e) {
    $stats['total_appointments'] = 0;
    $stats['pending_appointments'] = 0;
}

// Enquiries stats
try {
    $stmt = $enquiries_db->query("SELECT COUNT(*) as total FROM enquiries");
    $stats['total_enquiries'] = $stmt->fetch()['total'];
    
    $stmt = $enquiries_db->query("SELECT COUNT(*) as new FROM enquiries WHERE status = 'new'");
    $stats['new_enquiries'] = $stmt->fetch()['new'];
} catch (PDOException $e) {
    $stats['total_enquiries'] = 0;
    $stats['new_enquiries'] = 0;
}

// Chat sessions stats
try {
    $stmt = $chatbot_db->query("SELECT COUNT(*) as total FROM chat_sessions");
    $stats['total_chats'] = $stmt->fetch()['total'];
} catch (PDOException $e) {
    $stats['total_chats'] = 0;
}

// Get recent appointments
$recent_appointments = [];
try {
    $stmt = $appointments_db->query("SELECT * FROM appointments ORDER BY created_at DESC LIMIT 5");
    $recent_appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Handle error silently
}

// Get recent enquiries
$recent_enquiries = [];
try {
    $stmt = $enquiries_db->query("SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 5");
    $recent_enquiries = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Handle error silently
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Swift Agency - Admin Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .sidebar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .sidebar .nav-link {
            color: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            margin: 2px 0;
        }
        .sidebar .nav-link:hover,
        .sidebar .nav-link.active {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        .stat-card {
            border-radius: 15px;
            border: none;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .table-card {
            border-radius: 15px;
            border: none;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 col-lg-2 px-0">
                <div class="sidebar p-3">
                    <h4 class="mb-4"><i class="fas fa-tachometer-alt me-2"></i>Swift Admin</h4>
                    <nav class="nav flex-column">
                        <a class="nav-link active" href="dashboard.php">
                            <i class="fas fa-home me-2"></i>Dashboard
                        </a>
                        <a class="nav-link" href="appointments.php">
                            <i class="fas fa-calendar me-2"></i>Appointments
                        </a>
                        <a class="nav-link" href="enquiries.php">
                            <i class="fas fa-envelope me-2"></i>Enquiries
                        </a>
                        <a class="nav-link" href="analytics.php">
                            <i class="fas fa-chart-bar me-2"></i>Analytics
                        </a>
                        <hr class="my-3">
                        <a class="nav-link" href="?logout=1">
                            <i class="fas fa-sign-out-alt me-2"></i>Logout
                        </a>
                    </nav>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="col-md-9 col-lg-10">
                <div class="p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>Dashboard Overview</h2>
                        <span class="text-muted"><?php echo date('F j, Y'); ?></span>
                    </div>
                    
                    <!-- Statistics Cards -->
                    <div class="row mb-4">
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card text-center p-3">
                                <div class="card-body">
                                    <i class="fas fa-calendar fa-2x text-primary mb-2"></i>
                                    <h3 class="text-primary"><?php echo $stats['total_appointments']; ?></h3>
                                    <p class="text-muted mb-0">Total Appointments</p>
                                    <small class="text-warning"><?php echo $stats['pending_appointments']; ?> pending</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card text-center p-3">
                                <div class="card-body">
                                    <i class="fas fa-envelope fa-2x text-success mb-2"></i>
                                    <h3 class="text-success"><?php echo $stats['total_enquiries']; ?></h3>
                                    <p class="text-muted mb-0">Total Enquiries</p>
                                    <small class="text-warning"><?php echo $stats['new_enquiries']; ?> new</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card text-center p-3">
                                <div class="card-body">
                                    <i class="fas fa-comments fa-2x text-info mb-2"></i>
                                    <h3 class="text-info"><?php echo $stats['total_chats']; ?></h3>
                                    <p class="text-muted mb-0">Chat Sessions</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card text-center p-3">
                                <div class="card-body">
                                    <i class="fas fa-users fa-2x text-warning mb-2"></i>
                                    <h3 class="text-warning"><?php echo $stats['total_appointments'] + $stats['total_enquiries']; ?></h3>
                                    <p class="text-muted mb-0">Total Leads</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Data -->
                    <div class="row">
                        <!-- Recent Appointments -->
                        <div class="col-md-6 mb-4">
                            <div class="card table-card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="fas fa-calendar me-2"></i>Recent Appointments</h5>
                                </div>
                                <div class="card-body p-0">
                                    <?php if (empty($recent_appointments)): ?>
                                        <div class="p-3 text-center text-muted">
                                            <i class="fas fa-calendar-times fa-2x mb-2"></i>
                                            <p>No appointments yet</p>
                                        </div>
                                    <?php else: ?>
                                        <div class="table-responsive">
                                            <table class="table table-hover mb-0">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Service</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php foreach ($recent_appointments as $appointment): ?>
                                                        <tr>
                                                            <td><?php echo htmlspecialchars($appointment['name']); ?></td>
                                                            <td><?php echo htmlspecialchars($appointment['service']); ?></td>
                                                            <td><?php echo htmlspecialchars($appointment['date']); ?></td>
                                                            <td>
                                                                <span class="badge bg-<?php echo $appointment['status'] === 'pending' ? 'warning' : 'success'; ?>">
                                                                    <?php echo ucfirst($appointment['status']); ?>
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                <div class="card-footer text-center">
                                    <a href="appointments.php" class="btn btn-primary btn-sm">View All Appointments</a>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Recent Enquiries -->
                        <div class="col-md-6 mb-4">
                            <div class="card table-card">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0"><i class="fas fa-envelope me-2"></i>Recent Enquiries</h5>
                                </div>
                                <div class="card-body p-0">
                                    <?php if (empty($recent_enquiries)): ?>
                                        <div class="p-3 text-center text-muted">
                                            <i class="fas fa-envelope-open fa-2x mb-2"></i>
                                            <p>No enquiries yet</p>
                                        </div>
                                    <?php else: ?>
                                        <div class="table-responsive">
                                            <table class="table table-hover mb-0">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Service</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php foreach ($recent_enquiries as $enquiry): ?>
                                                        <tr>
                                                            <td><?php echo htmlspecialchars($enquiry['name']); ?></td>
                                                            <td><?php echo htmlspecialchars($enquiry['service']); ?></td>
                                                            <td><?php echo date('M j', strtotime($enquiry['created_at'])); ?></td>
                                                            <td>
                                                                <span class="badge bg-<?php echo $enquiry['status'] === 'new' ? 'info' : 'success'; ?>">
                                                                    <?php echo ucfirst($enquiry['status']); ?>
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                <div class="card-footer text-center">
                                    <a href="enquiries.php" class="btn btn-success btn-sm">View All Enquiries</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>