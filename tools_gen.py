import json,re
rs=json.load(open('recipes_all.json'))
T_TITLE={'PHILOCOFFEA(4:6 メソッド)':'PHILOCOFFEA (4:6 Method)','日向珈琲(HOT)':'Hyuga Coffee (HOT)','PHILOCOFFEA(粕谷 哲さんのハイブリッドメソッド)':"PHILOCOFFEA (Tetsu Kasuya's Hybrid Method)",'コマーシャルver.':'Commercial ver.','くーりのハンドドリップ':"Kuuri's Hand Drip",'スペシャルティver.':'Specialty ver.','飯高バリスタ 2024 WBrC | Finalsのレシピ':'Wataru Iidaka — 2024 WBrC Finals','Martin Wölflバリスタ2024 WBrC | Finalsのレシピ':'Martin Wölfl — 2024 WBrC Finals','PHILOCOFFEA(粕谷 哲さんのNEWハイブリッドメソッド)':"PHILOCOFFEA (Tetsu Kasuya's New Hybrid Method)",'PHILOCOFFEA(粕谷 哲さんのハイブリッドアイスコーヒー)':"PHILOCOFFEA (Tetsu Kasuya's Hybrid Iced Coffee)",'PHILOCOFFEA(4:6 メソッド ICED)':'PHILOCOFFEA (4:6 Method ICED)'}
SLUG={'PHILOCOFFEA(4:6 メソッド)':'philocoffea-46','日向珈琲(HOT)':'hyuga-hot','PHILOCOFFEA(粕谷 哲さんのハイブリッドメソッド)':'philocoffea-hybrid','コマーシャルver.':'koike-commercial','くーりのハンドドリップ':'kuuri-handdrip','スペシャルティver.':'koike-specialty','飯高バリスタ 2024 WBrC | Finalsのレシピ':'iidaka-wbrc-2024','Martin Wölflバリスタ2024 WBrC | Finalsのレシピ':'woelfl-wbrc-2024','PHILOCOFFEA(粕谷 哲さんのNEWハイブリッドメソッド)':'philocoffea-new-hybrid','PHILOCOFFEA(粕谷 哲さんのハイブリッドアイスコーヒー)':'philocoffea-hybrid-iced','PHILOCOFFEA(4:6 メソッド ICED)':'philocoffea-46-iced'}
T_AUTHOR={'粕谷 哲':'Tetsu Kasuya','飯高 亘':'Wataru Iidaka','日向珈琲':'Hyuga Coffee','カフェくーり':'Cafe Kuuri','小池美枝子':'Mieko Koike','小林美枝子':'Mieko Koike'}
T_DRIP={'フラワードリッパー':'Flower Dripper','UFOドリッパー':'UFO Dripper','Kalita wave':'Kalita Wave'}
T_GRIND={'中粗挽き～粗挽き':'Medium-coarse to coarse','普通(ザラメぐらい)':'Medium (like coarse sugar)','中粗挽き':'Medium-coarse','粗挽き':'Coarse','中細挽き':'Medium-fine','中挽き':'Medium','少し粗めの挽き目':'Slightly coarse','中細挽き。浅煎りの時は深煎りより少し細かくすると良い。':'Medium-fine. Go a little finer for light roasts than for dark.'}
T_GDESC={'EK13':'EK43 setting 13','EK11':'EK43 setting 11','コマンダンテC40 25~30クリック(600μm)':'Comandante C40, 25–30 clicks (600 µm)','コマンダンテC40 25~30クリック(630μm)':'Comandante C40, 25–30 clicks (630 µm)'}
T_TDESC={'浅煎り：93 ℃\n中煎り：88 ℃\n深煎り：83 ℃':'Light roast 93°C · Medium 88°C · Dark 83°C','90 ~ 95 ℃':'90–95°C','浅煎りで91℃':'91°C for light roasts','浅煎りで90 ~ 95℃':'90–95°C for light roasts','注ぐたびにケトルをバーナーに戻し、沸騰するぐらいの温度に保つこと':'Put the kettle back on the burner between pours; keep it near boiling.','温度85-86° コンタクト温度 83℃':'Kettle 85–86°C (contact temperature 83°C)','沸き立てのお湯をケトルに移したくらいの温度':'Freshly boiled water, just transferred to the pouring kettle','お湯は軟水を使うのがおすすめ':'Soft water recommended','浅煎り：93 ℃\n中煎り：88 ℃\n深煎り：83 ℃\n3投目で70℃に下げる':'Light 93°C · Medium 88°C · Dark 83°C. Drop to 70°C at pour 3.','沸かしたての湯を注ぎ用のケトルに注ぐと90℃くらいで抽出スタートできます':'Freshly boiled water poured into the kettle lands around 90°C to start','80℃への湯温変更あり':'Switches to 80°C water partway through','3投目から82℃で注ぐ':'From pour 3, use 82°C water','90℃前後でスタート、4投目前に70℃に下げる':'Start around 90°C; drop to 70°C before pour 4','温度は不明。ホットと同じ温度を記載している。':'Temperature not published; same as the hot recipe.','浅煎り〜深煎りで90℃を想定':'Assumes 90°C for light through dark roasts','レシピに記載がないため、よくある温度の設定を書いています。':'Not published; this is a common default.','浅煎りで93℃':'93°C for light roasts'}
T_INP={'味わいの調整':'Taste','普通':'Standard','濃度の調整':'Strength','ベーシック(濃いめ)':'Basic (stronger)','薄く':'Lighter','より甘く':'Sweeter','より明るく':'Brighter','焙煎度':'Roast','浅煎り':'Light roast','中煎り':'Medium roast','深煎り':'Dark roast'}
T_NOTE={'蒸らし。':'Bloom.','蒸らし':'Bloom.','落ちきり':'Let it drain through.','落としきり':'Let it drain through.','抽出完了':'Brew complete.','終了':'Done.','落ち切って完成。':'Drains through. Done.',
'タイマースタート前に注ぐ。蒸らすために、ゆっくり円を描くように注ぎ入れる。':'Pour before starting the timer. Pour slowly in circles to bloom the grounds.',
'ゆっくりと30秒かけながら「均一」に「湯を細く」注ぐ。':'Pour slowly over 30 seconds — evenly, with a thin stream.',
'ゆっくり30秒かけて注ぐ':'Pour slowly over 30 seconds.',
'丁寧に注ぐ。ドリッパーから落ちてくるコーヒーが点滴になったら完成。':'Pour carefully. Done when the flow from the dripper slows to drops.',
'円を描くように注いでいく':'Keep pouring in circles.',
'蒸らし。10秒かけてお湯を注ぐ。お湯を注いだらスプーンで2、３回かき混ぜる':'Bloom. Pour over 10 seconds, then stir 2–3 times with a spoon.',
'10秒かけてお湯を注ぐ。コーヒー全体にお湯が行き渡るように注ぐ。':'Pour over 10 seconds, wetting all of the coffee evenly.',
'10秒かけてお湯を注ぐ。ゆっくり優しく注ぐ。':'Pour over 10 seconds, slowly and gently.',
'10秒かけてお湯を注ぐ。注ぎ終わったら、スプーンで一周かき混ぜる':'Pour over 10 seconds. When done, stir once around with a spoon.',
'蒸らし。全てのコーヒー粉にまんべんなくお湯がいきわたるように丁寧に注ぐ。':'Bloom. Pour carefully so every bit of coffee gets wet.',
'お湯を中心から外側に、外側から中心にぐるぐる注ぐ。':'Pour in spirals from the center outward, then back in to the center.',
'お湯を中心から外側に、コーヒ豆の土手を崩していくように注ぐ。':'Pour from the center outward, breaking down the wall of grounds.',
'円を描くように勢いよく注ぐ':'Pour vigorously in circles.','円を書くように勢いよく注ぐ':'Pour vigorously in circles.',
'蒸らし。コーヒー粉をまんべんなく湿らせるようにお湯をゆっくり注ぎ入れる。':'Bloom. Pour slowly to wet the grounds evenly.',
'お湯を粉全体にアグレッシブに注ぐ':'Pour aggressively over all the grounds.',
'お湯を注ぐ量と出ていく量が一定になるように細く注ぐ':'Pour a thin stream so water going in matches water draining out.',
'蒸らし。全体にお湯を行き渡らせる。':'Bloom. Wet all the grounds.',
'膨らんだ粉を中心から崩すようにお湯を細く注ぎます。その時ガスが出る。そのガスが収まり始めたら、お湯の量を増やし螺旋を描くように満遍なくドリップする。全て落ち切る前にドリッパーを外すとエグ味が少ない。':'Pour a thin stream from the center to break down the risen bed; gas will release. Once it settles, increase the flow and drip evenly in a spiral. Removing the dripper before it fully drains keeps harshness low.',
'蒸らし。円を書くように注ぐ。':'Bloom. Pour in circles.','円を描くように注ぐ。':'Pour in circles.','ゆっくり円を描くように注ぐ':'Pour slowly in circles.',
'500円玉サイズの小さな円を中心に向かって、ゆっくりとグルグルと描きながらお湯を注ぐ。':'Pour slowly in small coin-sized circles, working toward the center.',
'2投目のお湯を注ぐのを一旦止め、間髪なく3投目をすぐに「円を書くようにゆっくり」注ぐ。':'Pause after pour 2, then immediately start pour 3 — slowly, in circles.',
'3投目のお湯を注ぐのを一旦止め、間髪なく4投目をすぐに「円を書くようにゆっくり」注ぐ。':'Pause after pour 3, then immediately start pour 4 — slowly, in circles.',
'4投目のお湯を注ぐのを一旦止め、間髪なく5投目をすぐに「円を書くようにゆっくり」注ぐ。':'Pause after pour 4, then immediately start pour 5 — slowly, in circles.',
'円を描くように勢いよく注ぎ、ドリッパーを軽く揺すり、粉を平らにして待つ':'Pour vigorously in circles, give the dripper a gentle swirl to flatten the bed, and wait.',
'ケトルの注ぎ口を一定に優しく注ぐ':'Pour gently with a steady stream from the kettle.',
'蒸らし。素早くコーヒーの粉全体が濡れるように注ぐ。すべてのコーヒがしっかりお湯に触れるように撹拌するといい。':'Bloom. Pour quickly so all the grounds get wet; a stir helps every particle meet water.',
'80gまで円を描く様に素早く注ぐ。その後250gまでは、ドリッパーの真ん中にゆっくりとお湯を注ぎ続ける。この時できるだけ細く低く注ぐと良い':'Pour quickly in circles up to 80 g. Then pour slowly into the center up to 250 g, keeping the stream as thin and low as you can.',
'お湯を250g落とし切っても良いが210gで取り出す。':'You can let all 250 g drain, but remove the dripper at 210 g.',
'2:30頃まで落としきる。味を見て濃かったら、少量のお湯で薄めて終了。':'Let it drain until about 2:30. Taste — if strong, dilute with a little hot water.',
'蒸らし。この時ゆっくり注ぐ':'Bloom. Pour slowly here.',
'2投目で多くの湯量でしっかりと撹拌する。':'Pour 2 uses plenty of water to agitate the bed well.',
'気持ち優しく注ぐ、注ぎのお湯は細い線をイメージする。':'Pour a touch gently; picture a thin line of water.',
'スイッチドリッパーは開いた状態で注ぎ始める。':'Start pouring with the Switch open.',
'注ぎ終わったら、お湯に水を入れ70℃まで下げる。':'After pouring, add cold water to the kettle to bring it down to 70°C.',
'スイッチドリッパーを閉じてから注ぎ始める。':'Close the Switch, then start pouring.',
'スイッチドリッパーを開ける':'Open the Switch.','スイッチドリッパーを開ける。':'Open the Switch.',
'0:50-1:00くらいまでに注ぐ':'Finish pouring by about 0:50–1:00.','1:20-1:30くらいまでに注ぐ':'Finish pouring by about 1:20–1:30.','1:50-2:00くらいまでに注ぐ':'Finish pouring by about 1:50–2:00.','50-60秒くらいまでに注ぐ':'Finish pouring by about 0:50–1:00.',
'ドリッパーを外す':'Remove the dripper.',
'粉全体に染み渡らせるようにゆっくりかける(深煎りやガスが多いものは40gまで)':'Pour slowly to soak all the grounds (up to 40 g for dark roasts or gassy beans).',
'お湯が膨らみ切ったら、沈み始めるタイミングで注ぎ始め。真ん中にのの字でくるくる回すように少しずつ湯を注ぐ':'When the bloom peaks and starts to sink, begin pouring: small spirals in the center, a little at a time.',
'粉の表面が乾かない程度に、真ん中にのの字ででくるくる回すように少しずつ湯を注ぐ':'Keep the surface from drying out: small spirals in the center, a little at a time.',
'お湯を注ぐペースを少しずつ上げていく。のの字でくるくる回すように注ぐ':'Gradually speed up the pour, still in spirals.',
'粉の土手を崩してかき回しながら勢いよく湯を注ぐ':'Pour vigorously, breaking the wall of grounds and stirring the bed.',
'抽出量になったらドリッパーを避ける':'Once you reach the target yield, remove the dripper.',
'1:20-1:30くらいまでに注ぐ。この次の注ぎは80℃':'Finish pouring by about 1:20–1:30. The next pour uses 80°C water.',
'80℃のお湯。1:50-2:00くらいまでに注ぐ':'80°C water. Finish pouring by about 1:50–2:00.',
'80℃のお湯。コーヒー豆とペーパーの境目を狙ってぐるぐるまわしかける。':'80°C water. Pour in circles aiming at the edge where coffee meets paper.',
'注ぎ終わったら、お湯を82℃に下げる。':'After pouring, bring the water down to 82°C.',
'メロドリップを被せて、お湯を注ぐ。':'Place the Melodrip on top and pour through it.',
'メロドリップをつける。蒸らし':'Attach the Melodrip. Bloom.',
'スイッチドリッパーは閉じた状態で90℃前後のお湯を注ぎはじめる。':'With the Switch closed, start pouring water at around 90°C.',
'スイッチを開け、お湯を注ぎはじめる。':'Open the Switch and start pouring.',
'タイマースタート前に注ぐ。蒸らしのため、粉全体にお湯がかかるように注ぐ。':'Pour before starting the timer. Bloom by wetting all the grounds.',
'のの字を描くように注ぐ。大きい円、小さい円と交互に注ぐのがポイント':'Pour in spirals, alternating big circles and small circles.',
'蒸らし。10秒かけてお湯を注ぐ。お湯が注ぎ終わったらスプーンで3往復攪拌する。':'Bloom. Pour over 10 seconds, then stir back and forth 3 times with a spoon.',
'10秒かけてお湯を注ぐ。ゆっくり優しく注ぐ。注ぎ終わったら、スプーンで一周かき混ぜる':'Pour over 10 seconds, slowly and gently. When done, stir once around with a spoon.',
'蒸らし。お湯を粉全体に触れるように注ぐ。蒸らしは長め。':'Bloom. Wet all the grounds. This bloom is on the long side.',
'サーバーに氷を入れる':'Put ice in the server.',
'蒸らし。しっかりとお湯を全体に行き渡るようにする。スプーンでかき混ぜたりしても良い。':'Bloom. Make sure water reaches all the grounds; a stir with a spoon is fine.',
'お湯を注いだ後、ドリッパーを振っても良い。':'After pouring, you can give the dripper a swirl.',
'蒸らし。この時スプーンで5回ほど混ぜるとより甘味が感じやすい':'Bloom. Stirring about 5 times with a spoon here brings out more sweetness.',
}
def note_en(s):
    s=s.strip()
    if not s: return ''
    if re.match(r'サーバーに氷を(\d+)g入れる',s): return 'Put {ice} g of ice in the server.'
    if re.match(r'落ち切ったら、サーバーに(\d+)gの氷を加えて混ぜる。',s): return 'Once drained, add {ice} g of ice to the server and stir.'
    if s in T_NOTE: return T_NOTE[s]
    raise SystemExit('MISSING NOTE: '+s)
def note_ja(s):
    s=s.strip()
    return re.sub(r'(\d+)\s*g',r'{ice}g',s) if '氷' in s and re.search(r'\d+\s*g',s) else s
SPECIAL={'World Brewers Cup 2016 優勝レシピです。4：6メソッドでのホットコーヒーのレシピが簡単に計算ができます。':'The 2016 World Brewers Cup winning recipe. The 4:6 Method for hot coffee, scaled to your beans.',
'BARISTAIのオリジナルレシピです。焙煎度に関わらずバランス良く抽出します。':"BARISTAI's original recipe. A balanced cup regardless of roast level.",
'円錐フィルターを使用します。\n中深煎り~深煎りのコーヒーに向いています。':'Uses a cone filter. Suited to medium-dark and dark roasts.',
'中煎り~深煎りにオススメのレシピです。':'Recommended for medium to dark roasts.',
'円錐フィルターを利用します。\nスペシャルティコーヒーを淹れるときのレシピです。':'Uses a cone filter. A recipe for specialty coffee.',
'Wataru Iidaka, Japan | 2024 World Brewers Cup Championship | Finalsのレシピ':'Wataru Iidaka, Japan — 2024 World Brewers Cup Championship Finals recipe.',
'Martin Wölfl, Austria | 2024 World Brewers Cup | Finalsのレシピ':'Martin Wölfl, Austria — 2024 World Brewers Cup Finals recipe.',
'スイッチドリッパーを使用したホットコーヒーの抽出レシピが簡単に計算できます。':'A hot coffee recipe on the Hario Switch, scaled to your beans.',
'スイッチドリッパーを使用したアイスコーヒーの抽出レシピが簡単に計算できます。':'An iced coffee recipe on the Hario Switch, scaled to your beans.',
'4：6メソッドでのアイスコーヒーのレシピが簡単に計算ができます。':'The 4:6 Method for iced coffee, scaled to your beans.'}
def desc_en(r):
    sm=r['summary']; d=sm['description']; shop=T_AUTHOR.get(sm['shopName'],sm['shopName']); tags=[t['name'] for t in sm['tags']]
    drip=next((T_DRIP.get(t,t) for t in tags if t not in('hot','ice')),None)
    hot='iced' if 'ice' in tags else 'hot'
    if d in SPECIAL: return SPECIAL[d]
    return f"{shop}'s {hot} coffee recipe" + (f" on the {drip}" if drip else '') + ', scaled to your beans.'
TECH={1:('Center pour','真ん中に注ぐ','mannaka ni sosogu'),2:('Circle pour','円を描くように注ぐ','en o egaku yō ni sosogu'),3:('Slow circles','ゆっくり円を描く','yukkuri en o egaku'),4:('Fast circles','勢いよく円を描く','ikioi yoku en o egaku'),5:('Bloom','蒸らし','murashi'),6:('Outside → in','外から内へ','soto kara uchi e'),7:('Inside → out','内から外へ','uchi kara soto e'),8:('Stir','かき混ぜる','kakimazeru'),9:('Swirl the dripper','ドリッパーを揺する','yusuru'),10:('Pour before timer','タイマー前に注ぐ','taimā mae ni sosogu'),11:('Cool water to {v}°C','{v}℃まで下げる','sageru'),12:('Even pour','まんべんなく注ぐ','manbennaku sosogu'),13:('Open the Switch','スイッチを開ける','suitchi o akeru'),14:('Close the Switch','スイッチを閉じる','suitchi o shimeru'),15:('Remove dripper early','落ち切る前に外す','ochikiru mae ni hazusu'),16:('Ice after brewing','ドリップ後に氷','dorippu-go ni kōri'),17:('End of brew','抽出終了','chūshutsu shūryō'),18:('Add ice','氷を入れる','kōri o ireru')}
def slugify(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def conv_pours(pours):
    out=[]
    for p in pours:
        n=p['note'] or ''
        m=re.search(r'(\d+)\s*g',n) if '氷' in n else None
        tv={x['techniqueId']:x['value'] for x in p['techniqueValues']}
        d={'t':p['time'],'w':p['waterAmount'],'note':{'en':note_en(n),'ja':note_ja(n)},'tech':[{'id':t['id'],**({'v':tv[t['id']]} if t['id'] in tv else {})} for t in p['techniques']]}
        if m: d['ice']=int(m.group(1))
        if p.get('movie'): d['video']=p['movie']
        out.append(d)
    return out
recipes=[];seen=set()
for r in rs:
    sm=r['summary']; tags=[t['name'] for t in sm['tags']]
    dripJa=next((t for t in tags if t not in('hot','ice')),None)
    title=sm['title']; slug=SLUG.get(title) or slugify(title)
    assert slug not in seen,slug; seen.add(slug)
    rec={'slug':slug,'title':{'en':T_TITLE.get(title,title),'ja':title},'author':{'en':T_AUTHOR.get(sm['author'],sm['author']),'ja':sm['author']},'shop':{'en':T_AUTHOR.get(sm['shopName'],sm['shopName']),'ja':sm['shopName']},
    'desc':{'en':desc_en(r),'ja':sm['description']},'temp':'ice' if 'ice' in tags else 'hot','dripper':(T_DRIP.get(dripJa,dripJa) if dripJa else None),'recommended':sm['isRecommended'],'published':sm['firstPublishedAt'],
    'coffee':r['coffeeAmount'],'water':r['waterAmount'],'celsius':r['temperature'],'tempNote':{'en':T_TDESC.get(r['temperatureDescription'].strip(),''),'ja':r['temperatureDescription'].strip()},
    'grind':{'en':T_GRIND.get(r['grind'],r['grind']),'ja':r['grind']},'grindNote':{'en':T_GDESC.get(r['grindDescription'],r['grindDescription']),'ja':r['grindDescription']},'timed':r['isTimer'],
    'links':{'shop':sm['explanationLink'] or '','video':sm['videoEmbedUrl'] or '','beans':sm['beansUrl'] or ''},
    'pours':conv_pours(r['pours'])}
    if r['inputs']:
        rec['inputs']=[{'id':i['inputTypeId'],'name':{'en':T_INP[i['inputType']['name']],'ja':i['inputType']['name']},'default':i['value']} for i in r['inputs']]
        opts={}
        for i in r['inputs']: opts.setdefault(i['inputTypeId'],{})[i['value']]={'en':T_INP[i['label']],'ja':i['label']}
        for v in r['variants']:
            for i in v['inputs']: opts.setdefault(i['inputTypeId'],{})[i['value']]={'en':T_INP[i['label']],'ja':i['label']}
        for inp in rec['inputs']: inp['options']=[{'v':k,**opts[inp['id']][k]} for k in sorted(opts[inp['id']])]
        rec['variants']=[{'sel':{str(i['inputTypeId']):i['value'] for i in v['inputs']},'pours':conv_pours(v['pours'])} for v in r['variants']]
    recipes.append(rec)
tech={str(k):{'en':v[0],'ja':v[1],'romaji':v[2]} for k,v in TECH.items()}
js='// Generated from the baristai.net catalog (2026-09-06). Recipe credit belongs to each shop/barista.\nexport const RECIPES='+json.dumps(recipes,ensure_ascii=False,separators=(',',':'))+';\nexport const TECH='+json.dumps(tech,ensure_ascii=False,separators=(',',':'))+';\n'
open('/Users/yuki/drip-zine/data.js','w').write(js)
print(len(recipes),'recipes',len(js)//1024,'KB'); print([r['slug'] for r in recipes])
print('drippers',sorted(set(r['dripper'] for r in recipes if r['dripper'])))
