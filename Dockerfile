# Use nginx alpine as base image
FROM nginx:1.27-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files to nginx html directory
COPY . /usr/share/nginx/html/

# Copy Bitnami server block configuration
COPY bitnami-server.conf /opt/bitnami/nginx/conf/server_blocks/portal.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]