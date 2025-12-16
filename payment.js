// ==================== GLOBAL VARIABLES ====================
let selectedPaymentMethod = '';
let selectedAccountName = '';
let selectedFlutterwaveKey = '';
let registrationData = null;

// Flutterwave API Keys - BOTH IN TEST MODE
const FLUTTERWAVE_KEY_1 = 'FLWPUBK_TEST-3804d4406c9295d35d6b7ce0d23365fb-X'; // First TEST account
const FLUTTERWAVE_KEY_2 = 'FLWPUBK_TEST-3753c9c6b091185310572db345cc8211-X'; // Second TEST account

// ==================== INITIALIZE PAGE ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Payment page loaded');
    
    // Load registration data from localStorage
    try {
        const storedData = localStorage.getItem('registrationData');
        if (!storedData) {
            throw new Error('No registration data found');
        }
        
        registrationData = JSON.parse(storedData);
        console.log('Registration data loaded:', registrationData);
        
        // Display order summary
        updateOrderSummary();
        
    } catch (error) {
        console.error('Error loading registration data:', error);
        alert('No registration data found. Please register first.');
        window.location.href = 'index.html';
        return;
    }
});

// ==================== UPDATE ORDER SUMMARY ====================
function updateOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    
    if (!registrationData) {
        orderSummary.innerHTML = '<p style="color: red;">No registration data found</p>';
        return;
    }
    
    orderSummary.innerHTML = `
        <div style="background: #ecf0f1; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3>📋 Order Summary</h3>
            <p><strong>👤 Name:</strong> ${registrationData.name || 'Not provided'}</p>
            <p><strong>📧 Email:</strong> ${registrationData.email || 'Not provided'}</p>
            <p><strong>📱 Phone:</strong> ${registrationData.phone || 'Not provided'}</p>
            <p><strong>🏫 Department:</strong> ${registrationData.department || 'Not provided'}</p>
            <p><strong>🎓 Matric Number:</strong> ${registrationData.matricNumber || 'Not provided'}</p>
            <p><strong>📚 Courses:</strong> ${Array.isArray(registrationData.courses) ? registrationData.courses.join(', ') : 'No courses selected'}</p>
            <p><strong>💰 Total Amount:</strong> ₦${registrationData.amount || 0}</p>
        </div>
    `;
}

// ==================== SELECT PAYMENT METHOD ====================
function selectPaymentMethod(method) {
    console.log('Payment method selected:', method);
    
    // Update selected method
    selectedPaymentMethod = method;
    
    // Remove 'selected' class from all payment methods
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add 'selected' class to clicked payment method
    if (method === 'flutterwave1') {
        document.getElementById('paymentMethod1').classList.add('selected');
        selectedFlutterwaveKey = FLUTTERWAVE_KEY_1;
        selectedAccountName = 'YAKUB ABIDEEN (Account 1)';
    } else if (method === 'flutterwave2') {
        document.getElementById('paymentMethod2').classList.add('selected');
        selectedFlutterwaveKey = FLUTTERWAVE_KEY_2;
        selectedAccountName = 'YAKUB ABIDEEN (Account 2)';
    }
    
    // Enable the payment button
    document.getElementById('payButton').disabled = false;
    
    // Update payment details display
    updatePaymentDetails();
}

// ==================== UPDATE PAYMENT DETAILS ====================
function updatePaymentDetails() {
    const paymentDetails = document.getElementById('paymentDetails');
    
    if (!selectedPaymentMethod) {
        paymentDetails.innerHTML = '<p style="color: #e74c3c;">Please select a payment method above.</p>';
        return;
    }
    
    paymentDetails.innerHTML = `
        <div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 5px;">
            <h3>✅ ${selectedPaymentMethod === 'flutterwave1' ? 'Online Payment 1' : 'Online Payment 2'}</h3>
            <p>You will be redirected to a secure Flutterwave payment page.</p>
            <p><strong>Account Name:</strong> ${selectedAccountName}</p>
            <p><strong>Amount to Pay:</strong> ₦${registrationData.amount || 0}</p>
            <p><strong>Accepted Methods:</strong> Card, Bank Transfer, USSD, Mobile Money</p>
            
            <div class="accepted-cards" style="margin-top: 15px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" style="width: 50px; height: 30px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" style="width: 50px; height: 30px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/40/Verve_%28card%29.png" alt="Verve" style="width: 50px; height: 30px;">
            </div>
        </div>
    `;
}

// ==================== PROCESS PAYMENT ====================
function processPayment() {
    console.log('Process payment called. Selected method:', selectedPaymentMethod);
    
    // Validate selection
    if (!selectedPaymentMethod) {
        alert('⚠️ Please select a payment method first.');
        return;
    }
    
    if (!selectedFlutterwaveKey) {
        alert('❌ Payment configuration error. Please refresh the page.');
        return;
    }
    
    // Generate a unique payment reference
    const paymentReference = 'GPA-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    console.log('Generated payment reference:', paymentReference);
    
    // Update registration data with payment info
    registrationData.paymentReference = paymentReference;
    registrationData.paymentMethod = selectedPaymentMethod;
    registrationData.accountName = selectedAccountName;
    
    // Process via Flutterwave
    processFlutterwavePayment();
}

// ==================== FLUTTERWAVE PAYMENT ====================
function processFlutterwavePayment() {
    console.log('Starting Flutterwave payment with key:', selectedFlutterwaveKey.substring(0, 20) + '...');
    
    // Configure Flutterwave checkout
    FlutterwaveCheckout({
        public_key: selectedFlutterwaveKey,
        tx_ref: registrationData.paymentReference,
        amount: registrationData.amount,
        currency: 'NGN',
        payment_options: 'card, banktransfer, ussd, mobilemoney',
        customer: {
            email: registrationData.email,
            phone_number: registrationData.phone,
            name: registrationData.name,
        },
        customizations: {
            title: 'Genius Point Academy',
            description: `Mass Tutorials - ${registrationData.courses.length} course(s)`,
            logo: 'https://img.icons8.com/color/96/000000/graduation-cap.png',
        },
        callback: function(response) {
            console.log('Full Flutterwave callback response:', response);
            
            // FIXED: Check for multiple possible success statuses
            const successStatuses = ['successful', 'APPROVED', 'Approved. Successful', 'success'];
            const isSuccessful = successStatuses.includes(response.status);
            
            if (isSuccessful) {
                console.log('✅ Payment successful! Transaction ID:', response.transaction_id);
                
                // Payment successful - update registration data
                registrationData.flutterwaveTransactionId = response.transaction_id;
                registrationData.paymentStatus = 'completed';
                registrationData.actualStatus = response.status; // Store actual status for debugging
                
                // Generate GPA Code ONLY after successful payment
                registrationData.gpaCode = generateGPACode();
                console.log('Generated GPA Code:', registrationData.gpaCode);
                
                // Complete the registration process
                completeRegistration();
            } else {
                console.log('❌ Payment failed. Status:', response.status, 'Message:', response.message);
                alert(`❌ Payment was not successful.\nStatus: ${response.status}\nMessage: ${response.message || 'No error message'}`);
            }
        },
        onclose: function() {
            console.log('Payment modal closed by user');
        }
    });
}

// ==================== COMPLETE REGISTRATION ====================
function completeRegistration() {
    console.log('Completing registration with data:', registrationData);
    
    // Prepare final data for Google Sheets
    const finalData = {
        ...registrationData,
        gpaCode: registrationData.gpaCode,
        timestamp: new Date().toISOString()
    };
    
    console.log('Sending to Google Sheets:', finalData);
    
    // Save to Google Sheets via Apps Script
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwpEH5v62e8eGYTreXKfXsB6SsMF1aJJn3ha0mg2IOtrO4CKSF1ZUHgCI4sCX9JLrom/exec';
    
    fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData)
    })
    .then(() => {
        console.log('✅ Data sent to Google Sheets');
        
        // Save success data and redirect
        localStorage.setItem('registrationSuccess', JSON.stringify({
            success: true,
            gpaCode: registrationData.gpaCode,
            data: registrationData,
            paymentStatus: 'completed',
            transactionId: registrationData.flutterwaveTransactionId
        }));
        
        // Clear old registration data
        localStorage.removeItem('registrationData');
        
        console.log('Redirecting to success page...');
        
        // Redirect to success page
        window.location.href = 'success.html';
    })
    .catch((error) => {
        console.error('❌ Error saving to Google Sheets:', error);
        
        // Still show success to user even if Google Sheets fails
        localStorage.setItem('registrationSuccess', JSON.stringify({
            success: true,
            gpaCode: registrationData.gpaCode,
            data: registrationData,
            paymentStatus: 'completed',
            transactionId: registrationData.flutterwaveTransactionId,
            note: 'Please contact admin if you don\'t receive confirmation (Sheet save error)'
        }));
        
        alert('✅ Payment successful! However, there was an issue saving your record. Please note your GPA Code: ' + registrationData.gpaCode);
        
        // Clear old registration data
        localStorage.removeItem('registrationData');
        
        window.location.href = 'success.html';
    });
}

// ==================== HELPER FUNCTIONS ====================
function generateGPACode() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GPA-${timestamp}${random}`;
}

// ==================== TEST UTILITIES ====================
// You can run these in browser console for testing

function testWithSampleData() {
    // Create test registration data
    const testData = {
        name: 'John Test',
        email: 'john.test@example.com',
        phone: '08012345678',
        department: 'Computer Science',
        matricNumber: '20/CS/001',
        courses: ['PHY 101', 'CHE 101'],
        amount: 400
    };
    
    localStorage.setItem('registrationData', JSON.stringify(testData));
    console.log('Test data loaded. Refresh page to see it.');
    location.reload();
}

function clearTestData() {
    localStorage.removeItem('registrationData');
    localStorage.removeItem('registrationSuccess');
    console.log('All test data cleared.');
    location.reload();
}

// Auto-run debug info on page load
setTimeout(function() {
    console.log('=== GENIUS POINT ACADEMY DEBUG INFO ===');
    console.log('registrationData:', registrationData);
    console.log('selectedPaymentMethod:', selectedPaymentMethod);
    console.log('selectedFlutterwaveKey:', selectedFlutterwaveKey ? selectedFlutterwaveKey.substring(0, 20) + '...' : 'Not selected');
    console.log('=======================================');
}, 1000);
