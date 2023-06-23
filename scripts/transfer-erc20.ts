import { chainsSupported } from '@/constants/chains';
import Accounts from './accounts-testing';
import { ERC20, Web3Connection } from '@taikai/dappkit';

async function main() {
  const TOKEN_ADRESS = '0x37ebdd9B2adC5f8af3993256859c1Ea3BFE1465e';
  const TOKEN_AMOUNT = 1000000;
  const [owner, otherOwner] = Accounts;
  const web3con = new Web3Connection({
    debug: false,
    web3Host: chainsSupported.local.rpcUrl,
    privateKey: owner.privKey,
  });

  const erc20Deployer = new ERC20(web3con, TOKEN_ADRESS);
  await erc20Deployer.transfer(otherOwner.address, TOKEN_AMOUNT);
  console.log(`Transfering from ${owner.address} ${otherOwner.address} ${TOKEN_AMOUNT}`);
}

main()
  .then(() => {
    console.log('😎 Deploy Done 🎉');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
