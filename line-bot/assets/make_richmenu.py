# สร้างรูป Rich Menu ของ Jack (2500x1686, 3x2 ปุ่ม) — ธีม Dark Emerald + Soft Gold เดียวกับแอป
from PIL import Image, ImageDraw, ImageFont
import sys
F = "/tmp/claude-0/fonts/"
W, H = 2500, 1686
BG = "#0c1613"; CARD = "#13211c"; LINE = "#24382f"; GOLD = "#d9b26a"; INK = "#f1ead9"; SUB = "#8fa89c"; DARK = "#0c1613"
def fnt(kind, w, size): return ImageFont.truetype(F + f"{kind}-{w}.ttf", size)
def is_thai(ch): return 0x0E00 <= ord(ch) <= 0x0E7F
def runs(text):
    out = []
    for ch in text:
        t = is_thai(ch) or (ch == " " and out and out[-1][0])
        if out and out[-1][0] == t: out[-1][1] += ch
        else: out.append([t, ch])
    return out
def text_w(text, w, size):
    return sum(fnt("thai" if t else "latin", w, size).getlength(s) for t, s in runs(text))
def draw_text(d, cx, y, text, w, size, fill):
    x = cx - text_w(text, w, size) / 2
    for t, s in runs(text):
        f = fnt("thai" if t else "latin", w, size)
        d.text((x, y), s, font=f, fill=fill, anchor="ls")
        x += f.getlength(s)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)
cw, ch = W / 3, H / 2
PAD = 22
items = [
    ("tasks", "งานวันนี้", "แตะดู · ติ๊กเสร็จได้"),
    ("month", "ยอดเดือนนี้", "รายจ่ายเทียบงบ"),
    ("baht", "จดรายจ่าย", "เช่น ข้าว 60"),
    ("plus", "เพิ่มงาน", "ชื่องาน + วันที่"),
    ("book", "เขียนบันทึก", "Journal วันนี้"),
    ("app", "เปิดแอป", "เลขา Ohm"),
]
for i, (icon, title, sub) in enumerate(items):
    c, r = i % 3, i // 3
    x0, y0 = c * cw + PAD, r * ch + PAD
    x1, y1 = (c + 1) * cw - PAD, (r + 1) * ch - PAD
    primary = icon == "baht"
    d.rounded_rectangle([x0, y0, x1, y1], radius=56, fill=GOLD if primary else CARD, outline=None if primary else LINE, width=4)
    cx = (x0 + x1) / 2
    icx, icy = cx, y0 + 285
    ink = DARK if primary else GOLD
    R = 128
    if not primary:
        d.ellipse([icx - R, icy - R, icx + R, icy + R], fill="#1a2c25")
    lw = 16
    if icon == "tasks":
        for k in range(3):
            yy = icy - 62 + k * 62
            d.rounded_rectangle([icx - 78, yy - 20, icx - 38, yy + 20], radius=8, outline=ink, width=10)
            d.line([icx - 12, yy, icx + 80, yy], fill=ink, width=lw)
        d.line([icx - 72, icy - 64, icx - 60, icy - 50, icx - 36, icy - 84], fill=ink, width=10, joint="curve")
    elif icon == "month":
        for k, hh in enumerate([60, 110, 80, 140]):
            bx = icx - 84 + k * 46
            d.rounded_rectangle([bx, icy + 70 - hh, bx + 30, icy + 70], radius=6, fill=ink)
        d.line([icx - 96, icy + 86, icx + 96, icy + 86], fill=ink, width=10)
    elif icon == "baht":
        d.ellipse([icx - R, icy - R, icx + R, icy + R], outline=DARK, width=14)
        f = fnt("thai", 600, 190)
        d.text((icx, icy + 8), "฿", font=f, fill=DARK, anchor="mm")
    elif icon == "plus":
        d.line([icx - 70, icy, icx + 70, icy], fill=ink, width=22)
        d.line([icx, icy - 70, icx, icy + 70], fill=ink, width=22)
    elif icon == "book":
        d.rounded_rectangle([icx - 72, icy - 88, icx + 72, icy + 88], radius=14, outline=ink, width=lw)
        d.line([icx - 40, icy - 88, icx - 40, icy + 88], fill=ink, width=10)
        for k in range(2): d.line([icx - 12, icy - 34 + k * 44, icx + 44, icy - 34 + k * 44], fill=ink, width=10)
    elif icon == "app":
        d.rounded_rectangle([icx - 58, icy - 96, icx + 58, icy + 96], radius=22, outline=ink, width=lw)
        d.line([icx - 18, icy + 66, icx + 18, icy + 66], fill=ink, width=10)
        d.line([icx + 20, icy - 22, icx + 96, icy - 98], fill=GOLD, width=12)
        d.line([icx + 50, icy - 100, icx + 98, icy - 100, icx + 98, icy - 52], fill=GOLD, width=12)
    draw_text(d, cx, y0 + 560, title, 600, 104, DARK if primary else INK)
    draw_text(d, cx, y0 + 660, sub, 400, 58, "#3b3220" if primary else SUB)
out = sys.argv[1] if len(sys.argv) > 1 else "richmenu.png"
img.save(out, optimize=True)
print(out)
