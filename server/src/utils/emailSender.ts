import nodemailer from 'nodemailer';

// Configures the transporter (the "postman")
// Better to create it outside the function to avoid reconnecting for each email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password
  },
});


export const sendVerificationEmail = async (userEmail: string, verificationCode: string) => {
  try {
    // Verify that the configuration is correct (optional, useful for debugging)
    // await transporter.verify(); 
    const info = await transporter.sendMail({
      from: `"Participium Team" <${process.env.EMAIL_USER}>`, // Must match the authenticated user
      to: userEmail,
      subject: 'Verify your email for Participium',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to Participium!</h2>
          <p>In order to complete your registration, please enter the following code:</p>
          <h1 style="letter-spacing: 5px; color: #4CAF50;">${verificationCode}</h1>
          <p>The code will expire in 15 minutes.</p>
          <p>If you did not sign up for Participium, please ignore this email.</p>
          <br/>
          <br>
          <p> If you loose the otp screen, you can always request a new one by waiting 15 minutes. </p>
          <br/>
          <p>Best regards,<br/>The Participium Team</p>
        </div>
      `,
    });

    console.log("Message sent: %s", info.messageId);
    return info;

  } catch (error) {
    console.error("Error sending email with Nodemailer:", error);
    throw error;
  }
};