import { NextResponse } from 'next/server';
import { analyze } from '@/lib/saju/analyze';
import type { SajuInput } from '@/lib/saju/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function valid(b: any): b is SajuInput {
  return b && (b.calendar === 'solar' || b.calendar === 'lunar') && b.birth
    && Number.isInteger(b.birth.year) && Number.isInteger(b.birth.month) && Number.isInteger(b.birth.day)
    && b.birth.year >= 1900 && b.birth.month >= 1 && b.birth.month <= 12 && b.birth.day >= 1 && b.birth.day <= 31
    && (b.time === null || (Number.isInteger(b.time?.hour) && b.time.hour >= 0 && b.time.hour <= 23 && Number.isInteger(b.time.minute) && b.time.minute >= 0 && b.time.minute <= 59))
    && [null, 'female', 'male'].includes(b.gender) && [null, undefined, 'dst', 'std'].includes(b.dstChoice);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!valid(body)) return NextResponse.json({ error: '입력값을 확인해 주세요.' }, { status: 400 });
  const input: SajuInput = { name: null, isLeapMonth: !!body.isLeapMonth, region: '대한민국', dstChoice: body.dstChoice ?? null, calendar: body.calendar, birth: body.birth, time: body.time, gender: body.gender };
  try {
    return NextResponse.json(await analyze(input));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || '분석 중 문제가 생겼어요. 다시 시도해 주세요.' }, { status: 422 });
  }
}
