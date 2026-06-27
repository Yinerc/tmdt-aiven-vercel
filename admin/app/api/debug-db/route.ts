import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [products] = await pool.query<any[]>(
      'SELECT COUNT(*) AS total FROM sanpham'
    );

    const [orders] = await pool.query<any[]>(
      'SELECT COUNT(*) AS total FROM donhang'
    );

    const [customers] = await pool.query<any[]>(
      'SELECT COUNT(*) AS total FROM khachhang'
    );

    return NextResponse.json({
      success: true,
      sanpham: products[0]?.total ?? 0,
      donhang: orders[0]?.total ?? 0,
      khachhang: customers[0]?.total ?? 0,
      env: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_NAME: process.env.DB_NAME,
        DB_SSL: process.env.DB_SSL,
        DB_PASSWORD_EXISTS: Boolean(process.env.DB_PASSWORD),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}