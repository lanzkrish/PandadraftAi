require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Sending from:', process.env.RESEND_FROM_EMAIL);
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TacoDraft <noreply@tacodraft.ai>',
      to: ['kanha94377@gmail.com'],
      subject: 'TacoDraft AI - Final Test Verification Email',
      html: '<p>Hi there,</p><p>This is a final test verification email triggered from your TacoDraft workspace.</p>',
    });
    console.log('Result:', data);
  } catch (err) {
    console.error('Error sending email:', err.message);
  }
}

testEmail();
