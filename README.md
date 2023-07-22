# Testing `sqlite-vss`

Just setting up this repo to troubleshoot a bug I am getting when running sqlite-vss on Ubuntu with WSL.

To reproduce:
- clone this repo
- `npm install`
- might need to run these commands (from [install instructions](https://github.com/asg017/sqlite-vss#installing)):
```bash
sudo apt-get update
sudo apt-get install -y libgomp1 libatlas-base-dev liblapack-dev
```
- run `node index.js`