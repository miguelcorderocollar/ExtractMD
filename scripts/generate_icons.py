#!/usr/bin/env python3
"""
Generate ExtractMD icons at all required sizes.

The icon matches the FloatingButton.js clipboard icon design.

Requirements:
    pip install pillow cairosvg
"""

import argparse
from pathlib import Path

try:
    import cairosvg
    HAS_CAIROSVG = True
except ImportError:
    HAS_CAIROSVG = False

from PIL import Image, ImageDraw, ImageFont

# ExtractMD brand color
TEAL = "#14b8a6"
TEAL_RGB = (20, 184, 166)
TEAL_DARK = "#0d9488"
TEAL_DARK_RGB = (13, 148, 136)
WHITE = "#fafafa"
WHITE_RGB = (250, 250, 250)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ICONS_DIR = PROJECT_ROOT / "extension" / "icons"
IMAGES_DIR = PROJECT_ROOT / "extension" / "images"

SIZES = [16, 48, 128]


# =============================================================================
# Floating Button Clipboard Design (matches FloatingButton.js icon)
# =============================================================================
def design_floating_button_clipboard_svg(size: int) -> str:
    """Clipboard icon matching FloatingButton.js - bigger and thicker lines.
    
    Uses nested SVG with viewBox for clean scaling of the original 24x24 icon.
    """
    radius = int(size * 0.15)
    
    # Icon positioning - leave some padding around the edges
    padding_pct = 0.14  # 14% padding on each side
    padding = size * padding_pct
    inner_size = size - (padding * 2)
    
    # Stroke width scales with icon size but stays proportional
    # Original is 2 in 24x24, we want slightly thicker for visibility
    stroke = 2.5
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <!-- Background rounded square -->
  <rect width="{size}" height="{size}" rx="{radius}" fill="{TEAL}"/>
  
  <!-- Clipboard icon - use nested SVG for clean scaling -->
  <svg x="{padding}" y="{padding}" width="{inner_size}" height="{inner_size}" viewBox="0 0 24 24">
    <!-- Clipboard board - open path that wraps around but leaves gap at top for clip -->
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" 
          fill="none" stroke="{WHITE}" stroke-width="{stroke}" 
          stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Clip at top -->
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" 
          fill="none" stroke="{WHITE}" stroke-width="{stroke}"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</svg>'''


def design_floating_button_clipboard_pillow(size: int) -> Image.Image:
    """Floating button clipboard using Pillow - fallback when cairosvg unavailable."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    radius = int(size * 0.15)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=TEAL_RGB)
    
    # Icon positioning
    padding_pct = 0.14
    padding = size * padding_pct
    inner_size = size - (padding * 2)
    scale = inner_size / 24
    
    # Stroke width - thicker for visibility
    stroke = max(2, int(2.5 * scale))
    
    def sc(val):
        """Scale from 24x24 coordinates to actual size."""
        return padding + val * scale
    
    # Main clipboard board: rounded rectangle from (4,4) to (20,22) with corner radius
    # The path creates a rectangle with rounded corners
    board_radius = int(2 * scale)
    draw.rounded_rectangle(
        [(sc(4), sc(4)), (sc(20), sc(22))],
        radius=board_radius,
        outline=WHITE_RGB,
        width=stroke
    )
    
    # Clip notch at top (x=8 y=2 width=8 height=4)
    clip_radius = max(1, int(1 * scale))
    draw.rounded_rectangle(
        [(sc(8), sc(2)), (sc(16), sc(6))],
        radius=clip_radius,
        outline=WHITE_RGB,
        width=stroke
    )
    
    return img


# =============================================================================
# Design Registry
# =============================================================================
DESIGNS = {
    'floating_button': {
        'name': 'Floating Button Clipboard',
        'description': 'Matches FloatingButton.js icon - bigger & thicker',
        'svg': design_floating_button_clipboard_svg,
        'pillow': design_floating_button_clipboard_pillow,
    },
}


# =============================================================================
# Generation Functions
# =============================================================================
def generate_icon(design_key: str, size: int, output_path: Path) -> None:
    """Generate icon using specified design."""
    design = DESIGNS[design_key]
    
    if HAS_CAIROSVG:
        svg_content = design['svg'](size)
        png_data = cairosvg.svg2png(bytestring=svg_content.encode('utf-8'))
        with open(output_path, 'wb') as f:
            f.write(png_data)
    else:
        img = design['pillow'](size)
        img.save(output_path, 'PNG')


def generate_all_icons(design_key: str) -> None:
    """Generate all icon sizes for a design."""
    print(f"\n🎨 Generating '{DESIGNS[design_key]['name']}' icons...")
    
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    for size in SIZES:
        output_path = ICONS_DIR / f"icon{size}.png"
        generate_icon(design_key, size, output_path)
        print(f"  ✓ icon{size}.png")
    
    # Generate logo.svg
    svg_content = DESIGNS[design_key]['svg'](128)
    svg_path = IMAGES_DIR / "logo.svg"
    with open(svg_path, 'w') as f:
        f.write(svg_content)
    print(f"  ✓ logo.svg")
    
    # Note: logo.png removed - only logo.svg is used




def main():
    parser = argparse.ArgumentParser(description='Generate ExtractMD icons')
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("ExtractMD Icon Generator")
    print("=" * 50)
    
    if not HAS_CAIROSVG:
        print("⚠️  cairosvg not installed, using Pillow fallback")
        print("   For best quality: pip install cairosvg")
    
    # Always use floating_button design
    design_key = 'floating_button'
    generate_all_icons(design_key)
    print(f"\n✅ Icons generated with '{DESIGNS[design_key]['name']}' design!")


if __name__ == "__main__":
    main()
