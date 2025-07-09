import numpy as np
import argparse
import cv2
import os
import sys

# Parse command line arguments
ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", type=str, required=True,
                help="Path to the input black and white image")
ap.add_argument("-o", "--output", type=str, required=True,
                help="Path to save the colorized output image")
ap.add_argument("-m", "--models", type=str, required=True,
                help="Path to the models directory")
args = vars(ap.parse_args())

# Set up model paths based on the provided models directory
MODELS_DIR = args["models"]
PROTOTXT = os.path.join(MODELS_DIR, "colorization_deploy_v2.prototxt")
POINTS = os.path.join(MODELS_DIR, "pts_in_hull.npy")
MODEL = os.path.join(MODELS_DIR, "colorization_release_v2.caffemodel")

# Check if the required files exist
if not os.path.exists(PROTOTXT):
    print(f"Error: File not found: {PROTOTXT}")
    sys.exit(1)

if not os.path.exists(MODEL):
    print(f"Error: File not found: {MODEL}")
    sys.exit(1)

if not os.path.exists(POINTS):
    print(f"Error: File not found: {POINTS}")
    sys.exit(1)

# Load the model
print("Loading model...")
net = cv2.dnn.readNetFromCaffe(PROTOTXT, MODEL)
pts = np.load(POINTS)

# Configure the network with cluster centers and priors
class8 = net.getLayerId("class8_ab")
conv8 = net.getLayerId("conv8_313_rh")
pts = pts.transpose().reshape(2, 313, 1, 1)
net.getLayer(class8).blobs = [pts.astype("float32")]
net.getLayer(conv8).blobs = [np.full([1, 313], 2.606, dtype="float32")]

# Read and process the input image
image = cv2.imread(args["image"])
if image is None:
    print(f"Error: Could not read image at path {args['image']}")
    sys.exit(1)

# Check if image is already colored or grayscale
if len(image.shape) == 3 and image.shape[2] == 3:
    # Convert to grayscale if it's a color image
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Convert back to 3-channel format (but still grayscale)
    image = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

scaled = image.astype("float32") / 255.0
lab = cv2.cvtColor(scaled, cv2.COLOR_BGR2LAB)

resized = cv2.resize(lab, (224, 224))
L = cv2.split(resized)[0]
L -= 50

# Colorize the image
print("Colorizing image...")
net.setInput(cv2.dnn.blobFromImage(L))
ab = net.forward()[0, :, :, :].transpose((1, 2, 0))

ab = cv2.resize(ab, (image.shape[1], image.shape[0]))
L = cv2.split(lab)[0]
colorized = np.concatenate((L[:, :, np.newaxis], ab), axis=2)

colorized = cv2.cvtColor(colorized, cv2.COLOR_LAB2BGR)
colorized = np.clip(colorized, 0, 1)
colorized = (255 * colorized).astype("uint8")

# Save the colorized image
cv2.imwrite(args["output"], colorized)
print(f"Colorized image saved to {args['output']}")