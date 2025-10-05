
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

const GPAY_BUTTON_CONTAINER_ID = 'gpay-container';

const merchantInfo = {
  // Replace with your Google Pay Merchant ID. This is a TEST ID.
  merchantId: '12345678901234567890', 
  merchantName: 'FlixTrend',
};

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
        // This is configured for Razorpay. Replace with your actual Razorpay Key ID.
        parameters: {
          gateway: 'razorpay',
          gatewayMerchantId: 'rzp_test_YOUR_KEY_ID', // IMPORTANT: This is a test key.
        },
      },
    },
  ],
  merchantInfo,
};
Object.freeze(baseGooglePayRequest);

let paymentsClient = null;

function getGooglePaymentsClient() {
  if (paymentsClient === null) {
    paymentsClient = new google.payments.api.PaymentsClient({
      environment: 'TEST', // Use 'PRODUCTION' for real payments
      merchantInfo,
    });
  }
  return paymentsClient;
}

const deepCopy = obj => JSON.parse(JSON.stringify(obj));

function renderGooglePayButton() {
  const gpayContainer = document.getElementById(GPAY_BUTTON_CONTAINER_ID);
  if (!gpayContainer) return;

  // Clear previous button
  gpayContainer.innerHTML = "";

  const button = getGooglePaymentsClient().createButton({
    onClick: onGooglePaymentButtonClicked,
    buttonType: 'buy', 
    buttonSizeMode: 'fill',
  });
  gpayContainer.appendChild(button);
}

function onGooglePayLoaded() {
  const req = deepCopy(baseGooglePayRequest);
  getGooglePaymentsClient()
    .isReadyToPay(req)
    .then(function (res) {
      if (res.result) {
        renderGooglePayButton();
        // Watch for amount changes
        const gpayContainer = document.getElementById(GPAY_BUTTON_CONTAINER_ID);
        if (gpayContainer) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-amount') {
                        // The amount has changed, re-render the button if necessary
                        // In this simple case, the button doesn't change, but this is good practice
                    }
                });
            });
            observer.observe(gpayContainer, { attributes: true });
        }
      } else {
        console.log('Google Pay is not ready for this user.');
      }
    })
    .catch(console.error);
}

function onGooglePaymentButtonClicked() {
    const gpayContainer = document.getElementById(GPAY_BUTTON_CONTAINER_ID);
    if (!gpayContainer) {
        console.error("Google Pay container not found");
        return;
    }
    const amount = gpayContainer.getAttribute('data-amount') || '0';

    const req = {
        ...deepCopy(baseGooglePayRequest),
        transactionInfo: {
            countryCode: 'IN',
            currencyCode: 'INR',
            totalPriceStatus: 'FINAL',
            totalPrice: amount,
        },
    };

    console.log('onGooglePaymentButtonClicked', req);

    getGooglePaymentsClient()
    .loadPaymentData(req)
    .then(function (res) {
      console.log('Google Pay Response:', res);
      const paymentToken = res.paymentMethodData.tokenizationData.token;
      
      // Dispatch a custom event with the payment details
      // The React component will listen for this event.
      const event = new CustomEvent('paymentSuccess', {
        detail: {
            token: paymentToken,
            amount: req.transactionInfo.totalPrice
        }
      });
      window.dispatchEvent(event);

      console.log('Payment successful! (Note: This is a test. No real money was charged).');

    })
    .catch(console.error);
}
