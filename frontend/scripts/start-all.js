const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const nodeCommand = isWindows ? 'node.exe' : 'node';

const services = [
  {
    name: 'auth-service',
    cwd: path.join(projectRoot, 'microservices', 'auth-service'),
    command: npmCommand,
    args: ['start'],
    env: {
      MONGO_URI: 'mongodb://localhost/eventrent-auth',
      JWT_SECRET: 'secret',
    },
  },
  {
    name: 'event-service',
    cwd: path.join(projectRoot, 'microservices', 'event-service'),
    command: npmCommand,
    args: ['start'],
    env: {
      MONGO_URI: 'mongodb://localhost/events',
      JWT_SECRET: 'secret',
    },
  },
  {
    name: 'traiteur-service',
    cwd: path.join(projectRoot, 'microservices', 'traiteur-service'),
    command: npmCommand,
    args: ['start'],
    env: {
      MONGO_URI: 'mongodb://localhost/eventrent-traiteurs',
      JWT_SECRET: 'secret',
    },
  },
  {
    name: 'reservation-service',
    cwd: path.join(projectRoot, 'microservices', 'reservation-service'),
    command: npmCommand,
    args: ['start'],
    env: {
      MONGO_URI: 'mongodb://localhost/eventrent-reservations',
      JWT_SECRET: 'secret',
    },
  },
  {
    name: 'notification-service',
    cwd: path.join(projectRoot, 'microservices', 'notification-service'),
    command: npmCommand,
    args: ['start'],
    env: {
      MONGO_URI: 'mongodb://localhost/eventrent-notifications',
      JWT_SECRET: 'secret',
    },
  },
  {
    name: 'view-service',
    cwd: path.join(projectRoot, 'microservices', 'view-service'),
    command: npmCommand,
    args: ['start'],
    env: {
      JWT_SECRET: 'secret',
    },
  },
  {
    name: 'api-gateway',
    cwd: path.join(projectRoot, 'microservices', 'api-gateway'),
    command: nodeCommand,
    args: ['index.js'],
    env: {},
  },
  {
    name: 'frontend',
    cwd: path.join(projectRoot, 'frontend'),
    command: npmCommand,
    args: ['run', 'start:frontend'],
    env: {},
  },
];

const children = [];
let isShuttingDown = false;

const prefixOutput = (stream, prefix, writer) => {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();

    for (const line of lines) {
      if (line.trim()) {
        writer(`[${prefix}] ${line}\n`);
      }
    }
  });

  stream.on('end', () => {
    if (buffer.trim()) {
      writer(`[${prefix}] ${buffer}\n`);
    }
  });
};

const shutdown = () => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log('\nStopping all services...');

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};

for (const service of services) {
  console.log(`Starting ${service.name}...`);

  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    env: { ...process.env, ...service.env },
    shell: false,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  children.push(child);
  prefixOutput(child.stdout, service.name, process.stdout.write.bind(process.stdout));
  prefixOutput(child.stderr, service.name, process.stderr.write.bind(process.stderr));

  child.on('error', (error) => {
    console.error(`[${service.name}] failed to start: ${error.message}`);
  });

  child.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`[${service.name}] exited with code ${code}`);
    }
  });
}

console.log('All services were launched. Press Ctrl + C to stop everything.');
console.log('Frontend URL: http://localhost:3001');
console.log('API Gateway URL: http://localhost:3000');

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
