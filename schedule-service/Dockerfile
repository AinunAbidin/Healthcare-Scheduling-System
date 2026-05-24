FROM node:20-slim

WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json tsconfig.build.json ./
RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start"]
