
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//=============================================================================
// Configuration
//=============================================================================

// The DOM element that the Google Pay button will be rendered into
const GPAY_BUTTON_CONTAINER_ID = 'gpay-container';

// **ACTION REQUIRED**: Update the `merchantId` and `merchantName` properties with your own values.
// These fields are optional when the environment is `TEST`.
// Get your merchantId from the Google Pay & Wallet Console at https://pay.google.com/business/console/
const merchantInfo = {
  // Replace '12345678901234567890' with your Google Pay Merchant ID
  merchantId: '12345678901234567890',
  merchantName: 'FlixTrend',
};

/**
 * This is the base configuration for all Google Pay requests. This
 * configuration will be cloned, modified, and used for all Google Pay requests.
 *
 * @see {@link https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist}
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects}
 * @see {@link https://razorpay.com/docs/payments/payment-methods/google-pay/web/standard-checkout/}
 */
const baseGooglePayRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: [
    {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        // **ACTION REQUIRED**: This section is now configured for Razorpay.
        // Set the 'gateway' to 'razorpay' and replace 'YOUR_RAZORPAY_KEY_ID'
        // with the Key ID from your Razorpay Dashboard.
        parameters: {
          gateway: 'razorpay',
          gatewayMerchantId: 'YOUR_RAZORPAY_KEY_ID', // Replace with your Razorpay Key ID
        },
      },
    },
  ],
  merchantInfo,
};

// Prevent accidental edits to the base configuration. Mutations will be
// handled by cloning the config using deepCopy() and modifying the copy.
Object.freeze(baseGooglePayRequest);

//=============================================================================
// Google payments client singleton
//=============================================================================

/**
 * A variable to store the Google Payments Client instance.
 * Initialized to null to indicate it hasn't been created yet.
 */
let paymentsClient = null;

/**
 * Gets an instance of the Google Payments Client.
 *
 * This function ensures that only one instance of the Google Payments Client
 * is created and reused throughout the application. It lazily initializes
 * the client if it hasn't been created yet.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#PaymentsClient}
 * @return {google.payments.api.PaymentsClient} Google Payments Client instance.
 */
function getGooglePaymentsClient() {
  // Check if the paymentsClient has already been initialized.
  if (paymentsClient === null) {
    // If not, create a new instance of the Google Payments Client.
    paymentsClient = new google.payments.api.PaymentsClient({
      // Set the environment for the client ('TEST' or 'PRODUCTION').
      // `TEST` is default. When you are ready to go live, change this to 'PRODUCTION'.
      environment: 'TEST',
      // Add the merchant information
      merchantInfo,
      paymentDataCallbacks: {
          onPaymentDataChanged: onPaymentDataChanged,
          onPaymentAuthorized: onPaymentAuthorized
      }
    });
  }

  return paymentsClient;
}

//=============================================================================
// Helpers
//=============================================================================

/**
 * Creates a deep copy of an object.
 *
 * This function uses JSON serialization and deserialization to create a deep
 * copy of the provided object. It's a convenient way to clone objects without
 * worrying about shared references.
 *
 * @param {Object} obj - The object to be copied.
 * @returns {Object} A deep copy of the original object.
 */
const deepCopy = obj => JSON.parse(JSON.stringify(obj));

/**
 * Renders the Google Pay button to the DOM.
 *
 * This function creates a Google Pay button using the Google Pay API and adds
 * it to the container element specified by `GPAY_BUTTON_CONTAINER_ID`.
 * When clicked, button triggers the `onGooglePaymentButtonClicked` handler.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#createButton}
 * @returns {void}
 */
function renderGooglePayButton() {
  try {
      const button = getGooglePaymentsClient().createButton({
        onClick: onGooglePaymentButtonClicked,
        allowedPaymentMethods: baseGooglePayRequest.allowedPaymentMethods,
      });
      document.getElementById(GPAY_BUTTON_CONTAINER_ID).innerHTML = ''; // Clear previous button
      document.getElementById(GPAY_BUTTON_CONTAINER_ID).appendChild(button);
  } catch (error) {
      console.error("Failed to render Google Pay button:", error);
  }
}

//=============================================================================
// Event Handlers & Callbacks
//=============================================================================

function onPaymentDataChanged(intermediatePaymentData) {
    // Handle changes to payment data here, e.g., for shipping options
    return {};
}

function onPaymentAuthorized(paymentData) {
    return new Promise(function(resolve, reject){
        // The tokenizationData.token is the Razorpay token.
        const razorpayToken = paymentData.paymentMethodData.tokenizationData.token;
        console.log('Razorpay Token:', razorpayToken);
        
        // **ACTION REQUIRED**: Dispatch a custom event with the payment details.
        // The React component will listen for this event.
        const event = new CustomEvent('paymentSuccess', { detail: { 
            token: razorpayToken, 
            amount: document.getElementById('gpay-container').dataset.amount 
        }});
        window.dispatchEvent(event);

        // For this simulation, we'll always resolve as successful.
        // In a real app, this resolve would happen after your backend confirms the payment.
        resolve({ transactionState: 'SUCCESS' });
    });
}

function onGooglePayLoaded() {
  getGooglePaymentsClient()
    .isReadyToPay(baseGooglePayRequest)
    .then(function (res) {
      if (res.result) {
        renderGooglePayButton();
      } else {
        console.log('Google Pay is not ready for this user.');
        document.getElementById(GPAY_BUTTON_CONTAINER_ID).innerText = 'Google Pay is not available.';
      }
    })
    .catch(console.error);
}

function onGooglePaymentButtonClicked() {
  const amount = document.getElementById('gpay-container')?.dataset.amount;
  if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount to add.");
      return;
  }
  
  const transactionInfo = {
    countryCode: 'IN', // Set to India
    currencyCode: 'INR', // Set to Indian Rupees
    totalPriceStatus: 'FINAL',
    totalPrice: amount,
    totalPriceLabel: 'Total'
  };

  const req = {
    ...deepCopy(baseGooglePayRequest),
    transactionInfo,
  };

  getGooglePaymentsClient()
    .loadPaymentData(req)
    .catch(err => {
        console.error("Error loading payment data:", err);
    });
}
