import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/admin/agreements/:path*'],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') throw new Error('Not admin');
    return NextResponse.next();
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL('/admin', req.url));
    res.cookies.set('admin_token', '', { maxAge: 0 });
    return res;
  }
}
