# 사주 8글자 검증 (1900–2027)

독립 기준값과 `computeChart()` 결과를 대조한다.

- 일주: 날짜 일련번호 공식(2000-01-01 = 戊午), 시주: 오서둔 공식 + 23시부터 다음 날 일주
- 년·월주: 寿星天文历 C++ 구현(`sxtwl`)의 절기 시각
- 한국 표준시(UTC+8:30 시기)·서머타임 보정은 문서 기준으로 따로 구현
- 대상: 1900-01-01~2027-12-31 매일 3개 시각(00:10, 12:00, 23:40) + 모든 절입 ±1분/±10분

```bash
pip install sxtwl
python3 scripts/verify/ref.py          # cases.json 생성(현재 폴더)
npx tsx scripts/verify/run.ts          # 대조 (cases.json이 있는 폴더에서 실행)
```
