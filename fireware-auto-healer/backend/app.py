from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename

# Import your model functions
from models.log_analyzer import analyze_log
from models.jira_analyzer import analyze_jira_issue
from models.code_correction import correct_code

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/analyze-log', methods=['POST'])
def analyze_log_endpoint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    # Save and process file
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    # Call your model
    result = analyze_log(filepath)
    
    return jsonify(result)

@app.route('/api/analyze-jira', methods=['POST'])
def analyze_jira_endpoint():
    data = request.get_json()
    description = data.get('description', '')
    
    if not description:
        return jsonify({'error': 'No description provided'}), 400
    
    # Call your model
    result = analyze_jira_issue(description)
    
    return jsonify(result)

@app.route('/api/correct-code', methods=['POST'])
def correct_code_endpoint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    # Call your model
    result = correct_code(filepath)
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)