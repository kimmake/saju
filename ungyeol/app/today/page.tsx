import { redirect } from 'next/navigation';

/** 예전 공유 링크(/today) 호환: 통합 결과 흐름으로 보낸다. 저장(동의)된 정보가 있으면 바로 오늘의 운세가 열린다. */
export default function TodayRedirect() {
  redirect('/?go=today');
}
