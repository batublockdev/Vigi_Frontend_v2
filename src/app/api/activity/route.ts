import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const asset = searchParams.get('asset') || null;
  const search = searchParams.get('search') || null;
  const action = searchParams.get('action') || null;

  const offset = (page - 1) * limit;
  const pool = getPool();
  const client = await pool.connect();

  try {
    let query = 'SELECT * FROM stockwallet_activity WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (asset) {
      query += ` AND asset = $${paramIndex++}`;
      params.push(asset);
    }
    if (action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(action);
    }
    if (search) {
      query += ` AND (reason ILIKE $${paramIndex} OR asset ILIKE $${paramIndex} OR action ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countRes = await client.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count);

    // Fetch paginated
    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const res = await client.query(query, params);

    return NextResponse.json({
      success: true,
      data: res.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
