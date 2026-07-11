#!/usr/bin/env tsx
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output, exit } from 'node:process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

interface ProjectConfig {
  name: string;
  title: string;
  description: string;
  version: string;
  port: number;
  type: 'spa' | 'server-only';
  outputDir: string;
  features: {
    pwa: boolean;
    vapid: boolean;
    turnstile: boolean;
    sqlitecipher: boolean;
    smtp: boolean;
    authJwt: boolean;
  };
  runInstall: boolean;
  initGit: boolean;
}

type FeatureKey = keyof ProjectConfig['features'];

type TokenMap = Record<string, string>;

const rl = createInterface({ input, output });
const cwd = process.cwd();
const templateRoot = path.join(cwd, 'template');
const force = process.argv.includes('--force');

const featureOptions: Array<{ key: FeatureKey; label: string; description: string }> = [
  { key: 'pwa', label: 'PWA', description: 'Manifest, service worker, and app version refresh flow.' },
  { key: 'vapid', label: 'VAPID web push', description: 'Push subscription routes, web-push config, and React hook.' },
  { key: 'turnstile', label: 'Cloudflare Turnstile', description: 'CAPTCHA middleware and client widget component.' },
  { key: 'sqlitecipher', label: 'SQLiteCipher', description: 'Encrypted SQLite with migration helper script.' },
  { key: 'smtp', label: 'SMTP mailer', description: 'Queued Nodemailer service with retry support.' },
  { key: 'authJwt', label: 'JWT auth', description: 'Registration, login, me, logout, auth middleware.' },
];

const featureDirectoryNames: Record<FeatureKey, string> = {
  pwa: 'pwa',
  vapid: 'vapid',
  turnstile: 'turnstile',
  sqlitecipher: 'sqlitecipher',
  smtp: 'smtp',
  authJwt: 'auth-jwt',
};

const textExtensions = new Set([
  '.cjs',
  '.css',
  '.env',
  '.example',
  '.gitignore',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.md',
  '.svg',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
]);

process.on('SIGINT', async () => {
  output.write('\nScaffolding cancelled. No further changes were made.\n');
  await rl.close();
  exit(1);
});

function printBanner(): void {
  console.log('');
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│          project-blueprint scaffold          │');
  console.log('└──────────────────────────────────────────────┘');
  console.log('Generate a James JHS project with server, client, and optional features.');
  console.log('');
}

async function ask(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue || '';
}

async function askConfirm(question: string, defaultValue = true): Promise<boolean> {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  while (true) {
    const answer = (await rl.question(`${question} [${hint}]: `)).trim().toLowerCase();
    if (!answer) return defaultValue;
    if (['y', 'yes'].includes(answer)) return true;
    if (['n', 'no'].includes(answer)) return false;
    console.log('Please answer yes or no.');
  }
}

async function askSelect<T extends string>(
  question: string,
  options: Array<{ value: T; label: string; description?: string }>,
): Promise<T> {
  console.log(`\n${question}`);
  options.forEach((option, index) => {
    const description = option.description ? ` — ${option.description}` : '';
    console.log(`  ${index + 1}) ${option.label}${description}`);
  });

  while (true) {
    const answer = (await rl.question('Choose a number: ')).trim();
    const selectedIndex = Number.parseInt(answer, 10) - 1;
    if (Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < options.length) {
      return options[selectedIndex].value;
    }
    console.log(`Please enter a number between 1 and ${options.length}.`);
  }
}

async function askMultiselect<T extends string>(
  question: string,
  options: Array<{ value: T; label: string; description?: string }>,
): Promise<T[]> {
  console.log(`\n${question}`);
  console.log('Press Enter for none, or enter space/comma separated numbers.');
  options.forEach((option, index) => {
    const description = option.description ? ` — ${option.description}` : '';
    console.log(`  [ ] ${index + 1}) ${option.label}${description}`);
  });

  while (true) {
    const answer = (await rl.question('Selections: ')).trim();
    if (!answer) return [];

    const values = answer
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((part) => Number.parseInt(part, 10));

    if (values.every((value) => Number.isInteger(value) && value >= 1 && value <= options.length)) {
      const unique = [...new Set(values)];
      return unique.map((value) => options[value - 1].value);
    }

    console.log(`Please enter valid option numbers between 1 and ${options.length}.`);
  }
}

function isValidKebabCase(name: string): boolean {
  return /^[a-z](?:[a-z0-9-]*[a-z0-9])?$/.test(name);
}

function toTitleCase(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function applyTokens(content: string, tokens: TokenMap): string {
  return Object.entries(tokens)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((result, [token, value]) => result.replace(new RegExp(escapeRegExp(`<<${token}>>`), 'g'), value), content);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function isBinary(filePath: string): Promise<boolean> {
  const extension = path.extname(filePath).toLowerCase();
  if (textExtensions.has(extension) || path.basename(filePath) === '.gitignore') return false;

  const chunk = await fs.readFile(filePath);
  const sample = chunk.subarray(0, 512);
  return sample.includes(0);
}

async function copyDir(src: string, dest: string, tokens: TokenMap): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, tokens);
      continue;
    }

    if (entry.isSymbolicLink()) {
      const linkTarget = await fs.readlink(srcPath);
      await fs.symlink(linkTarget, destPath);
      continue;
    }

    if (await isBinary(srcPath)) {
      await fs.copyFile(srcPath, destPath);
      continue;
    }

    const content = await fs.readFile(srcPath, 'utf8');
    await fs.writeFile(destPath, applyTokens(content, tokens), 'utf8');
  }
}

function generateEnvExample(config: ProjectConfig): string {
  const lines = [
    `PORT=${config.port}`,
    'NODE_ENV=development',
    'JWT_SECRET=change-me-before-deploy',
    'DB_PATH=./data/app.db',
    'BASE_URL=https://your-domain.example.com',
  ];

  if (config.features.sqlitecipher) {
    lines.push('DB_ENCRYPTION_KEY=change-this-encryption-key');
  }
  if (config.features.vapid) {
    lines.push('', 'VAPID_PUBLIC_KEY=', 'VAPID_PRIVATE_KEY=', 'VAPID_SUBJECT=mailto:you@example.com');
  }
  if (config.features.turnstile) {
    lines.push('', 'TURNSTILE_SITE_KEY=', 'TURNSTILE_SECRET_KEY=');
  }
  if (config.features.smtp) {
    lines.push(
      '',
      'SMTP_HOST=',
      'SMTP_PORT=587',
      'SMTP_SECURE=false',
      'SMTP_USER=',
      'SMTP_PASS=',
      'SMTP_FROM=',
    );
  }

  return `${lines.join('\n')}\n`;
}

function generateRootPackageJson(config: ProjectConfig): string {
  const scripts =
    config.type === 'spa'
      ? {
          'install:all': 'npm install && npm --prefix server install && npm --prefix client install',
          'dev:server': 'npm --prefix server run dev',
          'dev:client': 'npm --prefix client run dev',
          build: 'npm --prefix server run build && npm --prefix client run build',
          start: 'npm --prefix server run start',
        }
      : {
          'install:all': 'npm install && npm --prefix server install',
          dev: 'npm --prefix server run dev',
          build: 'npm --prefix server run build',
          start: 'npm --prefix server run start',
        };

  const packageJson = {
    name: config.name,
    version: config.version,
    private: true,
    description: config.description,
    scripts,
    engines: {
      node: '>=20.0.0',
    },
  };

  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

async function patchServerPackageJson(outputDir: string, config: ProjectConfig): Promise<void> {
  const filePath = path.join(outputDir, 'server', 'package.json');
  const packageJson = JSON.parse(await fs.readFile(filePath, 'utf8')) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  if (config.features.vapid) {
    packageJson.dependencies['web-push'] = '^3.6.7';
    packageJson.devDependencies['@types/web-push'] = '^3.6.4';
  }

  await fs.writeFile(filePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
}

async function patchServerIndex(outputDir: string, config: ProjectConfig): Promise<void> {
  const filePath = path.join(outputDir, 'server', 'src', 'index.ts');
  let content = await fs.readFile(filePath, 'utf8');

  const importLines: string[] = [];
  const initLines: string[] = [];
  const routeLines: string[] = [];

  if (config.features.vapid) {
    importLines.push("import { configureWebPush } from './webpush-config';");
    importLines.push("import pushRouter from './routes/push';");
    initLines.push('configureWebPush();');
    routeLines.push("app.use('/api/push', pushRouter);");
  }

  if (config.features.authJwt) {
    importLines.push("import authRouter from './routes/auth';");
    routeLines.push("app.use('/api/auth', authRouter);");
  }

  let staticBlock = '';
  if (config.type === 'server-only') {
    staticBlock = [
      "const publicDir = path.join(__dirname, '..', '..', 'public');",
      'app.use(express.static(publicDir));',
      '',
      "app.get('*', (req, res, next) => {",
      "  if (req.path.startsWith('/api')) {",
      '    next();',
      '    return;',
      '  }',
      '',
      "  res.sendFile(path.join(publicDir, 'index.html'));",
      '});',
    ].join('\n');
  }

  let pwaRoute = '';
  if (config.features.pwa && config.type === 'server-only') {
    pwaRoute = [
      "app.get('/sw.js', (_req, res) => {",
      "  res.type('application/javascript');",
      "  res.sendFile(path.join(publicDir, 'sw.js'));",
      '});',
      '',
      "app.get('/manifest.json', (_req, res) => {",
      "  res.type('application/manifest+json');",
      "  res.sendFile(path.join(publicDir, 'manifest.json'));",
      '});',
    ].join('\n');
  }

  content = content.replace('// <<FEATURE_IMPORTS>>', importLines.join('\n'));
  content = content.replace('// <<FEATURE_INIT>>', initLines.join('\n'));
  content = content.replace('// <<FEATURE_ROUTES>>', routeLines.join('\n'));
  content = content.replace('// <<SERVER_ONLY_STATIC>>', staticBlock);
  content = content.replace('// <<PWA_SW_ROUTE>>', pwaRoute);

  await fs.writeFile(filePath, content, 'utf8');
}

async function patchServerConfig(outputDir: string, config: ProjectConfig): Promise<void> {
  const filePath = path.join(outputDir, 'server', 'src', 'config.ts');
  let content = await fs.readFile(filePath, 'utf8');

  const helpers: string[] = [];
  if (config.features.vapid) {
    helpers.push('export const VAPID_ENABLED = Boolean(VAPID.publicKey && VAPID.privateKey);');
  }
  if (config.features.turnstile) {
    helpers.push('export const TURNSTILE_ENABLED = Boolean(TURNSTILE_SECRET_KEY);');
  }
  if (config.features.smtp) {
    helpers.push('export const SMTP_ENABLED = Boolean(SMTP_HOST && SMTP_FROM);');
  }
  if (config.features.authJwt) {
    helpers.push('export const AUTH_ENABLED = true;');
  }

  content = content.replace('// <<FEATURE_CONFIG_EXPORTS>>', helpers.join('\n'));
  await fs.writeFile(filePath, content, 'utf8');
}

async function patchClientMain(outputDir: string, config: ProjectConfig): Promise<void> {
  if (config.type !== 'spa') return;

  const filePath = path.join(outputDir, 'client', 'src', 'main.tsx');
  let content = await fs.readFile(filePath, 'utf8');

  const registration = config.features.pwa
    ? [
        "if ('serviceWorker' in navigator) {",
        "  window.addEventListener('load', () => {",
        "    navigator.serviceWorker.register('/sw.js').catch((error) => {",
        "      console.error('Service worker registration failed', error);",
        '    });',
        '  });',
        '}',
      ].join('\n')
    : '';

  content = content.replace('// <<PWA_REGISTRATION>>', registration);
  await fs.writeFile(filePath, content, 'utf8');
}

async function patchClientPackageJson(outputDir: string, config: ProjectConfig): Promise<void> {
  if (config.type !== 'spa') return;

  const filePath = path.join(outputDir, 'client', 'package.json');
  const packageJson = JSON.parse(await fs.readFile(filePath, 'utf8')) as { scripts: Record<string, string> };

  if (config.features.pwa) {
    packageJson.scripts.preview = 'vite preview';
  }

  await fs.writeFile(filePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
}

async function ensureOutputDirectory(outputDir: string): Promise<void> {
  const exists = await fs
    .access(outputDir)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    await fs.mkdir(outputDir, { recursive: true });
    return;
  }

  const children = await fs.readdir(outputDir).catch(() => []);
  if (children.length === 0) return;

  if (!force) {
    throw new Error(`Output directory already exists: ${outputDir}. Re-run with --force to overwrite.`);
  }

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
}

async function copyFeature(outputDir: string, feature: FeatureKey, config: ProjectConfig, tokens: TokenMap): Promise<void> {
  const featureRoot = path.join(templateRoot, 'features', featureDirectoryNames[feature]);
  const exists = await fs
    .access(featureRoot)
    .then(() => true)
    .catch(() => false);

  if (!exists) return;

  if (feature === 'pwa') {
    const source = path.join(featureRoot, 'public');
    const destination =
      config.type === 'spa'
        ? path.join(outputDir, 'client', 'public')
        : path.join(outputDir, 'public');
    await copyDir(source, destination, tokens);
    return;
  }

  await copyDir(featureRoot, outputDir, tokens);
}

async function runInstall(outputDir: string, config: ProjectConfig): Promise<void> {
  const commands = [
    { cwd: outputDir, label: 'root' },
    { cwd: path.join(outputDir, 'server'), label: 'server' },
  ];

  if (config.type === 'spa') {
    commands.push({ cwd: path.join(outputDir, 'client'), label: 'client' });
  }

  for (const command of commands) {
    console.log(`\nInstalling dependencies in ${command.label}...`);
    execSync('npm install', { cwd: command.cwd, stdio: 'inherit' });
  }
}

async function initGitRepository(outputDir: string): Promise<void> {
  try {
    execSync('git init', { cwd: outputDir, stdio: 'inherit' });
    execSync('git add -A', { cwd: outputDir, stdio: 'inherit' });
    execSync('git commit -m "chore: initial scaffold"', { cwd: outputDir, stdio: 'inherit' });
  } catch (error) {
    console.warn('\nGit initialization completed with warnings. You may need to configure git user.name/user.email before committing.');
    if (error instanceof Error) {
      console.warn(error.message);
    }
  }
}

function featureList(config: ProjectConfig): string[] {
  return Object.entries(config.features)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
}

function printSuccess(config: ProjectConfig): void {
  const features = featureList(config);
  console.log('\n✅ Scaffold complete!');
  console.log(`\nProject:      ${config.title} (${config.name})`);
  console.log(`Type:         ${config.type}`);
  console.log(`Port:         ${config.port}`);
  console.log(`Output:       ${config.outputDir}`);
  console.log(`Features:     ${features.length ? features.join(', ') : 'none'}`);
  console.log(`npm install:  ${config.runInstall ? 'completed' : 'skipped'}`);
  console.log(`git init:     ${config.initGit ? 'completed/requested' : 'skipped'}`);

  console.log('\nNext steps:');
  console.log(`  cd ${config.outputDir}`);
  if (!config.runInstall) {
    console.log(`  npm run install:all`);
  }
  console.log('  cp .env.example .env');
  console.log('  update secrets and deployment values');
  console.log(config.type === 'spa' ? '  npm run dev:server  # in one terminal' : '  npm run dev');
  if (config.type === 'spa') {
    console.log('  npm run dev:client  # in another terminal');
  }
}

async function gatherConfig(): Promise<ProjectConfig> {
  printBanner();

  let name = '';
  while (!isValidKebabCase(name)) {
    name = await ask('Project name', 'my-app');
    if (!isValidKebabCase(name)) {
      console.log('Use kebab-case: lowercase letters, numbers, and hyphens only, starting with a letter.');
    }
  }

  const defaultTitle = toTitleCase(name);
  const title = await ask('Project title', defaultTitle);
  const description = await ask('Project description', `${defaultTitle} application`);
  const version = await ask('Initial project version', '0.1.0');

  let port = 3000;
  while (true) {
    const value = await ask('Server port', '3000');
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
      port = parsed;
      break;
    }
    console.log('Please enter a valid TCP port between 1 and 65535.');
  }

  const type = await askSelect('Project type', [
    { value: 'spa', label: 'SPA', description: 'React + Vite client with Express server API.' },
    { value: 'server-only', label: 'Server-only', description: 'Express app with static HTML or API only.' },
  ]);

  const selectedFeatures = await askMultiselect(
    'Optional features',
    featureOptions.map((feature) => ({
      value: feature.key,
      label: feature.label,
      description: feature.description,
    })),
  );

  const defaultOutputDir = path.resolve(cwd, '..', name);
  const outputDir = path.resolve(await ask('Output directory', defaultOutputDir));
  const runInstall = await askConfirm('Run npm install after scaffolding?', true);
  const initGit = await askConfirm('Initialize a new git repository?', true);

  const features: ProjectConfig['features'] = {
    pwa: selectedFeatures.includes('pwa'),
    vapid: selectedFeatures.includes('vapid'),
    turnstile: selectedFeatures.includes('turnstile'),
    sqlitecipher: selectedFeatures.includes('sqlitecipher'),
    smtp: selectedFeatures.includes('smtp'),
    authJwt: selectedFeatures.includes('authJwt'),
  };

  return {
    name,
    title,
    description,
    version,
    port,
    type,
    outputDir,
    features,
    runInstall,
    initGit,
  };
}

async function scaffoldProject(config: ProjectConfig): Promise<void> {
  const tokens: TokenMap = {
    PROJECT_NAME: config.name,
    PROJECT_TITLE: config.title,
    PROJECT_DESCRIPTION: config.description,
    PROJECT_VERSION: config.version,
    PORT: String(config.port),
    YEAR: String(new Date().getFullYear()),
    PROJECT_TYPE: config.type,
  };

  await ensureOutputDirectory(config.outputDir);

  const baseDir = path.join(templateRoot, 'base');
  const serverDir = path.join(templateRoot, 'server');
  const clientDir = path.join(templateRoot, 'client');

  await copyDir(baseDir, config.outputDir, tokens);
  await copyDir(serverDir, path.join(config.outputDir, 'server'), tokens);

  if (config.type === 'spa') {
    await copyDir(clientDir, path.join(config.outputDir, 'client'), tokens);
  }

  for (const feature of featureList(config) as FeatureKey[]) {
    await copyFeature(config.outputDir, feature, config, tokens);
  }

  await fs.writeFile(path.join(config.outputDir, 'package.json'), generateRootPackageJson(config), 'utf8');
  await fs.writeFile(path.join(config.outputDir, '.env.example'), generateEnvExample(config), 'utf8');

  await patchServerPackageJson(config.outputDir, config);
  await patchServerIndex(config.outputDir, config);
  await patchServerConfig(config.outputDir, config);
  await patchClientMain(config.outputDir, config);
  await patchClientPackageJson(config.outputDir, config);

  if (config.runInstall) {
    await runInstall(config.outputDir, config);
  }

  if (config.initGit) {
    await initGitRepository(config.outputDir);
  }

  printSuccess(config);
}

async function main(): Promise<void> {
  try {
    const config = await gatherConfig();
    await scaffoldProject(config);
  } finally {
    await rl.close();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n❌ ${message}`);
  exit(1);
});
