#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

// Dynamically read version from package.json so it always matches the GitHub Release tag
const VERSION = 'v' + require('../package.json').version;
const REPO = 'VishalRaut2106/go-gatekeeper';

const platform = os.platform();
const arch = os.arch();

let binName = 'gatekeeper-';
if (platform === 'win32') {
  binName += 'windows-amd64.exe';
} else if (platform === 'linux') {
  binName += 'linux-amd64';
} else if (platform === 'darwin') {
  binName += arch === 'arm64' ? 'darwin-arm64' : 'darwin-amd64';
} else {
  console.error(`Unsupported platform: ${platform} ${arch}`);
  process.exit(1);
}

const binPath = path.join(__dirname, platform === 'win32' ? 'gatekeeper.exe' : 'gatekeeper');
const downloadUrl = `https://github.com/${REPO}/releases/download/${VERSION}/${binName}`;

function downloadBinary() {
  return new Promise((resolve, reject) => {
    console.log(`Downloading gatekeeper ${VERSION} for ${platform}-${arch}...`);
    const file = fs.createWriteStream(binPath);
    
    function get(url) {
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          fs.unlink(binPath, () => {});
          reject(new Error(`Failed to download: ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(binPath, () => {});
        reject(err);
      });
    }
    
    get(downloadUrl);
  });
}

async function main() {
  if (!fs.existsSync(binPath)) {
    try {
      await downloadBinary();
      if (platform !== 'win32') {
        fs.chmodSync(binPath, 0o755);
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }

  const args = process.argv.slice(2);
  if (args.length === 0) {
    args.push('--server', 'wss://gatekeeper-relay.onrender.com/ws?role=host');
  }

  const child = spawn(binPath, args, { stdio: 'inherit' });
  child.on('exit', (code) => {
    process.exit(code);
  });
}

main();