const nodemailer = require("nodemailer");

const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "🎉 Activate your account in the online store - Email Verification",
    html: `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activate your email address</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 600;
            }
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            .icon {
                width: 80px;
                height: 80px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
            }
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            .content h2 {
                color: #333;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .content p {
                color: #666;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
            }
            .verify-btn {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 15px 40px;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 600;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
            }
            .verify-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
            }
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #eee;
            }
            .footer p {
                color: #888;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .security-note {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                color: #856404;
            }
            .security-note strong {
                color: #b45309;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">📧</div>
                <h1>Welcome to our online store!</h1>
                <p>Just one step to activate your account</p>
            </div>
            
            <div class="content">
                <h2>Confirm your email address</h2>
                <p>
                    Thank you for signing up with our online store! 🎉<br>
                    To complete the registration and activate your account, please click the button below:
                </p>
                
                <a href="http://localhost:4200/login?verify=${token}" class="verify-btn">
                    ✅ Activate your account now
                </a>
                
                <div class="security-note">
                    <strong>⚠️ Security Note:</strong><br>
                    If you did not create this account, please ignore this email.
                    This link is valid for 24 hours only.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Our Online Store</strong></p>
                <p>We are here to serve you 24/7</p>
                <p style="font-size: 12px; color: #aaa;">
                    This is an automated email, please do not reply to it
                </p>
            </div>
        </div>
    </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
