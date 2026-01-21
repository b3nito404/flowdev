
export const nodeDockerfile = (version, port, command) => `
# Stage 1: Build
FROM node:${version}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production
FROM node:${version}-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE ${port}
# Formats the command string into a JSON array for CMD
CMD ["${command.split(' ').join('", "')}"]
`.trim();


export const pythonDockerfile = (version, port, startFile) => `
FROM python:${version}-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${port}
CMD ["python", "${startFile}"]
`.trim();

export const dockerCompose = (projectName, port) => `
version: '3.8'
services:
  ${projectName}:
    build: .
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
    restart: always
`.trim();