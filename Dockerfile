FROM nginx:alpine

# Copy static assets to nginx html directory
# This is for the production build. 
# In development (docker-compose), this is overridden by the volume mount.
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80
