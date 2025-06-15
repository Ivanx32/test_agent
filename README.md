# Cat Detector

A simple Progressive Web App that detects cats in images using a lightweight ONNX model running entirely in the browser.

## Usage
Open `frontend/index.html` locally or visit the GitHub Pages site. Upload an image and click **Predict** to see if a cat is detected.

## Development
No backend or Docker is required. The app loads `squeezenet1_1.onnx` with [ONNX Runtime Web](https://onnxruntime.ai/docs/api/js/).

## Deployment
GitHub Actions automatically publishes the `frontend` directory to the `gh-pages` branch.

## Large files
Sample test images are tracked with Git LFS. The model weights are stored
directly in the repository, so additional commands are not required to run the
web application. The test image dataset is omitted from the repository to keep
the pull request lightweight.
