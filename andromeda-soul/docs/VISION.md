# Andromeda Vision - Generative Image Model

- **Architecture**: UNet Latent Diffusion Noise Estimator with Time Embeddings.
- **Pipeline**: Text prompt encoding -> Latent Denoising Loop -> Image Decoder.
- **API**: `POST /v1/images/generate` with seed, width, height, and sampling steps control.
