import re
import os

def minify_css(css_content):
    """Minify CSS content by removing unnecessary whitespace and comments"""
    # Remove comments
    css_content = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', css_content)
    
    # Remove unnecessary whitespace
    css_content = re.sub(r'\s+', ' ', css_content)
    css_content = re.sub(r'\s*{\s*', '{', css_content)
    css_content = re.sub(r'\s*}\s*', '}', css_content)
    css_content = re.sub(r'\s*;\s*', ';', css_content)
    css_content = re.sub(r'\s*,\s*', ',', css_content)
    css_content = re.sub(r'\s*:\s*', ':', css_content)
    css_content = re.sub(r';\s*}', '}', css_content)
    
    # Remove leading/trailing whitespace
    css_content = css_content.strip()
    
    return css_content

def minify_js(js_content):
    """Basic JS minification - remove comments and unnecessary whitespace"""
    # Remove single line comments (but preserve URLs)
    js_content = re.sub(r'(?<!:)//.*$', '', js_content, flags=re.MULTILINE)
    
    # Remove multi-line comments
    js_content = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', js_content)
    
    # Remove unnecessary whitespace
    js_content = re.sub(r'\s+', ' ', js_content)
    js_content = re.sub(r'\s*{\s*', '{', js_content)
    js_content = re.sub(r'\s*}\s*', '}', js_content)
    js_content = re.sub(r'\s*;\s*', ';', js_content)
    js_content = re.sub(r'\s*,\s*', ',', js_content)
    js_content = re.sub(r'\s*=\s*', '=', js_content)
    
    return js_content.strip()

# Minify CSS files
css_files = ['style.css', 'booking.css', 'enquiry.css', 'services.css']

for css_file in css_files:
    css_path = f'css/{css_file}'
    if os.path.exists(css_path):
        with open(css_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        minified = minify_css(content)
        
        # Create minified version
        min_filename = css_file.replace('.css', '.min.css')
        min_path = f'css/{min_filename}'
        
        with open(min_path, 'w', encoding='utf-8') as f:
            f.write(minified)
        
        original_size = len(content)
        minified_size = len(minified)
        reduction = ((original_size - minified_size) / original_size) * 100
        
        print(f'{css_file}: {original_size} -> {minified_size} bytes ({reduction:.1f}% reduction)')
    else:
        print(f'{css_file} not found')

# Minify JS files
js_files = ['main.js', 'chatbot.js', 'enquiry.js', 'services.js', 'animations.js', 'script.js']

for js_file in js_files:
    js_path = f'js/{js_file}'
    if os.path.exists(js_path):
        with open(js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        minified = minify_js(content)
        
        # Create minified version
        min_filename = js_file.replace('.js', '.min.js')
        min_path = f'js/{min_filename}'
        
        with open(min_path, 'w', encoding='utf-8') as f:
            f.write(minified)
        
        original_size = len(content)
        minified_size = len(minified)
        reduction = ((original_size - minified_size) / original_size) * 100
        
        print(f'{js_file}: {original_size} -> {minified_size} bytes ({reduction:.1f}% reduction)')
    else:
        print(f'{js_file} not found')

print('\nMinification complete!')