#!/usr/bin/env python3

# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""
Render the homepage Open Graph images with Playwright and write them to:
public/images/og-home.png and public/images/og-home.jpg
"""

import subprocess
import tempfile
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_IMAGES_DIR = ROOT_DIR / 'public' / 'images'

WIDTH = 1200
HEIGHT = 630

OUTPUT_PNG_NAME = 'og-home.png'
OUTPUT_JPG_NAME = 'og-home.jpg'
OUTPUT_PNG = PUBLIC_IMAGES_DIR / OUTPUT_PNG_NAME
OUTPUT_JPG = PUBLIC_IMAGES_DIR / OUTPUT_JPG_NAME

BG_PATH = PUBLIC_IMAGES_DIR / 'bg.png'
SWIRLS_PATH = PUBLIC_IMAGES_DIR / 'swirls.png'
CHAR_PATH = PUBLIC_IMAGES_DIR / 'charf.png'
LOGO_PATH = PUBLIC_IMAGES_DIR / 'logo.png'


FINAL_HTML = '''
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width={width}, initial-scale=1" />
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #07050d;
      font-family: Inter, Arial, sans-serif;
    }

    .scene {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background:
        radial-gradient(circle at 68% 30%, rgba(255, 181, 65, 0.18), transparent 24%),
        radial-gradient(circle at 35% 62%, rgba(80, 130, 255, 0.12), transparent 22%),
        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03), transparent 45%),
        #090610;
      isolation: isolate;
    }

    .bg,
    .swirls,
    .char,
    .noise,
    .vignette,
    .left-fade,
    .bottom-fade {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .bg img,
    .swirls img,
    .char img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bg { z-index: -5; }

    .bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(5, 4, 10, 0.85) 0%, rgba(5, 4, 10, 0.60) 30%, rgba(5, 4, 10, 0.16) 56%, rgba(5, 4, 10, 0.18) 100%),
        linear-gradient(180deg, rgba(6, 5, 11, 0.28) 0%, rgba(6, 5, 11, 0.06) 20%, rgba(6, 5, 11, 0.18) 100%);
    }

    .swirls {
      z-index: -3;
      opacity: 0.96;
      filter: drop-shadow(0 0 26px rgba(253, 227, 48, 0.18)) drop-shadow(0 0 50px rgba(98, 212, 255, 0.10));
    }

    .swirls::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 68% 47%, rgba(253, 227, 48, 0.18), transparent 24%),
        radial-gradient(circle at 63% 58%, rgba(95, 224, 255, 0.08), transparent 18%);
    }

    .char {
      z-index: -2;
      opacity: 0.65;
      filter:
        drop-shadow(0 30px 60px rgba(0,0,0,0.55))
        drop-shadow(0 0 30px rgba(253, 227, 48, 0.08))
        drop-shadow(0 0 18px rgba(95, 220, 255, 0.06));
    }

    .char::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 67% 38%, rgba(253, 227, 48, 0.12), transparent 14%),
        radial-gradient(circle at 69% 46%, rgba(91, 215, 255, 0.06), transparent 12%);
      mix-blend-mode: screen;
    }

    .left-fade {
      z-index: 0;
      background: linear-gradient(90deg, rgba(6, 5, 11, 0.72) 0%, rgba(6, 5, 11, 0.42) 24%, rgba(6, 5, 11, 0) 54%);
    }

    .bottom-fade {
      z-index: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0) 72%, rgba(5, 4, 10, 0.48) 100%);
    }

    .noise {
      z-index: 2;
      opacity: 0.08;
      background-image: radial-gradient(rgba(255,255,255,0.9) 0.6px, transparent 0.6px);
      background-size: 6px 6px;
      mix-blend-mode: soft-light;
    }

    .vignette {
      z-index: 1;
      background: radial-gradient(circle at center, transparent 45%, rgba(5, 5, 10, 0.18) 74%, rgba(5, 5, 10, 0.42) 100%);
    }

    .left-stripe {
      position: absolute;
      z-index: 2;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3em;
      background: linear-gradient(to right, #90fefe 0, #90fefe 33.333%, #2cfeff 33.333%, #2cfeff 66.666%, #fde330 66.666%, #fde330 100%);
    }

    .logo {
      position: absolute;
      z-index: 3;
      top: 34px;
      right: 26px;
      width: 300px;
      height: auto;
      filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35));
    }

    .terminal-wrap {
      position: absolute;
      inset: 0;
      z-index: 4;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .terminal {
      display: inline-block;
      width: auto;
      padding: 20px 22px 20px;
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.10);
      background: linear-gradient(180deg, rgba(17, 18, 30, 0.56) 0%, rgba(12, 13, 22, 0.74) 100%);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.06),
        0 25px 60px rgba(0,0,0,0.30),
        0 0 0 1px rgba(255,255,255,0.02);
      overflow: hidden;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      position: relative;
      transform: scale(1.25);
      transform-origin: center;
    }

    .terminal::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(99, 216, 255, 0.10), transparent 24%),
        linear-gradient(225deg, rgba(253, 227, 48, 0.09), transparent 30%);
      pointer-events: none;
    }

    .terminal::after {
      content: '';
      position: absolute;
      inset: auto -10% -40% -10%;
      height: 70%;
      background: radial-gradient(circle at center, rgba(99, 216, 255, 0.09), transparent 60%);
      filter: blur(40px);
      pointer-events: none;
    }

    .terminal-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
      position: relative;
      z-index: 1;
    }

    .dots {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .dots span {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255,255,255,0.22);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
    }

    .dots span:nth-child(1) { background: rgba(255, 110, 110, 0.9); }
    .dots span:nth-child(2) { background: rgba(255, 210, 94, 0.9); }
    .dots span:nth-child(3) { background: rgba(111, 230, 131, 0.9); }

    .code {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 10px;
      font-size: 18px;
      line-height: 1.45;
      letter-spacing: -0.02em;
    }

    .line {
      display: flex;
      align-items: baseline;
      gap: 14px;
      min-height: 1.4em;
      color: rgba(255,255,255,0.92);
      text-shadow: 0 2px 18px rgba(0,0,0,0.24);
      white-space: nowrap;
    }

    .prompt {
      flex: 0 0 auto;
      color: rgba(255,255,255,0.28);
      user-select: none;
    }

    .cmd {
      color: #63d8ff;
      text-shadow: 0 0 14px rgba(99, 216, 255, 0.15);
    }

    .arg {
      color: rgba(255,255,255,0.95);
    }

    .str {
      color: #ffe56a;
      text-shadow: 0 0 14px rgba(253, 227, 48, 0.12);
    }

    .path {
      color: rgba(255,255,255,0.88);
    }

    .cursor {
      display: inline-block;
      width: 0.58em;
      height: 1.1em;
      margin-left: 2px;
      transform: translateY(0.16em);
      border-radius: 2px;
      background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.55));
      box-shadow: 0 0 12px rgba(255,255,255,0.22);
    }
  </style>
</head>
<body>
  <div class="scene">
    <div class="bg"><img src="__BG__" alt="" /></div>
    <div class="swirls"><img src="__SWIRLS__" alt="" /></div>
    <div class="char"><img src="__CHAR__" alt="" /></div>
    <div class="left-fade"></div>
    <div class="bottom-fade"></div>
    <div class="left-stripe"></div>
    <div class="vignette"></div>
    <div class="noise"></div>
    <img class="logo" src="__LOGO__" alt="Skillcraft" />

    <div class="terminal-wrap">
      <section class="terminal" role="img" aria-label="terminal preview">
        <div class="terminal-top">
          <div class="dots">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="code" role="text" aria-label="terminal example output">
          <div class="line">
            <span class="prompt">$</span>
            <span>
              <span class="cmd">skillcraft</span> <span class="arg">enable</span>
            </span>
          </div>
          <div class="line">
            <span class="prompt">$</span>
            <span>
              <span class="arg">git commit -m</span> <span class="str">\"implement auth\"</span>
            </span>
          </div>
          <div class="line">
            <span class="prompt">$</span>
            <span>
              <span class="cmd">skillcraft</span> <span class="arg">progress</span>
            </span>
          </div>
          <div class="line">
            <span class="prompt">$</span>
            <span>
              <span class="cmd">skillcraft</span> <span class="arg">claim</span> <span class="path">skillcraft-gg/practitioner-threat-model-l1</span>
              <span class="cursor" aria-hidden="true"></span>
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</body>
</html>
'''


def _fill_template(template: str, bg_url: str, swirls_url: str, char_url: str, logo_url: str) -> str:
    replacements = {
        '__BG__': bg_url,
        '__SWIRLS__': swirls_url,
        '__CHAR__': char_url,
        '__LOGO__': logo_url,
        '{width}': str(WIDTH),
    }

    html = template
    for key, value in replacements.items():
        html = html.replace(key, value)
    return html


def _run_screenshot(input_html: Path, output_path: Path) -> None:
    target_url = input_html.resolve().as_uri()
    cmd = [
        'npx',
        'playwright',
        'screenshot',
        target_url,
        str(output_path),
        f'--viewport-size={WIDTH},{HEIGHT}',
        '--timeout=0',
    ]

    subprocess.run(cmd, check=True)


def _ensure_dirs() -> None:
    OUTPUT_PNG.parent.mkdir(parents=True, exist_ok=True)


def generate() -> None:
    _ensure_dirs()

    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf-8') as html_file:
        html_path = Path(html_file.name)
        html_file.write(
            _fill_template(
                FINAL_HTML,
                BG_PATH.resolve().as_uri(),
                SWIRLS_PATH.resolve().as_uri(),
                CHAR_PATH.resolve().as_uri(),
                LOGO_PATH.resolve().as_uri(),
            )
        )

    try:
        _run_screenshot(html_path, OUTPUT_PNG)
        _run_screenshot(html_path, OUTPUT_JPG)
    finally:
        html_path.unlink(missing_ok=True)


if __name__ == '__main__':
    generate()
