from PIL import Image, ImageDraw
import os

def create_icon(size):
    # Create a new image with a gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create a simple gradient effect
    for i in range(size):
        # Gradient from purple to blue
        r = int(102 + (118 - 102) * i / size)
        g = int(126 + (75 - 126) * i / size)
        b = int(234 + (162 - 234) * i / size)
        draw.line([(0, i), (size, i)], fill=(r, g, b, 255))
    
    # Draw a simple document icon
    margin = int(size * 0.15)
    doc_width = size - 2 * margin
    doc_height = size - 2 * margin
    
    # Document outline
    draw.rectangle([margin, margin, margin + doc_width, margin + doc_height], 
                   outline='white', width=max(1, size // 32))
    
    # Lines representing text
    line_spacing = doc_height // 8
    line_start = margin + line_spacing
    line_end = margin + doc_width - line_spacing
    
    for i in range(6):
        y = line_start + i * line_spacing
        draw.line([(margin + line_spacing, y), (line_end, y)], 
                  fill='white', width=max(1, size // 64))
    
    return img

# Create icons directory if it doesn't exist
if not os.path.exists('icons'):
    os.makedirs('icons')

# Generate icons
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(f'icons/icon{size}.png')
    print(f'Created icon{size}.png')

print('All icons created successfully!') 