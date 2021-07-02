#!/bin/bash

cd "$(dirname "$0")"
cd ..

wget http://launchpadlibrarian.net/531361873/libc6_2.33-0ubuntu5_amd64.deb
sudo dpkg --auto-deconfigure -i libc6_2.33-0ubuntu5_amd64.deb || true
