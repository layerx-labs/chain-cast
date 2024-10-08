import { chainsSupported } from '@/constants/chains';
import Accounts from './accounts-testing';
import { ERC20, Web3Connection } from '@taikai/dappkit';

async function main() {
  const TOKEN_NAME = 'Trolha Token';
  const TOKEN_SYMBOL = 'TROLHA';
  const TOKEN_SUPPLY = 1000000;
  const [owner] = Accounts;
  const web3con = new Web3Connection({
    debug: false,
    web3Host: chainsSupported.local.rpcUrl,
    privateKey: owner.privKey,
  });

  const erc20Deployer = new ERC20(web3con);
  const tx = await erc20Deployer.deployJsonAbi(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_SUPPLY.toString().concat('000000000000000000'),
    owner.address
  );
  console.log(`Deploying ${TOKEN_NAME} to ${tx.contractAddress}`);
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
