#!/usr/bin/env python3
"""
Simple HTTP server to serve the test-claude-ui.html file
No dependencies required - uses Python's built-in http.server module
"""

import http.server
import socketserver
import os
import sys

# Default to port 8000 if not specified
PORT = 8000

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler for our server"""
    
    def do_GET(self):
        """Handle GET requests"""
        # Default to test-claude-ui.html if root is requested
        if self.path == '/':
            self.path = '/test-claude-ui.html'
        
        # Call the parent class's method which will serve the file
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

# Create the server
Handler = MyHandler
httpd = socketserver.TCPServer(("", PORT), Handler)

print(f"""
┌──────────────────────────────────────────────────────┐
│                                                      │
│   Simple Test Server for Claude 3.7 Sonnet UI        │
│                                                      │
│   URL: http://localhost:{PORT}                         │
│                                                      │
│   This server has NO dependencies and serves         │
│   the standalone test HTML UI.                       │
│                                                      │
└──────────────────────────────────────────────────────┘
""")

# Serve until process is killed
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped by user")
    httpd.server_close()
    sys.exit(0)