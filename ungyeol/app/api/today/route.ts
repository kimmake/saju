import { NextResponse } from 'next/server';
import { kstToday, todayDate, todayFortune } from '@/lib/saju/today';
import type { SajuInput } from '@/lib/saju/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function valid(b: any): boolean {
  return b && (b.calendar === 'solar' || b.calendar === 'lunar') && b.birth
    && Number.isInteger(b.birth.year) && Number.isInteger(b.birth.month) && Number.isInteger(b.birth.day)
    && b.birth.year >= 1900 && b.birth.month >= 1 && b.birth.month <= 12 && b.birth.day >= 1 && b.birth.day <= 31
    && (b.time === null || (Number.isInteger(b.time?.hour) && b.time.hour >= 0 && b.time.hour <= 23 && Number.isInteger(b.time.minute) && b.time.minute >= 0 && b.time.minute <= 59))
    && [null, 'female', 'male'].includes(b.gender) && [null, undefined, 'dst', 'std'].includes(b.dstChoice);
}

/** 오늘의 운세: 날짜는 서버가 한국 시간 기준으로 정한다. 출생 정보는 저장하지 않는다. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!valid(body)) return NextResponse.json({ error: '입력값을 확인해 주세요.' }, { status: 400 });
  const input: SajuInput = { name: null, isLeapMonth: !!body.isLeapMonth, region: '대한민국', dstChoice: body.dstChoice ?? null, calendar: body.calendar, birth: body.birth, time: body.time, gender: body.gender };
  const { ymd, nextRefreshAt } = kstToday();
  try {
    return NextResponse.json(todayFortune(input, ymd, nextRefreshAt), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || '운세를 불러오지 못했어요. 다시 시도해 주세요.' }, { status: 422 });
  }
}

/** 입력 전 화면용: 오늘 날짜와 일진만 돌려준다. */
export async function GET() {
  const { ymd, nextRefreshAt } = kstToday();
  return NextResponse.json({ date: todayDate(ymd, nextRefreshAt) }, { headers: { 'Cache-Control': 'no-store' } });
}
