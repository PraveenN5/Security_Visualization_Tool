const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const LOCAL_API_URL = 'http://localhost:5000';
const DEPLOYED_API_URL = 'https://security-viz-api.onrender.com';
const LOCAL_FRONTEND_URL = 'http://localhost:8080';
const DEPLOYED_FRONTEND_URL = 'https://securityviz.site';

// Function to process HTML and JS files
function processFiles() {
  console.log('Starting deployment preparation...');
  console.log(`Replacing API URL: ${LOCAL_API_URL} → ${DEPLOYED_API_URL}`);
  console.log(`Replacing Frontend URL: ${LOCAL_FRONTEND_URL} → ${DEPLOYED_FRONTEND_URL}`);
  
  // Get all HTML and JS files
  const files = glob.sync('**/*.{html,js}', {
    ignore: ['node_modules/**', 'deployment-prep.js']
  });

  let modifiedFilesCount = 0;

  files.forEach(filePath => {
    const fullPath = path.resolve(filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    
    // Replace API URL
    content = content.replace(new RegExp(LOCAL_API_URL, 'g'), DEPLOYED_API_URL);
    
    // Replace frontend URL references
    content = content.replace(new RegExp(LOCAL_FRONTEND_URL, 'g'), DEPLOYED_FRONTEND_URL);
    
    // Replace Origin headers in fetch calls
    content = content.replace(
      /'Origin': 'http:\/\/localhost:8080'/g, 
      `'Origin': '${DEPLOYED_FRONTEND_URL}'`
    );
    
    // Update cookie settings for production (add secure flag for HTTPS)
    content = content.replace(
      /session_id=(.+?);(\s*path=\/;\s*max-age=\d+;\s*SameSite=Lax)/g,
      `session_id=$1$2; Secure`
    );
    
    // Fix redirect URLs after login/logout
    content = content.replace(
      /window\.location\.href = ['"]http:\/\/localhost:8080\/index\.html['"]/g,
      `window.location.href = '${DEPLOYED_FRONTEND_URL}/index.html'`
    );
    
    // If content was modified, write it back
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Modified: ${filePath}`);
      modifiedFilesCount++;
    }
  });

  console.log(`Deployment preparation complete. Modified ${modifiedFilesCount} files.`);
  console.log('\nINFORMATION: You need to update the CORS settings in your backend (app.py).');
  console.log('Add the following to your app.py file:');
  console.log(`
# Replace the existing CORS configuration with:
CORS(app, resources={
    r"/*": {
        "origins": ["https://securityviz.site", "http://localhost:8080"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-Session-ID", "Accept", "Origin"],
        "supports_credentials": True
    }
})

# Also update the response headers in the login route:
response.headers.add('Access-Control-Allow-Credentials', 'true')
response.headers.add('Access-Control-Allow-Origin', 'https://securityviz.site')
  `);
}

// Execute the file processing
processFiles();

// Function to create backend CORS update file
function createBackendCorsUpdateFile() {
  const corsUpdateContent = `
# Backend CORS Configuration Update for Deployment
# Replace the existing CORS configuration in app.py with this:

from flask import Flask, request, jsonify
from flask_cors import CORS
# ... other imports ...

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["https://securityviz.site", "http://localhost:8080"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-Session-ID", "Accept", "Origin"],
        "supports_credentials": True
    }
})

# In the login route, update the response headers:
@app.route("/login", methods=["POST"])
def login():
    # ... existing code ...
    
    response = jsonify({
        "message": "Login successful",
        "username": user.get("username"),
        "session_id": session_id
    })
    
    # Set CORS headers with updated origins
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    # Use condition to allow both development and production
    if request.headers.get('Origin') == 'http://localhost:8080':
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8080')
    else:
        response.headers.add('Access-Control-Allow-Origin', 'https://securityviz.site')
    
    return response, 200
`;

  fs.writeFileSync('backend-cors-update.txt', corsUpdateContent, 'utf8');
  console.log('Created backend-cors-update.txt with instructions for updating your backend CORS settings.');
}

// Create backend CORS update file
createBackendCorsUpdateFile();
