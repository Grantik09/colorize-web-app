from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import subprocess
import uuid
import sys

app = Flask(__name__)

# Configure upload and results folders
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
RESULTS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'results')
MODELS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/colorize', methods=['POST'])
def colorize():
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image provided'})
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No image selected'})
    
    # Generate unique filenames with original extension
    original_filename = file.filename
    extension = os.path.splitext(original_filename)[1].lower()
    input_filename = f"{uuid.uuid4()}{extension}"
    output_filename = f"{uuid.uuid4()}.jpg"
    
    input_path = os.path.join(UPLOAD_FOLDER, input_filename)
    output_path = os.path.join(RESULTS_FOLDER, output_filename)
    
    # Save the uploaded file
    file.save(input_path)
    
    try:
        # Run the colorization script with the current project's paths
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'colorize_web.py')
        
        cmd = [
            sys.executable,  # Use the current Python interpreter
            script_path,
            "--image", input_path,
            "--output", output_path,
            "--models", MODELS_FOLDER
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify({
                'success': False, 
                'error': f"Colorization failed: {result.stderr}"
            })
        
        # Return the URL to the colorized image
        return jsonify({
            'success': True,
            'originalImageUrl': f"/static/uploads/{input_filename}",
            'colorizedImageUrl': f"/static/results/{output_filename}"
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)