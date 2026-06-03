// services/emailService.js

require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter object dynamically, falling back to Gmail service if host or port are not configured in the environment
const transportConfig = {};
if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
  transportConfig.host = process.env.EMAIL_HOST;
  transportConfig.port = parseInt(process.env.EMAIL_PORT, 10);
  transportConfig.secure = transportConfig.port === 465;
} else {
  transportConfig.service = 'gmail';
}
transportConfig.auth = {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS, // This should be the 16-character App Password for Gmail
};

const transporter = nodemailer.createTransport(transportConfig);

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