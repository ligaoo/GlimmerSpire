# 立绘资源说明

把 PNG 图片按下列文件名放进对应目录即可自动生效（无需改代码）；
没有图片的会自动回退为 emoji 显示，所以放任何子集都可以。

## 尺寸建议

- 怪物:`assets/enemies/<id>.png` — 建议 512×512 透明底 PNG,主体居中占 ~80%
- 英雄:`assets/heroes/<职业id>.png` — 建议 512×512 透明底,半身立绘
- 伙伴:`assets/ally/<伙伴id>.png` — 建议 224×224 方形 PNG,人脸居中(头像按圆形裁剪显示)
- 主题封面:`assets/themes/<主题id>.png` — 建议 400×400 方形 PNG,主体居中(菜单主题卡显示)

## 英雄(3 张)

| 文件名 | 角色 |
|--------|------|
| heroes/warrior.png | 剑士 |
| heroes/ranger.png | 游侠 |
| heroes/warlock.png | 术士 |

## BOSS(3 张,优先级最高)

| 文件名 | 怪物 | 氛围参考 |
|--------|------|----------|
| enemies/stonegolem.png | 石魔像(第一幕BOSS) | 被古老符文点亮的巨型岩石魔像,蓝紫微光从裂缝中透出 |
| enemies/reaper.png | 收割者(第二幕BOSS) | 披着破碎黑袍的死神,手持巨大镰刀,镰刃泛幽绿 |
| enemies/devourer.png | 微光吞噬者(最终BOSS) | 由星光与虚空构成的巨大异界生物,身体像漩涡状星云,中心一只发光的核心之眼 |

## 精英(9 张)

| 文件名 | 怪物 |
|--------|------|
| enemies/lagavulin.png | 沉睡魔虫 |
| enemies/sentry.png | 石像守卫 |
| enemies/beastking.png | 血斧兽王 |
| enemies/stabbook.png | 刺客之书 |
| enemies/lizardking.png | 铜鳞蜥王 |
| enemies/soulcaller.png | 唤魂师 |
| enemies/gianthead.png | 巨型头颅 |
| enemies/twinguard.png | 双子守卫 |
| enemies/abyssshadow.png | 深渊之影 |

## 普通怪物(19 张)

jawworm 颚虫 / cultist 邪教徒 / acidslimeM 酸液史莱姆 / spikyslime 尖刺史莱姆 /
acidslimeS 小酸液史莱姆 / fungibeast 蘑菇兽 / louse 掠夺者 / bat 穴居蝠 /
snakevine 石化藤 / madman 狂徒 / puppeteer 傀儡师 / puppet 木偶 / shieldbearer 重盾兵 /
ghost 幽魂 / weaver 灵魂编织者 / gargoyle 石像鬼 / shade 暗影 / skullreaper 头骨收割者 /
eyetyrant 巨眼暴君

文件名 = 上方英文 id,如 `assets/enemies/jawworm.png`。

## 联动主题 BOSS(2 张)

| 文件名 | 怪物 |
|--------|------|
| enemies/jj_kingofcurses.png | 两面宿傩(咒术回战·最终BOSS) |
| enemies/ul_zetton.png | 宇宙恐龙杰顿(奥特曼·最终BOSS) |

## 伙伴头像(7 张,联动主题)

菜单选择器 / 战斗 HUD / 商店货架共用,文件名 = 伙伴 id:

| 文件名 | 角色 |
|--------|------|
| ally/jj_a_itadori.png | 虎杖悠仁(咒术回战) |
| ally/jj_a_megumi.png | 伏黑惠(咒术回战) |
| ally/jj_a_nobara.png | 钉崎野蔷薇(咒术回战) |
| ally/rz_a_emilia.png | 爱蜜莉雅(从零开始的异世界) |
| ally/rz_a_rem.png | 蕾姆(从零开始的异世界) |
| ally/rz_a_ram.png | 拉姆(从零开始的异世界) |
| ally/xy_a_sanzang.png | 唐僧(西游记) |

其余伙伴(神秘复苏 / 奥特曼 / 妖精的尾巴等)暂无合适图片,自动回退 emoji 显示;
补图时按 `assets/ally/<伙伴id>.png` 放入即可,无需改代码。

## 联动主题封面(6 张)

菜单「联动主题」页每张主题卡的封面图,文件名 = 主题 id:

| 文件名 | 主题 | 画面 |
|--------|------|------|
| themes/mystery.png | 神秘复苏 | 黑烛滴红蜡的哥特灵异氛围 |
| themes/jjk.png | 咒术回战 | 五条悟(白发黑眼罩·雨夜霓虹) |
| themes/rezero.png | 从零开始的异世界 | 昴 / 爱蜜莉雅 / 蕾姆群像 |
| themes/ultraman.png | 奥特曼 | 泰罗奥特曼战斗姿势 |
| themes/journey.png | 西游记 | 金甲孙悟空 |
| themes/fairytail.png | 妖精的尾巴 | 艾露莎双刀战斗姿态 |
