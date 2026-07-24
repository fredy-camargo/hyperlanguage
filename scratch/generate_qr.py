import sys

try:
    import qrcode
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=2)
    qr.add_data('https://polyglotlab-xi.vercel.app/')
    qr.make(fit=True)
    matrix = qr.get_matrix()
    size = len(matrix)
    
    rects = []
    for r in range(size):
        for c in range(size):
            if matrix[r][c]:
                rects.append(f'<rect x="{c}" y="{r}" width="1" height="1" fill="currentColor"/>')
                
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" shape-rendering="crispEdges">{"".join(rects)}</svg>'
    with open('scratch/qr_code.svg', 'w') as f:
        f.write(svg)
    print(f"SUCCESS: Generated {size}x{size} QR SVG with {len(rects)} modules.")
except Exception as e:
    print(f"qrcode module not found, installing or building fallback... {e}")
