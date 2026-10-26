FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg=7:5.1.9-0+deb12u1 \
    espeak-ng=1.51+dfsg-10+deb12u2 \
    fonts-roboto=2:0~20170802-3 \
    fonts-noto-core=20201225-1 \
    fonts-dejavu-core=2.37-6 \
    curl=7.88.1-10+deb12u15 \
    ca-certificates=20250419~deb12u2 \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir numpy==2.1.3 soundfile==0.12.1 kokoro-onnx==0.4.9
RUN mkdir -p /models && cd /models && \
    curl -sSfL -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && \
    curl -sSfL -o voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin && \
    printf '%s\n' \
    '7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5  kokoro-v1.0.onnx' \
    'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d  voices-v1.0.bin' \
    > SHA256SUMS && sha256sum -c SHA256SUMS
WORKDIR /w
