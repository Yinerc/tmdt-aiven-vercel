// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID sản phẩm' },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        sp.id,
        sp.tensanpham,
        sp.hinhanh,
        sp.gia,
        sp.soluong,
        sp.mota,
        sp.danhmuc_id,
        dm.tendanhmuc,
        sp.created_at
      FROM sanpham sp
      LEFT JOIN danhmuc dm ON sp.danhmuc_id = dm.id
      WHERE sp.id = ? AND sp.trangthai = 1
      LIMIT 1
    `;

    const [rows]: any = await pool.query(query, [productId]);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching product by ID:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi khi lấy thông tin sản phẩm',
        error: error.message,
      },
      { status: 500 }
    );
  }
}