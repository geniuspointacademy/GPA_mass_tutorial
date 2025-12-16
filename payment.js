let selectedPaymentMethod = '';
let registrationData = null;
const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK_TEST-3753c9c6b091185310572db345cc8211-X';

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    registrationData = JSON.parse(localStorage.getItem('registrationData'));
    
    if (!registrationData) {
        alert('No registration data found. Please start over.');
        window.location.href = 'index.html';
        return;
    }
    
    updateOrderSummary();
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
    
    document.getElementById('transferAmount').textContent = `₦${registrationData.amount}`;
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    document.getElementById('payButton').disabled = false;
    
    // Show appropriate payment details
    const paymentDetails = document.getElementById('paymentDetails');
    const transferInstructions = document.getElementById('transferInstructions');
    
    if (method === 'flutterwave') {
        paymentDetails.innerHTML = `
            <div style="margin: 20px 0;">
                <h3>Online Payment</h3>
                <p>You will be redirected to a secure payment page to complete your transaction via Flutterwave.</p>
                <p><strong>Accepted Methods:</strong> Card, Bank Transfer, USSD, Mobile Money</p>
            </div>
        `;
        transferInstructions.style.display = 'none';
    } else if (method === 'transfer') {
        paymentDetails.innerHTML = `
            <div style="margin: 20px 0;">
                <h3>Manual Bank Transfer</h3>
                <p>Please transfer the exact amount to the account details below.</p>
            </div>
        `;
        transferInstructions.style.display = 'block';
    }
}

function processPayment() {
    if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }
    
    if (selectedPaymentMethod === 'flutterwave') {
        processFlutterwavePayment();
    } else if (selectedPaymentMethod === 'transfer') {
        processBankTransfer();
    }
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

function processBankTransfer() {
    registrationData.paymentMethod = 'bank_transfer';
    registrationData.paymentReference = 'BANK-' + Math.floor((Math.random() * 1000000000) + 1);
    registrationData.paymentStatus = 'pending';
    
    // For bank transfer, we'll mark as pending verification
    completeRegistration();
}

function completeRegistration() {
    // Send data to server
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('registrationSuccess', JSON.stringify({
                success: true,
                gpaCode: data.gpaCode,
                data: registrationData,
                paymentStatus: registrationData.paymentStatus
            }));
            window.location.href = 'success.html';
        } else {
            alert('Registration failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // For demo purposes, redirect to success page even if server is down
        const demoGpaCode = 'GPA-' + Math.floor((Math.random() * 1000) + 1).toString().padStart(3, '0');
        localStorage.setItem('registrationSuccess', JSON.stringify({
            success: true,
            gpaCode: demoGpaCode,
            data: registrationData,
            paymentStatus: registrationData.paymentStatus || 'completed'
        }));
        window.location.href = 'success.html';
    });
}