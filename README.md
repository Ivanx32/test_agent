# Cat Detector

A simple Progressive Web App that detects cats in images using a lightweight ONNX model running entirely in the browser.

## Usage
Open `frontend/index.html` locally or visit the GitHub Pages site. Upload an image and click **Predict** to see if a cat is detected.

## Development
No backend or Docker is required. The app loads `squeezenet1_1.onnx` with [ONNX Runtime Web](https://onnxruntime.ai/docs/api/js/).

## Deployment
GitHub Actions automatically publishes the `frontend` directory to the `gh-pages` branch.

## Large files
Sample test images and model weights are tracked with Git LFS. If you clone this
repository without LFS files, run `git lfs pull` to fetch them. The test image
dataset is omitted from the repository to keep the pull request lightweight.
