// services/emailService.js

require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter object using the SMTP transport settings from the .env file
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  // 'secure: false' is correct for port 587, which uses STARTTLS encryption.
  // For port 465 (SMTPS), this would be 'true'.
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This should be the 16-character App Password for Gmail
  },
});

/**
 * Sends a patient summary email with a PDF attachment.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} patientName - The patient's full name.
 * @param {string} summaryContent - The text content for the email body (not used in HTML).
 * @param {Buffer} pdfBuffer - The buffer containing the generated PDF data.
 */
async function sendPatientSummaryEmail(toEmail, patientName, summaryContent, pdfBuffer) {
  try {
    const mailOptions = {
      from: `"SwiftMedLink" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Your Health Summary - ${patientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Health Summary for ${patientName}</h2>
          <p>Dear ${patientName},</p>
          <p>As requested by your doctor, your latest health summary is attached to this email as a PDF document. Please keep it for your records.</p>
          <p>If you have any questions, do not hesitate to consult with your doctor.</p>
          <br>
          <p>Best regards,<br/><b>The SwiftMedLink Team</b></p>
        </div>
      `,
      attachments: [
        {
          filename: `Health_Summary_${patientName.replace(/\s/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: " + info.response);
  } catch (error) {
    console.error("Failed to send email:", error);
    // Re-throw the error so the calling function's catch block can handle it
    throw error;
  }
}

module.exports = {
  sendPatientSummaryEmail,
};