<?php
session_start();

// Check authentication
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    header('Location: index.php');
    exit();
}

// Database connection
try {
    $pdo = new PDO('sqlite:../database/appointments.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}

// Handle status updates
if (isset($_POST['update_status'])) {
    $id = $_POST['appointment_id'];
    $status = $_POST['status'];
    
    try {
        $stmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        $success_message = "Appointment status updated successfully!";
    } catch (PDOException $e) {
        $error_message = "Error updating appointment: " . $e->getMessage();
    }
}

// Handle appointment deletion
if (isset($_POST['delete_appointment'])) {
    $id = $_POST['appointment_id'];
    
    try {
        $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = ?");
        $stmt->execute([$id]);
        $success_message = "Appointment deleted successfully!";
    } catch (PDOException $e) {
        $error_message = "Error deleting appointment: " . $e->getMessage();
    }
}

// Get filter parameters
$status_filter = isset($_GET['status']) ? $_GET['status'] : 'all';
$search = isset($_GET['search']) ? $_GET['search'] : '';

// Build query
$query = "SELECT * FROM appointments WHERE 1=1";
$params = [];

if ($status_filter !== 'all') {
    $query .= " AND status = ?";
    $params[] = $status_filter;
}

if (!empty($search)) {
    $query .= " AND (name LIKE ? OR email LIKE ? OR service LIKE ?)";
    $search_param = "%$search%";
    $params[] = $search_param;
    $params[] = $search_param;
    $params[] = $search_param;
}

$query .= " ORDER BY created_at DESC";

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $appointments = [];
    $error_message = "Error fetching appointments: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Swift Agency - Appointments Management</title>
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
        .table-card {
            border-radius: 15px;
            border: none;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .filter-card {
            border-radius: 15px;
            border: none;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
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
                        <a class="nav-link" href="dashboard.php">
                            <i class="fas fa-home me-2"></i>Dashboard
                        </a>
                        <a class="nav-link active" href="appointments.php">
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
                        <h2><i class="fas fa-calendar me-2"></i>Appointments Management</h2>
                        <a href="dashboard.php" class="btn btn-outline-primary">
                            <i class="fas fa-arrow-left me-2"></i>Back to Dashboard
                        </a>
                    </div>
                    
                    <!-- Success/Error Messages -->
                    <?php if (isset($success_message)): ?>
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            <i class="fas fa-check-circle me-2"></i><?php echo $success_message; ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    <?php endif; ?>
                    
                    <?php if (isset($error_message)): ?>
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="fas fa-exclamation-circle me-2"></i><?php echo $error_message; ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Filters -->
                    <div class="card filter-card">
                        <div class="card-body">
                            <form method="GET" class="row g-3">
                                <div class="col-md-4">
                                    <label for="status" class="form-label">Filter by Status</label>
                                    <select class="form-select" id="status" name="status">
                                        <option value="all" <?php echo $status_filter === 'all' ? 'selected' : ''; ?>>All Statuses</option>
                                        <option value="pending" <?php echo $status_filter === 'pending' ? 'selected' : ''; ?>>Pending</option>
                                        <option value="confirmed" <?php echo $status_filter === 'confirmed' ? 'selected' : ''; ?>>Confirmed</option>
                                        <option value="completed" <?php echo $status_filter === 'completed' ? 'selected' : ''; ?>>Completed</option>
                                        <option value="cancelled" <?php echo $status_filter === 'cancelled' ? 'selected' : ''; ?>>Cancelled</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="search" class="form-label">Search</label>
                                    <input type="text" class="form-control" id="search" name="search" 
                                           placeholder="Search by name, email, or service..." value="<?php echo htmlspecialchars($search); ?>">
                                </div>
                                <div class="col-md-2 d-flex align-items-end">
                                    <button type="submit" class="btn btn-primary w-100">
                                        <i class="fas fa-search me-2"></i>Filter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <!-- Appointments Table -->
                    <div class="card table-card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-list me-2"></i>Appointments List 
                                <span class="badge bg-light text-primary ms-2"><?php echo count($appointments); ?> total</span>
                            </h5>
                        </div>
                        <div class="card-body p-0">
                            <?php if (empty($appointments)): ?>
                                <div class="p-5 text-center text-muted">
                                    <i class="fas fa-calendar-times fa-3x mb-3"></i>
                                    <h5>No appointments found</h5>
                                    <p>No appointments match your current filters.</p>
                                </div>
                            <?php else: ?>
                                <div class="table-responsive">
                                    <table class="table table-hover mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Contact</th>
                                                <th>Service</th>
                                                <th>Date & Time</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach ($appointments as $appointment): ?>
                                                <tr>
                                                    <td><strong>#<?php echo $appointment['id']; ?></strong></td>
                                                    <td>
                                                        <strong><?php echo htmlspecialchars($appointment['name']); ?></strong>
                                                        <?php if (!empty($appointment['message'])): ?>
                                                            <br><small class="text-muted" title="<?php echo htmlspecialchars($appointment['message']); ?>">
                                                                <i class="fas fa-comment"></i> Has message
                                                            </small>
                                                        <?php endif; ?>
                                                    </td>
                                                    <td>
                                                        <div><i class="fas fa-envelope me-1"></i><?php echo htmlspecialchars($appointment['email']); ?></div>
                                                        <div><i class="fas fa-phone me-1"></i><?php echo htmlspecialchars($appointment['phone']); ?></div>
                                                    </td>
                                                    <td><?php echo htmlspecialchars($appointment['service']); ?></td>
                                                    <td>
                                                        <div><i class="fas fa-calendar me-1"></i><?php echo htmlspecialchars($appointment['date']); ?></div>
                                                        <div><i class="fas fa-clock me-1"></i><?php echo htmlspecialchars($appointment['time']); ?></div>
                                                    </td>
                                                    <td>
                                                        <span class="badge bg-<?php 
                                                            echo match($appointment['status']) {
                                                                'pending' => 'warning',
                                                                'confirmed' => 'info',
                                                                'completed' => 'success',
                                                                'cancelled' => 'danger',
                                                                default => 'secondary'
                                                            };
                                                        ?>">
                                                            <?php echo ucfirst($appointment['status']); ?>
                                                        </span>
                                                    </td>
                                                    <td><?php echo date('M j, Y', strtotime($appointment['created_at'])); ?></td>
                                                    <td>
                                                        <div class="btn-group" role="group">
                                                            <!-- Status Update -->
                                                            <button type="button" class="btn btn-sm btn-outline-primary" 
                                                                    data-bs-toggle="modal" data-bs-target="#statusModal<?php echo $appointment['id']; ?>">
                                                                <i class="fas fa-edit"></i>
                                                            </button>
                                                            
                                                            <!-- View Details -->
                                                            <button type="button" class="btn btn-sm btn-outline-info" 
                                                                    data-bs-toggle="modal" data-bs-target="#detailModal<?php echo $appointment['id']; ?>">
                                                                <i class="fas fa-eye"></i>
                                                            </button>
                                                            
                                                            <!-- Delete -->
                                                            <button type="button" class="btn btn-sm btn-outline-danger" 
                                                                    data-bs-toggle="modal" data-bs-target="#deleteModal<?php echo $appointment['id']; ?>">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                                <!-- Status Update Modal -->
                                                <div class="modal fade" id="statusModal<?php echo $appointment['id']; ?>" tabindex="-1">
                                                    <div class="modal-dialog">
                                                        <div class="modal-content">
                                                            <div class="modal-header">
                                                                <h5 class="modal-title">Update Appointment Status</h5>
                                                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                                            </div>
                                                            <form method="POST">
                                                                <div class="modal-body">
                                                                    <input type="hidden" name="appointment_id" value="<?php echo $appointment['id']; ?>">
                                                                    <div class="mb-3">
                                                                        <label for="status<?php echo $appointment['id']; ?>" class="form-label">Status</label>
                                                                        <select class="form-select" name="status" id="status<?php echo $appointment['id']; ?>">
                                                                            <option value="pending" <?php echo $appointment['status'] === 'pending' ? 'selected' : ''; ?>>Pending</option>
                                                                            <option value="confirmed" <?php echo $appointment['status'] === 'confirmed' ? 'selected' : ''; ?>>Confirmed</option>
                                                                            <option value="completed" <?php echo $appointment['status'] === 'completed' ? 'selected' : ''; ?>>Completed</option>
                                                                            <option value="cancelled" <?php echo $appointment['status'] === 'cancelled' ? 'selected' : ''; ?>>Cancelled</option>
                                                                        </select>
                                                                    </div>
                                                                    <p class="text-muted">Appointment: <strong><?php echo htmlspecialchars($appointment['name']); ?></strong> - <?php echo htmlspecialchars($appointment['service']); ?></p>
                                                                </div>
                                                                <div class="modal-footer">
                                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                                    <button type="submit" name="update_status" class="btn btn-primary">Update Status</button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Detail Modal -->
                                                <div class="modal fade" id="detailModal<?php echo $appointment['id']; ?>" tabindex="-1">
                                                    <div class="modal-dialog modal-lg">
                                                        <div class="modal-content">
                                                            <div class="modal-header">
                                                                <h5 class="modal-title">Appointment Details</h5>
                                                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                                            </div>
                                                            <div class="modal-body">
                                                                <div class="row">
                                                                    <div class="col-md-6">
                                                                        <h6>Client Information</h6>
                                                                        <p><strong>Name:</strong> <?php echo htmlspecialchars($appointment['name']); ?></p>
                                                                        <p><strong>Email:</strong> <?php echo htmlspecialchars($appointment['email']); ?></p>
                                                                        <p><strong>Phone:</strong> <?php echo htmlspecialchars($appointment['phone']); ?></p>
                                                                    </div>
                                                                    <div class="col-md-6">
                                                                        <h6>Appointment Details</h6>
                                                                        <p><strong>Service:</strong> <?php echo htmlspecialchars($appointment['service']); ?></p>
                                                                        <p><strong>Date:</strong> <?php echo htmlspecialchars($appointment['date']); ?></p>
                                                                        <p><strong>Time:</strong> <?php echo htmlspecialchars($appointment['time']); ?></p>
                                                                        <p><strong>Status:</strong> 
                                                                            <span class="badge bg-<?php 
                                                                                echo match($appointment['status']) {
                                                                                    'pending' => 'warning',
                                                                                    'confirmed' => 'info',
                                                                                    'completed' => 'success',
                                                                                    'cancelled' => 'danger',
                                                                                    default => 'secondary'
                                                                                };
                                                                            ?>">
                                                                                <?php echo ucfirst($appointment['status']); ?>
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <?php if (!empty($appointment['message'])): ?>
                                                                    <hr>
                                                                    <h6>Message</h6>
                                                                    <p class="bg-light p-3 rounded"><?php echo nl2br(htmlspecialchars($appointment['message'])); ?></p>
                                                                <?php endif; ?>
                                                                <hr>
                                                                <p class="text-muted"><small>Created: <?php echo date('F j, Y \a\t g:i A', strtotime($appointment['created_at'])); ?></small></p>
                                                            </div>
                                                            <div class="modal-footer">
                                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Delete Modal -->
                                                <div class="modal fade" id="deleteModal<?php echo $appointment['id']; ?>" tabindex="-1">
                                                    <div class="modal-dialog">
                                                        <div class="modal-content">
                                                            <div class="modal-header">
                                                                <h5 class="modal-title text-danger">Delete Appointment</h5>
                                                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                                            </div>
                                                            <div class="modal-body">
                                                                <p>Are you sure you want to delete this appointment?</p>
                                                                <div class="bg-light p-3 rounded">
                                                                    <strong><?php echo htmlspecialchars($appointment['name']); ?></strong><br>
                                                                    <?php echo htmlspecialchars($appointment['service']); ?><br>
                                                                    <?php echo htmlspecialchars($appointment['date']); ?> at <?php echo htmlspecialchars($appointment['time']); ?>
                                                                </div>
                                                                <p class="text-danger mt-2"><small><i class="fas fa-exclamation-triangle"></i> This action cannot be undone.</small></p>
                                                            </div>
                                                            <div class="modal-footer">
                                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                                <form method="POST" class="d-inline">
                                                                    <input type="hidden" name="appointment_id" value="<?php echo $appointment['id']; ?>">
                                                                    <button type="submit" name="delete_appointment" class="btn btn-danger">Delete</button>
                                                                </form>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>