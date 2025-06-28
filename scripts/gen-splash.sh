#!/usr/bin/env bash
mkdir -p splash
for res in 1179x2556 1290x2796 1668x2388; do
  convert icons/icon-512.png -resize ${res%%x*}x${res##*x} -background "#fafafa" -gravity center -extent ${res} splash/launch-${res}.png
done
