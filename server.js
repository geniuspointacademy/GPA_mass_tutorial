const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const { Parser } = require('json2csv');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'genius_point_academy'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

// Create registrations table if not exists
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gpa_code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        department VARCHAR(255) NOT NULL,
        matric_number VARCHAR(50) NOT NULL,
        course_count INT NOT NULL,
        courses JSON NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_reference VARCHAR(255) NOT NULL,
        flutterwave_transaction_id VARCHAR(255),
        payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        status ENUM('pending', 'verified', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

db.execute(createTableQuery);

// Function to generate unique GPA code
function generateGPACode(lastCode) {
    if (!lastCode) {
        return 'GPA-001';
    }
    
    const number = parseInt(lastCode.split('-')[1]);
    const newNumber = number + 1;
    return 'GPA-' + newNumber.toString().padStart(3, '0');
}

// API endpoint to handle registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, department, matricNumber, courseCount, courses, amount, paymentMethod, paymentReference, flutterwaveTransactionId, paymentStatus } = req.body;
        
        // Get last GPA code
        const [lastRecord] = await db.promise().execute(
            'SELECT gpa_code FROM registrations ORDER BY id DESC LIMIT 1'
        );
        
        const lastCode = lastRecord.length > 0 ? lastRecord[0].gpa_code : null;
        const gpaCode = generateGPACode(lastCode);
        
        // Insert into database
        const [result] = await db.promise().execute(
            'INSERT INTO registrations (gpa_code, name, email, phone, department, matric_number, course_count, courses, amount, payment_method, payment_reference, flutterwave_transaction_id, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [gpaCode, name, email, phone, department, matricNumber, courseCount, JSON.stringify(courses), amount, paymentMethod, paymentReference, flutterwaveTransactionId || null, paymentStatus || 'pending']
        );
        
        res.json({
            success: true,
            gpaCode: gpaCode,
            message: 'Registration successful'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

// API endpoint to get all registrations (for admin)
app.get('/api/registrations', async (req, res) => {
    try {
        const [rows] = await db.promise().execute(
            'SELECT * FROM registrations ORDER BY created_at DESC'
        );
        
        res.json({
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations'
        });
    }
});

// API endpoint to export registrations as CSV
app.get('/api/export/csv', async (req, res) => {
    try {
        const [rows] = await db.promise().execute(
            'SELECT * FROM registrations ORDER BY created_at DESC'
        );
        
        // Format the data for CSV
        const formattedData = rows.map(row => ({
            'GPA Code': row.gpa_code,
            'Name': row.name,
            'Email': row.email,
            'Phone': row.phone,
            'Department': row.department,
            'Matric Number': row.matric_number,
            'Course Count': row.course_count,
            'Courses': JSON.parse(row.courses).join(', '),
            'Amount': row.amount,
            'Payment Method': row.payment_method,
            'Payment Reference': row.payment_reference,
            'Flutterwave Transaction ID': row.flutterwave_transaction_id || 'N/A',
            'Payment Status': row.payment_status,
            'Registration Status': row.status,
            'Registration Date': new Date(row.created_at).toLocaleDateString('en-NG')
        }));
        
        // Convert to CSV
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(formattedData);
        
        // Set headers for file download
        res.header('Content-Type', 'text/csv');
        res.attachment('genius-point-registrations.csv');
        res.send(csv);
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export CSV'
        });
    }
});

// Admin page for CSV export
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin - Genius Point Academy</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; }
                .btn { padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; }
                .btn:hover { background: #2980b9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Genius Point Academy - Admin Panel</h1>
                <h2>Export Registrations</h2>
                <p>Click the button below to download all registrations as CSV:</p>
                <a href="/api/export/csv" class="btn">Download CSV Export</a>
                <br><br>
                <h2>View All Registrations</h2>
                <div id="registrations"></div>
                <script>
                    fetch('/api/registrations')
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                const container = document.getElementById('registrations');
                                const table = document.createElement('table');
                                table.style.width = '100%';
                                table.border = '1';
                                
                                // Create header
                                const thead = document.createElement('thead');
                                const headerRow = document.createElement('tr');
                                ['GPA Code', 'Name', 'Email', 'Phone', 'Courses', 'Amount', 'Payment Status', 'Date'].forEach(header => {
                                    const th = document.createElement('th');
                                    th.textContent = header;
                                    th.style.padding = '10px';
                                    headerRow.appendChild(th);
                                });
                                thead.appendChild(headerRow);
                                table.appendChild(thead);
                                
                                // Create body
                                const tbody = document.createElement('tbody');
                                data.data.forEach(row => {
                                    const tr = document.createElement('tr');
                                    [row.gpa_code, row.name, row.email, row.phone, JSON.parse(row.courses).join(', '), '₦' + row.amount, row.payment_status, new Date(row.created_at).toLocaleDateString()].forEach(cell => {
                                        const td = document.createElement('td');
                                        td.textContent = cell;
                                        td.style.padding = '8px';
                                        tr.appendChild(td);
                                    });
                                    tbody.appendChild(tr);
                                });
                                table.appendChild(tbody);
                                
                                container.appendChild(table);
                            }
                        });
                </script>
            </div>
        </body>
        </html>
    `);
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
});