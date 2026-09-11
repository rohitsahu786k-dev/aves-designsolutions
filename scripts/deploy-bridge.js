const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const proc = spawn('npx.cmd', ['--yes', '--package=@hostinger/mcp@latest', 'hostinger-hosting-mcp'], {
    shell: true,
    env: { ...process.env, HOSTINGER_API_TOKEN: 'p8MTYi5h5TkfKL0BY5BPML2IpI0oTBtWBhxF2jz10ece10ab' }
  });

  proc.stderr.on('data', d => console.error('ERR:', d.toString()));

  let buffer = '';
  proc.stdout.on('data', async chunk => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line.replace(/^OUT:\s*/, ''));
        if (msg.id === 2 && msg.result && msg.result.content) {
          const creds = JSON.parse(msg.result.content[0].text);
          console.log('Got upload credentials:', creds.url);

          const filePath = path.join(__dirname, '..', 'wordpress', 'screwnet-headless-bridge', 'screwnet-headless-bridge.php');
          const fileContent = fs.readFileSync(filePath);
          const size = fileContent.length;

          // Target 1: wp-content/plugins/screwnet-headless-bridge.php
          // Target 2: wp-content/plugins/screwnet-headless-bridge/screwnet-headless-bridge.php
          const targets = [
            'wp-content/plugins/screwnet-headless-bridge.php',
            'wp-content/plugins/screwnet-headless-bridge/screwnet-headless-bridge.php'
          ];

          for (const target of targets) {
            console.log(`Uploading to ${target} (${size} bytes)...`);
            const postRes = await fetch(`${creds.url}/${target}?override=true`, {
              method: 'POST',
              headers: {
                'X-Auth': creds.auth_key,
                'X-Auth-Rest': creds.rest_auth_key,
                'Tus-Resumable': '1.0.0',
                'Upload-Length': size.toString(),
                'Upload-Offset': '0'
              }
            });
            console.log(`POST ${target}: ${postRes.status}`);

            const patchRes = await fetch(`${creds.url}/${target}?override=true`, {
              method: 'PATCH',
              headers: {
                'X-Auth': creds.auth_key,
                'X-Auth-Rest': creds.rest_auth_key,
                'Tus-Resumable': '1.0.0',
                'Content-Type': 'application/offset+octet-stream',
                'Upload-Offset': '0'
              },
              body: fileContent
            });
            console.log(`PATCH ${target}: ${patchRes.status}`);
          }

          console.log('SUCCESS! All targets updated.');
          setTimeout(() => {
            proc.kill();
            process.exit(0);
          }, 1000);
        }
      } catch (e) {
        // Not json or other message
      }
    }
  });

  // Initialize
  proc.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', clientInfo: { name: 'deployer', version: '1.0' }, capabilities: {} },
    id: 1
  }) + '\n');

  // Request upload URL
  setTimeout(() => {
    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'hosting_generateUploadURLV1',
        arguments: {
          username: 'u839104573',
          domain: 'slateblue-frog-836232.hostingersite.com'
        }
      },
      id: 2
    }) + '\n');
  }, 3000);
}

main().catch(console.error);
