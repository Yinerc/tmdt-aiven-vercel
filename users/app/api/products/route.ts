import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProductRow extends RowDataPacket {
  id: number;
  tensanpham: string;
  hinhanh: string | null;
  gia: number | string;
  soluong: number;
  mota: string | null;
  danhmuc_id: number | null;
  tendanhmuc: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim() || '';
    const danhmucId = searchParams.get('danhmuc_id');

    let query = `
      SELECT 
        sp.id,
        sp.tensanpham,
        sp.hinhanh,
        sp.gia,
        sp.soluong,
        sp.mota,
        sp.danhmuc_id,
        dm.tendanhmuc
      FROM sanpham sp
      LEFT JOIN danhmuc dm ON sp.danhmuc_id = dm.id
      WHERE sp.trangthai = 1
    `;

    const params: Array<string | number> = [];

    if (search) {
      query += ` AND sp.tensanpham LIKE ?`;
      params.push(`%${search}%`);
    }

    if (danhmucId) {
      query += ` AND sp.danhmuc_id = ?`;
      params.push(Number(danhmucId));
    }

    query += ` ORDER BY sp.id DESC`;

    const [rows] = await pool.query<ProductRow[]>(query, params);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching products:', error);

    const message =
      error instanceof Error ? error.message : 'Không thể tải danh sách sản phẩm';

    return NextResponse.json(
      {
        success: false,
        message: 'Không thể tải danh sách sản phẩm',
        error: message,
      },
      { status: 500 }
    );
  }
}