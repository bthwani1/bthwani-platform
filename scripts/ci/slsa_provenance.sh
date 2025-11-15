#!/bin/bash
# SLSA Provenance Generator (Stub)
# Generates provenance metadata for KWD container image

IMAGE_NAME=$1
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat <<EOF
{
  "version": 1,
  "predicateType": "https://slsa.dev/provenance/v1.0",
  "predicate": {
    "buildDefinition": {
      "buildType": "https://github.com/bthwani/bthwani-platform/actions/runs/build",
      "externalParameters": {
        "source": {
          "uri": "git+https://github.com/bthwani/bthwani-platform",
          "digest": {
            "sha1": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
          }
        },
        "dockerfile": "docker/KwdService.Dockerfile"
      },
      "internalParameters": {
        "env": {
          "NODE_ENV": "production",
          "SERVICE_NAME": "kwd"
        }
      }
    },
    "runDetails": {
      "builder": {
        "id": "https://github.com/bthwani/bthwani-platform"
      },
      "metadata": {
        "invocationId": "$TIMESTAMP",
        "startedOn": "$TIMESTAMP",
        "finishedOn": "$TIMESTAMP"
      }
    },
    "materials": [
      {
        "uri": "pkg:docker/${IMAGE_NAME}@latest",
        "digest": {
          "sha256": "$(docker inspect ${IMAGE_NAME}:latest 2>/dev/null | grep -i sha256 | head -1 | cut -d'"' -f4 || echo 'unknown')"
        }
      }
    ]
  }
}
EOF

