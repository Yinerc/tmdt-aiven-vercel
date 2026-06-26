// users\app\api\test-db\route.ts
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    
    return NextResponse.json({
      success: true,
      message: 'Kết nối MySQL thành công!',
      data: rows,
    });
  } catch (error: any) {
    // In lỗi chi tiết ra console
    console.error('=== MYSQL CONNECTION ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Kết nối MySQL thất bại',
        error: error.message || 'Unknown error',
        code: error.code || null,
      },
      { status: 500 }
    );
  }
}