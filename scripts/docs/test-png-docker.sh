#!/bin/bash

# Test PNG screenshot generation using Docker with Playwright

# Create a temporary HTML file
cat > /tmp/sparkline-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #1e1e1e;
      font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
      font-size: 16px;
      line-height: 1.4;
    }
    pre {
      margin: 0;
      color: #D3D3D3;
      white-space: pre;
      letter-spacing: -0.05em;
    }
    .sparkline {
      color: #D3D3D3;
    }
  </style>
</head>
<body>
  <pre><span style="color:#D3D3D3">▁▂▃▄▅▆▇█</span></pre>
  <pre><span style="color:#FF0000">Red</span> <span style="color:#00FF00">Green</span> <span style="color:#FFFF00">Yellow</span> <span style="color:#9932CC">Magenta</span></pre>
</body>
</html>
EOF

# Run Playwright in Docker to take screenshot
docker run --rm \
  -v /tmp:/tmp \
  -v "$(pwd)/docs/images/sparkline:/output" \
  mcr.microsoft.com/playwright:v1.58.2-jammy \
  npx playwright screenshot \
    --viewport-size="400,100" \
    --full-page \
    "file:///tmp/sparkline-test.html" \
    /output/test-docker.png

echo "Screenshot saved to docs/images/sparkline/test-docker.png"
