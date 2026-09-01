import { spawn } from 'node:child_process';

const steps = [
  {
    label: '🔄 Sincronizando com o Medium RSS',
    command: 'npm',
    args: ['run', 'prebuild'],
  },
  {
    label: '🔨 Gerando aplicação',
    command: 'npm',
    args: ['run', 'build'],
  },
  {
    label: '📦 Publicando no S3',
    command: 'aws',
    args: [
      's3',
      'sync',
      './dist/anzolin-portfolio/browser',
      's3://anzolin.dev.br-424999961344-us-east-2-an',
      '--delete',
      '--profile=jr-prod',
      '--only-show-errors',
    ],
  },
  {
    label: '☁️ Invalidando cache do CloudFront',
    command: 'aws',
    args: [
      'cloudfront',
      'create-invalidation',
      '--distribution-id',
      'EDI2RYOVGN5PD',
      '--paths',
      '/*',
      '--profile=jr-prod',
    ],
  },
];

const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function runStep({ label, command, args }) {
  return new Promise((resolve, reject) => {
    let frameIndex = 0;

    process.stdout.write(`${frames[frameIndex]} ${label}`);

    const spinner = setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;

      process.stdout.write('\r');
      process.stdout.write(`${frames[frameIndex]} ${label}`);
    }, 80);

    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
    });

    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearInterval(spinner);
      process.stdout.write('\r');

      if (code !== 0) {
        process.stdout.write(`❌ ${label}\n`);

        if (stderr) {
          process.stderr.write(stderr);
        }

        reject(new Error(`${command} exited with code ${code}`));
        return;
      }

      process.stdout.write(`✅ ${label}\n`);
      resolve();
    });
  });
}

try {
  for (const step of steps) {
    await runStep(step);
  }

  console.log('\n🚀 Deploy concluído com sucesso!');
} catch {
  console.error('\n❌ Deploy interrompido.');
  process.exit(1);
}
