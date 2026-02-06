import nodemailer from 'nodemailer';
import { env } from '../config/env';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        // Only initialize if email credentials are provided
        if (env.EMAIL_USER && env.EMAIL_PASSWORD) {
            this.transporter = nodemailer.createTransport({
                host: env.EMAIL_HOST,
                port: parseInt(env.EMAIL_PORT),
                secure: false, // true for 465, false for other ports
                auth: {
                    user: env.EMAIL_USER,
                    pass: env.EMAIL_PASSWORD,
                },
            });
        } else {
            console.warn('⚠️  Email service not configured. OTP emails will be logged to console.');
        }
    }

    async sendOTP(email: string, otp: string, name: string): Promise<void> {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset OTP</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Password Reset Request</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                            Hello <strong>${name}</strong>,
                                        </p>
                                        <p style="margin: 0 0 30px; color: #666666; font-size: 15px; line-height: 1.6;">
                                            We received a request to reset your password for your BillMate24 account. Use the OTP code below to complete the password reset process:
                                        </p>
                                        
                                        <!-- OTP Box -->
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px 40px; display: inline-block;">
                                                        <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                                                        <p style="margin: 10px 0 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                            ${otp}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                                            This code will expire in <strong>10 minutes</strong>
                                        </p>
                                        
                                        <!-- Warning Box -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                            <tr>
                                                <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 8px;">
                                                    <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5;">
                                                        <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support if you have concerns about your account security.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="margin: 0 0 10px; color: #6c757d; font-size: 13px;">
                                            BillMate24
                                        </p>
                                        <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                                            This is an automated email. Please do not reply.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: `"BillMate24" <${env.EMAIL_FROM}>`,
                    to: email,
                    subject: 'Password Reset OTP - BillMate24',
                    html: htmlContent,
                });
                console.log(`✅ OTP email sent to ${email}`);
            } catch (error) {
                console.error('❌ Failed to send email:', error);
                throw new Error('Failed to send OTP email');
            }
        } else {
            // Development mode: log OTP to console
            console.log('\n' + '='.repeat(60));
            console.log('📧 OTP EMAIL (Development Mode)');
            console.log('='.repeat(60));
            console.log(`To: ${email}`);
            console.log(`Name: ${name}`);
            console.log(`OTP: ${otp}`);
            console.log(`Expires: 10 minutes`);
            console.log('='.repeat(60) + '\n');
        }
    }
}

export const emailService = new EmailService();
