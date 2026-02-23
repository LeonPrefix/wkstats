// ==UserScript==
// @version     1.0.0
// @copyright   2018+, Robin Findley
// ==/UserScript==

// Console code to fetch details:
//var klist = '丙串乞但侯侶倣僅儒冥冶凄刹剥勃勅勾匂厘吏咽唾喉喩嗅嗣嘲嚇堆塑塞填墾壱妖妬嫉嫡宛宵弄弐彙怨恣惧愁慄慌憬戚抄拉拭拶挨挫捉捗捻摯斑斤斥旺昧曖曽朕柵柿桁梗棺楷楼毀氾汎沃淫溺潰濫煎爵玩璧璽瓦畏畝畿痕痘痩瘍眉硝稽窟窯箇箋籠綻緻繕繭罵羞羨翁耗肘股肢腎腫腺膝膳臆臼舷艶苛萎葛蓋蔽薪薫虞蚕衷袖裾褐訃詔詣詮諦諧謁謄貌貪賜賦踪蹴辣逐逓遡遵醒采釜錮附韻頒頓頬顎餅餌骸麓麺';
//function toarr(s) {return s.replace(/(^\s+|\s+$)/g,'').replace(/'/g,'\\\'').replace(/\s*[,、]\s*/g,',').split(',');}
//function clean_yomi(s) {return s.replace(/\..*/g,'');}
//Promise.all(klist.split('').map(kanji => {
//    return $.get('https://jisho.org/search/%23kanji%20'+kanji).then(content => {
//        let html = $(content);
//        let meanings = toarr(html.find('.kanji-details__main-meanings').text());
//        let onyomi = toarr(html.find('.on_yomi .kanji-details__main-readings-list').text()).map(clean_yomi);
//        let kunyomi = toarr(html.find('.kun_yomi .kanji-details__main-readings-list').text()).map(clean_yomi);
//        return '        \''+kanji+'\': {'+
//            'meanings:[\''+meanings.join('\',\'')+'\'], '+
//            'kunyomi:[\''+kunyomi.join('\',\'')+'\'], '+
//            'onyomi:[\''+onyomi.join('\',\'')+'\']},';
//    });
//})).then(results => {
//    results.sort((a,b) => a[9].localeCompare(b[9]));
//    console.log(results.join('\n'));
//});

(function (gobj) {
  if (!gobj.joyo) gobj.joyo = {};

  let joyo = gobj.joyo;

  joyo.kanji_by_level = [
    {
      name: "Grade 1",
      kanji:
        "一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六",
    },
    {
      name: "Grade 2",
      kanji:
        "引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話",
    },
    {
      name: "Grade 3",
      kanji:
        "悪安暗医委意育員院飲運泳駅央横屋温化荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和",
    },
    {
      name: "Grade 4",
      kanji:
        "愛案以衣位囲胃印英栄塩億加果貨課芽改械害街各覚完官管関観願希季紀喜旗器機議求泣救給挙漁共協鏡競極訓軍郡径型景芸欠結建健験固功好候航康告差菜最材昨札刷殺察参産散残士氏史司試児治辞失借種周祝順初松笑唱焼象照賞臣信成省清静席積折節説浅戦選然争倉巣束側続卒孫帯隊達単置仲貯兆腸低底停的典伝徒努灯堂働特得毒熱念敗梅博飯飛費必票標不夫付府副粉兵別辺変便包法望牧末満未脈民無約勇要養浴利陸良料量輪類令冷例歴連老労録",
    },
    {
      name: "Grade 5",
      kanji:
        "圧移因永営衛易益液演応往桜恩可仮価河過賀快解格確額刊幹慣眼基寄規技義逆久旧居許境均禁句群経潔件券険検限現減故個護効厚耕鉱構興講混査再災妻採際在財罪雑酸賛支志枝師資飼示似識質舎謝授修述術準序招承証条状常情織職制性政勢精製税責績接設舌絶銭祖素総造像増則測属率損退貸態団断築張提程適敵統銅導徳独任燃能破犯判版比肥非備俵評貧布婦富武復複仏編弁保墓報豊防貿暴務夢迷綿輸余預容略留領",
    },
    {
      name: "Grade 6",
      kanji:
        "異遺域宇映延沿我灰拡革閣割株干巻看簡危机揮貴疑吸供胸郷勤筋系敬警劇激穴絹権憲源厳己呼誤后孝皇紅降鋼刻穀骨困砂座済裁策冊蚕至私姿視詞誌磁射捨尺若樹収宗就衆従縦縮熟純処署諸除将傷障城蒸針仁垂推寸盛聖誠宣専泉洗染善奏窓創装層操蔵臓存尊宅担探誕段暖値宙忠著庁頂潮賃痛展討党糖届難乳認納脳派拝背肺俳班晩否批秘腹奮並陛閉片補暮宝訪亡忘棒枚幕密盟模訳郵優幼欲翌乱卵覧裏律臨朗論",
    },
    {
      name: "Grade 9",
      kanji:
        "亜哀挨曖握扱宛嵐依威為畏尉萎偉椅彙違維慰緯壱逸茨芋咽姻淫陰隠韻唄鬱畝浦詠影鋭疫悦越謁閲炎怨宴媛援煙猿鉛縁艶汚凹押旺欧殴翁奥岡憶臆虞乙俺卸穏佳苛架華菓渦嫁暇禍靴寡箇稼蚊牙瓦雅餓介戒怪拐悔皆塊楷潰壊懐諧劾崖涯慨蓋該概骸垣柿核殻郭較隔獲嚇穫岳顎掛潟括喝渇葛滑褐轄且釜鎌刈甘汗缶肝冠陥乾勘患貫喚堪換敢棺款閑勧寛歓監緩憾還環韓艦鑑含玩頑企伎岐忌奇祈軌既飢鬼亀幾棋棄毀畿輝騎宜偽欺儀戯擬犠菊吉喫詰却脚虐及丘朽臼糾嗅窮巨拒拠虚距御凶叫狂享況峡挟狭恐恭脅矯響驚仰暁凝巾斤菌琴僅緊錦謹襟吟駆惧愚偶遇隅串屈掘窟熊繰勲薫刑茎契恵啓掲渓蛍傾携継詣慶憬稽憩鶏迎鯨隙撃桁傑肩倹兼剣拳軒圏堅嫌献遣賢謙鍵繭顕懸幻玄弦舷股虎孤弧枯雇誇鼓錮顧互呉娯悟碁勾孔巧甲江坑抗攻更拘肯侯恒洪荒郊香貢控梗喉慌硬絞項溝綱酵稿衡購乞拷剛傲豪克酷獄駒込頃昆恨婚痕紺魂墾懇佐沙唆詐鎖挫采砕宰栽彩斎債催塞歳載埼剤崎削柵索酢搾錯咲刹拶撮擦桟惨傘斬暫旨伺刺祉肢施恣脂紫嗣雌摯賜諮侍滋慈餌璽鹿軸叱疾執湿嫉漆芝赦斜煮遮邪蛇酌釈爵寂朱狩殊珠腫趣寿呪需儒囚舟秀臭袖羞愁酬醜蹴襲汁充柔渋銃獣叔淑粛塾俊瞬旬巡盾准殉循潤遵庶緒如叙徐升召匠床抄肖尚昇沼宵症祥称渉紹訟掌晶焦硝粧詔奨詳彰憧衝償礁鐘丈冗浄剰畳縄壌嬢錠譲醸拭殖飾触嘱辱尻伸芯辛侵津唇娠振浸紳診寝慎審震薪刃尽迅甚陣尋腎須吹炊帥粋衰酔遂睡穂随髄枢崇据杉裾瀬是井姓征斉牲凄逝婿誓請醒斥析脊隻惜戚跡籍拙窃摂仙占扇栓旋煎羨腺詮践箋潜遷薦繊鮮禅漸膳繕狙阻租措粗疎訴塑遡礎双壮荘捜挿桑掃曹曽爽喪痩葬僧遭槽踪燥霜騒藻憎贈即促捉俗賊遜汰妥唾堕惰駄耐怠胎泰堆袋逮替滞戴滝択沢卓拓託濯諾濁但脱奪棚誰丹旦胆淡嘆端綻鍛弾壇恥致遅痴稚緻畜逐蓄秩窒嫡沖抽衷酎鋳駐弔挑彫眺釣貼超跳徴嘲澄聴懲勅捗沈珍朕陳鎮椎墜塚漬坪爪鶴呈廷抵邸亭貞帝訂逓偵堤艇締諦泥摘滴溺迭哲徹撤添填殿斗吐妬途渡塗賭奴怒到逃倒凍唐桃透悼盗陶塔搭棟痘筒稲踏謄藤闘騰洞胴瞳峠匿督篤栃凸突屯豚頓貪鈍曇丼那奈梨謎鍋軟尼弐匂虹尿妊忍寧捻粘悩濃把覇婆罵杯排廃輩培陪媒賠伯拍泊迫剥舶薄漠縛爆箸肌鉢髪伐抜罰閥氾帆汎伴阪畔般販斑搬煩頒範繁藩蛮盤妃彼披卑疲被扉碑罷避尾眉微膝肘匹泌姫漂苗描猫浜賓頻敏瓶扶怖阜附訃赴浮符普腐敷膚賦譜侮舞封伏幅覆払沸紛雰噴墳憤丙併柄塀幣弊蔽餅壁璧癖蔑偏遍哺捕舗募慕簿芳邦奉抱泡胞俸倣峰砲崩蜂飽褒縫乏忙坊妨房肪某冒剖紡傍帽貌膨謀頬朴睦僕墨撲没勃堀奔翻凡盆麻摩磨魔昧埋膜枕又抹慢漫魅岬蜜妙眠矛霧娘冥銘滅免麺茂妄盲耗猛網黙紋冶弥厄躍闇喩愉諭癒唯幽悠湧猶裕雄誘憂融与誉妖庸揚揺溶腰瘍踊窯擁謡抑沃翼拉裸羅雷頼絡酪辣濫藍欄吏痢履璃離慄柳竜粒隆硫侶虜慮了涼猟陵僚寮療瞭糧厘倫隣瑠涙累塁励戻鈴零霊隷齢麗暦劣烈裂恋廉錬呂炉賂露弄郎浪廊楼漏籠麓賄脇惑枠湾腕",
    },
  ];
  joyo.kanji_details = {
    丙: { meanings: ["third class", "3rd", "3rd calendar sign"], kunyomi: ["ひのえ"], onyomi: ["ヘイ"] },
    串: { meanings: ["spit", "skewer"], kunyomi: ["くし", "つらぬ"], onyomi: ["カン", "ケン", "セン"] },
    乞: { meanings: ["beg", "invite", "ask"], kunyomi: ["こ"], onyomi: ["コツ", "キツ", "キ", "キケ", "コチ"] },
    但: { meanings: ["however", "but"], kunyomi: ["ただ"], onyomi: ["タン"] },
    侯: { meanings: ["marquis", "lord", "daimyo"], kunyomi: [""], onyomi: ["コウ"] },
    侶: { meanings: ["companion", "follower"], kunyomi: ["とも"], onyomi: ["リョ", "ロ"] },
    倣: { meanings: ["emulate", "imitate"], kunyomi: ["なら"], onyomi: ["ホウ"] },
    僅: { meanings: ["a wee bit"], kunyomi: ["わず"], onyomi: ["キン", "ゴン"] },
    儒: { meanings: ["Confucian"], kunyomi: [""], onyomi: ["ジュ"] },
    冥: { meanings: ["dark"], kunyomi: ["くら"], onyomi: ["メイ", "ミョウ"] },
    冶: { meanings: ["melting", "smelting"], kunyomi: ["い"], onyomi: ["ヤ"] },
    凄: {
      meanings: ["uncanny", "weird", "threatening", "horrible"],
      kunyomi: ["さむ", "すご", "すさ"],
      onyomi: ["セイ", "サイ"],
    },
    刹: { meanings: ["temple"], kunyomi: [""], onyomi: ["セチ", "セツ", "サツ"] },
    剥: {
      meanings: ["come off", "peel", "fade", "discolor"],
      kunyomi: ["へ", "へず", "む", "む", "は", "は", "は", "は"],
      onyomi: ["ハク", "ホク"],
    },
    勃: { meanings: ["suddenness", "rise"], kunyomi: ["おこ", "にわかに"], onyomi: ["ボツ", "ホツ"] },
    勅: { meanings: ["imperial order"], kunyomi: ["いまし", "みことのり"], onyomi: ["チョク"] },
    勾: { meanings: ["be bent", "slope", "capture"], kunyomi: ["かぎ", "ま"], onyomi: ["コウ", "ク"] },
    匂: {
      meanings: ["fragrant", "stink", "glow", "insinuate", "(kokuji)"],
      kunyomi: ["にお", "にお", "にお"],
      onyomi: [""],
    },
    厘: { meanings: ["rin", "1/10 sen", "1/10 bu"], kunyomi: [""], onyomi: ["リン"] },
    吏: { meanings: ["officer", "an official"], kunyomi: [""], onyomi: ["リ"] },
    咽: {
      meanings: ["throat", "choked", "smothered", "stuffy"],
      kunyomi: ["むせ", "むせ", "のど", "の"],
      onyomi: ["イン", "エン", "エツ"],
    },
    唾: { meanings: ["saliva", "sputum"], kunyomi: ["つば", "つばき"], onyomi: ["ダ", "タ"] },
    喉: { meanings: ["throat", "voice"], kunyomi: ["のど"], onyomi: ["コウ"] },
    喩: { meanings: ["metaphor", "compare"], kunyomi: ["たと", "さと"], onyomi: ["ユ"] },
    嗅: { meanings: ["smell", "sniff", "scent"], kunyomi: ["か"], onyomi: ["キュウ"] },
    嗣: { meanings: ["heir", "succeed"], kunyomi: [""], onyomi: ["シ"] },
    嘲: { meanings: ["ridicule", "insult"], kunyomi: ["あざけ"], onyomi: ["チョウ", "トウ"] },
    嚇: { meanings: ["menacing", "dignity", "majesty", "threaten"], kunyomi: ["おど"], onyomi: ["カク"] },
    堆: { meanings: ["piled high"], kunyomi: ["うずたか"], onyomi: ["タイ", "ツイ"] },
    塑: { meanings: ["model", "molding"], kunyomi: ["でく"], onyomi: ["ソ"] },
    塞: {
      meanings: ["close", "shut", "cover", "block", "obstruct"],
      kunyomi: ["ふさ", "とりで", "み"],
      onyomi: ["ソク", "サイ"],
    },
    填: { meanings: ["fill in"], kunyomi: ["は", "は", "うず", "しず", "ふさ"], onyomi: ["テン", "チン"] },
    墾: { meanings: ["ground-breaking", "open up farmland"], kunyomi: ["は", "ひら"], onyomi: ["コン"] },
    壱: { meanings: ["one (in documents)"], kunyomi: ["ひとつ"], onyomi: ["イチ", "イツ"] },
    妖: { meanings: ["attractive", "bewitching", "calamity"], kunyomi: ["あや", "なま", "わざわ"], onyomi: ["ヨウ"] },
    妬: { meanings: ["jealous", "envy"], kunyomi: ["ねた", "そね", "つも", "ふさ"], onyomi: ["ト", "ツ"] },
    嫉: { meanings: ["jealous", "envy"], kunyomi: ["そね", "ねた", "にく"], onyomi: ["シツ"] },
    嫡: { meanings: ["legitimate wife", "direct descent (non-bastard)"], kunyomi: [""], onyomi: ["チャク", "テキ"] },
    宛: {
      meanings: ["address", "just like", "fortunately"],
      kunyomi: ["あ", "-あて", "-づつ", "あたか"],
      onyomi: ["エン"],
    },
    宵: { meanings: ["wee hours", "evening", "early night"], kunyomi: ["よい"], onyomi: ["ショウ"] },
    弄: {
      meanings: ["play with", "tamper", "trifle with"],
      kunyomi: ["いじく", "ろう", "いじ", "ひねく", "たわむ", "もてあそ"],
      onyomi: ["ロウ", "ル"],
    },
    弐: { meanings: ["II", "two", "second"], kunyomi: ["ふた", "そえ"], onyomi: ["ニ", "ジ"] },
    彙: {
      meanings: ["same kind", "collect", "classify", "category", "hedgehog"],
      kunyomi: ["はりねずみ"],
      onyomi: ["イ"],
    },
    怨: {
      meanings: ["grudge", "show resentment", "be jealous"],
      kunyomi: ["うら", "うらみ", "うら"],
      onyomi: ["エン", "オン", "ウン"],
    },
    恣: { meanings: ["selfish", "arbitrary"], kunyomi: ["ほしいまま"], onyomi: ["シ"] },
    惧: { meanings: ["fear", "be afraid of", "dread"], kunyomi: ["おそ"], onyomi: ["ク", "グ"] },
    愁: { meanings: ["distress", "grieve", "lament", "be anxious"], kunyomi: ["うれ", "うれ"], onyomi: ["シュウ"] },
    慄: { meanings: ["fear"], kunyomi: ["ふる", "おそ", "おのの"], onyomi: ["リツ"] },
    慌: { meanings: ["disconcerted", "be confused", "lose one's head"], kunyomi: ["あわ", "あわ"], onyomi: ["コウ"] },
    憬: { meanings: ["yearn for", "aspire to", "admire"], kunyomi: ["あこが"], onyomi: ["ケイ"] },
    戚: { meanings: ["grieve", "relatives"], kunyomi: ["いた", "うれ", "みうち"], onyomi: ["ソク", "セキ"] },
    抄: { meanings: ["extract", "selection", "summary", "copy", "spread thin"], kunyomi: [""], onyomi: ["ショウ"] },
    拉: { meanings: ["Latin", "kidnap", "crush"], kunyomi: ["らっ", "ひし", "くだ"], onyomi: ["ラツ", "ラ", "ロウ"] },
    拭: { meanings: ["wipe", "mop", "swab"], kunyomi: ["ぬぐ", "ふ"], onyomi: ["ショク", "シキ"] },
    拶: { meanings: ["be imminent", "draw close"], kunyomi: ["せま"], onyomi: ["サツ"] },
    挨: { meanings: ["approach", "draw near", "push open"], kunyomi: ["ひら"], onyomi: ["アイ"] },
    挫: { meanings: ["crush", "break", "sprain", "discourage"], kunyomi: ["くじ", "くじ"], onyomi: ["ザ", "サ"] },
    捉: { meanings: ["catch", "capture"], kunyomi: ["とら"], onyomi: ["ソク", "サク"] },
    捗: { meanings: ["make progress"], kunyomi: ["はかど"], onyomi: ["チョク", "ホ"] },
    捻: {
      meanings: ["twirl", "twist", "play with"],
      kunyomi: ["ね", "ねじ", "ひね", "ひね"],
      onyomi: ["ネン", "ジョウ"],
    },
    摯: { meanings: ["gift", "seriousness"], kunyomi: ["いた"], onyomi: ["シ"] },
    斑: { meanings: ["spot", "blemish", "speck", "patches"], kunyomi: ["ふ", "まだら"], onyomi: ["ハン"] },
    斤: {
      meanings: ["axe", "1.32 lb", "catty", "counter for loaves of bread", "axe radical (no. 69)"],
      kunyomi: [""],
      onyomi: ["キン"],
    },
    斥: {
      meanings: ["reject", "retreat", "recede", "withdraw", "repel", "repulse"],
      kunyomi: ["しりぞ"],
      onyomi: ["セキ"],
    },
    旺: {
      meanings: ["flourishing", "successful", "beautiful", "vigorous"],
      kunyomi: ["かがや", "うつくし", "さかん"],
      onyomi: ["オウ", "キョウ", "ゴウ"],
    },
    昧: { meanings: ["dark", "foolish"], kunyomi: ["くら", "むさぼ"], onyomi: ["マイ", "バイ"] },
    曖: { meanings: ["dark", "not clear"], kunyomi: ["くら"], onyomi: ["アイ"] },
    曽: {
      meanings: ["formerly", "once", "before", "ever", "never", "ex-"],
      kunyomi: ["かつ", "かつて", "すなわち"],
      onyomi: ["ソウ", "ソ", "ゾウ"],
    },
    朕: { meanings: ["majestic plural", "imperial we"], kunyomi: [""], onyomi: ["チン"] },
    柵: {
      meanings: ["stockade", "fence", "weir", "entwine around"],
      kunyomi: ["しがら", "しがらみ", "とりで", "やらい"],
      onyomi: ["サク", "サン"],
    },
    柿: { meanings: ["persimmon"], kunyomi: ["かき"], onyomi: ["シ"] },
    桁: { meanings: ["beam", "girder", "spar", "unit or column (accounting)"], kunyomi: ["けた"], onyomi: ["コウ"] },
    梗: {
      meanings: ["for the most part", "close up", "flower stem"],
      kunyomi: ["ふさぐ", "やまにれ", "おおむね"],
      onyomi: ["コウ", "キョウ"],
    },
    棺: { meanings: ["coffin", "casket"], kunyomi: [""], onyomi: ["カン"] },
    楷: { meanings: ["square character style", "correctness"], kunyomi: [""], onyomi: ["カイ"] },
    楼: { meanings: ["watchtower", "lookout", "high building"], kunyomi: ["たかどの"], onyomi: ["ロウ"] },
    毀: {
      meanings: ["break", "destroy", "censure", "be chipped", "be scratched", "be broken", "be ruined"],
      kunyomi: ["こぼ", "こわ", "こぼ", "こわ", "そし", "やぶ"],
      onyomi: ["キ"],
    },
    氾: { meanings: ["spread out", "wide"], kunyomi: ["ひろ"], onyomi: ["ハン"] },
    汎: { meanings: ["pan-"], kunyomi: ["ただよ", "ひろ"], onyomi: ["ハン", "ブ", "フウ", "ホウ", "ホン"] },
    沃: { meanings: ["fertility"], kunyomi: ["そそ"], onyomi: ["ヨウ", "ヨク", "オク"] },
    淫: {
      meanings: ["lewdness", "licentiousness"],
      kunyomi: ["ひた", "ほしいまま", "みだ", "みだ", "みだり"],
      onyomi: ["イン"],
    },
    溺: { meanings: ["drown", "indulge"], kunyomi: ["いばり", "おぼ"], onyomi: ["デキ", "ジョウ", "ニョウ"] },
    潰: {
      meanings: ["crush", "smash", "break", "dissipate"],
      kunyomi: ["つぶ", "つぶ", "つい"],
      onyomi: ["カイ", "エ"],
    },
    濫: { meanings: ["excessive", "overflow", "spread out"], kunyomi: ["みだ", "みだ"], onyomi: ["ラン"] },
    煎: { meanings: ["broil", "parch", "roast", "boil"], kunyomi: ["せん", "い", "に"], onyomi: ["セン"] },
    爵: { meanings: ["baron", "peerage", "court rank"], kunyomi: [""], onyomi: ["シャク"] },
    玩: {
      meanings: ["play", "take pleasure in", "trifle with", "make sport of"],
      kunyomi: ["もちあそ", "もてあそ"],
      onyomi: ["ガン"],
    },
    璧: { meanings: ["sphere", "ball"], kunyomi: ["たま"], onyomi: ["ヘキ"] },
    璽: { meanings: ["emperor's seal"], kunyomi: [""], onyomi: ["ジ"] },
    瓦: { meanings: ["tile", "gram"], kunyomi: ["かわら", "ぐらむ"], onyomi: ["ガ"] },
    畏: {
      meanings: ["fear", "majestic", "graciously", "be apprehensive"],
      kunyomi: ["おそ", "かしこま", "かしこ", "かしこ"],
      onyomi: ["イ"],
    },
    畝: {
      meanings: ["furrow", "thirty tsubo", "ridge", "rib"],
      kunyomi: ["せ", "うね"],
      onyomi: ["ボウ", "ホ", "モ", "ム"],
    },
    畿: { meanings: ["capital", "suburbs of capital"], kunyomi: ["みやこ"], onyomi: ["キ"] },
    痕: { meanings: ["mark", "foot print"], kunyomi: ["あと"], onyomi: ["コン"] },
    痘: { meanings: ["pox", "smallpox"], kunyomi: [""], onyomi: ["トウ"] },
    痩: { meanings: ["get thin"], kunyomi: ["や"], onyomi: ["ソウ", "チュウ", "シュウ", "シュ"] },
    瘍: { meanings: ["swelling", "boil", "tumor"], kunyomi: ["かさ"], onyomi: ["ヨウ"] },
    眉: { meanings: ["eyebrow"], kunyomi: ["まゆ"], onyomi: ["ビ", "ミ"] },
    硝: { meanings: ["nitrate", "saltpeter"], kunyomi: [""], onyomi: ["ショウ"] },
    稽: { meanings: ["think", "consider"], kunyomi: ["かんが", "とど"], onyomi: ["ケイ"] },
    窟: { meanings: ["cavern"], kunyomi: ["いわや", "いはや", "あな"], onyomi: ["クツ", "コツ"] },
    窯: { meanings: ["kiln", "oven", "furnace"], kunyomi: ["かま"], onyomi: ["ヨウ"] },
    箇: { meanings: ["counter for articles"], kunyomi: [""], onyomi: ["カ", "コ"] },
    箋: { meanings: ["paper", "label", "letter", "composition"], kunyomi: ["ふだ"], onyomi: ["セン"] },
    籠: {
      meanings: ["basket", "devote oneself", "seclude oneself", "cage", "coop", "implied"],
      kunyomi: ["かご", "こ", "こも", "こ"],
      onyomi: ["ロウ", "ル"],
    },
    綻: {
      meanings: ["be rent", "ripped", "unravel", "run", "begin to open", "smile"],
      kunyomi: ["ほころ"],
      onyomi: ["タン"],
    },
    緻: { meanings: ["fine (i.e. not coarse)"], kunyomi: ["こまか"], onyomi: ["チ"] },
    繕: { meanings: ["darning", "repair", "mend", "trim", "tidy up", "adjust"], kunyomi: ["つくろ"], onyomi: ["ゼン"] },
    繭: { meanings: ["cocoon"], kunyomi: ["まゆ", "きぬ"], onyomi: ["ケン"] },
    罵: { meanings: ["abuse", "insult"], kunyomi: ["ののし"], onyomi: ["バ"] },
    羞: { meanings: ["feel ashamed"], kunyomi: ["はじ", "すすめ", "は"], onyomi: ["シュウ"] },
    羨: { meanings: ["envious", "be jealous", "covet"], kunyomi: ["うらや", "あまり"], onyomi: ["セン", "エン"] },
    翁: { meanings: ["venerable old man"], kunyomi: ["おきな"], onyomi: ["オウ"] },
    耗: { meanings: ["decrease"], kunyomi: [""], onyomi: ["モウ", "コウ"] },
    肘: { meanings: ["elbow", "arm"], kunyomi: ["ひじ"], onyomi: ["チュウ"] },
    股: { meanings: ["thigh", "crotch"], kunyomi: ["また", "もも"], onyomi: ["コ"] },
    肢: { meanings: ["limb", "arms & legs"], kunyomi: [""], onyomi: ["シ"] },
    腎: { meanings: ["kidney"], kunyomi: [""], onyomi: ["ジン"] },
    腫: { meanings: ["tumor", "swelling"], kunyomi: ["は", "は", "は", "く", "はれもの"], onyomi: ["シュ", "ショウ"] },
    腺: { meanings: ["gland"], kunyomi: [""], onyomi: ["セン"] },
    膝: { meanings: ["knee", "lap"], kunyomi: ["ひざ"], onyomi: ["シツ"] },
    膳: { meanings: ["small low table", "tray"], kunyomi: ["かしわ", "すす", "そな"], onyomi: ["ゼン", "セン"] },
    臆: {
      meanings: ["timidity", "heart", "mind", "fear", "cowardly"],
      kunyomi: ["むね", "おくする"],
      onyomi: ["オク", "ヨク"],
    },
    臼: { meanings: ["mortar"], kunyomi: ["うす", "うすづ"], onyomi: ["キュウ", "グ"] },
    舷: { meanings: ["gunwale"], kunyomi: ["ふなばた", "ふなべり"], onyomi: ["ゲン"] },
    艶: {
      meanings: ["glossy", "luster", "glaze", "polish", "charm", "colorful", "captivating"],
      kunyomi: ["つや", "なま", "あで", "つや", "なま"],
      onyomi: ["エン"],
    },
    苛: {
      meanings: ["torment", "scold", "chastise"],
      kunyomi: ["いじ", "さいな", "いらだ", "からい", "こまかい"],
      onyomi: ["カ"],
    },
    萎: { meanings: ["wither", "droop", "lame"], kunyomi: ["な", "しお", "しな", "しぼ", "な"], onyomi: ["イ"] },
    葛: { meanings: ["arrowroot", "kudzu"], kunyomi: ["つづら", "くず"], onyomi: ["カツ", "カチ"] },
    蓋: {
      meanings: ["cover", "lid", "flap"],
      kunyomi: ["ふた", "けだ", "おお", "かさ", "かこう"],
      onyomi: ["ガイ", "カイ", "コウ"],
    },
    蔽: {
      meanings: ["cover", "shade", "mantle", "capsize", "be ruined"],
      kunyomi: ["おお", "おお"],
      onyomi: ["ヘイ", "ヘツ", "フツ"],
    },
    薪: { meanings: ["fuel", "firewood", "kindling"], kunyomi: ["たきぎ", "まき"], onyomi: ["シン"] },
    薫: {
      meanings: ["send forth fragrance", "fragrant", "be scented", "smoke (tobacco)"],
      kunyomi: ["かお"],
      onyomi: ["クン"],
    },
    虞: {
      meanings: ["fear", "uneasiness", "anxiety", "concern", "expectation", "consideration"],
      kunyomi: ["おそれ", "おもんぱか", "はか", "うれ", "あざむ", "あやま", "のぞ", "たの"],
      onyomi: ["グ"],
    },
    蚕: { meanings: ["silkworm"], kunyomi: ["かいこ", "こ"], onyomi: ["サン", "テン"] },
    衷: { meanings: ["inmost", "heart", "mind", "inside"], kunyomi: [""], onyomi: ["チュウ"] },
    袖: {
      meanings: ["sleeve", "wing (building)", "extension", "give cold shoulder"],
      kunyomi: ["そで"],
      onyomi: ["シュウ"],
    },
    裾: { meanings: ["cuff", "hem", "foot of mountain"], kunyomi: ["すそ"], onyomi: ["キョ", "コ"] },
    褐: { meanings: ["brown", "woollen kimono"], kunyomi: [""], onyomi: ["カツ"] },
    訃: { meanings: ["obituary"], kunyomi: ["しらせ"], onyomi: ["フ"] },
    詔: { meanings: ["imperial edict"], kunyomi: ["みことのり"], onyomi: ["ショウ"] },
    詣: {
      meanings: ["visit a temple", "arrive", "attain"],
      kunyomi: ["けい", "まい", "いた", "もう"],
      onyomi: ["ケイ", "ゲイ"],
    },
    詮: {
      meanings: ["discussion", "methods called for", "selection", "result"],
      kunyomi: ["せん", "かい", "あき"],
      onyomi: ["セン"],
    },
    諦: {
      meanings: ["truth", "clarity", "abandon", "give up"],
      kunyomi: ["あきら", "つまびらか", "まこと"],
      onyomi: ["テイ", "タイ"],
    },
    諧: { meanings: ["harmony"], kunyomi: ["かな", "やわ"], onyomi: ["カイ"] },
    謁: { meanings: ["audience", "audience (with king)"], kunyomi: [""], onyomi: ["エツ"] },
    謄: { meanings: ["mimeograph", "copy"], kunyomi: [""], onyomi: ["トウ"] },
    貌: { meanings: ["form", "appearance", "countenance"], kunyomi: ["かたち", "かたどる"], onyomi: ["ボウ", "バク"] },
    貪: { meanings: ["covet", "indulge in"], kunyomi: ["むさぼ"], onyomi: ["タン", "ドン", "トン"] },
    賜: { meanings: ["grant", "gift", "boon", "results"], kunyomi: ["たまわ", "たま", "たも"], onyomi: ["シ"] },
    賦: { meanings: ["levy", "ode", "prose", "poem", "tribute", "installment"], kunyomi: [""], onyomi: ["フ", "ブ"] },
    踪: { meanings: ["remains", "clue", "footprint"], kunyomi: ["あと"], onyomi: ["ソウ", "ショウ"] },
    蹴: { meanings: ["kick"], kunyomi: ["け"], onyomi: ["シュク", "シュウ"] },
    辣: { meanings: ["pungent", "spicy", "harsh", "cruel", "severe"], kunyomi: ["から"], onyomi: ["ラツ"] },
    逐: {
      meanings: ["pursue", "drive away", "chase", "accomplish", "attain", "commit"],
      kunyomi: [""],
      onyomi: ["チク"],
    },
    逓: { meanings: ["relay", "in turn", "sending"], kunyomi: ["かわ", "たがいに"], onyomi: ["テイ"] },
    遡: { meanings: ["go upstream", "retrace the past"], kunyomi: ["さかのぼ"], onyomi: ["ソ", "サク"] },
    遵: { meanings: ["abide by", "follow", "obey", "learn"], kunyomi: [""], onyomi: ["ジュン"] },
    醒: { meanings: ["awake", "be disillusioned", "sober up"], kunyomi: ["さ", "さ"], onyomi: ["セイ"] },
    采: {
      meanings: ["dice", "form", "appearance", "take", "gather", "coloring"],
      kunyomi: ["と", "いろどり"],
      onyomi: ["サイ"],
    },
    釜: { meanings: ["kettle", "cauldron", "iron pot"], kunyomi: ["かま"], onyomi: ["フ"] },
    錮: { meanings: ["confinement", "to tie"], kunyomi: ["ふさ"], onyomi: ["コ"] },
    附: { meanings: ["affixed", "attach", "refer to", "append"], kunyomi: ["つ", "つ"], onyomi: ["フ"] },
    韻: { meanings: ["rhyme", "elegance", "tone"], kunyomi: [""], onyomi: ["イン"] },
    頒: { meanings: ["distribute", "disseminate", "partition", "understand"], kunyomi: ["わか"], onyomi: ["ハン"] },
    頓: {
      meanings: ["suddenly", "immediately", "in a hurry", "arrange", "stay in place", "bow", "kowtow"],
      kunyomi: ["にわか", "とん", "つまず", "とみ", "ぬかずく"],
      onyomi: ["トン", "トツ"],
    },
    頬: { meanings: ["cheeks", "jaw"], kunyomi: ["ほお", "ほほ"], onyomi: ["キョウ"] },
    顎: { meanings: ["jaw", "chin", "gill"], kunyomi: ["あご", "あぎと"], onyomi: ["ガク"] },
    餅: { meanings: ["mochi rice cake"], kunyomi: ["もち", "もちい"], onyomi: ["ヘイ", "ヒョウ"] },
    餌: {
      meanings: ["food", "bait", "prey", "tempting profit"],
      kunyomi: ["え", "えば", "えさ", "もち"],
      onyomi: ["ジ", "ニ"],
    },
    骸: { meanings: ["bone", "body", "corpse"], kunyomi: ["むくろ"], onyomi: ["ガイ", "カイ"] },
    麓: { meanings: ["foot of a mountain"], kunyomi: ["ふもと"], onyomi: ["ロク"] },
    麺: { meanings: ["noodles", "wheat flour"], kunyomi: ["むぎこ"], onyomi: ["メン", "ベン"] },
  };

  wkof.set_state("wkof.joyo.kanji", "ready");
})(window);
