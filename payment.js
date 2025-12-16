let selectedPaymentMethod = 'flutterwave'; // Set default to flutterwave
let registrationData = null;
const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK_TEST-3804d4406c9295d35d6b7ce0d23365fb-X';

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    registrationData = JSON.parse(localStorage.getItem('registrationData'));
    
    if (!registrationData) {
        alert('No registration data found. Please start over.');
        window.location.href = 'index.html';
        return;
    }
    
    updateOrderSummary();
    // Automatically select flutterwave as the only option
    document.querySelector('.payment-method').classList.add('selected');
    document.getElementById('payButton').disabled = false;
});

function updateOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    orderSummary.innerHTML = `
        <div style="background: #ecf0f1; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3>Order Summary</h3>
            <p><strong>Name:</strong> ${registrationData.name}</p>
            <p><strong>Email:</strong> ${registrationData.email}</p>
            <p><strong>Phone:</strong> ${registrationData.phone}</p>
            <p><strong>Department:</strong> ${registrationData.department}</p>
            <p><strong>Matric Number:</strong> ${registrationData.matricNumber}</p>
            <p><strong>Courses:</strong> ${registrationData.courses.join(', ')}</p>
            <p><strong>Total Amount:</strong> ₦${registrationData.amount}</p>
        </div>
    `;
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    document.getElementById('payButton').disabled = false;
}

function processPayment() {
    if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }
    
    processFlutterwavePayment();
}

function processFlutterwavePayment() {
    registrationData.paymentReference = 'GPA-' + Date.now();
    
    FlutterwaveCheckout({
        public_key: FLUTTERWAVE_PUBLIC_KEY,
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
            description: `Mass Tutorials Registration for ${registrationData.courses.length} course(s)`,
            logo: 'https://via.placeholder.com/100x100/3498db/ffffff?text=GPA',
        },
        callback: function(response) {
            // Payment successful
            if (response.status === 'successful') {
                registrationData.paymentMethod = 'flutterwave';
                registrationData.flutterwaveTransactionId = response.transaction_id;
                registrationData.paymentStatus = 'completed';
                registrationData.accountName = 'YAKUB ABIDEEN';
                completeRegistration();
            } else {
                alert('Payment was not successful. Please try again.');
            }
        },
        onclose: function() {
            // Payment modal closed
            console.log('Payment modal closed');
        }
    });
}

function completeRegistration() {
    // Generate GPA code (only after successful payment)
    const gpaCode = generateGPACode();
    registrationData.gpaCode = gpaCode;
    
    // Send data to Google Apps Script
    fetch('https://script.google.com/macros/s/AKfycbwpEH5v62e8eGYTreXKfXsB6SsMF1aJJn3ha0mg2IOtrO4CKSF1ZUHgCI4sCX9JLrom/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
    })
    .then(() => {
        // Success - redirect to success page
        localStorage.setItem('registrationSuccess', JSON.stringify({
            success: true,
            gpaCode: gpaCode,
            data: registrationData
        }));
        
        // Clear registration data
        localStorage.removeItem('registrationData');
        
        window.location.href = 'success.html';
    })
    .catch(error => {
        console.error('Error:', error);
        // Still redirect to success page even if Google Sheets fails
        localStorage.setItem('registrationSuccess', JSON.stringify({
            success: true,
            gpaCode: gpaCode,
            data: registrationData
        }));
        window.location.href = 'success.html';
    });
}

function generateGPACode() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GPA-${timestamp}${random}`;
}
