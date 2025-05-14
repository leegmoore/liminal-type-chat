#!/usr/bin/env python3
"""
Ultra simple HTTP server - just one file with minimal code
"""

import http.server
import socketserver

# Define port
PORT = 8000

# Create handler
handler = http.server.SimpleHTTPRequestHandler

# Create server
with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()