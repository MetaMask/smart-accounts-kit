#!/usr/bin/env bash

cd "$(dirname "$0")"

# Clear the abi/src directory
rm -rf ../src/*

# Build the delegator project

# NOTE: This isn't actually skipping building all test files (ex forge-std files are being built). Likely a bad import in the delegator project.
cd ../../../lib/delegatable-framework
forge build --force --skip test script ./lib/forge-std/ --out ../../abisTemp1 --names
forge build  --force --skip test --skip script --root="./lib" --remappings="@openzeppelin/contracts/=./openzeppelin-contracts/contracts/" --contracts="./account-abstraction/contracts/core/EntryPoint.sol" --out ../../../abisTemp2 --names
forge build  --force --skip test --skip script --root="./lib" --contracts="./openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol" --out ../../../abisTemp3 --names

cd ../..

# Synchronize files
cd packages/delegation-abis

rsync -r ../../abisTemp1/ src/artifacts/
rsync -r --ignore-existing ../../abisTemp2/ src/artifacts/
rsync -r --ignore-existing ../../abisTemp3/ src/artifacts/
rm -r ../../abisTemp1
rm -r ../../abisTemp2
rm -r ../../abisTemp3


# Generate the ts files
node ./scripts/format-abis.js