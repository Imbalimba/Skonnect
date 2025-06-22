<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Password Reset</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-container {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            max-width: 150px;
            height: auto;
        }
        .content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .code-container {
            background-color: #2456a6;
            color: white;
            text-align: center;
            padding: 15px;
            font-size: 28px;
            letter-spacing: 5px;
            font-weight: bold;
            border-radius: 5px;
            margin: 20px 0;
        }
        .note {
            font-size: 14px;
            color: #777;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h2>SK Pasig - Password Reset</h2>
        </div>
        
        <div class="content">
            <p>Hello {{ $name }},</p>
            
            <p>We received a request to reset your password for your account with Sangguniang Kabataan Pasig. To reset your password, please use the verification code below:</p>
            
            <div class="code-container">
                {{ $code }}
            </div>
            
            <p>This code will expire in 5 minutes. Please enter this code on the password reset page to continue the process.</p>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <div class="note">
                <p>Note: Do not reply to this email. This is an automated message.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Sangguniang Kabataan Federation - Pasig City. All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>