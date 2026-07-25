# GitHub Pages 404 Troubleshooting

## Current Finding

The repository contains a valid Pages workflow. The stable public URL is now responding with HTTP 200:

`https://lupisflora-n.github.io/WACWA-CUP/`

This URL is independent of the phone's Wi-Fi or tethering network and should be saved to the phone home screen.

## If the URL ever returns 404

Open repository `Settings > Pages`, set `Build and deployment > Source` to `GitHub Actions`, and save. Then rerun the latest `Deploy preview` workflow if GitHub has not started it automatically.

## Private Repository Note

The repository is private. Depending on the GitHub account plan, public Pages for a private repository may not be available. Do not change the repository visibility without explicit approval. If Pages is unavailable, the stable public preview requires either an eligible GitHub plan or an approved public mirror/deployment target.

## Temporary Same-Network Preview

The development server is available on the current PC network at `http://10.205.91.133:5173/`. A smartphone on the same Wi-Fi can use this temporarily. The address is tied to the current network and is not the final permanent URL.
