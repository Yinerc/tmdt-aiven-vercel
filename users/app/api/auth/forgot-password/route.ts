// users\app\api\auth\forgot-password\route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is missing. Email sending is disabled.');
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập email' }, { status: 400 });
    }

    // Kiểm tra email có tồn tại không
    const [users]: any = await pool.query(
      'SELECT id FROM khachhang WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Trả về thành công để không tiết lộ email có tồn tại hay không (bảo mật)
      return NextResponse.json({ success: true, message: 'Nếu email tồn tại, link reset đã được gửi.' });
    }

    // Tạo token reset
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Hết hạn sau 1 giờ

    // Xóa token cũ (nếu có)
    await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);

    // Lưu token mới
    await pool.query(
      `INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)`,
      [email, token, expiresAt]
    );

    // Gửi email
    // Tạo link reset password
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/customer/auth/reset-password?token=${token}`;

    // Nội dung email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Đặt lại mật khẩu</h2>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản TMDT.</p>
        <p>Bấm vào nút bên dưới để đặt lại mật khẩu:</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#dc2626;color:white;text-decoration:none;border-radius:6px;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Nếu nút không hoạt động, hãy copy link này:</p>
        <p>${resetLink}</p>
        <p>Link này sẽ hết hạn sau một thời gian ngắn.</p>
      </div>
    `;

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: 'TMDT <onboarding@resend.dev>',
        to: email,
        subject: 'Đặt lại mật khẩu',
        html: htmlContent,
      });
    } else {
      console.warn('RESEND_API_KEY is missing. Skip sending reset password email.');
    }

    return NextResponse.json({
      success: true,
      message: 'Nếu email tồn tại, link reset đã được gửi.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi' },
      { status: 500 }
    );
  }
}