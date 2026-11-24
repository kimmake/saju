# 배경 에셋 생성

`public/art/`의 한지 텍스처와 수묵 그림은 이 폴더의 스크립트로 렌더링한 래스터 이미지다 (numpy + Pillow).

```bash
cd scripts/art
python3 hanji.py ../../public/art            # hanji.webp, hanji-ivory.webp (720px 반복 타일)
python3 landscape.py ../../public/art        # mountains-left/right, moon-panorama, enso
python3 landscape.py ../../public/art "" enso   # 특정 그림만 다시 생성
```

시드가 고정되어 있어 같은 결과가 나온다. 그림 안에는 글자를 넣지 않는다.
