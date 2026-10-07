FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node assets ./assets
RUN npm run build
USER node
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node","server.mjs"]
