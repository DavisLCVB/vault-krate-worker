#!/bin/bash

# Cloud Run deployment script for vault-krate-worker

set -e

# Configuration
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
SERVICE_NAME="vault-krate-worker"
REGION=${REGION:-"us-central1"}
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying ${SERVICE_NAME} to Cloud Run..."

# Build and tag the image
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME} .

# Push to Google Container Registry
echo "⬆️  Pushing image to GCR..."
docker push ${IMAGE_NAME}

# Deploy to Cloud Run
echo "🌥️  Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300s \
  --concurrency 80 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --project ${PROJECT_ID}

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)' --project ${PROJECT_ID})

echo "✅ Deployment complete!"
echo "🔗 Service URL: ${SERVICE_URL}"
echo "🏥 Health check: ${SERVICE_URL}/health"
echo "🗑️  Delete endpoint: ${SERVICE_URL}/delete"

echo ""
echo "📝 Remember to set these environment variables in Cloud Run:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_KEY"
echo "   - BALANCER_URL"
echo ""
echo "💡 You can set them using:"
echo "gcloud run services update ${SERVICE_NAME} --region ${REGION} \\"
echo "  --set-env-vars 'SUPABASE_URL=your-url,SUPABASE_KEY=your-key,BALANCER_URL=your-balancer-url' \\"
echo "  --project ${PROJECT_ID}"