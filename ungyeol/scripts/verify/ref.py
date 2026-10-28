# 독립 기준값 생성: 일주는 날짜 일련번호(2000-01-01=戊午) 공식, 시주는 오서둔 공식,
# 년·월주는 寿星天文历 C++ 구현(sxtwl)의 절기 시각으로 계산한다. 한국 표준시/서머타임 보정은 문서 기준으로 따로 구현.
import sxtwl, json, datetime as dt, sys
S='甲乙丙丁戊己庚辛壬癸'; B='子丑寅卯辰巳午未申酉戌亥'
def gz60(i): return S[i%10]+B[i%12]
TZ830=[(dt.datetime(1908,4,1),dt.datetime(1912,1,1)),(dt.datetime(1954,3,21),dt.datetime(1961,8,10))]
DST=[((1948,6,1,0),(1948,9,13,0)),((1949,4,3,0),(1949,9,11,0)),((1950,4,1,0),(1950,9,10,0)),((1951,5,6,0),(1951,9,9,0)),
((1955,5,5,0),(1955,9,9,0)),((1956,5,20,0),(1956,9,30,0)),((1957,5,5,0),(1957,9,22,0)),((1958,5,4,0),(1958,9,21,0)),
((1959,5,3,0),(1959,9,20,0)),((1960,5,1,0),(1960,9,18,0)),((1987,5,10,2),(1987,10,11,3)),((1988,5,8,2),(1988,10,9,3))]
DSTR=[(dt.datetime(*a),dt.datetime(*b)) for a,b in DST]
def inr(t,l): return any(a<=t<b for a,b in l)
def corr(t):
    # (태양시 보정 분, 베이징(UTC+8)시계로 환산할 분)
    d=inr(t,DSTR)
    # 서머타임 시작 직후 1시간(없는 시각)은 표준시로 간주, 종료 직전 1시간(중복)은 서머타임 중으로 간주(chart 기본값 dst)
    for a,b in DSTR:
        if a<=t<a+dt.timedelta(hours=1): d=False
    lon = not inr(t,TZ830)
    return (60 if d else 0)+(30 if lon else 0), (60 if d else 0)+(60 if lon else 30)
def jdn_idx(date): return (date.toordinal()-730120+54)%60
def hour_gz(solar):
    # 23시부터 다음 날 일주
    day=solar.date()+(dt.timedelta(days=1) if solar.hour>=23 else dt.timedelta())
    di=jdn_idx(day); bi=((solar.hour*60+solar.minute+60)//120)%12
    return gz60(di), gz60((di%10)*0+0)[0:0] or S[((di%10)%5*2+bi)%10]+B[bi]
def yg_mg(bj):
    d=sxtwl.fromSolar(bj.year,bj.month,bj.day)
    prev=sxtwl.fromSolar(*(lambda x:(x.year,x.month,x.day))(bj-dt.timedelta(days=1)))
    day=d
    if d.hasJieQi():
        jd=d.getJieQiJD(); t=sxtwl.JD2DD(jd)
        tt=dt.datetime(bj.year,bj.month,bj.day,int(t.h),int(t.m),int(t.s))
        if bj<tt: day=prev
    # prev 도 같은 날 절기(연초 입춘 직전날)면 문제없음. 년주는 입춘(2/4경) 기준, 라이브러리 getYearGZ 기본이 입춘 기준인지 확인됨
    y=day.getYearGZ(); m=day.getMonthGZ()
    return S[y.tg]+B[y.dz], S[m.tg]+B[m.dz]
def ref(y,mo,d,h,mi):
    t=dt.datetime(y,mo,d,h,mi)
    c,toBj=corr(t)
    solar=t-dt.timedelta(minutes=c); bj=t-dt.timedelta(minutes=toBj)
    yg,mg=yg_mg(bj)
    dayidx=jdn_idx(solar.date()+(dt.timedelta(days=1) if solar.hour>=23 else dt.timedelta()))
    hz=hour_gz(solar)[1]
    return [yg,mg,gz60(dayidx),hz]
cases=[]
start=dt.date(1900,1,1)
n=0
day=start
while day<=dt.date(2027,12,31):
    for (h,mi) in ((0,10),(12,0),(23,40)):
        t=dt.datetime(day.year,day.month,day.day,h,mi)
        # 서머타임 경계 시각은 제외(사용자 선택이 필요한 구간)
        if any(a-dt.timedelta(minutes=1)<=t<a+dt.timedelta(hours=1) or b-dt.timedelta(hours=1)<=t<b for a,b in DSTR): continue
        cases.append([day.year,day.month,day.day,h,mi]+ref(day.year,day.month,day.day,h,mi))
    day+=dt.timedelta(days=1)
# 절입 경계 ±1분, ±10분 (모든 절: 소한·입춘·… 12개 × 128년)
bcount=0
for yr in range(1900,2028):
    for mo in range(1,13):
        for dd in range(1,32):
            try: d=sxtwl.fromSolar(yr,mo,dd)
            except: continue
            if not d.hasJieQi() or d.getJieQi()%2==0: continue
            t=sxtwl.JD2DD(d.getJieQiJD())
            bj=dt.datetime(yr,mo,dd,int(t.h),int(t.m),int(t.s))
            for delta in (-10,-1,1,10):
                b=bj+dt.timedelta(minutes=delta)
                k=b+dt.timedelta(minutes=90)
                for _ in range(3):
                    k=b+dt.timedelta(minutes=corr(k)[1])
                if k.year<1900 or k.year>2027: continue
                if any(a-dt.timedelta(minutes=1)<=k<a+dt.timedelta(hours=1) or bb-dt.timedelta(hours=1)<=k<bb for a,bb in DSTR): continue
                cases.append([k.year,k.month,k.day,k.hour,k.minute]+ref(k.year,k.month,k.day,k.hour,k.minute)); bcount+=1
print('days cases',len(cases),'boundary',bcount,file=sys.stderr)
json.dump(cases,open('cases.json','w'),ensure_ascii=False)
