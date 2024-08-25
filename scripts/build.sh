#!/usr/bin/env bash

GITHUB_REF_NAME=$1
GITHUB_REPO=$2

if [ -z "${GITHUB_REF_NAME}"]; then
    echo "Github ref name not present."
    exit 1
fi

if [ -z "${GITHUB_REPO}"]; then
    echo "Github repo name not present."
    exit 1
fi

BROWSERS=("chrome" "firefox")

for browser in "${BROWSERS[@]}"; do
    echo "Building ${browser}..."
    MANIFEST="${browser}-manifest.json"
    cp "manifests/${MANIFEST}" manifest.json
    VERSION="v$(jq -r '.version' <manifest.json)"
    if [[ "${VERSION}" != "${GITHUB_REF_NAME}" ]]; then
        echo "Manifest version!=tag mismatch: ${VERSION} != ${GITHUB_REF_NAME}"
        exit 1
    fi
    PKG="${browser}-$(basename ${GITHUB_REPO})-${GITHUB_REF_NAME}.zip"
    zip -r "${PKG}" *.json src/*
done

gh release create ${GITHUB_REF_NAME} ./*.zip --generate-notes
