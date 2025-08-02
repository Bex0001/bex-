#!/bin/bash

# Create static/js directory if it doesn't exist
mkdir -p static/js

# Download Stockfish if it doesn't exist
if [ ! -f "static/js/stockfish.js" ]; then
    echo "Downloading Stockfish..."
    curl -o static/js/stockfish.js https://stockfishchess.org/js/stockfish.js
    echo "Stockfish downloaded successfully!"
fi

echo "Build completed successfully!"
