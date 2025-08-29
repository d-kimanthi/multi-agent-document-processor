#!/bin/sh
set -e

# Replace environment variables in the built files
if [ -n "$REACT_APP_API_URL" ]; then
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|REACT_APP_API_URL_PLACEHOLDER|$REACT_APP_API_URL|g" {} \;
fi

# Execute the original command
exec "$@"

# Updated frontend/package.json build script
# Add this to the scripts section:
# "build": "vite build && sed -i 's|http://localhost:8000|REACT_APP_API_URL_PLACEHOLDER|g' dist/assets/*.js"