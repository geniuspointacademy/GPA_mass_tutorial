let selectedPaymentMethod = '';
let selectedAccountName = '';
let selectedFlutterwaveKey = '';

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI to show selection
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    
    if (method === 'flutterwave1') {
        document.getElementById('paymentMethod1').classList.add('selected');
        selectedFlutterwaveKey = 'FLWPUBK_TEST-3804d4406c9295d35d6b7ce0d23365fb-X'; // First account
        selectedAccountName = 'GENIUS POINT - SAMSON';
    } else if (method === 'flutterwave2') {
        document.getElementById('paymentMethod2').classList.add('selected');
        selectedFlutterwaveKey = 'FLWPUBK_TEST-3753c9c6b091185310572db345cc8211-X'; // Second account
        selectedAccountName = 'YAKUB ABIDEEN-GENIUS POINT'; // Change if different name
    }
    
    // Enable payment button
    document.getElementById('payButton').disabled = false;
    
    // Update payment details text
    const paymentDetails = document.getElementById('paymentDetails');
    paymentDetails.innerHTML = `
        <div style="margin: 20px 0;">
            <h3>Online Payment</h3>
            <p>You will be redirected to a secure payment page to complete your transaction via Flutterwave.</p>
            <p><strong>Account Name:</strong> ${selectedAccountName}</p>
            <p><strong>Accepted Methods:</strong> Card, Bank Transfer, USSD, Mobile Money</p>
        </div>
    `;
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
    registrationData.selectedAccount = selectedAccountName;
    
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
            description: `Mass Tutorials Registration for ${registrationData.courses.length} course(s) - ${selectedAccountName}`,
            logo: 'https://via.placeholder.com/100x100/3498db/ffffff?text=GPA',
        },
        callback: function(response) {
            if (response.status === 'successful') {
                registrationData.paymentMethod = selectedPaymentMethod;
                registrationData.flutterwaveTransactionId = response.transaction_id;
                registrationData.paymentStatus = 'completed';
                registrationData.accountName = selectedAccountName;
                completeRegistration();
            } else {
                alert('Payment was not successful. Please try again.');
            }
        },
        onclose: function() {
            console.log('Payment modal closed');
        }
    });
}

