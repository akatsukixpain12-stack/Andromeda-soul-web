FROM node:20-bullseye

# node-pty needs build tools to compile its native module
RUN apt-get update && apt-get install -y python3 make g++ bash && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY index.js .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
