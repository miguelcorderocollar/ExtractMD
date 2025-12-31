#!/usr/bin/env python3
"""
Generate ExtractMD icons at all required sizes.

Multiple design options available - run with --design flag:
    python scripts/generate_icons.py --design md
    python scripts/generate_icons.py --design arrow
    python scripts/generate_icons.py --design clipboard
    python scripts/generate_icons.py --design brackets
    python scripts/generate_icons.py --preview  # Generate all designs for comparison

Requirements:
    pip install pillow cairosvg
"""

import argparse
import os
from pathlib import Path
from io import BytesIO

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
PREVIEW_DIR = SCRIPT_DIR / "icon_previews"

SIZES = [16, 48, 128]


# =============================================================================
# DESIGN 1: Bold "MD" Typography - Elegant Serif
# =============================================================================
def design_md_svg(size: int) -> str:
    """Elegant serif MD - properly sized to fit inside with padding."""
    s = size / 128
    radius = int(size * 0.15)
    
    # Font sizing - MD fits comfortably inside with proper padding
    font_size = int(size * 0.65)
    
    # Use elegant serif fonts
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&amp;display=swap');
    </style>
  </defs>
  <rect width="{size}" height="{size}" rx="{radius}" fill="{TEAL}"/>
  <text x="{size/2}" y="{size * 0.68}" 
        font-family="Playfair Display, Georgia, Times New Roman, serif" 
        font-weight="700" 
        font-size="{font_size}" 
        fill="{WHITE}" 
        text-anchor="middle"
        letter-spacing="{int(-2 * s)}">MD</text>
</svg>'''


def get_serif_font(font_size: int):
    """Get a serif font, trying various system fonts."""
    serif_fonts = [
        # Linux common paths
        "/usr/share/fonts/TTF/PlayfairDisplay-Bold.ttf",
        "/usr/share/fonts/truetype/playfair-display/PlayfairDisplay-Bold.ttf",
        "/usr/share/fonts/OTF/PlayfairDisplay-Bold.otf",
        "/usr/share/fonts/TTF/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/TTF/FreeSerif.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf",
        "/usr/share/fonts/noto/NotoSerif-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSerif-Bold.ttf",
        "/usr/share/fonts/google-noto/NotoSerif-Bold.ttf",
        # macOS paths
        "/System/Library/Fonts/Times.ttc",
        "/Library/Fonts/Georgia.ttf",
        # Generic fallbacks
        "/usr/share/fonts/TTF/times.ttf",
        "/usr/share/fonts/TTF/Georgia.ttf",
    ]
    
    for font_path in serif_fonts:
        try:
            return ImageFont.truetype(font_path, font_size)
        except:
            continue
    
    return ImageFont.load_default()


def design_md_pillow(size: int) -> Image.Image:
    """Elegant serif MD using Pillow - properly sized to fit inside."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    radius = int(size * 0.15)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=TEAL_RGB)
    
    # Font size that fits comfortably inside with proper padding
    font_size = int(size * 0.62)
    font = get_serif_font(font_size)
    
    text = "MD"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text with proper padding
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]
    
    draw.text((x, y), text, fill=WHITE_RGB, font=font)
    return img


# =============================================================================
# DESIGN 2: Dynamic Arrow (extraction/export feel)
# =============================================================================
def design_arrow_svg(size: int) -> str:
    """Bold arrow pointing right - represents extraction."""
    s = size / 128
    radius = int(size * 0.18)
    
    # Arrow dimensions - big and bold
    stroke = max(3, int(8 * s))
    
    # Horizontal bar
    bar_y = size // 2
    bar_left = int(size * 0.15)
    bar_right = int(size * 0.65)
    
    # Arrow head
    head_x = int(size * 0.85)
    head_size = int(size * 0.28)
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <rect width="{size}" height="{size}" rx="{radius}" fill="{TEAL}"/>
  
  <!-- Arrow shaft -->
  <line x1="{bar_left}" y1="{bar_y}" x2="{bar_right}" y2="{bar_y}" 
        stroke="{WHITE}" stroke-width="{stroke}" stroke-linecap="round"/>
  
  <!-- Arrow head (chevron) -->
  <path d="M{head_x - head_size} {bar_y - head_size} 
           L{head_x} {bar_y} 
           L{head_x - head_size} {bar_y + head_size}" 
        stroke="{WHITE}" stroke-width="{stroke}" fill="none" 
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''


def design_arrow_pillow(size: int) -> Image.Image:
    """Bold arrow using Pillow."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    radius = int(size * 0.18)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=TEAL_RGB)
    
    stroke = max(2, int(8 * size / 128))
    bar_y = size // 2
    bar_left = int(size * 0.15)
    bar_right = int(size * 0.65)
    head_x = int(size * 0.85)
    head_size = int(size * 0.28)
    
    # Shaft
    draw.line([(bar_left, bar_y), (bar_right, bar_y)], fill=WHITE_RGB, width=stroke)
    
    # Arrow head
    draw.line([(head_x - head_size, bar_y - head_size), (head_x, bar_y)], fill=WHITE_RGB, width=stroke)
    draw.line([(head_x - head_size, bar_y + head_size), (head_x, bar_y)], fill=WHITE_RGB, width=stroke)
    
    return img


# =============================================================================
# DESIGN 3: Clipboard with Checkmark
# =============================================================================
def design_clipboard_svg(size: int) -> str:
    """Clipboard with checkmark - universal 'copied' symbol."""
    s = size / 128
    radius = int(size * 0.18)
    stroke = max(2, int(5 * s))
    
    # Clipboard body
    clip_left = int(size * 0.22)
    clip_right = int(size * 0.78)
    clip_top = int(size * 0.18)
    clip_bottom = int(size * 0.88)
    clip_radius = int(size * 0.08)
    
    # Clip at top
    clip_notch_left = int(size * 0.35)
    clip_notch_right = int(size * 0.65)
    clip_notch_height = int(size * 0.12)
    
    # Checkmark
    check_x1 = int(size * 0.32)
    check_y1 = int(size * 0.55)
    check_x2 = int(size * 0.45)
    check_y2 = int(size * 0.70)
    check_x3 = int(size * 0.70)
    check_y3 = int(size * 0.40)
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <rect width="{size}" height="{size}" rx="{radius}" fill="{TEAL}"/>
  
  <!-- Clipboard body -->
  <rect x="{clip_left}" y="{clip_top}" 
        width="{clip_right - clip_left}" height="{clip_bottom - clip_top}" 
        rx="{clip_radius}" 
        stroke="{WHITE}" stroke-width="{stroke}" fill="none"/>
  
  <!-- Clip notch at top -->
  <rect x="{clip_notch_left}" y="{clip_top - int(3*s)}" 
        width="{clip_notch_right - clip_notch_left}" height="{clip_notch_height}" 
        rx="{int(3*s)}" fill="{WHITE}"/>
  
  <!-- Checkmark -->
  <path d="M{check_x1} {check_y1} L{check_x2} {check_y2} L{check_x3} {check_y3}" 
        stroke="{WHITE}" stroke-width="{stroke}" fill="none" 
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''


def design_clipboard_pillow(size: int) -> Image.Image:
    """Clipboard with checkmark using Pillow."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    s = size / 128
    radius = int(size * 0.18)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=TEAL_RGB)
    
    stroke = max(2, int(5 * s))
    
    # Clipboard body
    clip_left = int(size * 0.22)
    clip_right = int(size * 0.78)
    clip_top = int(size * 0.18)
    clip_bottom = int(size * 0.88)
    clip_radius = int(size * 0.08)
    
    draw.rounded_rectangle(
        [(clip_left, clip_top), (clip_right, clip_bottom)],
        radius=clip_radius,
        outline=WHITE_RGB,
        width=stroke
    )
    
    # Clip notch
    clip_notch_left = int(size * 0.35)
    clip_notch_right = int(size * 0.65)
    clip_notch_top = clip_top - int(3*s)
    clip_notch_bottom = clip_notch_top + int(size * 0.12)
    
    draw.rounded_rectangle(
        [(clip_notch_left, clip_notch_top), (clip_notch_right, clip_notch_bottom)],
        radius=int(3*s),
        fill=WHITE_RGB
    )
    
    # Checkmark
    check_x1 = int(size * 0.32)
    check_y1 = int(size * 0.55)
    check_x2 = int(size * 0.45)
    check_y2 = int(size * 0.70)
    check_x3 = int(size * 0.70)
    check_y3 = int(size * 0.40)
    
    draw.line([(check_x1, check_y1), (check_x2, check_y2)], fill=WHITE_RGB, width=stroke)
    draw.line([(check_x2, check_y2), (check_x3, check_y3)], fill=WHITE_RGB, width=stroke)
    
    return img


# =============================================================================
# DESIGN 4: Stylized Brackets { }
# =============================================================================
def design_brackets_svg(size: int) -> str:
    """Curly brackets - developer/code aesthetic."""
    s = size / 128
    radius = int(size * 0.18)
    stroke = max(3, int(7 * s))
    
    # Bracket dimensions
    bracket_height = int(size * 0.6)
    bracket_width = int(size * 0.2)
    center_y = size // 2
    top_y = center_y - bracket_height // 2
    bottom_y = center_y + bracket_height // 2
    
    # Left bracket
    left_x = int(size * 0.25)
    left_tip = left_x - int(size * 0.08)
    
    # Right bracket  
    right_x = int(size * 0.75)
    right_tip = right_x + int(size * 0.08)
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <rect width="{size}" height="{size}" rx="{radius}" fill="{TEAL}"/>
  
  <!-- Left curly bracket -->
  <path d="M{left_x} {top_y} 
           Q{left_x - bracket_width//2} {top_y} {left_x - bracket_width//2} {center_y - bracket_height//4}
           Q{left_x - bracket_width//2} {center_y} {left_tip} {center_y}
           Q{left_x - bracket_width//2} {center_y} {left_x - bracket_width//2} {center_y + bracket_height//4}
           Q{left_x - bracket_width//2} {bottom_y} {left_x} {bottom_y}" 
        stroke="{WHITE}" stroke-width="{stroke}" fill="none" 
        stroke-linecap="round"/>
  
  <!-- Right curly bracket -->
  <path d="M{right_x} {top_y} 
           Q{right_x + bracket_width//2} {top_y} {right_x + bracket_width//2} {center_y - bracket_height//4}
           Q{right_x + bracket_width//2} {center_y} {right_tip} {center_y}
           Q{right_x + bracket_width//2} {center_y} {right_x + bracket_width//2} {center_y + bracket_height//4}
           Q{right_x + bracket_width//2} {bottom_y} {right_x} {bottom_y}" 
        stroke="{WHITE}" stroke-width="{stroke}" fill="none" 
        stroke-linecap="round"/>
</svg>'''


def design_brackets_pillow(size: int) -> Image.Image:
    """Curly brackets using Pillow (simplified)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    s = size / 128
    radius = int(size * 0.18)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=TEAL_RGB)
    
    # Draw { } using text as fallback
    font_size = int(size * 0.7)
    try:
        font = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()
    
    text = "{ }"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.08)
    
    draw.text((x, y), text, fill=WHITE_RGB, font=font)
    return img


# =============================================================================
# DESIGN 5: Page with Bold Arrow (simplified original)
# =============================================================================
def design_page_arrow_svg(size: int) -> str:
    """Simplified page with prominent arrow - extraction concept."""
    s = size / 128
    radius = int(size * 0.18)
    stroke = max(2, int(5 * s))
    heavy_stroke = max(3, int(7 * s))
    
    # Page - smaller, left side
    page_left = int(size * 0.12)
    page_right = int(size * 0.48)
    page_top = int(size * 0.15)
    page_bottom = int(size * 0.85)
    page_radius = int(size * 0.06)
    
    # Arrow - large, prominent
    arrow_y = size // 2
    arrow_start = int(size * 0.52)
    arrow_end = int(size * 0.88)
    arrow_head = int(size * 0.22)
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <rect width="{size}" height="{size}" rx="{radius}" fill="{TEAL}"/>
  
  <!-- Page outline -->
  <rect x="{page_left}" y="{page_top}" 
        width="{page_right - page_left}" height="{page_bottom - page_top}" 
        rx="{page_radius}" 
        stroke="{WHITE}" stroke-width="{stroke}" fill="none"/>
  
  <!-- Text lines on page -->
  <line x1="{page_left + int(6*s)}" y1="{page_top + int(14*s)}" 
        x2="{page_right - int(6*s)}" y2="{page_top + int(14*s)}" 
        stroke="{WHITE}" stroke-width="{max(1, int(2*s))}" stroke-linecap="round"/>
  <line x1="{page_left + int(6*s)}" y1="{page_top + int(24*s)}" 
        x2="{page_right - int(6*s)}" y2="{page_top + int(24*s)}" 
        stroke="{WHITE}" stroke-width="{max(1, int(2*s))}" stroke-linecap="round"/>
  
  <!-- Bold extraction arrow -->
  <line x1="{arrow_start}" y1="{arrow_y}" 
        x2="{arrow_end - arrow_head//2}" y2="{arrow_y}" 
        stroke="{WHITE}" stroke-width="{heavy_stroke}" stroke-linecap="round"/>
  <path d="M{arrow_end - arrow_head} {arrow_y - arrow_head//2 - int(2*s)} 
           L{arrow_end} {arrow_y} 
           L{arrow_end - arrow_head} {arrow_y + arrow_head//2 + int(2*s)}" 
        stroke="{WHITE}" stroke-width="{heavy_stroke}" fill="none" 
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''


def design_page_arrow_pillow(size: int) -> Image.Image:
    """Page with arrow using Pillow."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    s = size / 128
    radius = int(size * 0.18)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=TEAL_RGB)
    
    stroke = max(2, int(5 * s))
    heavy_stroke = max(2, int(7 * s))
    
    # Page
    page_left = int(size * 0.12)
    page_right = int(size * 0.48)
    page_top = int(size * 0.15)
    page_bottom = int(size * 0.85)
    page_radius = int(size * 0.06)
    
    draw.rounded_rectangle(
        [(page_left, page_top), (page_right, page_bottom)],
        radius=page_radius,
        outline=WHITE_RGB,
        width=stroke
    )
    
    # Text lines
    line_stroke = max(1, int(2 * s))
    draw.line([(page_left + int(6*s), page_top + int(14*s)), 
               (page_right - int(6*s), page_top + int(14*s))], 
              fill=WHITE_RGB, width=line_stroke)
    draw.line([(page_left + int(6*s), page_top + int(24*s)), 
               (page_right - int(6*s), page_top + int(24*s))], 
              fill=WHITE_RGB, width=line_stroke)
    
    # Arrow
    arrow_y = size // 2
    arrow_start = int(size * 0.52)
    arrow_end = int(size * 0.88)
    arrow_head = int(size * 0.22)
    
    draw.line([(arrow_start, arrow_y), (arrow_end - arrow_head//2, arrow_y)], 
              fill=WHITE_RGB, width=heavy_stroke)
    draw.line([(arrow_end - arrow_head, arrow_y - arrow_head//2 - int(2*s)), 
               (arrow_end, arrow_y)], fill=WHITE_RGB, width=heavy_stroke)
    draw.line([(arrow_end - arrow_head, arrow_y + arrow_head//2 + int(2*s)), 
               (arrow_end, arrow_y)], fill=WHITE_RGB, width=heavy_stroke)
    
    return img


# =============================================================================
# Design Registry
# =============================================================================
DESIGNS = {
    'md': {
        'name': 'Serif MD',
        'description': 'Elegant serif MD - large & premium',
        'svg': design_md_svg,
        'pillow': design_md_pillow,
    },
    'arrow': {
        'name': 'Export Arrow',
        'description': 'Bold arrow - represents extraction',
        'svg': design_arrow_svg,
        'pillow': design_arrow_pillow,
    },
    'clipboard': {
        'name': 'Clipboard Check',
        'description': 'Clipboard with checkmark - copied!',
        'svg': design_clipboard_svg,
        'pillow': design_clipboard_pillow,
    },
    'brackets': {
        'name': 'Code Brackets',
        'description': 'Curly braces - developer aesthetic',
        'svg': design_brackets_svg,
        'pillow': design_brackets_pillow,
    },
    'page': {
        'name': 'Page + Arrow',
        'description': 'Simplified document with extraction arrow',
        'svg': design_page_arrow_svg,
        'pillow': design_page_arrow_pillow,
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


def generate_preview_grid() -> None:
    """Generate a preview grid comparing all designs."""
    print("\n📊 Generating preview grid...")
    
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate individual previews for each design at 128px
    for key, design in DESIGNS.items():
        output_path = PREVIEW_DIR / f"{key}_128.png"
        generate_icon(key, 128, output_path)
        print(f"  ✓ {key}_128.png")
    
    # Create comparison grid
    padding = 20
    label_height = 30
    cols = len(DESIGNS)
    icon_size = 128
    
    grid_width = cols * icon_size + (cols + 1) * padding
    grid_height = icon_size + 2 * padding + label_height
    
    grid = Image.new('RGB', (grid_width, grid_height), (40, 40, 40))
    draw = ImageDraw.Draw(grid)
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSans.ttf", 14)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        except:
            font = ImageFont.load_default()
    
    for i, (key, design) in enumerate(DESIGNS.items()):
        x = padding + i * (icon_size + padding)
        y = padding
        
        # Load and paste icon
        icon_path = PREVIEW_DIR / f"{key}_128.png"
        icon = Image.open(icon_path)
        grid.paste(icon, (x, y), icon if icon.mode == 'RGBA' else None)
        
        # Add label
        label = design['name']
        bbox = draw.textbbox((0, 0), label, font=font)
        label_width = bbox[2] - bbox[0]
        label_x = x + (icon_size - label_width) // 2
        label_y = y + icon_size + 8
        draw.text((label_x, label_y), label, fill=(200, 200, 200), font=font)
    
    grid_path = PREVIEW_DIR / "comparison.png"
    grid.save(grid_path)
    print(f"\n✅ Comparison grid saved to: {grid_path}")


def main():
    parser = argparse.ArgumentParser(description='Generate ExtractMD icons')
    parser.add_argument('--design', '-d', choices=list(DESIGNS.keys()), 
                        default='md',
                        help='Design style to use')
    parser.add_argument('--preview', '-p', action='store_true',
                        help='Generate preview of all designs')
    parser.add_argument('--list', '-l', action='store_true',
                        help='List available designs')
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("ExtractMD Icon Generator")
    print("=" * 50)
    
    if not HAS_CAIROSVG:
        print("⚠️  cairosvg not installed, using Pillow fallback")
        print("   For best quality: pip install cairosvg")
    
    if args.list:
        print("\nAvailable designs:")
        for key, design in DESIGNS.items():
            print(f"  {key:12} - {design['description']}")
        return
    
    if args.preview:
        generate_preview_grid()
        print("\nOpen scripts/icon_previews/comparison.png to compare designs")
        print("Then run: python scripts/generate_icons.py --design <name>")
    else:
        generate_all_icons(args.design)
        print(f"\n✅ Icons generated with '{DESIGNS[args.design]['name']}' design!")


if __name__ == "__main__":
    main()
