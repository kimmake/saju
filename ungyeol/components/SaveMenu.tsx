'use client';
import { useEffect, useRef } from 'react';
import { Knot } from './Frame';

export type SaveKind = 'full-png' | 'today-png' | 'sns-png' | 'full-pdf';
export interface Privacy { name: boolean; date: boolean; time: boolean; gender: boolean }

interface Props {
  open: boolean; busy: SaveKind | null; msg: string; msgErr: boolean; privacy: Privacy; hasName: boolean; sajuReady: boolean;
  onPrivacy: (p: Privacy) => void; onPick: (k: SaveKind) => void; onClose: () => void;
}

const ITEMS: { k: SaveKind; t: string; d: string }[] = [
  { k: 'full-png', t: '전체 사주 결과 이미지 저장', d: '오늘의 운세부터 사주팔자·오행·여덟 가지 풀이까지 펼친 상태로 모두 담아요. 길이에 맞춰 이미지가 늘어나고, 기기 한도를 넘으면 여러 장으로 나눠요.' },
  { k: 'today-png', t: '오늘의 운세 이미지 저장', d: '오늘의 총운·분야별 상세 풀이·행운 요소·잘 맞는 띠·한마디를 화면과 같은 모양으로 저장해요.' },
  { k: 'sns-png', t: 'SNS 공유용 이미지 저장', d: '인스타그램 스토리·카카오톡용 1080×1920 요약 포스터. 이름·생년월일·출생 시간은 넣지 않아요.' },
  { k: 'full-pdf', t: '전체 사주 결과 PDF 저장', d: '전체 결과를 A4 여러 쪽의 PDF로 저장해요. 인쇄하거나 오래 보관하기 좋아요.' },
];

/** 결과 저장 선택 창 */
export default function SaveMenu({ open, busy, msg, msgErr, privacy, hasName, sajuReady, onPrivacy, onPick, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  const set = (k: keyof Privacy) => (e: React.ChangeEvent<HTMLInputElement>) => onPrivacy({ ...privacy, [k]: e.target.checked });
  return (
    <dialog ref={ref} className="savemenu" aria-labelledby="save-title" onClose={onClose} onCancel={e => { if (busy) e.preventDefault(); }}>
      <div className="savemenu__inner">
        <header>
          <h2 id="save-title" className="brush">결과 저장하기</h2>
          <Knot />
        </header>
        <ul>
          {ITEMS.map(it => {
            const disabled = !!busy || ((it.k === 'full-png' || it.k === 'full-pdf') && !sajuReady);
            return (
              <li key={it.k}>
                <button className="savemenu__item" onClick={() => onPick(it.k)} disabled={disabled} aria-busy={busy === it.k}>
                  <strong>{busy === it.k ? '만드는 중… 잠시만 기다려 주세요' : it.t}</strong><span>{it.d}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <fieldset className="savemenu__privacy">
          <legend>전체 결과·오늘의 운세 저장에 넣을 정보</legend>
          <div>
            <label className="check"><input type="checkbox" checked={privacy.name} disabled={!hasName} onChange={set('name')} />이름 또는 별명</label>
            <label className="check"><input type="checkbox" checked={privacy.date} onChange={set('date')} />생년월일</label>
            <label className="check"><input type="checkbox" checked={privacy.time} onChange={set('time')} />태어난 시간</label>
            <label className="check"><input type="checkbox" checked={privacy.gender} onChange={set('gender')} />성별</label>
          </div>
          <p className="note">사주팔자 표(여덟 글자)는 풀이의 일부라 항상 들어가요. 여덟 글자로 생년월일을 짐작할 수 있으니 공유할 때는 참고해 주세요. SNS 공유용 이미지에는 위 정보가 들어가지 않아요.</p>
        </fieldset>
        <p aria-live="polite" className="save-msg" data-error={msgErr} style={{ margin: 0 }}>{msg}</p>
        {!sajuReady && <p className="note">사주 해석서를 아직 불러오는 중이라 전체 저장은 잠시 뒤에 할 수 있어요.</p>}
        <button className="btn btn--secondary btn--block" onClick={onClose} disabled={!!busy}>닫기</button>
      </div>
    </dialog>
  );
}
