const { Resend } = require('resend');
const logger = require('./logger');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'info@mail.trixtern.com';

function getReceiptHtml({ userName, planName, amountPaid, credits, orderId, date }) {
  const primaryColor = '#0071E3'; // TacoDraft AI blue
  const bgColor = '#f8fafc';
  const surfaceColor = '#ffffff';
  const textColor = '#1e293b';
  const mutedColor = '#64748b';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt</title>
      <style>
        body { margin: 0; padding: 0; background-color: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: ${textColor}; }
        .container { max-width: 600px; margin: 40px auto; background: ${surfaceColor}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { background: ${primaryColor}; padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 15px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; margin-bottom: 24px; font-weight: 500; }
        .receipt-card { background: ${bgColor}; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
        .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .row:last-child { border-bottom: none; }
        .label { color: ${mutedColor}; font-size: 14px; font-weight: 500; }
        .value { font-weight: 600; font-size: 14px; text-align: right; }
        .total-row { display: flex; justify-content: space-between; padding-top: 16px; margin-top: 16px; border-top: 2px dashed #cbd5e1; font-size: 18px; font-weight: 700; color: ${primaryColor}; }
        .button-container { text-align: center; margin: 40px 0 20px 0; }
        .button { display: inline-block; background: ${primaryColor}; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; transition: background 0.2s; }
        .footer { text-align: center; padding: 30px; border-top: 1px solid #f1f5f9; color: ${mutedColor}; font-size: 13px; background: #ffffff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TacoDraft AI</h1>
          <p>Subscription Payment Successful!</p>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${userName || 'there'},</div>
          <p style="line-height: 1.6; color: ${mutedColor}; margin-bottom: 30px;">
            Thank you for subscribing to TacoDraft AI! Your payment has been successfully processed and your account is now upgraded. Here are your receipt details:
          </p>
          
          <div class="receipt-card">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%;">
              <tr>
                <td class="label" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: ${mutedColor}; font-size: 14px; font-weight: 500;">Date</td>
                <td class="value" align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 14px; text-align: right;">${date}</td>
              </tr>
              <tr>
                <td class="label" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: ${mutedColor}; font-size: 14px; font-weight: 500;">Order ID</td>
                <td class="value" align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 14px; text-align: right; font-family: monospace;">${orderId || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: ${mutedColor}; font-size: 14px; font-weight: 500;">Plan Details</td>
                <td class="value" align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 14px; text-align: right;">${planName} Plan</td>
              </tr>
              <tr>
                <td class="label" style="padding: 12px 0; color: ${mutedColor}; font-size: 14px; font-weight: 500;">Credits Added</td>
                <td class="value" align="right" style="padding: 12px 0; font-weight: 600; font-size: 14px; text-align: right;">${credits} Credits</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 16px; border-bottom: 2px dashed #cbd5e1;"></td>
              </tr>
              <tr>
                <td style="padding-top: 16px; font-size: 18px; font-weight: 700; color: ${primaryColor};">Amount Paid</td>
                <td align="right" style="padding-top: 16px; font-size: 18px; font-weight: 700; color: ${primaryColor}; text-align: right;">₹${amountPaid}</td>
              </tr>
            </table>
          </div>
          
          <div class="button-container">
            <a href="${process.env.APP_URL || 'https://autodraftai.onrender.com'}/dashboard" class="button">Go to Dashboard</a>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">If you have any questions, simply reply to this email.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} TacoDraft AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendPaymentReceiptEmail({ userEmail, userName, planName, amountPaid, credits, orderId }) {
  if (!userEmail) {
    logger.info('Skipping email receipt: No email provided.');
    return;
  }

  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const htmlContent = getReceiptHtml({ userName, planName, amountPaid, credits, orderId, date });

  try {
    const { data, error } = await resend.emails.send({
      from: `TacoDraft AI <${FROM_EMAIL}>`,
      to: [userEmail],
      subject: `Receipt for your ${planName} Plan Subscription`,
      html: htmlContent,
    });

    if (error) {
      logger.error('Resend API Error:', error);
    } else {
      logger.info(`Payment receipt sent successfully to ${userEmail} (ID: ${data.id})`);
    }
  } catch (error) {
    logger.error('Failed to send payment receipt email:', error.message);
  }
}

module.exports = {
  sendPaymentReceiptEmail
};
