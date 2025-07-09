// DOM Elements
const darkModeToggle = document.getElementById("dark-mode-toggle");
const dropArea = document.getElementById("drop-area");
const imageInput = document.getElementById("image-input");
const selectImageBtn = document.getElementById("select-image-btn");
const colorizeBtn = document.getElementById("colorize-btn");
const selectedFileName = document.getElementById("selected-file-name");
const uploadSection = document.getElementById("upload-section");
const processingSection = document.getElementById("processing-section");
const resultsSection = document.getElementById("results-section");
const originalImage = document.getElementById("original-image");
const colorizedImage = document.getElementById("colorized-image");
const sliderOriginal = document.getElementById("slider-original");
const sliderColorized = document.getElementById("slider-colorized");
const downloadBtn = document.getElementById("download-btn");
const tryAnotherBtn = document.getElementById("try-another-btn");
const errorMessage = document.getElementById("error-message");
const sideBySideBtn = document.getElementById("side-by-side-btn");
const sliderBtn = document.getElementById("slider-btn");
const sideBySideView = document.getElementById("side-by-side-view");
const sliderView = document.getElementById("slider-view");
const comparisonContainer = document.getElementById("comparison-container");
const sliderHandle = document.querySelector(".slider-handle");
const sliderResize = document.querySelector(".slider-resize");

// Check for saved theme preference
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
  darkModeToggle.checked = true;
}

// Theme Toggle
darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

// File Selection
selectImageBtn.addEventListener("click", () => {
  imageInput.click();
});

// Drag and Drop Functionality
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
  dropArea.classList.add("drag-over");
}

function unhighlight() {
  dropArea.classList.remove("drag-over");
}

dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    handleFiles(files[0]);
  }
}

// File Input Change
imageInput.addEventListener("change", (event) => {
  if (event.target.files.length > 0) {
    handleFiles(event.target.files[0]);
  }
});

function handleFiles(file) {
  // Check if the file is an image
  if (!file.type.match("image.*")) {
    showError("Please select a valid image file (JPG, PNG, WEBP).");
    return;
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showError("File size exceeds 10MB. Please select a smaller image.");
    return;
  }

  selectedFileName.textContent = file.name;
  colorizeBtn.disabled = false;

  // Preview the original image
  const reader = new FileReader();
  reader.onload = function (e) {
    originalImage.src = e.target.result;
    sliderOriginal.src = e.target.result;
  };
  reader.readAsDataURL(file);

  hideError();
}

// Colorize Button
colorizeBtn.addEventListener("click", () => {
  if (!imageInput.files[0] && !originalImage.src) {
    showError("Please select an image first.");
    return;
  }

  // Show processing section
  uploadSection.style.display = "none";
  processingSection.style.display = "block";

  // Create FormData and append the image
  const formData = new FormData();
  formData.append("image", imageInput.files[0]);

  // Call the colorization function
  colorizeImage(formData);
});

// Function to make API call to the Flask backend
function colorizeImage(formData) {
  fetch("/colorize", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Server error: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      processingSection.style.display = "none";

      if (data.success) {
        // Use the URLs returned from the Flask backend
        colorizedImage.src = data.colorizedImageUrl;
        sliderColorized.src = data.colorizedImageUrl;

        // Make sure the original image is displayed in case we need to refresh it
        originalImage.src = data.originalImageUrl;
        sliderOriginal.src = data.originalImageUrl;

        resultsSection.style.display = "block";
      } else {
        uploadSection.style.display = "flex";
        showError(data.error || "An error occurred during colorization");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      processingSection.style.display = "none";
      uploadSection.style.display = "flex";
      showError("Network error: Could not connect to the server");
    });
}

// Comparison View Toggle
sideBySideBtn.addEventListener("click", () => {
  sideBySideBtn.classList.add("active");
  sliderBtn.classList.remove("active");
  sideBySideView.style.display = "flex";
  sliderView.style.display = "none";
  comparisonContainer.className = "image-comparison side-by-side";
});

sliderBtn.addEventListener("click", () => {
  sliderBtn.classList.add("active");
  sideBySideBtn.classList.remove("active");
  sliderView.style.display = "block";
  sideBySideView.style.display = "none";
  comparisonContainer.className = "image-comparison slider";
});

// Slider Functionality
let isResizing = false;

sliderHandle.addEventListener("mousedown", (e) => {
  isResizing = true;
  e.preventDefault();
});

window.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const container = sliderHandle.parentElement;
  const rect = container.getBoundingClientRect();
  const position = (e.clientX - rect.left) / rect.width;

  // Constrain position between 0 and 1
  const constrainedPosition = Math.max(0, Math.min(1, position));

  // Update slider position
  sliderResize.style.width = `${constrainedPosition * 100}%`;
  sliderHandle.style.left = `${constrainedPosition * 100}%`;
});

window.addEventListener("mouseup", () => {
  isResizing = false;
});

// Touch support for slider
sliderHandle.addEventListener("touchstart", (e) => {
  isResizing = true;
  e.preventDefault();
});

window.addEventListener("touchmove", (e) => {
  if (!isResizing) return;

  const touch = e.touches[0];
  const container = sliderHandle.parentElement;
  const rect = container.getBoundingClientRect();
  const position = (touch.clientX - rect.left) / rect.width;

  // Constrain position between 0 and 1
  const constrainedPosition = Math.max(0, Math.min(1, position));

  // Update slider position
  sliderResize.style.width = `${constrainedPosition * 100}%`;
  sliderHandle.style.left = `${constrainedPosition * 100}%`;
});

window.addEventListener("touchend", () => {
  isResizing = false;
});

// Download Button
downloadBtn.addEventListener("click", () => {
  if (colorizedImage.src) {
    // Get the filename from the URL
    const urlParts = colorizedImage.src.split("/");
    const filename = urlParts[urlParts.length - 1];

    const link = document.createElement("a");
    link.href = colorizedImage.src;
    link.download = `colorized_${selectedFileName.textContent || filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});

// Try Another Button
tryAnotherBtn.addEventListener("click", () => {
  resetInterface();
});

// Helper Functions
function resetInterface() {
  uploadSection.style.display = "flex";
  processingSection.style.display = "none";
  resultsSection.style.display = "none";
  colorizeBtn.disabled = true;
  selectedFileName.textContent = "";
  imageInput.value = "";
  originalImage.src = "";
  colorizedImage.src = "";
  sliderOriginal.src = "";
  sliderColorized.src = "";
  hideError();

  // Reset slider position
  sliderResize.style.width = "50%";
  sliderHandle.style.left = "50%";
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

function hideError() {
  errorMessage.style.display = "none";
}

// Initialize the interface
resetInterface();
