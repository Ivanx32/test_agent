const input = document.getElementById('image-input');
const preview = document.getElementById('preview');
const predictBtn = document.getElementById('predict-btn');
const result = document.getElementById('result');
const logEl = document.getElementById('log');
const spinner = document.getElementById('spinner');

document.getElementById('copy-log-btn').addEventListener('click', async e => {
  await navigator.clipboard.writeText(logEl.textContent);
  const btn = e.currentTarget;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy log', 1200);
});

["gesturestart","gesturechange"].forEach(evt =>
  window.addEventListener(evt, e => e.preventDefault(), {passive:false}));

log(`Standalone mode: ${window.navigator.standalone ? 'yes' : 'no'}`);

function log(message) {
  logEl.textContent += message + '\n';
  logEl.scrollTop = logEl.scrollHeight;
  console.log(message);
}
let file;
let session;


// Load WASM backend from CDN. Configure multi-threading
// only when SharedArrayBuffer is available (GitHub Pages lacks the required
// cross-origin headers).
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
if (typeof SharedArrayBuffer === 'undefined' || !crossOriginIsolated) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
}


input.addEventListener('change', () => {
  file = input.files[0];
  if (file) {
    log(`Selected file: ${file.name}`);
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      preview.scrollIntoView({behavior:'smooth', block:'center'});
      predictBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }
});

async function loadModel() {
  if (!session) {
    log('Downloading model...');
    result.textContent = 'Downloading model...';
    try {
      const modelUrl = new URL('./squeezenet1_1.onnx', import.meta.url).href;
      session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm']
      });
      result.textContent = 'Model loaded. Click Predict.';
      log('Model loaded');
      log('Inputs: ' + session.inputNames.join(', '));
      log('Outputs: ' + session.outputNames.join(', '));
    } catch (e) {
      result.textContent = 'Failed to load model.';
      log('Failed to load model: ' + e);
      throw e;
    }
  }
  else {
    log('Model already loaded');
  }
}

predictBtn.addEventListener('click', async () => {
  if (!file) return;
  if ('vibrate' in navigator) navigator.vibrate(10);
  spinner.style.display = 'block';
  log('Starting prediction');
  await loadModel();
  const size = 224;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(preview, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const inputData = new Float32Array(3 * size * size);
  for (let i = 0; i < size * size; i++) {
    inputData[i] = (data[i * 4] / 255 - 0.485) / 0.229;
    inputData[i + size * size] = (data[i * 4 + 1] / 255 - 0.456) / 0.224;
    inputData[i + 2 * size * size] = (data[i * 4 + 2] / 255 - 0.406) / 0.225;
  }
  log('Image normalized');
  const tensor = new ort.Tensor('float32', inputData, [1, 3, size, size]);
  log('Created tensor');
  log('Running inference');
  let output;
  try {
    output = await session.run({ [session.inputNames[0]]: tensor });
  } catch (e) {
    log('Inference failed: ' + e);
    result.textContent = 'Inference error';
    spinner.style.display = 'none';
    throw e;
  }
  const scores = output[session.outputNames[0]].data;
  const exps = scores.map(Math.exp);
  const sumExp = exps.reduce((a, b) => a + b, 0);
  const catIndices = [281, 282, 283, 284, 285];
  let catProb = 0;
  for (const idx of catIndices) catProb += exps[idx];
  catProb /= sumExp;
  result.textContent = catProb > 0.5
    ? `Cat detected (conf ${catProb.toFixed(2)})`
    : `No cat detected (conf ${catProb.toFixed(2)})`;
  spinner.style.display = 'none';
  log(`Prediction done. Cat probability: ${catProb.toFixed(4)}`);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(() => {
      log('Service worker registered');
    }).catch(e => {
      log('Service worker registration failed: ' + e);
    });
  });
}

/* ===== ORIENTATION-FIX  ====================================== */
const wrapper = document.getElementById('root-rotate-wrapper');

function applyOrientation(){
  const angle = screen.orientation?.angle ?? window.orientation ?? 0;

  switch (angle) {
    case 90:   // landscape-RIGHT (Home-button right)
      wrapper.style.transform = 'rotate(-90deg) translateX(-100dvh)';
      break;
    case -90:
    case 270:  // landscape-LEFT
      wrapper.style.transform = 'rotate(90deg) translateY(-100dvh)';
      break;
    default:   // portrait orientations
      wrapper.style.transform = '';
  }
}
applyOrientation();
window.addEventListener('orientationchange', applyOrientation);
window.addEventListener('resize', applyOrientation);
screen.orientation?.lock?.('portrait').catch(()=>{});
/* ===== END ORIENTATION-FIX =================================== */
