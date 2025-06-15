const input = document.getElementById('image-input');
const preview = document.getElementById('preview');
const predictBtn = document.getElementById('predict-btn');
const result = document.getElementById('result');
let file;
let session;

// Ensure WASM backend loads from relative paths and doesn't require
// cross-origin isolation (GitHub Pages lacks proper headers).
ort.env.wasm.wasmPaths = './';
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

input.addEventListener('change', () => {
  file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      predictBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }
});

async function loadModel() {
  if (!session) {
    result.textContent = 'Downloading model...';
    try {
      const modelUrl = new URL('./squeezenet1_1.onnx', import.meta.url).href;
      session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm']
      });
      result.textContent = 'Model loaded. Click Predict.';
    } catch (e) {
      result.textContent = 'Failed to load model.';
      throw e;
    }
  }
}

predictBtn.addEventListener('click', async () => {
  if (!file) return;
  await loadModel();
  result.textContent = 'Predicting...';
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
  const tensor = new ort.Tensor('float32', inputData, [1, 3, size, size]);
  const output = await session.run({ 'input.1': tensor });
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
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
