import { NextResponse } from 'next/server';

// DB DESCONECTADA — retorna datos vacíos en modo local
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
  });
}
