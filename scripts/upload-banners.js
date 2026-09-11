const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const banners = [
  {
    localFile: 'C:\\Users\\Rohit Sahu\\.gemini\\antigravity-ide\\brain\\5297634d-ad25-44ca-9b67-30dd8a816cd8\\screwnet_hero_banner_1_1789151369454.jpg',
    target: 'wp-content/uploads/2026/09/screwnet-hero-banner-1.jpg',
    publicUrl: 'https://wp.screwnet.in/wp-content/uploads/2026/09/screwnet-hero-banner-1.jpg',
    postId: 530,
    title: 'Precision Industrial Fasteners | SS304 & SS316',
    ctaUrl: '/shop?search=SS304'
  },
  {
    localFile: 'C:\\Users\\Rohit Sahu\\.gemini\\antigravity-ide\\brain\\5297634d-ad25-44ca-9b67-30dd8a816cd8\\screwnet_hero_banner_2_1789151395974.jpg',
    target: 'wp-content/uploads/2026/09/screwnet-hero-banner-2.jpg',
    publicUrl: 'https://wp.screwnet.in/wp-content/uploads/2026/09/screwnet-hero-banner-2.jpg',
    postId: 531,
    title: 'High Tensile Grade 10.9 & 12.9 Structural Fasteners',
    ctaUrl: '/category/allen-socket-head'
  },
  {
    localFile: 'C:\\Users\\Rohit Sahu\\.gemini\\antigravity-ide\\brain\\5297634d-ad25-44ca-9b67-30dd8a816cd8\\screwnet_hero_banner_3_1789151416778.jpg',
    target: 'wp-content/uploads/2026/09/screwnet-hero-banner-3.jpg',
    publicUrl: 'https://wp.screwnet.in/wp-content/uploads/2026/09/screwnet-hero-banner-3.jpg',
    postId: 532,
    title: 'Precision Industrial Distribution & Pan-India Dispatch',
    ctaUrl: '/shop'
  }
];

async function main() {
  const proc = spawn('npx.cmd', ['--yes', '--package=@hostinger/mcp@latest', 'hostinger-hosting-mcp'], {
    shell: true,
    env: { ...process.env, HOSTINGER_API_TOKEN: 'p8MTYi5h5TkfKL0BY5BPML2IpI0oTBtWBhxF2jz10ece10ab' }
  });

  proc.stderr.on('data', d => console.error('ERR:', d.toString()));

  let buffer = '';
  proc.stdout.on('data', async (chunk) => {
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

          for (const banner of banners) {
            const content = fs.readFileSync(banner.localFile);
            const size = content.length;
            console.log(`Uploading ${banner.target} (${size} bytes)...`);

            const postRes = await fetch(`${creds.url}/${banner.target}?override=true`, {
              method: 'POST',
              headers: {
                'X-Auth': creds.auth_key,
                'X-Auth-Rest': creds.rest_auth_key,
                'Tus-Resumable': '1.0.0',
                'Upload-Length': size.toString(),
                'Upload-Offset': '0'
              }
            });
            console.log(`POST ${banner.target}: ${postRes.status}`);

            const patchRes = await fetch(`${creds.url}/${banner.target}?override=true`, {
              method: 'PATCH',
              headers: {
                'X-Auth': creds.auth_key,
                'X-Auth-Rest': creds.rest_auth_key,
                'Tus-Resumable': '1.0.0',
                'Content-Type': 'application/offset+octet-stream',
                'Upload-Offset': '0'
              },
              body: content
            });
            console.log(`PATCH ${banner.target}: ${patchRes.status}`);
          }

          console.log('All 3 banners uploaded successfully!');
          setTimeout(() => {
            proc.kill();
            process.exit(0);
          }, 1000);
        }
      } catch (e) {}
    }
  });

  proc.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', clientInfo: { name: 'deployer', version: '1.0' }, capabilities: {} },
    id: 1
  }) + '\n');

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
  }, 1000);
}

main().catch(console.error);
