from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    # Create static/js directory if it doesn't exist
    os.makedirs('static/js', exist_ok=True)
    
    # Download Stockfish if it doesn't exist
    stockfish_path = 'static/js/stockfish.js'
    if not os.path.exists(stockfish_path):
        import requests
        print("Downloading Stockfish...")
        url = 'https://stockfishchess.org/js/stockfish.js'
        response = requests.get(url)
        with open(stockfish_path, 'wb') as f:
            f.write(response.content)
        print("Stockfish downloaded successfully!")
    
    app.run(debug=True, port=5000)
