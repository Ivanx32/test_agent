import os
import numpy as np
from PIL import Image
import onnxruntime as ort

MODEL_PATH = 'frontend/squeezenet1_1.onnx'
CLASSES_URL = 'https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt'

# Load class labels
import urllib.request
with urllib.request.urlopen(CLASSES_URL) as f:
    classes = [line.decode('utf-8').strip() for line in f.readlines()]

cat_idx = list(range(281, 286))  # tabby to Egyptian cat inclusive
# dog classes from 151 to 268 inclusive
dog_idx = list(range(151, 269))

session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
input_name = session.get_inputs()[0].name

def preprocess(img: Image.Image) -> np.ndarray:
    img = img.resize((224, 224))
    arr = np.array(img).astype('float32') / 255.0
    arr = (arr - np.array([0.485, 0.456, 0.406], dtype=np.float32)) / np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = arr.transpose(2, 0, 1)  # HWC -> CHW
    return arr[np.newaxis, :]

def predict(img_path):
    img = Image.open(img_path).convert('RGB')
    x = preprocess(img)
    outputs = session.run(None, {input_name: x})
    probs = np.exp(outputs[0]) / np.exp(outputs[0]).sum(axis=1, keepdims=True)
    idx = probs.argmax(axis=1)[0]
    return idx, probs[0, idx]

def eval_dir(dir_path, target_idx_set):
    correct = 0
    total = 0
    for filename in os.listdir(dir_path):
        if filename.lower().endswith(('.jpg', '.jpeg')):
            total += 1
            idx, conf = predict(os.path.join(dir_path, filename))
            if idx in target_idx_set:
                correct += 1
    return correct, total

if __name__ == '__main__':
    # Use the sample images packaged in the repository for testing. The
    # directories mirror the ones from Ivanx32/test_agent on GitHub.
    cat_correct, cat_total = eval_dir('test_data/cats', set(cat_idx))
    dog_correct, dog_total = eval_dir('test_data/dogs', set(dog_idx))
    total_correct = cat_correct + dog_correct
    total = cat_total + dog_total
    acc = total_correct / total if total else 0
    print(f'Cat accuracy: {cat_correct}/{cat_total}')
    print(f'Dog accuracy: {dog_correct}/{dog_total}')
    print(f'Total accuracy: {acc*100:.1f}%')
    if acc < 0.7:
        print('WARNING: accuracy below 70%')
