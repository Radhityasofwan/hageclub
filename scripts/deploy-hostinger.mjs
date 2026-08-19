/**
 * Deploy ke Hostinger Node.js hosting via TUS upload + build API.
 * Usage: node scripts/deploy-hostinger.mjs <archive-path>
 * Env vars required: HOSTINGER_API_TOKEN
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const axios = require('./node_modules/axios/index.js');
const tus = require('./node_modules/tus-js-client/lib/node/index.js');

const HTOKEN = process.env.HOSTINGER_API_TOKEN;
const HUSER = 'u830768701';
const HDOMAIN = 'hageclub.com';
const BASE_URL = 'https://developers.hostinger.com/';
const ARCHIVE_PATH = process.argv[2] || path.join(process.cwd(), 'hageclub-src.zip');

if (!HTOKEN) {
  console.error('[FATAL] HOSTINGER_API_TOKEN env var not set');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${HTOKEN}`,
  'Content-Type': 'application/json',
  'User-Agent': 'hageclub-deploy/1.0',
};

function log(level, msg, data) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level.toUpperCase()}] ${msg}`, data ? JSON.stringify(data) : '');
}

async function fetchUploadCredentials() {
  const resp = await axios.default.post(
    `${BASE_URL}api/hosting/v1/files/upload-urls`,
    { username: HUSER, domain: HDOMAIN },
    { headers, timeout: 60000, validateStatus: s => s < 500 }
  );
  if (resp.status !== 200) throw new Error(`Upload credentials failed: ${JSON.stringify(resp.data)}`);
  log('info', 'Upload credentials obtained');
  return resp.data;
}

async function uploadFile(filePath, uploadUrl, authRestToken, authToken) {
  return new Promise(async (resolve, reject) => {
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    const filename = path.basename(filePath);
    const cleanUrl = uploadUrl.replace(/\/$/, '');
    const uploadUrlWithFile = `${cleanUrl}/${filename}?override=true`;

    const reqHeaders = {
      'X-Auth': authToken,
      'X-Auth-Rest': authRestToken,
      'upload-length': stats.size.toString(),
      'upload-offset': '0',
    };

    log('info', `Pre-upload POST (${Math.round(stats.size / 1024 / 1024)}MB)`);
    try {
      await axios.default.post(uploadUrlWithFile, '', {
        headers: reqHeaders, timeout: 60000, validateStatus: s => s === 201,
      });
      log('info', 'Pre-upload slot created (201)');
    } catch (err) {
      reject(new Error(`Pre-upload failed (${err.response?.status}): ${JSON.stringify(err.response?.data) || err.message}`));
      return;
    }

    log('info', 'Starting TUS chunked upload...');
    const upload = new tus.Upload(fileStream, {
      uploadUrl: uploadUrlWithFile,
      retryDelays: [1000, 2000, 4000, 8000],
      uploadDataDuringCreation: false,
      parallelUploads: 1,
      chunkSize: 10485760,
      headers: reqHeaders,
      removeFingerprintOnSuccess: true,
      uploadSize: stats.size,
      metadata: { filename },
      onProgress: (uploaded, total) => {
        const pct = Math.round(uploaded / total * 100);
        process.stdout.write(`\r  Upload: ${pct}% (${Math.round(uploaded/1024/1024)}/${Math.round(total/1024/1024)}MB)`);
      },
      onError: err => { console.log(); reject(new Error(`TUS upload failed: ${err.message}`)); },
      onSuccess: () => { console.log(); log('info', `Upload complete: ${filename}`); resolve({ filename }); },
    });
    upload.start();
  });
}

async function fetchBuildSettings() {
  const archiveName = path.basename(ARCHIVE_PATH);
  const url = `${BASE_URL}api/hosting/v1/accounts/${HUSER}/websites/${HDOMAIN}/nodejs/builds/settings/from-archive?archive_path=${encodeURIComponent(archiveName)}`;
  const resp = await axios.default.get(url, { headers, timeout: 60000, validateStatus: s => s < 500 });
  if (resp.status !== 200) { log('warn', `Build settings fetch failed (${resp.status})`); return null; }
  log('info', 'Auto-detected build settings:', resp.data);
  return resp.data;
}

async function triggerBuild(buildSettings) {
  const url = `${BASE_URL}api/hosting/v1/accounts/${HUSER}/websites/${HDOMAIN}/nodejs/builds`;
  const buildData = {
    ...(buildSettings || {}),
    node_version: 22,
    build_command: 'npm install && npx prisma generate && npx prisma migrate deploy && npm run build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public',
    start_command: 'UPLOAD_DIR=/home/u830768701/domains/hageclub.com/uploads node .next/standalone/server.js',
    source_type: 'archive',
    source_options: { archive_path: path.basename(ARCHIVE_PATH) },
  };
  log('info', 'Triggering build...');
  const resp = await axios.default.post(url, buildData, { headers, timeout: 60000, validateStatus: s => s < 500 });
  if (resp.status !== 200 && resp.status !== 201) throw new Error(`Build trigger failed (${resp.status}): ${JSON.stringify(resp.data)}`);
  log('info', 'Build triggered:', resp.data);
  return resp.data;
}

async function pollBuildStatus(buildUuid) {
  const url = `${BASE_URL}api/hosting/v1/accounts/${HUSER}/websites/${HDOMAIN}/nodejs/builds`;
  log('info', `Polling build ${buildUuid} (max 15min)...`);
  for (let i = 0; i < 90; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const resp = await axios.default.get(url, { headers, timeout: 30000, validateStatus: s => s < 500 });
    if (resp.status !== 200) continue;
    const builds = resp.data?.data || resp.data || [];
    const build = builds.find(b => b.uuid === buildUuid);
    if (!build) { log('warn', 'Build not found yet...'); continue; }
    const state = build.state || build.status;
    log('info', `Build state: ${state}`);
    if (state === 'completed' || state === 'success') { log('info', 'Build SUCCESSFUL!'); return true; }
    if (state === 'failed' || state === 'error') { log('error', 'Build FAILED'); return false; }
  }
  log('warn', 'Build poll timeout (15min). Check hPanel.');
  return null;
}

(async () => {
  try {
    log('info', `=== Deploy hageclub.com ===`);
    log('info', `Archive: ${ARCHIVE_PATH}`);
    if (!fs.existsSync(ARCHIVE_PATH)) throw new Error(`Archive not found: ${ARCHIVE_PATH}`);

    const creds = await fetchUploadCredentials();
    const { url: uploadUrl, auth_key: authToken, rest_auth_key: authRestToken } = creds;
    if (!uploadUrl || !authToken || !authRestToken) throw new Error(`Invalid credentials: ${JSON.stringify(creds)}`);

    await uploadFile(ARCHIVE_PATH, uploadUrl, authRestToken, authToken);

    const buildSettings = await fetchBuildSettings();
    const buildResult = await triggerBuild(buildSettings);
    const buildUuid = buildResult?.uuid || buildResult?.data?.uuid;
    log('info', `Build UUID: ${buildUuid}`);

    if (buildUuid) {
      const ok = await pollBuildStatus(buildUuid);
      if (ok === false) process.exit(1);
    }

    log('info', `=== Deployment complete — https://hageclub.com ===`);
  } catch (err) {
    console.error('\n[FATAL]', err.message);
    process.exit(1);
  }
})();
